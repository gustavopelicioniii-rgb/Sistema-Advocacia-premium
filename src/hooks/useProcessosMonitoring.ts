import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

interface Processo {
    id: string;
    numero_processo: string;
    tribunal: string;
    ultima_movimentacao: string;
    ultima_movimentacao_data: string;
    last_checked_at: string;
    ativo: boolean;
}

interface MonitoringState {
    processos: Processo[];
    loading: boolean;
    error: string | null;
    lastChecked: string | null;
    atualizacoes: number;
}

export function useProcessosMonitoring() {
    const [state, setState] = useState<MonitoringState>({
        processos: [],
        loading: false,
        error: null,
        lastChecked: null,
        atualizacoes: 0,
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
                throw new Error("Supabase URL ou Anon Key nao configurada");
            }

            const response = await fetch(
                `${supabaseUrl}/rest/v1/processos?ativo=eq.true&select=id,numero_processo,tribunal,ultima_movimentacao,ultima_movimentacao_data,last_checked_at,ativo&order=created_at.desc`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "apikey": anonKey,
                        "Authorization": `Bearer ${anonKey}`,
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

    const verificarAgora = useCallback(async () => {
        setState((prev) => ({
            ...prev,
            loading: true,
            error: null,
        }));

        try {
            if (!supabaseUrl || !anonKey) {
                throw new Error("Supabase URL ou Anon Key nao configurada");
            }

            const response = await fetch(`${supabaseUrl}/functions/v1/verificar-movimentacoes`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${anonKey}`,
                },
                body: JSON.stringify({}),
            });

            if (!response.ok) {
                throw new Error(`Erro ao verificar movimentacoes: ${response.status}`);
            }

            const data = await response.json();

            setState((prev) => ({
                ...prev,
                loading: false,
                atualizacoes: data.atualizacoes || 0,
                lastChecked: new Date().toISOString(),
            }));

            toast({
                title: "Verificacao concluida",
                description: `${data.processos_verificados || 0} processos verificados, ${data.atualizacoes || 0} atualizacao(oes)`,
                variant: "default",
            });

            await fetchProcessos();

            return data;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";

            setState((prev) => ({
                ...prev,
                loading: false,
                error: errorMessage,
            }));

            toast({
                title: "Erro na verificacao",
                description: errorMessage,
                variant: "destructive",
            });

            throw err;
        }
    }, [supabaseUrl, anonKey, toast, fetchProcessos]);

    const marcarComoInativo = useCallback(
        async (processoId: string) => {
            try {
                if (!supabaseUrl || !anonKey) {
                    throw new Error("Supabase nao configurado");
                }

                const response = await fetch(
                    `${supabaseUrl}/rest/v1/processos?id=eq.${processoId}`,
                    {
                        method: "PATCH",
                        headers: {
                            "Content-Type": "application/json",
                            "apikey": anonKey,
                            "Authorization": `Bearer ${anonKey}`,
                        },
                        body: JSON.stringify({ ativo: false }),
                    },
                );

                if (!response.ok) {
                    throw new Error(`Erro ao desativar: ${response.status}`);
                }

                setState((prev) => ({
                    ...prev,
                    processos: prev.processos.filter((p) => p.id !== processoId),
                }));

                toast({
                    title: "Processo desativado",
                    description: "O processo nao sera mais monitorado",
                    variant: "default",
                });
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";

                toast({
                    title: "Erro ao desativar processo",
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
        verificarAgora,
        marcarComoInativo,
    };
}
