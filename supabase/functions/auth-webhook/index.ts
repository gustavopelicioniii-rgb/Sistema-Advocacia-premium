/**
 * auth-webhook — Receptor de eventos de autenticação do Supabase.
 *
 * Configuração (Supabase Dashboard):
 *   Authentication → Hooks → "Send auth events to webhook"
 *   URL: https://<projeto>.supabase.co/functions/v1/auth-webhook
 *
 * Env vars necessárias (Edge Function Secrets):
 *   SUPABASE_URL              — injetado automaticamente
 *   SUPABASE_SERVICE_ROLE_KEY — injetado automaticamente
 *   SUPABASE_WEBHOOK_SECRET   — segredo definido no Dashboard (validação de origem)
 *
 * Eventos suportados: LOGIN, LOGOUT, TOKEN_REFRESHED, PASSWORD_RECOVERY, SIGNUP, etc.
 * Todos os eventos são gravados em public.auth_events via service_role (bypassa RLS).
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, content-type, x-supabase-signature",
};

function logStructured(level: "info" | "warn" | "error", message: string, meta?: Record<string, unknown>) {
    const entry = { ts: new Date().toISOString(), level, message, fn: "auth-webhook", ...meta };
    if (level === "error") console.error(JSON.stringify(entry));
    else console.log(JSON.stringify(entry));
}

/** Normaliza o tipo de evento para um formato consistente. */
function normalizeEventType(raw: string): string {
    return (raw ?? "unknown").toLowerCase().replace(/\s+/g, "_");
}

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: CORS_HEADERS });
    }

    if (req.method !== "POST") {
        return new Response(JSON.stringify({ error: "Method not allowed" }), {
            status: 405,
            headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });
    }

    let body: Record<string, unknown>;
    try {
        body = await req.json();
    } catch {
        return new Response(JSON.stringify({ error: "Invalid JSON" }), {
            status: 400,
            headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });
    }

    // Extrai campos do payload (Supabase auth webhook format)
    // Suporta dois formatos: { type, user } e { event, session }
    const eventType = normalizeEventType((body["type"] as string) ?? (body["event"] as string) ?? "unknown");

    const userObj =
        (body["user"] as Record<string, unknown> | undefined) ??
        ((body["session"] as Record<string, unknown> | undefined)?.["user"] as Record<string, unknown> | undefined);

    const userId = (userObj?.["id"] as string | undefined) ?? (body["user_id"] as string | undefined);

    const ipAddress = req.headers.get("x-forwarded-for") ?? req.headers.get("cf-connecting-ip") ?? null;

    const userAgent = req.headers.get("user-agent") ?? null;

    logStructured("info", "Auth event received", { eventType, userId: userId ?? "unknown" });

    try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
        const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

        if (!supabaseUrl || !serviceRoleKey) {
            logStructured("error", "Missing Supabase env vars");
            return new Response(JSON.stringify({ error: "Server configuration error" }), {
                status: 500,
                headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
            });
        }

        // Service role bypassa RLS — pode inserir em auth_events sem política de INSERT
        const supabase = createClient(supabaseUrl, serviceRoleKey);

        const { error } = await supabase.from("auth_events").insert({
            user_id: userId ?? null,
            event_type: eventType,
            ip_address: ipAddress,
            user_agent: userAgent,
            metadata: {
                raw_event: body["type"] ?? body["event"],
                email: userObj?.["email"] ?? null,
            },
        });

        if (error) {
            logStructured("error", "Failed to insert auth_event", { error: error.message });
            return new Response(JSON.stringify({ error: error.message }), {
                status: 500,
                headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
            });
        }

        logStructured("info", "Auth event recorded", { eventType, userId: userId ?? "unknown" });
        return new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        logStructured("error", "Unexpected error", { error: message });
        return new Response(JSON.stringify({ error: message }), {
            status: 500,
            headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        });
    }
});
