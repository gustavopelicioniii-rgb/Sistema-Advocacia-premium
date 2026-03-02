import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, Download, Scale, DollarSign, Users, TrendingUp, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    LineChart,
    Line,
} from "recharts";
import { useProcessos } from "@/hooks/useProcessos";
import { useFees } from "@/hooks/useFees";
import { useCrmStages, useCrmClients } from "@/hooks/useCrm";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const Relatorios = () => {
    const { data: processos } = useProcessos();
    const { data: fees } = useFees();
    const { data: stages } = useCrmStages();
    const { data: crmClients } = useCrmClients();

    const [expanded, setExpanded] = useState<string | null>(null);
    const toggle = (id: string) => setExpanded(expanded === id ? null : id);

    // --- Chart data builders ---

    // 1. Processos por Fase
    const processosByPhase = useMemo(() => {
        if (!processos) return [];
        const map: Record<string, number> = {};
        processos.forEach((p) => {
            const key = p.phase || "Sem fase";
            map[key] = (map[key] || 0) + 1;
        });
        return Object.entries(map).map(([name, value]) => ({ name, value }));
    }, [processos]);

    // 2. Processos por Status
    const processosByStatus = useMemo(() => {
        if (!processos) return [];
        const map: Record<string, number> = {};
        processos.forEach((p) => {
            map[p.status] = (map[p.status] || 0) + 1;
        });
        return Object.entries(map).map(([name, value]) => ({ name, value }));
    }, [processos]);

    // 3. Receita por mês (últimos 6 meses)
    const revenueByMonth = useMemo(() => {
        if (!fees) return [];
        const months: Record<string, number> = {};
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
            months[key] = 0;
        }
        fees.forEach((f) => {
            if (f.status === "Pago" && f.paid_date) {
                const d = new Date(f.paid_date);
                const key = d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
                if (key in months) months[key] += Number(f.value);
            }
        });
        return Object.entries(months).map(([name, value]) => ({ name, value }));
    }, [fees]);

    // 4. CRM Pipeline
    const pipelineData = useMemo(() => {
        if (!stages || !crmClients) return [];
        return stages.map((s) => ({
            name: s.name,
            value: crmClients.filter((c) => c.stage_id === s.id).length,
        }));
    }, [stages, crmClients]);

    // 5. Honorários por status
    const feesByStatus = useMemo(() => {
        if (!fees) return [];
        const map: Record<string, number> = {};
        fees.forEach((f) => {
            map[f.status] = (map[f.status] || 0) + Number(f.value);
        });
        return Object.entries(map).map(([name, value]) => ({ name, value }));
    }, [fees]);

    // 6. Faturamento por cliente
    const revenueByClient = useMemo(() => {
        if (!fees) return [];
        const map: Record<string, number> = {};
        fees.forEach((f) => {
            map[f.client] = (map[f.client] || 0) + Number(f.value);
        });
        return Object.entries(map)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);
    }, [fees]);

    // 7. Processos ganhos/perdidos
    const processosResult = useMemo(() => {
        if (!processos) return [];
        const concluidos = processos.filter((p) => p.status === "Concluído").length;
        const andamento = processos.filter((p) => p.status === "Em andamento").length;
        const suspensos = processos.filter((p) => p.status === "Suspenso").length;
        const aguardando = processos.filter((p) => p.status === "Aguardando prazo").length;
        return [
            { name: "Concluídos", value: concluidos },
            { name: "Em andamento", value: andamento },
            { name: "Suspensos", value: suspensos },
            { name: "Aguardando prazo", value: aguardando },
        ].filter((x) => x.value > 0);
    }, [processos]);

    // 8. Ticket médio
    const ticketMedio = useMemo(() => {
        if (!fees || fees.length === 0) return 0;
        return fees.reduce((s, f) => s + Number(f.value), 0) / fees.length;
    }, [fees]);

    // 9. Tempo médio do processo
    const tempoMedioProcesso = useMemo(() => {
        if (!processos) return 0;
        const concluidos = processos.filter((p) => p.status === "Concluído");
        if (concluidos.length === 0) return 0;
        const durations = concluidos.map((p) => {
            const start = new Date(p.created_at).getTime();
            const end = new Date(p.updated_at).getTime();
            return (end - start) / (1000 * 60 * 60 * 24);
        });
        return Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
    }, [processos]);

    const reports = useMemo(
        () => [
            {
                id: "faturamento-cliente",
                title: "Faturamento por Cliente",
                description: "Top 10 clientes por valor de honorários",
                icon: DollarSign,
                color: "bg-emerald-500/10 text-emerald-600",
                chart: (
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={revenueByClient} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis type="number" tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                            <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={120} />
                            <RechartsTooltip formatter={(v: number) => formatCurrency(v)} />
                            <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                ),
                empty: revenueByClient.length === 0,
            },
            {
                id: "resultado-processos",
                title: "Resultado dos Processos",
                description: "Distribuição de processos por resultado final",
                icon: Scale,
                color: "bg-violet-500/10 text-violet-600",
                chart: (
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={processosResult}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={100}
                                label={(e) => `${e.name}: ${e.value}`}
                            >
                                {processosResult.map((_entry, i) => (
                                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                ))}
                            </Pie>
                            <RechartsTooltip />
                        </PieChart>
                    </ResponsiveContainer>
                ),
                empty: processosResult.length === 0,
            },
            {
                id: "kpis",
                title: "KPIs do Escritório",
                description: "Ticket médio, tempo médio de processo e produtividade",
                icon: TrendingUp,
                color: "bg-cyan-500/10 text-cyan-600",
                chart: (
                    <div className="grid gap-6 sm:grid-cols-3 py-4">
                        <div className="rounded-lg border p-6 text-center">
                            <p className="text-3xl font-bold text-foreground">{formatCurrency(ticketMedio)}</p>
                            <p className="text-sm text-muted-foreground mt-1">Ticket Médio</p>
                        </div>
                        <div className="rounded-lg border p-6 text-center">
                            <p className="text-3xl font-bold text-foreground">{tempoMedioProcesso} dias</p>
                            <p className="text-sm text-muted-foreground mt-1">Tempo Médio do Processo</p>
                        </div>
                        <div className="rounded-lg border p-6 text-center">
                            <p className="text-3xl font-bold text-foreground">{processos?.length ?? 0}</p>
                            <p className="text-sm text-muted-foreground mt-1">Total de Processos</p>
                        </div>
                    </div>
                ),
                empty: false,
            },
            {
                id: "processos-fase",
                title: "Processos por Fase",
                description: "Distribuição de processos ativos por fase processual",
                icon: Scale,
                color: "bg-primary/10 text-primary",
                chart: (
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={processosByPhase}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                            <YAxis allowDecimals={false} />
                            <RechartsTooltip />
                            <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                ),
                empty: (processos?.length ?? 0) === 0,
            },
            {
                id: "processos-status",
                title: "Processos por Status",
                description: "Visão geral do status de todos os processos",
                icon: BarChart3,
                color: "bg-info/10 text-info",
                chart: (
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={processosByStatus}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={100}
                                label={(e) => `${e.name}: ${e.value}`}
                            >
                                {processosByStatus.map((_entry, i) => (
                                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                ))}
                            </Pie>
                            <RechartsTooltip />
                        </PieChart>
                    </ResponsiveContainer>
                ),
                empty: (processos?.length ?? 0) === 0,
            },
            {
                id: "receita-mensal",
                title: "Receita Mensal",
                description: "Evolução de receita nos últimos 6 meses (honorários pagos)",
                icon: DollarSign,
                color: "bg-success/10 text-success",
                chart: (
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={revenueByMonth}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                            <YAxis tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                            <RechartsTooltip formatter={(v: number) => formatCurrency(v)} />
                            <Line
                                type="monotone"
                                dataKey="value"
                                stroke="hsl(var(--success))"
                                strokeWidth={2}
                                dot={{ r: 4 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                ),
                empty: (fees?.length ?? 0) === 0,
            },
            {
                id: "pipeline-crm",
                title: "Pipeline CRM",
                description: "Clientes por etapa do pipeline de vendas",
                icon: TrendingUp,
                color: "bg-accent/10 text-accent",
                chart: (
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={pipelineData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                            <YAxis allowDecimals={false} />
                            <RechartsTooltip />
                            <Bar dataKey="value" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                ),
                empty: (crmClients?.length ?? 0) === 0,
            },
            {
                id: "honorarios-status",
                title: "Honorários por Status",
                description: "Valores financeiros agrupados por status de pagamento",
                icon: Users,
                color: "bg-warning/10 text-warning",
                chart: (
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={feesByStatus}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={100}
                                label={(e) => `${e.name}`}
                            >
                                {feesByStatus.map((_entry, i) => (
                                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                ))}
                            </Pie>
                            <RechartsTooltip formatter={(v: number) => formatCurrency(v)} />
                        </PieChart>
                    </ResponsiveContainer>
                ),
                empty: (fees?.length ?? 0) === 0,
            },
        ],
        [
            revenueByClient,
            processosResult,
            ticketMedio,
            tempoMedioProcesso,
            processosByPhase,
            processosByStatus,
            revenueByMonth,
            pipelineData,
            feesByStatus,
            processos,
            fees,
            crmClients,
        ],
    );

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="font-display text-3xl font-bold text-foreground">Relatórios</h1>
                    <p className="mt-1 text-muted-foreground">Análises e métricas do seu escritório.</p>
                </div>
            </div>

            <div className="grid gap-4">
                {reports.map((r) => (
                    <Card
                        key={r.id}
                        className="overflow-hidden transition-shadow hover:shadow-md cursor-pointer"
                        onClick={() => toggle(r.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") toggle(r.id);
                        }}
                    >
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-start gap-4">
                                    <div
                                        className={`flex h-12 w-12 items-center justify-center rounded-lg ${r.color} transition-transform ${expanded === r.id ? "scale-110" : ""}`}
                                    >
                                        <r.icon className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <p className="text-lg font-semibold text-foreground">{r.title}</p>
                                        <p className="text-sm text-muted-foreground mt-1">{r.description}</p>
                                    </div>
                                </div>
                                {expanded === r.id ? (
                                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                                ) : (
                                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                                )}
                            </div>

                            <AnimatePresence>
                                {expanded === r.id && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="mt-6 pt-4 border-t border-border">
                                            {r.empty ? (
                                                <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                                                    <r.icon className="h-10 w-10 mb-3 opacity-30" />
                                                    <p>
                                                        Sem dados para exibir. Cadastre informações nos módulos
                                                        correspondentes.
                                                    </p>
                                                </div>
                                            ) : (
                                                r.chart
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </motion.div>
    );
};

export default Relatorios;
