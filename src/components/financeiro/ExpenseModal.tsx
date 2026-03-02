import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    useCreateExpense,
    useUpdateExpense,
    type OfficeExpense,
    type OfficeExpenseInsert,
    type ExpenseCategory,
} from "@/hooks/useExpenses";
import { useAuth } from "@/contexts/AuthContext";

interface ExpenseModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    expense?: OfficeExpense | null;
}

const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
    luz: "Luz",
    agua: "Água",
    assinaturas: "Assinaturas",
    outros: "Outros",
};

export default function ExpenseModal({ open, onOpenChange, expense }: ExpenseModalProps) {
    const { user } = useAuth();
    const createMutation = useCreateExpense();
    const updateMutation = useUpdateExpense();
    const isEditing = !!expense;

    const [form, setForm] = useState({
        category: (expense?.category ?? "outros") as ExpenseCategory,
        description: expense?.description ?? "",
        value: expense?.value ?? 0,
        status: expense?.status ?? ("Pendente" as OfficeExpense["status"]),
        due_date: expense?.due_date ?? (null as string | null),
        paid_date: expense?.paid_date ?? (null as string | null),
    });

    const set = (field: string, value: unknown) => setForm((prev) => ({ ...prev, [field]: value }));

    useEffect(() => {
        if (!open) return;
        setForm({
            category: (expense?.category ?? "outros") as ExpenseCategory,
            description: expense?.description ?? "",
            value: expense?.value ?? 0,
            status: expense?.status ?? "Pendente",
            due_date: expense?.due_date ?? null,
            paid_date: expense?.paid_date ?? null,
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, expense?.id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.description.trim()) return;

        const payload: OfficeExpenseInsert = {
            ...form,
            owner_id: user?.id ?? null,
        };
        if (isEditing && expense) {
            await updateMutation.mutateAsync({ id: expense.id, ...payload });
        } else {
            await createMutation.mutateAsync(payload);
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
                        {isEditing ? "Editar Despesa" : "Nova Despesa"}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Categoria *</Label>
                        <Select value={form.category} onValueChange={(v) => set("category", v as ExpenseCategory)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {(Object.keys(CATEGORY_LABELS) as ExpenseCategory[]).map((c) => (
                                    <SelectItem key={c} value={c}>
                                        {CATEGORY_LABELS[c]}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="desc">Descrição *</Label>
                        <Input
                            id="desc"
                            placeholder="Ex.: Conta de luz jan/2026, Netflix..."
                            value={form.description}
                            onChange={(e) => set("description", e.target.value)}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="value">Valor (R$) *</Label>
                        <Input
                            id="value"
                            type="number"
                            step="0.01"
                            placeholder="0,00"
                            value={form.value || ""}
                            onChange={(e) => set("value", parseFloat(e.target.value) || 0)}
                            required
                        />
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
                            <Label htmlFor="paid_date">Data de pagamento</Label>
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
