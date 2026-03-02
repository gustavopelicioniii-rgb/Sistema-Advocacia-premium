import { useState } from "react";
import { Key, Save, Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export function ConfigGeminiCard() {
    const { toast } = useToast();
    const [apiKey, setApiKey] = useState(() =>
        typeof window !== "undefined" ? (localStorage.getItem("gemini_api_key") ?? "") : "",
    );
    const [showApiKey, setShowApiKey] = useState(false);

    const handleSave = () => {
        localStorage.setItem("gemini_api_key", apiKey);
        toast({ title: "Chave da API salva!" });
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent">
                        <Key className="h-5 w-5" />
                    </div>
                    <div>
                        <CardTitle className="font-display text-lg">Inteligência Artificial</CardTitle>
                        <CardDescription>
                            Configure a chave da API do Google Gemini para o Gerador de Peças
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="apiKey">Chave da API Google Gemini</Label>
                    <div className="relative">
                        <Input
                            id="apiKey"
                            type={showApiKey ? "text" : "password"}
                            placeholder="AIza..."
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                        />
                        <button
                            type="button"
                            onClick={() => setShowApiKey(!showApiKey)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            aria-label={showApiKey ? "Ocultar chave" : "Mostrar chave"}
                        >
                            {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Obtenha em{" "}
                        <a
                            href="https://aistudio.google.com/apikey"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary underline"
                        >
                            aistudio.google.com/apikey
                        </a>
                        . Sua chave fica salva apenas no seu navegador.
                    </p>
                </div>
                <div className="flex justify-end">
                    <Button variant="outline" onClick={handleSave}>
                        <Save className="mr-2 h-4 w-4" />
                        Salvar Chave
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
