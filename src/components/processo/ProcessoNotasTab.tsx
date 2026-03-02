import { MessageSquare, Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { UseMutationResult } from "@tanstack/react-query";

interface NotaItem {
    id: string;
    content: string;
    updated_at: string;
}

interface Props {
    notes: NotaItem[];
    onAddNote: () => void;
    onEditNote: (note: { id: string; content: string }) => void;
    deleteNote: UseMutationResult<void, Error, string>;
}

export function ProcessoNotasTab({ notes, onAddNote, onEditNote, deleteNote }: Props) {
    return (
        <>
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-semibold text-foreground">Notas internas</h3>
                <Button size="sm" variant="outline" onClick={onAddNote}>
                    <Plus className="mr-2 h-4 w-4" /> Nova nota
                </Button>
            </div>
            {notes.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                    <MessageSquare className="h-10 w-10 mx-auto mb-4 opacity-20" />
                    <p className="text-sm">Nenhuma nota. Use para anotações rápidas sobre o processo.</p>
                    <Button size="sm" variant="outline" className="mt-4" onClick={onAddNote}>
                        Nova nota
                    </Button>
                </div>
            ) : (
                <div className="space-y-2">
                    {notes.map((note) => (
                        <Card key={note.id}>
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between gap-2">
                                    <p className="text-sm text-foreground whitespace-pre-wrap flex-1">{note.content}</p>
                                    <div className="flex items-center gap-1 shrink-0">
                                        <span className="text-xs text-muted-foreground">
                                            {format(parseISO(note.updated_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground"
                                            onClick={() => onEditNote({ id: note.id, content: note.content })}
                                            aria-label="Editar nota"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                            onClick={() => deleteNote.mutate(note.id)}
                                            disabled={deleteNote.isPending}
                                            aria-label="Excluir nota"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </>
    );
}
