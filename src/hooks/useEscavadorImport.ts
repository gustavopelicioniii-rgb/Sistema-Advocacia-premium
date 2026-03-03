import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

interface ImportParams {
    oab_estado: string;
    oab_numero: string;
}

interface ImportResponse {
    success: boolean;
    message: string;
    processos_importados: number;
    error?: string;
    details?: string;
}

interface ImportState {
    loading: boolean;
    error: string | null;
    success: boolean;
    processosImportados: number;
}

export function useEscavadorImport() {
    const [state, setState] = useState<ImportState>({
        loading: false,
        error: null,
        success: false,
        processosImportados: 0,
    });

    const { toast } = useToast();
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    const importarProcessos = useCallback(
        async (params: ImportParams) => {
            setState({
                loading: true,
                error: null,
                success: false,
                processosImportados: 0,
            });

            try {
                if (!supabaseUrl) {
                    throw new Error("Supabase URL não configurada");
                }

                if (!anonKey) {
                    throw new Error("Chave Supabase Anon não configurada no .env");
                }

                // Chamar Edge Function com autenticação
                const response = await fetch(`${supabaseUrl}/functions/v1/importar-processos`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${anonKey}`,
                    },
                    body: JSON.stringify({
                        oab_estado: params.oab_estado.toUpperCase(),
                        oab_numero: params.oab_numero,
                    }),
                });

                if (!response.ok) {
                    const errorData = (await response.json()) as ImportResponse;
                    throw new Error(errorData.error || `Erro HTTP ${response.status}`);
                }

                const data = (await response.json()) as ImportResponse;

                if (!data.success) {
                    throw new Error(data.error || "Erro desconhecido na importação");
                }

                setState({
                    loading: false,
                    error: null,
                    success: true,
                    processosImportados: data.processos_importados,
                });

                toast({
                    title: "Importação bem-sucedida! ✓",
                    description: `${data.processos_importados} processo(s) importado(s) com sucesso`,
                    variant: "default",
                });

                return data;
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";

                setState({
                    loading: false,
                    error: errorMessage,
                    success: false,
                    processosImportados: 0,
                });

                toast({
                    title: "Erro na importação ✗",
                    description: errorMessage,
                    variant: "destructive",
                });

                throw err;
            }
        },
        [supabaseUrl, anonKey, toast],
    );

    const reset = useCallback(() => {
        setState({
            loading: false,
            error: null,
            success: false,
            processosImportados: 0,
        });
    }, []);

    return {
        ...state,
        importarProcessos,
        reset,
    };
}
