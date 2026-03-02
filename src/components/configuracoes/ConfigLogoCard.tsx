import { Image, Loader2, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useProfile, useUploadFirmLogo, useRemoveFirmLogo } from "@/hooks/useProfile";

export function ConfigLogoCard() {
    const { data: profile } = useProfile();
    const uploadFirmLogo = useUploadFirmLogo();
    const removeFirmLogo = useRemoveFirmLogo();

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Image className="h-5 w-5" />
                    </div>
                    <div>
                        <CardTitle className="font-display text-lg">Logo do escritório</CardTitle>
                        <CardDescription>Faça o upload da logo para exibir no painel e no dashboard</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-wrap items-end gap-4">
                    <div className="flex flex-col items-center gap-2">
                        {profile?.firm_logo_url ? (
                            <img
                                src={profile.firm_logo_url}
                                alt="Logo do escritório"
                                className="h-20 w-auto max-w-[200px] object-contain rounded border border-border bg-muted/30 p-2"
                            />
                        ) : (
                            <div className="h-20 w-32 rounded border border-dashed border-border bg-muted/30 flex items-center justify-center text-muted-foreground text-xs">
                                Nenhuma logo
                            </div>
                        )}
                        <div className="flex gap-2">
                            <input
                                id="firm-logo-upload"
                                type="file"
                                accept="image/png,image/jpeg,image/jpg,image/gif,image/webp,image/svg+xml"
                                className="sr-only"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) uploadFirmLogo.mutate(file);
                                    e.target.value = "";
                                }}
                                disabled={uploadFirmLogo.isPending}
                            />
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                disabled={uploadFirmLogo.isPending}
                                onClick={() => document.getElementById("firm-logo-upload")?.click()}
                            >
                                {uploadFirmLogo.isPending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Image className="h-4 w-4" />
                                )}{" "}
                                {profile?.firm_logo_url ? "Trocar" : "Enviar"} logo
                            </Button>
                            {profile?.firm_logo_url && (
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => removeFirmLogo.mutate()}
                                    disabled={removeFirmLogo.isPending}
                                >
                                    <Trash2 className="h-4 w-4" /> Remover
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
