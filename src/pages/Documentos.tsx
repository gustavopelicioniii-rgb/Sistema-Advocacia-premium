import { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
    FolderOpen,
    Upload,
    Search,
    FileText,
    Image,
    File,
    Download,
    Trash2,
    Loader2,
    ExternalLink,
    X,
    PenTool,
    Send,
    CheckCircle2,
    Pencil,
    AlertTriangle,
    RefreshCw,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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
import {
    useDocuments,
    useUploadDocument,
    useDeleteDocument,
    getDocumentUrl,
    formatFileSize,
} from "@/hooks/useDocuments";
import type { Document } from "@/hooks/useDocuments";
import { DocumentEditorModal } from "@/components/documents/DocumentEditorModal";

const getFileIcon = (mimeType: string): React.ElementType => {
    if (mimeType.startsWith("image/")) return Image;
    if (mimeType.includes("pdf") || mimeType.includes("word") || mimeType.includes("document")) return FileText;
    return File;
};

const getFileColor = (mimeType: string): string => {
    if (mimeType.includes("pdf")) return "bg-red-100 text-red-600";
    if (mimeType.includes("word") || mimeType.includes("document")) return "bg-blue-100 text-blue-600";
    if (mimeType.startsWith("image/")) return "bg-green-100 text-green-600";
    return "bg-primary/10 text-primary";
};

const Documentos = () => {
    const [search, setSearch] = useState("");
    const [uploadOpen, setUploadOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<{ id: string; filePath: string } | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [processNumber, setProcessNumber] = useState("");
    const [description, setDescription] = useState("");
    const [signOpen, setSignOpen] = useState(false);
    const [signDocName, setSignDocName] = useState("");
    const [signEmail, setSignEmail] = useState("");
    const [signSent, setSignSent] = useState(false);
    const [editDoc, setEditDoc] = useState<Document | null>(null);
    const { toast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { data: documents, isLoading, isError, error, refetch } = useDocuments();
    const uploadMutation = useUploadDocument();
    const deleteMutation = useDeleteDocument();

    const safeDocuments = Array.isArray(documents) ? documents : [];
    const searchLower = search.toLowerCase();
    const filtered = safeDocuments.filter((d) => {
        if (!d || typeof d !== "object" || typeof (d as Document).id !== "string") return false;
        const doc = d as Document;
        return (
            (doc.name ?? "").toLowerCase().includes(searchLower) ||
            (doc.process_number ?? "").toLowerCase().includes(searchLower) ||
            (doc.description ?? "").toLowerCase().includes(searchLower)
        );
    });

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setUploadOpen(true);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) return;
        try {
            await uploadMutation.mutateAsync({
                file: selectedFile,
                processNumber,
                description,
            });
            setUploadOpen(false);
            setSelectedFile(null);
            setProcessNumber("");
            setDescription("");
            if (fileInputRef.current) fileInputRef.current.value = "";
        } catch {
            // error handled by mutation onError
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        try {
            await deleteMutation.mutateAsync(deleteTarget);
            setDeleteTarget(null);
        } catch {
            // error handled by mutation onError
        }
    };

    const handleDownload = (filePath: string, fileName: string) => {
        const url = getDocumentUrl(filePath);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        a.target = "_blank";
        a.click();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file) {
            setSelectedFile(file);
            setUploadOpen(true);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    return (
        <>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="flex items-end justify-between">
                    <div>
                        <h1 className="font-display text-3xl font-bold text-foreground">Documentos</h1>
                        <p className="mt-1 text-muted-foreground">Gestão documental vinculada aos processos.</p>
                    </div>
                    <div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            onChange={handleFileSelect}
                            accept=".pdf,.doc,.docx,.docs,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.txt,.csv"
                        />
                        <Button onClick={() => fileInputRef.current?.click()}>
                            <Upload className="mr-2 h-4 w-4" />
                            Upload
                        </Button>
                    </div>
                </div>

                {/* Drop zone */}
                <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    className="flex items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 p-8 transition-colors hover:border-accent/50 hover:bg-muted/50 cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
                    }}
                >
                    <div className="text-center">
                        <Upload className="mx-auto h-10 w-10 text-muted-foreground" />
                        <p className="mt-3 text-sm font-medium text-foreground">
                            Clique para enviar ou arraste o arquivo aqui
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">PDF, Word, Excel, imagens — até 50MB</p>
                    </div>
                </div>

                {/* Assinatura Eletrônica */}
                <Card className="border-indigo-200 dark:border-indigo-900">
                    <CardHeader className="pb-3">
                        <CardTitle className="font-display text-xl flex items-center gap-2">
                            <PenTool className="h-5 w-5 text-indigo-600" /> Assinatura Eletrônica
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">
                            Envie documentos para assinatura digital. Integre com Clicksign, DocuSign ou ZapSign nas
                            Configurações.
                        </p>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 sm:grid-cols-3">
                            <div className="flex items-center gap-4 rounded-lg border p-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
                                    <PenTool className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="font-semibold text-foreground">Clicksign</p>
                                    <p className="text-xs text-muted-foreground">Assinatura com validade jurídica</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 rounded-lg border p-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                                    <PenTool className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="font-semibold text-foreground">DocuSign</p>
                                    <p className="text-xs text-muted-foreground">Padrão internacional</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 rounded-lg border p-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 text-green-700">
                                    <PenTool className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="font-semibold text-foreground">ZapSign</p>
                                    <p className="text-xs text-muted-foreground">Rápido e acessível</p>
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setSignOpen(true);
                                    setSignSent(false);
                                    setSignDocName("");
                                    setSignEmail("");
                                }}
                            >
                                <Send className="mr-2 h-4 w-4" /> Enviar para Assinatura
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Document list */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-4">
                        <CardTitle className="font-display text-xl">
                            Todos os Documentos{" "}
                            {documents && (
                                <Badge variant="secondary" className="ml-2">
                                    {documents.length}
                                </Badge>
                            )}
                        </CardTitle>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Buscar documento..."
                                className="pl-9 w-72"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                <span className="ml-3 text-muted-foreground">Carregando documentos...</span>
                            </div>
                        ) : isError ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <AlertTriangle className="h-12 w-12 text-destructive" />
                                <p className="mt-4 text-lg font-medium text-foreground">Falha ao carregar documentos</p>
                                <p className="mt-1 text-sm text-muted-foreground max-w-md">
                                    {error instanceof Error ? error.message : "Erro de conexão ou do servidor."}
                                </p>
                                <Button variant="outline" className="mt-4 gap-2" onClick={() => refetch()}>
                                    <RefreshCw className="h-4 w-4" />
                                    Tentar novamente
                                </Button>
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <FolderOpen className="h-12 w-12 text-muted-foreground/50" />
                                <p className="mt-4 text-lg font-medium text-foreground">Nenhum documento encontrado</p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    {search ? "Tente uma busca diferente." : "Faça upload do seu primeiro documento."}
                                </p>
                            </div>
                        ) : (
                            filtered.map((d) => {
                                const Icon = getFileIcon(d.mime_type ?? "");
                                const colorClass = getFileColor(d.mime_type ?? "");
                                const nameLower = (d.name ?? "").toLowerCase();
                                const isWord =
                                    d.mime_type?.toLowerCase().includes("word") ||
                                    d.mime_type?.toLowerCase().includes("document") ||
                                    nameLower.endsWith(".docx") ||
                                    nameLower.endsWith(".doc") ||
                                    nameLower.endsWith(".docs");
                                return (
                                    <div
                                        key={d.id}
                                        className="flex items-center gap-4 rounded-lg border border-border p-3 hover:bg-muted/50 transition-all group"
                                    >
                                        <div
                                            className={`flex h-10 w-10 items-center justify-center rounded-lg ${colorClass}`}
                                        >
                                            <Icon className="h-5 w-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-foreground truncate">
                                                {d.name ?? "Documento"}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {d.process_number && `${d.process_number} • `}
                                                {formatFileSize(d.file_size ?? 0)}
                                                {d.description && ` • ${d.description}`}
                                            </p>
                                        </div>
                                        <span className="text-xs text-muted-foreground hidden sm:block">
                                            {d.created_at
                                                ? new Date(d.created_at).toLocaleDateString("pt-BR", {
                                                      day: "2-digit",
                                                      month: "short",
                                                      year: "numeric",
                                                  })
                                                : "—"}
                                        </span>
                                        <div className="flex items-center gap-1 flex-shrink-0">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8 gap-1.5"
                                                onClick={() => setEditDoc(d)}
                                                title={isWord ? "Editar documento" : "Visualizar documento"}
                                            >
                                                <Pencil className="h-4 w-4" />
                                                {isWord ? "Editar" : "Visualizar"}
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() => handleDownload(d.file_path, d.name ?? "documento")}
                                                title="Baixar"
                                            >
                                                <Download className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8"
                                                onClick={() =>
                                                    d.file_path && window.open(getDocumentUrl(d.file_path), "_blank")
                                                }
                                                title="Abrir em nova aba"
                                            >
                                                <ExternalLink className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-destructive"
                                                onClick={() =>
                                                    d.id &&
                                                    d.file_path &&
                                                    setDeleteTarget({ id: d.id, filePath: d.file_path })
                                                }
                                                title="Excluir"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </CardContent>
                </Card>
            </motion.div>

            {/* Upload dialog */}
            <Dialog
                open={uploadOpen}
                onOpenChange={(open) => {
                    setUploadOpen(open);
                    if (!open) setSelectedFile(null);
                }}
            >
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="font-display text-xl">Upload de Documento</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        {selectedFile && (
                            <div className="flex items-center gap-3 rounded-lg border border-border p-3 bg-muted/30">
                                <FileText className="h-8 w-8 text-primary" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                                    <p className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => {
                                        setSelectedFile(null);
                                        setUploadOpen(false);
                                    }}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="processNumber">Número do Processo (opcional)</Label>
                            <Input
                                id="processNumber"
                                placeholder="0012345-67.2024.8.26.0100"
                                value={processNumber}
                                onChange={(e) => setProcessNumber(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Descrição (opcional)</Label>
                            <Input
                                id="description"
                                placeholder="Ex: Contestação, Procuração, Comprovante..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setUploadOpen(false);
                                setSelectedFile(null);
                            }}
                        >
                            Cancelar
                        </Button>
                        <Button onClick={handleUpload} disabled={!selectedFile || uploadMutation.isPending}>
                            {uploadMutation.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Enviando...
                                </>
                            ) : (
                                <>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Enviar
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete confirmation */}
            <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Documento</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir este documento? O arquivo será removido permanentemente.
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

            {/* Modal: Enviar para Assinatura Eletrônica */}
            <Dialog open={signOpen} onOpenChange={setSignOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="font-display text-xl flex items-center gap-2">
                            <PenTool className="h-5 w-5 text-indigo-600" /> Enviar para Assinatura
                        </DialogTitle>
                    </DialogHeader>
                    {!signSent ? (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Nome do Documento *</Label>
                                <Input
                                    placeholder="Ex: Contrato de honorários"
                                    value={signDocName}
                                    onChange={(e) => setSignDocName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Email do Signatário *</Label>
                                <Input
                                    type="email"
                                    placeholder="cliente@email.com"
                                    value={signEmail}
                                    onChange={(e) => setSignEmail(e.target.value)}
                                />
                            </div>
                            <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
                                <p className="font-medium text-foreground">Como funciona:</p>
                                <p>
                                    1. O documento é enviado ao provedor de assinatura (Clicksign, DocuSign ou ZapSign).
                                </p>
                                <p>2. O signatário recebe um email com o link para assinar.</p>
                                <p>3. Após assinatura, o documento é atualizado automaticamente.</p>
                                <p className="mt-2 font-medium text-foreground">
                                    Configure seu provedor nas Configurações para ativar.
                                </p>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setSignOpen(false)}>
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={() => {
                                        if (!signDocName || !signEmail) {
                                            toast({ title: "Preencha todos os campos", variant: "destructive" });
                                            return;
                                        }
                                        setSignSent(true);
                                        toast({
                                            title: "Documento enviado para assinatura!",
                                            description: `Enviado para ${signEmail}`,
                                        });
                                    }}
                                >
                                    <Send className="mr-2 h-4 w-4" /> Enviar
                                </Button>
                            </DialogFooter>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-8 space-y-4">
                            <CheckCircle2 className="h-16 w-16 text-green-600" />
                            <p className="font-semibold text-lg">Enviado com sucesso!</p>
                            <p className="text-sm text-muted-foreground text-center">
                                O documento <strong>{signDocName}</strong> foi enviado para <strong>{signEmail}</strong>
                                .
                            </p>
                            <p className="text-xs text-muted-foreground">
                                O signatário receberá um email com instruções.
                            </p>
                            <DialogFooter className="w-full">
                                <Button className="w-full" onClick={() => setSignOpen(false)}>
                                    Fechar
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <DocumentEditorModal
                open={!!editDoc}
                onOpenChange={(open) => !open && setEditDoc(null)}
                document={editDoc}
            />
        </>
    );
};

export default Documentos;
