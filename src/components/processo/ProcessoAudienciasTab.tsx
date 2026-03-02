import { Calendar, Clock, MapPin, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { format, parseISO } from "date-fns";

interface Audiencia {
    id: string;
    tipo: string;
    data: string;
    local?: string | null;
    link_meet?: string | null;
    status: string;
}

interface Props {
    audiencias: Audiencia[];
    onAddAudiencia: () => void;
}

export function ProcessoAudienciasTab({ audiencias, onAddAudiencia }: Props) {
    if (audiencias.length === 0) {
        return (
            <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
                <Calendar className="h-10 w-10 mx-auto mb-4 opacity-20" />
                <p className="text-sm">Nenhuma audiência agendada.</p>
                <Button size="sm" variant="outline" className="mt-4" onClick={onAddAudiencia}>
                    Agendar Audiência
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {audiencias.map((aud) => (
                <Card key={aud.id}>
                    <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-start gap-4">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                                <Calendar className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-sm font-bold">{aud.tipo}</p>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" /> {format(parseISO(aud.data), "p")}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <MapPin className="h-3 w-3" /> {aud.local || "Virtual"}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <Badge variant={aud.status === "Agendada" ? "default" : "secondary"}>{aud.status}</Badge>
                            {aud.link_meet && (
                                <Button variant="outline" size="sm" asChild>
                                    <a href={aud.link_meet} target="_blank" rel="noopener noreferrer">
                                        Entrar <ExternalLink className="ml-2 h-3 w-3" />
                                    </a>
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
