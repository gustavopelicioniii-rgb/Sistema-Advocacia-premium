/**
 * Health-check semanal: verifica processos com status inconsistente.
 *
 * MIGRADO de polling diário (V1) para health-check semanal (V2 event-driven).
 * - NÃO consulta movimentações na API Escavador
 * - Apenas verifica processos com status_atualizacao = 'PENDING' há mais de 48h
 * - Re-solicita atualização com enviar_callback=1 para esses processos
 *
 * Agendar: cron "0 6 * * 0" (domingos 6h) ou chamar via POST.
 * Env: ESCAVADOR_API_TOKEN, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * Env opcional: CRON_SECRET
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ESCAVADOR_BASE = "https://api.escavador.com/api/v2";
const PENDING_TIMEOUT_HOURS = 48;

function logStructured(
    level: "info" | "warn" | "error",
    message: string,
    meta?: Record<string, unknown>,
) {
    const payload = { ts: new Date().toISOString(), level, fn: "process-monitor-cron", message, ...meta };
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
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const escavadorToken = Deno.env.get("ESCAVADOR_API_TOKEN");

    if (!supabaseUrl || !serviceRoleKey) {
        logStructured("error", "SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configurados");
        return json({ error: "Variáveis de ambiente Supabase não configuradas" }, 500);
    }

    if (!escavadorToken) {
        logStructured("error", "ESCAVADOR_API_TOKEN não configurado");
        return json({ error: "ESCAVADOR_API_TOKEN não configurado" }, 500);
    }

    // Verificação opcional de CRON_SECRET
    const cronSecret = Deno.env.get("CRON_SECRET");
    if (cronSecret) {
        const authHeader = req.headers.get("Authorization") ?? "";
        const providedSecret = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
        if (providedSecret !== cronSecret) {
            logStructured("warn", "Requisição não autorizada ao cron");
            return json({ error: "Não autorizado" }, 401);
        }
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const runId = crypto.randomUUID();
    const now = new Date().toISOString();
    const cutoffTime = new Date(Date.now() - PENDING_TIMEOUT_HOURS * 60 * 60 * 1000).toISOString();

    logStructured("info", "Health-check semanal iniciado", { run_id: runId });

    // 1. Buscar processos com status_atualizacao = 'PENDING' há mais de 48h
    const { data: pendingProcessos } = await supabase
        .from("processos")
        .select("id, number, owner_id, status_atualizacao, ultima_verificacao")
        .eq("status_atualizacao", "PENDING")
        .lt("ultima_verificacao", cutoffTime)
        .not("number", "is", null);

    // 2. Buscar processos com status_atualizacao = 'ERROR' (re-tentar)
    const { data: errorProcessos } = await supabase
        .from("processos")
        .select("id, number, owner_id, status_atualizacao, ultima_verificacao")
        .eq("status_atualizacao", "ERROR")
        .not("number", "is", null);

    // 3. Buscar processos com monitoramento_ativo=true mas status_atualizacao='NONE'
    // (processos que deveriam estar sendo monitorados mas nunca receberam callback)
    const { data: noneProcessos } = await supabase
        .from("processos")
        .select("id, number, owner_id, status_atualizacao, ultima_verificacao")
        .eq("monitoramento_ativo", true)
        .eq("status_atualizacao", "NONE")
        .not("number", "is", null);

    const toResolve = [
        ...(pendingProcessos ?? []),
        ...(errorProcessos ?? []),
        ...(noneProcessos ?? []),
    ];

    logStructured("info", "Processos para re-solicitar atualização", {
        run_id: runId,
        pending_timeout: pendingProcessos?.length ?? 0,
        errors: errorProcessos?.length ?? 0,
        none_with_monitoring: noneProcessos?.length ?? 0,
        total: toResolve.length,
    });

    if (toResolve.length === 0) {
        logStructured("info", "Nenhum processo precisa de re-solicitação", { run_id: runId });
        return json({ ok: true, message: "Nenhum processo com status inconsistente", resolved: 0 }, 200);
    }

    let resolved = 0;
    const errors: { number: string; error: string }[] = [];

    for (const proc of toResolve) {
        const { updateId, error } = await solicitarAtualizacao(proc.number, escavadorToken);

        if (error) {
            logStructured("warn", "Erro ao re-solicitar atualização", {
                run_id: runId,
                process_id: proc.id,
                number: proc.number,
                error,
            });
            errors.push({ number: proc.number, error });

            await supabase.from("process_monitor_logs").insert({
                process_id: proc.id,
                process_number: proc.number,
                log_type: "erro_api",
                message: `Health-check: erro ao re-solicitar — ${error}`,
                details: { source: "health-check", run_id: runId, error },
                owner_id: proc.owner_id,
            });
            continue;
        }

        // Atualizar status
        await supabase.from("processos").update({
            escavador_update_id: updateId,
            status_atualizacao: "PENDING",
            ultima_verificacao: now,
            updated_at: now,
        }).eq("id", proc.id);

        await supabase.from("process_monitor_logs").insert({
            process_id: proc.id,
            process_number: proc.number,
            log_type: "consulta_realizada",
            message: "Health-check: atualização re-solicitada com callback",
            details: { source: "health-check", run_id: runId, update_id: updateId },
            owner_id: proc.owner_id,
        });

        resolved++;

        // Rate limit: 1 req/segundo para não sobrecarregar API
        await new Promise((r) => setTimeout(r, 1000));
    }

    logStructured("info", "Health-check semanal concluído", {
        run_id: runId,
        total: toResolve.length,
        resolved,
        errors_count: errors.length,
    });

    return json({
        ok: true,
        run_id: runId,
        total_checked: toResolve.length,
        resolved,
        errors: errors.length > 0 ? errors : undefined,
    }, 200);
});
