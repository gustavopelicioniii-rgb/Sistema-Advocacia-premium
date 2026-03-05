import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Plus, Pencil, Zap, Droplets, FileText, Box, DollarSign, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    useOfficeExpenses,
    useAddOfficeExpense,
    useUpdateOfficeExpense,
    useDeleteOfficeExpense,
} from "@/hooks/useOfficeExpenses";
import {
    useOfficeExpenseCategorySettings,
    useUpsertOfficeExpenseCategorySetting,
    getCategoryDisplayName,
    getCategoryBudgetValue,
    DEFAULT_NAMES,
    type Category,
} from "@/hooks/useOfficeExpenseCategorySettings";
import { useAuth } from "@/contexts/AuthContext";

const CATEGORIES: Category[] = ["luz", "agua", "assinaturas", "outros"];
const CATEGORY_ICONS: Record<Category, React.ReactNode> = {
    luz: <Zap className="h-5 w-5" />,
    agua: <Droplets className="h-5 w-5" />,
    assinaturas: <FileText className="h-5 w-5" />,
    outros: <Box className="h-5 w-5" />,
};

function formatBRL(value: number) {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

const DespesasEscritorio = () => {
    const { user } = useAuth();
    const { data: expenses = [], isLoading } = useOfficeExpenses();
    const { data: categorySettings = [] } = useOfficeExpenseCategorySettings();
    const addExpense = useAddOfficeExpense();
    const updateExpense = useUpdateOfficeExpense();
    const deleteExpense = useDeleteOfficeExpense();
    const upsertCategory = useUpsertOfficeExpenseCategorySetting();

    const [modalNovaDespesa, setModalNovaDespesa] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [editDisplayName, setEditDisplayName] = useState("");
    const [editBudgetValue, setEditBudgetValue] = useState("");

    // Nova despesa form
    const [newCategory, setNewCategory] = useState<Category>("outros");
    const [newDescription, setNewDescription] = useState("");
    const [newValue, setNewValue] = useState("");
    const [newStatus, setNewStatus] = useState<"Pago" | "Pendente" | "Atrasado" | "Cancelado">("Pendente");

    const totaisPorCategoria = CATEGORIES.reduce(
        (acc, cat) => {
            acc[cat] = expenses.filter((e) => e.category === cat).reduce((s, e) => s + e.value, 0);
            return acc;
        },
        {} as Record<Category, number>,
    );
    const totalGeral = Object.values(totaisPorCategoria).reduce((a, b) => a + b, 0);
    const countPorCategoria = CATEGORIES.reduce(
        (acc, cat) => {
            acc[cat] = expenses.filter((e) => e.category === cat).length;
            return acc;
        },
        {} as Record<Category, number>,
    );

    const handleOpenEditCategory = (cat: Category) => {
        setEditingCategory(cat);
        setEditDisplayName(getCategoryDisplayName(cat, categorySettings));
        setEditBudgetValue(String(getCategoryBudgetValue(cat, categorySettings)));
    };

    const handleSaveCategory = () => {
        if (!editingCategory) return;
        const budget = parseFloat(editBudgetValue) || 0;
        upsertCategory.mutate(
            {
                category: editingCategory,
                display_name: editDisplayName || DEFAULT_NAMES[editingCategory],
                budget_value: budget,
            },
            { onSuccess: () => setEditingCategory(null) },
        );
    };

    const handleNovaDespesa = () => {
        const value = parseFloat(newValue);
        if (!newDescription.trim() || isNaN(value) || value < 0) return;
        addExpense.mutate(
            {
                category: newCategory,
                description: newDescription.trim(),
                value,
                status: newStatus,
                due_date: null,
                paid_date: null,
            },
            {
                onSuccess: () => {
                    setModalNovaDespesa(false);
                    setNewDescription("");
                    setNewValue("");
                    setNewStatus("Pendente");
                },
            },
        );
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-24">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="ml-3 text-muted-foreground">Carregando...</span>
            </div>
        );
    }

    return (
        <>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-5xl">
                <div>
                    <h1 className="font-display text-3xl font-bold text-foreground">Despesas do escritório</h1>
                    <p className="mt-1 text-muted-foreground">
                        Dashboard por categoria: Luz, Água, Assinaturas e Outros. Todas as despesas podem ser editadas
                        ou excluídas.
                    </p>
                </div>

                {/* Card único: Gastos do escritório — UM SÓ BOTÃO no canto superior direito */}
                <Card>
                    <CardHeader className="flex flex-row items-start justify-between space-y-0">
                        <div>
                            <CardTitle className="font-display text-lg">Gastos do escritório</CardTitle>
                            <CardDescription>
                                Dashboard por categoria: Luz, Água, Assinaturas e Outros. Todas as despesas podem ser
                                editadas ou excluídas.
                            </CardDescription>
                        </div>
                        <Button onClick={() => setModalNovaDespesa(true)} className="shrink-0">
                            <Plus className="mr-2 h-4 w-4" /> Nova Despesa
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {expenses.length === 0 && (
                            <p className="rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
                                Nenhuma despesa registrada. Registre luz, água, assinaturas e outros gastos para ver os
                                totais aqui.
                            </p>
                        )}

                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            {CATEGORIES.map((cat) => (
                                <div key={cat} className="flex flex-col rounded-lg border bg-muted/40 p-4">
                                    <div className="flex items-center justify-between gap-1">
                                        <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                                            {CATEGORY_ICONS[cat]}
                                            {getCategoryDisplayName(cat, categorySettings)}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => handleOpenEditCategory(cat)}
                                            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                                            aria-label="Editar categoria"
                                        >
                                            <Pencil className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                    <p className="mt-1 text-lg font-semibold">{formatBRL(totaisPorCategoria[cat])}</p>
                                    <p className="text-xs text-muted-foreground">{countPorCategoria[cat]} despesa(s)</p>
                                    {getCategoryBudgetValue(cat, categorySettings) > 0 && (
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            Meta: {formatBRL(getCategoryBudgetValue(cat, categorySettings))}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center gap-2 rounded-lg border bg-muted/40 p-4">
                            <DollarSign className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="text-sm font-medium text-foreground">Total geral</p>
                                <p className="text-xl font-semibold">{formatBRL(totalGeral)}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Todas as despesas — SEM botão repetido */}
                <Card>
                    <CardHeader>
                        <CardTitle className="font-display text-lg">Todas as despesas</CardTitle>
                        <CardDescription>
                            Clique no ícone de lápis ou duplo clique na linha para editar.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {expenses.length === 0 ? (
                            <p className="py-8 text-center text-sm text-muted-foreground">
                                Nenhuma despesa registrada. Registre luz, água, assinaturas e outros gastos. Use o botão{" "}
                                <strong>Nova Despesa</strong> no card acima para criar a primeira despesa.
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {expenses.map((exp) => (
                                    <div
                                        key={exp.id}
                                        className="flex items-center justify-between rounded-md border bg-card px-3 py-2 text-sm"
                                    >
                                        <div>
                                            <span className="font-medium">{exp.description}</span>
                                            <span className="ml-2 text-muted-foreground">
                                                {getCategoryDisplayName(exp.category as Category, categorySettings)} ·{" "}
                                                {formatBRL(exp.value)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => {
                                                    const desc = prompt("Descrição", exp.description);
                                                    if (desc != null && desc.trim())
                                                        updateExpense.mutate({ id: exp.id, description: desc.trim() });
                                                }}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive hover:text-destructive"
                                                onClick={() =>
                                                    window.confirm("Excluir esta despesa?") &&
                                                    deleteExpense.mutate(exp.id)
                                                }
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>

            {/* Modal: Nova Despesa */}
            <Dialog open={modalNovaDespesa} onOpenChange={setModalNovaDespesa}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Nova Despesa</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label>Categoria</Label>
                            <Select value={newCategory} onValueChange={(v: Category) => setNewCategory(v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {CATEGORIES.map((c) => (
                                        <SelectItem key={c} value={c}>
                                            {getCategoryDisplayName(c, categorySettings)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Descrição</Label>
                            <Input
                                placeholder="Ex.: Conta de luz jan/26"
                                value={newDescription}
                                onChange={(e) => setNewDescription(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Valor (R$)</Label>
                            <Input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0,00"
                                value={newValue}
                                onChange={(e) => setNewValue(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select
                                value={newStatus}
                                onValueChange={(v: "Pago" | "Pendente" | "Atrasado" | "Cancelado") => setNewStatus(v)}
                            >
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
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setModalNovaDespesa(false)}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleNovaDespesa}
                            disabled={addExpense.isPending || !newDescription.trim() || !newValue.trim()}
                        >
                            {addExpense.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Salvar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal: Editar categoria (nome e valor/meta) */}
            <Dialog open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar categoria</DialogTitle>
                    </DialogHeader>
                    {editingCategory && (
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label>Nome da categoria</Label>
                                <Input
                                    value={editDisplayName}
                                    onChange={(e) => setEditDisplayName(e.target.value)}
                                    placeholder={DEFAULT_NAMES[editingCategory]}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Valor meta / orçamento (R$)</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={editBudgetValue}
                                    onChange={(e) => setEditBudgetValue(e.target.value)}
                                    placeholder="0,00"
                                />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingCategory(null)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleSaveCategory} disabled={upsertCategory.isPending}>
                            {upsertCategory.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Salvar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default DespesasEscritorio;
