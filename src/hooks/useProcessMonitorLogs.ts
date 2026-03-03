import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type ProcessMonitorLogType = 'consulta_realizada' | 'atualizacao_encontrada' | 'erro_api' | 'callback_recebido';

export interface ProcessMonitorLog {
    id: string;
    created_at: string;
    process_id: string | null;
    process_number: string | null;
    log_type: ProcessMonitorLogType;
    message: string | null;
    details: Record<string, unknown> | null;
    owner_id: string | null;
}

export function useProcessMonitorLogs(limit = 10) {
    const { user } = useAuth();
    return useQuery<ProcessMonitorLog[]>({
        queryKey: ['process-monitor-logs', user?.id, limit],
        queryFn: async () => {
            if (!user) return [];
            const { data, error } = await supabase
                .from('process_monitor_logs')
                .select('*')
                .eq('owner_id', user.id)
                .order('created_at', { ascending: false })
                .limit(limit);
            if (error) return [];
            return (data ?? []) as ProcessMonitorLog[];
        },
        enabled: !!user,
        staleTime: 2 * 60 * 1000,
    });
}
