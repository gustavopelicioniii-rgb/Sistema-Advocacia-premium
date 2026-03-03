import { useState } from "react";
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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useProcessosMonitoring } from "@/hooks/useProcessosMonitoring";

/**
 * Formata uma data ISO para formato pt-BR legivel.
 */
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

/**
 * Dashboard de Processos Escavador.
 *
 * Exibe:
 * - Resumo de processos importados via Escavador
 * - Status da ultima sincronizacao
 * - Botao para verificacao manual de movimentacoes
 * - Lista de processos com ultima movimentacao
 *
 * Rota: /processos/dashboard-escavador
 */
const DashboardProcessos = () => {
    const { processos, loading, error, lastChecked, atualizacoes, fetchProcessos, verificarAgora, marcarComoInativo } =
        useProcessosMonitoring();

    const [verificando, setVerificando] = useState(false);

    // Contadores derivados
    const totalProcessos = processos.length;
    const processosAtivos = processos.filter((p) => p.ativo).length;
    const processosInativos = totalProcessos - processosAtivos;

    /**
     * Dispara verificacao manual de movimentacoes via Edge Function.
     */
    const handleVerificarAgora = async () => {
        setVerificando(true);
        try {
            await verificarAgora();
        } catch {
            // Erro ja tratado no hook via toast
        } finally {
            setVerificando(false);
        }
    };

    /**
     * Recarrega a lista de processos do banco de dados.
     */
    const handleRefresh = async () => {
        try {
            await fetchProcessos();
        } catch {
            // Erro ja tratado no hook via toast
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
                            Monitore processos importados e verifique movimentacoes.
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Link to="/processos/importar">
                        <Button variant="outline">
                            <Download className="mr-2 h-4 w-4" />
                            Importar Novos
                        </Button>
                    </Link>
                    <Button onClick={handleVerificarAgora} disabled={verificando || loading}>
                        {verificando ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Verificando...
                            </>
                        ) : (
                            <>
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Verificar Agora
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Cartoes de resumo */}
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
                            <CheckCircle2 className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-foreground">{processosAtivos}</p>
                            <p className="text-xs text-muted-foreground">Ativos (Monitorados)</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="flex items-center gap-4 p-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500">
                            <AlertTriangle className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-foreground">{atualizacoes}</p>
                            <p className="text-xs text-muted-foreground">Novas Movimentacoes</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="flex items-center gap-4 p-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-500/10 text-gray-500">
                            <Clock className="h-5 w-5" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-foreground">{formatDateBR(lastChecked)}</p>
                            <p className="text-xs text-muted-foreground">Ultima Sincronizacao</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Status de sincronizacao */}
            {lastChecked && (
                <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30">
                    <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <AlertDescription className="text-blue-800 dark:text-blue-200">
                        Ultima verificacao automatica: {formatDateBR(lastChecked)}. O monitoramento automatico roda
                        1x/dia as 09h00 (UTC).
                    </AlertDescription>
                </Alert>
            )}

            {/* Mensagem de erro */}
            {error && (
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Tabela de processos importados */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                    <CardTitle className="font-display text-xl">Processos Monitorados</CardTitle>
                    <Button variant="ghost" size="sm" onClick={handleRefresh}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Atualizar Lista
                    </Button>
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
                                Use o botao &quot;Importar Novos&quot; para buscar processos via Escavador.
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
                                    <TableHead>Numero do Processo</TableHead>
                                    <TableHead>Tribunal</TableHead>
                                    <TableHead>Ultima Movimentacao</TableHead>
                                    <TableHead>Data Movimentacao</TableHead>
                                    <TableHead>Ultima Verificacao</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="w-10" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {processos.map((processo) => (
                                    <TableRow key={processo.id}>
                                        <TableCell className="font-mono text-xs">{processo.numero_processo}</TableCell>
                                        <TableCell>{processo.tribunal}</TableCell>
                                        <TableCell className="max-w-[300px] truncate text-sm">
                                            {processo.ultima_movimentacao || "Sem movimentacao"}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {formatDateBR(processo.ultima_movimentacao_data)}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {formatDateBR(processo.last_checked_at)}
                                        </TableCell>
                                        <TableCell>
                                            {processo.ativo ? (
                                                <Badge
                                                    variant="outline"
                                                    className="border-green-300 bg-green-50 text-green-700 dark:border-green-700 dark:bg-green-950/30 dark:text-green-300"
                                                >
                                                    Ativo
                                                </Badge>
                                            ) : (
                                                <Badge
                                                    variant="outline"
                                                    className="border-gray-300 bg-gray-50 text-gray-500 dark:border-gray-700 dark:bg-gray-950/30 dark:text-gray-400"
                                                >
                                                    Inativo
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {processo.ativo && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                    title="Desativar monitoramento"
                                                    onClick={() => marcarComoInativo(processo.id)}
                                                >
                                                    <XCircle className="h-4 w-4" />
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

            {/* Informacoes sobre o monitoramento automatico */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Sobre o Monitoramento Automatico</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                    <p>
                        O sistema verifica automaticamente 1x por dia (as 09h00 UTC) se ha novas movimentacoes nos
                        processos ativos.
                    </p>
                    <p>
                        Quando uma nova movimentacao e detectada, o banco de dados e atualizado e uma notificacao e
                        enviada.
                    </p>
                    <p>
                        Voce tambem pode clicar em &quot;Verificar Agora&quot; para disparar uma verificacao manual a
                        qualquer momento.
                    </p>
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default DashboardProcessos;
