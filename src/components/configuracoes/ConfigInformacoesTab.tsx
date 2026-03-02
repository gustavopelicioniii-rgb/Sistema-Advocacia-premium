import { useState, useEffect } from "react";
import { Loader2, Camera } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProfile, useUpdateProfile, useUploadAvatar } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";

const UFS = [
    "AC",
    "AL",
    "AP",
    "AM",
    "BA",
    "CE",
    "DF",
    "ES",
    "GO",
    "MA",
    "MT",
    "MS",
    "MG",
    "PA",
    "PB",
    "PR",
    "PE",
    "PI",
    "RJ",
    "RN",
    "RS",
    "RO",
    "RR",
    "SC",
    "SP",
    "SE",
    "TO",
];
const PROFISSOES = ["Advogado", "Advogada", "Estagiário", "Estagiária", "Outro"];
const ESTADOS_BR = [
    "Acre",
    "Alagoas",
    "Amapá",
    "Amazonas",
    "Bahia",
    "Ceará",
    "Distrito Federal",
    "Espírito Santo",
    "Goiás",
    "Maranhão",
    "Mato Grosso",
    "Mato Grosso do Sul",
    "Minas Gerais",
    "Pará",
    "Paraíba",
    "Paraná",
    "Pernambuco",
    "Piauí",
    "Rio de Janeiro",
    "Rio Grande do Norte",
    "Rio Grande do Sul",
    "Rondônia",
    "Roraima",
    "Santa Catarina",
    "São Paulo",
    "Sergipe",
    "Tocantins",
];

export function ConfigInformacoesTab() {
    const { user } = useAuth();
    const { data: profile } = useProfile();
    const updateProfile = useUpdateProfile();
    const uploadAvatar = useUploadAvatar();

    const [fullName, setFullName] = useState("");
    const [phone, setPhone] = useState("");
    const [oabNumber, setOabNumber] = useState("");
    const [profissao, setProfissao] = useState("");
    const [oabState, setOabState] = useState("");
    const [estado, setEstado] = useState("");
    const [endereco, setEndereco] = useState("");
    const [numero, setNumero] = useState("");
    const [cpf, setCpf] = useState("");
    const [cep, setCep] = useState("");
    const [cidade, setCidade] = useState("");
    const [bairro, setBairro] = useState("");
    const [complemento, setComplemento] = useState("");
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        if (profile && !loaded) {
            setFullName(profile.full_name ?? "");
            setPhone(profile.phone ?? "");
            setOabNumber(profile.oab_number ?? "");
            setProfissao(profile.profissao ?? "");
            setOabState(profile.oab_state ?? "");
            setEstado(profile.estado ?? "");
            setEndereco(profile.endereco ?? "");
            setNumero(profile.numero ?? "");
            setCpf(profile.cpf ?? "");
            setCep(profile.cep ?? "");
            setCidade(profile.cidade ?? "");
            setBairro(profile.bairro ?? "");
            setComplemento(profile.complemento ?? "");
            setLoaded(true);
        }
    }, [profile, loaded]);

    const handleSave = async () => {
        try {
            await updateProfile.mutateAsync({
                full_name: fullName,
                phone,
                oab_number: oabNumber,
                profissao: profissao || null,
                oab_state: oabState || null,
                estado: estado || null,
                endereco: endereco || null,
                numero: numero || null,
                cpf: cpf || null,
                cep: cep || null,
                cidade: cidade || null,
                bairro: bairro || null,
                complemento: complemento || null,
            });
        } catch {
            // handled by mutation onError
        }
    };

    return (
        <Card>
            <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row gap-6">
                    {/* Avatar */}
                    <div className="flex flex-col items-center gap-2 shrink-0">
                        <label className="relative cursor-pointer block">
                            <div className="h-24 w-24 rounded-full overflow-hidden border-2 border-border bg-primary flex items-center justify-center text-3xl font-bold text-primary-foreground">
                                {profile?.avatar_url ? (
                                    <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover" />
                                ) : (
                                    (fullName || user?.email || "U").charAt(0).toUpperCase()
                                )}
                            </div>
                            <span className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground border-2 border-background">
                                <Camera className="h-4 w-4" />
                            </span>
                            <input
                                type="file"
                                accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                                className="sr-only"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) uploadAvatar.mutate(file);
                                    e.target.value = "";
                                }}
                                disabled={uploadAvatar.isPending}
                            />
                        </label>
                        <span className="text-xs text-muted-foreground">Alterar foto</span>
                    </div>

                    {/* Form fields */}
                    <div className="flex-1 grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="profissao">
                                Profissão <span className="text-destructive">*</span>
                            </Label>
                            <Select value={profissao || undefined} onValueChange={setProfissao}>
                                <SelectTrigger id="profissao">
                                    <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent>
                                    {PROFISSOES.map((p) => (
                                        <SelectItem key={p} value={p}>
                                            {p}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="fullName">
                                Nome completo <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="fullName"
                                placeholder="Seu nome"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="email">E-mail</Label>
                            <Input id="email" value={user?.email ?? ""} disabled className="opacity-60" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="oab_state">Estado da OAB</Label>
                            <Select value={oabState || undefined} onValueChange={setOabState}>
                                <SelectTrigger id="oab_state">
                                    <SelectValue placeholder="UF" />
                                </SelectTrigger>
                                <SelectContent>
                                    {UFS.map((uf) => (
                                        <SelectItem key={uf} value={uf}>
                                            {uf}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="estado">Estado</Label>
                            <Select value={estado || undefined} onValueChange={setEstado}>
                                <SelectTrigger id="estado">
                                    <SelectValue placeholder="Estado" />
                                </SelectTrigger>
                                <SelectContent>
                                    {ESTADOS_BR.map((e) => (
                                        <SelectItem key={e} value={e}>
                                            {e}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="endereco">Endereço</Label>
                            <Input
                                id="endereco"
                                placeholder="Rua, avenida"
                                value={endereco}
                                onChange={(e) => setEndereco(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="numero">
                                Número <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="numero"
                                placeholder="Nº"
                                value={numero}
                                onChange={(e) => setNumero(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="cpf">
                                CPF <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="cpf"
                                placeholder="000.000.000-00"
                                value={cpf}
                                onChange={(e) => setCpf(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Telefone</Label>
                            <Input
                                id="phone"
                                placeholder="(11) 99999-9999"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="oab">Nº da OAB</Label>
                            <Input
                                id="oab"
                                placeholder="123456"
                                value={oabNumber}
                                onChange={(e) => setOabNumber(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="cep">CEP</Label>
                            <Input
                                id="cep"
                                placeholder="00000-000"
                                value={cep}
                                onChange={(e) => setCep(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="cidade">Cidade</Label>
                            <Input
                                id="cidade"
                                placeholder="Cidade"
                                value={cidade}
                                onChange={(e) => setCidade(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="bairro">Bairro</Label>
                            <Input
                                id="bairro"
                                placeholder="Bairro"
                                value={bairro}
                                onChange={(e) => setBairro(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="complemento">Complemento</Label>
                            <Input
                                id="complemento"
                                placeholder="Apto, bloco"
                                value={complemento}
                                onChange={(e) => setComplemento(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
                <div className="flex justify-center sm:justify-end mt-6">
                    <Button
                        onClick={handleSave}
                        disabled={updateProfile.isPending}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto min-w-[120px]"
                    >
                        {updateProfile.isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Salvando...
                            </>
                        ) : (
                            <>SALVAR</>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
