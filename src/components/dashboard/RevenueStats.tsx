import { useMemo } from "react";
import { DollarSign, TrendingUp, Scale, Users, Lock, AlertTriangle, ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useFees, useFeeStats } from "@/hooks/useFees";
import { useProcessos, useProcessoStats } from "@/hooks/useProcessos";
import { useCrmClients, useCrmStages } from "@/hooks/useCrm";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const RevenueStats = () => {
    const navigate = useNavigate();
    const { data: fees } = useFees();
    const stats = useFeeStats();
    const processoStats = useProcessoStats();
    const { data: crmClients } = useCrmClients();
    const { data: stages } = useCrmStages();

    const {
        receitaMensal,
        receitaProjetada,
        receitaTravada,
        emRisco,
        percentTravada,
        percentRisco,
        pipelineConversion,
    } = useMemo(() => {
        const now = new Date();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();
        let receitaMensal = 0;
        let receitaProjetada = 0;
        (fees ?? []).forEach((f) => {
            if (f.status === "Pago" && f.paid_date) {
                const d = new Date(f.paid_date);
                if (d.getMonth() === thisMonth && d.getFullYear() === thisYear) receitaMensal += Number(f.value);
            }
            if (f.status === "Pendente" && f.due_date) {
                const due = new Date(f.due_date);
                const in30 = due.getTime() - now.getTime() <= 30 * 24 * 60 * 60 * 1000 && due >= now;
                if (in30) receitaProjetada += Number(f.value);
            }
        });
        const receitaTravada = stats.pago;
        const emRisco = stats.atrasado;
        const totalReceita = receitaTravada + stats.pendente + emRisco;
        const percentTravada = totalReceita > 0 ? Math.round((receitaTravada / totalReceita) * 100) : 0;
        const percentRisco = totalReceita > 0 ? Math.round((emRisco / totalReceita) * 100) : 0;

        const totalClients = crmClients?.length ?? 0;
        const lastStageId = stages?.length ? stages[stages.length - 1]?.id : null;
        const converted = lastStageId ? (crmClients?.filter((c) => c.stage_id === lastStageId).length ?? 0) : 0;
        const pipelineConversion =
            totalClients > 0
                ? { percent: Math.round((converted / totalClients) * 100), total: totalClients, converted }
                : { percent: 0, total: 0, converted: 0 };

        return {
            receitaMensal,
            receitaProjetada,
            receitaTravada,
            emRisco,
            percentTravada,
            percentRisco,
            pipelineConversion,
        };
    }, [fees, stats, crmClients, stages]);

    const statsCards = useMemo(
        () => [
            {
                title: "Receita Mensal",
                value: formatCurrency(receitaMensal),
                label: "Mês atual",
                icon: DollarSign,
                color: "bg-emerald-500/10 text-emerald-600",
                path: "/financeiro",
            },
            {
                title: "Processos Ativos",
                value: String(processoStats.emAndamento + processoStats.aguardandoPrazo),
                label: `${processoStats.total} no total`,
                icon: Scale,
                color: "bg-[#001D4A]/5 text-[#001D4A]",
                path: "/processos",
            },
            {
                title: "Clientes",
                value: String(crmClients?.length ?? 0),
                label: "Base CRM",
                icon: Users,
                color: "bg-blue-500/10 text-blue-600",
                path: "/crm",
            },
            {
                title: "Próximos 30 dias",
                value: formatCurrency(receitaProjetada),
                label: "Projetado",
                icon: TrendingUp,
                color: "bg-amber-500/10 text-amber-600",
                path: "/financeiro",
            },
        ],
        [receitaMensal, processoStats, crmClients?.length, receitaProjetada],
    );

    const revenueBreakdown = useMemo(
        () => [
            {
                label: "Receita Travada",
                value: formatCurrency(receitaTravada),
                percent: percentTravada,
                icon: Lock,
                color: "bg-emerald-500",
            },
            {
                label: "Em Risco (Atrasados)",
                value: formatCurrency(emRisco),
                percent: percentRisco,
                icon: AlertTriangle,
                color: "bg-amber-500",
            },
        ],
        [receitaTravada, emRisco, percentTravada, percentRisco],
    );

    return (
        <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {statsCards.map((stat) => (
                    <Card
                        key={`stat-card-${stat.title}`}
                        className="glass-card group cursor-pointer"
                        onClick={() => navigate(stat.path)}
                    >
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div
                                    className={cn(
                                        "flex h-11 w-11 items-center justify-center rounded-2xl transition-transform group-hover:scale-110",
                                        stat.color,
                                    )}
                                >
                                    <stat.icon className="h-5 w-5" />
                                </div>
                                <ArrowUpRight className="h-4 w-4 text-foreground/20 group-hover:text-primary transition-colors" />
                            </div>
                            <p className="text-xl font-bold text-[#001D4A] tracking-tighter">
                                <span>{stat.value}</span>
                            </p>
                            <p className="text-[10px] font-bold text-foreground/30 uppercase tracking-[0.15em] mt-1">
                                <span>{stat.title}</span>
                            </p>
                            <div className="flex items-center gap-1.5 mt-2">
                                <div className="h-1 w-1 rounded-full bg-emerald-500" />
                                <p className="text-[10px] font-bold text-emerald-600/80 uppercase">
                                    <span>{stat.label}</span>
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {revenueBreakdown.map((item) => (
                    <Card key={`breakdown-${item.label}`} className="glass-card overflow-hidden">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <item.icon className="h-4 w-4 text-[#001D4A]/40" />
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#001D4A]/50">
                                    <span>{item.label}</span>
                                </span>
                            </div>
                            <div className="flex items-end justify-between mb-3">
                                <p className="text-lg font-bold text-[#001D4A] tracking-tight">
                                    <span>{item.value}</span>
                                </p>
                                <span className="text-xs font-bold text-[#001D4A]/40">
                                    <span>{item.percent}%</span>
                                </span>
                            </div>
                            <div className="h-2 w-full bg-black/[0.03] rounded-full overflow-hidden">
                                <div
                                    className={cn("h-full rounded-full transition-all duration-1000", item.color)}
                                    style={{ width: `${item.percent}%` }}
                                />
                            </div>
                        </CardContent>
                    </Card>
                ))}

                <Card className="glass-card overflow-hidden">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <TrendingUp className="h-4 w-4 text-[#001D4A]/40" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#001D4A]/50">
                                Conversão Pipeline
                            </span>
                        </div>
                        <div className="flex items-end justify-between mb-3">
                            <p className="text-xl font-bold text-[#001D4A] tracking-tight">
                                {pipelineConversion.percent}%
                            </p>
                            <span className="text-xs font-bold text-[#001D4A]/40">
                                {pipelineConversion.converted}/{pipelineConversion.total}
                            </span>
                        </div>
                        <div className="h-2 w-full bg-black/[0.03] rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary rounded-full transition-all duration-1000"
                                style={{ width: `${pipelineConversion.percent}%` }}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default RevenueStats;
