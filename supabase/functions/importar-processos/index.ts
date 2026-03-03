/**
 * Edge Function: importar-processos
 * Importa processos do Escavador por OAB e solicita atualização com callback.
 *
 * Fluxo V2 (event-driven):
 * 1. Busca processos por OAB na API Escavador
 * 2. Upsert no banco (processos)
 * 3. Para cada processo, solicita atualização com enviar_callback=1
 * 4. Salva escavador_update_id + status_atualizacao = 'PENDING'
 * 5. NÃO consulta movimentações — o callback cuidará disso
 *
 * Env: ESCAVADOR_TOKEN, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ESCAVADOR_BASE = "https://api.escavador.com/api/v2";

interface ProcessoData {
    oab_estado: string;
    oab_numero: string;
    user_id?: string;
}

interface EscavadorProcesso {
    numero_processo: string;
    tribunal: string;
    ultima_movimentacao: string;
    data_ultima_movimentacao: string;
}

interface EscavadorResponse {
    processos?: EscavadorProcesso[];
    error?: string;
}

interface SolicitarAtualizacaoResponse {
    id: number;
    status: string;
    numero_cnj: string;
    criado_em: string;
}

function normalizeNum(num: string): string {
    const c = num.replace(/\D/g, "");
    if (c.length < 20) return num.trim();
    return `${c.slice(0, 7)}-${c.slice(7, 9)}.${c.slice(9, 13)}.${c.slice(13, 14)}.${c.slice(14, 16)}.${c.slice(16, 20)}`;
}

function logStructured(
    level: "info" | "warn" | "error",
    message: string,
    meta?: Record<string, unknown>,
) {
    const payload = { ts: new Date().toISOString(), level, fn: "importar-processos", message, ...meta };
    if (level === "error") console.error(JSON.stringify(payload));
    else console.log(JSON.stringify(payload));
}

async function solicitarAtualizacao(
    numeroCnj: string,
    escavadorToken: string,
): Promise<{ data: SolicitarAtualizacaoResponse | null; error: string | null }> {
    const numero = normalizeNum(numeroCnj);
    const url = `${ESCAVADOR_BASE}/processos/numero_cnj/${encodeURIComponent(numero)}/solicitar-atualizacao`;

    try {
        const res = await fetch(url, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${escavadorToken}`,
                "Content-Type": "application/json",
                "X-Requested-With": "XMLHttpRequest",
            },
            body: JSON.stringify({ enviar_callback: 1 }),
        });

        const body = await res.json().catch(() => ({}));

        if (!res.ok) {
            return {
                data: null,
                error: (body as { error?: string }).error || `HTTP ${res.status}`,
            };
        }

        return { data: body as SolicitarAtualizacaoResponse, error: null };
    } catch (err) {
        return {
            data: null,
            error: err instanceof Error ? err.message : String(err),
        };
    }
}

const json = (body: unknown, status: number) =>
    new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json" },
    });

Deno.serve(async (req) => {
    if (req.method !== "POST") {
        return json({ error: "Method not allowed. Use POST." }, 405);
    }

    const escavadorToken = Deno.env.get("ESCAVADOR_TOKEN");
    if (!escavadorToken) {
        logStructured("error", "ESCAVADOR_TOKEN não configurado");
        return json({ error: "Token Escavador não configurado no servidor" }, 500);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceKey) {
        logStructured("error", "Supabase credentials not configured");
        return json({ error: "Supabase não configurado" }, 500);
    }

    let body: ProcessoData;
    try {
        body = (await req.json()) as ProcessoData;
    } catch {
        return json({ error: "Invalid JSON body" }, 400);
    }

    if (!body.oab_estado || !body.oab_numero) {
        return json({ error: "Missing required fields: oab_estado, oab_numero" }, 400);
    }

    // 1. Buscar processos por OAB na API Escavador
    const escavadorUrl = `${ESCAVADOR_BASE}/advogado/processos?oab_estado=${encodeURIComponent(body.oab_estado)}&oab_numero=${encodeURIComponent(body.oab_numero)}`;

    let escavadorData: EscavadorResponse;
    try {
        const escavadorResponse = await fetch(escavadorUrl, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${escavadorToken}`,
                "Content-Type": "application/json",
            },
        });

        if (!escavadorResponse.ok) {
            const errorText = await escavadorResponse.text();
            logStructured("error", "Escavador API error", { status: escavadorResponse.status, details: errorText });
            return json({ error: `Escavador API error: ${escavadorResponse.status}`, details: errorText }, escavadorResponse.status);
        }

        escavadorData = (await escavadorResponse.json()) as EscavadorResponse;
    } catch (err) {
        logStructured("error", "Fetch error", { error: err instanceof Error ? err.message : String(err) });
        return json({ error: "Erro ao conectar com API Escavador" }, 502);
    }

    if (!escavadorData.processos || escavadorData.processos.length === 0) {
        return json({ success: true, message: "Nenhum processo encontrado para este OAB", processos_importados: 0 }, 200);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 2. Upsert processos no banco
    const processosParaInserir = escavadorData.processos.map((processo) => ({
        numero_processo: processo.numero_processo,
        tribunal: processo.tribunal,
        ultima_movimentacao: processo.ultima_movimentacao,
        ultima_movimentacao_data: processo.data_ultima_movimentacao,
        last_checked_at: new Date().toISOString(),
        ativo: true,
        user_id: body.user_id || null,
    }));

    const { error: insertError } = await supabase
        .from("processos")
        .upsert(processosParaInserir, { onConflict: "numero_processo" });

    if (insertError) {
        logStructured("error", "Database insert error", { error: insertError.message });
        return json({ error: "Erro ao salvar processos no banco de dados", details: insertError.message }, 500);
    }

    // 3. Para cada processo, solicitar atualização com callback
    let callbacksSolicitados = 0;
    const callbackErrors: { numero: string; error: string }[] = [];

    for (const processo of escavadorData.processos) {
        const { data: updateData, error: updateError } = await solicitarAtualizacao(
            processo.numero_processo,
            escavadorToken,
        );

        if (updateError) {
            logStructured("warn", "Erro ao solicitar atualização", {
                numero: processo.numero_processo,
                error: updateError,
            });
            callbackErrors.push({ numero: processo.numero_processo, error: updateError });
            continue;
        }

        if (updateData) {
            // 4. Salvar escavador_update_id e marcar status como PENDING
            const { error: patchError } = await supabase
                .from("processos")
                .update({
                    escavador_update_id: updateData.id,
                    status_atualizacao: "PENDING",
                    monitoramento_ativo: true,
                    ultima_verificacao: new Date().toISOString(),
                })
                .eq("numero_processo", processo.numero_processo);

            if (patchError) {
                logStructured("warn", "Erro ao atualizar status do processo", {
                    numero: processo.numero_processo,
                    error: patchError.message,
                });
            } else {
                callbacksSolicitados++;
            }
        }
    }

    logStructured("info", "Importação concluída", {
        total: escavadorData.processos.length,
        callbacks_solicitados: callbacksSolicitados,
        callback_errors: callbackErrors.length,
    });

    return json({
        success: true,
        message: `${escavadorData.processos.length} processo(s) importado(s), ${callbacksSolicitados} atualização(ões) solicitada(s) com callback`,
        processos_importados: escavadorData.processos.length,
        callbacks_solicitados: callbacksSolicitados,
        callback_errors: callbackErrors.length > 0 ? callbackErrors : undefined,
    }, 200);
});
