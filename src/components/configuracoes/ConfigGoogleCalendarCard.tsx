import { useState } from "react";
import { Save } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export function ConfigGoogleCalendarCard() {
    const { toast } = useToast();
    const [clientId, setClientId] = useState(() =>
        typeof window !== "undefined" ? (localStorage.getItem("google_calendar_client_id") ?? "") : "",
    );

    const handleSave = () => {
        localStorage.setItem("google_calendar_client_id", clientId);
        toast({ title: "Client ID salvo!" });
    };

    return (
        <Card className="border-blue-200">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M19.5 3.75h-15A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V6a2.25 2.25 0 00-2.25-2.25zM9 17.25H6.75V9.75H9v7.5zm4.125 0h-2.25V9.75h2.25v7.5zM17.25 17.25H15V9.75h2.25v7.5zM6.75 8.25v-3h10.5v3H6.75z" />
                        </svg>
                    </div>
                    <div>
                        <CardTitle className="font-display text-lg">Google Calendar</CardTitle>
                        <CardDescription>Sincronize sua agenda com o Google Calendar (2 vias)</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label>Google OAuth Client ID</Label>
                    <Input
                        placeholder="123456789-abc.apps.googleusercontent.com"
                        value={clientId}
                        onChange={(e) => setClientId(e.target.value)}
                    />
                </div>
                <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
                    <p className="font-medium text-foreground">Como obter o Client ID:</p>
                    <p>
                        1. Acesse{" "}
                        <a
                            href="https://console.cloud.google.com/apis/credentials"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary underline"
                        >
                            Google Cloud Console
                        </a>
                    </p>
                    <p>2. Crie um projeto (ou use um existente)</p>
                    <p>
                        3. Ative a API <strong>Google Calendar API</strong>
                    </p>
                    <p>4. Crie credenciais → OAuth 2.0 Client ID (tipo: Web application)</p>
                    <p>
                        5. Em "Authorized JavaScript origins", adicione:{" "}
                        <code className="bg-muted px-1 rounded">
                            {typeof window !== "undefined" ? window.location.origin : "http://localhost:8082"}
                        </code>
                    </p>
                    <p>6. Em "Authorized redirect URIs", adicione a mesma URL</p>
                    <p>7. Cole o Client ID acima</p>
                </div>
                <div className="flex justify-end">
                    <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleSave}>
                        <Save className="mr-2 h-4 w-4" />
                        Salvar Google Calendar
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
