import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    Scale,
    Plus,
    Search,
    Filter,
    Clock,
    ArrowUpRight,
    MoreHorizontal,
    Video,
    Pencil,
    Trash2,
    Loader2,
    Upload,
    Eye,
    Download,
    BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import NewMeetingModal from "@/components/agenda/NewMeetingModal";
import ProcessoModal from "@/components/processos/ProcessoModal";
import CsvImportModal from "@/components/import/CsvImportModal";
import {
    useProcessos,
    useProcessoStats,
    useProcessPlanLimit,
    useDeleteProcesso,
    type Processo,
} from "@/hooks/useProcessos";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/ui/table-pagination";

type ProcessStatus = "Em andamento" | "Aguardando prazo" | "Concluído" | "Suspenso";

const statusColor: Record<ProcessStatus, string> = {
    "Em andamento": "bg-info/10 text-info border-info/20",
    "Aguardando prazo": "bg-warning/10 text-warning border-warning/20",
    Concluído: "bg-success/10 text-success border-success/20",
    Suspenso: "bg-muted text-muted-foreground border-border",
};

const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const Processos = () => {
    const navigate = useNavigate();
    const [search, setSearch] = useState("");
    const [newMeetingOpen, setNewMeetingOpen] = useState(false);
    const [processoModalOpen, setProcessoModalOpen] = useState(false);
    const [editingProcesso, setEditingProcesso] = useState<Processo | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
    const [importOpen, setImportOpen] = useState(false);

    const { data: processos, isLoading } = useProcessos();
    const stats = useProcessoStats();
    const { limit, currentCount, atLimit } = useProcessPlanLimit();
    const deleteMutation = useDeleteProcesso();

    const filtered = (processos ?? []).filter(
        (p) =>
            p.client.toLowerCase().includes(search.toLowerCase()) ||
            p.number.includes(search) ||
            p.subject.toLowerCase().includes(search.toLowerCase()),
    );

    const { page, pageCount, pageData, totalItems, goTo } = usePagination(filtered, 20);

    const handleEdit = (processo: Processo) => {
        setEditingProcesso(processo);
        setProcessoModalOpen(true);
    };

    const handleNew = () => {
        setEditingProcesso(null);
        setProcessoModalOpen(true);
    };

    const handleDelete = async () => {
        if (deleteTarget) {
            await deleteMutation.mutateAsync(deleteTarget);
            setDeleteTarget(null);
        }
    };

    return (
        <TooltipProvider>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                {/* Header */}
                <div className="flex items-end justify-between">
                    <div>
                        <h1 className="font-display text-3xl font-bold text-foreground">Processos</h1>
                        <p className="mt-1 text-muted-foreground">Gerencie e acompanhe todos os seus processos.</p>
                    </div>
                    <div className="flex gap-2 items-center">
                        <span className="text-sm text-muted-foreground hidden sm:inline">
                            Processos: {currentCount}/{limit}
                        </span>
                        <Button variant="outline" onClick={() => navigate("/processos/dashboard-escavador")}>
                            <BarChart3 className="mr-2 h-4 w-4" />
                            Dashboard Escavador
                        </Button>
                        <Button variant="outline" onClick={() => navigate("/processos/importar")}>
                            <Download className="mr-2 h-4 w-4" />
                            Importar Escavador
                        </Button>
                        <Button variant="outline" onClick={() => setImportOpen(true)}>
                            <Upload className="mr-2 h-4 w-4" />
                            Importar CSV
                        </Button>
                        <Button
                            onClick={handleNew}
                            disabled={atLimit}
                            title={atLimit ? "Limite do plano atingido" : undefined}
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Novo Processo
                        </Button>
                    </div>
                </div>

                {/* Stats cards */}
                <div className="grid gap-4 sm:grid-cols-4">
                    {[
                        { label: "Total", value: stats.total, icon: Scale },
                        { label: "Em andamento", value: stats.emAndamento, icon: ArrowUpRight },
                        { label: "Aguardando prazo", value: stats.aguardandoPrazo, icon: Clock },
                        { label: "Concluídos", value: stats.concluidos, icon: Scale },
                    ].map((s) => (
                        <Card key={s.label}>
                            <CardContent className="flex items-center gap-4 p-4">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                                    <s.icon className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-foreground">{s.value}</p>
                                    <p className="text-xs text-muted-foreground">{s.label}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Table */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-4">
                        <CardTitle className="font-display text-xl">Todos os Processos</CardTitle>
                        <div className="flex gap-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar por cliente, número ou assunto..."
                                    className="pl-9 w-80"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                            <Button variant="outline" size="icon">
                                <Filter className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                <span className="ml-3 text-muted-foreground">Carregando processos...</span>
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <Scale className="h-12 w-12 text-muted-foreground/50" />
                                <p className="mt-4 text-lg font-medium text-foreground">Nenhum processo encontrado</p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    {search
                                        ? "Tente uma busca diferente."
                                        : 'Clique em "Novo Processo" para cadastrar o primeiro.'}
                                </p>
                                {!search && (
                                    <Button onClick={handleNew} className="mt-4">
                                        <Plus className="mr-2 h-4 w-4" />
                                        Cadastrar Primeiro Processo
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Número</TableHead>
                                        <TableHead>Cliente / Partes</TableHead>
                                        <TableHead>Tribunal</TableHead>
                                        <TableHead>Classe / Assunto</TableHead>
                                        <TableHead>Fase</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Próx. Prazo</TableHead>
                                        <TableHead>Valor da causa</TableHead>
                                        <TableHead className="w-10"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {pageData.map((p) => (
                                        <Tooltip key={p.id}>
                                            <TooltipTrigger asChild>
                                                <TableRow
                                                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                                                    onClick={() => navigate(`/processos/${p.id}`)}
                                                >
                                                    <TableCell className="font-mono text-xs">{p.number}</TableCell>
                                                    <TableCell>
                                                        <div>
                                                            <p className="font-medium text-sm">{p.client}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {p.active_party} vs {p.passive_party}
                                                            </p>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>{p.court}</TableCell>
                                                    <TableCell>
                                                        <div>
                                                            <p className="text-sm">{p.class}</p>
                                                            <p className="text-xs text-muted-foreground">{p.subject}</p>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>{p.phase}</TableCell>
                                                    <TableCell>
                                                        <span
                                                            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusColor[p.status]}`}
                                                        >
                                                            {p.status}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-sm">
                                                        {formatDate(p.next_deadline)}
                                                    </TableCell>
                                                    <TableCell className="font-medium">
                                                        {formatCurrency(p.value)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div
                                                            className="flex items-center gap-1"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8"
                                                                onClick={() => navigate(`/processos/${p.id}`)}
                                                            >
                                                                <Eye className="h-4 w-4" />
                                                            </Button>
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-8 w-8"
                                                                    >
                                                                        <MoreHorizontal className="h-4 w-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end">
                                                                    <DropdownMenuItem onClick={() => handleEdit(p)}>
                                                                        <Pencil className="mr-2 h-4 w-4" />
                                                                        Editar
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        className="text-destructive"
                                                                        onClick={() => setDeleteTarget(p.id)}
                                                                    >
                                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                                        Excluir
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            </TooltipTrigger>
                                            <TooltipContent side="left" className="max-w-sm">
                                                <div className="space-y-1.5">
                                                    <p className="font-semibold">{p.client}</p>
                                                    <p className="text-xs">
                                                        📋 {p.class} — {p.subject}
                                                    </p>
                                                    <p className="text-xs">👤 Responsável: {p.responsible}</p>
                                                    <p className="text-xs">📄 Última mov.: {p.last_movement}</p>
                                                    <p className="text-xs">📎 {p.docs_count} documentos vinculados</p>
                                                    <p className="text-xs font-semibold">
                                                        💰 Valor da causa: {formatCurrency(p.value)}
                                                    </p>
                                                </div>
                                            </TooltipContent>
                                        </Tooltip>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                        {!isLoading && (
                            <TablePagination
                                page={page}
                                pageCount={pageCount}
                                totalItems={totalItems}
                                pageSize={20}
                                onPageChange={goTo}
                            />
                        )}
                    </CardContent>
                </Card>

                {/* Reuniões dos Processos */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-4">
                        <CardTitle className="font-display text-xl flex items-center gap-2">
                            <Video className="h-5 w-5 text-success" />
                            Reuniões dos Processos
                        </CardTitle>
                        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setNewMeetingOpen(true)}>
                            <Plus className="h-3.5 w-3.5" />
                            Agendar Reunião
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <p className="text-sm text-muted-foreground text-center py-4">
                            Nenhuma reunião vinculada a processos no momento. Use a Agenda para agendar.
                        </p>
                    </CardContent>
                </Card>
            </motion.div>

            <NewMeetingModal open={newMeetingOpen} onOpenChange={setNewMeetingOpen} />

            <ProcessoModal
                key={editingProcesso?.id ?? "new"}
                open={processoModalOpen}
                onOpenChange={setProcessoModalOpen}
                processo={editingProcesso}
            />
            <CsvImportModal open={importOpen} onOpenChange={setImportOpen} type="processos" />

            {/* Delete confirmation */}
            <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Processo</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir este processo? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </TooltipProvider>
    );
};

export default Processos;
