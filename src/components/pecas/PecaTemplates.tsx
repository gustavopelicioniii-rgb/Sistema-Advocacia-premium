import {
    FileText,
    Scale,
    ShieldAlert,
    Gavel,
    Handshake,
    FileCheck,
    ClipboardList,
    type LucideIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export interface PecaTemplate {
    id: string;
    titulo: string;
    descricao: string;
    icon: LucideIcon;
    categoria: string;
    promptBase: string;
}

// eslint-disable-next-line react-refresh/only-export-components
export const pecaTemplates: PecaTemplate[] = [
    {
        id: "peticao-inicial",
        titulo: "Petição Inicial",
        descricao: "Estrutura completa com fatos, fundamentos e pedidos.",
        icon: FileText,
        categoria: "Cível",
        promptBase:
            "Gere uma petição inicial profissional para o seguinte caso jurídico. Inclua endereçamento, qualificação das partes, fatos, fundamentos jurídicos (doutrina e jurisprudência) e pedidos detalhados.",
    },
    {
        id: "contestacao",
        titulo: "Contestação",
        descricao: "Defesa técnica com preliminares e mérito.",
        icon: ShieldAlert,
        categoria: "Cível",
        promptBase:
            "Gere uma contestação jurídica refutando os termos da inicial. Foque em preliminares de mérito, prescrição, decadência e negação dos fatos alegados.",
    },
    {
        id: "recurso-apelacao",
        titulo: "Recurso de Apelação",
        descricao: "Contestação de sentença de primeira instância.",
        icon: Gavel,
        categoria: "Cível",
        promptBase:
            "Gere um recurso de apelação atacando os fundamentos da sentença recorrida. Destaque erros in procedendo e in iudicando.",
    },
    {
        id: "contrato-honorarios",
        titulo: "Contrato de Honorários",
        descricao: "Modelo padrão da OAB com cláusulas de êxito.",
        icon: Handshake,
        categoria: "Administrativo",
        promptBase:
            "Gere um contrato de prestação de serviços advocatícios e honorários profissionais seguindo as normas da OAB. Inclua cláusulas de objeto, valor, parcelas e quota litis (êxito).",
    },
    {
        id: "procuracao",
        titulo: "Procuração Ad Judicia",
        descricao: "Poderes gerais e específicos para o foro.",
        icon: FileCheck,
        categoria: "Administrativo",
        promptBase:
            "Gere uma procuração ad judicia et extra. Inclua poderes gerais para o foro e poderes específicos como transigir, desistir e receber quitação.",
    },
    {
        id: "parecer-juridico",
        titulo: "Parecer Jurídico",
        descricao: "Análise técnica sobre consulta específica.",
        icon: ClipboardList,
        categoria: "Consultivo",
        promptBase:
            "Gere um parecer jurídico técnico e fundamentado sobre a consulta apresentada. Estruture em: Ementa, Relatório, Fundamentação e Conclusão (Respostas aos quesitos).",
    },
];

const PecaTemplates = ({ onSelect }: { onSelect: (template: PecaTemplate) => void }) => {
    return (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pecaTemplates.map((template) => (
                <Card
                    key={template.id}
                    className="cursor-pointer hover:border-primary/50 transition-all hover:shadow-md group"
                    onClick={() => onSelect(template)}
                >
                    <CardContent className="p-5">
                        <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                <template.icon className="h-6 w-6" />
                            </div>
                            <div>
                                <h3 className="font-bold text-foreground">{template.titulo}</h3>
                                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                    {template.descricao}
                                </p>
                                <div className="mt-3">
                                    <span className="text-[10px] font-bold uppercase tracking-wider bg-secondary px-2 py-0.5 rounded text-muted-foreground">
                                        {template.categoria}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
};

export default PecaTemplates;
