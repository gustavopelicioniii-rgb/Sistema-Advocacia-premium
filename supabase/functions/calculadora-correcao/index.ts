/**
 * Calculadora Jurídica — Correção de Valores (Base Geral)
 * Cálculo server-side: atualização monetária + juros. Retorna linha do tempo e memória detalhada.
 * POST body: { valorInicial, dataInicial, dataFinal, indice, tipoJuros, percentualMensal? }
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Ordem e nomes exigidos pelo cliente Supabase (evita CORS "x-client-info is not allowed")
const cors: Record<string, string> = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type TipoJuros = "simples" | "compostos" | "1%_ao_mes" | "selic_acumulada" | "legais";

interface Body {
    valorInicial: number;
    dataInicial: string;
    dataFinal: string;
    indice: string;
    tipoJuros: TipoJuros;
    percentualMensal?: number;
}

interface TimelineItem {
    mes: string;
    valorInicio: number;
    correcao: number;
    valorAposCorrecao: number;
    juros: number;
    valorFinal: number;
    indiceAplicado?: number;
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

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { status: 204, headers: cors });
    }

    const json = (body: unknown, status: number) =>
        new Response(JSON.stringify(body), {
            status,
            headers: { "Content-Type": "application/json", ...cors },
        });

    if (req.method !== "POST") {
        return json({ error: "Método não permitido" }, 405);
    }

    let body: Body;
    try {
        body = (await req.json()) as Body;
    } catch {
        return json({ error: "Body JSON inválido" }, 400);
    }

    const { valorInicial, dataInicial, dataFinal, indice, tipoJuros, percentualMensal } = body;
    if (valorInicial == null || !dataInicial || !dataFinal || !indice || !tipoJuros) {
        return json({ error: "Faltam: valorInicial, dataInicial, dataFinal, indice, tipoJuros" }, 400);
    }

    const start = parseDate(dataInicial);
    const end = parseDate(dataFinal);
    if (start >= end) {
        return json({ error: "dataInicial deve ser anterior a dataFinal" }, 400);
    }

    try {
        const supabase = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        );

        const months = getMonthsBetween(start, end);
        const refInicio = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-01`;
        const refFim = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, "0")}-01`;

        // Busca índices do banco — fault-tolerant: se a tabela não existir ou query falhar,
        // usa taxas aproximadas de fallback e o cálculo prossegue normalmente.
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
            // Se a tabela existe mas está vazia para o período, usa fallback silenciosamente
            if (Object.keys(indicePorRef).length === 0) usandoFallback = true;
        } catch {
            // Tabela inexistente ou erro de DB — calcula com taxas aproximadas de fallback
            usandoFallback = true;
        }

        const taxaFixaMensal =
            percentualMensal != null ? percentualMensal / 100 : tipoJuros === "1%_ao_mes" ? 0.01 : 0.006; // 1% ou ~SELIC 0.6% para demo

        const timeline: TimelineItem[] = [];
        let valorAtual = valorInicial;

        for (const { year, month } of months) {
            const refStr = `${year}-${String(month).padStart(2, "0")}`;
            const indiceValor = indicePorRef[refStr];
            const taxaCorrecao = indiceValor != null && indiceValor > 0 ? indiceValor / 100 : 0.005; // 0,5% se não houver índice
            const correcao = valorAtual * taxaCorrecao;
            const valorAposCorrecao = valorAtual + correcao;

            let juros: number;
            let valorFinal: number;
            if (tipoJuros === "simples") {
                // Juros simples: taxa aplicada apenas sobre o valor do mês (pós-correção)
                juros = valorAposCorrecao * taxaFixaMensal;
                valorFinal = valorAposCorrecao + juros;
            } else {
                // Juros compostos: valor final = valorAposCorrecao * (1 + taxa); juros acumulam mês a mês
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

        const versaoFormula = 1;
        const resultado = {
            valorInicial,
            valorFinal: valorFinalTotal,
            dataInicial,
            dataFinal,
            indice,
            tipoJuros,
            percentualMensal: percentualMensal ?? null,
            versao_formula: versaoFormula,
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
        };

        return new Response(JSON.stringify(resultado), {
            status: 200,
            headers: { "Content-Type": "application/json", ...cors },
        });
    } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        const isTableMissing =
            /relation ["']?indices_oficiais["']? does not exist/i.test(msg) ||
            /relation ["']?public\.indices_oficiais["']? does not exist/i.test(msg);
        if (isTableMissing) {
            return json(
                {
                    error: "Tabela de índices não encontrada. Execute a migration da Calculadora Jurídica no SQL Editor do Supabase (ver DEPLOY-VERCEL.md §3.6).",
                },
                503,
            );
        }
        return json({ error: msg || "Erro interno na Edge Function" }, 500);
    }
});
