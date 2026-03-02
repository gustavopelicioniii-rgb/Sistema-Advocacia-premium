import { useState, useEffect } from "react";
import { Loader2, MessageCircle, Save } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useWhatsAppConfig, useSaveWhatsAppConfig } from "@/hooks/useWhatsApp";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

type WaProvider = "cloud_api" | "z_api" | "evolution_api";

const PROVIDER_INFO: Record<
    WaProvider,
    { urlLabel: string; urlPlaceholder: string; keyLabel: string; keyPlaceholder: string; hasInstance: boolean }
> = {
    z_api: {
        urlLabel: "URL da Instância Z-API",
        urlPlaceholder: "https://api.z-api.io/instances/SUA_INSTANCIA/token/SEU_TOKEN",
        keyLabel: "Client-Token",
        keyPlaceholder: "Seu client-token do Z-API",
        hasInstance: false,
    },
    evolution_api: {
        urlLabel: "URL base da Evolution API",
        urlPlaceholder: "https://sua-evolution-api.com",
        keyLabel: "API Key",
        keyPlaceholder: "Sua apikey da Evolution",
        hasInstance: true,
    },
    cloud_api: {
        urlLabel: "Número do Telefone (ID)",
        urlPlaceholder: "ID do número no Meta Business",
        keyLabel: "Access Token",
        keyPlaceholder: "Token permanente do Meta",
        hasInstance: false,
    },
};

export function ConfigWhatsAppCard() {
    const { user } = useAuth();
    const { toast } = useToast();
    const { data: waConfig } = useWhatsAppConfig();
    const saveWaConfig = useSaveWhatsAppConfig();

    const [provider, setProvider] = useState<WaProvider>("z_api");
    const [apiUrl, setApiUrl] = useState("");
    const [apiKey, setApiKey] = useState("");
    const [instanceId, setInstanceId] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [active, setActive] = useState(false);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        if (waConfig && !loaded) {
            setProvider(waConfig.provider);
            setApiUrl(waConfig.api_url);
            setApiKey(waConfig.api_key);
            setInstanceId(waConfig.instance_id);
            setPhoneNumber(waConfig.phone_number);
            setActive(waConfig.is_active);
            setLoaded(true);
        }
    }, [waConfig, loaded]);

    const handleSave = async () => {
        if (!user?.id) {
            toast({ title: "Erro", description: "Usuário não autenticado", variant: "destructive" });
            return;
        }
        try {
            await saveWaConfig.mutateAsync({
                owner_id: user.id,
                provider,
                api_url: apiUrl,
                api_key: apiKey,
                instance_id: instanceId,
                phone_number: phoneNumber,
                is_active: active,
            });
        } catch {
            // handled by mutation onError
        }
    };

    const pInfo = PROVIDER_INFO[provider];

    return (
        <Card className="border-green-200">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 text-green-700">
                            <MessageCircle className="h-5 w-5" />
                        </div>
                        <div>
                            <CardTitle className="font-display text-lg">WhatsApp Business</CardTitle>
                            <CardDescription>Integre conversas do WhatsApp ao CRM</CardDescription>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{active ? "Ativo" : "Inativo"}</span>
                        <Switch checked={active} onCheckedChange={setActive} />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label>Provedor</Label>
                    <Select value={provider} onValueChange={(v: WaProvider) => setProvider(v)}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="z_api">Z-API (Recomendado)</SelectItem>
                            <SelectItem value="evolution_api">Evolution API</SelectItem>
                            <SelectItem value="cloud_api">Meta Cloud API (Oficial)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                        <Label>{pInfo.urlLabel}</Label>
                        <Input
                            placeholder={pInfo.urlPlaceholder}
                            value={provider === "cloud_api" ? phoneNumber : apiUrl}
                            onChange={(e) =>
                                provider === "cloud_api" ? setPhoneNumber(e.target.value) : setApiUrl(e.target.value)
                            }
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>{pInfo.keyLabel}</Label>
                        <Input
                            type="password"
                            placeholder={pInfo.keyPlaceholder}
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                        />
                    </div>
                </div>

                {pInfo.hasInstance && (
                    <div className="space-y-2">
                        <Label>Nome da Instância</Label>
                        <Input
                            placeholder="minha-instancia"
                            value={instanceId}
                            onChange={(e) => setInstanceId(e.target.value)}
                        />
                    </div>
                )}

                <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground space-y-1">
                    <p className="font-medium text-foreground">Como configurar:</p>
                    {provider === "z_api" && (
                        <>
                            <p>
                                1. Crie uma conta em{" "}
                                <a
                                    href="https://z-api.io"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary underline"
                                >
                                    z-api.io
                                </a>
                            </p>
                            <p>2. Crie uma instância e escaneie o QR Code com seu WhatsApp</p>
                            <p>3. Cole a URL da instância e o Client-Token acima</p>
                            <p>4. Configure o webhook de recebimento na Z-API apontando para seu Supabase</p>
                        </>
                    )}
                    {provider === "evolution_api" && (
                        <>
                            <p>1. Instale a Evolution API no seu servidor</p>
                            <p>2. Crie uma instância e escaneie o QR Code</p>
                            <p>3. Cole a URL, API Key e nome da instância acima</p>
                            <p>4. Configure o webhook na Evolution API</p>
                        </>
                    )}
                    {provider === "cloud_api" && (
                        <>
                            <p>
                                1. Acesse{" "}
                                <a
                                    href="https://developers.facebook.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary underline"
                                >
                                    developers.facebook.com
                                </a>
                            </p>
                            <p>2. Crie um app do tipo Business e configure o WhatsApp</p>
                            <p>3. Obtenha o Token permanente e o ID do número</p>
                            <p>4. Configure o webhook no Meta para seu Supabase</p>
                        </>
                    )}
                </div>

                <div className="flex justify-end">
                    <Button
                        onClick={handleSave}
                        disabled={saveWaConfig.isPending}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        {saveWaConfig.isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Salvando...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Salvar WhatsApp
                            </>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
