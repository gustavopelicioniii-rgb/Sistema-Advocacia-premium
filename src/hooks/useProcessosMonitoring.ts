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

    /**
     * Buscar processos do banco de dados
     */
    const fetchProcessos = useCallback(async () => {
        setState((prev) => ({
            ...prev,
            loading: true,
            error: null,
        }));

        try {
            // Nota: Esta é uma operação real que requer autenticação
            // Você precisará passar o token de autenticação do usuário
            // Por enquanto, estou deixando um placeholder

            const response = await fetch(`${supabaseUrl}/rest/v1/processos_ativos`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    // Aqui você adicionar o auth token: 'Authorization': `Bearer ${token}`
                },
            });

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error("Não autenticado. Faça login para ver seus processos.");
                }
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

            toast({
                title: "Erro ao buscar processos",
                description: errorMessage,
                variant: "destructive",
            });

            throw err;
        }
    }, [supabaseUrl, toast]);

    /**
     * Disparar verificação manual via Edge Function
     */
    const verificarAgora = useCallback(async () => {
        setState((prev) => ({
            ...prev,
            loading: true,
            error: null,
        }));

        try {
            if (!supabaseUrl) {
                throw new Error("Supabase URL não configurada");
            }

            const response = await fetch(`${supabaseUrl}/functions/v1/verificar-movimentacoes`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (!response.ok) {
                throw new Error(`Erro ao verificar movimentações: ${response.status}`);
            }

            const data = await response.json();

            setState((prev) => ({
                ...prev,
                loading: false,
                atualizacoes: data.atualizacoes || 0,
                lastChecked: new Date().toISOString(),
            }));

            toast({
                title: "Verificação concluída",
                description: `${data.atualizacoes || 0} atualização(ões) encontrada(s)`,
                variant: "default",
            });

            // Recarregar processos após verificação
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
                title: "Erro na verificação",
                description: errorMessage,
                variant: "destructive",
            });

            throw err;
        }
    }, [supabaseUrl, toast, fetchProcessos]);

    /**
     * Marcar processo como inativo
     */
    const marcarComoInativo = useCallback(
        async (processoId: string) => {
            try {
                // Nota: Esta operação requer autenticação
                // Implementar chamada à API REST do Supabase para atualizar

                setState((prev) => ({
                    ...prev,
                    processos: prev.processos.filter((p) => p.id !== processoId),
                }));

                toast({
                    title: "Processo desativado",
                    description: "O processo não será mais monitorado",
                    variant: "default",
                });
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";

                toast({
                    title: "Erro ao desativar processo",
                    description: errorMessage,
                    variant: "destructive",
                });

                throw err;
            }
        },
        [toast],
    );

    /**
     * Setup: Carregar processos ao montar
     */
    useEffect(() => {
        // Descomentar após implementar autenticação
        // fetchProcessos()
    }, [fetchProcessos]);

    return {
        ...state,
        fetchProcessos,
        verificarAgora,
        marcarComoInativo,
    };
}
