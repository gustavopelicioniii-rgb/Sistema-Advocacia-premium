import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export type PaymentMethod = "a_vista" | "entrada_parcelas" | "cartao_credito";

export interface Fee {
    id: string;
    created_at: string;
    updated_at: string;
    client: string;
    process_number: string;
    description: string;
    value: number;
    status: "Pago" | "Pendente" | "Atrasado" | "Cancelado";
    due_date: string | null;
    paid_date: string | null;
    payment_method?: PaymentMethod;
    entrada_value?: number | null;
    installments?: number | null;
    owner_id: string | null;
}

export type FeeInsert = Omit<Fee, "id" | "created_at" | "updated_at">;
export type FeeUpdate = Partial<FeeInsert> & { id: string };

export function useFees() {
    return useQuery<Fee[]>({
        queryKey: ["fees"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("fees")
                .select("*")
                .order("created_at", { ascending: false })
                .range(0, 499);
            if (error) throw error;
            return data as Fee[];
        },
        staleTime: 5 * 60 * 1000,
    });
}

export function useFeeStats() {
    const { data: fees } = useFees();
    return useMemo(() => {
        const stats = (fees ?? []).reduce(
            (acc, f) => {
                const v = Number(f.value);
                if (f.status === "Pago") {
                    acc.pago += v;
                    acc.countPago++;
                } else if (f.status === "Pendente") {
                    acc.pendente += v;
                    acc.countPendente++;
                } else if (f.status === "Atrasado") {
                    acc.atrasado += v;
                    acc.countAtrasado++;
                }
                return acc;
            },
            { pago: 0, pendente: 0, atrasado: 0, countPago: 0, countPendente: 0, countAtrasado: 0 },
        );
        const total = stats.pago + stats.pendente + stats.atrasado;
        return {
            total,
            ...stats,
            countPendenteOuAtrasado: stats.countPendente + stats.countAtrasado,
        };
    }, [fees]);
}

export function useCreateFee() {
    const qc = useQueryClient();
    const { toast } = useToast();
    const { user } = useAuth();
    return useMutation({
        mutationFn: async (fee: FeeInsert) => {
            // owner_id sempre sobrescrito pelo usuário autenticado (segurança multi-tenant)
            const { data, error } = await supabase
                .from("fees")
                .insert({ ...fee, owner_id: user?.id ?? null })
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["fees"] });
            toast({ title: "Honorário registrado!" });
        },
        onError: (e: Error) => {
            toast({ title: "Erro", description: e.message, variant: "destructive" });
        },
    });
}

export function useUpdateFee() {
    const qc = useQueryClient();
    const { toast } = useToast();
    return useMutation({
        mutationFn: async ({ id, ...updates }: FeeUpdate) => {
            const { error } = await supabase.from("fees").update(updates).eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["fees"] });
            toast({ title: "Honorário atualizado!" });
        },
        onError: (e: Error) => {
            toast({ title: "Erro", description: e.message, variant: "destructive" });
        },
    });
}

export function useDeleteFee() {
    const qc = useQueryClient();
    const { toast } = useToast();
    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from("fees").delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["fees"] });
            toast({ title: "Honorário excluído." });
        },
        onError: (e: Error) => {
            toast({ title: "Erro", description: e.message, variant: "destructive" });
        },
    });
}
