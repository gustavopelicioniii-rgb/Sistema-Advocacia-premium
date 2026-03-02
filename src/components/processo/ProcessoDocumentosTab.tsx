import { FileText, ExternalLink, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import type { UseMutationResult } from "@tanstack/react-query";

const PROCESS_DOCS_BUCKET = "documents";

interface DocumentoItem {
    id: string;
    title: string;
    description?: string | null;
    url?: string | null;
    file_path?: string | null;
}

interface Props {
    documents: DocumentoItem[];
    onAddDoc: () => void;
    deleteDoc: UseMutationResult<void, Error, { docId: string; filePath?: string | null }>;
}

export function ProcessoDocumentosTab({ documents, onAddDoc, deleteDoc }: Props) {
    return (
        <>
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-semibold text-foreground">Documentos e links</h3>
                <Button size="sm" variant="outline" onClick={onAddDoc}>
                    <Plus className="mr-2 h-4 w-4" /> Adicionar doc/link
                </Button>
            </div>
            {documents.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg">
                    <FileText className="h-10 w-10 mx-auto mb-4 opacity-20" />
                    <p className="text-sm">
                        Nenhum documento ou link. Adicione referências (petições, decisões, URLs).
                    </p>
                    <Button size="sm" variant="outline" className="mt-4" onClick={onAddDoc}>
                        Adicionar doc/link
                    </Button>
                </div>
            ) : (
                <div className="space-y-2">
                    {documents.map((doc) => (
                        <Card key={doc.id}>
                            <CardContent className="p-4 flex items-center justify-between gap-4">
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold truncate">{doc.title}</p>
                                    {doc.description && (
                                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                            {doc.description}
                                        </p>
                                    )}
                                    {(doc.url || doc.file_path) && (
                                        <a
                                            href={
                                                doc.file_path
                                                    ? supabase.storage
                                                          .from(PROCESS_DOCS_BUCKET)
                                                          .getPublicUrl(doc.file_path).data.publicUrl
                                                    : (doc.url ?? "#")
                                            }
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-primary hover:underline mt-1 inline-flex items-center gap-1"
                                        >
                                            {doc.url && !doc.file_path ? "Abrir link" : "Abrir arquivo"}
                                            <ExternalLink className="h-3 w-3" />
                                        </a>
                                    )}
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="shrink-0 text-muted-foreground hover:text-destructive"
                                    onClick={() => deleteDoc.mutate({ docId: doc.id, filePath: doc.file_path })}
                                    disabled={deleteDoc.isPending}
                                    aria-label={`Excluir documento ${doc.title}`}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </>
    );
}
