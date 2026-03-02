/**
 * Utilitários Escavador — cliente frontend.
 *
 * IMPORTANTE: Chamadas à API Escavador NÃO saem do browser.
 * Use `fetchMovimentacoesViaProxy()` que delega para a Edge Function
 * `escavador-proxy`, onde o token da API fica seguro no servidor.
 *
 * Base da API: https://api.escavador.com/api/v2
 */

import { supabase } from "@/integrations/supabase/client";
import { getCorrelationId } from "@/lib/correlationId";

// ── Tipos ──────────────────────────────────────────────────────────────────

export interface EscavadorMovimentacao {
    id: number;
    data: string;
    tipo: string;
    conteudo: string;
    fonte?: {
        fonte_id: number;
        nome: string;
        tipo: string;
        sigla: string;
        grau?: number;
        grau_formatado?: string;
    };
}

export interface EscavadorMovimentacoesResponse {
    items: EscavadorMovimentacao[];
    links?: { next?: string };
    paginator?: { per_page: number };
}

// ── Utilitários puros ──────────────────────────────────────────────────────

/**
 * Normaliza número do processo para o formato CNJ esperado pela API.
 * Aceita com ou sem pontuação.
 * Exemplo: "00180631920138260002" → "0018063-19.2013.8.26.0002"
 */
export function normalizeProcessNumber(num: string): string {
    const cleaned = num.replace(/\D/g, "");
    if (cleaned.length < 20) return num.trim();
    const n = cleaned.slice(0, 7);
    const d = cleaned.slice(7, 9);
    const a = cleaned.slice(9, 13);
    const j = cleaned.slice(13, 14);
    const tr = cleaned.slice(14, 16);
    const o = cleaned.slice(16, 20);
    return `${n}-${d}.${a}.${j}.${tr}.${o}`;
}

// ── Proxy seguro via Edge Function ─────────────────────────────────────────

/**
 * Busca movimentações do processo via Edge Function `escavador-proxy`.
 * O token da API Escavador fica no servidor — nunca exposto no browser.
 *
 * Requer usuário autenticado (session ativa no Supabase).
 */
export async function fetchMovimentacoesViaProxy(
    processNumber: string,
    options?: { limit?: 50 | 100 | 500 },
): Promise<{ data: EscavadorMovimentacoesResponse | null; error: string | null }> {
    const {
        data: { session },
        error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
        return { data: null, error: "Usuário não autenticado." };
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
    if (!supabaseUrl) {
        return { data: null, error: "VITE_SUPABASE_URL não configurada." };
    }

    const proxyUrl = `${supabaseUrl}/functions/v1/escavador-proxy`;

    try {
        const res = await fetch(proxyUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session.access_token}`,
                "X-Correlation-ID": getCorrelationId(),
            },
            body: JSON.stringify({
                processNumber,
                limit: options?.limit ?? 100,
            }),
        });

        const body = await res.json().catch(() => ({}));

        if (!res.ok) {
            const msg = (body as { error?: string }).error || res.statusText || `HTTP ${res.status}`;
            return { data: null, error: msg };
        }

        return { data: body as EscavadorMovimentacoesResponse, error: null };
    } catch (e) {
        const message = e instanceof Error ? e.message : "Erro de rede";
        return { data: null, error: message };
    }
}
