/**
 * Logger estruturado — observabilidade do frontend.
 *
 * Integra-se com Sentry (ou qualquer reporter) sem criar dependência direta:
 * o reporter é registrado em `main.tsx` após o Sentry ser inicializado.
 *
 * Níveis:
 *   info  — operações normais (somente visível em DEV, não vai ao Sentry)
 *   warn  — situações inesperadas mas recuperáveis (console, não vai ao Sentry)
 *   error — erros que afetam o usuário (console + reporter em produção)
 */

import { getCorrelationId } from "@/lib/correlationId";

export interface LogContext {
    [key: string]: unknown;
}

type ErrorReporterFn = (error: unknown, context: LogContext) => void;

let _errorReporter: ErrorReporterFn | null = null;

/**
 * Registra o reporter de erros (ex.: Sentry.captureException).
 * Chamado em `main.tsx` após Sentry.init().
 */
export function registerErrorReporter(fn: ErrorReporterFn): void {
    _errorReporter = fn;
}

function buildEntry(level: string, message: string, context?: LogContext): LogContext {
    return {
        ts: new Date().toISOString(),
        level,
        message,
        correlationId: getCorrelationId(),
        ...context,
    };
}

export const logger = {
    /** Log informativo — visível apenas em DEV, não enviado ao reporter. */
    info(message: string, context?: LogContext): void {
        if (import.meta.env.DEV) {
            console.info("[INFO]", buildEntry("info", message, context));
        }
    },

    /** Log de alerta — sempre visível no console, não enviado ao reporter. */
    warn(message: string, context?: LogContext): void {
        console.warn("[WARN]", buildEntry("warn", message, context));
    },

    /** Log de erro — sempre visível e enviado ao reporter (Sentry). */
    error(message: string, context?: LogContext): void {
        const entry = buildEntry("error", message, context);
        console.error("[ERROR]", entry);
        _errorReporter?.(new Error(message), entry);
    },

    /**
     * Captura um objeto Error com contexto — enviado ao reporter.
     * Use quando você já tem uma instância de Error.
     */
    captureException(error: unknown, context?: LogContext): void {
        const message = error instanceof Error ? error.message : String(error);
        const entry = buildEntry("error", message, context);
        console.error("[ERROR]", entry);
        _errorReporter?.(error, entry);
    },
};
