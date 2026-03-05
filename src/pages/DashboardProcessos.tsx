import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
    RefreshCw,
    Scale,
    Clock,
    CheckCircle2,
    AlertTriangle,
    ArrowLeft,
    Download,
    XCircle,
    Loader2,
    Webhook,
    Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useProcessosMonitoring } from "@/hooks/useProcessosMonitoring";

const formatDateBR = (dateStr: string | null) => {
    if (!dateStr) return "Nunca";
    return new Date(dateStr).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const getStatusInfo = (status: string) => {
    switch (status) {
        case "SUCCESS":
            return {
                label: "Atualizado",
                className:
                    "border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-950/30 dark:text-green-300",
            };
        case "PENDING":
            return {
                label: "Pendente",
                className:
                    "border-yellow-300 bg-yellow-50 text-yellow-700 dark:border-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-300",
            };
        case "ERROR":
            return {
                label: "Erro",
                className:
                    "border-red-300 bg-red-50 text-red-700 dark:border-red-700 dark:bg-red-950/30 dark:text-red-300",
            };
        case "NOT_FOUND":
            return {
                label: "Não encontrado",
                className:
                    "border-gray-300 bg-gray-50 text-gray-500 dark:border-gray-700 dark:bg-gray-950/30 dark:text-gray-400",
            };
        default:
            return {
                label: "Aguardando",
                className:
                    "border-gray-300 bg-gray-50 text-gray-500 dark:border-gray-700 dark:bg-gray-950/30 dark:text-gray-400",
            };
    }
};

const DashboardProcessos = () => {
    const { processos, loading, error, lastChecked, fetchProcessos, marcarComoInativo, marcarComoAtivo } =
        useProcessosMonitoring();

    const totalProcessos = processos.length;
    const monitorados = processos.filter((p) => p.monitoramento_ativo).length;
    const pendentes = processos.filter((p) => p.status_atualizacao === "PENDING").length;
    const comErro = processos.filter((p) => p.status_atualizacao === "ERROR").length;

    const handleRefresh = async () => {
        try {
            await fetchProcessos();
        } catch {
            // Erro tratado no hook via toast
        }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 pb-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="flex items-center gap-5">
                    <Link to="/processos">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-10 w-10 rounded-full hover:bg-white/40 border border-black/[0.03]"
                        >
                            <ArrowLeft className="h-5 w-5 text-[#001D4A]" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-[#001D4A] tracking-tight">
                            <span>Painel Escavador</span>
                        </h1>
                        <p className="text-sm font-medium text-foreground/40 mt-1">
                            <span>Monitoramento de processos via callback automático.</span>
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button
                        variant="ghost"
                        className="bg-primary/5 text-primary hover:bg-primary/10 border border-primary/10 rounded-xl font-bold h-10"
                        onClick={async () => {
                            try {
                                const response = await fetch(
                                    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/migrar-monitoramento-callback`,
                                    {
                                        method: "POST",
                                        headers: {
                                            "Content-Type": "application/json",
                                            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
                                            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                                        },
                                        body: JSON.stringify({}),
                                    },
                                );
                                if (response.ok) {
                                    alert("Sincronização iniciada para todos os processos!");
                                    handleRefresh();
                                } else {
                                    alert("Erro ao iniciar sincronização.");
                                }
                            } catch (e) {
                                alert("Erro de conexão.");
                            }
                        }}
                    >
                        <Webhook className="mr-2 h-4 w-4" />
                        <span>Sincronizar todos</span>
                    </Button>
                    <Link to="/processos/importar">
                        <Button
                            variant="ghost"
                            className="bg-white/40 hover:bg-white/60 border border-black/[0.05] rounded-xl font-bold h-10"
                        >
                            <Download className="mr-2 h-4 w-4" />
                            <span>Importar Novos</span>
                        </Button>
                    </Link>
                    <Button
                        variant="ghost"
                        className="bg-white/40 hover:bg-white/60 border border-black/[0.05] rounded-xl font-bold h-10"
                        onClick={handleRefresh}
                        disabled={loading}
                    >
                        <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
                        <span>Atualizar Lista</span>
                    </Button>
                </div>
            </div>

            {/* Cartões de resumo */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="glass-card border-none shadow-none">
                    <CardContent className="flex items-center gap-4 p-6">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#001D4A]/5 text-[#001D4A]">
                            <Scale className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-[#001D4A] tracking-tighter">
                                <span>{totalProcessos}</span>
                            </p>
                            <p className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest mt-0.5">
                                <span>Total de importados</span>
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-card border-none shadow-none">
                    <CardContent className="flex items-center gap-4 p-6">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600">
                            <Webhook className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-[#001D4A] tracking-tighter">
                                <span>{monitorados}</span>
                            </p>
                            <p className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest mt-0.5">
                                <span>Com Callback Ativo</span>
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-card border-none shadow-none">
                    <CardContent className="flex items-center gap-4 p-6">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
                            <Clock className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-[#001D4A] tracking-tighter">
                                <span>{pendentes}</span>
                            </p>
                            <p className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest mt-0.5">
                                <span>Aguardando Callback</span>
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-card border-none shadow-none">
                    <CardContent className="flex items-center gap-4 p-6">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-600">
                            <AlertTriangle className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-[#001D4A] tracking-tighter">
                                <span>{comErro}</span>
                            </p>
                            <p className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest mt-0.5">
                                <span>Com Erro</span>
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Status de sincronização */}
            {lastChecked && (
                <div className="glass rounded-[20px] p-4 flex items-center gap-3 border-blue-500/10 bg-blue-500/[0.02]">
                    <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                        <Clock className="h-4 w-4 text-blue-600" />
                    </div>
                    <p className="text-xs font-medium text-blue-900/60 leading-none">
                        <span>
                            Dados carregados em: {formatDateBR(lastChecked)}. As atualizações são recebidas
                            automaticamente via callback do Escavador.
                        </span>
                    </p>
                </div>
            )}

            {error && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Tabela de processos */}
            <Card className="glass-card border-none shadow-none overflow-hidden">
                <CardHeader className="pb-4 border-b border-black/[0.03]">
                    <CardTitle className="text-xl text-[#001D4A]">
                        <span>Processos Monitorados</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            <span className="ml-3 text-muted-foreground">
                                <span>Carregando processos...</span>
                            </span>
                        </div>
                    ) : processos.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Scale className="h-12 w-12 text-muted-foreground/50" />
                            <p className="mt-4 text-lg font-medium text-foreground">
                                <span>Nenhum processo importado ainda</span>
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                <span>Use o botão &quot;Importar Novos&quot; para buscar processos via Escavador.</span>
                            </p>
                            <Link to="/processos/importar">
                                <Button className="mt-4 glass hover:bg-white/40">
                                    <Download className="mr-2 h-4 w-4" />
                                    <span>Importar Processos</span>
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow className="hover:bg-transparent border-black/[0.03]">
                                    <TableHead className="py-4 px-6 text-[10px] font-bold text-foreground/30 uppercase tracking-widest">
                                        <span>Cliente</span>
                                    </TableHead>
                                    <TableHead className="py-4 text-[10px] font-bold text-foreground/30 uppercase tracking-widest text-center">
                                        <span>Processo</span>
                                    </TableHead>
                                    <TableHead className="py-4 text-[10px] font-bold text-foreground/30 uppercase tracking-widest text-center">
                                        <span>Tribunal</span>
                                    </TableHead>
                                    <TableHead className="py-4 text-[10px] font-bold text-foreground/30 uppercase tracking-widest text-center">
                                        <span>Última Movimentação</span>
                                    </TableHead>
                                    <TableHead className="py-4 text-[10px] font-bold text-foreground/30 uppercase tracking-widest text-center">
                                        <span>Verificação</span>
                                    </TableHead>
                                    <TableHead className="py-4 text-[10px] font-bold text-foreground/30 uppercase tracking-widest text-center">
                                        <span>Status</span>
                                    </TableHead>
                                    <TableHead className="py-4 text-[10px] font-bold text-foreground/30 uppercase tracking-widest text-center">
                                        <span>Monitoramento</span>
                                    </TableHead>
                                    <TableHead className="py-4 w-10" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {processos.map((processo) => (
                                    <TableRow
                                        key={`proc-mon-${processo.id}`}
                                        className="hover:bg-primary/[0.02] border-black/[0.03] transition-colors"
                                    >
                                        <TableCell className="py-4 px-6 font-bold text-xs text-[#001D4A]">
                                            <div className="flex flex-col">
                                                <span>{processo.client}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-4 text-center font-mono text-[10px] font-bold text-[#001D4A]/50">
                                            <span>{processo.number}</span>
                                        </TableCell>
                                        <TableCell className="text-center font-medium text-xs">
                                            <span>{processo.court}</span>
                                        </TableCell>
                                        <TableCell className="max-w-[250px] truncate text-xs text-foreground/70 font-medium">
                                            <span>{processo.last_movement || "—"}</span>
                                        </TableCell>
                                        <TableCell className="text-center text-[11px] font-bold text-foreground/30 uppercase">
                                            <span>{formatDateBR(processo.last_checked_at)}</span>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge
                                                variant="outline"
                                                className={cn(
                                                    "rounded-full px-3 py-0.5 font-bold text-[10px] uppercase tracking-wider",
                                                    getStatusInfo(processo.status_atualizacao).className,
                                                )}
                                                translate="no"
                                            >
                                                <span>{getStatusInfo(processo.status_atualizacao).label}</span>
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge
                                                variant="outline"
                                                className={cn(
                                                    "rounded-full px-3 py-0.5 font-bold text-[10px] uppercase tracking-wider",
                                                    processo.monitoramento_ativo
                                                        ? "border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300"
                                                        : "border-gray-200 bg-gray-50 text-gray-400 dark:border-gray-700 dark:bg-gray-950/30 dark:text-gray-400",
                                                )}
                                                translate="no"
                                            >
                                                <span>{processo.monitoramento_ativo ? "Ativo" : "Inativo"}</span>
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="p-0 text-center">
                                            {processo.monitoramento_ativo ? (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-rose-500 rounded-full"
                                                    title="Desativar monitoramento"
                                                    onClick={() => marcarComoInativo(processo.id)}
                                                >
                                                    <XCircle className="h-4 w-4" />
                                                </Button>
                                            ) : (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-full"
                                                    title="Ativar monitoramento"
                                                    onClick={() => marcarComoAtivo(processo.id)}
                                                >
                                                    <CheckCircle2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Informações sobre o monitoramento */}
            <Card className="glass-card border-none shadow-none bg-primary/[0.01]">
                <CardHeader>
                    <CardTitle className="text-sm font-bold text-[#001D4A]/60 flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        <span>Sobre o Monitoramento Automático</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-xs text-foreground/50 font-medium leading-relaxed">
                    <p>
                        <span>
                            O sistema utiliza os <strong>webhooks (callbacks)</strong> da API Escavador V2. Isso
                            significa que, ao invés do sistema ficar perguntando ao tribunal o tempo todo, o Escavador
                            &quot;avisa&quot; o Smart Case Mate assim que surgir uma novidade relevante.
                        </span>
                    </p>
                    <p>
                        <span>
                            Essa tecnologia reduz significativamente o tempo de resposta e garante que você receba
                            notificações quase em tempo real sobre movimentações críticas.
                        </span>
                    </p>
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default DashboardProcessos;
