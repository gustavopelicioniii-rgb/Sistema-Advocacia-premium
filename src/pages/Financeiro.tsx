import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Upload, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FeeModal from "@/components/financeiro/FeeModal";
import ExpenseModal from "@/components/financeiro/ExpenseModal";
import CsvImportModal from "@/components/import/CsvImportModal";
import { FinanceiroStats } from "@/components/financeiro/FinanceiroStats";
import { ChargeMethods } from "@/components/financeiro/ChargeMethods";
import { FeesTable } from "@/components/financeiro/FeesTable";
import { FeesByProcess } from "@/components/financeiro/FeesByProcess";
import { ExpensesDashboard } from "@/components/financeiro/ExpensesDashboard";
import { ExpensesTable } from "@/components/financeiro/ExpensesTable";
import { ChargeDialog } from "@/components/financeiro/ChargeDialog";
import { DeleteConfirmDialogs } from "@/components/financeiro/DeleteConfirmDialogs";
import { DollarSign, Split, TrendingDown } from "lucide-react";
import { useFees, useDeleteFee, type Fee } from "@/hooks/useFees";
import { useExpenses, useDeleteExpense, type OfficeExpense } from "@/hooks/useExpenses";

const Financeiro = () => {
    const { data: fees } = useFees();
    const deleteFeesMutation = useDeleteFee();
    const { data: expenses, isLoading: expensesLoading } = useExpenses();
    const deleteExpensesMutation = useDeleteExpense();

    const [feeModalOpen, setFeeModalOpen] = useState(false);
    const [editingFee, setEditingFee] = useState<Fee | null>(null);
    const [expenseModalOpen, setExpenseModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<OfficeExpense | null>(null);
    const [importOpen, setImportOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
    const [deleteExpenseTarget, setDeleteExpenseTarget] = useState<string | null>(null);
    const [chargeOpen, setChargeOpen] = useState(false);
    const [chargeMethod, setChargeMethod] = useState<"pix" | "boleto" | "link">("pix");
    const [activeTab, setActiveTab] = useState("honorarios");

    const handleNewFee = () => {
        setEditingFee(null);
        setFeeModalOpen(true);
    };

    const handleEditFee = (fee: Fee) => {
        setEditingFee(fee);
        setFeeModalOpen(true);
    };

    const handleDeleteFee = async () => {
        if (!deleteTarget) return;
        try {
            await deleteFeesMutation.mutateAsync(deleteTarget);
            setDeleteTarget(null);
        } catch {
            // error handled by mutation onError
        }
    };

    const handleNewExpense = () => {
        setEditingExpense(null);
        setExpenseModalOpen(true);
    };

    const handleEditExpense = (exp: OfficeExpense) => {
        setEditingExpense(exp);
        setExpenseModalOpen(true);
    };

    const handleDeleteExpense = async () => {
        if (!deleteExpenseTarget) return;
        try {
            await deleteExpensesMutation.mutateAsync(deleteExpenseTarget);
            setDeleteExpenseTarget(null);
        } catch {
            // error handled by mutation onError
        }
    };

    const handleChargeMethodSelect = (method: "pix" | "boleto" | "link") => {
        setChargeMethod(method);
        setChargeOpen(true);
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="font-display text-3xl font-bold text-foreground">Financeiro</h1>
                    <p className="mt-1 text-muted-foreground">
                        Controle de honorários, cobranças, receita e despesas do escritório.
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                        Valor da causa (processo) e valor dos honorários são diferentes: a causa fica em Processos; os
                        honorários são os valores que o cliente paga ao escritório e aparecem aqui.
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                        Clique na aba <strong>Despesas</strong> para ver o dashboard de gastos (luz, água, assinaturas).
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setImportOpen(true)}>
                        <Upload className="mr-2 h-4 w-4" />
                        Importar CSV
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => {
                            setChargeOpen(true);
                            setChargeMethod("pix");
                        }}
                    >
                        <CreditCard className="mr-2 h-4 w-4" />
                        Gerar Cobrança
                    </Button>
                    <Button onClick={handleNewFee}>
                        <Plus className="mr-2 h-4 w-4" />
                        Novo Honorário
                    </Button>
                </div>
            </div>

            <FinanceiroStats />

            <ChargeMethods onSelectMethod={handleChargeMethodSelect} />

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="honorarios" className="flex items-center gap-2">
                        <DollarSign className="h-3.5 w-3.5" /> Honorários
                    </TabsTrigger>
                    <TabsTrigger value="por-processo" className="flex items-center gap-2">
                        <Split className="h-3.5 w-3.5" /> Por Processo
                    </TabsTrigger>
                    <TabsTrigger value="despesas" className="flex items-center gap-2">
                        <TrendingDown className="h-3.5 w-3.5" /> Despesas do escritório
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="honorarios" className="mt-4">
                    <FeesTable onEdit={handleEditFee} onDelete={setDeleteTarget} onNew={handleNewFee} />
                </TabsContent>

                <TabsContent value="por-processo" className="mt-4">
                    <FeesByProcess onEdit={handleEditFee} onNew={handleNewFee} />
                </TabsContent>

                <TabsContent value="despesas" className="mt-4 space-y-4">
                    <ExpensesDashboard hasExpenses={(expenses ?? []).length > 0} onNewExpense={handleNewExpense} />
                    <ExpensesTable
                        onEdit={handleEditExpense}
                        onDelete={setDeleteExpenseTarget}
                        onNew={handleNewExpense}
                    />
                </TabsContent>
            </Tabs>

            <FeeModal
                key={editingFee?.id ?? "new"}
                open={feeModalOpen}
                onOpenChange={setFeeModalOpen}
                fee={editingFee}
            />
            <ExpenseModal
                key={editingExpense?.id ?? "new"}
                open={expenseModalOpen}
                onOpenChange={setExpenseModalOpen}
                expense={editingExpense}
            />
            <CsvImportModal open={importOpen} onOpenChange={setImportOpen} type="fees" />
            <ChargeDialog
                open={chargeOpen}
                onOpenChange={setChargeOpen}
                method={chargeMethod}
                onMethodChange={setChargeMethod}
            />
            <DeleteConfirmDialogs
                deleteFeeTarget={deleteTarget}
                deleteExpenseTarget={deleteExpenseTarget}
                onConfirmDeleteFee={handleDeleteFee}
                onConfirmDeleteExpense={handleDeleteExpense}
                onCancelDeleteFee={() => setDeleteTarget(null)}
                onCancelDeleteExpense={() => setDeleteExpenseTarget(null)}
            />
        </motion.div>
    );
};

export default Financeiro;
