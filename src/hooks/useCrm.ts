import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

// ---- Types ----

export interface CrmStage {
    id: string;
    created_at: string;
    name: string;
    color: string;
    position: number;
    owner_id: string | null;
}

export interface CrmClient {
    id: string;
    created_at: string;
    updated_at: string;
    name: string;
    email: string;
    phone: string;
    source: string;
    notes: string;
    stage_id: string;
    position: number;
    owner_id: string | null;
}

export type CrmClientInsert = Omit<CrmClient, "id" | "created_at" | "updated_at">;

// ---- Stages ----

export function useCrmStages() {
    return useQuery<CrmStage[]>({
        queryKey: ["crm_stages"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("crm_kanbam")
                .select("*")
                .order("position", { ascending: true });
            if (error) throw error;
            return data as CrmStage[];
        },
        staleTime: 5 * 60 * 1000,
    });
}

export function useCreateCrmStage() {
    const qc = useQueryClient();
    const { toast } = useToast();
    const { user } = useAuth();
    return useMutation({
        mutationFn: async (stage: { name: string; color: string; position: number }) => {
            // owner_id injetado aqui pois o tipo de input não o incluía
            const { data, error } = await supabase
                .from("crm_kanbam")
                .insert({ ...stage, owner_id: user?.id ?? null })
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["crm_stages"] });
            toast({ title: "Coluna criada!" });
        },
        onError: (e: Error) => {
            toast({ title: "Erro", description: e.message, variant: "destructive" });
        },
    });
}

export function useUpdateCrmStage() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...updates }: Partial<CrmStage> & { id: string }) => {
            const { error } = await supabase.from("crm_kanbam").update(updates).eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["crm_stages"] });
        },
    });
}

export function useDeleteCrmStage() {
    const qc = useQueryClient();
    const { toast } = useToast();
    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from("crm_kanbam").delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["crm_stages"] });
            toast({ title: "Coluna excluída." });
        },
        onError: (e: Error) => {
            toast({ title: "Erro", description: e.message, variant: "destructive" });
        },
    });
}

// ---- Clients ----

export function useCrmClients() {
    return useQuery<CrmClient[]>({
        queryKey: ["crm_clients"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("crm_clients")
                .select("*")
                .order("position", { ascending: true });
            if (error) throw error;
            return data as CrmClient[];
        },
        staleTime: 5 * 60 * 1000,
    });
}

export function useCreateCrmClient() {
    const qc = useQueryClient();
    const { toast } = useToast();
    const { user } = useAuth();
    return useMutation({
        mutationFn: async (client: CrmClientInsert) => {
            // owner_id sempre sobrescrito pelo usuário autenticado (segurança multi-tenant)
            const { data, error } = await supabase
                .from("crm_clients")
                .insert({ ...client, owner_id: user?.id ?? null })
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["crm_clients"] });
            toast({ title: "Cliente adicionado!" });
        },
        onError: (e: Error) => {
            toast({ title: "Erro", description: e.message, variant: "destructive" });
        },
    });
}

export function useUpdateCrmClient() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...updates }: Partial<CrmClient> & { id: string }) => {
            const { error } = await supabase.from("crm_clients").update(updates).eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["crm_clients"] });
        },
    });
}

export function useDeleteCrmClient() {
    const qc = useQueryClient();
    const { toast } = useToast();
    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from("crm_clients").delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["crm_clients"] });
            toast({ title: "Cliente removido." });
        },
        onError: (e: Error) => {
            toast({ title: "Erro", description: e.message, variant: "destructive" });
        },
    });
}

// ---- Batch position update (for drag & drop) ----

export function useBatchUpdateClientPositions() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (updates: { id: string; stage_id: string; position: number }[]) => {
            // Use Promise.all for batch updates
            const promises = updates.map(({ id, stage_id, position }) =>
                supabase.from("crm_clients").update({ stage_id, position }).eq("id", id),
            );
            const results = await Promise.all(promises);
            const hasError = results.find((r) => r.error);
            if (hasError?.error) throw hasError.error;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["crm_clients"] });
        },
    });
}
