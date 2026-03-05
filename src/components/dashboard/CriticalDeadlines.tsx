import { useMemo } from "react";
import { Clock, ArrowUpRight, DollarSign, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useDeadlines, useHolidays, businessDaysBetween } from "@/hooks/useDeadlines";
import { useProcessos } from "@/hooks/useProcessos";
import { format, parseISO, startOfDay, isBefore, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";

const getDaysLeftColor = (days: number) => {
    if (days <= 0) return "text-destructive font-bold";
    if (days <= 2) return "text-destructive font-bold";
    if (days <= 5) return "text-amber-600 dark:text-amber-500 font-semibold";
    return "text-muted-foreground";
};

const getDaysLeftBg = (days: number) => {
    if (days <= 0) return "bg-destructive/15 border-destructive/50 animate-pulse";
    if (days <= 2) return "bg-destructive/10 border-destructive/30 animate-pulse";
    if (days <= 5) return "bg-amber-500/5 border-amber-500/20";
    return "bg-card border-border";
};

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
};

const CriticalDeadlines = () => {
    const { data: deadlines, isLoading } = useDeadlines();
    const { data: processos } = useProcessos();
    const { data: holidays = [] } = useHolidays();
    const holidayDates = useMemo(() => holidays.map((h) => h.data), [holidays]);

    const activeDeadlines = useMemo(() => {
        const today = new Date();
        const todayStart = startOfDay(today);
        const fromTable = (deadlines ?? []).filter((d) => d.status === "Pendente" && d.data_fim);
        const fromProcessos = (processos ?? [])
            .filter((p) => {
                if (!p.next_deadline || p.status === "Concluído") return false;
                try {
                    const d = parseISO(p.next_deadline);
                    return !isNaN(d.getTime()) && !isBefore(d, todayStart);
                } catch {
                    return false;
                }
            })
            .map((p) => ({
                id: `proc-${p.id}`,
                process_id: p.id,
                titulo: "Próximo prazo",
                data_fim: p.next_deadline!,
                process: { number: p.number, client: p.client, value: p.value ?? 0 },
            }));
        const combined = [...fromTable, ...fromProcessos]
            .map((d) => {
                try {
                    const dateFim = parseISO(d.data_fim);
                    if (isNaN(dateFim.getTime())) return null;
                    const isVencido = isBefore(dateFim, todayStart);
                    const venceHoje = !isVencido && isSameDay(dateFim, today);
                    const diasUteisRestantes = isVencido
                        ? -1
                        : venceHoje
                          ? 0
                          : businessDaysBetween(today, dateFim, holidayDates);
                    return { ...d, dateFim, diasUteisRestantes, isVencido, venceHoje };
                } catch {
                    return null;
                }
            })
            .filter((d): d is NonNullable<typeof d> => d != null)
            .sort((a, b) => a.diasUteisRestantes - b.diasUteisRestantes)
            .slice(0, 6);
        return combined;
    }, [deadlines, processos, holidayDates]);

    if (isLoading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-10">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    return (
        <TooltipProvider>
            <Card className="glass-card overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between pb-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10">
                            <Clock className="h-5 w-5 text-destructive" />
                        </div>
                        <div>
                            <CardTitle className="font-sans text-sm font-bold uppercase tracking-[0.2em] text-[#001D4A]">
                                Prazos Processuais
                            </CardTitle>
                            <p className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest mt-0.5">
                                Próximos vencimentos em dias úteis
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="text-foreground/40 hover:text-primary hover:bg-white/50 transition-all font-bold text-[11px] uppercase tracking-widest"
                    >
                        <Link to="/processos">
                            Ver todos <ArrowUpRight className="ml-1 h-3 w-3" />
                        </Link>
                    </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                    {activeDeadlines.length === 0 ? (
                        <div className="text-center py-12 bg-black/[0.015] rounded-[20px] border border-dashed border-black/[0.05]">
                            <p className="text-sm font-medium text-muted-foreground">
                                Parabéns! Nenhum prazo crítico pendente.
                            </p>
                        </div>
                    ) : (
                        activeDeadlines.map((d) => {
                            const dateFim = d.dateFim;
                            const daysLeft = d.diasUteisRestantes;
                            const isUrgent = daysLeft <= 3 || d.isVencido;
                            const processId = "process_id" in d ? (d as { process_id?: string }).process_id : undefined;
                            const itemClassName = `group flex items-center justify-between rounded-[20px] border border-black/[0.03] p-4 transition-all duration-300 hover:bg-white/40 hover:shadow-lg hover:shadow-black/5 cursor-pointer ${isUrgent ? "bg-destructive/[0.02]" : "bg-white/20"}`;
                            const processValue = d.process?.value ?? 0;

                            const innerContent = (
                                <>
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div
                                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-transform group-hover:scale-110 ${isUrgent ? "bg-destructive text-white shadow-lg shadow-destructive/20" : "bg-[#001D4A]/5 text-[#001D4A]"}`}
                                        >
                                            <Clock className="h-5 w-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-[#001D4A] truncate">
                                                {d.process?.client || "Cliente não informado"}
                                            </p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[10px] font-bold text-foreground/30 uppercase tracking-wider truncate">
                                                    {d.process?.number || "Processo s/n"}
                                                </span>
                                                <span className="h-1 w-1 rounded-full bg-foreground/10" />
                                                <span className="text-[10px] font-bold text-primary/60 truncate">
                                                    {d.titulo}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 shrink-0">
                                        {processValue > 0 && (
                                            <div className="hidden sm:flex flex-col items-end">
                                                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-tighter">
                                                    {formatCurrency(processValue)}
                                                </span>
                                                <span className="text-[8px] font-bold text-foreground/20 uppercase tracking-widest">
                                                    Honorários
                                                </span>
                                            </div>
                                        )}
                                        <div className="text-right">
                                            <p
                                                className={`text-sm font-bold tracking-tighter leading-none ${getDaysLeftColor(daysLeft)}`}
                                            >
                                                {d.isVencido
                                                    ? "VENCIDO"
                                                    : d.venceHoje || daysLeft === 0
                                                      ? "VENCE HOJE"
                                                      : daysLeft === 1
                                                        ? "1 DIA ÚTIL"
                                                        : `${daysLeft} DIAS ÚTEIS`}
                                            </p>
                                            <p className="text-[10px] font-bold text-foreground/30 mt-1 uppercase">
                                                {format(dateFim, "dd MMM yyyy", { locale: ptBR })}
                                            </p>
                                        </div>
                                    </div>
                                </>
                            );

                            return (
                                <Tooltip key={d.id}>
                                    <TooltipTrigger asChild>
                                        {processId ? (
                                            <Link to={`/processos/${processId}`} className={itemClassName}>
                                                {innerContent}
                                            </Link>
                                        ) : (
                                            <div className={itemClassName}>{innerContent}</div>
                                        )}
                                    </TooltipTrigger>
                                    <TooltipContent
                                        side="left"
                                        className="bg-[#001D4A] border-none text-white p-3 rounded-2xl shadow-2xl"
                                    >
                                        <p className="font-bold text-sm">{d.process?.client}</p>
                                        <p className="text-[10px] opacity-60 mt-1 uppercase tracking-widest font-bold">
                                            Nº {d.process?.number}
                                        </p>
                                        <div className="h-px bg-white/10 my-2" />
                                        <p className="text-xs font-semibold flex items-center gap-1.5">
                                            <Clock className="h-3 w-3" />
                                            Prazo: {format(dateFim, "dd/MM/yyyy")}{" "}
                                            {d.isVencido ? "(vencido)" : `(${daysLeft} dias úteis restantes)`}
                                        </p>
                                    </TooltipContent>
                                </Tooltip>
                            );
                        })
                    )}
                </CardContent>
            </Card>
        </TooltipProvider>
    );
};

export default CriticalDeadlines;
