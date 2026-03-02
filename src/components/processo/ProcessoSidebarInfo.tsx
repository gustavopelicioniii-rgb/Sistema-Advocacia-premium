import { Hash, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

interface Processo {
    subject?: string | null;
    class?: string | null;
    value: number;
    phase?: string | null;
    active_party?: string | null;
    client: string;
    passive_party?: string | null;
}

interface Props {
    processo: Processo;
}

export function ProcessoSidebarInfo({ processo }: Props) {
    return (
        <div className="space-y-6 min-w-0">
            <Card className="min-w-0 overflow-hidden">
                <CardHeader className="min-w-0">
                    <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
                        <Hash className="h-4 w-4 shrink-0" /> Detalhes do Caso
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label className="text-[10px] text-muted-foreground uppercase">Assunto</Label>
                        <p className="text-sm font-medium">{processo.subject || "Não informado"}</p>
                    </div>
                    <div>
                        <Label className="text-[10px] text-muted-foreground uppercase">Classe</Label>
                        <p className="text-sm font-medium">{processo.class || "Não informado"}</p>
                    </div>
                    <div>
                        <Label className="text-[10px] text-muted-foreground uppercase">Valor da Causa</Label>
                        <p className="text-sm font-bold text-primary">
                            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
                                processo.value,
                            )}
                        </p>
                    </div>
                    <div>
                        <Label className="text-[10px] text-muted-foreground uppercase">Fase Atual</Label>
                        <p className="text-sm font-medium">{processo.phase || "Não informada"}</p>
                    </div>
                </CardContent>
            </Card>

            <Card className="min-w-0 overflow-hidden">
                <CardHeader className="min-w-0">
                    <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
                        <User className="h-4 w-4 shrink-0" /> Partes Envolvidas
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 min-w-0">
                    <div>
                        <Label className="text-[10px] text-info uppercase">Polo Ativo</Label>
                        <p className="text-sm font-medium">{processo.active_party || processo.client}</p>
                    </div>
                    <div className="flex justify-center py-1">
                        <div className="h-px w-full bg-border relative">
                            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-[8px] font-bold text-muted-foreground uppercase">
                                vs
                            </span>
                        </div>
                    </div>
                    <div>
                        <Label className="text-[10px] text-destructive uppercase">Polo Passivo</Label>
                        <p className="text-sm font-medium">{processo.passive_party || "Não informado"}</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
