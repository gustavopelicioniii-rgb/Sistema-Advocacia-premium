import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";
import type { UseMutationResult } from "@tanstack/react-query";

const TIPOS_ANDAMENTO = ["Movimentação", "Despacho", "Decisão", "Petição", "Outro"];

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    createAndamento: UseMutationResult<void, Error, { data: string; tipo: string; descricao: string }>;
}

export function ProcessoAndamentoDialog({ open, onOpenChange, createAndamento }: Props) {
    const [data, setData] = useState(() => format(new Date(), "yyyy-MM-dd'T'HH:mm"));
    const [tipo, setTipo] = useState("Movimentação");
    const [descricao, setDescricao] = useState("");

    const handleClose = () => {
        onOpenChange(false);
        setDescricao("");
    };

    const handleSubmit = () => {
        if (!descricao.trim()) {
            toast.error("Informe a descrição.");
            return;
        }
        createAndamento.mutate(
            { data: new Date(data).toISOString(), tipo, descricao: descricao.trim() },
            { onSuccess: handleClose },
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Novo Andamento</DialogTitle>
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
                                {TIPOS_ANDAMENTO.map((t) => (
                                    <SelectItem key={t} value={t}>
                                        {t}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label>Descrição</Label>
                        <Textarea
                            placeholder="Descreva o andamento..."
                            value={descricao}
                            onChange={(e) => setDescricao(e.target.value)}
                            rows={3}
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit} disabled={createAndamento.isPending}>
                        {createAndamento.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                        Adicionar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
