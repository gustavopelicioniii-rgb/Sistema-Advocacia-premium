import { Loader2, TrendingDown, MoreHorizontal, Pencil, Trash2, Zap, Droplets, FileText, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useExpenses, type OfficeExpense } from "@/hooks/useExpenses";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/ui/table-pagination";

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

const CATEGORY_ICONS: Record<string, typeof Zap> = {
    luz: Zap,
    agua: Droplets,
    assinaturas: FileText,
    outros: Package,
};
const CATEGORY_LABELS: Record<string, string> = {
    luz: "Luz",
    agua: "Água",
    assinaturas: "Assinaturas",
    outros: "Outros",
};

interface ExpensesTableProps {
    onEdit: (expense: OfficeExpense) => void;
    onDelete: (expenseId: string) => void;
    onNew: () => void;
}

export const ExpensesTable = ({ onEdit, onDelete }: ExpensesTableProps) => {
    const { data: expenses, isLoading } = useExpenses();

    const { page, pageCount, pageData, totalItems, goTo } = usePagination(expenses ?? [], 20);

    return (
        <Card>
            <CardHeader className="pb-4">
                <div>
                    <CardTitle className="font-display text-xl">Todas as despesas</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Clique no ícone de lápis ou duplo clique na linha para editar.
                    </p>
                </div>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        <span className="ml-3 text-muted-foreground">Carregando...</span>
                    </div>
                ) : (expenses ?? []).length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <TrendingDown className="h-12 w-12 text-muted-foreground/50" />
                        <p className="mt-4 text-lg font-medium text-foreground">Nenhuma despesa registrada</p>
                        <p className="mt-1 text-sm text-muted-foreground max-w-sm">
                            Registre luz, água, assinaturas e outros gastos. Use o botão <strong>Nova Despesa</strong>{" "}
                            no card &quot;Gastos do escritório&quot; acima para criar a primeira despesa.
                        </p>
                    </div>
                ) : (
                    <>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Categoria</TableHead>
                                    <TableHead>Descrição</TableHead>
                                    <TableHead>Valor</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Vencimento</TableHead>
                                    <TableHead className="w-10"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pageData.map((e) => (
                                    <TableRow key={e.id} className="cursor-pointer" onDoubleClick={() => onEdit(e)}>
                                        <TableCell>
                                            <span className="inline-flex items-center gap-1.5">
                                                {(() => {
                                                    const Icon = CATEGORY_ICONS[e.category];
                                                    return Icon ? (
                                                        <Icon className="h-4 w-4 text-muted-foreground" />
                                                    ) : null;
                                                })()}
                                                {CATEGORY_LABELS[e.category] ?? e.category}
                                            </span>
                                        </TableCell>
                                        <TableCell>{e.description || "—"}</TableCell>
                                        <TableCell className="font-semibold">{formatCurrency(e.value)}</TableCell>
                                        <TableCell>
                                            <Badge variant={statusBadge[e.status]?.variant ?? "secondary"}>
                                                {e.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {formatDate(e.due_date)}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => onEdit(e)}
                                                    title="Editar despesa"
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => onEdit(e)}>
                                                            <Pencil className="mr-2 h-4 w-4" />
                                                            Editar despesa
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="text-destructive"
                                                            onClick={() => onDelete(e.id)}
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Excluir
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </TableCell>
                                    </TableRow>
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
