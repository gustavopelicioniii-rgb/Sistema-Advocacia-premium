import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CalculatorLayout from "@/components/calculadora/CalculatorLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import type { CorrecaoValoresResult, CorrecaoValoresParametros } from "@/types/calculadora";

const INDICES = ["IPCA", "INPC", "IGP-M", "SELIC", "TR"] as const;
const TIPOS_JUROS = [
  { value: "simples", label: "Juros simples" },
  { value: "compostos", label: "Juros compostos" },
  { value: "1%_ao_mes", label: "1% ao mês" },
  { value: "selic_acumulada", label: "SELIC acumulada" },
  { value: "legais", label: "Juros legais" },
] as const;

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

/** Hash SHA-256 em hex do payload para hash_integridade (auditoria). */
async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const CorrecaoValores = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [nomeCalculo, setNomeCalculo] = useState("");
  const [cliente, setCliente] = useState("");
  const [valorInicial, setValorInicial] = useState("");
  const [dataInicial, setDataInicial] = useState("");
  const [dataFinal, setDataFinal] = useState("");
  const [indice, setIndice] = useState<string>("IPCA");
  const [tipoJuros, setTipoJuros] = useState<string>("1%_ao_mes");
  const [percentualMensal, setPercentualMensal] = useState("");
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<CorrecaoValoresResult | null>(null);

  const STEPS = [{ step: 1, label: "Dados do cálculo" }, { step: 2, label: "Resultado" }];
  const activeStep = resultado ? 2 : 1;

  // Preencher formulário quando vier de Meus Cálculos (state com parametros)
  useEffect(() => {
    const state = location.state as { parametros?: CorrecaoValoresParametros } | null;
    const p = state?.parametros;
    if (!p) return;
    setValorInicial(String(p.valorInicial));
    setDataInicial(p.dataInicial);
    setDataFinal(p.dataFinal);
    setIndice(p.indice || "IPCA");
    setTipoJuros(p.tipoJuros || "1%_ao_mes");
    setPercentualMensal(p.percentualMensal ?? "");
  }, [location.state]);

  const handleCalcular = async () => {
    const valorStr = valorInicial.replace(/\./g, "").replace(",", ".");
    const valor = parseFloat(valorStr) || 0;
    if (!valor || valor <= 0) {
      toast.error("Informe o valor inicial.");
      return;
    }
    if (!dataInicial || !dataFinal) {
      toast.error("Informe data inicial e data final.");
      return;
    }
    const dIni = dataInicial.includes("/") ? `${dataInicial.slice(6)}-${dataInicial.slice(3, 5)}-${dataInicial.slice(0, 2)}` : dataInicial;
    const dFim = dataFinal.includes("/") ? `${dataFinal.slice(6)}-${dataFinal.slice(3, 5)}-${dataFinal.slice(0, 2)}` : dataFinal;
    if (new Date(dIni) >= new Date(dFim)) {
      toast.error("Data inicial deve ser anterior à data final.");
      return;
    }

    setLoading(true);
    setResultado(null);
    const body = {
      valorInicial: valor,
      dataInicial: dIni,
      dataFinal: dFim,
      indice,
      tipoJuros,
      percentualMensal: percentualMensal ? parseFloat(percentualMensal.replace(",", ".")) : undefined,
    };
    const invokeCalc = async (): Promise<unknown> => {
      const { data, error: fnError } = await supabase.functions.invoke("calculadora-correcao", { body });
      if (fnError) throw new Error(fnError.message ?? "Erro ao chamar a calculadora.");
      return data;
    };
    try {
      await supabase.auth.refreshSession();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token && !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        toast.error("Não foi possível acessar o serviço. Faça login ou verifique VITE_SUPABASE_ANON_KEY.");
        setLoading(false);
        return;
      }
      let data: unknown;
      try {
        data = await invokeCalc();
      } catch (firstErr) {
        const firstMsg = firstErr instanceof Error ? firstErr.message : String(firstErr);
        const isAuthOrNetwork = /401|unauthorized|JWT|failed to fetch|network|CORS/i.test(firstMsg);
        if (isAuthOrNetwork) {
          await supabase.auth.refreshSession();
          data = await invokeCalc();
        } else {
          throw firstErr;
        }
      }
      const resultadoData = (data ?? null) as CorrecaoValoresResult | { error?: string } | null;
      if (!resultadoData || "error" in resultadoData) {
        throw new Error(typeof (resultadoData as { error?: string })?.error === "string"
          ? (resultadoData as { error: string }).error
          : "Resposta vazia ou inválida da calculadora.");
      }
      setResultado(resultadoData as CorrecaoValoresResult);

      const parametros = {
        valorInicial: valor,
        dataInicial: dIni,
        dataFinal: dFim,
        indice,
        tipoJuros,
        percentualMensal: percentualMensal || null,
      };
      const resultadoJson = resultadoData as Record<string, unknown>;
      const payloadIntegridade = JSON.stringify({ parametros, resultado: resultadoJson });
      const hashIntegridade = await sha256Hex(payloadIntegridade);
      const { data: inserted, error: insertErr } = await supabase
        .from("calculos")
        .insert({
          owner_id: user?.id ?? null,
          tipo_calculo: "correcao_valores",
          versao_formula: resultadoData.versao_formula ?? 1,
          parametros_json: parametros,
          resultado_json: resultadoJson,
          hash_integridade: hashIntegridade,
          titulo: `Correção ${indice} - ${formatCurrency(valor)}`,
        })
        .select("id")
        .single();
      if (insertErr) {
        toast.error("Cálculo salvo, mas falha ao registrar: " + insertErr.message);
      } else {
        if (inserted?.id) {
          await supabase.from("calculo_logs").insert({
            calculo_id: inserted.id,
            evento: "criacao",
            detalhes: { source: "correcao_valores", valorFinal: (resultadoData as { valorFinal?: number })?.valorFinal },
          });
        }
        toast.success("Cálculo realizado e salvo.");
      }
      queryClient.invalidateQueries({ queryKey: ["calculos"] });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro ao calcular.";
      const lower = msg.toLowerCase();
      if (/401|unauthorized|JWT/.test(lower)) {
        toast.error("Sessão expirada ou não autorizada. Faça login novamente e tente o cálculo de novo.");
      } else if (/failed to fetch|network|CORS|edge function|relay/i.test(lower)) {
        toast.error(
          "Não foi possível chamar a calculadora. Confira: (1) está logado; (2) VITE_SUPABASE_URL é do mesmo projeto onde a Edge Function foi publicada; (3) no Supabase, Edge Functions → calculadora-correcao está publicada. Detalhe: " + (msg.slice(0, 80) || "erro de rede.")
        );
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleExportar = () => {
    if (!resultado?.timeline?.length) return;
    const headers = ["Mês", "Valor início", "Correção", "Valor pós-correção", "Juros", "Valor final"];
    const rows = resultado.timeline.map((t) =>
      [t.mes, t.valorInicio, t.correcao, t.valorAposCorrecao, t.juros, t.valorFinal].join(";")
    );
    const csv = [headers.join(";"), ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `correcao-${indice}-${dataInicial}-${dataFinal}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Tabela exportada.");
  };

  return (
    <CalculatorLayout
      title="Correção de Valores"
      steps={STEPS}
      activeStep={activeStep}
      helpHref="#"
      primaryButton={
        resultado
          ? { label: "Novo Cálculo", onClick: () => setResultado(null) }
          : {
              label: "CALCULAR",
              onClick: handleCalcular,
              disabled: loading,
              loading,
            }
      }
    >
      {!resultado ? (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nomeCalculo">Nome do cálculo</Label>
                <Input
                  id="nomeCalculo"
                  placeholder="Digite um nome para identificar o cálculo"
                  value={nomeCalculo}
                  onChange={(e) => setNomeCalculo(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cliente">Cliente *</Label>
<Select value={cliente === "" ? " " : cliente} onValueChange={(v) => setCliente(v === " " ? "" : v)}>
                    <SelectTrigger id="cliente">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value=" ">Selecione...</SelectItem>
                    </SelectContent>
                  </Select>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <Label>Índice para corrigir os valores (recomendado INPC) *</Label>
                <Select value={indice} onValueChange={setIndice}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INDICES.map((i) => (
                      <SelectItem key={i} value={i}>{i}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Valor inicial (R$) *</Label>
                <Input
                  placeholder="0,00"
                  value={valorInicial}
                  onChange={(e) => setValorInicial(e.target.value)}
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
                <Input
                  type="date"
                  value={dataFinal}
                  onChange={(e) => setDataFinal(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo de juros *</Label>
                <Select value={tipoJuros} onValueChange={setTipoJuros}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_JUROS.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Percentual mensal (opcional)</Label>
                <Input
                  placeholder="Ex: 1 ou 0,5"
                  value={percentualMensal}
                  onChange={(e) => setPercentualMensal(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Deixe vazio para usar 1% a.m. ou taxa SELIC conforme o tipo de juros.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Resultado</CardTitle>
            <Button variant="outline" size="sm" onClick={handleExportar}>
              <Download className="h-4 w-4 mr-2" /> Exportar tabela
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <p className="text-sm">
                <span className="text-muted-foreground">Valor inicial:</span>{" "}
                <strong>{formatCurrency(Number(resultado?.valorInicial) || 0)}</strong>
              </p>
              <p className="text-sm">
                <span className="text-muted-foreground">Valor final:</span>{" "}
                <strong className="text-primary">{formatCurrency(Number(resultado?.valorFinal) || 0)}</strong>
              </p>
            </div>
            <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
              {resultado?.memoriaDetalhada?.resumo ?? ""}
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
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
                  {(resultado.timeline ?? []).map((t) => (
                    <tr key={t.mes} className="border-b border-border/50">
                      <td className="p-2">{t.mes}</td>
                      <td className="text-right p-2">{formatCurrency(t.valorInicio)}</td>
                      <td className="text-right p-2">{formatCurrency(t.correcao)}</td>
                      <td className="text-right p-2">{formatCurrency(t.juros)}</td>
                      <td className="text-right p-2 font-medium">{formatCurrency(t.valorFinal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </CalculatorLayout>
  );
};

export default CorrecaoValores;
