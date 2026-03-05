import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Processos from "./pages/Processos";
import ProcessoDetail from "./pages/ProcessoDetail";
import Pecas from "./pages/Pecas";
import CRM from "./pages/CRM";
import Financeiro from "./pages/Financeiro";
import Agenda from "./pages/Agenda";
import Documentos from "./pages/Documentos";
import Publicacoes from "./pages/Publicacoes";
import Relatorios from "./pages/Relatorios";
import Configuracoes from "./pages/Configuracoes";
import Equipe from "./pages/Equipe";
import WhatsAppPage from "./pages/WhatsApp";
import MobileMenu from "./pages/MobileMenu";
import Inbox from "./pages/Inbox";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Calculadora from "./pages/Calculadora";
import CorrecaoValores from "./pages/calculadora/CorrecaoValores";
import CorrecaoFGTS from "./pages/calculadora/CorrecaoFGTS";
import MeusCalculos from "./pages/calculadora/MeusCalculos";
import OutrasCalculadoras from "./pages/calculadora/OutrasCalculadoras";
import ImportarProcessos from "./pages/ImportarProcessos";
import DashboardProcessos from "./pages/DashboardProcessos";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { isSupabaseConfigured } from "@/integrations/supabase/client";

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
        },
    },
});

/** Tela exibida quando as variáveis do Supabase não estão configuradas na Vercel (evita tela branca). */
const ConfigNeededScreen = () => (
    <div
        style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            background: "#f8fafc",
            color: "#0f172a",
            fontFamily: "system-ui, sans-serif",
            textAlign: "center",
        }}
    >
        <div style={{ maxWidth: 480 }}>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: 12 }}>Configuração necessária</h1>
            <p style={{ marginBottom: 16, color: "#475569" }}>
                As variáveis de ambiente do Supabase não estão definidas neste deploy. Por isso o sistema não consegue
                carregar.
            </p>
            <p style={{ marginBottom: 8, fontSize: "0.875rem", color: "#64748b" }}>
                No painel da <strong>Vercel</strong>: <strong>Settings</strong> → <strong>Environment Variables</strong>
                . Adicione:
            </p>
            <ul style={{ textAlign: "left", marginBottom: 16, fontSize: "0.875rem", color: "#475569" }}>
                <li>
                    <code style={{ background: "#e2e8f0", padding: "2px 6px", borderRadius: 4 }}>
                        VITE_SUPABASE_URL
                    </code>{" "}
                    — URL do projeto (ex.: https://xxxxx.supabase.co)
                </li>
                <li>
                    <code style={{ background: "#e2e8f0", padding: "2px 6px", borderRadius: 4 }}>
                        VITE_SUPABASE_ANON_KEY
                    </code>{" "}
                    — Chave anônima (Project Settings → API no Supabase)
                </li>
            </ul>
            <p style={{ fontSize: "0.875rem", color: "#64748b" }}>
                Depois, faça um novo deploy (Redeploy) para aplicar.
            </p>
        </div>
    </div>
);

const App = () => {
    if (import.meta.env.PROD && !isSupabaseConfigured) {
        return <ConfigNeededScreen />;
    }
    return (
        <ThemeProvider>
            <QueryClientProvider client={queryClient}>
                <AuthProvider>
                    <TooltipProvider>
                        <Toaster />
                        <Sonner />
                        <BrowserRouter>
                            <Routes>
                                <Route path="/login" element={<Login />} />
                                <Route
                                    element={
                                        <ProtectedRoute>
                                            <AppLayout />
                                        </ProtectedRoute>
                                    }
                                >
                                    <Route path="/" element={<Dashboard />} />
                                    <Route path="/inbox" element={<Inbox />} />
                                    <Route path="/processos" element={<Processos />} />
                                    <Route path="/processos/importar" element={<ImportarProcessos />} />
                                    <Route path="/processos/dashboard-escavador" element={<DashboardProcessos />} />
                                    <Route path="/processos/:id" element={<ProcessoDetail />} />
                                    <Route path="/agenda" element={<Agenda />} />
                                    <Route path="/pecas" element={<Pecas />} />
                                    <Route path="/crm" element={<CRM />} />
                                    <Route path="/financeiro" element={<Financeiro />} />
                                    <Route
                                        path="/documentos"
                                        element={
                                            <ErrorBoundary>
                                                <Documentos />
                                            </ErrorBoundary>
                                        }
                                    />
                                    <Route path="/publicacoes" element={<Publicacoes />} />
                                    <Route
                                        path="/relatorios"
                                        element={
                                            <ProtectedRoute requiredRole="admin">
                                                <Relatorios />
                                            </ProtectedRoute>
                                        }
                                    />
                                    <Route path="/configuracoes" element={<Configuracoes />} />
                                    <Route
                                        path="/equipe"
                                        element={
                                            <ProtectedRoute requiredRole="admin">
                                                <Equipe />
                                            </ProtectedRoute>
                                        }
                                    />
                                    <Route path="/whatsapp" element={<WhatsAppPage />} />
                                    <Route path="/calculadora" element={<Calculadora />} />
                                    <Route
                                        path="/calculadora/correcao"
                                        element={
                                            <ErrorBoundary>
                                                <CorrecaoValores />
                                            </ErrorBoundary>
                                        }
                                    />
                                    <Route
                                        path="/calculadora/fgts"
                                        element={
                                            <ErrorBoundary>
                                                <CorrecaoFGTS />
                                            </ErrorBoundary>
                                        }
                                    />
                                    <Route
                                        path="/calculadora/:slug"
                                        element={
                                            <ErrorBoundary>
                                                <OutrasCalculadoras />
                                            </ErrorBoundary>
                                        }
                                    />
                                    <Route path="/calculadora/meus-calculos" element={<MeusCalculos />} />
                                    <Route path="/menu" element={<MobileMenu />} />
                                </Route>
                                <Route path="*" element={<NotFound />} />
                            </Routes>
                        </BrowserRouter>
                    </TooltipProvider>
                </AuthProvider>
            </QueryClientProvider>
        </ThemeProvider>
    );
};

export default App;
