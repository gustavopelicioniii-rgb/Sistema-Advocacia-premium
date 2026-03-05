import { useMemo, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import CalculatorLayout, { type CalculatorStep } from "@/components/calculadora/CalculatorLayout";
import { supabase } from "@/integrations/supabase/client";
import { calcularCorrecaoValores } from "@/lib/calcularCorrecao";
import type { CorrecaoValoresResult } from "@/types/calculadora";

type ModuloTipo = "monetary" | "penal_dosimetria" | "penal_progressao";

type ExtraModuloConfig = {
    title: string;
    description: string;
    tipo: ModuloTipo;
    valorLabel?: string;
    indiceDefault?: string;
};

const MODULOS_EXTRA: Record<string, ExtraModuloConfig> = {
    trabalhista: {
        title: "Trabalhista",
        description:
            "Use para atualizar o valor de verbas trabalhistas (rescisão, horas extras, FGTS, etc.) entre duas datas.",
        tipo: "monetary",
        valorLabel: "Valor base das verbas (R$) *",
        indiceDefault: "INPC",
    },
    pasep: {
        title: "PASEP",
        description: "Revisão de saldo PASEP com correção monetária pelo índice escolhido e juros legais.",
        tipo: "monetary",
        valorLabel: "Saldo original (R$) *",
        indiceDefault: "INPC",
    },
    "rmc-rcc": {
        title: "RMC e RCC (Cartão Consignado)",
        description: "Atualize o valor total cobrado em contratos de cartão consignado para apurar indébito.",
        tipo: "monetary",
        valorLabel: "Total cobrado (R$) *",
        indiceDefault: "IPCA",
    },
    superendividamento: {
        title: "Superendividamento",
        description: "Simule a consolidação de dívidas aplicando correção monetária e juros uniformes ao valor total.",
        tipo: "monetary",
        valorLabel: "Total das dívidas (R$) *",
        indiceDefault: "IPCA",
    },
    revisional: {
        title: "Revisional Bancário",
        description:
            "Recalcule, de forma simplificada, o valor de um contrato bancário aplicando índice oficial e juros legais.",
        tipo: "monetary",
        valorLabel: "Saldo do contrato (R$) *",
        indiceDefault: "IPCA",
    },
    aluguel: {
        title: "Aluguel",
        description: "Atualize aluguel em atraso com base em índice oficial e juros mensais.",
        tipo: "monetary",
        valorLabel: "Aluguel mensal (R$) *",
        indiceDefault: "IGP-M",
    },
    pensao: {
        title: "Pensão",
        description: "Calcule, de forma simplificada, o valor atualizado de parcelas de pensão em atraso.",
        tipo: "monetary",
        valorLabel: "Parcela mensal da pensão (R$) *",
        indiceDefault: "INPC",
    },
    inss: {
        title: "INSS",
        description: "Atualize valores de atrasados de benefício previdenciário entre duas datas.",
        tipo: "monetary",
        valorLabel: "Parcela mensal do benefício (R$) *",
        indiceDefault: "INPC",
    },
    divorcio: {
        title: "Divórcio",
        description: "Atualize o valor de bens ou quotas a partilhar entre duas datas para fins de meação.",
        tipo: "monetary",
        valorLabel: "Valor do bem/quota (R$) *",
        indiceDefault: "IPCA",
    },
    dosimetria: {
        title: "Dosimetria da Pena",
        description:
            "Calcule, em três fases simplificadas, a pena final a partir da pena-base e percentuais de agravantes/atenuantes e causas de aumento/diminuição.",
        tipo: "penal_dosimetria",
    },
    progressao: {
        title: "Progressão de Regime",
        description:
            "Calcule o tempo mínimo e a data provável para progressão de regime com base no tipo de crime e tempo total de pena (sem remição).",
        tipo: "penal_progressao",
    },
};

const INDICES = ["IPCA", "INPC", "IGP-M", "SELIC", "TR"] as const;

function parseCurrency(value: string): number {
    const normalized = value.replace(/\./g, "").replace(",", ".");
    const n = parseFloat(normalized);
    return Number.isFinite(n) ? n : 0;
}

function formatCurrency(value: number): string {
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(value);
}

type PenaTempo = {
    anos: number;
    meses: number;
    dias: number;
};

function penaToDias({ anos, meses, dias }: PenaTempo): number {
    return anos * 365 + meses * 30 + dias;
}

function diasToPena(totalDias: number): PenaTempo {
    const anos = Math.floor(totalDias / 365);
    const restoAno = totalDias % 365;
    const meses = Math.floor(restoAno / 30);
    const dias = restoAno % 30;
    return { anos, meses, dias };
}

function addDays(base: string, days: number): string | null {
    if (!base) return null;
    const d = new Date(base);
    if (Number.isNaN(d.getTime())) return null;
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
}

const OutrasCalculadoras = () => {
    const { slug } = useParams<{ slug: string }>();
    const modulo = slug ? MODULOS_EXTRA[slug] : undefined;

    const [valorBase, setValorBase] = useState("");
    const [dataInicial, setDataInicial] = useState("");
    const [dataFinal, setDataFinal] = useState("");
    const [indice, setIndice] = useState<string>("IPCA");
    const [resultadoMonetario, setResultadoMonetario] = useState<CorrecaoValoresResult | null>(null);
    const [loadingMonetario, setLoadingMonetario] = useState(false);

    // Dosimetria
    const [penaBaseAnos, setPenaBaseAnos] = useState("0");
    const [penaBaseMeses, setPenaBaseMeses] = useState("0");
    const [penaBaseDias, setPenaBaseDias] = useState("0");
    const [agravantesPerc, setAgravantesPerc] = useState("0");
    const [atenuantesPerc, setAtenuantesPerc] = useState("0");
    const [majorantesPerc, setMajorantesPerc] = useState("0");
    const [minorantesPerc, setMinorantesPerc] = useState("0");
    const [penaFinalDias, setPenaFinalDias] = useState<number | null>(null);

    // Progressão
    const [penaTotalAnos, setPenaTotalAnos] = useState("0");
    const [penaTotalMeses, setPenaTotalMeses] = useState("0");
    const [penaTotalDias, setPenaTotalDias] = useState("0");
    const [tipoCrime, setTipoCrime] = useState<"comum" | "hediondo">("comum");
    const [reincidente, setReincidente] = useState<"nao" | "sim">("nao");
    const [dataInicioPena, setDataInicioPena] = useState("");
    const [diasMinimosProgressao, setDiasMinimosProgressao] = useState<number | null>(null);
    const [dataElegibilidade, setDataElegibilidade] = useState<string | null>(null);

    const isMonetary = modulo?.tipo === "monetary";
    const isDosimetria = modulo?.tipo === "penal_dosimetria";
    const isProgressao = modulo?.tipo === "penal_progressao";

    const monetarySteps: CalculatorStep[] = [
        { step: 1, label: "Dados do cálculo" },
        { step: 2, label: "Resultado" },
    ];

    const penalSteps: CalculatorStep[] = [
        { step: 1, label: "Parâmetros" },
        { step: 2, label: "Resultado" },
    ];

    const activeStep = useMemo(() => {
        if (isMonetary) {
            return resultadoMonetario ? 2 : 1;
        }
        if (isDosimetria) {
            return penaFinalDias != null ? 2 : 1;
        }
        if (isProgressao) {
            return diasMinimosProgressao != null ? 2 : 1;
        }
        return 1;
    }, [isMonetary, isDosimetria, isProgressao, resultadoMonetario, penaFinalDias, diasMinimosProgressao]);

    const penaFinalFormatada = useMemo(() => {
        if (penaFinalDias == null) return null;
        const { anos, meses, dias } = diasToPena(penaFinalDias);
        return { anos, meses, dias };
    }, [penaFinalDias]);

    const diasMinimosFormatado = useMemo(() => {
        if (diasMinimosProgressao == null) return null;
        return diasToPena(diasMinimosProgressao);
    }, [diasMinimosProgressao]);

    if (!modulo) {
        return <Navigate to="/calculadora" replace />;
    }

    const handleCalcularMonetario = async () => {
        const valor = parseCurrency(valorBase);
        if (!valor || valor <= 0) {
            toast.error("Informe um valor válido.");
            return;
        }
        if (!dataInicial || !dataFinal) {
            toast.error("Informe data inicial e data final.");
            return;
        }
        if (new Date(dataInicial) >= new Date(dataFinal)) {
            toast.error("Data inicial deve ser anterior à data final.");
            return;
        }

        setLoadingMonetario(true);
        setResultadoMonetario(null);

        try {
            const body = {
                valorInicial: valor,
                dataInicial,
                dataFinal,
                indice,
                tipoJuros: "1%_ao_mes" as const,
                percentualMensal: undefined,
            };
            const r = await calcularCorrecaoValores(body, supabase);
            setResultadoMonetario(r);

            if ((r as unknown as { usandoFallback?: boolean }).usandoFallback) {
                toast.warning(
                    "Cálculo realizado com taxas aproximadas. Para maior precisão, popule a tabela de índices oficiais no Supabase.",
                );
            } else {
                toast.success("Cálculo realizado com sucesso.");
            }
        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : "Erro ao calcular.";
            toast.error(msg);
        } finally {
            setLoadingMonetario(false);
        }
    };

    const handleCalcularDosimetria = () => {
        const penaBase = penaToDias({
            anos: Number(penaBaseAnos) || 0,
            meses: Number(penaBaseMeses) || 0,
            dias: Number(penaBaseDias) || 0,
        });
        if (penaBase <= 0) {
            toast.error("Informe uma pena-base maior que zero.");
            return;
        }

        const agrav = (Number(agravantesPerc) || 0) / 100;
        const aten = (Number(atenuantesPerc) || 0) / 100;
        const maj = (Number(majorantesPerc) || 0) / 100;
        const min = (Number(minorantesPerc) || 0) / 100;

        const fatorFase2 = 1 + agrav - aten;
        const fatorFase3 = (1 + maj) * (1 - min);

        const totalDias = Math.round(penaBase * fatorFase2 * fatorFase3);
        setPenaFinalDias(totalDias);
    };

    const handleCalcularProgressao = () => {
        const totalPenaDias = penaToDias({
            anos: Number(penaTotalAnos) || 0,
            meses: Number(penaTotalMeses) || 0,
            dias: Number(penaTotalDias) || 0,
        });

        if (totalPenaDias <= 0) {
            toast.error("Informe um tempo total de pena maior que zero.");
            return;
        }

        let fracao: number;
        if (tipoCrime === "comum") {
            fracao = 1 / 6;
        } else {
            fracao = reincidente === "sim" ? 3 / 5 : 2 / 5;
        }

        const diasMinimos = Math.round(totalPenaDias * fracao);
        const data = addDays(dataInicioPena, diasMinimos);

        setDiasMinimosProgressao(diasMinimos);
        setDataElegibilidade(data);
    };

    return (
        <CalculatorLayout
            title={modulo.title}
            steps={isMonetary ? monetarySteps : penalSteps}
            activeStep={activeStep}
            helpHref="#"
            primaryButton={
                isMonetary
                    ? resultadoMonetario
                        ? { label: "Novo cálculo", onClick: () => setResultadoMonetario(null) }
                        : {
                              label: loadingMonetario ? "Calculando..." : "CALCULAR",
                              onClick: handleCalcularMonetario,
                              disabled: loadingMonetario,
                              loading: loadingMonetario,
                          }
                    : isDosimetria
                      ? penaFinalDias != null
                          ? { label: "Novo cálculo", onClick: () => setPenaFinalDias(null) }
                          : { label: "CALCULAR", onClick: handleCalcularDosimetria }
                      : diasMinimosProgressao != null
                        ? { label: "Novo cálculo", onClick: () => setDiasMinimosProgressao(null) }
                        : { label: "CALCULAR", onClick: handleCalcularProgressao }
            }
        >
            {isMonetary && !resultadoMonetario && (
                <Card>
                    <CardContent className="pt-6 space-y-4">
                        <p className="text-sm text-muted-foreground">{modulo.description}</p>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <div className="space-y-2">
                                <Label>{modulo.valorLabel ?? "Valor base (R$) *"}</Label>
                                <Input
                                    placeholder="0,00"
                                    value={valorBase}
                                    onChange={(e) => setValorBase(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Data inicial *</Label>
                                <Input
                                    type="date"
                                    value={dataInicial}
                                    onChange={(e) => setDataInicial(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Data final *</Label>
                                <Input type="date" value={dataFinal} onChange={(e) => setDataFinal(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Índice para correção *</Label>
                                <select
                                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={indice}
                                    onChange={(e) => setIndice(e.target.value)}
                                >
                                    {INDICES.map((i) => (
                                        <option key={i} value={i}>
                                            {i}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            O cálculo usa o mesmo motor de correção monetária da calculadora de Correção de Valores,
                            aplicando juros de 1% ao mês sobre o valor corrigido. Ajuste índices e datas conforme o caso
                            concreto.
                        </p>
                    </CardContent>
                </Card>
            )}

            {isMonetary && resultadoMonetario && (
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between gap-4">
                        <div>
                            <CardTitle>Resultado</CardTitle>
                            <p className="text-xs text-muted-foreground mt-1">
                                Período de {resultadoMonetario.dataInicial} até {resultadoMonetario.dataFinal}.
                            </p>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <p className="text-sm">
                                <span className="text-muted-foreground">Valor inicial:</span>{" "}
                                <strong>{formatCurrency(resultadoMonetario.valorInicial)}</strong>
                            </p>
                            <p className="text-sm">
                                <span className="text-muted-foreground">Valor final atualizado:</span>{" "}
                                <strong className="text-primary">
                                    {formatCurrency(resultadoMonetario.valorFinal)}
                                </strong>
                            </p>
                        </div>
                        <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                            {resultadoMonetario.memoriaDetalhada?.resumo}
                        </p>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs border-collapse">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left p-2">Mês</th>
                                        <th className="text-right p-2">Valor início</th>
                                        <th className="text-right p-2">Correção</th>
                                        <th className="text-right p-2">Juros</th>
                                        <th className="text-right p-2">Valor final</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(resultadoMonetario.timeline ?? []).map((t) => (
                                        <tr key={t.mes} className="border-b border-border/40">
                                            <td className="p-2">{t.mes}</td>
                                            <td className="text-right p-2">{formatCurrency(t.valorInicio)}</td>
                                            <td className="text-right p-2">{formatCurrency(t.correcao)}</td>
                                            <td className="text-right p-2">{formatCurrency(t.juros)}</td>
                                            <td className="text-right p-2 font-medium">
                                                {formatCurrency(t.valorFinal)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {isDosimetria && penaFinalDias == null && (
                <Card>
                    <CardContent className="pt-6 space-y-4">
                        <p className="text-sm text-muted-foreground">{modulo.description}</p>
                        <div className="grid gap-4 sm:grid-cols-3">
                            <div className="space-y-2">
                                <Label>Pena-base (anos)</Label>
                                <Input
                                    type="number"
                                    min={0}
                                    value={penaBaseAnos}
                                    onChange={(e) => setPenaBaseAnos(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Pena-base (meses)</Label>
                                <Input
                                    type="number"
                                    min={0}
                                    value={penaBaseMeses}
                                    onChange={(e) => setPenaBaseMeses(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Pena-base (dias)</Label>
                                <Input
                                    type="number"
                                    min={0}
                                    value={penaBaseDias}
                                    onChange={(e) => setPenaBaseDias(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="space-y-2">
                                <Label>Agravantes (%)</Label>
                                <Input
                                    type="number"
                                    value={agravantesPerc}
                                    onChange={(e) => setAgravantesPerc(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Atenuantes (%)</Label>
                                <Input
                                    type="number"
                                    value={atenuantesPerc}
                                    onChange={(e) => setAtenuantesPerc(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Causas de aumento (%)</Label>
                                <Input
                                    type="number"
                                    value={majorantesPerc}
                                    onChange={(e) => setMajorantesPerc(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Causas de diminuição (%)</Label>
                                <Input
                                    type="number"
                                    value={minorantesPerc}
                                    onChange={(e) => setMinorantesPerc(e.target.value)}
                                />
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Modelo simplificado: aplica percentuais de agravantes/atenuantes sobre a pena-base e, em
                            seguida, as causas de aumento/diminuição. Valide sempre com a legislação e a jurisprudência
                            aplicáveis ao caso concreto.
                        </p>
                    </CardContent>
                </Card>
            )}

            {isDosimetria && penaFinalFormatada && (
                <Card>
                    <CardHeader>
                        <CardTitle>Resultado da dosimetria (simplificada)</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <p className="text-sm">
                            Pena final:{" "}
                            <strong>
                                {penaFinalFormatada.anos} ano(s), {penaFinalFormatada.meses} mês(es) e{" "}
                                {penaFinalFormatada.dias} dia(s)
                            </strong>
                            .
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Este cálculo segue um modelo aritmético simplificado em três fases. Use como apoio inicial e
                            sempre confronte com a sentença/decisão específica.
                        </p>
                    </CardContent>
                </Card>
            )}

            {isProgressao && diasMinimosProgressao == null && (
                <Card>
                    <CardContent className="pt-6 space-y-4">
                        <p className="text-sm text-muted-foreground">{modulo.description}</p>
                        <div className="grid gap-4 sm:grid-cols-3">
                            <div className="space-y-2">
                                <Label>Tempo total de pena (anos)</Label>
                                <Input
                                    type="number"
                                    min={0}
                                    value={penaTotalAnos}
                                    onChange={(e) => setPenaTotalAnos(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Tempo total de pena (meses)</Label>
                                <Input
                                    type="number"
                                    min={0}
                                    value={penaTotalMeses}
                                    onChange={(e) => setPenaTotalMeses(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Tempo total de pena (dias)</Label>
                                <Input
                                    type="number"
                                    min={0}
                                    value={penaTotalDias}
                                    onChange={(e) => setPenaTotalDias(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-3">
                            <div className="space-y-2">
                                <Label>Tipo de crime</Label>
                                <select
                                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={tipoCrime}
                                    onChange={(e) => setTipoCrime(e.target.value as "comum" | "hediondo")}
                                >
                                    <option value="comum">Comum</option>
                                    <option value="hediondo">Hediondo ou equiparado</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label>Reincidência</Label>
                                <select
                                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={reincidente}
                                    onChange={(e) => setReincidente(e.target.value as "nao" | "sim")}
                                >
                                    <option value="nao">Primário</option>
                                    <option value="sim">Reincidente</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label>Data de início do cumprimento</Label>
                                <Input
                                    type="date"
                                    value={dataInicioPena}
                                    onChange={(e) => setDataInicioPena(e.target.value)}
                                />
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Frações utilizadas: 1/6 para crime comum; 2/5 para crime hediondo primário; 3/5 para crime
                            hediondo com reincidência. Não considera remição nem outras causas de diminuição de pena.
                        </p>
                    </CardContent>
                </Card>
            )}

            {isProgressao && diasMinimosFormatado && (
                <Card>
                    <CardHeader>
                        <CardTitle>Resultado da progressão (simplificada)</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <p className="text-sm">
                            Tempo mínimo para progressão:{" "}
                            <strong>
                                {diasMinimosFormatado.anos} ano(s), {diasMinimosFormatado.meses} mês(es) e{" "}
                                {diasMinimosFormatado.dias} dia(s)
                            </strong>
                            .
                        </p>
                        {dataElegibilidade && (
                            <p className="text-sm">
                                Data provável (sem remição):{" "}
                                <strong>
                                    {new Date(dataElegibilidade).toLocaleDateString("pt-BR", {
                                        timeZone: "UTC",
                                    })}
                                </strong>
                                .
                            </p>
                        )}
                        {!dataElegibilidade && (
                            <p className="text-xs text-muted-foreground">
                                Informe a data de início do cumprimento da pena para calcular a data provável.
                            </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                            Este cálculo é um apoio inicial com base nas frações legais usuais. Sempre confira com a
                            legislação atualizada e decisões específicas do caso.
                        </p>
                    </CardContent>
                </Card>
            )}

            {loadingMonetario && isMonetary && !resultadoMonetario && (
                <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
            )}
        </CalculatorLayout>
    );
};

export default OutrasCalculadoras;
