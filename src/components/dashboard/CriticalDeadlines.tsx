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
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                    <CardTitle className="font-display text-xl flex items-center gap-2">
                        🔴 Prazos processuais
                    </CardTitle>
                    <Button variant="ghost" size="sm" asChild>
                        <Link to="/processos">
                            Ver todos <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                        </Link>
                    </Button>
                </CardHeader>
                <CardContent className="space-y-2.5">
                    <p className="text-xs text-foreground/75 mb-2">
                        Contagem em dias úteis (feriados forenses descontados). Alerta antes do vencimento.
                    </p>
                    {activeDeadlines.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            Nenhum prazo pendente para os próximos dias.
                        </div>
                    ) : (
                        activeDeadlines.map((d) => {
                            const dateFim = d.dateFim;
                            const daysLeft = d.diasUteisRestantes;
                            const isUrgent = daysLeft <= 3 || d.isVencido;
                            const processId = "process_id" in d ? (d as { process_id?: string }).process_id : undefined;
                            const itemClassName = `flex items-center justify-between rounded-lg border p-4 transition-all hover:scale-[1.005] cursor-pointer ${getDaysLeftBg(daysLeft)} ${processId ? "block hover:opacity-90" : ""}`;
                            const processValue = d.process?.value ?? 0;

                            const innerContent = (
                                <>
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div
                                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${isUrgent ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground"}`}
                                        >
                                            <Clock className="h-5 w-5" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-foreground truncate">
                                                {d.process?.client || "Cliente não informado"}
                                            </p>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {d.process?.number || "Processo s/n"}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        {processValue > 0 && (
                                            <div className="hidden sm:flex items-center gap-1.5 rounded-md bg-accent/10 px-2.5 py-1.5">
                                                <DollarSign className="h-3.5 w-3.5 text-accent" />
                                                <span className="text-xs font-bold text-accent">
                                                    {formatCurrency(processValue)}
                                                </span>
                                            </div>
                                        )}
                                        <Badge variant={isUrgent ? "destructive" : "secondary"}>{d.titulo}</Badge>
                                        <div className="text-right">
                                            <p className={`text-sm ${getDaysLeftColor(daysLeft)}`}>
                                                {d.isVencido
                                                    ? "VENCIDO"
                                                    : d.venceHoje || daysLeft === 0
                                                      ? "VENCE HOJE"
                                                      : daysLeft === 1
                                                        ? "1 dia útil"
                                                        : `${daysLeft} dias úteis`}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
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
                                    <TooltipContent side="left" className="max-w-xs">
                                        <p className="font-semibold">
                                            {d.process?.client} – {d.titulo}
                                        </p>
                                        <p className="text-xs mt-1">Nº {d.process?.number}</p>
                                        <p className="text-xs mt-1">
                                            Prazo: {format(dateFim, "dd/MM/yyyy")}{" "}
                                            {d.isVencido ? "(vencido)" : `(${daysLeft} dias úteis restantes)`}
                                        </p>
                                        {processValue > 0 && (
                                            <p className="text-xs mt-1 font-semibold">
                                                💰 Honorários vinculados: {formatCurrency(processValue)}
                                            </p>
                                        )}
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
