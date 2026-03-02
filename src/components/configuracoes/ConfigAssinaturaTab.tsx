import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useProfile } from "@/hooks/useProfile";

export function ConfigAssinaturaTab() {
    const { data: profile } = useProfile();

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-display text-lg">Assinatura</CardTitle>
                <CardDescription>Seu plano atual e renovação.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-sm">
                        {profile?.subscription_plan ? String(profile.subscription_plan).toUpperCase() : "Start"}
                    </Badge>
                    <span className="text-muted-foreground text-sm">Plano ativo</span>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                    Gerencie sua assinatura e formas de pagamento nas seções abaixo.
                </p>
            </CardContent>
        </Card>
    );
}
