import { useState } from "react";
import { Loader2, Lock, Eye, EyeOff } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changePassword } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";

export function ConfigSenhaTab() {
    const { toast } = useToast();
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [pending, setPending] = useState(false);

    const handleSubmit = async () => {
        if (newPassword.length < 6) {
            toast({
                title: "Senha muito curta",
                description: "A senha deve ter pelo menos 6 caracteres.",
                variant: "destructive",
            });
            return;
        }
        if (newPassword !== confirmPassword) {
            toast({
                title: "Senhas diferentes",
                description: "A confirmação não coincide com a nova senha.",
                variant: "destructive",
            });
            return;
        }
        setPending(true);
        try {
            await changePassword(newPassword);
            toast({ title: "Senha alterada com sucesso!" });
            setNewPassword("");
            setConfirmPassword("");
        } catch (e: unknown) {
            const message = e instanceof Error ? e.message : "Erro ao alterar senha";
            toast({ title: "Erro", description: message, variant: "destructive" });
        } finally {
            setPending(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-display text-lg">Alterar Senha</CardTitle>
                <CardDescription>Defina uma nova senha de acesso.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="newPassword">Nova Senha</Label>
                        <div className="relative">
                            <Input
                                id="newPassword"
                                type={showPassword ? "text" : "password"}
                                placeholder="Mínimo 6 caracteres"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                        <Input
                            id="confirmPassword"
                            type={showPassword ? "text" : "password"}
                            placeholder="Repita a senha"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex justify-end">
                    <Button onClick={handleSubmit} disabled={pending || !newPassword}>
                        {pending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Alterando...
                            </>
                        ) : (
                            <>
                                <Lock className="mr-2 h-4 w-4" />
                                Alterar Senha
                            </>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
