import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { addBusinessDays, isBefore, parseISO, differenceInBusinessDays, startOfDay } from "date-fns";
import { useProcessos } from "@/hooks/useProcessos";

export interface Feriado {
    data: string;
    descricao: string;
    tribunal: string;
}

export interface Deadline {
    id: string;
    process_id: string;
    titulo: string;
    descricao: string;
    data_inicio: string;
    data_fim: string;
    dias_uteis: number;
    status: "Pendente" | "Concluído" | "Vencido" | "Cancelado";
    owner_id: string;
    process?: {
        number: string;
        client: string;
        value: number;
    };
}

export function useHolidays() {
    return useQuery<Feriado[]>({
        queryKey: ["holidays"],
        queryFn: async () => {
            const { data, error } = await supabase.from("feriados_forenses").select("*");
            if (error) throw error;
            return data as Feriado[];
        },
        staleTime: 10 * 60 * 1000,
    });
}

export function useDeadlines() {
    return useQuery<Deadline[]>({
        queryKey: ["deadlines"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("deadlines")
                .select("*, process:processos(number, client, value)")
                .order("data_fim", { ascending: true });
            if (error) throw error;
            return data as Deadline[];
        },
        staleTime: 2 * 60 * 1000,
    });
}

/**
 * Calcula a data final considerando apenas dias úteis (seg-sex)
 * e descontando feriados forenses.
 */
export function calculateDeadline(startDate: Date, businessDays: number, holidays: Feriado[] = []) {
    let currentDate = new Date(startDate);
    let daysAdded = 0;

    const holidayDates = holidays.map((h) => h.data);

    while (daysAdded < businessDays) {
        currentDate = addBusinessDays(currentDate, 1);
        const dateStr = currentDate.toISOString().split("T")[0];

        // Se não for feriado, conta o dia
        if (!holidayDates.includes(dateStr)) {
            daysAdded++;
        }
    }

    return currentDate;
}

/** Dias úteis entre duas datas (exclui sáb/dom; opcionalmente feriados). */
export function businessDaysBetween(start: Date, end: Date, holidayDates: string[] = []): number {
    if (isBefore(end, start)) return 0;
    const holidaySet = new Set(holidayDates);
    let count = 0;
    const d = new Date(start);
    while (d <= end) {
        const day = d.getDay();
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        const dateStr = `${yyyy}-${mm}-${dd}`;
        if (day !== 0 && day !== 6 && !holidaySet.has(dateStr)) count++;
        d.setDate(d.getDate() + 1);
    }
    return count;
}

/** Prazos da tabela deadlines + "Próximo prazo" dos processos (next_deadline), unificados para o dashboard. */
export function useDeadlinesStats() {
    const { data: deadlines } = useDeadlines();
    const { data: processos } = useProcessos();

    return useMemo(() => {
        const todayStart = startOfDay(new Date());
        const list: Array<Deadline & { process?: { number: string; client: string; value: number } }> = [
            ...(deadlines ?? []),
        ];

        (processos ?? []).forEach((p) => {
            if (!p.next_deadline || p.status === "Concluído") return;
            try {
                const end = parseISO(p.next_deadline);
                if (isNaN(end.getTime()) || isBefore(end, todayStart)) return;
                list.push({
                    id: `proc-${p.id}`,
                    process_id: p.id,
                    titulo: "Próximo prazo",
                    descricao: "",
                    data_inicio: p.next_deadline,
                    data_fim: p.next_deadline,
                    dias_uteis: 0,
                    status: "Pendente",
                    owner_id: p.owner_id ?? "",
                    process: { number: p.number, client: p.client, value: p.value ?? 0 },
                } as Deadline & { process?: { number: string; client: string; value: number } });
            } catch {
                // ignore invalid date
            }
        });

        const pendentes = list.filter((d) => d.status === "Pendente" && d.data_fim);
        const urgent = pendentes.filter((d) => {
            if (!d.data_fim) return false;
            try {
                const end = parseISO(d.data_fim);
                if (isNaN(end.getTime())) return false;
                const diff = differenceInBusinessDays(end, todayStart);
                return diff <= 2 && diff >= 0; // 0, 1 ou 2 dias úteis
            } catch {
                return false;
            }
        });

        return {
            total: list.length,
            pendentes: pendentes.length,
            urgentes: urgent.length,
            criticalList: urgent,
        };
    }, [deadlines, processos]);
}
