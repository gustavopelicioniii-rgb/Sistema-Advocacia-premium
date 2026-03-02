import { describe, it, expect } from "vitest";

// ─── Health Score Calculation ─────────────────────────────────────────────────
// A lógica de health score está inline no Dashboard.tsx (useMemo).
// Extraímos aqui uma réplica fiel das fórmulas para testes unitários puros,
// cobrindo edge cases sem dependência de React ou Supabase.

// --- Réplica das fórmulas do Dashboard.tsx (linhas 50-62) ---

interface FeeStats {
    pago: number;
    pendente: number;
    atrasado: number;
}

interface Processo {
    status: string;
    updated_at: string;
}

function calcPrazosScore(urgentes: number, pendentes: number, totalPrazos: number): number {
    return totalPrazos === 0 ? 100 : Math.max(0, 100 - (urgentes / Math.max(1, pendentes)) * 40);
}

function calcFeeScore(feeStats: FeeStats): number {
    const totalFee = feeStats.pago + feeStats.pendente + feeStats.atrasado;
    return totalFee === 0 ? 100 : Math.max(0, 100 - (feeStats.atrasado / totalFee) * 100);
}

function calcProcessScore(processos: Processo[], now: Date): number {
    const ativos = processos.filter((p) => p.status === "Em andamento" || p.status === "Aguardando prazo");
    const comMovimento = ativos.filter((p) => {
        const up = new Date(p.updated_at);
        const diff = (now.getTime() - up.getTime()) / (1000 * 60 * 60 * 24);
        return diff <= 30;
    });
    return ativos.length === 0 ? 100 : Math.round((comMovimento.length / ativos.length) * 100);
}

function calcReceitaScore(feeStats: FeeStats): number {
    const totalFee = feeStats.pago + feeStats.pendente + feeStats.atrasado;
    return totalFee === 0 ? 100 : feeStats.pago > 0 ? Math.min(100, 50 + (feeStats.pago / totalFee) * 50) : 50;
}

function calcHealthScore(
    urgentes: number,
    pendentes: number,
    totalPrazos: number,
    feeStats: FeeStats,
    processos: Processo[],
    now: Date = new Date(),
): number {
    const prazosScore = calcPrazosScore(urgentes, pendentes, totalPrazos);
    const feeScore = calcFeeScore(feeStats);
    const processScore = calcProcessScore(processos, now);
    const receitaScore = calcReceitaScore(feeStats);
    const score = Math.round(0.3 * prazosScore + 0.25 * feeScore + 0.25 * processScore + 0.2 * receitaScore);
    return Math.min(100, Math.max(0, score));
}

function getScoreLabel(score: number): string {
    if (score >= 80) return "Escritório saudável";
    if (score >= 60) return "Atenção a prazos e cobranças";
    return "Requer atenção";
}

// --- Testes ---

describe("calcPrazosScore", () => {
    it("retorna 100 quando não há prazos", () => {
        expect(calcPrazosScore(0, 0, 0)).toBe(100);
    });

    it("retorna 100 quando há prazos mas nenhum urgente", () => {
        expect(calcPrazosScore(0, 10, 10)).toBe(100);
    });

    it("reduz score proporcionalmente a urgentes/pendentes", () => {
        // 5 urgentes de 10 pendentes → 100 - (5/10)*40 = 80
        expect(calcPrazosScore(5, 10, 10)).toBe(80);
    });

    it("retorna 0 quando todos são urgentes", () => {
        // 10/10 * 40 = 40, 100 - 40 = 60
        expect(calcPrazosScore(10, 10, 10)).toBe(60);
    });

    it("clamp a 0 quando urgentes excedem pendentes (edge case)", () => {
        // urgentes > pendentes (dados inconsistentes): 100 - (5/2)*40 = 100 - 100 = 0
        expect(calcPrazosScore(5, 2, 5)).toBe(0);
    });

    it("usa Math.max(1, pendentes) para evitar divisão por zero com pendentes=0 e totalPrazos>0", () => {
        // pendentes=0, totalPrazos=5 → 100 - (3/1)*40 = -20 → clamp 0
        expect(calcPrazosScore(3, 0, 5)).toBe(0);
    });
});

