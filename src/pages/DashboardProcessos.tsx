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
} from "lucide-react";
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
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Header */}
            <div className="flex items-end justify-between">
                <div className="flex items-center gap-4">
                    <Link to="/processos">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="font-display text-3xl font-bold text-foreground">Dashboard Escavador</h1>
                        <p className="mt-1 text-muted-foreground">
                            Monitoramento de processos via callback automático.
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        className="bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 border-blue-200"
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
                        Sincronizar Todos
                    </Button>
                    <Link to="/processos/importar">
                        <Button variant="outline">
                            <Download className="mr-2 h-4 w-4" />
                            Importar Novos
                        </Button>
                    </Link>
                    <Button variant="outline" onClick={handleRefresh} disabled={loading}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Atualizar Lista
                    </Button>
                </div>
            </div>

            {/* Cartões de resumo */}
            <div className="grid gap-4 sm:grid-cols-4">
                <Card>
                    <CardContent className="flex items-center gap-4 p-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                            <Scale className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-foreground">{totalProcessos}</p>
                            <p className="text-xs text-muted-foreground">Total Importados</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="flex items-center gap-4 p-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10 text-green-500">
                            <Webhook className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-foreground">{monitorados}</p>
                            <p className="text-xs text-muted-foreground">Com Callback Ativo</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="flex items-center gap-4 p-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/10 text-yellow-500">
                            <Clock className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-foreground">{pendentes}</p>
                            <p className="text-xs text-muted-foreground">Aguardando Callback</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="flex items-center gap-4 p-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10 text-red-500">
                            <AlertTriangle className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-foreground">{comErro}</p>
                            <p className="text-xs text-muted-foreground">Com Erro</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Status de sincronização */}
            {lastChecked && (
                <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30">
                    <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <AlertDescription className="text-blue-800 dark:text-blue-200">
                        Dados carregados em: {formatDateBR(lastChecked)}. Atualizações são recebidas automaticamente via
                        callback do Escavador.
                    </AlertDescription>
                </Alert>
            )}

            {error && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Tabela de processos */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                    <CardTitle className="font-display text-xl">Processos Monitorados</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            <span className="ml-3 text-muted-foreground">Carregando processos...</span>
                        </div>
                    ) : processos.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Scale className="h-12 w-12 text-muted-foreground/50" />
                            <p className="mt-4 text-lg font-medium text-foreground">Nenhum processo importado ainda</p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Use o botão &quot;Importar Novos&quot; para buscar processos via Escavador.
                            </p>
                            <Link to="/processos/importar">
                                <Button className="mt-4">
                                    <Download className="mr-2 h-4 w-4" />
                                    Importar Processos
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Número do Processo</TableHead>
                                    <TableHead>Tribunal</TableHead>
                                    <TableHead>Última Movimentação</TableHead>
                                    <TableHead>Última Verificação</TableHead>
                                    <TableHead>Status Callback</TableHead>
                                    <TableHead>Monitoramento</TableHead>
                                    <TableHead className="w-10" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {processos.map((processo) => (
                                    <TableRow key={processo.id}>
                                        <TableCell className="font-mono text-xs">{processo.number}</TableCell>
                                        <TableCell>{processo.court}</TableCell>
                                        <TableCell className="max-w-[300px] truncate text-sm">
                                            {processo.last_movement || "Sem movimentação"}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {formatDateBR(processo.last_checked_at)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="outline"
                                                className={getStatusInfo(processo.status_atualizacao).className}
                                                translate="no"
                                            >
                                                {getStatusInfo(processo.status_atualizacao).label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="outline"
                                                className={
                                                    processo.monitoramento_ativo
                                                        ? "border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-950/30 dark:text-green-300"
                                                        : "border-gray-300 bg-gray-50 text-gray-500 dark:border-gray-700 dark:bg-gray-950/30 dark:text-gray-400"
                                                }
                                                translate="no"
                                            >
                                                {processo.monitoramento_ativo && (
                                                    <CheckCircle2 className="mr-1 h-3 w-3" />
                                                )}
                                                {processo.monitoramento_ativo ? "Ativo" : "Inativo"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {processo.monitoramento_ativo ? (
                                                <Button
                                                    key={`btn-off-${processo.id}`}
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                    title="Desativar monitoramento"
                                                    onClick={() => marcarComoInativo(processo.id)}
                                                >
                                                    <XCircle className="h-4 w-4" />
                                                </Button>
                                            ) : (
                                                <Button
                                                    key={`btn-on-${processo.id}`}
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
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
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Sobre o Monitoramento Automático</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                    <p>
                        O sistema usa callbacks automáticos da API Escavador V2. Ao importar um processo, uma
                        solicitação de atualização é enviada com callback habilitado.
                    </p>
                    <p>
                        Quando o Escavador finaliza a análise do processo, envia um callback automaticamente com as
                        novas movimentações. Isso elimina a necessidade de polling diário.
                    </p>
                    <p>
                        Um health-check semanal verifica processos com status inconsistente e re-solicita atualização
                        quando necessário.
                    </p>
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default DashboardProcessos;
