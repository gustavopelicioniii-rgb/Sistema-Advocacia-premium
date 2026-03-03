import { useState, Fragment } from "react";
import { Loader2, DollarSign, Plus, MoreHorizontal, Pencil, Trash2, Search, ChevronDown, ChevronRight, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useFees, useUpdateInstallmentStatus, type Fee } from "@/hooks/useFees";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/ui/table-pagination";

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

interface FeesTableProps {
    onEdit: (fee: Fee) => void;
    onDelete: (feeId: string) => void;
    onNew: () => void;
}

export const FeesTable = ({ onEdit, onDelete, onNew }: FeesTableProps) => {
    const { data: fees, isLoading } = useFees();
    const updateInstallment = useUpdateInstallmentStatus();
    const [search, setSearch] = useState("");
    const [expandedFees, setExpandedFees] = useState<Set<string>>(new Set());

    const filtered = (fees ?? []).filter(
        (f) =>
            f.client.toLowerCase().includes(search.toLowerCase()) ||
            f.process_number.includes(search) ||
            f.description.toLowerCase().includes(search.toLowerCase()),
    );

    const { page, pageCount, pageData, totalItems, goTo } = usePagination(filtered, 20);

    const toggleExpand = (feeId: string) => {
        setExpandedFees((prev) => {
            const next = new Set(prev);
            if (next.has(feeId)) next.delete(feeId);
            else next.add(feeId);
            return next;
        });
    };

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

    const hasInstallments = (f: Fee) => f.installments_status && f.installments_status.length > 0;

    const getInstallmentSummary = (f: Fee) => {
        if (!f.installments_status || f.installments_status.length === 0) return null;
        const paid = f.installments_status.filter((s) => s.paid && s.number > 0).length;
        const total = f.installments_status.filter((s) => s.number > 0).length;
        return `${paid}/${total}`;
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
                <CardTitle className="font-display text-xl">Honorários</CardTitle>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Buscar cliente ou processo..."
                        className="pl-9 w-64"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        <span className="ml-3 text-muted-foreground">Carregando...</span>
                    </div>
                ) : (fees ?? []).length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <DollarSign className="h-12 w-12 text-muted-foreground/50" />
                        <p className="mt-4 text-lg font-medium text-foreground">Nenhum honorário registrado</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Clique em "Novo Honorário" para começar.
                        </p>
                        <Button onClick={onNew} className="mt-4">
                            <Plus className="mr-2 h-4 w-4" />
                            Registrar Primeiro
                        </Button>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <DollarSign className="h-12 w-12 text-muted-foreground/50" />
                        <p className="mt-4 text-lg font-medium">Nenhum resultado para "{search}"</p>
                    </div>
                ) : (
                    <>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-8"></TableHead>
                                    <TableHead>Cliente</TableHead>
                                    <TableHead>Processo</TableHead>
                                    <TableHead>Descrição</TableHead>
                                    <TableHead>Valor</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Parcelas</TableHead>
                                    <TableHead>Vencimento</TableHead>
                                    <TableHead className="w-10"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pageData.map((f) => {
                                    const firstParcela = f.installments_status?.find((s) => s.number === 1);
                                    return (
                                        <Fragment key={f.id}>
                                            <TableRow
                                                className="cursor-pointer"
                                                onDoubleClick={() => onEdit(f)}
                                            >
                                                <TableCell className="px-2">
                                                    {hasInstallments(f) && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                toggleExpand(f.id);
                                                            }}
                                                        >
                                                            {expandedFees.has(f.id) ? (
                                                                <ChevronDown className="h-4 w-4" />
                                                            ) : (
                                                                <ChevronRight className="h-4 w-4" />
                                                            )}
                                                        </Button>
                                                    )}
                                                </TableCell>
                                                <TableCell className="font-medium">{f.client}</TableCell>
                                                <TableCell className="font-mono text-xs">
                                                    {f.process_number || "—"}
                                                </TableCell>
                                                <TableCell>{f.description || "—"}</TableCell>
                                                <TableCell className="font-semibold">
                                                    {formatCurrency(f.value)}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={statusBadge[f.status]?.variant ?? "secondary"}>
                                                        {f.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    {getInstallmentSummary(f) ? (
                                                        <span className="font-medium text-primary">
                                                            {getInstallmentSummary(f)} pagas
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted-foreground">—</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {/* Mostra vencimento da 1ª parcela ou do fee */}
                                                    {firstParcela?.due_date
                                                        ? formatDate(firstParcela.due_date)
                                                        : formatDate(f.due_date)}
                                                </TableCell>
                                                <TableCell>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8"
                                                                aria-label="Mais opções"
                                                            >
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => onEdit(f)}>
                                                                <Pencil className="mr-2 h-4 w-4" />
                                                                Editar
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                className="text-destructive"
                                                                onClick={() => onDelete(f.id)}
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Excluir
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>

                                            {/* Linha expandida com parcelas */}
                                            {hasInstallments(f) && expandedFees.has(f.id) && (
                                                <TableRow className="bg-muted/20 hover:bg-muted/30">
                                                    <TableCell colSpan={9} className="p-0">
                                                        <div className="px-8 py-3 space-y-2">
                                                            <p className="text-xs font-semibold text-muted-foreground mb-2">
                                                                Parcelas — {getInstallmentSummary(f)} pagas
                                                            </p>
                                                            <div className="overflow-x-auto">
                                                                <table className="w-full text-sm">
                                                                    <thead>
                                                                        <tr className="text-xs text-muted-foreground">
                                                                            <th className="text-left pb-1 pr-4 font-medium">
                                                                                Parcela
                                                                            </th>
                                                                            <th className="text-left pb-1 pr-4 font-medium">
                                                                                Valor
                                                                            </th>
                                                                            <th className="text-left pb-1 pr-4 font-medium">
                                                                                Vencimento
                                                                            </th>
                                                                            <th className="text-left pb-1 pr-4 font-medium">
                                                                                Data de Pagamento
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
                                                                                    className="hover:bg-muted/40"
                                                                                >
                                                                                    <td className="py-1.5 pr-4 font-medium">
                                                                                        {inst.number === 0
                                                                                            ? "Entrada"
                                                                                            : `${inst.number}ª parcela`}
                                                                                    </td>
                                                                                    <td className="py-1.5 pr-4">
                                                                                        {inst.value != null
                                                                                            ? formatCurrency(inst.value)
                                                                                            : "—"}
                                                                                    </td>
                                                                                    <td className="py-1.5 pr-4 text-muted-foreground">
                                                                                        {formatDate(inst.due_date)}
                                                                                    </td>
                                                                                    <td className="py-1.5 pr-4 text-muted-foreground">
                                                                                        {formatDate(inst.paid_date)}
                                                                                    </td>
                                                                                    <td className="py-1.5">
                                                                                        <button
                                                                                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                                                                                                inst.paid
                                                                                                    ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400"
                                                                                                    : "bg-muted text-muted-foreground hover:bg-muted/80"
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
                                                                                                : "Marcar pago"}
                                                                                        </button>
                                                                                    </td>
                                                                                </tr>
                                                                            ))}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </Fragment>
                                    );
                                })}
                            </TableBody>
                        </Table>
                        <TablePagination
                            page={page}
                            pageCount={pageCount}
                            totalItems={totalItems}
                            pageSize={20}
                            onPageChange={goTo}
                        />
                    </>
                )}
            </CardContent>
        </Card>
    );
};
