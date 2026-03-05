import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Scale, CheckCircle2, AlertCircle, RefreshCw, Webhook } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useProcessMonitorLogs } from "@/hooks/useProcessMonitorLogs";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { ProcessMonitorLog, ProcessMonitorLogType } from "@/hooks/useProcessMonitorLogs";

function formatLogTime(dateStr: string) {
    try {
        return formatDistanceToNow(new Date(dateStr), { addSuffix: true, locale: ptBR });
    } catch {
        return "—";
    }
}

const typeConfig: Record<ProcessMonitorLogType, { label: string; icon: typeof Scale; className: string }> = {
    consulta_realizada: {
        label: "Consulta realizada",
        icon: RefreshCw,
        className: "text-muted-foreground",
    },
    atualizacao_encontrada: {
        label: "Atualização encontrada",
        icon: CheckCircle2,
        className: "text-success",
    },
    erro_api: {
        label: "Erro na API",
        icon: AlertCircle,
        className: "text-destructive",
    },
    callback_recebido: {
        label: "Callback recebido",
        icon: Webhook,
        className: "text-blue-500",
    },
};

const ProcessMonitorResults = () => {
    const navigate = useNavigate();
    const { data: logs, isLoading } = useProcessMonitorLogs(8);

    if (isLoading) {
        return (
            <Card className="glass-card shadow-none border-none">
                <CardHeader className="pb-2">
                    <CardTitle className="text-xl flex items-center gap-2 text-[#001D4A]">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/5">
                            <Scale className="h-4 w-4 text-primary" />
                        </div>
                        <span>Consultas de processos</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground text-center py-6">
                        <span>Carregando...</span>
                    </p>
                </CardContent>
            </Card>
        );
    }

    const list = logs ?? [];
    const hasAny = list.length > 0;

    return (
        <Card className="glass-card shadow-none border-none">
            <CardHeader className="pb-3 border-b border-black/[0.03]">
                <CardTitle className="text-xl flex items-center gap-2 text-[#001D4A]">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/5">
                        <Scale className="h-4 w-4 text-primary" />
                    </div>
                    <span>Consultas de processos</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
                {!hasAny ? (
                    <p className="text-sm text-muted-foreground py-6 text-center">
                        <span>Nenhuma atividade registrada ainda.</span>
                    </p>
                ) : (
                    <ul className="space-y-4">
                        {list.map((log: ProcessMonitorLog) => {
                            const config = typeConfig[log.log_type];
                            const Icon = config.icon;
                            const isHighlight =
                                log.log_type === "atualizacao_encontrada" || log.log_type === "callback_recebido";
                            const isError = log.log_type === "erro_api";
                            const isCallbackSource = (log.details as Record<string, unknown>)?.source === "callback";

                            return (
                                <li
                                    key={log.id}
                                    className={`flex items-start gap-3 rounded-2xl p-4 transition-all hover:scale-[1.01] cursor-pointer shadow-none ${
                                        isHighlight
                                            ? "glass border-blue-500/10 shadow-sm shadow-blue-500/5 hover:border-blue-500/30"
                                            : isError
                                              ? "bg-red-500/5 border border-red-500/10 hover:border-red-500/30"
                                              : "bg-white/40 border border-black/[0.03] hover:border-primary/20"
                                    }`}
                                    onClick={() => log.process_id && navigate(`/processos/${log.process_id}`)}
                                >
                                    <div
                                        className={`shrink-0 mt-0.5 h-8 w-8 rounded-full flex items-center justify-center bg-white/50 ${config.className} ${isHighlight ? "animate-pulse" : ""}`}
                                    >
                                        <Icon className="h-4 w-4" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <p
                                                className={`text-sm font-bold ${isHighlight ? "text-blue-700/80 dark:text-blue-300" : "text-[#001D4A]"}`}
                                            >
                                                <span>{log.process_number ?? "Processo"}</span>
                                                <span
                                                    className={`font-medium ml-1 text-[10px] uppercase tracking-wider ${isHighlight ? "text-blue-600/50 dark:text-blue-400/50" : "text-foreground/30"}`}
                                                >
                                                    — {config.label}
                                                </span>
                                            </p>
                                            {isCallbackSource && (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-[9px] font-bold text-blue-600 dark:text-blue-400">
                                                    <Webhook className="h-2.5 w-2.5" />
                                                    <span>CALLBACK</span>
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-foreground/70 mt-1.5 leading-relaxed line-clamp-2">
                                            <span>{log.message ?? "—"}</span>
                                        </p>
                                        <p className="text-[10px] font-bold text-foreground/30 uppercase tracking-[0.2em] mt-2">
                                            <span>{formatLogTime(log.created_at)}</span>
                                        </p>
                                    </div>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </CardContent>
        </Card>
    );
};

export default ProcessMonitorResults;
