import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import type { UseMutationResult } from "@tanstack/react-query";

const TIPOS_AUDIENCIA = ["Conciliação", "Instrução", "Julgamento", "Outra"];

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    createAudiencia: UseMutationResult<void, Error, { data: string; tipo: string; local?: string; link_meet?: string }>;
}

export function ProcessoAudienciaDialog({ open, onOpenChange, createAudiencia }: Props) {
    const [data, setData] = useState(() => format(new Date(), "yyyy-MM-dd'T'HH:mm"));
    const [tipo, setTipo] = useState("Conciliação");
    const [local, setLocal] = useState("");
    const [link, setLink] = useState("");

    const handleClose = () => {
        onOpenChange(false);
        setLocal("");
        setLink("");
    };

    const handleSubmit = () => {
        createAudiencia.mutate(
            {
                data: new Date(data).toISOString(),
                tipo,
                local: local.trim() || undefined,
                link_meet: link.trim() || undefined,
            },
            { onSuccess: handleClose },
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Agendar Audiência</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div>
                        <Label>Data e hora</Label>
                        <Input type="datetime-local" value={data} onChange={(e) => setData(e.target.value)} />
                    </div>
                    <div>
                        <Label>Tipo</Label>
                        <Select value={tipo} onValueChange={setTipo}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {TIPOS_AUDIENCIA.map((t) => (
                                    <SelectItem key={t} value={t}>
                                        {t}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label>Local (opcional)</Label>
                        <Input
                            placeholder="Ex: Sala 1, Fórum"
                            value={local}
                            onChange={(e) => setLocal(e.target.value)}
                        />
                    </div>
                    <div>
                        <Label>Link Meet / Zoom (opcional)</Label>
                        <Input placeholder="https://..." value={link} onChange={(e) => setLink(e.target.value)} />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit} disabled={createAudiencia.isPending}>
                        {createAudiencia.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                        Agendar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