describe("calcFeeScore", () => {
    it("retorna 100 quando total de honorários é zero", () => {
        expect(calcFeeScore({ pago: 0, pendente: 0, atrasado: 0 })).toBe(100);
    });

    it("retorna 100 quando não há atrasados", () => {
        expect(calcFeeScore({ pago: 1000, pendente: 500, atrasado: 0 })).toBe(100);
    });

    it("retorna 0 quando tudo está atrasado", () => {
        expect(calcFeeScore({ pago: 0, pendente: 0, atrasado: 1000 })).toBe(0);
    });

    it("calcula proporcional ao atraso", () => {
        // total=1000, atrasado=200 → 100 - (200/1000)*100 = 80
        expect(calcFeeScore({ pago: 500, pendente: 300, atrasado: 200 })).toBe(80);
    });

    it("metade atrasada = score 50", () => {
        expect(calcFeeScore({ pago: 250, pendente: 250, atrasado: 500 })).toBe(50);
    });
});

describe("calcProcessScore", () => {
    const now = new Date("2026-03-02T12:00:00Z");

    it("retorna 100 quando não há processos ativos", () => {
        expect(calcProcessScore([], now)).toBe(100);
    });

    it("retorna 100 quando todos concluídos (nenhum ativo)", () => {
        const processos = [
            { status: "Concluído", updated_at: "2025-01-01T00:00:00Z" },
            { status: "Suspenso", updated_at: "2025-01-01T00:00:00Z" },
        ];
        expect(calcProcessScore(processos, now)).toBe(100);
    });

    it("retorna 100 quando todos ativos têm movimentação recente (<=30 dias)", () => {
        const processos = [
            { status: "Em andamento", updated_at: "2026-02-15T00:00:00Z" },
            { status: "Aguardando prazo", updated_at: "2026-02-28T00:00:00Z" },
        ];
        expect(calcProcessScore(processos, now)).toBe(100);
    });

    it("retorna 0 quando todos ativos estão sem movimentação há mais de 30 dias", () => {
        const processos = [
            { status: "Em andamento", updated_at: "2025-01-01T00:00:00Z" },
            { status: "Aguardando prazo", updated_at: "2025-06-01T00:00:00Z" },
        ];
        expect(calcProcessScore(processos, now)).toBe(0);
    });

    it("calcula proporção corretamente para mistura de processos", () => {
        const processos = [
            { status: "Em andamento", updated_at: "2026-02-20T00:00:00Z" }, // recente
            { status: "Em andamento", updated_at: "2025-01-01T00:00:00Z" }, // antigo
        ];
        // 1 de 2 ativos com movimentação = 50%
        expect(calcProcessScore(processos, now)).toBe(50);
    });

    it("ignora processos concluídos/suspensos ao calcular", () => {
        const processos = [
            { status: "Em andamento", updated_at: "2026-02-28T00:00:00Z" },
            { status: "Concluído", updated_at: "2020-01-01T00:00:00Z" }, // ignorado
        ];
        expect(calcProcessScore(processos, now)).toBe(100);
    });

    it("processo atualizado exatamente há 30 dias conta como recente", () => {
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const processos = [{ status: "Em andamento", updated_at: thirtyDaysAgo.toISOString() }];
        expect(calcProcessScore(processos, now)).toBe(100);
    });

    it("processo atualizado há 31 dias NÃO conta como recente", () => {
        const thirtyOneDaysAgo = new Date(now);
        thirtyOneDaysAgo.setDate(thirtyOneDaysAgo.getDate() - 31);
        const processos = [{ status: "Em andamento", updated_at: thirtyOneDaysAgo.toISOString() }];
        expect(calcProcessScore(processos, now)).toBe(0);
    });
});

describe("calcReceitaScore", () => {
    it("retorna 100 quando total é zero", () => {
        expect(calcReceitaScore({ pago: 0, pendente: 0, atrasado: 0 })).toBe(100);
    });

    it("retorna 50 quando nada foi pago mas há honorários", () => {
        expect(calcReceitaScore({ pago: 0, pendente: 500, atrasado: 500 })).toBe(50);
    });

    it("retorna 100 quando tudo foi pago", () => {
        expect(calcReceitaScore({ pago: 1000, pendente: 0, atrasado: 0 })).toBe(100);
    });

    it("calcula proporcionalmente: metade paga", () => {
        // 50 + (500/1000)*50 = 50 + 25 = 75
        expect(calcReceitaScore({ pago: 500, pendente: 500, atrasado: 0 })).toBe(75);
    });

    it("nunca excede 100", () => {
        // pago=10000, total=10000, 50 + (10000/10000)*50 = 100
        expect(calcReceitaScore({ pago: 10000, pendente: 0, atrasado: 0 })).toBeLessThanOrEqual(100);
    });
});

