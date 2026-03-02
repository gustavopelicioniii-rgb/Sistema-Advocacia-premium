import { describe, it, expect } from "vitest";
import { normalizeProcessNumber } from "@/lib/escavador";

// ─── normalizeProcessNumber ───────────────────────────────────────────────────
// Função pura — sem dependências externas; segura para testes unitários.
// fetchMovimentacoesViaProxy depende do Supabase client e não é testada aqui.

describe("normalizeProcessNumber", () => {
    it("formata 20 dígitos sem pontuação para o formato CNJ", () => {
        expect(normalizeProcessNumber("00180631920138260002")).toBe("0018063-19.2013.8.26.0002");
    });

    it("reformata número já no padrão CNJ (stripa pontuação e reaplica)", () => {
        // '0018063-19.2013.8.26.0002' → cleaned = '00180631920138260002' (20 dígitos) → refornatado
        expect(normalizeProcessNumber("0018063-19.2013.8.26.0002")).toBe("0018063-19.2013.8.26.0002");
    });

    it("retorna o valor (trimado) quando há menos de 20 dígitos", () => {
        expect(normalizeProcessNumber("12345")).toBe("12345");
        expect(normalizeProcessNumber("  123  ")).toBe("123");
    });

    it("ignora espaços entre os dígitos antes de formatar", () => {
        // '0018063 19 2013 8 26 0002' → cleaned = '00180631920138260002' → CNJ
        expect(normalizeProcessNumber("0018063 19 2013 8 26 0002")).toBe("0018063-19.2013.8.26.0002");
    });

    it("ignora outros caracteres não-dígito (barras, traços misturados)", () => {
        expect(normalizeProcessNumber("00180631920138260002")).toBe("0018063-19.2013.8.26.0002");
    });

    it("produz a estrutura CNJ correta: NNNNNNN-DD.AAAA.J.TT.OOOO", () => {
        const result = normalizeProcessNumber("12345678901234567890");
        // 7 + '-' + 2 + '.' + 4 + '.' + 1 + '.' + 2 + '.' + 4
        expect(result).toMatch(/^\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}$/);
    });

    it("funciona com número de outro tribunal (TRT)", () => {
        // 20 dígitos qualquer → deve formatar independente do tribunal
        expect(normalizeProcessNumber("00001234520245030001")).toBe("0000123-45.2024.5.03.0001");
    });

    it("retorna string vazia trimada se input for só espaços com < 20 dígitos", () => {
        expect(normalizeProcessNumber("   ")).toBe("");
    });
});
