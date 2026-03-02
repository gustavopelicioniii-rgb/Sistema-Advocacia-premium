import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Clock, Calendar, FileText, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProcessoDetail } from "@/hooks/useProcessoDetail";
import { ProcessoHeader } from "@/components/processo/ProcessoHeader";
import { ProcessoSidebarInfo } from "@/components/processo/ProcessoSidebarInfo";
import { ProcessoTimelineTab } from "@/components/processo/ProcessoTimelineTab";
import { ProcessoAudienciasTab } from "@/components/processo/ProcessoAudienciasTab";
import { ProcessoDocumentosTab } from "@/components/processo/ProcessoDocumentosTab";
import { ProcessoNotasTab } from "@/components/processo/ProcessoNotasTab";
import { ProcessoAndamentoDialog } from "@/components/processo/dialogs/ProcessoAndamentoDialog";
import { ProcessoAudienciaDialog } from "@/components/processo/dialogs/ProcessoAudienciaDialog";
import { ProcessoNotaDialog } from "@/components/processo/dialogs/ProcessoNotaDialog";
import { ProcessoDocumentoDialog } from "@/components/processo/dialogs/ProcessoDocumentoDialog";
import { ProcessoStatusDialog } from "@/components/processo/dialogs/ProcessoStatusDialog";
import type { StatusProcesso } from "@/hooks/useProcessoDetail";

const ProcessoDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("timeline");

    // Dialog visibility state
    const [andamentoOpen, setAndamentoOpen] = useState(false);
    const [audienciaOpen, setAudienciaOpen] = useState(false);
    const [statusOpen, setStatusOpen] = useState(false);
    const [noteOpen, setNoteOpen] = useState(false);
    const [docOpen, setDocOpen] = useState(false);

    // Note editing state
    const [editingNote, setEditingNote] = useState<{ id: string; content: string } | null>(null);

    const {
        processo,
        isLoading,
        timeline,
        audiencias,
        notes,
        documents,
        createAndamento,
        createAudiencia,
        updateStatus,
        createNote,
        updateNote,
        deleteNote,
        createDoc,
        deleteDoc,
    } = useProcessoDetail(id);

    const handleOpenNote = (note?: { id: string; content: string }) => {
        setEditingNote(note ?? null);
        setNoteOpen(true);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!processo) {
        return (
            <div className="text-center py-20">
                <p className="text-muted-foreground">Processo não encontrado.</p>
                <Button variant="link" onClick={() => navigate("/processos")}>
                    Voltar para a lista
                </Button>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 min-w-0 w-full max-w-full overflow-x-hidden"
        >
            <ProcessoHeader
                processo={processo}
                onNewAndamento={() => setAndamentoOpen(true)}
                onOpenStatus={() => setStatusOpen(true)}
            />

            <div className="grid gap-6 lg:grid-cols-3 min-w-0">
                <ProcessoSidebarInfo processo={processo} />

                <div className="lg:col-span-2 space-y-6">
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="grid grid-cols-4 w-full">
                            <TabsTrigger value="timeline" className="flex items-center gap-2">
                                <Clock className="h-3.5 w-3.5" /> Timeline
                            </TabsTrigger>
                            <TabsTrigger value="audiencias" className="flex items-center gap-2">
                                <Calendar className="h-3.5 w-3.5" /> Audiências
                            </TabsTrigger>
                            <TabsTrigger value="documentos" className="flex items-center gap-2">
                                <FileText className="h-3.5 w-3.5" /> Docs
                            </TabsTrigger>
                            <TabsTrigger value="notas" className="flex items-center gap-2">
                                <MessageSquare className="h-3.5 w-3.5" /> Notas
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="timeline" className="mt-6">
                            <ProcessoTimelineTab timeline={timeline} onAddAndamento={() => setAndamentoOpen(true)} />
                        </TabsContent>

                        <TabsContent value="audiencias" className="mt-6">
                            <ProcessoAudienciasTab
                                audiencias={audiencias}
                                onAddAudiencia={() => setAudienciaOpen(true)}
                            />
                        </TabsContent>

                        <TabsContent value="documentos" className="mt-6">
                            <ProcessoDocumentosTab
                                documents={documents}
                                onAddDoc={() => setDocOpen(true)}
                                deleteDoc={deleteDoc}
                            />
                        </TabsContent>

                        <TabsContent value="notas" className="mt-6">
                            <ProcessoNotasTab
                                notes={notes}
                                onAddNote={() => handleOpenNote()}
                                onEditNote={(note) => handleOpenNote(note)}
                                deleteNote={deleteNote}
                            />
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            <ProcessoAndamentoDialog
                open={andamentoOpen}
                onOpenChange={setAndamentoOpen}
                createAndamento={createAndamento}
            />
            <ProcessoAudienciaDialog
                open={audienciaOpen}
                onOpenChange={setAudienciaOpen}
                createAudiencia={createAudiencia}
            />
            <ProcessoNotaDialog
                open={noteOpen}
                onOpenChange={(o) => {
                    setNoteOpen(o);
                    if (!o) setEditingNote(null);
                }}
                editingNote={editingNote}
                createNote={createNote}
                updateNote={updateNote}
            />
            <ProcessoDocumentoDialog open={docOpen} onOpenChange={setDocOpen} createDoc={createDoc} />
            <ProcessoStatusDialog
                open={statusOpen}
                onOpenChange={setStatusOpen}
                currentStatus={(processo.status as StatusProcesso) ?? "Em andamento"}
                updateStatus={updateStatus}
            />
        </motion.div>
    );
};

export default ProcessoDetail;
