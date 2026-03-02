import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AndamentoItem {
    id: string;
    tipo: string;
    data: string;
    descricao: string;
}

interface Props {
    timeline: AndamentoItem[];
    onAddAndamento: () => void;
}

export function ProcessoTimelineTab({ timeline, onAddAndamento }: Props) {
    return (
        <>
            <div className="mb-4">
                <h3 className="font-display font-semibold text-foreground">Linha do tempo do processo</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                    Andamentos, documentos, audiências e notas em ordem cronológica.
                </p>
            </div>
            <div className="relative pl-6 space-y-8 before:absolute before:left-0 before:top-2 before:bottom-2 before:w-px before:bg-border">
                {timeline.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">
                        <p className="mb-4">
                            Nenhum andamento registrado. Adicione andamentos para construir a timeline.
                        </p>
                        <Button size="sm" variant="outline" onClick={onAddAndamento}>
                            <Plus className="mr-2 h-4 w-4" /> Novo Andamento
                        </Button>
                    </div>
                ) : (
                    timeline.map((item) => (
                        <div key={item.id} className="relative">
                            <div className="absolute -left-6 top-1.5 h-3 w-3 rounded-full border-2 border-background bg-primary shadow-[0_0_0_2px_theme(colors.border)]" />
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-bold text-primary uppercase">{item.tipo}</span>
                                    <span className="text-xs text-muted-foreground">
                                        {format(parseISO(item.data), "dd 'de' MMM 'às' HH:mm", { locale: ptBR })}
                                    </span>
                                </div>
                                <p className="text-sm font-medium text-foreground">{item.descricao}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </>
    );
}
