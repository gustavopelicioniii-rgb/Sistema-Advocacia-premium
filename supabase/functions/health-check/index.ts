/**
 * health-check — Endpoint de saúde da aplicação.
 *
 * GET /health-check
 *
 * Verifica conectividade com o banco de dados e retorna status JSON.
 * Pode ser usado por UptimeRobot, Pingdom ou qualquer monitor externo.
 *
 * Respostas:
 *   200 { status: "ok",       db: "ok",    ts: "..." }
 *   503 { status: "degraded", db: "error", error: "...", ts: "..." }
 *
 * Env vars (injetadas automaticamente pelo Supabase):
 *   SUPABASE_URL              — URL do projeto
 *   SUPABASE_SERVICE_ROLE_KEY — chave de serviço (bypassa RLS)
 *
 * Env vars opcionais:
 *   SENTRY_DSN — DSN do Sentry para capturar erros da Edge Function
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, content-type, x-correlation-id",
};

function logStructured(level: "info" | "warn" | "error", message: string, meta?: Record<string, unknown>) {
    const entry = {
        ts: new Date().toISOString(),
        level,
        message,
        fn: "health-check",
        ...meta,
    };
    if (level === "error") console.error(JSON.stringify(entry));
    else console.log(JSON.stringify(entry));
}

Deno.serve(async (req: Request) => {
    // Preflight CORS
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: CORS_HEADERS });
    }

    const ts = new Date().toISOString();
    const correlationId = req.headers.get("x-correlation-id") ?? crypto.randomUUID();

    logStructured("info", "Health check request received", { correlationId });

    try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
        // Usa apenas SERVICE_ROLE_KEY para o health-check bypass RLS corretamente.
        // Nunca fazer fallback para ANON_KEY: resultados inconsistentes por RLS.
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

        if (!supabaseUrl || !supabaseKey) {
            logStructured("error", "Missing Supabase env vars", { correlationId });
            return new Response(JSON.stringify({ status: "error", db: "error", error: "Missing env vars", ts }), {
                status: 503,
                headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
            });
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        // Lightweight DB connectivity check — PGRST116 significa "0 linhas" (tabela existe)
        const { error } = await supabase.from("profiles").select("id").limit(1).maybeSingle();

        if (error && error.code !== "PGRST116") {
            logStructured("error", "DB check failed", { correlationId, dbError: error.message });
            return new Response(JSON.stringify({ status: "degraded", db: "error", error: error.message, ts }), {
                status: 503,
                headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
            });
        }

        logStructured("info", "Health check passed", { correlationId });
        return new Response(JSON.stringify({ status: "ok", db: "ok", ts, correlationId }), {
            status: 200,
            headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        logStructured("error", "Unexpected error in health-check", { correlationId, error: message });
        return new Response(JSON.stringify({ status: "error", db: "error", error: message, ts }), {
            status: 503,
            headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });
    }
});
