import { useMemo } from "react";
import { motion } from "framer-motion";
import {
    AlertTriangle,
    CheckCircle2,
    DollarSign,
    TrendingDown,
    Bell,
    Scale,
    ArrowRight,
    Search,
    Sparkles,
    Activity,
    Clock,
    ArrowUpRight,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import HealthScore from "@/components/dashboard/HealthScore";
import type { BreakdownItem } from "@/components/dashboard/HealthScore";
import RiskCard from "@/components/dashboard/RiskCard";
import TodayActions from "@/components/dashboard/TodayActions";
import CriticalDeadlines from "@/components/dashboard/CriticalDeadlines";
import SmartActivity from "@/components/dashboard/SmartActivity";
import ProcessMonitorResults from "@/components/dashboard/ProcessMonitorResults";
import RevenueStats from "@/components/dashboard/RevenueStats";
import AiAssistantButton from "@/components/dashboard/AiAssistantButton";
import AiRecommendation from "@/components/dashboard/AiRecommendation";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useDeadlinesStats } from "@/hooks/useDeadlines";
import { useFeeStats } from "@/hooks/useFees";
import { useProcessos } from "@/hooks/useProcessos";
import { useInbox } from "@/hooks/useInbox";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
};

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
};

const Dashboard = () => {
    const { user, role } = useAuth();
    const navigate = useNavigate();
    const { data: profile } = useProfile();
    const { urgentes, pendentes, total: totalPrazos } = useDeadlinesStats();
    const feeStats = useFeeStats();
    const { data: processos } = useProcessos();
    const { data: inboxItems = [] } = useInbox();

    const unreadNotifications = useMemo(() => inboxItems.filter((item) => !item.lido).length, [inboxItems]);

    const displayName = profile?.full_name || user?.email?.split("@")[0] || "Advogado";

    const { score, label, breakdownItems } = useMemo(() => {
        const now = new Date();
        const prazosScore = totalPrazos === 0 ? 100 : Math.max(0, 100 - (urgentes / Math.max(1, pendentes)) * 40);
        const totalFee = feeStats.pago + feeStats.pendente + feeStats.atrasado;
        const feeScore = totalFee === 0 ? 100 : Math.max(0, 100 - (feeStats.atrasado / totalFee) * 100);
        const ativos = (processos ?? []).filter((p) => p.status === "Em andamento" || p.status === "Aguardando prazo");
        const comMovimento = ativos.filter((p) => {
            const up = new Date(p.updated_at);
            const diff = (now.getTime() - up.getTime()) / (1000 * 60 * 60 * 24);
            return diff <= 30;
        });
        const processScore = ativos.length === 0 ? 100 : Math.round((comMovimento.length / ativos.length) * 100);
        const receitaScore =
            totalFee === 0 ? 100 : feeStats.pago > 0 ? Math.min(100, 50 + (feeStats.pago / totalFee) * 50) : 50;

        const score = Math.round(0.3 * prazosScore + 0.25 * feeScore + 0.25 * processScore + 0.2 * receitaScore);
        const label =
            score >= 80 ? "Escritório saudável" : score >= 60 ? "Atenção a prazos e cobranças" : "Requer atenção";

        const breakdown: BreakdownItem[] = [
            {
                icon: CheckCircle2,
                label: "Prazos organizados",
                value: totalPrazos === 0 ? "Nenhum prazo" : `${pendentes - urgentes}/${pendentes} em dia`,
                percent: Math.round(prazosScore),
                status: prazosScore >= 80 ? "good" : prazosScore >= 60 ? "warning" : "bad",
                suggestion:
                    urgentes > 0
                        ? `${urgentes} prazo(s) urgente(s). Acompanhe em Processos.`
                        : "Excelente! Continue monitorando diariamente.",
            },
            {
                icon: AlertTriangle,
                label: "Honorários",
                value: feeStats.atrasado > 0 ? `R$ ${Math.round(feeStats.atrasado)} em atraso` : "Em dia",
                percent: Math.round(feeScore),
                status: feeScore >= 80 ? "good" : feeScore >= 60 ? "warning" : "bad",
                suggestion:
                    feeStats.atrasado > 0
                        ? "Automatize cobranças para reduzir inadimplência."
                        : "Honorários sob controle.",
            },
            {
                icon: TrendingDown,
                label: "Processos ativos",
                value: ativos.length === 0 ? "—" : `${comMovimento.length}/${ativos.length} com movimentação recente`,
                percent: processScore,
                status: processScore >= 80 ? "good" : processScore >= 60 ? "warning" : "bad",
                suggestion:
                    ativos.length - comMovimento.length > 0
                        ? "Alguns processos sem movimentação há 30+ dias. Verifique pendências."
                        : "Processos em movimento.",
            },
            {
                icon: DollarSign,
                label: "Receita",
                value: feeStats.pago > 0 ? "Positiva" : "Aguardando recebimentos",
                percent: Math.round(receitaScore),
                status: receitaScore >= 70 ? "good" : receitaScore >= 50 ? "warning" : "bad",
                suggestion: "Acompanhe o módulo Financeiro e pipeline de cobranças.",
            },
        ];

        return { score: Math.min(100, Math.max(0, score)), label, breakdownItems: breakdown };
    }, [urgentes, pendentes, totalPrazos, feeStats, processos]);

    return (
        <div className="w-full min-h-screen">
            {/* Design Elements */}
            <div className="fixed inset-0 pointer-events-none z-[-1] bg-[#ffffff]" />

            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="space-y-10 px-4 py-8 sm:px-8 max-w-[1600px] mx-auto"
            >
                {/* Top Action Bar / Notification Bell */}
                <motion.div variants={item} className="flex items-center justify-end gap-3 mb-2">
                    {role === "admin" && (
                        <Badge
                            variant="outline"
                            className="bg-emerald-500/10 text-emerald-600 border-none px-3 py-1.5 rounded-xl text-[10px] font-black tracking-wider transition-all hover:bg-emerald-500/20 cursor-default"
                        >
                            <Sparkles className="h-3 w-3 mr-1.5" />
                            IA PREMIUM ATIVA
                        </Badge>
                    )}
                    <button
                        onClick={() => navigate("/inbox")}
                        className="relative h-10 w-10 flex items-center justify-center rounded-2xl bg-white/40 hover:bg-white/60 transition-all group border border-white/60 shadow-sm"
                    >
                        <Bell
                            className={cn(
                                "h-4 w-4 text-[#001D4A] transition-all group-hover:rotate-12",
                                unreadNotifications > 0 && "animate-none",
                            )}
                        />
                        {unreadNotifications > 0 && (
                            <>
                                <span className="absolute -top-1 -right-1 h-4 min-w-[16px] flex items-center justify-center bg-destructive text-[#ffffff] text-[8px] font-bold rounded-full border-2 border-white px-1 shadow-sm z-10">
                                    {unreadNotifications > 9 ? "9+" : unreadNotifications}
                                </span>
                                <span className="absolute -top-1 -right-1 h-4 min-w-[16px] animate-ping bg-destructive rounded-full opacity-25 z-0" />
                            </>
                        )}
                    </button>
                </motion.div>

                {/* Header + Health Score Section */}
                <motion.div variants={item} className="flex flex-col xl:flex-row xl:items-start justify-between gap-8">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                        {profile?.firm_logo_url ? (
                            <div className="relative group cursor-pointer" onClick={() => navigate("/configuracoes")}>
                                <img
                                    src={profile.firm_logo_url}
                                    alt="Logo do escritório"
                                    className="relative h-12 w-auto max-w-[140px] object-contain shrink-0"
                                />
                            </div>
                        ) : (
                            <div
                                className="h-12 w-12 rounded-2xl bg-[#001D4A] flex items-center justify-center shadow-lg shadow-[#001D4A]/5 transform transition-transform hover:scale-105 cursor-pointer"
                                onClick={() => navigate("/configuracoes")}
                            >
                                <Scale className="h-6 w-6 text-white" />
                            </div>
                        )}
                        <div className="pt-1">
                            <h1 className="text-2xl sm:text-3xl font-bold text-[#001D4A] tracking-tight leading-tight">
                                {getGreeting()}, <span className="text-foreground/50">{displayName}</span>
                            </h1>
                            <div className="flex items-center gap-2 mt-1.5">
                                <p className="text-[9px] font-bold text-foreground/30 uppercase tracking-[0.25em]">
                                    {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="w-full xl:w-auto xl:min-w-[380px]">
                        <HealthScore score={score} label={label} breakdownItems={breakdownItems} />
                    </div>
                </motion.div>

                {/* Main Content Grid */}
                <div className="grid gap-10">
                    {/* Urgency Section */}
                    <div className="grid gap-8 lg:grid-cols-12">
                        <motion.div
                            variants={item}
                            className="lg:col-span-12 xl:col-span-7 cursor-pointer"
                            onClick={() => navigate("/processos")}
                        >
                            <CriticalDeadlines />
                        </motion.div>
                        <div className="lg:col-span-12 xl:col-span-5 grid gap-8 sm:grid-cols-2 xl:grid-cols-1">
                            <motion.div
                                variants={item}
                                className="cursor-pointer"
                                onClick={() => navigate("/processos")}
                            >
                                <RiskCard />
                            </motion.div>
                            <motion.div variants={item} className="cursor-pointer" onClick={() => navigate("/inbox")}>
                                <TodayActions />
                            </motion.div>
                        </div>
                    </div>

                    {/* Performance Section */}
                    <motion.div variants={item} className="group">
                        <div
                            className="flex items-center gap-4 mb-8 cursor-pointer group/title"
                            onClick={() => navigate("/financeiro")}
                        >
                            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#001D4A]/10 to-transparent" />
                            <h2 className="font-sans text-[11px] font-bold uppercase tracking-[0.5em] text-[#001D4A]/40 flex items-center gap-2 group-hover/title:text-primary transition-colors">
                                <TrendingDown className="h-3.5 w-3.5" />
                                Visão de Performance
                            </h2>
                            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#001D4A]/10 to-transparent" />
                        </div>
                        <ErrorBoundary>
                            <RevenueStats />
                        </ErrorBoundary>
                    </motion.div>

                    {/* Intelligence Section */}
                    <div className="grid gap-8 lg:grid-cols-2">
                        <motion.div variants={item}>
                            <AiRecommendation />
                        </motion.div>
                        <motion.div variants={item}>
                            <ProcessMonitorResults />
                        </motion.div>
                    </div>

                    {/* Activity Section */}
                    <motion.div variants={item}>
                        <ErrorBoundary>
                            <SmartActivity />
                        </ErrorBoundary>
                    </motion.div>
                </div>
            </motion.div>

            {/* Floating Assistant */}
            <AiAssistantButton />
        </div>
    );
};

export default Dashboard;
