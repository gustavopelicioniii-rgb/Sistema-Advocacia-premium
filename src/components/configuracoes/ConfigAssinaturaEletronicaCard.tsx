import { useState } from "react";
import { PenTool, Save } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export function ConfigAssinaturaEletronicaCard() {
    const { toast } = useToast();
    const [signProvider, setSignProvider] = useState("clicksign");
    const [signApiToken, setSignApiToken] = useState("");

    const handleSave = () => {
        toast({ title: "Configuração de assinatura salva!", description: `Provedor: ${signProvider}` });
    };

    return (
        <Card className="border-indigo-200">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
                        <PenTool className="h-5 w-5" />
                    </div>
                    <div>
                        <CardTitle className="font-display text-lg">Assinatura Eletrônica</CardTitle>
                        <CardDescription>Integre assinatura digital para contratos e documentos</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label>Provedor de Assinatura</Label>
                    <Select value={signProvider} onValueChange={setSignProvider}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="clicksign">Clicksign</SelectItem>
                            <SelectItem value="docusign">DocuSign</SelectItem>
                            <SelectItem value="zapsign">ZapSign</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Token de API</Label>
                    <Input
                        type="password"
                        placeholder="Seu token de acesso"
                        value={signApiToken}
                        onChange={(e) => setSignApiToken(e.target.value)}
                    />
                </div>
                <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
                    <p className="font-medium text-foreground">Como funciona:</p>
                    <p>1. Obtenha o token de API no painel do seu provedor de assinatura.</p>
                    <p>
                        2. Ao enviar um documento para assinatura no módulo Documentos, o sistema usará essa integração.
                    </p>
                    <p>3. O status da assinatura é atualizado automaticamente via webhook.</p>
                </div>
                <div className="flex justify-end">
                    <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={handleSave}>
                        <Save className="mr-2 h-4 w-4" />
                        Salvar Assinatura
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
