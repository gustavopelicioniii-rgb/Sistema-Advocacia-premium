import { useState } from "react";
import { Loader2, DollarSign, Plus, MoreHorizontal, Pencil, Trash2, Search } from "lucide-react";
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
import { useFees, type Fee } from "@/hooks/useFees";
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

interface FeesTableProps {
    onEdit: (fee: Fee) => void;
    onDelete: (feeId: string) => void;
    onNew: () => void;
}

export const FeesTable = ({ onEdit, onDelete, onNew }: FeesTableProps) => {
    const { data: fees, isLoading } = useFees();
    const [search, setSearch] = useState("");

    const filtered = (fees ?? []).filter(
        (f) =>
            f.client.toLowerCase().includes(search.toLowerCase()) ||
            f.process_number.includes(search) ||
            f.description.toLowerCase().includes(search.toLowerCase()),
    );

    const { page, pageCount, pageData, totalItems, goTo } = usePagination(filtered, 20);

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
                        <p className="mt-1 text-sm text-muted-foreground">Clique em "Novo Honorário" para começar.</p>
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
                                    <TableHead>Cliente</TableHead>
                                    <TableHead>Processo</TableHead>
                                    <TableHead>Descrição</TableHead>
                                    <TableHead>Valor do honorário</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Vencimento</TableHead>
                                    <TableHead className="w-10"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pageData.map((f) => (
                                    <TableRow key={f.id} className="cursor-pointer" onDoubleClick={() => onEdit(f)}>
                                        <TableCell className="font-medium">{f.client}</TableCell>
                                        <TableCell className="font-mono text-xs">{f.process_number || "—"}</TableCell>
                                        <TableCell>{f.description || "—"}</TableCell>
                                        <TableCell className="font-semibold">{formatCurrency(f.value)}</TableCell>
                                        <TableCell>
                                            <Badge variant={statusBadge[f.status]?.variant ?? "secondary"}>
                                                {f.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {formatDate(f.due_date)}
                                        </TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
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
