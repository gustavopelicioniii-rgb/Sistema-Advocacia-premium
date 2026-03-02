/**
 * Hook centralizado para dados e mutations da página de detalhe do processo.
 * Extraído de ProcessoDetail.tsx (E-04 — decomposição de god file).
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const PROCESS_DOCS_BUCKET = "documents";

export type StatusProcesso = "Em andamento" | "Aguardando prazo" | "Concluído" | "Suspenso";

export function useProcessoDetail(id: string | undefined) {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    const { data: processo, isLoading } = useQuery({
        queryKey: ["processo", id],
        queryFn: async () => {
            const { data, error } = await supabase.from("processos").select("*").eq("id", id!).single();
            if (error) throw error;
            return data;
        },
        enabled: !!id,
    });

    const { data: timeline } = useQuery({
        queryKey: ["timeline", id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("andamentos")
                .select("*")
                .eq("process_id", id!)
                .order("data", { ascending: false });
            if (error) return [];
            return data ?? [];
        },
        enabled: !!id,
    });

    const { data: audiencias } = useQuery({
        queryKey: ["audiencias", id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("audiencias")
                .select("*")
                .eq("process_id", id!)
                .order("data", { ascending: true });
            if (error) return [];
            return data ?? [];
        },
        enabled: !!id,
    });

    const { data: notes = [] } = useQuery({
        queryKey: ["process_notes", id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("process_notes")
                .select("*")
                .eq("process_id", id!)
                .order("updated_at", { ascending: false });
            if (error) return [];
            return data ?? [];
        },
        enabled: !!id,
    });

    const { data: documents = [] } = useQuery({
        queryKey: ["process_documents", id],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("process_documents")
                .select("*")
                .eq("process_id", id!)
                .order("created_at", { ascending: false });
            if (error) return [];
            return data ?? [];
        },
        enabled: !!id,
    });

    const createAndamento = useMutation({
        mutationFn: async (payload: { data: string; tipo: string; descricao: string }) => {
            const { error } = await supabase.from("andamentos").insert({
                process_id: id,
                data: payload.data,
                tipo: payload.tipo,
                descricao: payload.descricao,
                owner_id: user?.id ?? null,
            });
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["timeline", id] });
            toast.success("Andamento adicionado.");
        },
        onError: (e: Error) => toast.error(e.message),
    });

    const createAudiencia = useMutation({
        mutationFn: async (payload: { data: string; tipo: string; local?: string; link_meet?: string }) => {
            const { error } = await supabase.from("audiencias").insert({
                process_id: id,
                data: payload.data,
                tipo: payload.tipo,
                local: payload.local ?? null,
                link_meet: payload.link_meet ?? null,
                status: "Agendada",
                owner_id: user?.id ?? null,
            });
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["audiencias", id] });
            toast.success("Audiência agendada.");
        },
        onError: (e: Error) => toast.error(e.message),
    });

    const updateStatus = useMutation({
        mutationFn: async (status: StatusProcesso) => {
            const { error } = await supabase.from("processos").update({ status }).eq("id", id!);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["processo", id] });
            queryClient.invalidateQueries({ queryKey: ["processos"] });
            toast.success("Status atualizado.");
        },
        onError: (e: Error) => toast.error(e.message),
    });

    const createNote = useMutation({
        mutationFn: async (content: string) => {
            const { error } = await supabase.from("process_notes").insert({
                process_id: id,
                content,
                owner_id: user?.id ?? null,
            });
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["process_notes", id] });
            toast.success("Nota adicionada.");
        },
        onError: (e: Error) => toast.error(e.message),
    });

    const updateNote = useMutation({
        mutationFn: async ({ noteId, content }: { noteId: string; content: string }) => {
            const { error } = await supabase.from("process_notes").update({ content }).eq("id", noteId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["process_notes", id] });
            toast.success("Nota atualizada.");
        },
        onError: (e: Error) => toast.error(e.message),
    });

    const deleteNote = useMutation({
        mutationFn: async (noteId: string) => {
            const { error } = await supabase.from("process_notes").delete().eq("id", noteId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["process_notes", id] });
            toast.success("Nota removida.");
        },
        onError: (e: Error) => toast.error(e.message),
    });

    const createDoc = useMutation({
        mutationFn: async (payload: { title: string; url?: string; description?: string; file?: File }) => {
            let file_path: string | null = null;
            if (payload.file && id) {
                const timestamp = Date.now();
                const safeName = payload.file.name
                    .normalize("NFD")
                    .replace(/\p{Diacritic}/gu, "")
                    .replace(/[^\w.-]/g, "_");
                const storagePath = `process/${id}/${timestamp}_${safeName || "document"}`;
                const { error: uploadError } = await supabase.storage
                    .from(PROCESS_DOCS_BUCKET)
                    .upload(storagePath, payload.file, { upsert: false });
                if (uploadError) throw uploadError;
                file_path = storagePath;
            }
            const { error } = await supabase.from("process_documents").insert({
                process_id: id,
                title: payload.title,
                url: payload.url ?? null,
                file_path,
                description: payload.description ?? null,
                owner_id: user?.id ?? null,
            });
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["process_documents", id] });
            toast.success("Documento adicionado.");
        },
        onError: (e: Error) => toast.error(e.message),
    });

    const deleteDoc = useMutation({
        mutationFn: async ({ docId, filePath }: { docId: string; filePath?: string | null }) => {
            if (filePath) {
                await supabase.storage.from(PROCESS_DOCS_BUCKET).remove([filePath]);
            }
            const { error } = await supabase.from("process_documents").delete().eq("id", docId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["process_documents", id] });
            toast.success("Documento removido.");
        },
        onError: (e: Error) => toast.error(e.message),
    });

    return {
        processo,
        isLoading,
        timeline: timeline ?? [],
        audiencias: audiencias ?? [],
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
        PROCESS_DOCS_BUCKET,
    };
}
