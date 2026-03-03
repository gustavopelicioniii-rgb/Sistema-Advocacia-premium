import { useMemo } from "react";
import { Scale, RefreshCw, FileText, CheckCircle2, Info, Webhook } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useInbox } from "@/hooks/useInbox";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const typeStyles: Record<string, string> = {
  ai: "bg-info/10 text-info",
  process: "bg-warning/10 text-warning",
  client: "bg-success/10 text-success",
  financial: "bg-accent/10 text-accent",
  crm: "bg-primary/10 text-primary",
  document: "bg-muted",
  task: "bg-success/10 text-success",
  system: "bg-muted",
  callback: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
};

function relativeTime(date: string): string {
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return "—";
    return formatDistanceToNow(d, { addSuffix: true, locale: ptBR });
  } catch {
    return "—";
  }
}

const SmartActivity = () => {
  const { data: inboxItems } = useInbox();

  const activities = useMemo(() => {
    const list = (inboxItems ?? []).slice(0, 15).map((item) => {
      let type = "process";
      let Icon = RefreshCw;
      let isCallback = false;

      // Detectar callbacks do Escavador (movimentações via callback)
      const isEscavadorCallback = item.tipo === "Andamento" &&
        (item.titulo.toLowerCase().includes("movimentação relevante") ||
         item.descricao?.toLowerCase().includes("via callback"));

      if (isEscavadorCallback) {
        type = "callback";
        Icon = Webhook;
        isCallback = true;
      } else if (item.tipo === "Publicação") {
        type = "process";
        Icon = Scale;
      } else if (item.tipo === "Andamento") {
        type = "process";
        Icon = RefreshCw;
      } else if (item.tipo === "Documento") {
        type = "document";
        Icon = FileText;
      } else if (item.tipo === "Tarefa") {
        type = "task";
        Icon = CheckCircle2;
      } else if (item.tipo === "Sistema") {
        type = "system";
        Icon = Info;
      }
      const text = item.descricao ? `${item.titulo}: ${item.descricao.slice(0, 60)}${item.descricao.length > 60 ? "…" : ""}` : item.titulo;
      return {
        text,
        time: relativeTime(item.created_at),
        icon: Icon,
        type,
        isCallback,
        unread: !item.lido,
      };
    });
    return list;
  }, [inboxItems]);

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="font-display text-xl">Atividade Inteligente</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhuma atividade recente. Itens da caixa de entrada aparecem aqui.</p>
          ) : (
            activities.map((a, i) => (
              <div
                key={i}
                className={`flex gap-3 group cursor-pointer rounded-lg p-2 -mx-2 transition-all ${
                  a.isCallback
                    ? "bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/20 ring-1 ring-blue-500/10"
                    : "hover:bg-muted/50"
                }`}
              >
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${typeStyles[a.type] || typeStyles.process} ${a.isCallback ? "animate-pulse" : ""}`}>
                  <a.icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm group-hover:text-primary transition-colors ${a.isCallback ? "font-semibold text-blue-700 dark:text-blue-300" : "text-foreground"}`}>{a.text}</p>
                    {a.unread && (
                      <span className="h-2 w-2 shrink-0 rounded-full bg-blue-500 animate-pulse" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{a.time}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SmartActivity;