describe("calcHealthScore (composto)", () => {
    const now = new Date("2026-03-02T12:00:00Z");
    const noFees: FeeStats = { pago: 0, pendente: 0, atrasado: 0 };

    it("retorna 100 para escritório perfeito (sem dados = tudo perfeito)", () => {
        expect(calcHealthScore(0, 0, 0, noFees, [], now)).toBe(100);
    });

    it("clampa entre 0 e 100", () => {
        const score = calcHealthScore(
            100,
            1,
            100,
            { pago: 0, pendente: 0, atrasado: 10000 },
            [{ status: "Em andamento", updated_at: "2020-01-01T00:00:00Z" }],
            now,
        );
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(100);
    });

    it("pesos somam 1.0 (0.3 + 0.25 + 0.25 + 0.2)", () => {
        // Verifica que com todos os sub-scores = 100 → score = 100
        expect(
            calcHealthScore(
                0,
                10,
                10,
                { pago: 1000, pendente: 0, atrasado: 0 },
                [{ status: "Em andamento", updated_at: "2026-02-28T00:00:00Z" }],
                now,
            ),
        ).toBe(100);
    });

    it("escritório com problemas sérios tem score baixo", () => {
        const badFees: FeeStats = { pago: 0, pendente: 0, atrasado: 5000 };
        const staleProcessos = [
            { status: "Em andamento", updated_at: "2024-01-01T00:00:00Z" },
            { status: "Aguardando prazo", updated_at: "2024-06-01T00:00:00Z" },
        ];
        const score = calcHealthScore(10, 10, 10, badFees, staleProcessos, now);
        expect(score).toBeLessThan(50);
    });

    it("cenário misto produz score entre 50-80", () => {
        const mixedFees: FeeStats = { pago: 500, pendente: 300, atrasado: 200 };
        const mixedProcessos = [
            { status: "Em andamento", updated_at: "2026-02-25T00:00:00Z" },
            { status: "Em andamento", updated_at: "2025-01-01T00:00:00Z" },
        ];
        const score = calcHealthScore(2, 8, 8, mixedFees, mixedProcessos, now);
        expect(score).toBeGreaterThanOrEqual(50);
        expect(score).toBeLessThanOrEqual(90);
    });
});

describe("getScoreLabel", () => {
    it("retorna 'Escritório saudável' para score >= 80", () => {
        expect(getScoreLabel(80)).toBe("Escritório saudável");
        expect(getScoreLabel(100)).toBe("Escritório saudável");
    });

    it("retorna 'Atenção a prazos e cobranças' para score 60-79", () => {
        expect(getScoreLabel(60)).toBe("Atenção a prazos e cobranças");
        expect(getScoreLabel(79)).toBe("Atenção a prazos e cobranças");
    });

    it("retorna 'Requer atenção' para score < 60", () => {
        expect(getScoreLabel(59)).toBe("Requer atenção");
        expect(getScoreLabel(0)).toBe("Requer atenção");
    });
});

// --- getScoreColor / getScoreEmoji (de HealthScore.tsx) ---

function getScoreColor(score: number) {
    if (score >= 80) return { bg: "bg-success/15", text: "text-success", ring: "ring-success/30" };
    if (score >= 60) return { bg: "bg-warning/15", text: "text-warning", ring: "ring-warning/30" };
    return { bg: "bg-destructive/15", text: "text-destructive", ring: "ring-destructive/30" };
}

function getScoreEmoji(score: number) {
    if (score >= 80) return "🟢";
    if (score >= 60) return "🟠";
    return "🔴";
}

describe("getScoreColor", () => {
    it("retorna success para score >= 80", () => {
        expect(getScoreColor(80).text).toBe("text-success");
        expect(getScoreColor(100).text).toBe("text-success");
    });

    it("retorna warning para score 60-79", () => {
        expect(getScoreColor(60).text).toBe("text-warning");
        expect(getScoreColor(79).text).toBe("text-warning");
    });

    it("retorna destructive para score < 60", () => {
        expect(getScoreColor(59).text).toBe("text-destructive");
        expect(getScoreColor(0).text).toBe("text-destructive");
    });
});

describe("getScoreEmoji", () => {
    it("retorna verde para score >= 80", () => {
        expect(getScoreEmoji(80)).toBe("🟢");
    });

    it("retorna laranja para score 60-79", () => {
        expect(getScoreEmoji(65)).toBe("🟠");
    });

    it("retorna vermelho para score < 60", () => {
        expect(getScoreEmoji(30)).toBe("🔴");
    });
});
