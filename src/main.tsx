import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";
import { registerErrorReporter } from "@/lib/logger";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import App from "./App.tsx";
import "./index.css";

// Inicializa Sentry se o DSN estiver configurado (no-op quando ausente)
const sentryDsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
if (sentryDsn) {
    Sentry.init({
        dsn: sentryDsn,
        integrations: [Sentry.browserTracingIntegration()],
        tracesSampleRate: 0.1,
        environment: import.meta.env.MODE,
    });
    registerErrorReporter((error, context) => {
        Sentry.captureException(error, { extra: context });
    });
}

const rootEl = document.getElementById("root");
if (!rootEl) {
    document.body.innerHTML =
        '<div style="padding:24px;font-family:system-ui;color:#dc2626;">Erro: elemento #root não encontrado.</div>';
} else {
    try {
        createRoot(rootEl).render(
            <ErrorBoundary>
                <App />
            </ErrorBoundary>,
        );
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        // Usar textContent para evitar XSS — mensagem de erro não deve ser interpolada em innerHTML
        const wrapper = document.createElement("div");
        wrapper.setAttribute("style", "padding:24px;font-family:system-ui;color:#0f172a;max-width:560px;");
        const title = document.createElement("p");
        title.setAttribute("style", "color:#dc2626;font-weight:600;");
        title.textContent = "Erro ao iniciar a aplicação";
        const detail = document.createElement("p");
        detail.setAttribute("style", "margin:8px 0;font-size:0.875rem;");
        detail.textContent = msg;
        const hint = document.createElement("p");
        hint.setAttribute("style", "margin-top:16px;font-size:0.75rem;color:#64748b;");
        hint.textContent =
            "Verifique as variáveis de ambiente na Vercel (VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY) e o Console do navegador (F12).";
        wrapper.appendChild(title);
        wrapper.appendChild(detail);
        wrapper.appendChild(hint);
        rootEl.appendChild(wrapper);
    }
}
