import { useState, Fragment } from "react";
import { Loader2, DollarSign, Plus, MoreHorizontal, Pencil, Trash2, Search, ChevronDown, ChevronRight, Check, X } from "lucide-react";
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
import { useFees, useUpdateInstallmentStatus, type Fee, type InstallmentStatus } from "@/hooks/useFees";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/ui/table-pagination";

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

    const hasInstallments = (f: Fee) =>
        f.installments_status && f.installments_status.length > 0;

    const getInstallmentSummary = (f: Fee) => {
        if (!f.installments_status || f.installments_status.length === 0) return null;
        const paid = f.installments_status.filter((s) => s.paid).length;
        const total = f.installments_status.length;
        return `${paid}/${total}`;
    };

    const getInstallmentValue = (fee: Fee, _installmentNumber: number) => {
        if (!fee.installments || fee.installments <= 0) return 0;
        const entradaValue = fee.entrada_value ?? 0;
        const remaining = fee.value - entradaValue;
        return remaining / fee.installments;
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
                <CardTitle className="font-display text-xl">Honorarios</CardTitle>
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
                        <p className="mt-4 text-lg font-medium text-foreground">Nenhum honorario registrado</p>
                        <p className="mt-1 text-sm text-muted-foreground">Clique em "Novo Honorario" para comecar.</p>
                        <Button onClick={onNew} className="mt-4">
                            <Plus className="mr-2 h-4 w-4" />
                            Registrar Primeiro
                        </Button>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <DollarSign className="h-12 w-12 text-muted-foreground/50" />
                        <p className="mt-4 text-lg font-medium">Nenhum resultado para &quot;{search}&quot;</p>
                    </div>
                ) : (
                    <>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-8"></TableHead>
                                    <TableHead>Cliente</TableHead>
                                    <TableHead>Processo</TableHead>
                                    <TableHead>Descricao</TableHead>
                                    <TableHead>Valor do honorario</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Parcelas</TableHead>
                                    <TableHead>Vencimento</TableHead>
                                    <TableHead className="w-10"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pageData.map((f) => (
                                    <Fragment key={f.id}>
                                        <TableRow className="cursor-pointer" onDoubleClick={() => onEdit(f)}>
                                            <TableCell className="px-2">
                                                {hasInstallments(f) ? (
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
                                                ) : null}
                                            </TableCell>
                                            <TableCell className="font-medium">{f.client}</TableCell>
                                            <TableCell className="font-mono text-xs">{f.process_number || "\u2014"}</TableCell>
                                            <TableCell>{f.description || "\u2014"}</TableCell>
                                            <TableCell className="font-semibold">{formatCurrency(f.value)}</TableCell>
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
                                                    <span className="text-muted-foreground">\u2014</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {formatDate(f.due_date)}
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                            aria-label="Mais opcoes do honorario"
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
                                        {hasInstallments(f) && expandedFees.has(f.id) && (
                                            <TableRow className="bg-muted/30 hover:bg-muted/40">
                                                <TableCell colSpan={9} className="p-0">
                                                    <div className="px-8 py-3 space-y-1">
                                                        <p className="text-xs font-semibold text-muted-foreground mb-2">
                                                            Parcelas ({getInstallmentSummary(f)} pagas)
                                                            {f.entrada_value ? ` | Entrada: ${formatCurrency(f.entrada_value)}` : ""}
                                                        </p>
                                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                                            {(f.installments_status ?? []).map((inst) => (
                                                                <button
                                                                    key={inst.number}
                                                                    className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors ${
                                                                        inst.paid
                                                                            ? "border-green-500/50 bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400"
                                                                            : "border-border bg-background hover:bg-muted"
                                                                    }`}
                                                                    onClick={() => toggleInstallmentPaid(f, inst.number)}
                                                                    disabled={updateInstallment.isPending}
                                                                >
                                                                    <span className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                                                                        inst.paid
                                                                            ? "border-green-500 bg-green-500 text-white"
                                                                            : "border-muted-foreground/30"
                                                                    }`}>
                                                                        {inst.paid ? <Check className="h-3 w-3" /> : null}
                                                                    </span>
                                                                    <span className="font-medium">
                                                                        Parcela {inst.number}
                                                                    </span>
                                                                    <span className="ml-auto text-xs text-muted-foreground">
                                                                        {formatCurrency(getInstallmentValue(f, inst.number))}
                                                                    </span>
                                                                    {inst.paid && inst.paid_date && (
                                                                        <span className="text-xs text-green-600 dark:text-green-400">
                                                                            {formatDate(inst.paid_date)}
                                                                        </span>
                                                                    )}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </Fragment>
                                ))}
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
