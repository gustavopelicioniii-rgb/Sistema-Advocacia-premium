import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateFee, useUpdateFee, type Fee, type FeeInsert, type PaymentMethod } from "@/hooks/useFees";
import { useAuth } from "@/contexts/AuthContext";

interface FeeModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    fee?: Fee | null;
}

export default function FeeModal({ open, onOpenChange, fee }: FeeModalProps) {
    const { user } = useAuth();
    const createMutation = useCreateFee();
    const updateMutation = useUpdateFee();
    const isEditing = !!fee;

    const [form, setForm] = useState({
        client: fee?.client ?? "",
        process_number: fee?.process_number ?? "",
        description: fee?.description ?? "",
        value: fee?.value ?? 0,
        status: fee?.status ?? ("Pendente" as Fee["status"]),
        due_date: fee?.due_date ?? (null as string | null),
        paid_date: fee?.paid_date ?? (null as string | null),
        payment_method: (fee?.payment_method ?? "a_vista") as PaymentMethod,
        entrada_value: fee?.entrada_value ?? (null as number | null),
        installments: fee?.installments ?? (null as number | null),
    });

    const set = (field: string, value: string | number | null) => setForm((prev) => ({ ...prev, [field]: value }));

    useEffect(() => {
        if (!open) return;
        setForm({
            client: fee?.client ?? "",
            process_number: fee?.process_number ?? "",
            description: fee?.description ?? "",
            value: fee?.value ?? 0,
            status: fee?.status ?? "Pendente",
            due_date: fee?.due_date ?? null,
            paid_date: fee?.paid_date ?? null,
            payment_method: (fee?.payment_method ?? "a_vista") as PaymentMethod,
            entrada_value: fee?.entrada_value ?? null,
            installments: fee?.installments ?? null,
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, fee?.id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.client) return;

        const payload = {
            ...form,
            payment_method: form.payment_method,
            entrada_value: form.entrada_value ?? null,
            installments: form.installments ?? null,
        };
        if (isEditing && fee) {
            await updateMutation.mutateAsync({ id: fee.id, ...payload, owner_id: fee.owner_id });
        } else {
            const newFee: FeeInsert = { ...payload, owner_id: user?.id ?? null };
            await createMutation.mutateAsync(newFee);
        }
        onOpenChange(false);
    };

    const isPending = createMutation.isPending || updateMutation.isPending;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="max-w-md"
                onInteractOutside={(e) => e.preventDefault()}
                onPointerDownOutside={(e) => e.preventDefault()}
            >
                <DialogHeader>
                    <DialogTitle className="font-display text-xl">
                        {isEditing ? "Editar Honorário" : "Novo Honorário"}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="client">Cliente *</Label>
                        <Input
                            id="client"
                            placeholder="Nome do cliente"
                            value={form.client}
                            onChange={(e) => set("client", e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="process_number">Processo</Label>
                        <Input
                            id="process_number"
                            placeholder="0012345-67.2024"
                            value={form.process_number}
                            onChange={(e) => set("process_number", e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Descrição</Label>
                        <Input
                            id="description"
                            placeholder="Honorários advocatícios, consulta..."
                            value={form.description}
                            onChange={(e) => set("description", e.target.value)}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="value">Valor do honorário (R$) *</Label>
                            <Input
                                id="value"
                                type="number"
                                step="0.01"
                                placeholder="0,00"
                                value={form.value}
                                onChange={(e) => set("value", parseFloat(e.target.value) || 0)}
                                required
                            />
                            <p className="text-xs text-muted-foreground">
                                Valor cobrado ao cliente pelo escritório. Diferente do valor da causa (definido no
                                cadastro do processo).
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select value={form.status} onValueChange={(v) => set("status", v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Pendente">Pendente</SelectItem>
                                    <SelectItem value="Pago">Pago</SelectItem>
                                    <SelectItem value="Atrasado">Atrasado</SelectItem>
                                    <SelectItem value="Cancelado">Cancelado</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Forma de pagamento</Label>
                        <Select
                            value={form.payment_method}
                            onValueChange={(v) => set("payment_method", v as PaymentMethod)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="a_vista">À vista</SelectItem>
                                <SelectItem value="entrada_parcelas">Entrada + parcelas</SelectItem>
                                <SelectItem value="cartao_credito">Cartão de crédito</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {(form.payment_method === "entrada_parcelas" || form.payment_method === "cartao_credito") && (
                        <div className="grid grid-cols-2 gap-4">
                            {form.payment_method === "entrada_parcelas" && (
                                <div className="space-y-2">
                                    <Label htmlFor="entrada_value">Entrada (R$)</Label>
                                    <Input
                                        id="entrada_value"
                                        type="number"
                                        step="0.01"
                                        placeholder="0,00"
                                        value={form.entrada_value ?? ""}
                                        onChange={(e) =>
                                            set("entrada_value", e.target.value ? parseFloat(e.target.value) : null)
                                        }
                                    />
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label htmlFor="installments">Nº de parcelas</Label>
                                <Input
                                    id="installments"
                                    type="number"
                                    min={1}
                                    placeholder="Ex.: 12"
                                    value={form.installments ?? ""}
                                    onChange={(e) =>
                                        set("installments", e.target.value ? parseInt(e.target.value, 10) : null)
                                    }
                                />
                            </div>
                        </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="due_date">Vencimento</Label>
                            <Input
                                id="due_date"
                                type="date"
                                value={form.due_date ?? ""}
                                onChange={(e) => set("due_date", e.target.value || null)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="paid_date">Data de Pagamento</Label>
                            <Input
                                id="paid_date"
                                type="date"
                                value={form.paid_date ?? ""}
                                onChange={(e) => set("paid_date", e.target.value || null)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? "Salvando..." : isEditing ? "Salvar" : "Registrar"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
