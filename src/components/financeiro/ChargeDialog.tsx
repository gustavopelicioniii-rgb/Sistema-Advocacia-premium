import { useState } from "react";
import { QrCode, CreditCard, Link2, Copy } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

interface ChargeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    method: "pix" | "boleto" | "link";
    onMethodChange: (method: "pix" | "boleto" | "link") => void;
}

export const ChargeDialog = ({ open, onOpenChange, method, onMethodChange }: ChargeDialogProps) => {
    const { toast } = useToast();
    const [chargeClient, setChargeClient] = useState("");
    const [chargeValue, setChargeValue] = useState("");
    const [chargeDesc, setChargeDesc] = useState("");
    const [chargeGenerated, setChargeGenerated] = useState(false);

    const handleGenerateCharge = () => {
        if (!chargeClient || !chargeValue) {
            toast({ title: "Preencha cliente e valor", variant: "destructive" });
            return;
        }
        const val = parseFloat(chargeValue);
        if (isNaN(val)) {
            toast({ title: "Valor inválido", variant: "destructive" });
            return;
        }
        setChargeGenerated(true);
        toast({
            title: `Cobrança ${method.toUpperCase()} gerada!`,
            description: `${chargeClient} — ${formatCurrency(val)}`,
        });
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText("https://pay.example.com/charge/abc123");
        toast({ title: "Link copiado!" });
    };

    const handleClose = () => {
        setChargeGenerated(false);
        setChargeClient("");
        setChargeValue("");
        setChargeDesc("");
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="font-display text-xl flex items-center gap-2">
                        {method === "pix" && (
                            <>
                                <QrCode className="h-5 w-5 text-green-600" /> Gerar Cobrança PIX
                            </>
                        )}
                        {method === "boleto" && (
                            <>
                                <CreditCard className="h-5 w-5 text-blue-600" /> Gerar Boleto
                            </>
                        )}
                        {method === "link" && (
                            <>
                                <Link2 className="h-5 w-5 text-purple-600" /> Gerar Link de Pagamento
                            </>
                        )}
                    </DialogTitle>
                </DialogHeader>
                {!chargeGenerated ? (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Cliente *</Label>
                            <Input
                                placeholder="Nome do cliente"
                                value={chargeClient}
                                onChange={(e) => setChargeClient(e.target.value)}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Valor (R$) *</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="0,00"
                                    value={chargeValue}
                                    onChange={(e) => setChargeValue(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Método</Label>
                                <Select
                                    value={method}
                                    onValueChange={(v: "pix" | "boleto" | "link") => onMethodChange(v)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pix">PIX</SelectItem>
                                        <SelectItem value="boleto">Boleto</SelectItem>
                                        <SelectItem value="link">Link de Pagamento</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Descrição</Label>
                            <Input
                                placeholder="Honorários advocatícios..."
                                value={chargeDesc}
                                onChange={(e) => setChargeDesc(e.target.value)}
                            />
                        </div>
                        <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
                            <p className="font-medium text-foreground">Integração de pagamento</p>
                            <p>
                                Configure sua conta Asaas, Stripe ou Mercado Pago nas <strong>Configurações</strong>{" "}
                                para gerar cobranças reais com baixa automática.
                            </p>
                            <p>Sem integração, a cobrança é gerada como registro interno.</p>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={handleClose}>
                                Cancelar
                            </Button>
                            <Button onClick={handleGenerateCharge}>
                                {method === "pix" && "Gerar PIX"}
                                {method === "boleto" && "Gerar Boleto"}
                                {method === "link" && "Gerar Link"}
                            </Button>
                        </DialogFooter>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex flex-col items-center justify-center py-6 space-y-4">
                            {method === "pix" && (
                                <>
                                    <div className="h-40 w-40 rounded-lg bg-muted flex items-center justify-center border-2 border-dashed">
                                        <QrCode className="h-20 w-20 text-green-600" />
                                    </div>
                                    <p className="text-xs text-muted-foreground text-center">
                                        QR Code PIX gerado. Envie ao cliente para pagamento.
                                    </p>
                                </>
                            )}
                            {method === "boleto" && (
                                <div className="text-center space-y-2">
                                    <CreditCard className="h-16 w-16 text-blue-600 mx-auto" />
                                    <p className="font-semibold">Boleto gerado!</p>
                                    <p className="text-xs text-muted-foreground">Vencimento em 3 dias úteis.</p>
                                </div>
                            )}
                            {method === "link" && (
                                <div className="text-center space-y-2">
                                    <Link2 className="h-16 w-16 text-purple-600 mx-auto" />
                                    <p className="font-semibold">Link de pagamento gerado!</p>
                                </div>
                            )}
                            <div className="flex items-center gap-2 rounded-lg border p-3 bg-muted/30 w-full">
                                <code className="flex-1 text-xs truncate">https://pay.example.com/charge/abc123</code>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 shrink-0"
                                    onClick={handleCopyLink}
                                >
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                            <p className="text-sm font-semibold">
                                {chargeClient} — {formatCurrency(parseFloat(chargeValue) || 0)}
                            </p>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={handleClose}>
                                Fechar
                            </Button>
                            <Button onClick={handleCopyLink}>
                                <Copy className="mr-2 h-4 w-4" /> Copiar Link
                            </Button>
                        </DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};
