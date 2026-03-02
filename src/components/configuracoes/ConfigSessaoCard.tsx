import { LogOut } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export function ConfigSessaoCard() {
    const { signOut } = useAuth();

    return (
        <Card className="border-destructive/30">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                        <LogOut className="h-5 w-5" />
                    </div>
                    <div>
                        <CardTitle className="font-display text-lg text-destructive">Sessão</CardTitle>
                        <CardDescription>Encerrar a sessão atual</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                    Ao sair, você será redirecionado para a tela de login e precisará inserir suas credenciais
                    novamente.
                </p>
                <Button variant="destructive" onClick={signOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair da Conta
                </Button>
            </CardContent>
        </Card>
    );
}
