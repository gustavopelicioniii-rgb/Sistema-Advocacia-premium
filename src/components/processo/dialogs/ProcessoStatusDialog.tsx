import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { UseMutationResult } from "@tanstack/react-query";
import type { StatusProcesso } from "@/hooks/useProcessoDetail";

const STATUS_PROCESSO = ["Em andamento", "Aguardando prazo", "Concluído", "Suspenso"] as const;

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentStatus: StatusProcesso;
    updateStatus: UseMutationResult<void, Error, StatusProcesso>;
}

export function ProcessoStatusDialog({ open, onOpenChange, currentStatus, updateStatus }: Props) {
    const [novoStatus, setNovoStatus] = useState<StatusProcesso>(currentStatus);

    const handleSubmit = () => {
        updateStatus.mutate(novoStatus, { onSuccess: () => onOpenChange(false) });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle>Alterar status do processo</DialogTitle>
                </DialogHeader>
                <div className="py-2">
                    <Select value={novoStatus} onValueChange={(v) => setNovoStatus(v as StatusProcesso)}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {STATUS_PROCESSO.map((s) => (
                                <SelectItem key={s} value={s}>
                                    {s}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit} disabled={updateStatus.isPending}>
                        {updateStatus.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                        Salvar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
