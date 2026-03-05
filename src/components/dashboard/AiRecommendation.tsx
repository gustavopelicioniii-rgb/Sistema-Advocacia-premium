import { useMemo } from "react";
import { Brain, Lightbulb, TrendingUp, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useFees } from "@/hooks/useFees";
import { useProcessos } from "@/hooks/useProcessos";
import { useCrmClients, useCrmStages } from "@/hooks/useCrm";
import { useNavigate } from "react-router-dom";

const typeStyles = {
    opportunity: "glass border-emerald-500/10 hover:border-emerald-500/30",
    risk: "glass border-amber-500/10 hover:border-amber-500/30",
    insight: "glass border-blue-500/10 hover:border-blue-500/30",
};

const iconColors = {
    opportunity: "text-emerald-500",
    risk: "text-amber-500",
    insight: "text-blue-500",
};

const formatCurrency = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

interface Rec {
    icon: React.ElementType;
    title: string;
    text: string;
    type: "opportunity" | "risk" | "insight";
    path: string;
}

const AiRecommendation = () => {
    const navigate = useNavigate();
    const { data: fees } = useFees();
    const { data: processos } = useProcessos();
    const { data: crmClients } = useCrmClients();
    const { data: stages } = useCrmStages();

    const recommendations = useMemo(() => {
        const list: Rec[] = [];
        const now = new Date();

        const atrasados = (fees ?? []).filter((f) => f.status === "Atrasado");
        const allClients = [...new Set((fees ?? []).map((f) => f.client).filter(Boolean))];
        const clientesInadimplentes = [...new Set(atrasados.map((f) => f.client).filter(Boolean))];
        if (allClients.length > 0 && clientesInadimplentes.length > 0) {
            const pct = Math.round((clientesInadimplentes.length / allClients.length) * 100);
            list.push({
                icon: AlertTriangle,
                title: "Inadimplência",
                text: `${pct}% dos seus clientes com honorários estão em atraso (${clientesInadimplentes.length} de ${allClients.length}). Sugestão: automatizar cobrança recorrente.`,
                type: "risk",
                path: "/financeiro",
            });
        }

        const semMovimento = (processos ?? []).filter((p) => {
            if (p.status !== "Em andamento") return false;
            const up = new Date(p.updated_at);
            const diff = (now.getTime() - up.getTime()) / (1000 * 60 * 60 * 24);
            return diff > 30;
        });
        if (semMovimento.length > 0) {
            list.push({
                icon: Lightbulb,
                title: "Processos parados",
                text: `${semMovimento.length} processo(s) sem movimentação há mais de 30 dias. Verifique se há pendências ou oportunidades de acordo.`,
                type: "insight",
                path: "/processos",
            });
        }

        const totalPendente = (fees ?? [])
            .filter((f) => f.status === "Pendente" || f.status === "Atrasado")
            .reduce((s, f) => s + Number(f.value), 0);
        if (totalPendente > 0) {
            list.push({
                icon: TrendingUp,
                title: "Receita a receber",
                text: `Você tem ${formatCurrency(totalPendente)} em honorários pendentes ou em atraso. Acompanhe no módulo Financeiro e envie cobranças.`,
                type: "opportunity",
                path: "/financeiro",
            });
        }

        const lastStageId = stages?.length ? stages[stages.length - 1]?.id : null;
        const converted = lastStageId ? (crmClients?.filter((c) => c.stage_id === lastStageId).length ?? 0) : 0;
        const totalCrm = crmClients?.length ?? 0;
        if (totalCrm > 0 && converted < totalCrm) {
            const pct = Math.round((converted / totalCrm) * 100);
            list.push({
                icon: TrendingUp,
                title: "Pipeline CRM",
                text: `${pct}% dos clientes (${converted} de ${totalCrm}) estão na última etapa do pipeline. Invista em conversão dos demais.`,
                type: "opportunity",
                path: "/crm",
            });
        }

        if (list.length === 0) {
            list.push({
                icon: Brain,
                title: "Tudo em ordem",
                text: "Não há recomendações críticas no momento. Continue cadastrando processos, honorários e clientes para receber insights personalizados.",
                type: "insight",
                path: "/processos",
            });
        }

        return list;
    }, [fees, processos, crmClients, stages]);

    return (
        <Card className="glass-card border-none shadow-none">
            <CardHeader className="pb-3 border-b border-black/[0.03]">
                <CardTitle className="text-xl flex items-center gap-2 text-[#001D4A]">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/5">
                        <Brain className="h-4 w-4 text-primary" />
                    </div>
                    <span>Recomendação Estratégica da IA</span>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-5">
                {recommendations.map((rec, i) => (
                    <div
                        key={`rec-${i}`}
                        className={`rounded-2xl p-4 transition-all hover:scale-[1.01] cursor-pointer shadow-none ${typeStyles[rec.type]}`}
                        onClick={() => navigate(rec.path)}
                    >
                        <div className="flex items-start gap-3">
                            <div className={`mt-0.5 h-8 w-8 rounded-full flex items-center justify-center bg-white/50`}>
                                <rec.icon className={`h-4 w-4 shrink-0 ${iconColors[rec.type]}`} />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-bold text-[#001D4A]">
                                    <span>{rec.title}</span>
                                </p>
                                <p className="text-xs mt-1 text-foreground/70 font-medium leading-relaxed">
                                    <span>{rec.text}</span>
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
                <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-2 text-[#001D4A]/60 hover:text-primary hover:bg-white/40 gap-2 border border-black/[0.03] rounded-xl font-bold py-5"
                    onClick={() => navigate("/processos")}
                >
                    <Brain className="h-4 w-4" />
                    <span>Ver mais recomendações</span>
                </Button>
            </CardContent>
        </Card>
    );
};

export default AiRecommendation;
