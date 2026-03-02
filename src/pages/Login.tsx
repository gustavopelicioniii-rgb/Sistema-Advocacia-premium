import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Scale, Eye, EyeOff, Lock } from "lucide-react";

const Login: React.FC = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const [fullName, setFullName] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    // Force password change state
    const [mustChangePassword, setMustChangePassword] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showNewPassword, setShowNewPassword] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();
    const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || "/";

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: fullName,
                        },
                    },
                });
                if (error) throw error;
                toast.success("Cadastro realizado! Verifique seu e-mail ou faça login.");
                setIsSignUp(false);
            } else {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;

                // Check if user must change password
                const mustChange = data.user?.user_metadata?.must_change_password === true;
                if (mustChange) {
                    setMustChangePassword(true);
                    toast.info("Por segurança, defina uma nova senha para continuar.");
                } else {
                    toast.success("Login realizado com sucesso!");
                    navigate(from, { replace: true });
                }
            }
        } catch (error) {
            const msg = error instanceof Error ? error.message : "";
            if (msg.includes("Failed to fetch") || msg.includes("fetch")) {
                toast.error(
                    'Não foi possível conectar ao servidor. Confira no Supabase: Authentication → URL Configuration → adicione a URL deste site em "Site URL" e "Redirect URLs".',
                    { duration: 8000 },
                );
            } else {
                toast.error(msg || "Erro durante a autenticação");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword.length < 6) {
            toast.error("A nova senha deve ter pelo menos 6 caracteres.");
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error("As senhas não coincidem.");
            return;
        }
        setLoading(true);
        try {
            // Update password
            const { error: pwError } = await supabase.auth.updateUser({
                password: newPassword,
            });
            if (pwError) throw pwError;

            // Remove the must_change_password flag
            const { error: metaError } = await supabase.auth.updateUser({
                data: { must_change_password: false },
            });
            if (metaError) throw metaError;

            toast.success("Senha atualizada com sucesso!");
            setMustChangePassword(false);
            navigate(from, { replace: true });
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Erro ao alterar a senha");
        } finally {
            setLoading(false);
        }
    };

    // --- Force password change screen ---
    if (mustChangePassword) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
                <Card className="w-full max-w-md shadow-lg border-slate-200">
                    <CardHeader className="space-y-1 text-center">
                        <div className="flex justify-center mb-4">
                            <div className="bg-amber-100 p-3 rounded-full">
                                <Lock className="h-8 w-8 text-amber-600" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl font-bold tracking-tight">Redefinir Senha</CardTitle>
                        <CardDescription>Por segurança, defina uma nova senha para acessar o sistema.</CardDescription>
                    </CardHeader>
                    <form onSubmit={handleChangePassword}>
                        <CardContent className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label htmlFor="newPassword">Nova Senha</Label>
                                <div className="relative">
                                    <Input
                                        id="newPassword"
                                        type={showNewPassword ? "text" : "password"}
                                        placeholder="Mínimo 6 caracteres"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                        minLength={6}
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                    >
                                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                                <Input
                                    id="confirmPassword"
                                    type={showNewPassword ? "text" : "password"}
                                    placeholder="Repita a nova senha"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    minLength={6}
                                />
                            </div>
                            {newPassword && confirmPassword && newPassword !== confirmPassword && (
                                <p className="text-sm text-destructive">As senhas não coincidem</p>
                            )}
                        </CardContent>
                        <CardFooter className="pt-4">
                            <Button
                                className="w-full"
                                type="submit"
                                disabled={loading || !newPassword || newPassword !== confirmPassword}
                            >
                                {loading ? "Salvando..." : "Definir Nova Senha"}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        );
    }

    // --- Login / Signup screen ---
    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
            <Card className="w-full max-w-md shadow-lg border-slate-200">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="bg-primary/10 p-3 rounded-full">
                            <Scale className="h-8 w-8 text-primary" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight">Escritório de Advocacia</CardTitle>
                    <CardDescription>
                        {isSignUp ? "Crie sua conta para começar" : "Entre com suas credenciais"}
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleAuth}>
                    <CardContent className="space-y-4 pt-4">
                        {isSignUp && (
                            <div className="space-y-2">
                                <Label htmlFor="fullName">Nome Completo</Label>
                                <Input
                                    id="fullName"
                                    placeholder="Seu nome"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    required={isSignUp}
                                />
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="nome@exemplo.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Senha</Label>
                            </div>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col space-y-4 pt-4">
                        <Button className="w-full" type="submit" disabled={loading}>
                            {loading ? "Processando..." : isSignUp ? "Cadastrar" : "Entrar"}
                        </Button>
                        <Button
                            variant="ghost"
                            className="w-full text-sm text-slate-500 hover:text-slate-900"
                            type="button"
                            onClick={() => setIsSignUp(!isSignUp)}
                        >
                            {isSignUp ? "Já tem uma conta? Entre aqui" : "Não tem uma conta? Cadastre-se"}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
};

export default Login;
