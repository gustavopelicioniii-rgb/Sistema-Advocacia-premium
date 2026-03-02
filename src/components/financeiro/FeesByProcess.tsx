import { Plus, Split, Percent } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useFees, type Fee } from "@/hooks/useFees";

const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
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

export const FeesByProcess = ({ onEdit, onNew }: FeesByProcessProps) => {
    const { data: fees } = useFees();

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-display text-xl flex items-center gap-2">
                    <Split className="h-5 w-5" /> Honorários por Processo
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                    Vincule honorários a processos com controle de parcelas e êxito.
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
                    <div className="space-y-4">
                        {Object.entries(
                            (fees ?? []).reduce<Record<string, Fee[]>>((acc, f) => {
                                const key = f.process_number || "Sem processo";
                                (acc[key] = acc[key] || []).push(f);
                                return acc;
                            }, {}),
                        ).map(([proc, items]) => {
                            const total = items.reduce((s, f) => s + Number(f.value), 0);
                            const pago = items
                                .filter((f) => f.status === "Pago")
                                .reduce((s, f) => s + Number(f.value), 0);
                            return (
                                <div key={proc} className="rounded-lg border p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-mono text-sm font-semibold">{proc}</p>
                                            <p className="text-xs text-muted-foreground">{items[0]?.client}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold">{formatCurrency(total)}</p>
                                            <p className="text-xs text-muted-foreground">{items.length} parcela(s)</p>
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
                                                <TableHead>Descrição</TableHead>
                                                <TableHead>Valor do honorário</TableHead>
                                                <TableHead>Status</TableHead>
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
                                                    <TableCell>{f.description || "—"}</TableCell>
                                                    <TableCell className="font-semibold">
                                                        {formatCurrency(f.value)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={statusBadge[f.status]?.variant ?? "secondary"}>
                                                            {f.status}
                                                        </Badge>
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
