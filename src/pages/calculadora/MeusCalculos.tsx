import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Calculator, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { CorrecaoValoresParametros } from "@/types/calculadora";

const formatCurrency = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const MeusCalculos = () => {
    const navigate = useNavigate();
    const { data: calculos = [], isLoading } = useQuery({
        queryKey: ["calculos"],
        queryFn: async () => {
            try {
                const { data, error } = await supabase
                    .from("calculos")
                    .select("id, created_at, tipo_calculo, titulo, parametros_json, resultado_json")
                    .order("created_at", { ascending: false })
                    .limit(50);
                if (error) return [];
                return data ?? [];
            } catch {
                return [];
            }
        },
    });

    const getValorFinal = (r: { resultado_json?: { valorFinal?: number } | null }) => r?.resultado_json?.valorFinal;
    const getResumo = (r: { resultado_json?: { memoriaDetalhada?: { resumo?: string } } | null }) =>
        r?.resultado_json?.memoriaDetalhada?.resumo;

    const parametrosFromCalculo = (c: {
        tipo_calculo?: string;
        parametros_json?: Record<string, unknown> | null;
    }): CorrecaoValoresParametros | null => {
        if (c.tipo_calculo !== "correcao_valores") return null;
        const p = c.parametros_json;
        if (!p || typeof p.valorInicial !== "number" || !p.dataInicial || !p.dataFinal) return null;
        return {
            valorInicial: Number(p.valorInicial),
            dataInicial: String(p.dataInicial),
            dataFinal: String(p.dataFinal),
            indice: (p.indice as string) || "IPCA",
            tipoJuros: (p.tipoJuros as string) || "1%_ao_mes",
            percentualMensal: p.percentualMensal != null ? String(p.percentualMensal) : undefined,
        };
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate("/calculadora")}
                        aria-label="Voltar para calculadora"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="font-display text-2xl font-bold text-foreground">Meus Cálculos</h1>
                        <p className="text-sm text-muted-foreground">Histórico de cálculos realizados.</p>
                    </div>
                </div>
                <Button variant="outline" onClick={() => navigate("/calculadora")}>
                    Novo Cálculo
                </Button>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : calculos.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                        <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Nenhum cálculo salvo ainda.</p>
                        <Button className="mt-4" onClick={() => navigate("/calculadora")}>
                            Ir para Calculadora
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {calculos.map((c) => {
                        const valorFinal = getValorFinal(c);
                        const resumo = getResumo(c);
                        return (
                            <Card
                                key={c.id}
                                className="cursor-pointer hover:border-primary/30 transition-colors"
                                onClick={() => {
                                    const parametros = parametrosFromCalculo(c);
                                    navigate("/calculadora/correcao", {
                                        state: parametros ? { parametros } : undefined,
                                    });
                                }}
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-start gap-2">
                                        <FileText className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                                        <div className="min-w-0">
                                            <p className="font-medium truncate">{c.titulo || c.tipo_calculo}</p>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                {format(parseISO(c.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                                            </p>
                                            {valorFinal != null && (
                                                <p className="text-sm text-primary font-semibold mt-1">
                                                    {formatCurrency(valorFinal)}
                                                </p>
                                            )}
                                            {resumo && (
                                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                                    {resumo}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default MeusCalculos;
