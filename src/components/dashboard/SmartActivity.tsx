import { useMemo } from "react";
import { Scale, RefreshCw, FileText, CheckCircle2, Info, Webhook } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useInbox } from "@/hooks/useInbox";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

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
    const navigate = useNavigate();
    const { data: inboxItems } = useInbox();

    const activities = useMemo(() => {
        const list = (inboxItems ?? []).slice(0, 15).map((item) => {
            let type = "process";
            let Icon = RefreshCw;
            let isCallback = false;
            let path = "/processos";

            // Detectar callbacks do Escavador (movimentações via callback)
            const isEscavadorCallback =
                item.tipo === "Andamento" &&
                (item.titulo.toLowerCase().includes("movimentação relevante") ||
                    item.descricao?.toLowerCase().includes("via callback"));

            if (isEscavadorCallback) {
                type = "callback";
                Icon = Webhook;
                isCallback = true;
                path = "/processos/escavador";
            } else if (item.tipo === "Publicação") {
                type = "process";
                Icon = Scale;
                path = "/publicacoes";
            } else if (item.tipo === "Andamento") {
                type = "process";
                Icon = RefreshCw;
                path = "/processos";
            } else if (item.tipo === "Documento") {
                type = "document";
                Icon = FileText;
                path = "/documentos";
            } else if (item.tipo === "Tarefa") {
                type = "task";
                Icon = CheckCircle2;
                path = "/agenda";
            } else if (item.tipo === "Sistema") {
                type = "system";
                Icon = Info;
                path = "/inbox";
            }
            const text = item.descricao
                ? `${item.titulo}: ${item.descricao.slice(0, 60)}${item.descricao.length > 60 ? "…" : ""}`
                : item.titulo;
            return {
                text,
                time: relativeTime(item.created_at),
                icon: Icon,
                type,
                isCallback,
                unread: !item.lido,
                path,
            };
        });
        return list;
    }, [inboxItems]);

    return (
        <Card className="glass-card border-none shadow-none">
            <CardHeader className="pb-4">
                <CardTitle className="text-xl text-[#001D4A]">Atividade Inteligente</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {activities.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-6">
                            <span>Nenhuma atividade recente. Itens da caixa de entrada aparecem aqui.</span>
                        </p>
                    ) : (
                        activities.map((a, i) => (
                            <div
                                key={`activity-${i}`}
                                className={`flex gap-3 group cursor-pointer rounded-xl p-2.5 transition-all ${
                                    a.unread ? "bg-primary/[0.03]" : "hover:bg-white/20"
                                } ${a.isCallback ? "glass border-blue-500/10 shadow-sm" : ""}`}
                                onClick={() => navigate(a.path)}
                            >
                                <div
                                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${typeStyles[a.type] || typeStyles.process} ${a.isCallback ? "animate-pulse" : ""}`}
                                >
                                    <a.icon className="h-4 w-4" />
                                </div>
                                <div className="min-w-0 flex-1 py-0.5">
                                    <div className="flex items-start justify-between gap-2">
                                        <p
                                            className={`text-sm tracking-tight leading-tight group-hover:text-primary transition-colors ${a.isCallback ? "font-bold text-blue-700/80 dark:text-blue-300" : "text-foreground/80 font-medium"}`}
                                        >
                                            <span>{a.text}</span>
                                        </p>
                                        {a.unread && (
                                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500 mt-1.5 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                                        )}
                                    </div>
                                    <p className="text-[10px] font-bold text-foreground/30 uppercase tracking-widest mt-1">
                                        <span>{a.time}</span>
                                    </p>
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
