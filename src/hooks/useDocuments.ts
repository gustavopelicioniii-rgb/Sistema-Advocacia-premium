import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/lib/logger";

export interface Document {
    id: string;
    created_at: string;
    name: string;
    file_path: string;
    file_size: number;
    mime_type: string;
    process_number: string;
    description: string;
    uploaded_by: string | null;
}

/** Garante que cada item retornado tenha shape segura (evita crash por dados inesperados da API). */
function normalizeDocument(row: unknown): Document | null {
    if (row == null || typeof row !== "object") return null;
    const r = row as Record<string, unknown>;
    const id = typeof r.id === "string" ? r.id : "";
    if (!id) return null;
    return {
        id,
        created_at: typeof r.created_at === "string" ? r.created_at : "",
        name: typeof r.name === "string" ? r.name : "Documento",
        file_path: typeof r.file_path === "string" ? r.file_path : "",
        file_size: typeof r.file_size === "number" ? r.file_size : 0,
        mime_type: typeof r.mime_type === "string" ? r.mime_type : "",
        process_number: typeof r.process_number === "string" ? r.process_number : "",
        description: typeof r.description === "string" ? r.description : "",
        uploaded_by: r.uploaded_by != null && typeof r.uploaded_by === "string" ? r.uploaded_by : null,
    };
}

export function useDocuments() {
    return useQuery<Document[]>({
        queryKey: ["documents"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("documents")
                .select("*")
                .order("created_at", { ascending: false })
                .range(0, 99);
            if (error) throw error;
            const list = Array.isArray(data) ? data : [];
            const out: Document[] = [];
            for (const row of list) {
                const doc = normalizeDocument(row);
                if (doc) out.push(doc);
            }
            return out;
        },
        staleTime: 5 * 60 * 1000,
    });
}

export function useUploadDocument() {
    const qc = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async ({
            file,
            processNumber,
            description,
        }: {
            file: File;
            processNumber?: string;
            description?: string;
        }) => {
            // 1. Upload file to Storage (key deve ser ASCII – sem acentos – para evitar "Invalid key")
            const timestamp = Date.now();
            const safeName = file.name
                .normalize("NFD")
                .replace(/\p{Diacritic}/gu, "")
                .replace(/[^\w.-]/g, "_");
            const filePath = `${timestamp}_${safeName || "document"}`;

            const { error: uploadError } = await supabase.storage.from("documents").upload(filePath, file);

            if (uploadError) throw uploadError;

            // 2. Get the user
            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser();
            if (userError || !user) {
                await supabase.storage.from("documents").remove([filePath]);
                throw new Error("Não autenticado");
            }

            // 3. Insert metadata into documents table
            const { data, error: insertError } = await supabase
                .from("documents")
                .insert({
                    name: file.name,
                    file_path: filePath,
                    file_size: file.size,
                    mime_type: file.type,
                    process_number: processNumber || "",
                    description: description || "",
                    uploaded_by: user.id,
                })
                .select()
                .single();

            if (insertError) {
                await supabase.storage.from("documents").remove([filePath]);
                throw insertError;
            }
            return data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["documents"] });
            toast({ title: "Documento enviado com sucesso!" });
        },
        onError: (e: Error) => {
            toast({ title: "Erro ao enviar documento", description: e.message, variant: "destructive" });
        },
    });
}

export function useDeleteDocument() {
    const qc = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async ({ id, filePath }: { id: string; filePath: string }) => {
            // Delete from storage
            const { error: storageError } = await supabase.storage.from("documents").remove([filePath]);
            if (storageError) logger.warn("Storage delete error", { error: storageError.message });

            // Delete from database
            const { error } = await supabase.from("documents").delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["documents"] });
            toast({ title: "Documento excluído." });
        },
        onError: (e: Error) => {
            toast({ title: "Erro ao excluir", description: e.message, variant: "destructive" });
        },
    });
}

export function getDocumentUrl(filePath: string): string {
    const { data } = supabase.storage.from("documents").getPublicUrl(filePath);
    return data.publicUrl;
}

/** Substitui o arquivo no storage pelo novo blob (mesmo path). Usado após edição. */
export function useUpdateDocumentContent() {
    const qc = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async ({ filePath, blob, fileName }: { filePath: string; blob: Blob; fileName: string }) => {
            const { error } = await supabase.storage.from("documents").update(filePath, blob, { upsert: true });
            if (error) throw error;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["documents"] });
            toast({ title: "Documento salvo automaticamente." });
        },
        onError: (e: Error) => {
            toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" });
        },
    });
}

const EDITS_PREFIX = "edits/";

/** Salva rascunho de edição (HTML) no storage. Path: edits/{filePath}.html */
export function useSaveEditedDraft() {
    const qc = useQueryClient();
    const { toast } = useToast();

    return useMutation({
        mutationFn: async ({ filePath, html }: { filePath: string; html: string }) => {
            const editPath = EDITS_PREFIX + filePath + ".html";
            const blob = new Blob([html], { type: "text/html" });
            const { error } = await supabase.storage.from("documents").upload(editPath, blob, { upsert: true });
            if (error) throw error;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["documents"] });
            toast({ title: "Rascunho salvo automaticamente." });
        },
        onError: (e: Error) => {
            toast({ title: "Erro ao salvar rascunho", description: e.message, variant: "destructive" });
        },
    });
}

export function getEditedDraftUrl(filePath: string): string {
    const { data } = supabase.storage.from("documents").getPublicUrl(EDITS_PREFIX + filePath + ".html");
    return data.publicUrl;
}

export function formatFileSize(bytes: number): string {
    const n = Number.isFinite(bytes) && bytes >= 0 ? bytes : 0;
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
    return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
