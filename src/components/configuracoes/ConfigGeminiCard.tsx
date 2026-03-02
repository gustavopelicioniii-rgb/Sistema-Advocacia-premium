import { useState } from "react";
import { Key, Save, Eye, EyeOff, Bot } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
    AI_MODELS,
    DEFAULT_MODEL,
    PROVIDER_LABELS,
    LS_PROVIDER,
    LS_MODEL,
    LS_KEY_GEMINI,
    LS_KEY_ANTHROPIC,
    type AIProvider,
} from "@/lib/aiProviders";

const PROVIDER_API_LINKS: Record<AIProvider, { label: string; href: string; placeholder: string }> = {
    gemini: {
        label: "aistudio.google.com/apikey",
        href: "https://aistudio.google.com/apikey",
        placeholder: "AIza...",
    },
    anthropic: {
        label: "console.anthropic.com/settings/keys",
        href: "https://console.anthropic.com/settings/keys",
        placeholder: "sk-ant-...",
    },
};

export function ConfigGeminiCard() {
    const { toast } = useToast();

    const [provider, setProvider] = useState<AIProvider>(
        () => (localStorage.getItem(LS_PROVIDER) as AIProvider) ?? "gemini",
    );
    const [model, setModel] = useState<string>(
        () => localStorage.getItem(LS_MODEL) ?? DEFAULT_MODEL[provider],
    );
    const [geminiKey, setGeminiKey] = useState(
        () => localStorage.getItem(LS_KEY_GEMINI) ?? "",
    );
    const [anthropicKey, setAnthropicKey] = useState(
        () => localStorage.getItem(LS_KEY_ANTHROPIC) ?? "",
    );
    const [showKey, setShowKey] = useState(false);

    const availableModels = AI_MODELS.filter((m) => m.provider === provider);

    const handleProviderChange = (value: AIProvider) => {
        setProvider(value);
        // Reseta o modelo para o default do novo provedor
        const newDefault = DEFAULT_MODEL[value];
        setModel(newDefault);
    };

    const currentKey = provider === "anthropic" ? anthropicKey : geminiKey;
    const setCurrentKey = (v: string) => {
        if (provider === "anthropic") setAnthropicKey(v);
        else setGeminiKey(v);
    };

    const handleSave = () => {
        localStorage.setItem(LS_PROVIDER, provider);
        localStorage.setItem(LS_MODEL, model);
        if (provider === "anthropic") {
            localStorage.setItem(LS_KEY_ANTHROPIC, anthropicKey);
        } else {
            localStorage.setItem(LS_KEY_GEMINI, geminiKey);
        }
        toast({ title: "Configuração de IA salva!" });
    };

    const link = PROVIDER_API_LINKS[provider];

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                        <Bot className="h-5 w-5" />
                    </div>
                    <div>
                        <CardTitle className="font-display text-lg">Inteligência Artificial</CardTitle>
                        <CardDescription>
                            Escolha o provedor e modelo para o Gerador de Peças
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Seletor de provedor */}
                <div className="space-y-2">
                    <Label>Provedor de IA</Label>
                    <Select value={provider} onValueChange={(v) => handleProviderChange(v as AIProvider)}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="gemini">{PROVIDER_LABELS.gemini}</SelectItem>
                            <SelectItem value="anthropic">{PROVIDER_LABELS.anthropic}</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Seletor de modelo */}
                <div className="space-y-2">
                    <Label>Modelo</Label>
                    <Select value={model} onValueChange={setModel}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {availableModels.map((m) => (
                                <SelectItem key={m.id} value={m.id}>
                                    <span className="font-medium">{m.label}</span>
                                    <span className="ml-2 text-xs text-muted-foreground">— {m.description}</span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Chave da API */}
                <div className="space-y-2">
                    <Label htmlFor="apiKey">Chave da API {PROVIDER_LABELS[provider]}</Label>
                    <div className="relative">
                        <Input
                            id="apiKey"
                            type={showKey ? "text" : "password"}
                            placeholder={link.placeholder}
                            value={currentKey}
                            onChange={(e) => setCurrentKey(e.target.value)}
                        />
                        <button
                            type="button"
                            onClick={() => setShowKey(!showKey)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            aria-label={showKey ? "Ocultar chave" : "Mostrar chave"}
                        >
                            {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Obtenha em{" "}
                        <a
                            href={link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary underline"
                        >
                            {link.label}
                        </a>
                        . Sua chave fica salva apenas no seu navegador.
                    </p>
                </div>

                <div className="flex justify-end">
                    <Button variant="outline" onClick={handleSave}>
                        <Save className="mr-2 h-4 w-4" />
                        Salvar Configuração
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
