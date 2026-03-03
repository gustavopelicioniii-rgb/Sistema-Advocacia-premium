import { Plus, Split, Percent, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useFees, useUpdateInstallmentStatus, type Fee } from "@/hooks/useFees";

const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "\u2014";
    return new Date(dateStr).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
};

const statusBadge: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
    Pago: { variant: "default", label: "Pago" },
    Pendente: { variant: "secondary", label: "Pendente" },
    Atrasado: { variant: "destructive", label: "Atrasado" },
    Cancelado: { variant: "outline", label: "Cancelado" },
};

interface FeesByProcessProps {
    onEdit: (fee: Fee) => void;
    onNew: () => void;
}

function getFeePaidValue(f: Fee): number {
    // If fee has installments_status, calculate paid based on installments
    if (f.installments_status && f.installments_status.length > 0 && f.installments && f.installments > 0) {
        const entradaValue = f.entrada_value ?? 0;
        const parcelValue = (f.value - entradaValue) / f.installments;
        const paidInstallments = f.installments_status.filter((s) => s.paid).length;
        // Assume entrada is always paid if any installment is paid or fee status is not Cancelado
        const entradaPaid = f.status !== "Cancelado" ? entradaValue : 0;
        return entradaPaid + paidInstallments * parcelValue;
    }
    // Fallback: fee-level status
    return f.status === "Pago" ? Number(f.value) : 0;
}

function getInstallmentsSummary(items: Fee[]): string {
    let totalInstallments = 0;
    let paidInstallments = 0;
    for (const f of items) {
        if (f.installments_status && f.installments_status.length > 0) {
            totalInstallments += f.installments_status.length;
            paidInstallments += f.installments_status.filter((s) => s.paid).length;
        }
    }
    if (totalInstallments === 0) return `${items.length} honorario(s)`;
    return `${paidInstallments}/${totalInstallments} parcela(s) paga(s)`;
}

export const FeesByProcess = ({ onEdit, onNew }: FeesByProcessProps) => {
    const { data: fees } = useFees();
    const updateInstallment = useUpdateInstallmentStatus();

    const toggleInstallmentPaid = (fee: Fee, installmentNumber: number) => {
        const statuses = [...(fee.installments_status ?? [])];
        const idx = statuses.findIndex((s) => s.number === installmentNumber);
        if (idx === -1) return;
        const wasPaid = statuses[idx].paid;
        statuses[idx] = {
            ...statuses[idx],
            paid: !wasPaid,
            paid_date: !wasPaid ? new Date().toISOString().split("T")[0] : null,
        };
        updateInstallment.mutate({ feeId: fee.id, installments_status: statuses });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-display text-xl flex items-center gap-2">
                    <Split className="h-5 w-5" /> Honorarios por Processo
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                    Vincule honorarios a processos com controle de parcelas e exito.
                </p>
            </CardHeader>
            <CardContent>
                {(fees ?? []).length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Split className="h-12 w-12 text-muted-foreground/50" />
                        <p className="mt-4 text-lg font-medium">Nenhum honorario vinculado</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Ao criar honorarios com numero de processo, eles aparecerao agrupados aqui.
                        </p>
                        <Button onClick={onNew} className="mt-4">
                            <Plus className="mr-2 h-4 w-4" />
                            Novo Honorario
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {Object.entries(
                            (fees ?? []).reduce<Record<string, Fee[]>>((acc, f) => {
                                const key = f.process_number || "Sem processo";
                                (acc[key] = acc[key] || []).push(f);
                                return acc;
                            }, {}),
                        ).map(([proc, items]) => {
                            const total = items.reduce((s, f) => s + Number(f.value), 0);
                            const pago = items.reduce((s, f) => s + getFeePaidValue(f), 0);
                            return (
                                <div key={proc} className="rounded-lg border p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-mono text-sm font-semibold">{proc}</p>
                                            <p className="text-xs text-muted-foreground">{items[0]?.client}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold">{formatCurrency(total)}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {getInstallmentsSummary(items)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="w-full bg-muted rounded-full h-2">
                                        <div
                                            className="bg-primary h-2 rounded-full transition-all"
                                            style={{ width: `${total > 0 ? (pago / total) * 100 : 0}%` }}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                        <span>Recebido: {formatCurrency(pago)}</span>
                                        <span className="flex items-center gap-1">
                                            <Percent className="h-3 w-3" />
                                            {total > 0 ? ((pago / total) * 100).toFixed(0) : 0}% recebido
                                        </span>
                                    </div>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Descricao</TableHead>
                                                <TableHead>Valor do honorario</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Parcelas</TableHead>
                                                <TableHead>Vencimento</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {items.map((f) => (
                                                <TableRow
                                                    key={f.id}
                                                    className="cursor-pointer"
                                                    onDoubleClick={() => onEdit(f)}
                                                >
                                                    <TableCell>{f.description || "\u2014"}</TableCell>
                                                    <TableCell className="font-semibold">
                                                        {formatCurrency(f.value)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={statusBadge[f.status]?.variant ?? "secondary"}>
                                                            {f.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        {f.installments_status && f.installments_status.length > 0 ? (
                                                            <div className="flex flex-wrap gap-1">
                                                                {f.installments_status.map((inst) => (
                                                                    <button
                                                                        key={inst.number}
                                                                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs transition-colors ${
                                                                            inst.paid
                                                                                ? "bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400"
                                                                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                                                                        }`}
                                                                        onClick={() => toggleInstallmentPaid(f, inst.number)}
                                                                        disabled={updateInstallment.isPending}
                                                                        title={inst.paid ? `Paga em ${formatDate(inst.paid_date)}` : `Parcela ${inst.number} pendente`}
                                                                    >
                                                                        {inst.paid && <Check className="h-3 w-3" />}
                                                                        {inst.number}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted-foreground text-xs">\u2014</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-sm text-muted-foreground">
                                                        {formatDate(f.due_date)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
