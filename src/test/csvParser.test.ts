import { describe, it, expect } from "vitest";
import { parseCSV, parseNumber, parseDate } from "@/lib/csvParser";

// ─── parseCSV ────────────────────────────────────────────────────────────────

describe("parseCSV", () => {
    it("retorna [] para string vazia", () => {
        expect(parseCSV("")).toEqual([]);
    });

    it("retorna [] para apenas o cabeçalho (sem linhas de dados)", () => {
        expect(parseCSV("nome")).toEqual([]);
    });

    it("parseia CSV separado por vírgula", () => {
        const csv = "nome,idade\nAlice,30\nBob,25";
        expect(parseCSV(csv)).toEqual([
            { nome: "Alice", idade: "30" },
            { nome: "Bob", idade: "25" },
        ]);
    });

    it("parseia CSV separado por ponto-e-vírgula", () => {
        const csv = "nome;valor\nAlice;100,00\nBob;200,50";
        expect(parseCSV(csv)).toEqual([
            { nome: "Alice", valor: "100,00" },
            { nome: "Bob", valor: "200,50" },
        ]);
    });

    it("lida com campos entre aspas contendo vírgulas", () => {
        const csv = 'nome,endereco\n"Alice","Rua A, 123"\n"Bob","Rua B, 456"';
        expect(parseCSV(csv)).toEqual([
            { nome: "Alice", endereco: "Rua A, 123" },
            { nome: "Bob", endereco: "Rua B, 456" },
        ]);
    });

    it("lida com aspas duplas escapadas dentro de campo", () => {
        const csv = 'nome,obs\n"Alice","Ela disse ""olá"""';
        expect(parseCSV(csv)).toEqual([{ nome: "Alice", obs: 'Ela disse "olá"' }]);
    });

    it("remove espaços dos cabeçalhos e valores", () => {
        const csv = " nome , idade \n Alice , 30 ";
        const result = parseCSV(csv);
        expect(result[0]).toHaveProperty("nome", "Alice");
        expect(result[0]).toHaveProperty("idade", "30");
    });

    it("preenche valores ausentes com string vazia", () => {
        const csv = "a,b,c\n1,2";
        const result = parseCSV(csv);
        expect(result[0].c).toBe("");
    });

    it("ignora linhas em branco", () => {
        const csv = "nome,idade\n\nAlice,30\n\n";
        const result = parseCSV(csv);
        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({ nome: "Alice", idade: "30" });
    });

    it("parseia múltiplas linhas corretamente", () => {
        const csv = "id,status\n1,pago\n2,pendente\n3,atrasado";
        const result = parseCSV(csv);
        expect(result).toHaveLength(3);
        expect(result[2]).toEqual({ id: "3", status: "atrasado" });
    });
});

// ─── parseNumber ─────────────────────────────────────────────────────────────

describe("parseNumber", () => {
    it("retorna 0 para string vazia", () => {
        expect(parseNumber("")).toBe(0);
    });

    it("parseia número inteiro simples", () => {
        expect(parseNumber("1000")).toBe(1000);
    });

    it("parseia formato pt-BR com ponto e vírgula (1.234,56)", () => {
        expect(parseNumber("1.234,56")).toBe(1234.56);
    });

    it("parseia formato com vírgula decimal sem separador de milhar (1234,56)", () => {
        expect(parseNumber("1234,56")).toBe(1234.56);
    });

    it("parseia formato US com ponto decimal (1234.56)", () => {
        expect(parseNumber("1234.56")).toBe(1234.56);
    });

    it("remove símbolo R$", () => {
        expect(parseNumber("R$ 1.500,00")).toBe(1500);
    });

    it("remove espaços", () => {
        expect(parseNumber("  500,00  ")).toBe(500);
    });

    it("retorna 0 para string não-numérica", () => {
        expect(parseNumber("abc")).toBe(0);
        expect(parseNumber("---")).toBe(0);
    });

    it("parseia zero corretamente", () => {
        expect(parseNumber("0")).toBe(0);
        expect(parseNumber("0,00")).toBe(0);
    });

    it("parseia valor grande pt-BR (1.000.000,00)", () => {
        expect(parseNumber("1.000.000,00")).toBe(1000000);
    });
});

// ─── parseDate ───────────────────────────────────────────────────────────────

describe("parseDate", () => {
    it("retorna null para string vazia", () => {
        expect(parseDate("")).toBeNull();
    });

    it("converte dd/mm/yyyy para yyyy-mm-dd", () => {
        expect(parseDate("15/03/2024")).toBe("2024-03-15");
    });

    it("preenche dia e mês com zero à esquerda", () => {
        expect(parseDate("1/3/2024")).toBe("2024-03-01");
    });

    it("retorna data ISO yyyy-mm-dd sem alteração", () => {
        expect(parseDate("2024-03-15")).toBe("2024-03-15");
    });

    it("retorna null para formato não reconhecido", () => {
        expect(parseDate("not-a-date")).toBeNull();
        expect(parseDate("15-03-2024")).toBeNull();
        expect(parseDate("03/2024")).toBeNull();
    });

    it("converte 31/12/2023", () => {
        expect(parseDate("31/12/2023")).toBe("2023-12-31");
    });

    it("converte 01/01/2000", () => {
        expect(parseDate("01/01/2000")).toBe("2000-01-01");
    });
});
