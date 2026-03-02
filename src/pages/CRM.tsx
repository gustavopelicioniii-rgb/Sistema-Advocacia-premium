import { useState, useCallback, useEffect, useRef } from "react";
import { motion } from "framer-motion";
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
    type CrmStage,
    type CrmClient,
} from "@/hooks/useCrm";

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

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-24">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="ml-3 text-muted-foreground">Carregando CRM...</span>
            </div>
        );
    }

    return (
        <>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="flex items-end justify-between">
                    <div>
                        <h1 className="font-display text-3xl font-bold text-foreground">CRM Jurídico</h1>
                        <p className="mt-1 text-muted-foreground">
                            Arraste os cards entre as colunas para mover clientes no pipeline.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => setImportOpen(true)}>
                            <Upload className="mr-2 h-4 w-4" />
                            Importar CSV
                        </Button>
                        <Button variant="outline" onClick={() => setAddingStage(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Nova Coluna
                        </Button>
                        <Button onClick={handleNewClientClick} disabled={createStage.isPending}>
                            <Plus className="mr-2 h-4 w-4" />
                            Novo Cliente
                        </Button>
                    </div>
                </div>

                {/* Add stage inline */}
                {addingStage && (
                    <div className="flex items-center gap-2 rounded-lg border border-dashed border-accent p-3 bg-accent/5">
                        <Input
                            placeholder="Nome da nova coluna..."
                            value={newStageName}
                            onChange={(e) => setNewStageName(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleAddStage()}
                            autoFocus
                            className="max-w-xs"
                        />
                        <Button size="sm" onClick={handleAddStage} disabled={createStage.isPending}>
                            <Check className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setAddingStage(false)}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                )}

                {/* Kanban Board */}
                <DragDropContext onDragEnd={onDragEnd}>
                    <div
                        className="grid gap-4"
                        style={{ gridTemplateColumns: `repeat(${stages?.length ?? 1}, minmax(280px, 1fr))` }}
                    >
                        {(stages ?? []).map((stage) => {
                            const stageClients = getClientsForStage(stage.id);
                            return (
                                <div key={stage.id} className="space-y-3">
                                    {/* Column header */}
                                    <div className="flex items-center justify-between">
                                        {editingStageName === stage.id ? (
                                            <div className="flex items-center gap-1">
                                                <Input
                                                    value={stageNameDraft}
                                                    onChange={(e) => setStageNameDraft(e.target.value)}
                                                    onKeyDown={(e) => e.key === "Enter" && handleRenameStage(stage.id)}
                                                    className="h-8 text-sm w-32"
                                                    autoFocus
                                                />
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-7 w-7"
                                                    onClick={() => handleRenameStage(stage.id)}
                                                    aria-label="Confirmar renomeação da coluna"
                                                >
                                                    <Check className="h-3 w-3" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="h-7 w-7"
                                                    onClick={() => setEditingStageName(null)}
                                                    aria-label="Cancelar renomeação da coluna"
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-foreground">{stage.name}</h3>
                                                <Badge variant="secondary" className="text-xs">
                                                    {stageClients.length}
                                                </Badge>
                                            </div>
                                        )}
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7"
                                                    aria-label={`Opções da coluna ${stage.name}`}
                                                >
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => openNewClient(stage.id)}>
                                                    <Plus className="mr-2 h-4 w-4" />
                                                    Adicionar Cliente
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
                                                className={`min-h-[200px] space-y-2 rounded-lg border-2 border-dashed p-2 transition-colors ${
                                                    snapshot.isDraggingOver
                                                        ? "border-accent/60 bg-accent/5"
                                                        : "border-transparent"
                                                }`}
                                            >
                                                {stageClients.map((client, index) => (
                                                    <Draggable key={client.id} draggableId={client.id} index={index}>
                                                        {(provided, snapshot) => (
                                                            <div
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                className={`transition-shadow ${snapshot.isDragging ? "shadow-lg" : ""}`}
                                                            >
                                                                <Card className="cursor-pointer transition-shadow hover:shadow-md">
                                                                    <CardContent className="p-4">
                                                                        <div className="flex items-start justify-between">
                                                                            <div className="flex items-center gap-3 flex-1">
                                                                                <div
                                                                                    {...provided.dragHandleProps}
                                                                                    className="cursor-grab text-muted-foreground hover:text-foreground"
                                                                                >
                                                                                    <GripVertical className="h-4 w-4" />
                                                                                </div>
                                                                                <div
                                                                                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${stage.color}`}
                                                                                >
                                                                                    {client.name
                                                                                        .split(" ")
                                                                                        .map((n) => n[0])
                                                                                        .join("")
                                                                                        .slice(0, 2)
                                                                                        .toUpperCase()}
                                                                                </div>
                                                                                <div className="min-w-0 flex-1">
                                                                                    <p className="text-sm font-semibold text-foreground truncate">
                                                                                        {client.name}
                                                                                    </p>
                                                                                    {client.phone && (
                                                                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                                                            <Phone className="h-3 w-3" />
                                                                                            {client.phone}
                                                                                        </p>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                            <DropdownMenu>
                                                                                <DropdownMenuTrigger asChild>
                                                                                    <Button
                                                                                        variant="ghost"
                                                                                        size="icon"
                                                                                        className="h-7 w-7 shrink-0"
                                                                                        aria-label={`Opções do cliente ${client.name}`}
                                                                                    >
                                                                                        <MoreHorizontal className="h-3.5 w-3.5" />
                                                                                    </Button>
                                                                                </DropdownMenuTrigger>
                                                                                <DropdownMenuContent align="end">
                                                                                    <DropdownMenuItem
                                                                                        onClick={() =>
                                                                                            openEditClient(client)
                                                                                        }
                                                                                    >
                                                                                        <Pencil className="mr-2 h-4 w-4" />
                                                                                        Editar
                                                                                    </DropdownMenuItem>
                                                                                    <DropdownMenuItem
                                                                                        className="text-destructive"
                                                                                        onClick={() =>
                                                                                            setDeleteTarget({
                                                                                                type: "client",
                                                                                                id: client.id,
                                                                                            })
                                                                                        }
                                                                                    >
                                                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                                                        Excluir
                                                                                    </DropdownMenuItem>
                                                                                </DropdownMenuContent>
                                                                            </DropdownMenu>
                                                                        </div>
                                                                        {client.email && (
                                                                            <p className="mt-2 text-xs text-muted-foreground flex items-center gap-1 pl-7">
                                                                                <Mail className="h-3 w-3" />
                                                                                {client.email}
                                                                            </p>
                                                                        )}
                                                                        <div className="mt-2 flex items-center justify-between pl-7">
                                                                            <span className="text-xs text-muted-foreground">
                                                                                {client.source}
                                                                            </span>
                                                                        </div>
                                                                    </CardContent>
                                                                </Card>
                                                            </div>
                                                        )}
                                                    </Draggable>
                                                ))}
                                                {provided.placeholder}
                                                {stageClients.length === 0 && !snapshot.isDraggingOver && (
                                                    <div className="flex flex-col items-center justify-center py-8 text-center">
                                                        <Users className="h-8 w-8 text-muted-foreground/30" />
                                                        <p className="mt-2 text-xs text-muted-foreground">
                                                            Arraste um card aqui
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </Droppable>

                                    {/* Add client button at bottom */}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-full border border-dashed border-border text-muted-foreground hover:text-foreground"
                                        onClick={() => openNewClient(stage.id)}
                                    >
                                        <Plus className="mr-1 h-3.5 w-3.5" />
                                        Adicionar
                                    </Button>
                                </div>
                            );
                        })}
                    </div>
                </DragDropContext>
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
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Excluir {deleteTarget?.type === "stage" ? "Coluna" : "Cliente"}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {deleteTarget?.type === "stage"
                                ? "Todos os clientes nesta coluna serão excluídos. Esta ação não pode ser desfeita."
                                : "Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};

export default CRM;
