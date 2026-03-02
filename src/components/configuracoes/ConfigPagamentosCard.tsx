import { useState } from "react";
import { CreditCard, Save } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export function ConfigPagamentosCard() {
    const { toast } = useToast();
    const [payProvider, setPayProvider] = useState("asaas");
    const [payApiKey, setPayApiKey] = useState("");

    const handleSave = () => {
        toast({ title: "Configuração de pagamento salva!", description: `Provedor: ${payProvider}` });
    };

    return (
        <Card className="border-emerald-200">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                        <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                        <CardTitle className="font-display text-lg">Pagamentos Online</CardTitle>
                        <CardDescription>
                            Configure integração para cobranças PIX, boleto e link de pagamento
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label>Provedor de Pagamento</Label>
                    <Select value={payProvider} onValueChange={setPayProvider}>
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="asaas">Asaas</SelectItem>
                            <SelectItem value="stripe">Stripe</SelectItem>
                            <SelectItem value="mercadopago">Mercado Pago</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                        <Label>API Key</Label>
                        <Input
                            type="password"
                            placeholder="Sua chave de API"
                            value={payApiKey}
                            onChange={(e) => setPayApiKey(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Webhook URL</Label>
                        <Input
                            readOnly
                            value="https://seu-supabase.co/functions/v1/payment-webhook"
                            className="opacity-70"
                        />
                    </div>
                </div>
                <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
                    <p className="font-medium text-foreground">Baixa automática</p>
                    <p>
                        Ao configurar o webhook no provedor, pagamentos confirmados serão marcados como "Pago"
                        automaticamente no sistema.
                    </p>
                </div>
                <div className="flex justify-end">
                    <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleSave}>
                        <Save className="mr-2 h-4 w-4" />
                        Salvar Pagamentos
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
