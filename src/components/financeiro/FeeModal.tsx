import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
    useCreateFee,
    useUpdateFee,
    type Fee,
    type FeeInsert,
    type PaymentMethod,
    type InstallmentStatus,
} from "@/hooks/useFees";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { CalendarDays } from "lucide-react";

interface FeeModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    fee?: Fee | null;
}

const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

function addMonths(dateStr: string, months: number): string {
    const d = new Date(dateStr + "T12:00:00");
    d.setMonth(d.getMonth() + months);
    return d.toISOString().split("T")[0];
}

const emptyForm = (fee?: Fee | null) => ({
    client: fee?.client ?? "",
    process_number: fee?.process_number ?? "",
    description: fee?.description ?? "",
    value: fee?.value ?? 0,
    status: (fee?.status ?? "Pendente") as Fee["status"],
    due_date: fee?.due_date ?? (null as string | null),
    paid_date: fee?.paid_date ?? (null as string | null),
    payment_method: (fee?.payment_method ?? "a_vista") as PaymentMethod,
    entrada_value: fee?.entrada_value ?? (null as number | null),
    installments: fee?.installments ?? (null as number | null),
});

export default function FeeModal({ open, onOpenChange, fee }: FeeModalProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const createMutation = useCreateFee();
    const updateMutation = useUpdateFee();
    const isEditing = !!fee;

    const [form, setForm] = useState(emptyForm(fee));
    const [parcelas, setParcelas] = useState<InstallmentStatus[]>([]);
    const [firstDueDate, setFirstDueDate] = useState("");

    const setField = <K extends keyof typeof form>(field: K, value: (typeof form)[K]) =>
        setForm((prev) => ({ ...prev, [field]: value }));

    function buildParcelas(
        installments: number,
        paymentMethod: PaymentMethod,
        entradaValue: number | null,
        totalValue: number,
        existing: InstallmentStatus[],
        firstDate: string,
    ): InstallmentStatus[] {
        const result: InstallmentStatus[] = [];

        if (paymentMethod === "entrada_parcelas" && entradaValue != null && entradaValue > 0) {
            const prev = existing.find((s) => s.number === 0);
            result.push({
                number: 0,
                paid: prev?.paid ?? false,
                due_date: prev?.due_date ?? (firstDate || null),
                paid_date: prev?.paid_date ?? null,
                value: entradaValue,
            });
        }

        const entVal = paymentMethod === "entrada_parcelas" ? (entradaValue ?? 0) : 0;
        const parcelValue = installments > 0 ? (totalValue - entVal) / installments : 0;

        for (let i = 1; i <= installments; i++) {
            const prev = existing.find((s) => s.number === i);
            const offset = paymentMethod === "entrada_parcelas" ? i : i - 1;
            const autoDate = firstDate ? addMonths(firstDate, offset) : null;
            result.push({
                number: i,
                paid: prev?.paid ?? false,
                due_date: prev?.due_date ?? autoDate,
                paid_date: prev?.paid_date ?? null,
                value: parcelValue,
            });
        }
        return result;
    }

    useEffect(() => {
        if (!open) return;
        const next = emptyForm(fee);
        setForm(next);
        const existing = fee?.installments_status ?? [];
        const first = existing.find((s) => s.number === 1);
        const initDate = first?.due_date ?? "";
        setFirstDueDate(initDate);
        if (fee?.installments && fee.installments > 0) {
            setParcelas(
                buildParcelas(
                    fee.installments,
                    fee.payment_method ?? "a_vista",
                    fee.entrada_value ?? null,
                    fee.value,
                    existing,
                    initDate,
                ),
            );
        } else {
            setParcelas([]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, fee?.id]);

    const handleInstallmentsChange = (val: string) => {
        const n = val ? parseInt(val, 10) : null;
        setField("installments", n);
        if (n && n > 0) {
            setParcelas(buildParcelas(n, form.payment_method, form.entrada_value, form.value, parcelas, firstDueDate));
        } else {
            setParcelas([]);
        }
    };

    const handleEntradaChange = (val: string) => {
        const v = val ? parseFloat(val) : null;
        setField("entrada_value", v);
        if (form.installments && form.installments > 0) {
            setParcelas(buildParcelas(form.installments, form.payment_method, v, form.value, parcelas, firstDueDate));
        }
    };

    const handleValueChange = (val: string) => {
        const v = parseFloat(val) || 0;
        setField("value", v);
        if (form.installments && form.installments > 0) {
            setParcelas(
                buildParcelas(form.installments, form.payment_method, form.entrada_value, v, parcelas, firstDueDate),
            );
        }
    };

    const handleMethodChange = (v: PaymentMethod) => {
        setField("payment_method", v);
        if (form.installments && form.installments > 0) {
            setParcelas(
                buildParcelas(
                    form.installments,
                    v,
                    v === "entrada_parcelas" ? form.entrada_value : null,
                    form.value,
                    parcelas,
                    firstDueDate,
                ),
            );
        } else {
            setParcelas([]);
        }
    };

    const handleAutoGenerateDates = () => {
        if (!firstDueDate) {
            toast({ title: "Informe a data de vencimento da 1ª parcela." });
            return;
        }
        setParcelas((prev) =>
            prev.map((p) => {
                if (p.number === 0) return { ...p, due_date: p.due_date ?? firstDueDate };
                const offset = form.payment_method === "entrada_parcelas" ? p.number : p.number - 1;
                return { ...p, due_date: addMonths(firstDueDate, offset) };
            }),
        );
    };

    const updateParcela = (number: number, field: keyof InstallmentStatus, value: string | boolean | null) => {
        setParcelas((prev) =>
            prev.map((p) => {
                if (p.number !== number) return p;
                const updated = { ...p, [field]: value };
                if (field === "paid" && value === true && !updated.paid_date) {
                    updated.paid_date = new Date().toISOString().split("T")[0];
                }
                if (field === "paid" && value === false) {
                    updated.paid_date = null;
                }
                return updated;
            }),
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.client) return;

        if (
            form.payment_method === "entrada_parcelas" &&
            form.entrada_value != null &&
            form.entrada_value > form.value
        ) {
            toast({
                title: "Valor de entrada inválido",
                description: "A entrada não pode ser maior que o valor total.",
                variant: "destructive",
            });
            return;
        }

        if (form.installments != null && form.installments < 1) {
            toast({
                title: "Número de parcelas inválido",
                description: "O número de parcelas deve ser maior que zero.",
                variant: "destructive",
            });
            return;
        }

        // Status calculado pelas parcelas (se existirem)
        let computedStatus: Fee["status"] = form.status;
        if (parcelas.length > 0) {
            const allPaid = parcelas.every((p) => p.paid);
            computedStatus = allPaid ? "Pago" : "Pendente";
        }

        // Para à vista: due_date e paid_date vêm do form
        // Para parcelado: vêm da 1ª parcela
        const firstParcela = parcelas.find((p) => p.number === 1);
        const due_date = parcelas.length > 0 ? (firstParcela?.due_date ?? null) : form.due_date;
        const paid_date = parcelas.length > 0 ? (firstParcela?.paid_date ?? null) : form.paid_date;

        const payload: FeeInsert = {
            client: form.client,
            process_number: form.process_number,
            description: form.description,
            value: form.value,
            status: computedStatus,
            due_date,
            paid_date,
            payment_method: form.payment_method,
            entrada_value: form.entrada_value ?? null,
            installments: form.installments ?? null,
            installments_status: parcelas.length > 0 ? parcelas : null,
            owner_id: fee?.owner_id ?? user?.id ?? null,
        };

        if (isEditing && fee) {
            await updateMutation.mutateAsync({ id: fee.id, ...payload });
        } else {
            await createMutation.mutateAsync({ ...payload, owner_id: user?.id ?? null });
        }
        onOpenChange(false);
    };

    const isPending = createMutation.isPending || updateMutation.isPending;
    const showInstallments = form.payment_method === "entrada_parcelas" || form.payment_method === "cartao_credito";

    const entradaValue = form.entrada_value ?? 0;
    const parcelValue =
        form.installments && form.installments > 0
            ? (form.value - (form.payment_method === "entrada_parcelas" ? entradaValue : 0)) / form.installments
            : 0;

    const entradaParcela = parcelas.find((p) => p.number === 0);
    const installmentParcelas = parcelas.filter((p) => p.number > 0);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="max-w-2xl max-h-[90vh] overflow-y-auto"
                onInteractOutside={(e) => e.preventDefault()}
                onPointerDownOutside={(e) => e.preventDefault()}
            >
                <DialogHeader>
                    <DialogTitle className="font-display text-xl">
                        {isEditing ? "Editar Honorário" : "Novo Honorário"}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Campos básicos */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="fee-client">Cliente *</Label>
                            <Input
                                id="fee-client"
                                placeholder="Nome do cliente"
                                value={form.client}
                                onChange={(e) => setField("client", e.target.value)}
                                required
                                autoComplete="off"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="fee-process">Processo</Label>
                            <Input
                                id="fee-process"
                                placeholder="0012345-67.2024 (opcional)"
                                value={form.process_number}
                                onChange={(e) => setField("process_number", e.target.value)}
                                autoComplete="off"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="fee-desc">Descrição</Label>
                        <Input
                            id="fee-desc"
                            placeholder="Honorários advocatícios, consulta..."
                            value={form.description}
                            onChange={(e) => setField("description", e.target.value)}
                            autoComplete="off"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="fee-value">Valor total (R$) *</Label>
                            <Input
                                id="fee-value"
                                type="number"
                                step="0.01"
                                placeholder="0,00"
                                value={form.value}
                                onChange={(e) => handleValueChange(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select value={form.status} onValueChange={(v) => setField("status", v as Fee["status"])}>
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

                    {/* Forma de pagamento */}
                    <div className="space-y-2">
                        <Label>Forma de pagamento</Label>
                        <Select
                            value={form.payment_method}
                            onValueChange={(v) => handleMethodChange(v as PaymentMethod)}
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

                    {/* À vista: vencimento e pagamento simples */}
                    {!showInstallments && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="fee-due">Vencimento</Label>
                                <Input
                                    id="fee-due"
                                    type="date"
                                    value={form.due_date ?? ""}
                                    onChange={(e) => setField("due_date", e.target.value || null)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="fee-paid">Data de Pagamento</Label>
                                <Input
                                    id="fee-paid"
                                    type="date"
                                    value={form.paid_date ?? ""}
                                    onChange={(e) => setField("paid_date", e.target.value || null)}
                                />
                            </div>
                        </div>
                    )}

                    {/* Seção de parcelamento */}
                    {showInstallments && (
                        <div className="rounded-lg border p-4 space-y-4 bg-muted/20">
                            <div className="grid grid-cols-2 gap-4">
                                {form.payment_method === "entrada_parcelas" && (
                                    <div className="space-y-2">
                                        <Label htmlFor="fee-entrada">Valor da Entrada (R$)</Label>
                                        <Input
                                            id="fee-entrada"
                                            type="number"
                                            step="0.01"
                                            placeholder="0,00"
                                            value={form.entrada_value ?? ""}
                                            onChange={(e) => handleEntradaChange(e.target.value)}
                                        />
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <Label htmlFor="fee-installments">Nº de parcelas</Label>
                                    <Input
                                        id="fee-installments"
                                        type="number"
                                        min={1}
                                        placeholder="Ex.: 12"
                                        value={form.installments ?? ""}
                                        onChange={(e) => handleInstallmentsChange(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Gerador automático de datas */}
                            {parcelas.length > 0 && (
                                <div className="flex items-end gap-3">
                                    <div className="flex-1 space-y-2">
                                        <Label htmlFor="fee-first-due">
                                            Vencimento da{" "}
                                            {form.payment_method === "entrada_parcelas" ? "entrada" : "1ª parcela"}
                                        </Label>
                                        <Input
                                            id="fee-first-due"
                                            type="date"
                                            value={firstDueDate}
                                            onChange={(e) => setFirstDueDate(e.target.value)}
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="gap-2"
                                        onClick={handleAutoGenerateDates}
                                    >
                                        <CalendarDays className="h-4 w-4" />
                                        Gerar datas automático
                                    </Button>
                                </div>
                            )}

                            {/* Entrada */}
                            {entradaParcela && (
                                <div className="space-y-2">
                                    <p className="text-sm font-semibold">
                                        Entrada — {fmt(entradaParcela.value ?? entradaValue)}
                                    </p>
                                    <div className="rounded-md border bg-background p-3 grid grid-cols-[auto_1fr_1fr_auto] gap-3 items-center">
                                        <Checkbox
                                            id="entrada-paid"
                                            checked={entradaParcela.paid}
                                            onCheckedChange={(v) => updateParcela(0, "paid", !!v)}
                                        />
                                        <div className="space-y-1">
                                            <Label htmlFor="entrada-due" className="text-xs text-muted-foreground">
                                                Vencimento
                                            </Label>
                                            <Input
                                                id="entrada-due"
                                                type="date"
                                                value={entradaParcela.due_date ?? ""}
                                                onChange={(e) => updateParcela(0, "due_date", e.target.value || null)}
                                                className="h-8 text-sm"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs text-muted-foreground">Data de Pagamento</Label>
                                            <Input
                                                type="date"
                                                value={entradaParcela.paid_date ?? ""}
                                                onChange={(e) => updateParcela(0, "paid_date", e.target.value || null)}
                                                className="h-8 text-sm"
                                            />
                                        </div>
                                        <span
                                            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                                entradaParcela.paid
                                                    ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400"
                                                    : "bg-muted text-muted-foreground"
                                            }`}
                                        >
                                            {entradaParcela.paid ? "Pago" : "Pendente"}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Lista de parcelas */}
                            {installmentParcelas.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-sm font-semibold">Parcelas — {fmt(parcelValue)} cada</p>
                                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                                        {installmentParcelas.map((parcela) => (
                                            <div
                                                key={parcela.number}
                                                className="rounded-md border bg-background p-3 grid grid-cols-[auto_auto_1fr_1fr_auto] gap-3 items-center"
                                            >
                                                <Checkbox
                                                    id={`p-${parcela.number}`}
                                                    checked={parcela.paid}
                                                    onCheckedChange={(v) => updateParcela(parcela.number, "paid", !!v)}
                                                />
                                                <span className="text-sm font-medium w-12 text-center shrink-0">
                                                    {parcela.number}ª
                                                </span>
                                                <div className="space-y-1 min-w-0">
                                                    <Label
                                                        htmlFor={`p-${parcela.number}-due`}
                                                        className="text-xs text-muted-foreground"
                                                    >
                                                        Vencimento
                                                    </Label>
                                                    <Input
                                                        id={`p-${parcela.number}-due`}
                                                        type="date"
                                                        value={parcela.due_date ?? ""}
                                                        onChange={(e) =>
                                                            updateParcela(
                                                                parcela.number,
                                                                "due_date",
                                                                e.target.value || null,
                                                            )
                                                        }
                                                        className="h-8 text-sm"
                                                    />
                                                </div>
                                                <div className="space-y-1 min-w-0">
                                                    <Label className="text-xs text-muted-foreground">
                                                        Data Pagamento
                                                    </Label>
                                                    <Input
                                                        type="date"
                                                        value={parcela.paid_date ?? ""}
                                                        onChange={(e) =>
                                                            updateParcela(
                                                                parcela.number,
                                                                "paid_date",
                                                                e.target.value || null,
                                                            )
                                                        }
                                                        className="h-8 text-sm"
                                                    />
                                                </div>
                                                <span
                                                    className={`text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${
                                                        parcela.paid
                                                            ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400"
                                                            : "bg-muted text-muted-foreground"
                                                    }`}
                                                >
                                                    {parcela.paid ? "Pago" : "Pendente"}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

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
