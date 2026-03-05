import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
    Calculator,
    ChevronRight,
    FileText,
    Scale,
    Building2,
    Wallet,
    CreditCard,
    Home,
    Heart,
    Users,
    Briefcase,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const MODULOS = [
    {
        slug: "correcao",
        titulo: "Correção de Valores",
        descricao:
            "Atualização monetária (IPCA, INPC, IGP-M, SELIC, TR) e juros. Linha do tempo mês a mês e memória detalhada.",
        categoria: "Generalista",
        href: "/calculadora/correcao",
        icon: Calculator,
        status: "Disponível",
    },
    {
        slug: "trabalhista",
        titulo: "Trabalhista",
        descricao:
            "Verbas rescisórias, horas extras, FGTS + multa 40%, DSR, insalubridade, periculosidade, liquidação de sentença.",
        categoria: "Trabalhista",
        href: "/calculadora/trabalhista",
        icon: Briefcase,
        status: "Disponível",
    },
    {
        slug: "fgts",
        titulo: "Correção do FGTS",
        descricao:
            "Importe o extrato em PDF, configure índice (INPC) e juros. Detalhamento das contribuições e resultado.",
        categoria: "Bancário",
        href: "/calculadora/fgts",
        icon: Building2,
        status: "Disponível",
    },
    {
        slug: "pasep",
        titulo: "PASEP",
        descricao: "Revisão de saldo, índices corretos, comparativo saldo correto x pago, diferença acumulada.",
        categoria: "Bancário",
        href: "/calculadora/pasep",
        icon: Building2,
        status: "Disponível",
    },
    {
        slug: "rmc-rcc",
        titulo: "RMC e RCC (Cartão Consignado)",
        descricao: "Desconto indevido, valores cobrados, repetição de indébito, devolução simples ou em dobro.",
        categoria: "Bancário",
        href: "/calculadora/rmc-rcc",
        icon: CreditCard,
        status: "Disponível",
    },
    {
        slug: "superendividamento",
        titulo: "Superendividamento",
        descricao: "Consolidação de dívidas, limite legal de comprometimento, plano judicial, juros abusivos.",
        categoria: "Consumidor",
        href: "/calculadora/superendividamento",
        icon: Wallet,
        status: "Disponível",
    },
    {
        slug: "revisional",
        titulo: "Revisional Bancário",
        descricao: "Tabela Price, SAC, taxa BACEN, recálculo, anatocismo, cálculo de indébito.",
        categoria: "Bancário",
        href: "/calculadora/revisional",
        icon: Building2,
        status: "Disponível",
    },
    {
        slug: "dosimetria",
        titulo: "Dosimetria da Pena",
        descricao: "Pena-base, agravantes/atenuantes, causas de aumento/diminuição, regime inicial.",
        categoria: "Penal",
        href: "/calculadora/dosimetria",
        icon: Scale,
        status: "Disponível",
    },
    {
        slug: "progressao",
        titulo: "Progressão de Regime",
        descricao: "Fração cumprida, data provável de progressão, remição, crime hediondo ou comum.",
        categoria: "Penal",
        href: "/calculadora/progressao",
        icon: Scale,
        status: "Disponível",
    },
    {
        slug: "aluguel",
        titulo: "Aluguel",
        descricao: "Correção IGP-M/IPCA, multa por rescisão antecipada, reajuste anual, débito locatício.",
        categoria: "Imobiliário",
        href: "/calculadora/aluguel",
        icon: Home,
        status: "Disponível",
    },
    {
        slug: "pensao",
        titulo: "Pensão",
        descricao: "Percentual sobre salário ou salário mínimo, correção automática, atrasados.",
        categoria: "Familiar",
        href: "/calculadora/pensao",
        icon: Heart,
        status: "Disponível",
    },
    {
        slug: "inss",
        titulo: "INSS",
        descricao: "Aposentadoria, tempo de contribuição, regra de transição, RMI, revisão da vida toda.",
        categoria: "Bancário",
        href: "/calculadora/inss",
        icon: Building2,
        status: "Disponível",
    },
    {
        slug: "divorcio",
        titulo: "Divórcio",
        descricao: "Partilha de bens por regime (comunhão parcial/universal, separação total), meação, compensações.",
        categoria: "Familiar",
        href: "/calculadora/divorcio",
        icon: Users,
        status: "Disponível",
    },
];

const CATEGORIA_COLOR: Record<string, string> = {
    Generalista: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400",
    Trabalhista: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    Bancário: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    Consumidor: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
    Penal: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    Imobiliário: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    Familiar: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
};

const Calculadora = () => {
    return (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">Calculadoras</h1>
                    <p className="text-muted-foreground text-sm sm:text-base mt-1">
                        Central de cálculos jurídicos: correção monetária, FGTS, trabalhista, divórcio, INSS,
                        dosimetria, progressão de regime, aluguel, pensão, superendividamento e mais. Resultados com
                        memória detalhada para anexar ao processo.
                    </p>
                </div>
                <Button variant="default" className="shrink-0" asChild>
                    <Link to="/calculadora/meus-calculos">Meus Cálculos</Link>
                </Button>
            </div>

            <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {MODULOS.map((mod) => {
                    const Icon = mod.icon;
                    const disponivel = mod.status === "Disponível";
                    const content = (
                        <Card
                            className={`h-full transition-all hover:shadow-sm ${!disponivel ? "opacity-80" : "hover:border-primary/30"}`}
                        >
                            <CardContent className="p-3 sm:p-4 flex flex-col h-full">
                                <div className="flex items-start justify-between gap-2 mb-1.5">
                                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                        <Icon className="h-4 w-4" />
                                    </div>
                                    <Badge variant={disponivel ? "default" : "secondary"} className="text-xs">
                                        {mod.status}
                                    </Badge>
                                </div>
                                <h2 className="font-semibold text-sm text-foreground mb-1">{mod.titulo}</h2>
                                <p className="text-xs text-muted-foreground flex-1 line-clamp-2 mb-2">
                                    {mod.descricao}
                                </p>
                                <div className="flex items-center justify-between">
                                    <span
                                        className={`text-[11px] font-medium px-2 py-0.5 rounded ${CATEGORIA_COLOR[mod.categoria] || "bg-muted text-muted-foreground"}`}
                                    >
                                        {mod.categoria}
                                    </span>
                                    {disponivel ? (
                                        <Button size="sm" variant="ghost" asChild className="shrink-0 h-8 px-2 text-xs">
                                            <Link to={mod.href}>
                                                Realizar cálculo
                                                <ChevronRight className="h-3 w-3 ml-1" />
                                            </Link>
                                        </Button>
                                    ) : (
                                        <span className="text-[11px] text-muted-foreground">Em breve</span>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    );
                    return <div key={mod.slug}>{content}</div>;
                })}
            </div>
        </motion.div>
    );
};

export default Calculadora;
