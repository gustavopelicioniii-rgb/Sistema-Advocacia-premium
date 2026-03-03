import { Plus, Split, Percent, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useFees, useUpdateInstallmentStatus, type Fee } from "@/hooks/useFees";

const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "—";
    return new Date(dateStr + "T12:00:00").toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const statusBadge: Record<string, { variant: "default" | "secondary" | "destructive" | "outline" }> = {
    Pago: { variant: "default" },
    Pendente: { variant: "secondary" },
    Atrasado: { variant: "destructive" },
    Cancelado: { variant: "outline" },
};

interface FeesByProcessProps {
    onEdit: (fee: Fee) => void;
    onNew: () => void;
}

function getFeePaidValue(f: Fee): number {
    if (f.installments_status && f.installments_status.length > 0) {
        return f.installments_status
            .filter((s) => s.paid)
            .reduce((sum, s) => sum + (s.value ?? 0), 0);
    }
    return f.status === "Pago" ? Number(f.value) : 0;
}

function getTotalInstallments(items: Fee[]) {
    let total = 0;
    let paid = 0;
    for (const f of items) {
        if (f.installments_status && f.installments_status.length > 0) {
            total += f.installments_status.length;
            paid += f.installments_status.filter((s) => s.paid).length;
        }
    }
    if (total === 0) return `${items.length} honorário(s)`;
    return `${paid}/${total} parcelas pagas`;
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
                    <Split className="h-5 w-5" /> Honorários por Processo
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                    Controle de parcelas, vencimentos e pagamentos por processo.
                </p>
            </CardHeader>
            <CardContent>
                {(fees ?? []).length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <Split className="h-12 w-12 text-muted-foreground/50" />
                        <p className="mt-4 text-lg font-medium">Nenhum honorário vinculado</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Ao criar honorários com número de processo, eles aparecerão agrupados aqui.
                        </p>
                        <Button onClick={onNew} className="mt-4">
                            <Plus className="mr-2 h-4 w-4" />
                            Novo Honorário
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-6">
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
                                <div key={proc} className="rounded-lg border p-4 space-y-4">
                                    {/* Cabeçalho do processo */}
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-mono text-sm font-semibold">{proc}</p>
                                            <p className="text-xs text-muted-foreground">{items[0]?.client}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold">{formatCurrency(total)}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {getTotalInstallments(items)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Barra de progresso */}
                                    <div>
                                        <div className="w-full bg-muted rounded-full h-2">
                                            <div
                                                className="bg-primary h-2 rounded-full transition-all"
                                                style={{ width: `${total > 0 ? (pago / total) * 100 : 0}%` }}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                                            <span>Recebido: {formatCurrency(pago)}</span>
                                            <span className="flex items-center gap-1">
                                                <Percent className="h-3 w-3" />
                                                {total > 0 ? ((pago / total) * 100).toFixed(0) : 0}% recebido
                                            </span>
                                        </div>
                                    </div>

                                    {/* Honorários do processo */}
                                    <div className="space-y-3">
                                        {items.map((f) => {
                                            const hasParcelas =
                                                f.installments_status && f.installments_status.length > 0;
                                            return (
                                                <div key={f.id} className="rounded-md border bg-muted/10 p-3 space-y-3">
                                                    {/* Linha do honorário */}
                                                    <div
                                                        className="flex items-center justify-between cursor-pointer"
                                                        onDoubleClick={() => onEdit(f)}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div>
                                                                <p className="text-sm font-medium">
                                                                    {f.description || "Honorário"}
                                                                </p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {f.payment_method === "entrada_parcelas"
                                                                        ? "Entrada + Parcelas"
                                                                        : f.payment_method === "cartao_credito"
                                                                          ? "Cartão de crédito"
                                                                          : "À vista"}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3">
                                                            <span className="font-semibold text-sm">
                                                                {formatCurrency(f.value)}
                                                            </span>
                                                            <Badge
                                                                variant={
                                                                    statusBadge[f.status]?.variant ?? "secondary"
                                                                }
                                                            >
                                                                {f.status}
                                                            </Badge>
                                                        </div>
                                                    </div>

                                                    {/* Tabela de parcelas */}
                                                    {hasParcelas && (
                                                        <div className="overflow-x-auto">
                                                            <table className="w-full text-xs">
                                                                <thead>
                                                                    <tr className="text-muted-foreground border-b">
                                                                        <th className="text-left pb-1 pr-3 font-medium">
                                                                            Parcela
                                                                        </th>
                                                                        <th className="text-left pb-1 pr-3 font-medium">
                                                                            Valor
                                                                        </th>
                                                                        <th className="text-left pb-1 pr-3 font-medium">
                                                                            Vencimento
                                                                        </th>
                                                                        <th className="text-left pb-1 pr-3 font-medium">
                                                                            Pagamento
                                                                        </th>
                                                                        <th className="text-left pb-1 font-medium">
                                                                            Status
                                                                        </th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-border/50">
                                                                    {(f.installments_status ?? [])
                                                                        .sort((a, b) => a.number - b.number)
                                                                        .map((inst) => (
                                                                            <tr
                                                                                key={inst.number}
                                                                                className="hover:bg-muted/30"
                                                                            >
                                                                                <td className="py-1.5 pr-3 font-medium">
                                                                                    {inst.number === 0
                                                                                        ? "Entrada"
                                                                                        : `${inst.number}ª`}
                                                                                </td>
                                                                                <td className="py-1.5 pr-3">
                                                                                    {inst.value != null
                                                                                        ? formatCurrency(inst.value)
                                                                                        : "—"}
                                                                                </td>
                                                                                <td
                                                                                    className={`py-1.5 pr-3 ${
                                                                                        !inst.paid &&
                                                                                        inst.due_date &&
                                                                                        new Date(inst.due_date) <
                                                                                            new Date()
                                                                                            ? "text-destructive font-medium"
                                                                                            : "text-muted-foreground"
                                                                                    }`}
                                                                                >
                                                                                    {formatDate(inst.due_date)}
                                                                                </td>
                                                                                <td className="py-1.5 pr-3 text-muted-foreground">
                                                                                    {formatDate(inst.paid_date)}
                                                                                </td>
                                                                                <td className="py-1.5">
                                                                                    <button
                                                                                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-colors ${
                                                                                            inst.paid
                                                                                                ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400"
                                                                                                : "bg-muted text-muted-foreground hover:bg-primary/10"
                                                                                        }`}
                                                                                        onClick={() =>
                                                                                            toggleInstallmentPaid(
                                                                                                f,
                                                                                                inst.number,
                                                                                            )
                                                                                        }
                                                                                        disabled={
                                                                                            updateInstallment.isPending
                                                                                        }
                                                                                    >
                                                                                        {inst.paid && (
                                                                                            <Check className="h-3 w-3" />
                                                                                        )}
                                                                                        {inst.paid
                                                                                            ? "Pago"
                                                                                            : "Pendente"}
                                                                                    </button>
                                                                                </td>
                                                                            </tr>
                                                                        ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    )}

                                                    {/* À vista: mostra vencimento/pagamento simples */}
                                                    {!hasParcelas && (
                                                        <div className="flex items-center gap-6 text-xs text-muted-foreground">
                                                            <span>
                                                                Vencimento: <strong>{formatDate(f.due_date)}</strong>
                                                            </span>
                                                            <span>
                                                                Pago em:{" "}
                                                                <strong>{formatDate(f.paid_date)}</strong>
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
