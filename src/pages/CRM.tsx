import { useState, useCallback, useEffect, useRef } from "react";
import { motion, PanInfo, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import {
    Plus,
    Users,
    Pencil,
    Trash2,
    Check,
    X,
    GripVertical,
    Loader2,
    MoreHorizontal,
    Phone,
    Mail,
    Upload,
    ArrowRight,
    Building2,
    Calendar,
    TrendingUp,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import ClientModal from "@/components/crm/ClientModal";
import CsvImportModal from "@/components/import/CsvImportModal";
import {
    useCrmStages,
    useCrmClients,
    useCreateCrmStage,
    useUpdateCrmStage,
    useDeleteCrmStage,
    useDeleteCrmClient,
    useBatchUpdateClientPositions,
    type CrmClient,
} from "@/hooks/useCrm";
import { cn } from "@/lib/utils";

// Mobile swipe card component with improved UX
const SwipeableClientCard = ({
    client,
    stage,
    onEdit,
    onDelete,
    dragHandleProps,
    isDragging,
}: {
    client: CrmClient;
    stage: { id: string; name: string; color: string; position: number };
    onEdit: () => void;
    onDelete: () => void;
    dragHandleProps: React.HTMLAttributes<HTMLDivElement> | null;
    isDragging: boolean;
}) => {
    const [isRevealed, setIsRevealed] = useState(false);
    const cardX = useMotionValue(0);
    const cardOpacity = useTransform(cardX, [-150, 0, 150], [0.5, 1, 0.5]);
    const deleteOpacity = useTransform(cardX, [-150, -50, 0], [1, 0, 0]);
    const editOpacity = useTransform(cardX, [0, 50, 150], [0, 0, 1]);

    const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        const threshold = 100;
        if (Math.abs(info.offset.x) > threshold) {
            setIsRevealed(true);
            if (info.offset.x < 0) {
                // Swipe left - delete
                setTimeout(() => onDelete(), 200);
            } else {
                // Swipe right - edit
                setTimeout(() => onEdit(), 200);
            }
        } else {
            setIsRevealed(false);
        }
    };

    return (
        <div className="relative group">
            {/* Background action hints */}
            <motion.div
                className="absolute inset-0 flex items-center justify-between px-6 rounded-xl overflow-hidden"
                style={{ opacity: isRevealed ? 1 : 0 }}
            >
                <motion.div
                    style={{ opacity: deleteOpacity }}
                    className="flex items-center gap-2 text-destructive font-semibold"
                >
                    <Trash2 className="h-5 w-5" />
                    <span className="hidden sm:inline">Excluir</span>
                </motion.div>
                <motion.div
                    style={{ opacity: editOpacity }}
                    className="flex items-center gap-2 text-primary font-semibold"
                >
                    <span className="hidden sm:inline">Editar</span>
                    <Pencil className="h-5 w-5" />
                </motion.div>
            </motion.div>

            {/* Main card */}
            <motion.div
                drag="x"
                dragConstraints={{ left: -150, right: 150 }}
                dragElastic={0.2}
                onDragEnd={handleDragEnd}
                style={{ x: cardX, opacity: cardOpacity }}
                className={cn(
                    "relative bg-background cursor-grab active:cursor-grabbing",
                    isDragging && "shadow-2xl scale-105",
                )}
            >
                <Card
                    className={cn(
                        "overflow-hidden border-l-4 transition-all duration-300",
                        "hover:shadow-lg hover:-translate-y-0.5",
                        "backdrop-blur-sm bg-card/95",
                    )}
                    style={{
                        borderLeftColor: `hsl(var(--${stage.color.split(" ")[0].replace("bg-", "").replace("-100", "")}))`,
                    }}
                >
                    <CardContent className="p-0">
                        {/* Card header */}
                        <div className="flex items-start justify-between p-4 pb-2">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <div
                                    {...dragHandleProps}
                                    className="cursor-grab text-muted-foreground/40 hover:text-muted-foreground transition-colors hidden md:block"
                                >
                                    <GripVertical className="h-5 w-5" />
                                </div>
                                <div
                                    className={cn(
                                        "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-bold shadow-sm",
                                        stage.color,
                                    )}
                                >
                                    {client.name
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")
                                        .slice(0, 2)
                                        .toUpperCase()}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h4 className="font-display text-base font-semibold text-foreground truncate">
                                        {client.name}
                                    </h4>
                                    {client.source && (
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <Building2 className="h-3 w-3 text-muted-foreground/60" />
                                            <span className="text-xs text-muted-foreground/80 truncate">
                                                {client.source}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 shrink-0 hover:bg-accent/50"
                                        aria-label={`Opções do cliente ${client.name}`}
                                    >
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40">
                                    <DropdownMenuItem onClick={onEdit}>
                                        <Pencil className="mr-2 h-4 w-4" />
                                        Editar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-destructive" onClick={onDelete}>
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Excluir
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        {/* Contact info */}
                        <div className="px-4 pb-4 space-y-1.5">
                            {client.phone && (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Phone className="h-3.5 w-3.5 shrink-0" />
                                    <span className="truncate">{client.phone}</span>
                                </div>
                            )}
                            {client.email && (
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Mail className="h-3.5 w-3.5 shrink-0" />
                                    <span className="truncate">{client.email}</span>
                                </div>
                            )}
                        </div>

                        {/* Mobile swipe hint */}
                        <div className="md:hidden px-4 pb-3 flex items-center justify-center gap-2 text-xs text-muted-foreground/50">
                            <ArrowRight className="h-3 w-3" />
                            <span>Arraste para ações</span>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
};

const CRM = () => {
    const { data: stages, isLoading: loadingStages } = useCrmStages();
    const { data: clients, isLoading: loadingClients } = useCrmClients();
    const createStage = useCreateCrmStage();
    const updateStage = useUpdateCrmStage();
    const deleteStage = useDeleteCrmStage();
    const deleteClient = useDeleteCrmClient();
    const batchUpdate = useBatchUpdateClientPositions();

    // Local state for optimistic updates during drag
    const [localClients, setLocalClients] = useState<CrmClient[]>([]);
    useEffect(() => {
        if (clients) setLocalClients(clients);
    }, [clients]);

    // UI state
    const [clientModalOpen, setClientModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<CrmClient | null>(null);
    const [targetStageId, setTargetStageId] = useState("");
    const newClientStageIdRef = useRef<string>("");
    const [editingStageName, setEditingStageName] = useState<string | null>(null);
    const [stageNameDraft, setStageNameDraft] = useState("");
    const [newStageName, setNewStageName] = useState("");
    const [addingStage, setAddingStage] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<{ type: "stage" | "client"; id: string } | null>(null);
    const [importOpen, setImportOpen] = useState(false);

    const isLoading = loadingStages || loadingClients;

    const getClientsForStage = useCallback(
        (stageId: string) => localClients.filter((c) => c.stage_id === stageId).sort((a, b) => a.position - b.position),
        [localClients],
    );

    // ---- Drag & Drop ----
    const onDragEnd = (result: DropResult) => {
        const { destination, source, draggableId } = result;
        if (!destination) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        const srcStageId = source.droppableId;
        const dstStageId = destination.droppableId;

        // Clone
        const updated = [...localClients];
        const movedClientIdx = updated.findIndex((c) => c.id === draggableId);
        if (movedClientIdx === -1) return;

        const movedClient = { ...updated[movedClientIdx] };
        movedClient.stage_id = dstStageId;

        // Remove from old position
        updated.splice(movedClientIdx, 1);

        // Calculate new positions for destination column
        const dstClients = updated.filter((c) => c.stage_id === dstStageId).sort((a, b) => a.position - b.position);
        dstClients.splice(destination.index, 0, movedClient);

        // Set new positions
        const positionUpdates: { id: string; stage_id: string; position: number }[] = [];
        dstClients.forEach((c, i) => {
            c.position = i;
            positionUpdates.push({ id: c.id, stage_id: dstStageId, position: i });
        });

        // If moved from a different column, also re-index source
        if (srcStageId !== dstStageId) {
            const srcClients = updated.filter((c) => c.stage_id === srcStageId).sort((a, b) => a.position - b.position);
            srcClients.forEach((c, i) => {
                c.position = i;
                positionUpdates.push({ id: c.id, stage_id: srcStageId, position: i });
            });
        }

        // Rebuild localClients
        const finalClients = updated.filter((c) => c.id !== movedClient.id);
        finalClients.push(movedClient);
        // Also apply destination re-positioning
        for (const upd of positionUpdates) {
            const idx = finalClients.findIndex((c) => c.id === upd.id);
            if (idx !== -1) {
                finalClients[idx] = { ...finalClients[idx], position: upd.position, stage_id: upd.stage_id };
            }
        }

        setLocalClients(finalClients);
        batchUpdate.mutate(positionUpdates);
    };

    // ---- Stage actions ----
    const handleAddStage = async () => {
        if (!newStageName.trim()) return;
        const colors = [
            "bg-purple-100 text-purple-700",
            "bg-pink-100 text-pink-700",
            "bg-teal-100 text-teal-700",
            "bg-orange-100 text-orange-700",
        ];
        await createStage.mutateAsync({
            name: newStageName.trim(),
            color: colors[(stages?.length ?? 0) % colors.length],
            position: stages?.length ?? 0,
        });
        setNewStageName("");
        setAddingStage(false);
    };

    const handleRenameStage = async (id: string) => {
        if (!stageNameDraft.trim()) return;
        await updateStage.mutateAsync({ id, name: stageNameDraft.trim() });
        setEditingStageName(null);
    };

    const handleDeleteConfirm = async () => {
        if (!deleteTarget) return;
        if (deleteTarget.type === "stage") await deleteStage.mutateAsync(deleteTarget.id);
        else await deleteClient.mutateAsync(deleteTarget.id);
        setDeleteTarget(null);
    };

    const openNewClient = (stageId: string) => {
        if (!stageId) return;
        newClientStageIdRef.current = stageId;
        setEditingClient(null);
        setTargetStageId(stageId);
        setClientModalOpen(true);
    };

    const handleNewClientClick = async () => {
        const firstStageId = stages?.[0]?.id;
        if ((stages?.length ?? 0) === 0 || !firstStageId) {
            const newStage = await createStage.mutateAsync({
                name: "Leads",
                color: "bg-slate-100 text-slate-700",
                position: 0,
            });
            openNewClient(newStage.id);
        } else {
            openNewClient(firstStageId);
        }
    };

    const openEditClient = (client: CrmClient) => {
        setEditingClient(client);
        setTargetStageId(client.stage_id);
        setClientModalOpen(true);
    };

    // Calculate metrics
    const totalClients = localClients.length;
    const clientsThisWeek = localClients.filter(
        (c) => new Date(c.created_at).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000,
    ).length;

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary/40" />
                <p className="text-muted-foreground font-medium">Carregando pipeline...</p>
            </div>
        );
    }

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-6 pb-8"
            >
                {/* Premium header with metrics */}
                <div className="space-y-4">
                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                        <div className="space-y-2">
                            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground tracking-tight">
                                Pipeline CRM
                            </h1>
                            <p className="text-muted-foreground text-sm md:text-base max-w-2xl">
                                Gerencie seus leads com gestos intuitivos. Arraste cards entre colunas ou deslize
                                lateral para editar/excluir.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button variant="outline" onClick={() => setImportOpen(true)} className="gap-2">
                                <Upload className="h-4 w-4" />
                                <span className="hidden sm:inline">Importar CSV</span>
                                <span className="sm:hidden">CSV</span>
                            </Button>
                            <Button variant="outline" onClick={() => setAddingStage(true)} className="gap-2">
                                <Plus className="h-4 w-4" />
                                <span className="hidden sm:inline">Nova Coluna</span>
                                <span className="sm:hidden">Coluna</span>
                            </Button>
                            <Button onClick={handleNewClientClick} disabled={createStage.isPending} className="gap-2">
                                <Plus className="h-4 w-4" />
                                Novo Lead
                            </Button>
                        </div>
                    </div>

                    {/* Metrics bar */}
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="grid grid-cols-2 md:grid-cols-4 gap-3"
                    >
                        <div className="glass p-4 rounded-xl border border-border/50">
                            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                                <Users className="h-3.5 w-3.5" />
                                <span>Total de Leads</span>
                            </div>
                            <p className="font-display text-2xl font-bold text-foreground">{totalClients}</p>
                        </div>
                        <div className="glass p-4 rounded-xl border border-border/50">
                            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                                <TrendingUp className="h-3.5 w-3.5" />
                                <span>Esta Semana</span>
                            </div>
                            <p className="font-display text-2xl font-bold text-foreground">{clientsThisWeek}</p>
                        </div>
                        <div className="glass p-4 rounded-xl border border-border/50">
                            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                                <Calendar className="h-3.5 w-3.5" />
                                <span>Colunas</span>
                            </div>
                            <p className="font-display text-2xl font-bold text-foreground">{stages?.length ?? 0}</p>
                        </div>
                        <div className="glass p-4 rounded-xl border border-border/50">
                            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                                <Building2 className="h-3.5 w-3.5" />
                                <span>Conversão</span>
                            </div>
                            <p className="font-display text-2xl font-bold text-foreground">
                                {totalClients > 0 ? Math.round((clientsThisWeek / totalClients) * 100) : 0}%
                            </p>
                        </div>
                    </motion.div>
                </div>

                {/* Add stage inline */}
                <AnimatePresence>
                    {addingStage && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="flex items-center gap-3 rounded-xl border-2 border-dashed border-accent/50 p-4 bg-accent/5">
                                <Input
                                    placeholder="Nome da nova coluna..."
                                    value={newStageName}
                                    onChange={(e) => setNewStageName(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleAddStage()}
                                    autoFocus
                                    className="max-w-xs border-accent/30 focus:border-accent"
                                />
                                <Button size="sm" onClick={handleAddStage} disabled={createStage.isPending}>
                                    <Check className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => setAddingStage(false)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Kanban Board - Responsive */}
                <DragDropContext onDragEnd={onDragEnd}>
                    <div className="flex flex-col md:grid md:gap-4 gap-6 md:overflow-x-auto pb-4">
                        <div
                            className="flex flex-col md:grid gap-6 md:gap-4"
                            style={{
                                gridTemplateColumns:
                                    stages && stages.length > 0
                                        ? `repeat(${stages.length}, minmax(320px, 1fr))`
                                        : "1fr",
                            }}
                        >
                            {(stages ?? []).map((stage, stageIndex) => {
                                const stageClients = getClientsForStage(stage.id);
                                return (
                                    <motion.div
                                        key={stage.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: stageIndex * 0.1 }}
                                        className="space-y-3"
                                    >
                                        {/* Column header */}
                                        <div className="flex items-center justify-between sticky top-0 bg-background/80 backdrop-blur-sm z-10 py-2">
                                            {editingStageName === stage.id ? (
                                                <div className="flex items-center gap-2 flex-1">
                                                    <Input
                                                        value={stageNameDraft}
                                                        onChange={(e) => setStageNameDraft(e.target.value)}
                                                        onKeyDown={(e) => e.key === "Enter" && handleRenameStage(stage.id)}
                                                        className="h-9 text-sm max-w-[200px]"
                                                        autoFocus
                                                    />
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-8 w-8"
                                                        onClick={() => handleRenameStage(stage.id)}
                                                        aria-label="Confirmar renomeação da coluna"
                                                    >
                                                        <Check className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-8 w-8"
                                                        onClick={() => setEditingStageName(null)}
                                                        aria-label="Cancelar renomeação da coluna"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-3 flex-1">
                                                    <h3 className="font-display text-lg font-semibold text-foreground">
                                                        {stage.name}
                                                    </h3>
                                                    <Badge
                                                        variant="secondary"
                                                        className="text-xs font-mono bg-accent/10 text-accent-foreground border border-accent/20"
                                                    >
                                                        {stageClients.length}
                                                    </Badge>
                                                </div>
                                            )}
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 hover:bg-accent/50"
                                                        aria-label={`Opções da coluna ${stage.name}`}
                                                    >
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => openNewClient(stage.id)}>
                                                        <Plus className="mr-2 h-4 w-4" />
                                                        Adicionar Lead
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setEditingStageName(stage.id);
                                                            setStageNameDraft(stage.name);
                                                        }}
                                                    >
                                                        <Pencil className="mr-2 h-4 w-4" />
                                                        Renomear Coluna
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-destructive"
                                                        onClick={() => setDeleteTarget({ type: "stage", id: stage.id })}
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Excluir Coluna
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>

                                        {/* Droppable zone */}
                                        <Droppable droppableId={stage.id}>
                                            {(provided, snapshot) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.droppableProps}
                                                    className={cn(
                                                        "min-h-[300px] md:min-h-[400px] space-y-3 rounded-2xl border-2 border-dashed p-3 transition-all duration-300",
                                                        snapshot.isDraggingOver
                                                            ? "border-accent/60 bg-accent/10 shadow-lg shadow-accent/20"
                                                            : "border-transparent bg-muted/20",
                                                    )}
                                                >
                                                    <AnimatePresence mode="popLayout">
                                                        {stageClients.map((client, index) => (
                                                            <Draggable key={client.id} draggableId={client.id} index={index}>
                                                                {(provided, snapshot) => (
                                                                    <motion.div
                                                                        ref={provided.innerRef}
                                                                        {...provided.draggableProps}
                                                                        layout
                                                                        initial={{ opacity: 0, scale: 0.8 }}
                                                                        animate={{ opacity: 1, scale: 1 }}
                                                                        exit={{ opacity: 0, scale: 0.8 }}
                                                                        transition={{ duration: 0.2 }}
                                                                    >
                                                                        <SwipeableClientCard
                                                                            client={client}
                                                                            stage={stage}
                                                                            onEdit={() => openEditClient(client)}
                                                                            onDelete={() =>
                                                                                setDeleteTarget({
                                                                                    type: "client",
                                                                                    id: client.id,
                                                                                })
                                                                            }
                                                                            dragHandleProps={provided.dragHandleProps}
                                                                            isDragging={snapshot.isDragging}
                                                                        />
                                                                    </motion.div>
                                                                )}
                                                            </Draggable>
                                                        ))}
                                                    </AnimatePresence>
                                                    {provided.placeholder}
                                                    {stageClients.length === 0 && !snapshot.isDraggingOver && (
                                                        <motion.div
                                                            initial={{ opacity: 0 }}
                                                            animate={{ opacity: 1 }}
                                                            className="flex flex-col items-center justify-center py-12 text-center"
                                                        >
                                                            <div className="p-4 bg-muted/40 rounded-2xl mb-3">
                                                                <Users className="h-8 w-8 text-muted-foreground/30" />
                                                            </div>
                                                            <p className="text-sm text-muted-foreground font-medium">
                                                                Nenhum lead nesta etapa
                                                            </p>
                                                            <p className="text-xs text-muted-foreground/60 mt-1">
                                                                Arraste um card ou adicione novo
                                                            </p>
                                                        </motion.div>
                                                    )}
                                                </div>
                                            )}
                                        </Droppable>

                                        {/* Add client button at bottom */}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="w-full border-2 border-dashed border-border/50 text-muted-foreground hover:text-foreground hover:border-accent/50 hover:bg-accent/5 rounded-xl h-11 transition-all"
                                            onClick={() => openNewClient(stage.id)}
                                        >
                                            <Plus className="mr-2 h-4 w-4" />
                                            Adicionar Lead
                                        </Button>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                </DragDropContext>

                {/* Empty state */}
                {(!stages || stages.length === 0) && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center py-16 text-center"
                    >
                        <div className="p-6 bg-accent/10 rounded-3xl mb-4">
                            <Users className="h-16 w-16 text-accent" />
                        </div>
                        <h3 className="font-display text-2xl font-semibold mb-2">Seu pipeline está vazio</h3>
                        <p className="text-muted-foreground mb-6 max-w-md">
                            Comece criando sua primeira coluna para organizar seus leads
                        </p>
                        <Button onClick={() => setAddingStage(true)} size="lg" className="gap-2">
                            <Plus className="h-5 w-5" />
                            Criar Primeira Coluna
                        </Button>
                    </motion.div>
                )}
            </motion.div>

            <ClientModal
                key={editingClient?.id ?? `new-${newClientStageIdRef.current || targetStageId}`}
                open={clientModalOpen}
                onOpenChange={setClientModalOpen}
                client={editingClient}
                stageId={editingClient ? editingClient.stage_id : newClientStageIdRef.current || targetStageId}
                position={
                    getClientsForStage(
                        editingClient ? editingClient.stage_id : newClientStageIdRef.current || targetStageId,
                    ).length
                }
            />
            <CsvImportModal open={importOpen} onOpenChange={setImportOpen} type="crm_clients" />

            {/* Delete confirmation */}
            <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <AlertDialogContent className="max-w-md">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="font-display text-xl">
                            Excluir {deleteTarget?.type === "stage" ? "Coluna" : "Lead"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {deleteTarget?.type === "stage"
                                ? "Todos os leads nesta coluna serão excluídos permanentemente. Esta ação não pode ser desfeita."
                                : "Tem certeza que deseja excluir este lead? Esta ação não pode ser desfeita."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Excluir Permanentemente
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};

export default CRM;
