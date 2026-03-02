import { useState } from "react";
import { motion } from "framer-motion";
import {
  DollarSign, TrendingUp, TrendingDown, Clock, CheckCircle, Plus, Upload,
  ArrowUpRight, MoreHorizontal, Pencil, Trash2, Loader2, AlertTriangle,
  CreditCard, QrCode, Link2, Copy, ExternalLink, Percent, Split,
  Zap, Droplets, FileText, Package,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import FeeModal from "@/components/financeiro/FeeModal";
import ExpenseModal from "@/components/financeiro/ExpenseModal";
import CsvImportModal from "@/components/import/CsvImportModal";
import { useFees, useFeeStats, useDeleteFee, type Fee } from "@/hooks/useFees";
import { useExpenses, useExpenseStats, useDeleteExpense, type OfficeExpense } from "@/hooks/useExpenses";
import { useToast } from "@/hooks/use-toast";

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

const CATEGORY_ICONS: Record<string, typeof Zap> = { luz: Zap, agua: Droplets, assinaturas: FileText, outros: Package };
const CATEGORY_LABELS: Record<string, string> = { luz: "Luz", agua: "Água", assinaturas: "Assinaturas", outros: "Outros" };

const Financeiro = () => {
  const { data: fees, isLoading } = useFees();
  const stats = useFeeStats();
  const deleteMutation = useDeleteFee();
  const { data: expenses, isLoading: expensesLoading } = useExpenses();
  const expenseStats = useExpenseStats();
  const deleteExpenseMutation = useDeleteExpense();
  const { toast } = useToast();

  const [feeModalOpen, setFeeModalOpen] = useState(false);
  const [editingFee, setEditingFee] = useState<Fee | null>(null);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<OfficeExpense | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleteExpenseTarget, setDeleteExpenseTarget] = useState<string | null>(null);
  const [chargeOpen, setChargeOpen] = useState(false);
  const [chargeMethod, setChargeMethod] = useState<"pix" | "boleto" | "link">("pix");
  const [chargeClient, setChargeClient] = useState("");
  const [chargeValue, setChargeValue] = useState("");
  const [chargeDesc, setChargeDesc] = useState("");
  const [chargeGenerated, setChargeGenerated] = useState(false);
  const [activeTab, setActiveTab] = useState("honorarios");

  const handleNew = () => { setEditingFee(null); setFeeModalOpen(true); };
  const handleEdit = (fee: Fee) => { setEditingFee(fee); setFeeModalOpen(true); };
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget);
      setDeleteTarget(null);
    } catch {
      // error handled by mutation onError
    }
  };
  const handleNewExpense = () => { setEditingExpense(null); setExpenseModalOpen(true); };
  const handleEditExpense = (exp: OfficeExpense) => { setEditingExpense(exp); setExpenseModalOpen(true); };
  const handleDeleteExpense = async () => {
    if (!deleteExpenseTarget) return;
    try {
      await deleteExpenseMutation.mutateAsync(deleteExpenseTarget);
      setDeleteExpenseTarget(null);
    } catch {}
  };

  const handleGenerateCharge = () => {
    if (!chargeClient || !chargeValue) {
      toast({ title: "Preencha cliente e valor", variant: "destructive" });
      return;
    }
    const val = parseFloat(chargeValue);
    if (isNaN(val)) {
      toast({ title: "Valor inválido", variant: "destructive" });
      return;
    }
    setChargeGenerated(true);
    toast({ title: `Cobrança ${chargeMethod.toUpperCase()} gerada!`, description: `${chargeClient} — ${formatCurrency(parseFloat(chargeValue))}` });
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText("https://pay.example.com/charge/abc123");
    toast({ title: "Link copiado!" });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Financeiro</h1>
          <p className="mt-1 text-muted-foreground">Controle de honorários, cobranças, receita e despesas do escritório.</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Valor da causa (processo) e valor dos honorários são diferentes: a causa fica em Processos; os honorários são os valores que o cliente paga ao escritório e aparecem aqui.</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Clique na aba <strong>Despesas</strong> para ver o dashboard de gastos (luz, água, assinaturas).</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)}><Upload className="mr-2 h-4 w-4" />Importar CSV</Button>
          <Button variant="outline" onClick={() => { setChargeOpen(true); setChargeGenerated(false); }}>
            <CreditCard className="mr-2 h-4 w-4" />Gerar Cobrança
          </Button>
          <Button onClick={handleNew}><Plus className="mr-2 h-4 w-4" />Novo Honorário</Button>
        </div>
      </div>

      {/* Stats */}
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

      {/* Cobranças rápidas */}
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="font-display text-xl flex items-center gap-2">
            <CreditCard className="h-5 w-5" /> Cobranças — PIX / Boleto / Link
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Gere cobranças e envie para o cliente. Integre com Asaas, Stripe ou Mercado Pago nas Configurações para baixa automática.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <div
              className="flex items-center gap-4 rounded-lg border p-4 cursor-pointer hover:bg-muted/50 transition-all"
              role="button"
              tabIndex={0}
              onClick={() => { setChargeMethod("pix"); setChargeOpen(true); setChargeGenerated(false); }}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setChargeMethod("pix"); setChargeOpen(true); setChargeGenerated(false); } }}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 text-green-700">
                <QrCode className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold text-foreground">PIX</p>
                <p className="text-xs text-muted-foreground">QR Code + copia e cola</p>
              </div>
            </div>
            <div
              className="flex items-center gap-4 rounded-lg border p-4 cursor-pointer hover:bg-muted/50 transition-all"
              role="button"
              tabIndex={0}
              onClick={() => { setChargeMethod("boleto"); setChargeOpen(true); setChargeGenerated(false); }}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setChargeMethod("boleto"); setChargeOpen(true); setChargeGenerated(false); } }}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                <CreditCard className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Boleto</p>
                <p className="text-xs text-muted-foreground">Gerar boleto bancário</p>
              </div>
            </div>
            <div
              className="flex items-center gap-4 rounded-lg border p-4 cursor-pointer hover:bg-muted/50 transition-all"
              role="button"
              tabIndex={0}
              onClick={() => { setChargeMethod("link"); setChargeOpen(true); setChargeGenerated(false); }}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setChargeMethod("link"); setChargeOpen(true); setChargeGenerated(false); } }}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 text-purple-700">
                <Link2 className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Link de Pagamento</p>
                <p className="text-xs text-muted-foreground">Enviar link por WhatsApp/email</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs: Honorários / Por Processo / Despesas */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="honorarios" className="flex items-center gap-2">
            <DollarSign className="h-3.5 w-3.5" /> Honorários
          </TabsTrigger>
          <TabsTrigger value="por-processo" className="flex items-center gap-2">
            <Split className="h-3.5 w-3.5" /> Por Processo
          </TabsTrigger>
          <TabsTrigger value="despesas" className="flex items-center gap-2" data-state={activeTab === "despesas" ? "active" : "inactive"}>
            <TrendingDown className="h-3.5 w-3.5" /> Despesas do escritório
          </TabsTrigger>
        </TabsList>

        <TabsContent value="honorarios" className="mt-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="font-display text-xl">Honorários</CardTitle>
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
              <Button onClick={handleNew} className="mt-4"><Plus className="mr-2 h-4 w-4" />Registrar Primeiro</Button>
            </div>
          ) : (
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
                {(fees ?? []).map((f) => (
                  <TableRow key={f.id} className="cursor-pointer" onDoubleClick={() => handleEdit(f)}>
                    <TableCell className="font-medium">{f.client}</TableCell>
                    <TableCell className="font-mono text-xs">{f.process_number || "—"}</TableCell>
                    <TableCell>{f.description || "—"}</TableCell>
                    <TableCell className="font-semibold">{formatCurrency(f.value)}</TableCell>
                    <TableCell>
                      <Badge variant={statusBadge[f.status]?.variant ?? "secondary"}>
                        {f.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(f.due_date)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(f)}><Pencil className="mr-2 h-4 w-4" />Editar</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTarget(f.id)}><Trash2 className="mr-2 h-4 w-4" />Excluir</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

        </TabsContent>

        <TabsContent value="por-processo" className="mt-4">
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
                  <p className="mt-1 text-sm text-muted-foreground">Ao criar honorários com número de processo, eles aparecerão agrupados aqui.</p>
                  <Button onClick={handleNew} className="mt-4"><Plus className="mr-2 h-4 w-4" />Novo Honorário</Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(
                    (fees ?? []).reduce<Record<string, Fee[]>>((acc, f) => {
                      const key = f.process_number || "Sem processo";
                      (acc[key] = acc[key] || []).push(f);
                      return acc;
                    }, {})
                  ).map(([proc, items]) => {
                    const total = items.reduce((s, f) => s + Number(f.value), 0);
                    const pago = items.filter(f => f.status === "Pago").reduce((s, f) => s + Number(f.value), 0);
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
                            {items.map(f => (
                              <TableRow key={f.id} className="cursor-pointer" onDoubleClick={() => handleEdit(f)}>
                                <TableCell>{f.description || "—"}</TableCell>
                                <TableCell className="font-semibold">{formatCurrency(f.value)}</TableCell>
                                <TableCell>
                                  <Badge variant={statusBadge[f.status]?.variant ?? "secondary"}>{f.status}</Badge>
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">{formatDate(f.due_date)}</TableCell>
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
        </TabsContent>

        <TabsContent value="despesas" className="mt-4 space-y-4">
          {/* Dashboard de gastos: Luz, Água, Assinaturas, Outros */}
          <Card>
            <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
              <div>
                <CardTitle className="font-display text-xl flex items-center gap-2">
                  <TrendingDown className="h-5 w-5" /> Gastos do escritório
                </CardTitle>
                <p className="text-sm text-muted-foreground">Dashboard por categoria: Luz, Água, Assinaturas e Outros. Todas as despesas podem ser editadas ou excluídas.</p>
              </div>
              <Button onClick={handleNewExpense} className="shrink-0"><Plus className="mr-2 h-4 w-4" />Nova Despesa</Button>
            </CardHeader>
            <CardContent>
              {(expenses ?? []).length === 0 && !expensesLoading && (
                <div className="mb-4 rounded-lg border border-dashed border-primary/30 bg-primary/5 p-4">
                  <p className="text-sm text-foreground font-medium">Nenhuma despesa registrada. Registre luz, água, assinaturas e outros gastos para ver os totais aqui. Use o botão &quot;Nova Despesa&quot; acima.</p>
                </div>
              )}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                {(['luz', 'agua', 'assinaturas', 'outros'] as const).map((cat) => {
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
                      <p className="text-lg font-bold text-foreground">{formatCurrency(expenseStats.totalGeral)}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <div>
                <CardTitle className="font-display text-xl">Todas as despesas</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Clique no ícone de lápis ou duplo clique na linha para editar.</p>
              </div>
            </CardHeader>
            <CardContent>
              {expensesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  <span className="ml-3 text-muted-foreground">Carregando...</span>
                </div>
              ) : (expenses ?? []).length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <TrendingDown className="h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4 text-lg font-medium text-foreground">Nenhuma despesa registrada</p>
                  <p className="mt-1 text-sm text-muted-foreground max-w-sm">Registre luz, água, assinaturas e outros gastos. Use o botão <strong>Nova Despesa</strong> no card &quot;Gastos do escritório&quot; acima para criar a primeira despesa.</p>
                </div>
              ) : (
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
                    {(expenses ?? []).map((e) => (
                      <TableRow key={e.id} className="cursor-pointer" onDoubleClick={() => handleEditExpense(e)}>
                        <TableCell>
                          <span className="inline-flex items-center gap-1.5">
                            {(() => { const Icon = CATEGORY_ICONS[e.category]; return Icon ? <Icon className="h-4 w-4 text-muted-foreground" /> : null; })()}
                            {CATEGORY_LABELS[e.category] ?? e.category}
                          </span>
                        </TableCell>
                        <TableCell>{e.description || "—"}</TableCell>
                        <TableCell className="font-semibold">{formatCurrency(e.value)}</TableCell>
                        <TableCell>
                          <Badge variant={statusBadge[e.status]?.variant ?? "secondary"}>{e.status}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{formatDate(e.due_date)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditExpense(e)} title="Editar despesa">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditExpense(e)}><Pencil className="mr-2 h-4 w-4" />Editar despesa</DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive" onClick={() => setDeleteExpenseTarget(e.id)}><Trash2 className="mr-2 h-4 w-4" />Excluir</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <FeeModal key={editingFee?.id ?? "new"} open={feeModalOpen} onOpenChange={setFeeModalOpen} fee={editingFee} />
      <ExpenseModal key={editingExpense?.id ?? "new"} open={expenseModalOpen} onOpenChange={setExpenseModalOpen} expense={editingExpense} />
      <CsvImportModal open={importOpen} onOpenChange={setImportOpen} type="fees" />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Honorário</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza? Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteExpenseTarget} onOpenChange={(open) => !open && setDeleteExpenseTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Despesa</AlertDialogTitle>
            <AlertDialogDescription>Tem certeza? Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteExpense} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modal: Gerar Cobrança PIX/Boleto/Link */}
      <Dialog open={chargeOpen} onOpenChange={setChargeOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl flex items-center gap-2">
              {chargeMethod === "pix" && <><QrCode className="h-5 w-5 text-green-600" /> Gerar Cobrança PIX</>}
              {chargeMethod === "boleto" && <><CreditCard className="h-5 w-5 text-blue-600" /> Gerar Boleto</>}
              {chargeMethod === "link" && <><Link2 className="h-5 w-5 text-purple-600" /> Gerar Link de Pagamento</>}
            </DialogTitle>
          </DialogHeader>
          {!chargeGenerated ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Cliente *</Label>
                <Input placeholder="Nome do cliente" value={chargeClient} onChange={(e) => setChargeClient(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Valor (R$) *</Label>
                  <Input type="number" step="0.01" placeholder="0,00" value={chargeValue} onChange={(e) => setChargeValue(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Método</Label>
                  <Select value={chargeMethod} onValueChange={(v: "pix" | "boleto" | "link") => setChargeMethod(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="boleto">Boleto</SelectItem>
                      <SelectItem value="link">Link de Pagamento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Input placeholder="Honorários advocatícios..." value={chargeDesc} onChange={(e) => setChargeDesc(e.target.value)} />
              </div>
              <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">Integração de pagamento</p>
                <p>Configure sua conta Asaas, Stripe ou Mercado Pago nas <strong>Configurações</strong> para gerar cobranças reais com baixa automática.</p>
                <p>Sem integração, a cobrança é gerada como registro interno.</p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setChargeOpen(false)}>Cancelar</Button>
                <Button onClick={handleGenerateCharge}>
                  {chargeMethod === "pix" && "Gerar PIX"}
                  {chargeMethod === "boleto" && "Gerar Boleto"}
                  {chargeMethod === "link" && "Gerar Link"}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center py-6 space-y-4">
                {chargeMethod === "pix" && (
                  <>
                    <div className="h-40 w-40 rounded-lg bg-muted flex items-center justify-center border-2 border-dashed">
                      <QrCode className="h-20 w-20 text-green-600" />
                    </div>
                    <p className="text-xs text-muted-foreground text-center">QR Code PIX gerado. Envie ao cliente para pagamento.</p>
                  </>
                )}
                {chargeMethod === "boleto" && (
                  <div className="text-center space-y-2">
                    <CreditCard className="h-16 w-16 text-blue-600 mx-auto" />
                    <p className="font-semibold">Boleto gerado!</p>
                    <p className="text-xs text-muted-foreground">Vencimento em 3 dias úteis.</p>
                  </div>
                )}
                {chargeMethod === "link" && (
                  <div className="text-center space-y-2">
                    <Link2 className="h-16 w-16 text-purple-600 mx-auto" />
                    <p className="font-semibold">Link de pagamento gerado!</p>
                  </div>
                )}
                <div className="flex items-center gap-2 rounded-lg border p-3 bg-muted/30 w-full">
                  <code className="flex-1 text-xs truncate">https://pay.example.com/charge/abc123</code>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={handleCopyLink}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm font-semibold">{chargeClient} — {formatCurrency(parseFloat(chargeValue) || 0)}</p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setChargeOpen(false)}>Fechar</Button>
                <Button onClick={handleCopyLink}>
                  <Copy className="mr-2 h-4 w-4" /> Copiar Link
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default Financeiro;
