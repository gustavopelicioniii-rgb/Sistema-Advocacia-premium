/**
 * @deprecated LEGACY — Substituído pela arquitetura event-driven (escavador-callback).
 * Esta função NÃO deve mais ser deployada nem agendada.
 * Mantida apenas como referência histórica.
 * Use: escavador-callback (webhook receiver) + process-monitor-cron (health-check semanal)
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.97.0";

interface Processo {
    id: string;
    numero_processo: string;
    tribunal: string;
    ultima_movimentacao: string;
    ultima_movimentacao_data: string;
    last_checked_at: string;
    user_id: string | null;
    ativo: boolean;
}

interface EscavadorMovimentacao {
    id?: string;
    descricao: string;
    data?: string;
    tipo?: string;
}

interface EscavadorResponse {
    movimentacoes?: EscavadorMovimentacao[];
    data?: EscavadorMovimentacao[];
    erro?: string;
}

// Verifica se last_checked_at é maior que 24 horas atrás
function isOlderThan24Hours(lastChecked: string): boolean {
    const lastCheckedDate = new Date(lastChecked);
    const now = new Date();
    const diffInHours = (now.getTime() - lastCheckedDate.getTime()) / (1000 * 60 * 60);
    return diffInHours > 24;
}

serve(async (req) => {
    try {
        // Verificar authorization (usar X-Supabase-Event-Verification para scheduler)
        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            // Se for do scheduler, pode não ter auth header
            console.log("Verificar-movimentacoes chamado via scheduler");
        }

        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        const escavadorToken = Deno.env.get("ESCAVADOR_TOKEN");

        if (!supabaseUrl || !supabaseServiceKey || !escavadorToken) {
            throw new Error("Credenciais Supabase ou Escavador não configuradas");
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Buscar todos os processos ativos
        const { data: processos, error: fetchError } = await supabase.from("processos").select("*").eq("ativo", true);

        if (fetchError) {
            console.error("Erro ao buscar processos:", fetchError);
            return new Response(
                JSON.stringify({
                    error: "Erro ao buscar processos do banco",
                    details: fetchError.message,
                }),
                {
                    status: 500,
                    headers: { "Content-Type": "application/json" },
                },
            );
        }

        if (!processos || processos.length === 0) {
            return new Response(
                JSON.stringify({
                    success: true,
                    message: "Nenhum processo ativo para verificar",
                    processos_verificados: 0,
                    atualizacoes: 0,
                }),
                {
                    status: 200,
                    headers: { "Content-Type": "application/json" },
                },
            );
        }

        let atualizacoes = 0;
        const processosComErro = [];
        const processosAtualizados = [];

        // Verificar cada processo
        for (const processo of processos as Processo[]) {
            try {
                // Verificar se precisa atualizar (mais de 24h desde last_checked_at)
                if (!isOlderThan24Hours(processo.last_checked_at)) {
                    console.log(`Processo ${processo.numero_processo} verificado recentemente, pulando...`);
                    continue;
                }

                // Chamar API Escavador usando número CNJ para obter movimentações
                // Endpoint: GET /api/v2/processos/numero_cnj/{numero}/movimentacoes
                const escavadorUrl = `https://api.escavador.com/api/v2/processos/numero_cnj/${encodeURIComponent(processo.numero_processo)}/movimentacoes`;

                console.log(`Chamando API Escavador: ${escavadorUrl}`);

                const escavadorResponse = await fetch(escavadorUrl, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${escavadorToken}`,
                        "Content-Type": "application/json",
                        "X-Requested-With": "XMLHttpRequest",
                    },
                });

                if (!escavadorResponse.ok) {
                    const errorBody = await escavadorResponse.text();
                    console.error(`Erro ao buscar processo ${processo.numero_processo}: ${escavadorResponse.status} - ${errorBody}`);
                    processosComErro.push({
                        numero_processo: processo.numero_processo,
                        erro: `HTTP ${escavadorResponse.status}`,
                        detalhes: errorBody,
                    });
                    continue;
                }

                const escavadorData = await escavadorResponse.json();

                // Parse movimentações do endpoint /processos/numero_cnj/{numero}/movimentacoes
                // Resposta esperada: array de movimentações ou objeto com movimentações
                const movimentacoes = escavadorData.movimentacoes || escavadorData.data || [];

                if (!Array.isArray(movimentacoes) || movimentacoes.length === 0) {
                    console.log(`Nenhuma movimentação encontrada para ${processo.numero_processo}`);
                    // Atualizar apenas last_checked_at
                    await supabase
                        .from("processos")
                        .update({
                            last_checked_at: new Date().toISOString(),
                        })
                        .eq("id", processo.id);
                    continue;
                }

                // Pegar a movimentação mais recente (primeira do array)
                const ultimaMovimentacao = movimentacoes[0];

                if (!ultimaMovimentacao || !ultimaMovimentacao.descricao) {
                    console.log(`Movimentação sem descrição para ${processo.numero_processo}`);
                    continue;
                }

                // Comparar movimentação (verificar se há mudança)
                const novaMovimentacao = ultimaMovimentacao.descricao;
                const novaDataMovimentacao = ultimaMovimentacao.data || new Date().toISOString();

                if (
                    novaMovimentacao !== processo.ultima_movimentacao ||
                    novaDataMovimentacao !== processo.ultima_movimentacao_data
                ) {
                    // Houve atualização! Salvar no banco
                    // Atualiza campos Escavador + campo last_movement do frontend
                    const { error: updateError } = await supabase
                        .from("processos")
                        .update({
                            ultima_movimentacao: novaMovimentacao,
                            ultima_movimentacao_data: novaDataMovimentacao,
                            last_checked_at: new Date().toISOString(),
                            last_movement: novaMovimentacao,
                        })
                        .eq("id", processo.id);

                    if (updateError) {
                        console.error(`Erro ao atualizar processo ${processo.numero_processo}:`, updateError);
                        processosComErro.push({
                            numero_processo: processo.numero_processo,
                            erro: updateError.message,
                        });
                    } else {
                        atualizacoes++;
                        processosAtualizados.push({
                            numero_processo: processo.numero_processo,
                            nova_movimentacao: novaMovimentacao,
                        });

                        // TODO: Enviar notificação ao usuário aqui
                        // Exemplo: enviar email, push notification, etc
                        console.log(`✓ Processo ${processo.numero_processo} atualizado com sucesso`);
                    }
                } else {
                    // Apenas atualizar last_checked_at
                    const { error: checkError } = await supabase
                        .from("processos")
                        .update({
                            last_checked_at: new Date().toISOString(),
                        })
                        .eq("id", processo.id);

                    if (!checkError) {
                        console.log(`Processo ${processo.numero_processo} verificado (sem mudanças)`);
                    }
                }
            } catch (error) {
                console.error(`Erro ao processar ${processo.numero_processo}:`, error);
                processosComErro.push({
                    numero_processo: processo.numero_processo,
                    erro: error instanceof Error ? error.message : String(error),
                });
            }
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: `Verificação concluída: ${atualizacoes} atualização(ões)`,
                processos_verificados: processos.length,
                atualizacoes: atualizacoes,
                processos_atualizados: processosAtualizados,
                erros: processosComErro.length > 0 ? processosComErro : undefined,
            }),
            {
                status: 200,
                headers: { "Content-Type": "application/json" },
            },
        );
    } catch (error) {
        console.error("Erro fatal na função verificar-movimentacoes:", error);
        return new Response(
            JSON.stringify({
                error: "Erro fatal na verificação de movimentações",
                details: error instanceof Error ? error.message : String(error),
            }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            },
        );
    }
});
