import {
    FileText,
    Loader2,
    Sparkles,
    Save,
    Copy,
    Trash2,
    Clock,
    ChevronDown,
    Settings2,
    Brain,
    Wand2,
    ChevronLeft,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { usePecas, useSavePeca, useDeletePeca, generateWithGemini } from "@/hooks/usePecas";
import { useProcessos } from "@/hooks/useProcessos";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import PecaTemplates, { type PecaTemplate, pecaTemplates } from "@/components/pecas/PecaTemplates";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";

const Pecas = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const { data: pecas, isLoading: isLoadingPecas } = usePecas();
    const { data: processos } = useProcessos();
    const saveMutation = useSavePeca();
    const deleteMutation = useDeletePeca();

    // Form state
    const [selectedTemplate, setSelectedTemplate] = useState<PecaTemplate | null>(null);
    const [selectedProcessId, setSelectedProcessId] = useState<string>("");
    const [tipo, setTipo] = useState("Petição Inicial");
    const [processNumber, setProcessNumber] = useState("");
    const [context, setContext] = useState("");
    const [title, setTitle] = useState("");
    const [generatedText, setGeneratedText] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [apiKey, setApiKey] = useState(() => localStorage.getItem("gemini_api_key") || "");
    const [showSettings, setShowSettings] = useState(false);
    const [historyOpen, setHistoryOpen] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

    const saveApiKey = (key: string) => {
        setApiKey(key);
        localStorage.setItem("gemini_api_key", key);
    };

    const handleSelectTemplate = (template: PecaTemplate) => {
        setSelectedTemplate(template);
        setTipo(template.titulo);
    };

    const handleBackToTemplates = () => {
        setSelectedTemplate(null);
        setGeneratedText("");
    };

    const selectedProcess = processos?.find((p) => p.id === selectedProcessId);

    const handleGenerate = async () => {
        if (!apiKey) {
            toast({
                title: "Chave de API necessária",
                description: "Configure sua chave da API Gemini nas configurações.",
                variant: "destructive",
            });
            setShowSettings(true);
            return;
        }
        if (!context.trim()) {
            toast({
                title: "Contexto necessário",
                description: "Descreva o caso e os detalhes para gerar a peça.",
                variant: "destructive",
            });
            return;
        }

        setIsGenerating(true);
        try {
            let finalContext = context;
            if (selectedProcess) {
                finalContext = `
DADOS DO PROCESSO:
Processo nº: ${selectedProcess.number}
Cliente: ${selectedProcess.client}
Tribunal: ${selectedProcess.court}
Polo Ativo: ${selectedProcess.active_party || selectedProcess.client}
Polo Passivo: ${selectedProcess.passive_party}
---
FATOS E CONTEXTO ADICIONAL:
${context}`;
            }

            const prompt = `Você é um advogado brasileiro sênior especializado.
${selectedTemplate ? selectedTemplate.promptBase : `Gere uma peça jurídica do tipo: "${tipo}".`}

CONTEXTO DO CASO:
${finalContext}

INSTRUÇÕES:
1. Gere a peça completa, pronta para uso, em formato profissional.
2. Use a linguagem jurídica formal do direito brasileiro.
3. Inclua todos os elementos obrigatórios deste tipo de peça (partes, fatos, fundamentos, pedidos etc).
4. Use artigos de lei quando aplicável (CF, CPC, CC, CP, CLT etc).
5. NÃO inclua instruções ou comentários — apenas o texto final da peça.`;

            const result = await generateWithGemini(apiKey, prompt);
            setGeneratedText(result);
            setTitle(`${tipo} — ${new Date().toLocaleDateString("pt-BR")}`);
            toast({ title: "Peça gerada com sucesso!" });
        } catch (e) {
            toast({
                title: "Erro ao gerar",
                description: e instanceof Error ? e.message : "Erro desconhecido",
                variant: "destructive",
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSave = async () => {
        if (!generatedText) return;
        await saveMutation.mutateAsync({
            title: title || `${tipo} — ${new Date().toLocaleDateString("pt-BR")}`,
            tipo,
            context,
            generated_text: generatedText,
            process_number: selectedProcess?.number || processNumber,
            owner_id: user?.id ?? null,
        });
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(generatedText);
        toast({ title: "Copiado para a área de transferência!" });
    };

    const loadPeca = (peca: {
        title: string;
        tipo: string;
        context: string;
        generated_text: string;
        process_number: string;
    }) => {
        setTitle(peca.title);
        setTipo(peca.tipo);
        setContext(peca.context);
        setGeneratedText(peca.generated_text);
        setProcessNumber(peca.process_number);
        setHistoryOpen(false);
        // Tenta encontrar o template correspondente ou define um genérico
        const template = pecaTemplates.find((t) => t.titulo === peca.tipo);
        if (template) setSelectedTemplate(template);
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    {selectedTemplate && (
                        <Button variant="ghost" size="icon" onClick={handleBackToTemplates}>
                            <ChevronLeft className="h-5 w-5" />
                        </Button>
                    )}
                    <div>
                        <h1 className="font-display text-3xl font-bold text-foreground">Gerador de Peças (IA)</h1>
                        <p className="mt-1 text-muted-foreground">
                            {selectedTemplate
                                ? `Redigindo: ${selectedTemplate.titulo}`
                                : "Selecione um modelo para começar a peticionar com IA."}
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setShowSettings(!showSettings)}>
                        <Settings2 className="mr-2 h-4 w-4" />
                        API
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setHistoryOpen(!historyOpen)}>
                        <Clock className="mr-2 h-4 w-4" />
                        Peças Salvas
                    </Button>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {!selectedTemplate ? (
                    <motion.div
                        key="templates"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                    >
                        <PecaTemplates onSelect={handleSelectTemplate} />
                    </motion.div>
                ) : (
                    <motion.div
                        key="generator"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="grid gap-6 lg:grid-cols-2"
                    >
                        {/* Left: Input */}
                        <div className="space-y-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="font-display text-lg flex items-center gap-2">
                                        <Sparkles className="h-5 w-5 text-accent" />
                                        Configurar Peça
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Vincular a Processo (Opcional)</Label>
                                        <Select value={selectedProcessId} onValueChange={setSelectedProcessId}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecione um processo cadastrado..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {processos?.map((p) => (
                                                    <SelectItem key={p.id} value={p.id}>
                                                        {p.number} — {p.client}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="context">Fatos e Contexto do Caso *</Label>
                                        <Textarea
                                            id="context"
                                            placeholder="Descreva detalhadamente o caso..."
                                            value={context}
                                            onChange={(e) => setContext(e.target.value)}
                                            className="min-h-[300px] resize-none p-4"
                                        />
                                    </div>
                                    <Button
                                        className="w-full"
                                        size="lg"
                                        onClick={handleGenerate}
                                        disabled={isGenerating}
                                    >
                                        {isGenerating ? (
                                            <>
                                                <Loader2 className="mr-2 h-5 w-5 animate-spin" />A IA está redigindo...
                                            </>
                                        ) : (
                                            <>
                                                <Wand2 className="mr-2 h-5 w-5" />
                                                Gerar Peça Completa
                                            </>
                                        )}
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right: Output */}
                        <div className="space-y-4">
                            <Card className="min-h-[500px] flex flex-col">
                                <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
                                    <CardTitle className="font-display text-lg flex items-center gap-2">
                                        <FileText className="h-5 w-5 text-primary" />
                                        Rascunho da Peça
                                    </CardTitle>
                                    {generatedText && (
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm" onClick={handleCopy}>
                                                <Copy className="mr-2 h-3.5 w-3.5" />
                                                Copiar
                                            </Button>
                                            <Button
                                                variant="default"
                                                size="sm"
                                                onClick={handleSave}
                                                disabled={saveMutation.isPending}
                                            >
                                                <Save className="mr-2 h-3.5 w-3.5" />
                                                Salvar
                                            </Button>
                                        </div>
                                    )}
                                </CardHeader>
                                <CardContent className="flex-1 p-0">
                                    {isGenerating ? (
                                        <div className="flex flex-col items-center justify-center h-full py-20 text-center">
                                            <Loader2 className="h-10 w-10 animate-spin text-accent" />
                                            <p className="mt-4 text-sm font-medium">
                                                A IA está processando sua petição...
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                Consultando bases jurídicas e estruturando fatos.
                                            </p>
                                        </div>
                                    ) : generatedText ? (
                                        <div className="flex flex-col h-full">
                                            <Textarea
                                                className="flex-1 min-h-[450px] font-serif text-base leading-relaxed border-none focus-visible:ring-0 p-8 whitespace-pre-wrap"
                                                value={generatedText}
                                                onChange={(e) => setGeneratedText(e.target.value)}
                                            />
                                            {/* AI Copilot Panel */}
                                            <div className="p-4 bg-muted/50 border-t space-y-3">
                                                <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                                                    <Brain className="h-3 w-3" /> Assistência Jurídica IA
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="bg-background text-[10px] h-7 px-2"
                                                    >
                                                        💎 Refinar fundamentos
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="bg-background text-[10px] h-7 px-2"
                                                    >
                                                        ⚖️ Adicionar jurisprudência
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="bg-background text-[10px] h-7 px-2"
                                                    >
                                                        🔍 Revisão técnica
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="bg-background text-[10px] h-7 px-2"
                                                    >
                                                        📝 Resumir peça
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full py-20 text-center text-muted-foreground opacity-40">
                                            <Sparkles className="h-16 w-16 mb-4" />
                                            <p className="text-sm font-medium">Pronto para gerar sua peça.</p>
                                            <p className="text-xs mt-1">
                                                Insira o contexto ao lado e deixe a IA cuidar da redação.
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* History (bottom) */}
            <Collapsible open={historyOpen} onOpenChange={setHistoryOpen}>
                <CollapsibleContent>
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-display text-lg flex items-center gap-2">
                                <Clock className="h-5 w-5 text-muted-foreground" />
                                Peças Salvas
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {isLoadingPecas ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : (pecas ?? []).length === 0 ? (
                                <div className="text-center py-10 border-2 border-dashed rounded-lg">
                                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-20" />
                                    <p className="text-sm text-muted-foreground">Nenhuma peça salva ainda.</p>
                                </div>
                            ) : (
                                (pecas ?? []).map((p) => (
                                    <div
                                        key={p.id}
                                        className="flex items-center gap-3 rounded-lg border border-border p-3 hover:bg-muted/50 transition-all cursor-pointer group"
                                        onClick={() => loadPeca(p)}
                                    >
                                        <div className="flex h-10 w-10 items-center justify-center rounded bg-primary/5 text-primary">
                                            <FileText className="h-5 w-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold truncate">{p.title}</p>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-tight">
                                                {p.tipo} {p.process_number && `• Nº ${p.process_number}`} •{" "}
                                                {format(new Date(p.created_at), "dd/MM/yyyy", { locale: ptBR })}
                                            </p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 opacity-0 group-hover:opacity-100 text-destructive"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setDeleteTarget(p.id);
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </CollapsibleContent>
            </Collapsible>

            <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Peça</AlertDialogTitle>
                        <AlertDialogDescription>Tem certeza? Esta ação não pode ser desfeita.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={async () => {
                                if (deleteTarget) {
                                    await deleteMutation.mutateAsync(deleteTarget);
                                    setDeleteTarget(null);
                                }
                            }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </motion.div>
    );
};

export default Pecas;
