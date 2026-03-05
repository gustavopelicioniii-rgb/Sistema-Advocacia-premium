import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Clock, DollarSign, TrendingDown, ChevronDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useDeadlinesStats } from "@/hooks/useDeadlines";
import { useFees } from "@/hooks/useFees";
import { useProcessos } from "@/hooks/useProcessos";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface RiskItem {
    icon: React.ElementType;
    title: string;
    detail: string;
    process: string;
    deadline: string;
    severity: "critical" | "warning" | "info";
    actionLabel: string;
    link?: string;
}

const severityStyles = {
    critical: "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/15",
    warning: "bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/15",
    info: "bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/15",
};

const formatCurrency = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const RiskCard = () => {
    const [expanded, setExpanded] = useState<number | null>(null);
    const navigate = useNavigate();
    const { criticalList } = useDeadlinesStats();
    const { data: fees } = useFees();
    const { data: processos } = useProcessos();

    const risks: RiskItem[] = useMemo(() => {
        const list: RiskItem[] = [];
        const today = new Date();
        const in5Days = new Date(today);
        in5Days.setDate(today.getDate() + 5);

        if (criticalList.length > 0) {
            const first = criticalList[0];
            const proc = first.process;
            list.push({
                icon: Clock,
                title: `${criticalList.length} processo(s) com alto risco de perda de prazo`,
                detail: `${first.titulo} — ação imediata necessária`,
                process: proc?.number ? `Proc. ${proc.number}` : first.titulo,
                deadline: first.data_fim
                    ? format(parseISO(first.data_fim), "dd MMM yyyy", { locale: ptBR })
                    : "Prazo próximo",
                severity: "critical",
                actionLabel: "Ver prazos",
                link: "/processos",
            });
        }

        const atrasados = (fees ?? []).filter((f) => f.status === "Atrasado");
        const vencendo = (fees ?? []).filter((f) => {
            if (f.status !== "Pendente" || !f.due_date) return false;
            const d = new Date(f.due_date);
            return d >= today && d <= in5Days;
        });
        if (atrasados.length > 0) {
            const total = atrasados.reduce((s, f) => s + Number(f.value), 0);
            const clientes = [...new Set(atrasados.map((f) => f.client))].slice(0, 3).join(", ");
            list.push({
                icon: DollarSign,
                title: `${atrasados.length} honorário(s) em atraso`,
                detail: `Total: ${formatCurrency(total)} — ${clientes}${atrasados.length > 3 ? "..." : ""}`,
                process: clientes || "—",
                deadline: "Vencidos",
                severity: "warning",
                actionLabel: "Enviar cobrança",
                link: "/financeiro",
            });
        }

        const semMovimento = (processos ?? []).filter((p) => {
            if (p.status !== "Em andamento") return false;
            const up = new Date(p.updated_at);
            const diff = (today.getTime() - up.getTime()) / (1000 * 60 * 60 * 24);
            return diff > 30;
        });
        if (semMovimento.length > 0) {
            list.push({
                icon: TrendingDown,
                title: `${semMovimento.length} processo(s) sem movimentação há 30+ dias`,
                detail: "Verifique pendências ou oportunidades de acordo",
                process: semMovimento
                    .slice(0, 2)
                    .map((p) => p.number)
                    .join(", "),
                deadline: "Sem prazo urgente",
                severity: "warning",
                actionLabel: "Ver processos",
                link: "/processos",
            });
        }

        if (list.length === 0) {
            list.push({
                icon: AlertTriangle,
                title: "Nenhum risco crítico no momento",
                detail: "Continue monitorando prazos e honorários.",
                process: "—",
                deadline: "—",
                severity: "info",
                actionLabel: "Ver dashboard",
            });
        }
        return list;
    }, [criticalList, fees, processos]);

    const handleAction = (risk: RiskItem) => {
        if (risk.link) navigate(risk.link);
    };

    return (
        <Card className="glass-card">
            <CardHeader className="pb-4">
                <CardTitle className="font-sans text-sm font-bold uppercase tracking-[0.2em] text-[#001D4A] flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-destructive/10">
                        <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                    </div>
                    Alertas de Risco
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {risks.map((risk, i) => (
                    <div key={i} className="space-y-0">
                        <div
                            onClick={() => setExpanded(expanded === i ? null : i)}
                            className={cn(
                                "group flex items-center gap-3 rounded-[18px] border p-4 transition-all duration-300 cursor-pointer",
                                severityStyles[risk.severity],
                                expanded === i
                                    ? "rounded-b-none border-b-transparent shadow-none"
                                    : "shadow-sm shadow-black/[0.02]",
                            )}
                        >
                            <risk.icon className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
                            <span className="text-xs font-bold flex-1 truncate">{risk.title}</span>
                            <ChevronDown
                                className={cn(
                                    "h-4 w-4 shrink-0 opacity-40 transition-transform",
                                    expanded === i ? "rotate-180" : "",
                                )}
                            />
                        </div>
                        <AnimatePresence>
                            {expanded === i && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3, ease: "easeOut" }}
                                    className="overflow-hidden"
                                >
                                    <div
                                        className={cn(
                                            "border border-t-0 rounded-b-[18px] p-5 space-y-3 bg-white/40",
                                            risk.severity === "critical" ? "border-destructive/10" : "border-black/5",
                                        )}
                                    >
                                        <p className="text-xs font-medium text-foreground/70 leading-relaxed">
                                            {risk.detail}
                                        </p>
                                        <div className="grid grid-cols-2 gap-4 pt-1">
                                            <div className="space-y-1">
                                                <span className="text-[9px] font-bold uppercase tracking-widest text-foreground/30">
                                                    Processo
                                                </span>
                                                <p className="text-[10px] font-bold text-[#001D4A] truncate">
                                                    {risk.process}
                                                </p>
                                            </div>
                                            <div className="space-y-1">
                                                <span className="text-[9px] font-bold uppercase tracking-widest text-foreground/30">
                                                    Referência
                                                </span>
                                                <p className="text-[10px] font-bold text-[#001D4A] truncate">
                                                    {risk.deadline}
                                                </p>
                                            </div>
                                        </div>
                                        {risk.link && (
                                            <div className="pt-2">
                                                <Button
                                                    size="sm"
                                                    className="w-full h-8 text-[10px] font-bold uppercase tracking-widest gap-2 bg-[#001D4A] hover:bg-[#001D4A]/90 transition-all rounded-xl shadow-lg shadow-black/5"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleAction(risk);
                                                    }}
                                                >
                                                    {risk.actionLabel}
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
};

export default RiskCard;
