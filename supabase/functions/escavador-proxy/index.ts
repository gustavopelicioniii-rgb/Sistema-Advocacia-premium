/**
 * escavador-proxy — Proxy seguro para a API Escavador.
 *
 * Chamadas à API Escavador nunca saem do browser. Esta Edge Function
 * valida o JWT do usuário, então repassa a requisição para a API
 * Escavador usando o token server-side (ESCAVADOR_API_TOKEN).
 *
 * POST /escavador-proxy
 * Body: { processNumber: string, limit?: 50 | 100 | 500 }
 * Headers: Authorization: Bearer <supabase_session_token>
 *
 * Env vars necessárias:
 *   ESCAVADOR_API_TOKEN       — token da API Escavador (server-side only)
 *   SUPABASE_URL              — injetado automaticamente pelo Supabase
 *   SUPABASE_ANON_KEY         — injetado automaticamente pelo Supabase
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ESCAVADOR_BASE = "https://api.escavador.com/api/v2";

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, content-type",
};

function logStructured(level: "info" | "warn" | "error", message: string, meta?: Record<string, unknown>) {
    const payload = { ts: new Date().toISOString(), level, message, fn: "escavador-proxy", ...meta };
    if (level === "error") console.error(JSON.stringify(payload));
    else console.log(JSON.stringify(payload));
}

function normalizeProcessNumber(num: string): string {
    const cleaned = num.replace(/\D/g, "");
    if (cleaned.length < 20) return num.trim();
    return `${cleaned.slice(0, 7)}-${cleaned.slice(7, 9)}.${cleaned.slice(9, 13)}.${cleaned.slice(13, 14)}.${cleaned.slice(14, 16)}.${cleaned.slice(16, 20)}`;
}

function jsonResponse(body: unknown, status: number): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
}

Deno.serve(async (req) => {
    // Preflight CORS
    if (req.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (req.method !== "POST") {
        return jsonResponse({ error: "Método não permitido. Use POST." }, 405);
    }

    // 1. Validar token do usuário via JWT Supabase
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
        logStructured("warn", "Requisição sem Authorization header");
        return jsonResponse({ error: "Não autorizado. Faça login para continuar." }, 401);
    }

    const userToken = authHeader.replace("Bearer ", "");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Cria client com o token do usuário para validar a sessão
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${userToken}` } },
    });

    const {
        data: { user },
        error: authError,
    } = await supabaseUser.auth.getUser();

    if (authError || !user) {
        logStructured("warn", "Token inválido ou expirado", { error: authError?.message });
        return jsonResponse({ error: "Sessão inválida. Faça login novamente." }, 401);
    }

    // 2. Validar body da requisição
    let body: { processNumber?: string; limit?: number };
    try {
        body = await req.json();
    } catch {
        return jsonResponse({ error: "Body inválido. Envie JSON com { processNumber }." }, 400);
    }

    const { processNumber, limit } = body;

    if (!processNumber || typeof processNumber !== "string" || processNumber.trim().length === 0) {
        return jsonResponse({ error: 'Campo "processNumber" é obrigatório.' }, 400);
    }

    const validLimits = [50, 100, 500];
    const queryLimit = validLimits.includes(limit ?? 0) ? limit : 100;

    // 3. Verificar token Escavador server-side
    const escavadorToken = Deno.env.get("ESCAVADOR_API_TOKEN");
    if (!escavadorToken) {
        logStructured("error", "ESCAVADOR_API_TOKEN não configurado no servidor");
        return jsonResponse({ error: "Serviço de monitoramento não configurado. Contate o suporte." }, 503);
    }

    // 4. Chamar API Escavador com token server-side
    const numero = normalizeProcessNumber(processNumber.trim());
    const url = new URL(`${ESCAVADOR_BASE}/processos/numero_cnj/${encodeURIComponent(numero)}/movimentacoes`);
    url.searchParams.set("limit", String(queryLimit));

    logStructured("info", "Consultando Escavador", { user_id: user.id, process_number: numero });

    let escavadorRes: Response;
    try {
        escavadorRes = await fetch(url.toString(), {
            method: "GET",
            headers: {
                Authorization: `Bearer ${escavadorToken}`,
                "X-Requested-With": "XMLHttpRequest",
                Accept: "application/json",
            },
        });
    } catch (networkError) {
        const msg = networkError instanceof Error ? networkError.message : "Erro de rede";
        logStructured("error", "Falha de rede ao consultar Escavador", { user_id: user.id, error: msg });
        return jsonResponse({ error: `Falha ao conectar com a API Escavador: ${msg}` }, 502);
    }

    const responseBody = await escavadorRes.json().catch(() => ({}));

    if (!escavadorRes.ok) {
        const errMsg =
            (responseBody as { error?: string }).error || escavadorRes.statusText || `HTTP ${escavadorRes.status}`;
        logStructured("warn", "API Escavador retornou erro", {
            user_id: user.id,
            process_number: numero,
            status: escavadorRes.status,
            error: errMsg,
        });
        return jsonResponse({ error: errMsg }, escavadorRes.status >= 500 ? 502 : escavadorRes.status);
    }

    logStructured("info", "Consulta Escavador concluída", {
        user_id: user.id,
        process_number: numero,
        items: (responseBody as { items?: unknown[] }).items?.length ?? 0,
    });

    return jsonResponse(responseBody, 200);
});
