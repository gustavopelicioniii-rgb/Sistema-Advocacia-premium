/**
 * Edge Function: migrar-monitoramento-callback
 * Script batch ONE-TIME para migrar processos existentes para o sistema de callback.
 *
 * Fluxo:
 * 1. Busca todos os processos com status_atualizacao = 'NONE' ou NULL
 * 2. Para cada processo, chama solicitar-atualizacao com enviar_callback=1
 * 3. Salva escavador_update_id e status_atualizacao = 'PENDING'
 * 4. Rate limit: 1 chamada/segundo para não sobrecarregar a API
 * 5. Log de progresso em process_monitor_logs
 * 6. Retorna relatório: quantos migrados, quantos com erro
 *
 * Execução: Via cURL manual após deploy do callback receiver.
 *   curl -X POST https://<ref>.supabase.co/functions/v1/migrar-monitoramento-callback \
 *     -H "Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>"
 *
 * Env: ESCAVADOR_API_TOKEN (ou ESCAVADOR_TOKEN), SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ESCAVADOR_BASE = "https://api.escavador.com/api/v2";

function logStructured(
    level: "info" | "warn" | "error",
    message: string,
    meta?: Record<string, unknown>,
) {
    const payload = { ts: new Date().toISOString(), level, fn: "migrar-monitoramento-callback", message, ...meta };
    if (level === "error") console.error(JSON.stringify(payload));
    else console.log(JSON.stringify(payload));
}

function normalizeNum(num: string): string {
    const c = num.replace(/\D/g, "");
    if (c.length < 20) return num.trim();
    return `${c.slice(0, 7)}-${c.slice(7, 9)}.${c.slice(9, 13)}.${c.slice(13, 14)}.${c.slice(14, 16)}.${c.slice(16, 20)}`;
}

async function solicitarAtualizacao(
    numeroCnj: string,
    token: string,
): Promise<{ updateId: number | null; error: string | null }> {
    const numero = normalizeNum(numeroCnj);
    const url = `${ESCAVADOR_BASE}/processos/numero_cnj/${encodeURIComponent(numero)}/solicitar-atualizacao`;

    try {
        const res = await fetch(url, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
                "X-Requested-With": "XMLHttpRequest",
            },
            body: JSON.stringify({ enviar_callback: 1 }),
        });

        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
            return { updateId: null, error: (body as { error?: string }).error || `HTTP ${res.status}` };
        }
        return { updateId: (body as { id: number }).id, error: null };
    } catch (err) {
        return { updateId: null, error: err instanceof Error ? err.message : String(err) };
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

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const escavadorToken = Deno.env.get("ESCAVADOR_API_TOKEN") || Deno.env.get("ESCAVADOR_TOKEN");

    if (!supabaseUrl || !serviceRoleKey) {
        logStructured("error", "Supabase env vars não configurados");
        return json({ error: "Supabase não configurado" }, 500);
    }

    if (!escavadorToken) {
        logStructured("error", "ESCAVADOR_API_TOKEN não configurado");
        return json({ error: "Token Escavador não configurado" }, 500);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const runId = crypto.randomUUID();
    const now = new Date().toISOString();

    logStructured("info", "Migração batch iniciada", { run_id: runId });

    // Buscar processos que ainda não têm callback configurado
    // Usa 'number' (campo principal) e fallback para numero_processo
    const { data: processos, error: fetchError } = await supabase
        .from("processos")
        .select("id, number, owner_id, status_atualizacao")
        .or("status_atualizacao.is.null,status_atualizacao.eq.NONE")
        .not("number", "is", null);

    if (fetchError) {
        logStructured("error", "Erro ao buscar processos", { error: fetchError.message });
        return json({ error: "Erro ao buscar processos", details: fetchError.message }, 500);
    }

    if (!processos || processos.length === 0) {
        logStructured("info", "Nenhum processo para migrar", { run_id: runId });
        return json({ ok: true, message: "Nenhum processo para migrar", migrated: 0, errors: 0 }, 200);
    }

    logStructured("info", `${processos.length} processos para migrar`, { run_id: runId, total: processos.length });

    let migrated = 0;
    let errored = 0;
    const errorDetails: { number: string; error: string }[] = [];

    for (let i = 0; i < processos.length; i++) {
        const proc = processos[i];

        // Log de progresso a cada 10 processos
        if (i > 0 && i % 10 === 0) {
            logStructured("info", `Progresso: ${i}/${processos.length}`, {
                run_id: runId,
                migrated,
                errored,
            });
        }

        const { updateId, error } = await solicitarAtualizacao(proc.number, escavadorToken);

        if (error) {
            logStructured("warn", "Erro ao solicitar atualização", {
                run_id: runId,
                process_id: proc.id,
                number: proc.number,
                error,
            });
            errored++;
            errorDetails.push({ number: proc.number, error });

            await supabase.from("process_monitor_logs").insert({
                process_id: proc.id,
                process_number: proc.number,
                log_type: "erro_api",
                message: `Migração batch: erro — ${error}`,
                details: { source: "migration-batch", run_id: runId, error },
                owner_id: proc.owner_id,
            });
        } else {
            await supabase.from("processos").update({
                escavador_update_id: updateId,
                status_atualizacao: "PENDING",
                monitoramento_ativo: true,
                ultima_verificacao: now,
                updated_at: now,
            }).eq("id", proc.id);

            await supabase.from("process_monitor_logs").insert({
                process_id: proc.id,
                process_number: proc.number,
                log_type: "consulta_realizada",
                message: "Migração batch: atualização solicitada com callback",
                details: { source: "migration-batch", run_id: runId, update_id: updateId },
                owner_id: proc.owner_id,
            });

            migrated++;
        }

        // Rate limit: 1 chamada/segundo
        await new Promise((r) => setTimeout(r, 1000));
    }

    logStructured("info", "Migração batch concluída", {
        run_id: runId,
        total: processos.length,
        migrated,
        errored,
    });

    return json({
        ok: true,
        run_id: runId,
        total: processos.length,
        migrated,
        errored,
        error_details: errorDetails.length > 0 ? errorDetails : undefined,
    }, 200);
});
