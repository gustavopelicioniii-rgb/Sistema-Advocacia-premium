import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import type { UseMutationResult } from "@tanstack/react-query";

interface EditingNote {
    id: string;
    content: string;
}

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editingNote: EditingNote | null;
    createNote: UseMutationResult<void, Error, string>;
    updateNote: UseMutationResult<void, Error, { noteId: string; content: string }>;
}

export function ProcessoNotaDialog({ open, onOpenChange, editingNote, createNote, updateNote }: Props) {
    const [content, setContent] = useState("");

    useEffect(() => {
        if (open) setContent(editingNote?.content ?? "");
    }, [open, editingNote]);

    const handleClose = () => {
        onOpenChange(false);
        setContent("");
    };

    const handleSubmit = () => {
        const c = content.trim();
        if (!c) {
            toast.error("Digite o conteúdo da nota.");
            return;
        }
        if (editingNote) {
            updateNote.mutate({ noteId: editingNote.id, content: c }, { onSuccess: handleClose });
        } else {
            createNote.mutate(c, { onSuccess: handleClose });
        }
    };

    const isPending = createNote.isPending || updateNote.isPending;

    return (
        <Dialog
            open={open}
            onOpenChange={(o) => {
                if (!o) handleClose();
                else onOpenChange(true);
            }}
        >
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{editingNote ? "Editar nota" : "Nova nota"}</DialogTitle>
                </DialogHeader>
                <div className="py-2">
                    <Label htmlFor="note-content">Conteúdo</Label>
                    <Textarea
                        id="note-content"
                        placeholder="Anotação sobre o processo..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows={4}
                        className="mt-2"
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit} disabled={isPending}>
                        {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                        {editingNote ? "Salvar" : "Adicionar"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
