import { DollarSign, TrendingDown, Plus, Zap, Droplets, FileText, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useExpenseStats } from "@/hooks/useExpenses";

const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

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

interface ExpensesDashboardProps {
    hasExpenses: boolean;
    onNewExpense: () => void;
}

export const ExpensesDashboard = ({ hasExpenses, onNewExpense }: ExpensesDashboardProps) => {
    const expenseStats = useExpenseStats();

    return (
        <Card>
            <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
                <div>
                    <CardTitle className="font-display text-xl flex items-center gap-2">
                        <TrendingDown className="h-5 w-5" /> Gastos do escritório
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Dashboard por categoria: Luz, Água, Assinaturas e Outros. Todas as despesas podem ser editadas
                        ou excluídas.
                    </p>
                </div>
                <Button onClick={onNewExpense} className="shrink-0">
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Despesa
                </Button>
            </CardHeader>
            <CardContent>
                {!hasExpenses && (
                    <div className="mb-4 rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4">
                        <p className="text-sm text-foreground font-medium">
                            Nenhuma despesa registrada. Registre luz, água, assinaturas e outros gastos para ver os
                            totais aqui. Use o botão &quot;Nova Despesa&quot; acima.
                        </p>
                    </div>
                )}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    {(["luz", "agua", "assinaturas", "outros"] as const).map((cat) => {
                        const Icon = CATEGORY_ICONS[cat];
                        const { total, count } = expenseStats.byCategory[cat];
                        return (
                            <Card key={cat}>
                                <CardContent className="flex items-center gap-4 p-4">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                                        <Icon className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">{CATEGORY_LABELS[cat]}</p>
                                        <p className="text-lg font-bold text-foreground">{formatCurrency(total)}</p>
                                        <p className="text-xs text-muted-foreground">{count} despesa(s)</p>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                    <Card className="bg-primary/5 border-primary/20">
                        <CardContent className="flex items-center gap-4 p-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <DollarSign className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Total geral</p>
                                <p className="text-lg font-bold text-foreground">
                                    {formatCurrency(expenseStats.totalGeral)}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </CardContent>
        </Card>
    );
};
