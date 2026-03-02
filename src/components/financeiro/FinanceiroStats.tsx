import { DollarSign, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useFeeStats } from "@/hooks/useFees";

const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export const FinanceiroStats = () => {
    const stats = useFeeStats();

    return (
        <div className="grid gap-4 sm:grid-cols-4">
            <Card>
                <CardContent className="flex items-center gap-4 p-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <DollarSign className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Receita Total</p>
                        <p className="text-2xl font-bold text-foreground">{formatCurrency(stats.total)}</p>
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="flex items-center gap-4 p-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10 text-success">
                        <CheckCircle className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Recebido</p>
                        <p className="text-2xl font-bold text-foreground">{formatCurrency(stats.pago)}</p>
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="flex items-center gap-4 p-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-warning/10 text-warning">
                        <Clock className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Pendente</p>
                        <p className="text-2xl font-bold text-foreground">{formatCurrency(stats.pendente)}</p>
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardContent className="flex items-center gap-4 p-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                        <AlertTriangle className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Atrasado</p>
                        <p className="text-2xl font-bold text-foreground">{formatCurrency(stats.atrasado)}</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
