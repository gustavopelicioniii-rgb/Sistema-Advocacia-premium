import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

interface Processo {
    id: string;
    number: string;
    court: string;
    last_movement: string;
    last_checked_at: string | null;
    status_atualizacao: "NONE" | "PENDING" | "SUCCESS" | "ERROR" | "NOT_FOUND";
    monitoramento_ativo: boolean;
}

interface MonitoringState {
    processos: Processo[];
    loading: boolean;
    error: string | null;
    lastChecked: string | null;
}

export function useProcessosMonitoring() {
    const [state, setState] = useState<MonitoringState>({
        processos: [],
        loading: false,
        error: null,
        lastChecked: null,
    });

    const { toast } = useToast();
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const fetchProcessos = useCallback(async () => {
        setState((prev) => ({
            ...prev,
            loading: true,
            error: null,
        }));

        try {
            if (!supabaseUrl || !anonKey) {
                throw new Error("Supabase URL ou Anon Key não configurada");
            }

            const response = await fetch(
                `${supabaseUrl}/rest/v1/processos?select=id,number,court,last_movement,last_checked_at,status_atualizacao,monitoramento_ativo&order=created_at.desc`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        apikey: anonKey,
                        Authorization: `Bearer ${anonKey}`,
                    },
                },
            );

            if (!response.ok) {
                throw new Error(`Erro ao buscar processos: ${response.status}`);
            }

            const processos = (await response.json()) as Processo[];

            setState((prev) => ({
                ...prev,
                processos,
                loading: false,
                lastChecked: new Date().toISOString(),
            }));

            return processos;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";

            setState((prev) => ({
                ...prev,
                loading: false,
                error: errorMessage,
            }));

            return [];
        }
    }, [supabaseUrl, anonKey]);

    const marcarComoInativo = useCallback(
        async (processoId: string) => {
            try {
                if (!supabaseUrl || !anonKey) {
                    throw new Error("Supabase não configurado");
                }

                const response = await fetch(`${supabaseUrl}/rest/v1/processos?id=eq.${processoId}`, {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        apikey: anonKey,
                        Authorization: `Bearer ${anonKey}`,
                    },
                    body: JSON.stringify({ monitoramento_ativo: false }),
                });

                if (!response.ok) {
                    throw new Error(`Erro ao desativar: ${response.status}`);
                }

                setState((prev) => ({
                    ...prev,
                    processos: prev.processos.map((p) =>
                        p.id === processoId ? { ...p, monitoramento_ativo: false } : p,
                    ),
                }));

                toast({
                    title: "Monitoramento desativado",
                    description: "O processo não receberá mais atualizações automáticas",
                    variant: "default",
                });
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";

                toast({
                    title: "Erro ao desativar monitoramento",
                    description: errorMessage,
                    variant: "destructive",
                });
            }
        },
        [supabaseUrl, anonKey, toast],
    );

    const marcarComoAtivo = useCallback(
        async (processoId: string) => {
            try {
                if (!supabaseUrl || !anonKey) {
                    throw new Error("Supabase não configurado");
                }

                const response = await fetch(`${supabaseUrl}/rest/v1/processos?id=eq.${processoId}`, {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        apikey: anonKey,
                        Authorization: `Bearer ${anonKey}`,
                    },
                    body: JSON.stringify({
                        monitoramento_ativo: true,
                        status_atualizacao: "NONE",
                    }),
                });

                if (!response.ok) {
                    throw new Error(`Erro ao ativar: ${response.status}`);
                }

                // Chamar a função de migração/solicitação para ativar o callback imediatamente
                await fetch(`${supabaseUrl}/functions/v1/migrar-monitoramento-callback`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        apikey: anonKey,
                        Authorization: `Bearer ${anonKey}`,
                    },
                    body: JSON.stringify({ process_id: processoId }),
                });

                setState((prev) => ({
                    ...prev,
                    processos: prev.processos.map((p) =>
                        p.id === processoId ? { ...p, monitoramento_ativo: true, status_atualizacao: "PENDING" } : p,
                    ),
                }));

                toast({
                    title: "Monitoramento ativado",
                    description: "O processo entrará na fila para atualização",
                    variant: "default",
                });
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";

                toast({
                    title: "Erro ao ativar monitoramento",
                    description: errorMessage,
                    variant: "destructive",
                });
            }
        },
        [supabaseUrl, anonKey, toast],
    );

    useEffect(() => {
        fetchProcessos();
    }, [fetchProcessos]);

    return {
        ...state,
        fetchProcessos,
        marcarComoInativo,
        marcarComoAtivo,
    };
}
