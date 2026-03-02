import { describe, it, expect, vi, afterEach } from "vitest";
import { shouldCheckProcess, isRelevantMovement, detectMovementType, RELEVANT_KEYWORDS } from "@/lib/processMonitor";

// ─── shouldCheckProcess ───────────────────────────────────────────────────────

describe("shouldCheckProcess", () => {
    afterEach(() => vi.useRealTimers());

    const base = { id: "1", number: "0000001-00.2024.8.26.0001", owner_id: "user-1" };

    it("retorna true quando last_checked_at é null (nunca consultado)", () => {
        expect(shouldCheckProcess({ ...base, last_checked_at: null })).toBe(true);
    });

    it("retorna false quando consultado há menos de 24h", () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2024-06-15T12:00:00Z"));
        expect(shouldCheckProcess({ ...base, last_checked_at: "2024-06-15T10:00:00Z" })).toBe(false);
    });

    it("retorna true quando consultado há exatamente 24h", () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2024-06-16T12:00:00Z"));
        expect(shouldCheckProcess({ ...base, last_checked_at: "2024-06-15T12:00:00Z" })).toBe(true);
    });

    it("retorna true quando consultado há mais de 24h", () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2024-06-18T00:00:00Z"));
        expect(shouldCheckProcess({ ...base, last_checked_at: "2024-06-15T12:00:00Z" })).toBe(true);
    });

    it("retorna true quando consultado há 25h", () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2024-06-16T13:00:00Z"));
        expect(shouldCheckProcess({ ...base, last_checked_at: "2024-06-15T12:00:00Z" })).toBe(true);
    });
});

// ─── isRelevantMovement ───────────────────────────────────────────────────────

describe("isRelevantMovement", () => {
    it("retorna false para string vazia", () => {
        expect(isRelevantMovement("")).toBe(false);
    });

    it("retorna false para texto sem palavras-chave", () => {
        expect(isRelevantMovement("Carga para o advogado")).toBe(false);
        expect(isRelevantMovement("Expedição de mandado de citação")).toBe(false);
    });

    it("detecta Sentença", () => {
        expect(isRelevantMovement("Prolatada a Sentença de procedência")).toBe(true);
    });

    it("detecta Decisão", () => {
        expect(isRelevantMovement("Decisão proferida pelo juiz")).toBe(true);
    });

    it("detecta Despacho", () => {
        expect(isRelevantMovement("Publicado o Despacho de mero expediente")).toBe(true);
    });

    it("detecta Publicação", () => {
        expect(isRelevantMovement("Publicação no DJE do dia 12/06")).toBe(true);
    });

    it("detecta Intimação", () => {
        expect(isRelevantMovement("Expedida Intimação ao réu")).toBe(true);
    });

    it("é case-insensitive", () => {
        expect(isRelevantMovement("prolatada a sentença")).toBe(true);
        expect(isRelevantMovement("DESPACHO PUBLICADO")).toBe(true);
    });

    it("ignora acentos na comparação (normaliza NFD)", () => {
        // 'Decisao' sem acento deve bater em 'Decisão'
        expect(isRelevantMovement("Decisao proferida")).toBe(true);
        expect(isRelevantMovement("Sentenca prolatada")).toBe(true);
    });

    it("retorna false para entrada não-string (guard em runtime)", () => {
        // @ts-expect-error – testando guard de runtime
        expect(isRelevantMovement(null)).toBe(false);
        // @ts-expect-error – testando guard de runtime
        expect(isRelevantMovement(undefined)).toBe(false);
    });
});

// ─── detectMovementType ───────────────────────────────────────────────────────

describe("detectMovementType", () => {
    it("retorna 'Andamento' para string vazia", () => {
        expect(detectMovementType("")).toBe("Andamento");
    });

    it("retorna 'Andamento' para texto sem palavras-chave", () => {
        expect(detectMovementType("Expedição de mandado")).toBe("Andamento");
    });

    it("retorna 'Sentença' para texto com Sentença", () => {
        expect(detectMovementType("Foi prolatada a Sentença")).toBe("Sentença");
    });

    it("retorna 'Decisão' para texto com Decisão", () => {
        expect(detectMovementType("Decisão proferida")).toBe("Decisão");
    });

    it("retorna 'Despacho' para texto com Despacho", () => {
        expect(detectMovementType("Despacho publicado")).toBe("Despacho");
    });

    it("retorna 'Publicação' para texto com Publicação", () => {
        expect(detectMovementType("Publicação no DJE")).toBe("Publicação");
    });

    it("retorna 'Intimação' para texto com Intimação", () => {
        expect(detectMovementType("Expedida Intimação")).toBe("Intimação");
    });

    it("retorna a primeira palavra-chave que bate (Sentença antes de Decisão)", () => {
        // 'Sentença' é index 0, 'Decisão' é index 1 — deve retornar 'Sentença'
        const result = detectMovementType("Sentença e Decisão proferidas no mesmo dia");
        expect(result).toBe("Sentença");
    });

    it("é case-insensitive", () => {
        expect(detectMovementType("despacho publicado")).toBe("Despacho");
    });

    it("retorna 'Andamento' para entrada não-string (guard em runtime)", () => {
        // @ts-expect-error – testando guard de runtime
        expect(detectMovementType(null)).toBe("Andamento");
    });
});

// ─── RELEVANT_KEYWORDS ────────────────────────────────────────────────────────

describe("RELEVANT_KEYWORDS", () => {
    it("é um array não-vazio", () => {
        expect(Array.isArray(RELEVANT_KEYWORDS)).toBe(true);
        expect(RELEVANT_KEYWORDS.length).toBeGreaterThan(0);
    });

    it("contém as palavras jurídicas esperadas", () => {
        expect(RELEVANT_KEYWORDS).toContain("Sentença");
        expect(RELEVANT_KEYWORDS).toContain("Decisão");
        expect(RELEVANT_KEYWORDS).toContain("Despacho");
        expect(RELEVANT_KEYWORDS).toContain("Intimação");
    });
});
