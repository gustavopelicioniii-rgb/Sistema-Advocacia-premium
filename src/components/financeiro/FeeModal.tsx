import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useCreateFee, useUpdateFee, type Fee, type FeeInsert, type PaymentMethod, type InstallmentStatus } from "@/hooks/useFees";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { CalendarDays } from "lucide-react";

interface FeeModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    fee?: Fee | null;
}

const fmt = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

function addMonths(dateStr: string, months: number): string {
    const d = new Date(dateStr + "T12:00:00");
    d.setMonth(d.getMonth() + months);
    return d.toISOString().split("T")[0];
}

export default function FeeModal({ open, onOpenChange, fee }: FeeModalProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const createMutation = useCreateFee();
    const updateMutation = useUpdateFee();
    const isEditing = !!fee;

    const [form, setForm] = useState({
        client: fee?.client ?? "",
        process_number: fee?.process_number ?? "",
        description: fee?.description ?? "",
        value: fee?.value ?? 0,
        status: fee?.status ?? ("Pendente" as Fee["status"]),
        payment_method: (fee?.payment_method ?? "a_vista") as PaymentMethod,
        entrada_value: fee?.entrada_value ?? (null as number | null),
        installments: fee?.installments ?? (null as number | null),
    });

    // Parcelas com due_date e paid_date individuais (number=0 é a entrada)
    const [parcelas, setParcelas] = useState<InstallmentStatus[]>([]);
    // Data de vencimento da 1ª parcela (para gerar automático)
    const [firstDueDate, setFirstDueDate] = useState("");

    const setField = (field: string, value: string | number | null) =>
        setForm((prev) => ({ ...prev, [field]: value }));

    const buildParcelas = (
        installments: number,
        paymentMethod: PaymentMethod,
        entradaValue: number | null,
        totalValue: number,
        existing: InstallmentStatus[],
        firstDate: string,
    ): InstallmentStatus[] => {
        const result: InstallmentStatus[] = [];

        // Entrada (number = 0)
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

        // Parcelas
        const entVal = paymentMethod === "entrada_parcelas" ? (entradaValue ?? 0) : 0;
        const parcelValue = installments > 0 ? (totalValue - entVal) / installments : 0;
        for (let i = 1; i <= installments; i++) {
            const prev = existing.find((s) => s.number === i);
            const autoDate = firstDate ? addMonths(firstDate, paymentMethod === "entrada_parcelas" ? i : i - 1) : null;
            result.push({
                number: i,
                paid: prev?.paid ?? false,
                due_date: prev?.due_date ?? autoDate,
                paid_date: prev?.paid_date ?? null,
                value: parcelValue,
            });
        }
        return result;
    };

    useEffect(() => {
        if (!open) return;
        const existing = fee?.installments_status ?? [];
        setForm({
            client: fee?.client ?? "",
            process_number: fee?.process_number ?? "",
            description: fee?.description ?? "",
            value: fee?.value ?? 0,
            status: fee?.status ?? "Pendente",
            payment_method: (fee?.payment_method ?? "a_vista") as PaymentMethod,
            entrada_value: fee?.entrada_value ?? null,
            installments: fee?.installments ?? null,
        });
        // Recupera data de vencimento da 1ª parcela (number=1)
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

    // Recria a lista de parcelas quando muda número de parcelas, entrada ou método
    const handleInstallmentsChange = (val: string) => {
        const n = val ? parseInt(val, 10) : null;
        setField("installments", n);
        if (n && n > 0) {
            setParcelas(
                buildParcelas(n, form.payment_method, form.entrada_value, form.value, parcelas, firstDueDate),
            );
        } else {
            setParcelas([]);
        }
    };

    const handleEntradaChange = (val: string) => {
        const v = val ? parseFloat(val) : null;
        setField("entrada_value", v);
        if (form.installments && form.installments > 0) {
            setParcelas(
                buildParcelas(form.installments, form.payment_method, v, form.value, parcelas, firstDueDate),
            );
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
        }
    };

    // Gera datas automaticamente a partir da firstDueDate
    const handleAutoGenerateDates = () => {
        if (!firstDueDate) {
            toast({ title: "Informe a data de vencimento da 1ª parcela." });
            return;
        }
        setParcelas((prev) =>
            prev.map((p) => {
                if (p.number === 0) {
                    // Entrada: mantém ou usa a mesma data da 1ª parcela
                    return { ...p, due_date: p.due_date ?? firstDueDate };
                }
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
                // Se marcar como pago sem data, preenche hoje
                if (field === "paid" && value === true && !updated.paid_date) {
                    updated.paid_date = new Date().toISOString().split("T")[0];
                }
                // Se desmarcar, limpa data de pagamento
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

        // Calcular status geral baseado nas parcelas
        let computedStatus: Fee["status"] = form.status;
        if (parcelas.length > 0) {
            const allPaid = parcelas.every((p) => p.paid);
            computedStatus = allPaid ? "Pago" : "Pendente";
        }

        // Due_date e paid_date gerais = da 1ª parcela (número 1)
        const firstParcela = parcelas.find((p) => p.number === 1);
        const entradaParcela = parcelas.find((p) => p.number === 0);

        const payload = {
            ...form,
            status: computedStatus,
            due_date: firstParcela?.due_date ?? null,
            paid_date: firstParcela?.paid_date ?? null,
            entrada_value: form.entrada_value ?? null,
            installments: form.installments ?? null,
            installments_status: parcelas.length > 0 ? parcelas : null,
            // Armazena info de vencimento/pagamento da entrada também
            ...(entradaParcela && { entrada_due_date: entradaParcela.due_date }),
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
    const showInstallments =
        form.payment_method === "entrada_parcelas" || form.payment_method === "cartao_credito";
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
                            <Label htmlFor="client">Cliente *</Label>
                            <Input
                                id="client"
                                placeholder="Nome do cliente"
                                value={form.client}
                                onChange={(e) => setField("client", e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="process_number">Processo</Label>
                            <Input
                                id="process_number"
                                placeholder="0012345-67.2024 (opcional)"
                                value={form.process_number}
                                onChange={(e) => setField("process_number", e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Descrição</Label>
                        <Input
                            id="description"
                            placeholder="Honorários advocatícios, consulta..."
                            value={form.description}
                            onChange={(e) => setField("description", e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="value">Valor total (R$) *</Label>
                            <Input
                                id="value"
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
                            <Select value={form.status} onValueChange={(v) => setField("status", v)}>
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
                        <Select value={form.payment_method} onValueChange={(v) => handleMethodChange(v as PaymentMethod)}>
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

                    {/* Seção de parcelamento */}
                    {showInstallments && (
                        <div className="rounded-lg border p-4 space-y-4 bg-muted/20">
                            <div className="grid grid-cols-2 gap-4">
                                {form.payment_method === "entrada_parcelas" && (
                                    <div className="space-y-2">
                                        <Label htmlFor="entrada_value">Valor da Entrada (R$)</Label>
                                        <Input
                                            id="entrada_value"
                                            type="number"
                                            step="0.01"
                                            placeholder="0,00"
                                            value={form.entrada_value ?? ""}
                                            onChange={(e) => handleEntradaChange(e.target.value)}
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
                                        onChange={(e) => handleInstallmentsChange(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Gerador automático de datas */}
                            {parcelas.length > 0 && (
                                <div className="flex items-end gap-3">
                                    <div className="flex-1 space-y-2">
                                        <Label>Vencimento da 1ª parcela</Label>
                                        <Input
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
                                    <p className="text-sm font-semibold text-foreground">
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
                                    <p className="text-sm font-semibold text-foreground">
                                        Parcelas — {fmt(parcelValue)} cada
                                    </p>
                                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                                        {installmentParcelas.map((parcela) => (
                                            <div
                                                key={parcela.number}
                                                className="rounded-md border bg-background p-3 grid grid-cols-[auto_auto_1fr_1fr_auto] gap-3 items-center"
                                            >
                                                <Checkbox
                                                    id={`parcela-${parcela.number}-paid`}
                                                    checked={parcela.paid}
                                                    onCheckedChange={(v) =>
                                                        updateParcela(parcela.number, "paid", !!v)
                                                    }
                                                />
                                                <span className="text-sm font-medium w-16 text-center">
                                                    {parcela.number}ª
                                                </span>
                                                <div className="space-y-1">
                                                    <Label
                                                        htmlFor={`parcela-${parcela.number}-due`}
                                                        className="text-xs text-muted-foreground"
                                                    >
                                                        Vencimento
                                                    </Label>
                                                    <Input
                                                        id={`parcela-${parcela.number}-due`}
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
                                                <div className="space-y-1">
                                                    <Label className="text-xs text-muted-foreground">
                                                        Data de Pagamento
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

                    {/* Vencimento e pagamento geral (somente para à vista) */}
                    {form.payment_method === "a_vista" && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="due_date">Vencimento</Label>
                                <Input
                                    id="due_date"
                                    type="date"
                                    value={
                                        parcelas.find((p) => p.number === 1)?.due_date ??
                                        fee?.due_date ??
                                        ""
                                    }
                                    onChange={(e) => {
                                        const val = e.target.value || null;
                                        setForm((prev) => ({ ...prev, due_date: val } as typeof prev));
                                    }}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="paid_date">Data de Pagamento</Label>
                                <Input
                                    id="paid_date"
                                    type="date"
                                    value={
                                        parcelas.find((p) => p.number === 1)?.paid_date ??
                                        fee?.paid_date ??
                                        ""
                                    }
                                    onChange={(e) => {
                                        const val = e.target.value || null;
                                        setForm((prev) => ({ ...prev, paid_date: val } as typeof prev));
                                    }}
                                />
                            </div>
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
