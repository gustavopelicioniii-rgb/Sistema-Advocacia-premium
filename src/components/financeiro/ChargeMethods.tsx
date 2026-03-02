import { CreditCard, QrCode, Link2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ChargeMethodsProps {
    onSelectMethod: (method: "pix" | "boleto" | "link") => void;
}

export const ChargeMethods = ({ onSelectMethod }: ChargeMethodsProps) => {
    return (
        <Card className="border-primary/20">
            <CardHeader className="pb-3">
                <CardTitle className="font-display text-xl flex items-center gap-2">
                    <CreditCard className="h-5 w-5" /> Cobranças — PIX / Boleto / Link
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                    Gere cobranças e envie para o cliente. Integre com Asaas, Stripe ou Mercado Pago nas Configurações
                    para baixa automática.
                </p>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4 sm:grid-cols-3">
                    <div
                        className="flex items-center gap-4 rounded-lg border p-4 cursor-pointer hover:bg-muted/50 transition-all"
                        role="button"
                        tabIndex={0}
                        onClick={() => onSelectMethod("pix")}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                                onSelectMethod("pix");
                            }
                        }}
                    >
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 text-green-700">
                            <QrCode className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="font-semibold text-foreground">PIX</p>
                            <p className="text-xs text-muted-foreground">QR Code + copia e cola</p>
                        </div>
                    </div>
                    <div
                        className="flex items-center gap-4 rounded-lg border p-4 cursor-pointer hover:bg-muted/50 transition-all"
                        role="button"
                        tabIndex={0}
                        onClick={() => onSelectMethod("boleto")}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                                onSelectMethod("boleto");
                            }
                        }}
                    >
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                            <CreditCard className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="font-semibold text-foreground">Boleto</p>
                            <p className="text-xs text-muted-foreground">Gerar boleto bancário</p>
                        </div>
                    </div>
                    <div
                        className="flex items-center gap-4 rounded-lg border p-4 cursor-pointer hover:bg-muted/50 transition-all"
                        role="button"
                        tabIndex={0}
                        onClick={() => onSelectMethod("link")}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                                onSelectMethod("link");
                            }
                        }}
                    >
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 text-purple-700">
                            <Link2 className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="font-semibold text-foreground">Link de Pagamento</p>
                            <p className="text-xs text-muted-foreground">Enviar link por WhatsApp/email</p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
