import { useState } from "react";
import { Upload } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import CalculatorLayout from "@/components/calculadora/CalculatorLayout";

const INDICES = ["INPC", "IPCA", "IGP-M", "SELIC", "TR"];
const TESES = [{ value: "jam", label: "JAM (Realiza a correção monetária do JAM)" }];
const JUROS_OPCOES = ["3% a.a.", "0% a.a.", "Outro"];

const CorrecaoFGTS = () => {
    const [nomeCalculo, setNomeCalculo] = useState("");
    const [cliente, setCliente] = useState("");
    const [indice, setIndice] = useState("INPC");
    const [nomeAutor, setNomeAutor] = useState("");
    const [dataCalculo, setDataCalculo] = useState("01/03/2026");
    const [importarAte2013, setImportarAte2013] = useState(false);
    const [tese, setTese] = useState("jam");
    const [juros, setJuros] = useState("3% a.a.");
    const [resultado, setResultado] = useState(false);

    const STEPS = [
        { step: 1, label: "Dados do cálculo" },
        { step: 2, label: "Resultado" },
    ];
    const activeStep = resultado ? 2 : 1;

    return (
        <CalculatorLayout
            title="Correção do FGTS"
            steps={STEPS}
            activeStep={activeStep}
            helpHref="#"
            primaryButton={
                resultado
                    ? { label: "Novo Cálculo", onClick: () => setResultado(false) }
                    : { label: "CALCULAR", onClick: () => setResultado(true) }
            }
        >
            {!resultado ? (
                <div className="space-y-6">
                    <Card>
                        <CardContent className="pt-6 space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Nome do cálculo</Label>
                                    <Input
                                        placeholder="Digite um nome para identificar o cálculo"
                                        value={nomeCalculo}
                                        onChange={(e) => setNomeCalculo(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Cliente *</Label>
                                    <select
                                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        value={cliente}
                                        onChange={(e) => setCliente(e.target.value)}
                                    >
                                        <option value="">Selecione...</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Índice para corrigir os valores (recomendado INPC) *</Label>
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
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Nome do autor da ação</Label>
                                    <Input
                                        placeholder="Nome do autor"
                                        value={nomeAutor}
                                        onChange={(e) => setNomeAutor(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Data do cálculo *</Label>
                                    <Input
                                        placeholder="dd/mm/aaaa"
                                        value={dataCalculo}
                                        onChange={(e) => setDataCalculo(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="ate2013"
                                    checked={importarAte2013}
                                    onChange={(e) => setImportarAte2013(e.target.checked)}
                                    className="h-4 w-4 rounded border-input"
                                />
                                <Label htmlFor="ate2013" className="text-sm font-normal">
                                    Importar dados apenas até 2013
                                </Label>
                            </div>
                            <div className="space-y-2">
                                <Label>Tese de cálculo</Label>
                                <select
                                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={tese}
                                    onChange={(e) => setTese(e.target.value)}
                                >
                                    {TESES.map((t) => (
                                        <option key={t.value} value={t.value}>
                                            {t.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label>Juros da conta *</Label>
                                <select
                                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    value={juros}
                                    onChange={(e) => setJuros(e.target.value)}
                                >
                                    {JUROS_OPCOES.map((j) => (
                                        <option key={j} value={j}>
                                            {j}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-muted-foreground">
                                    Verifique no extrato do FGTS a taxa de juros da conta. Dica: O mais comum é 3% a.a.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-2 border-dashed border-primary/30 bg-primary/5">
                        <CardContent className="py-12 flex flex-col items-center justify-center text-center">
                            <Upload className="h-12 w-12 text-primary mb-3" />
                            <p className="font-medium text-foreground">
                                Clique aqui para escolher ou Arraste o arquivo
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">arquivo em PDF</p>
                        </CardContent>
                    </Card>
                </div>
            ) : (
                <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                        Resultado do cálculo (em breve).
                    </CardContent>
                </Card>
            )}
        </CalculatorLayout>
    );
};

export default CorrecaoFGTS;
