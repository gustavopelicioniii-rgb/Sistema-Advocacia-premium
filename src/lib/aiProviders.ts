/**
 * Provedores de IA — suporta Google Gemini e Anthropic Claude.
 * Toda chamada de geração de peças é roteada pela Edge Function generate-peca
 * (resolve o bloqueio CORS da API Anthropic e centraliza os prompts robustos).
 */

export type AIProvider = "gemini" | "anthropic";

export interface AIModel {
    id: string;
    label: string;
    provider: AIProvider;
    description: string;
}

export const AI_MODELS: AIModel[] = [
    // ── Google Gemini ──────────────────────────────────────────────────────
    {
        id: "gemini-2.0-flash",
        label: "Gemini 2.0 Flash",
        provider: "gemini",
        description: "Rápido e eficiente (recomendado)",
    },
    {
        id: "gemini-1.5-pro",
        label: "Gemini 1.5 Pro",
        provider: "gemini",
        description: "Alta capacidade de raciocínio",
    },
    {
        id: "gemini-1.5-flash",
        label: "Gemini 1.5 Flash",
        provider: "gemini",
        description: "Velocidade máxima, baixo custo",
    },
    // ── Anthropic Claude ──────────────────────────────────────────────────
    {
        id: "claude-haiku-4-5-20251001",
        label: "Claude Haiku 4.5",
        provider: "anthropic",
        description: "Rápido e econômico",
    },
    {
        id: "claude-sonnet-4-6",
        label: "Claude Sonnet 4.6",
        provider: "anthropic",
        description: "Equilíbrio ideal (recomendado)",
    },
    {
        id: "claude-opus-4-6",
        label: "Claude Opus 4.6",
        provider: "anthropic",
        description: "Máxima capacidade",
    },
];

export const DEFAULT_MODEL: Record<AIProvider, string> = {
    gemini: "gemini-2.0-flash",
    anthropic: "claude-sonnet-4-6",
};

export const PROVIDER_LABELS: Record<AIProvider, string> = {
    gemini: "Google Gemini",
    anthropic: "Anthropic Claude",
};

/** Chaves localStorage */
export const LS_PROVIDER = "ai_provider";
export const LS_MODEL = "ai_model";
export const LS_KEY_GEMINI = "gemini_api_key";
export const LS_KEY_ANTHROPIC = "anthropic_api_key";

/** Lê o provedor salvo (fallback: gemini). */
export function getStoredProvider(): AIProvider {
    return (localStorage.getItem(LS_PROVIDER) as AIProvider) ?? "gemini";
}

/** Lê a chave de API salva para o provedor atual. */
export function getStoredApiKey(provider?: AIProvider): string {
    const p = provider ?? getStoredProvider();
    return localStorage.getItem(p === "anthropic" ? LS_KEY_ANTHROPIC : LS_KEY_GEMINI) ?? "";
}

/** Lê o modelo salvo (fallback: default do provedor). */
export function getStoredModel(provider?: AIProvider): string {
    const p = provider ?? getStoredProvider();
    return localStorage.getItem(LS_MODEL) ?? DEFAULT_MODEL[p];
}

/**
 * Gera uma peça jurídica via Edge Function `generate-peca`.
 * Usa fetch direto para expor erros reais da API (chave inválida, modelo incorreto etc.).
 */
export async function generateWithAI(
    provider: AIProvider,
    apiKey: string,
    model: string,
    templateTipo: string,
    context: string,
): Promise<string> {
    const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) ?? "";
    const supabaseKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ?? "";

    if (!supabaseUrl) throw new Error("VITE_SUPABASE_URL não configurado.");

    const url = `${supabaseUrl}/functions/v1/generate-peca`;

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${supabaseKey}`,
            apikey: supabaseKey,
        },
        body: JSON.stringify({ provider, apiKey, model, templateTipo, context }),
    });

    const data = await response.json().catch(() => ({})) as { text?: string; error?: string };

    if (!response.ok) {
        throw new Error(data.error ?? `Erro ${response.status} na Edge Function generate-peca`);
    }

    if (!data.text) throw new Error("A IA não retornou conteúdo.");
    return data.text;
}
