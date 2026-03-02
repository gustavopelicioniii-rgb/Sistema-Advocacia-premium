import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface GeneratedPeca {
    id: string;
    created_at: string;
    title: string;
    tipo: string;
    context: string;
    generated_text: string;
    process_number: string;
    owner_id: string | null;
}

export type PecaInsert = Omit<GeneratedPeca, 'id' | 'created_at'>;

// Saved generated pieces
export function usePecas() {
    return useQuery<GeneratedPeca[]>({
        queryKey: ['pecas'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('pecas')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data as GeneratedPeca[];
        },
        staleTime: 5 * 60 * 1000,
    });
}

export function useSavePeca() {
    const qc = useQueryClient();
    const { toast } = useToast();
    return useMutation({
        mutationFn: async (peca: PecaInsert) => {
            const { data, error } = await supabase.from('pecas').insert(peca).select().single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['pecas'] });
            toast({ title: 'Peça salva com sucesso!' });
        },
        onError: (e: Error) => {
            toast({ title: 'Erro ao salvar', description: e.message, variant: 'destructive' });
        },
    });
}

export function useDeletePeca() {
    const qc = useQueryClient();
    const { toast } = useToast();
    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from('pecas').delete().eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['pecas'] });
            toast({ title: 'Peça excluída.' });
        },
        onError: (e: Error) => {
            toast({ title: 'Erro', description: e.message, variant: 'destructive' });
        },
    });
}

export { generateWithAI } from "@/lib/aiProviders";
