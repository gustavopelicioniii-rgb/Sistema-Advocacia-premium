import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import type { UseMutationResult } from "@tanstack/react-query";

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    createDoc: UseMutationResult<void, Error, { title: string; url?: string; description?: string; file?: File }>;
}

export function ProcessoDocumentoDialog({ open, onOpenChange, createDoc }: Props) {
    const [title, setTitle] = useState("");
    const [url, setUrl] = useState("");
    const [description, setDescription] = useState("");
    const [file, setFile] = useState<File | null>(null);

    const handleClose = () => {
        onOpenChange(false);
        setTitle("");
        setUrl("");
        setDescription("");
        setFile(null);
    };

    const handleSubmit = () => {
        const t = (title.trim() || file?.name || "").trim();
        if (!t) {
            toast.error("Informe o título.");
            return;
        }
        createDoc.mutate(
            {
                title: t,
                url: url.trim() || undefined,
                description: description.trim() || undefined,
                file: file || undefined,
            },
            { onSuccess: handleClose },
        );
    };

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
                    <DialogTitle>Adicionar documento, link ou arquivo</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                    <div>
                        <Label htmlFor="doc-title">Título *</Label>
                        <Input
                            id="doc-title"
                            placeholder={file ? file.name : "Ex: Petição inicial, Decisão 12/02/2025"}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="mt-1"
                        />
                    </div>
                    <div>
                        <Label htmlFor="doc-file">Arquivo (upload)</Label>
                        <Input
                            id="doc-file"
                            type="file"
                            className="mt-1"
                            onChange={(e) => {
                                const f = e.target.files?.[0];
                                setFile(f ?? null);
                                if (f && !title.trim()) setTitle(f.name);
                            }}
                        />
                        {file && (
                            <p className="text-xs text-muted-foreground mt-1">
                                {file.name} ({(file.size / 1024).toFixed(1)} KB)
                            </p>
                        )}
                    </div>
                    <div>
                        <Label htmlFor="doc-url">URL (link externo, opcional)</Label>
                        <Input
                            id="doc-url"
                            type="url"
                            placeholder="https://..."
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            className="mt-1"
                        />
                    </div>
                    <div>
                        <Label htmlFor="doc-desc">Descrição (opcional)</Label>
                        <Textarea
                            id="doc-desc"
                            placeholder="Breve descrição do documento"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={2}
                            className="mt-1"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit} disabled={createDoc.isPending}>
                        {createDoc.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                        Adicionar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
