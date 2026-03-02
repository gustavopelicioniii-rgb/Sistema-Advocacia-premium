import { createClient } from "@supabase/supabase-js";
import { logger } from "@/lib/logger";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";

if (!supabaseUrl || !supabaseAnonKey) {
    if (import.meta.env.PROD) {
        logger.error(
            "[Supabase] VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não definidas. " +
                "Configure em Vercel: Settings → Environment Variables.",
        );
    } else {
        logger.warn(
            "[Supabase] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing. " +
                "Database features will not work until you add them to .env",
        );
    }
}

/** Indica se o Supabase está configurado (evita tela branca em produção quando vars faltam). */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(
    supabaseUrl || "https://placeholder.supabase.co",
    supabaseAnonKey || "placeholder-key",
);
