import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Scale, CheckCircle2, AlertCircle, RefreshCw, Webhook } from "lucide-react";
import { Link } from "react-router-dom";
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
  const { data: logs, isLoading } = useProcessMonitorLogs(8);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-xl flex items-center gap-2">
            <Scale className="h-5 w-5 text-primary" />
            Consultas de processos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  const list = logs ?? [];
  const hasAny = list.length > 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="font-display text-xl flex items-center gap-2">
          <Scale className="h-5 w-5 text-primary" />
          Consultas de processos
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Monitoramento de processos (API Escavador). Atualizações são recebidas automaticamente via callback.
        </p>
      </CardHeader>
      <CardContent>
        {!hasAny ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            Nenhuma atividade registrada ainda. Processos importados receberão atualizações automaticamente via callback.
          </p>
        ) : (
          <ul className="space-y-3">
            {list.map((log: ProcessMonitorLog) => {
              const config = typeConfig[log.log_type];
              const Icon = config.icon;
              const isHighlight = log.log_type === "atualizacao_encontrada" || log.log_type === "callback_recebido";
              const isError = log.log_type === "erro_api";
              const isCallbackSource = (log.details as Record<string, unknown>)?.source === "callback";

              return (
                <li
                  key={log.id}
                  className={`flex items-start gap-3 rounded-lg border p-3 text-sm transition-all ${
                    isHighlight
                      ? "border-blue-500/30 bg-blue-500/5 shadow-sm shadow-blue-500/10"
                      : isError
                        ? "border-red-500/20 bg-red-500/5"
                        : "border-border/50 bg-muted/20"
                  }`}
                >
                  <div className={`shrink-0 mt-0.5 ${config.className} ${isHighlight ? "animate-pulse" : ""}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className={`font-medium ${isHighlight ? "text-blue-700 dark:text-blue-300" : "text-foreground"}`}>
                        {log.process_number ?? "Processo"}
                        <span className={`font-normal ml-1 ${isHighlight ? "text-blue-600/70 dark:text-blue-400/70" : "text-muted-foreground"}`}>— {config.label}</span>
                      </p>
                      {isCallbackSource && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                          <Webhook className="h-2.5 w-2.5" />
                          CALLBACK
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground mt-0.5">{log.message ?? "—"}</p>
                    <p className="text-xs text-muted-foreground mt-1">{formatLogTime(log.created_at)}</p>
                  </div>
                  {log.process_id && (
                    <Link
                      to={`/processos/${log.process_id}`}
                      className={`shrink-0 text-xs hover:underline ${isHighlight ? "text-blue-600 dark:text-blue-400 font-medium" : "text-primary"}`}
                    >
                      Ver processo
                    </Link>
                  )}
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
