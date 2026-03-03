import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useEscavadorImport } from "@/hooks/useEscavadorImport";
import { Loader2, CheckCircle2, AlertTriangle } from "lucide-react";

// Schema de validação
const importFormSchema = z.object({
    oab_estado: z.string().min(2, "Estado deve ter 2 caracteres").max(2, "Estado deve ter 2 caracteres").toUpperCase(),
    oab_numero: z
        .string()
        .min(1, "Número de inscrição é obrigatório")
        .regex(/^\d+$/, "Número deve conter apenas dígitos"),
});

type ImportFormValues = z.infer<typeof importFormSchema>;

export function ProcessoImporter() {
    const { loading, error, success, processosImportados, importarProcessos, reset } = useEscavadorImport();

    const form = useForm<ImportFormValues>({
        resolver: zodResolver(importFormSchema),
        defaultValues: {
            oab_estado: "",
            oab_numero: "",
        },
    });

    const onSubmit = async (data: ImportFormValues) => {
        try {
            await importarProcessos({
                oab_estado: data.oab_estado,
                oab_numero: data.oab_numero,
            });

            // Limpar formulário após sucesso
            form.reset();
        } catch (err) {
            // Erro já tratado no hook
            console.error("Erro na importação:", err);
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Importar Processos</CardTitle>
                    <CardDescription>
                        Busque e importe processos da API Escavador usando seu número de inscrição OAB
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Mensagem de sucesso */}
                    {success && (
                        <Alert className="border-green-200 bg-green-50">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <AlertDescription className="text-green-800">
                                {processosImportados} processo(s) importado(s) com sucesso! ✓
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Mensagem de erro */}
                    {error && (
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Formulário */}
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            {/* Campo: Estado OAB */}
                            <FormField
                                control={form.control}
                                name="oab_estado"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Estado (UF)</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="ex: SP"
                                                maxLength={2}
                                                {...field}
                                                onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                                                disabled={loading}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Sigla do estado onde está registrado (ex: SP, RJ, MG)
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Campo: Número OAB */}
                            <FormField
                                control={form.control}
                                name="oab_numero"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Número de Inscrição OAB</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="ex: 123456"
                                                type="text"
                                                inputMode="numeric"
                                                {...field}
                                                disabled={loading}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            Seu número de inscrição na OAB (apenas números)
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Botões */}
                            <div className="flex gap-2 pt-2">
                                <Button
                                    type="submit"
                                    disabled={loading || form.formState.isSubmitting}
                                    className="flex-1"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Importando...
                                        </>
                                    ) : (
                                        "Importar Processos"
                                    )}
                                </Button>

                                {success && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            reset();
                                            form.reset();
                                        }}
                                    >
                                        Nova Importação
                                    </Button>
                                )}
                            </div>
                        </form>
                    </Form>

                    {/* Info box */}
                    <Alert>
                        <AlertDescription className="text-sm">
                            💡 <strong>Dica:</strong> Você pode importar processos múltiplas vezes. Os processos são
                            atualizados automaticamente se já existirem no banco de dados.
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>

            {/* Seção: Como funciona */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Como Funciona</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                    <div className="space-y-2">
                        <p className="font-medium">1️⃣ Insira seu Estado e Número OAB</p>
                        <p className="text-gray-600">
                            Digite a sigla do estado (SP, RJ, etc) e seu número de inscrição na OAB
                        </p>
                    </div>

                    <div className="space-y-2">
                        <p className="font-medium">2️⃣ Sistema Conecta na API Escavador</p>
                        <p className="text-gray-600">
                            Nosso servidor busca todos os seus processos registrados na API Escavador
                        </p>
                    </div>

                    <div className="space-y-2">
                        <p className="font-medium">3️⃣ Processos Salvos no Banco</p>
                        <p className="text-gray-600">
                            Os processos são importados e armazenados com segurança no banco de dados
                        </p>
                    </div>

                    <div className="space-y-2">
                        <p className="font-medium">4️⃣ Monitoramento Automático</p>
                        <p className="text-gray-600">
                            A cada 24h, verificamos automaticamente se há novas movimentações e notificamos você
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Seção: Avisos de segurança */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">🔐 Segurança</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                    <p>✓ Seu token Escavador fica seguro no servidor (nunca é enviado ao navegador)</p>
                    <p>✓ Os dados dos processos são criptografados no banco de dados</p>
                    <p>✓ Apenas você consegue ver seus próprios processos</p>
                    <p>✓ As movimentações são verificadas em background, sem exigir ação sua</p>
                </CardContent>
            </Card>
        </div>
    );
}
