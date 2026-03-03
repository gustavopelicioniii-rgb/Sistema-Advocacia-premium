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

interface EscavadorProcesso {
    numero_processo: string;
    ultima_movimentacao: string;
    data_ultima_movimentacao: string;
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

                // Extrair OAB do tribunal (formato típico: "SP" ou similar)
                // Nota: Isso depende de como o tribunal é armazenado
                // Aqui estou assumindo um padrão, você pode ajustar
                const oabEstado = processo.tribunal.substring(0, 2); // Pega os 2 primeiros chars

                // Chamar API Escavador para verificar atualizações
                const escavadorUrl = `https://api.escavador.com/api/v2/advogado/processos?oab_estado=${encodeURIComponent(oabEstado)}&oab_numero=`;

                const escavadorResponse = await fetch(escavadorUrl, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${escavadorToken}`,
                        "Content-Type": "application/json",
                    },
                });

                if (!escavadorResponse.ok) {
                    console.error(`Erro ao buscar processo ${processo.numero_processo}: ${escavadorResponse.status}`);
                    processosComErro.push({
                        numero_processo: processo.numero_processo,
                        erro: `HTTP ${escavadorResponse.status}`,
                    });
                    continue;
                }

                const escavadorData = await escavadorResponse.json();

                // Procurar o processo específico na resposta
                const processoAtualizado = escavadorData.processos?.find(
                    (p: EscavadorProcesso) => p.numero_processo === processo.numero_processo,
                );

                if (!processoAtualizado) {
                    console.log(`Processo ${processo.numero_processo} não encontrado na API`);
                    continue;
                }

                // Comparar movimentação
                if (
                    processoAtualizado.ultima_movimentacao !== processo.ultima_movimentacao ||
                    processoAtualizado.data_ultima_movimentacao !== processo.ultima_movimentacao_data
                ) {
                    // Houve atualização! Salvar no banco
                    const { error: updateError } = await supabase
                        .from("processos")
                        .update({
                            ultima_movimentacao: processoAtualizado.ultima_movimentacao,
                            ultima_movimentacao_data: processoAtualizado.data_ultima_movimentacao,
                            last_checked_at: new Date().toISOString(),
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
                            nova_movimentacao: processoAtualizado.ultima_movimentacao,
                        });

                        // TODO: Enviar notificação ao usuário aqui
                        // Exemplo: enviar email, push notification, etc
                        console.log(`✓ Processo ${processo.numero_processo} atualizado com sucesso`);
                    }
                } else {
                    // Apenas atualizar last_checked_at
                    await supabase
                        .from("processos")
                        .update({
                            last_checked_at: new Date().toISOString(),
                        })
                        .eq("id", processo.id);

                    console.log(`Processo ${processo.numero_processo} verificado (sem mudanças)`);
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
