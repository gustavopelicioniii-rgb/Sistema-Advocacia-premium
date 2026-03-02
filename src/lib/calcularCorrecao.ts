/**
 * Calculadora Jurídica — Correção de Valores (client-side)
 * Lógica idêntica à edge function calculadora-correcao, executada no browser.
 * Consulta indices_oficiais diretamente via Supabase client.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { CorrecaoValoresResult, CorrecaoValoresTimelineItem } from "@/types/calculadora";

type TipoJuros = "simples" | "compostos" | "1%_ao_mes" | "selic_acumulada" | "legais";

export interface CalcBody {
    valorInicial: number;
    dataInicial: string;
    dataFinal: string;
    indice: string;
    tipoJuros: TipoJuros;
    percentualMensal?: number;
}

function parseDate(s: string): Date {
    const [y, m, d] = s.split(/[-/]/).map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
}

function formatMonth(d: Date): string {
    return `${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function getMonthsBetween(start: Date, end: Date): { year: number; month: number }[] {
    const out: { year: number; month: number }[] = [];
    const cur = new Date(start.getFullYear(), start.getMonth(), 1);
    const endFirst = new Date(end.getFullYear(), end.getMonth(), 1);
    while (cur <= endFirst) {
        out.push({ year: cur.getFullYear(), month: cur.getMonth() + 1 });
        cur.setMonth(cur.getMonth() + 1);
    }
    return out;
}

export async function calcularCorrecaoValores(
    body: CalcBody,
    supabase: SupabaseClient,
): Promise<CorrecaoValoresResult> {
    const { valorInicial, dataInicial, dataFinal, indice, tipoJuros, percentualMensal } = body;

    const start = parseDate(dataInicial);
    const end = parseDate(dataFinal);
    if (start >= end) {
        throw new Error("dataInicial deve ser anterior a dataFinal");
    }

    const months = getMonthsBetween(start, end);
    const refInicio = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-01`;
    const refFim = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-01`;

    const indicePorRef: Record<string, number> = {};
    let usandoFallback = false;

    try {
        const { data: indicesRows, error: indicesError } = await supabase
            .from("indices_oficiais")
            .select("referencia, valor")
            .eq("indice", indice)
            .gte("referencia", refInicio)
            .lte("referencia", refFim)
            .order("referencia", { ascending: true });

        if (indicesError) throw indicesError;

        if (Array.isArray(indicesRows)) {
            for (const r of indicesRows) {
                const ref = typeof r.referencia === "string" ? r.referencia.slice(0, 7) : "";
                indicePorRef[ref] = Number(r.valor) || 0;
            }
        }
        if (Object.keys(indicePorRef).length === 0) usandoFallback = true;
    } catch {
        usandoFallback = true;
    }

    const taxaFixaMensal = percentualMensal != null ? percentualMensal / 100 : tipoJuros === "1%_ao_mes" ? 0.01 : 0.006;

    const timeline: CorrecaoValoresTimelineItem[] = [];
    let valorAtual = valorInicial;

    for (const { year, month } of months) {
        const refStr = `${year}-${String(month).padStart(2, "0")}`;
        const indiceValor = indicePorRef[refStr];
        const taxaCorrecao = indiceValor != null && indiceValor > 0 ? indiceValor / 100 : 0.005;
        const correcao = valorAtual * taxaCorrecao;
        const valorAposCorrecao = valorAtual + correcao;

        let juros: number;
        let valorFinal: number;
        if (tipoJuros === "simples") {
            juros = valorInicial * taxaFixaMensal;
            valorFinal = valorAposCorrecao + juros;
        } else {
            valorFinal = valorAposCorrecao * (1 + taxaFixaMensal);
            juros = valorFinal - valorAposCorrecao;
        }

        timeline.push({
            mes: formatMonth(new Date(year, month - 1, 1)),
            valorInicio: Math.round(valorAtual * 100) / 100,
            correcao: Math.round(correcao * 100) / 100,
            valorAposCorrecao: Math.round(valorAposCorrecao * 100) / 100,
            juros: Math.round(juros * 100) / 100,
            valorFinal: Math.round(valorFinal * 100) / 100,
            indiceAplicado: indiceValor != null ? indiceValor : undefined,
        });
        valorAtual = valorFinal;
    }

    const valorFinalTotal = timeline.length > 0 ? timeline[timeline.length - 1].valorFinal : valorInicial;

    return {
        valorInicial,
        valorFinal: valorFinalTotal,
        dataInicial,
        dataFinal,
        indice,
        tipoJuros,
        percentualMensal: percentualMensal ?? null,
        versao_formula: 1,
        usandoFallback,
        timeline,
        memoriaDetalhada: {
            resumo: usandoFallback
                ? `Correção estimada pelo índice ${indice} (taxas aproximadas — tabela de índices não populada) e juros ${tipoJuros} de ${dataInicial} a ${dataFinal}. Valor inicial R$ ${valorInicial.toFixed(2)} → Valor final R$ ${valorFinalTotal.toFixed(2)}.`
                : `Correção pelo índice ${indice} e juros ${tipoJuros} de ${dataInicial} a ${dataFinal}. Valor inicial R$ ${valorInicial.toFixed(2)} → Valor final R$ ${valorFinalTotal.toFixed(2)}.`,
            totalMeses: timeline.length,
        },
        tabelaExportavel: timeline.map((t) => ({
            Mês: t.mes,
            "Valor início": t.valorInicio,
            Correção: t.correcao,
            "Valor pós-correção": t.valorAposCorrecao,
            Juros: t.juros,
            "Valor final": t.valorFinal,
        })),
    } as CorrecaoValoresResult & { usandoFallback: boolean };
}
