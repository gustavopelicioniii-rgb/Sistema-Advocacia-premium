import { useState } from "react";
import { motion } from "framer-motion";
import { Users, UserPlus, Shield, Eye, Pencil, Loader2, ChevronDown, ChevronUp, Save, Mail, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
    useTeamMembers,
    useUserPermissions,
    useUpdateUserRole,
    useUpdatePermission,
    useInviteUser,
    useSyncProfilesFromAuth,
    type TeamMember,
} from "@/hooks/useTeam";
import { useAuth } from "@/contexts/AuthContext";

const MODULE_LABELS: Record<string, string> = {
    processos: "Processos",
    agenda: "Agenda",
    pecas: "Gerador de Peças",
    crm: "CRM",
    financeiro: "Financeiro",
    documentos: "Documentos",
    publicacoes: "Publicações",
    relatorios: "Relatórios",
    configuracoes: "Configurações",
};

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
    admin: { label: "Administrador", color: "bg-primary text-primary-foreground" },
    lawyer: { label: "Advogado(a)", color: "bg-blue-100 text-blue-700" },
    assistant: { label: "Assistente", color: "bg-gray-100 text-gray-700" },
};

// Component for a single team member's permissions
function MemberPermissions({ member }: { member: TeamMember }) {
    const { data: permissions, isLoading } = useUserPermissions(member.id);
    const updatePermission = useUpdatePermission();
    const updateRole = useUpdateUserRole();
    const { user } = useAuth();
    const [expanded, setExpanded] = useState(false);
    const isMe = user?.id === member.id;

    const initials = (member.full_name || "?")
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase())
        .slice(0, 2)
        .join("");

    const roleInfo = ROLE_LABELS[member.role ?? "lawyer"];

    const handleToggle = (module: string, field: "can_view" | "can_edit", currentValue: boolean) => {
        const perm = permissions?.find((p) => p.module === module);
        updatePermission.mutate({
            userId: member.id,
            module,
            can_view: field === "can_view" ? !currentValue : (perm?.can_view ?? true),
            can_edit: field === "can_edit" ? !currentValue : (perm?.can_edit ?? false),
        });
    };

    return (
        <Card>
            <div
                className="flex items-center gap-4 p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={() => setExpanded(!expanded)}
            >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                    {initials}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <p className="text-base font-semibold truncate">{member.full_name || "Sem nome"}</p>
                        {isMe && (
                            <Badge variant="outline" className="text-xs">
                                Você
                            </Badge>
                        )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{member.email}</p>
                </div>
                <Badge className={roleInfo.color}>{roleInfo.label}</Badge>
                {expanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
            </div>

            {expanded && (
                <CardContent className="pt-0 space-y-4">
                    <Separator />

                    {/* Role selector */}
                    <div className="flex items-center gap-4">
                        <Label className="min-w-[80px]">Cargo:</Label>
                        <Select
                            value={member.role ?? "lawyer"}
                            onValueChange={(v) => updateRole.mutate({ userId: member.id, role: v })}
                            disabled={isMe}
                        >
                            <SelectTrigger className="w-48">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="admin">Administrador</SelectItem>
                                <SelectItem value="lawyer">Advogado(a)</SelectItem>
                                <SelectItem value="assistant">Assistente</SelectItem>
                            </SelectContent>
                        </Select>
                        {isMe && (
                            <span className="text-xs text-muted-foreground">Você não pode mudar seu próprio cargo</span>
                        )}
                    </div>

                    {/* Module permissions */}
                    {isLoading ? (
                        <div className="flex items-center gap-2 py-4">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm text-muted-foreground">Carregando permissões...</span>
                        </div>
                    ) : (
                        <div className="rounded-lg border border-border overflow-hidden">
                            <div className="grid grid-cols-[1fr_80px_80px] gap-2 px-4 py-2 bg-muted/50 text-xs font-semibold text-muted-foreground">
                                <span>Módulo</span>
                                <span className="text-center flex items-center justify-center gap-1">
                                    <Eye className="h-3 w-3" />
                                    Ver
                                </span>
                                <span className="text-center flex items-center justify-center gap-1">
                                    <Pencil className="h-3 w-3" />
                                    Editar
                                </span>
                            </div>
                            {Object.entries(MODULE_LABELS).map(([key, label]) => {
                                const perm = permissions?.find((p) => p.module === key);
                                const canView = perm?.can_view ?? false;
                                const canEdit = perm?.can_edit ?? false;
                                return (
                                    <div
                                        key={key}
                                        className="grid grid-cols-[1fr_80px_80px] gap-2 px-4 py-2.5 border-t border-border items-center"
                                    >
                                        <span className="text-sm">{label}</span>
                                        <div className="flex justify-center">
                                            <Switch
                                                checked={canView}
                                                onCheckedChange={() => handleToggle(key, "can_view", canView)}
                                                disabled={isMe || member.role === "admin"}
                                            />
                                        </div>
                                        <div className="flex justify-center">
                                            <Switch
                                                checked={canEdit}
                                                onCheckedChange={() => handleToggle(key, "can_edit", canEdit)}
                                                disabled={isMe || member.role === "admin"}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    {member.role === "admin" && !isMe && (
                        <p className="text-xs text-muted-foreground">
                            Administradores possuem acesso total. Mude o cargo para restringir.
                        </p>
                    )}
                </CardContent>
            )}
        </Card>
    );
}

const Equipe = () => {
    const { data: members, isLoading } = useTeamMembers();
    const inviteUser = useInviteUser();
    const syncProfiles = useSyncProfilesFromAuth();
    const [inviteOpen, setInviteOpen] = useState(false);
    const [inviteName, setInviteName] = useState("");
    const [inviteEmail, setInviteEmail] = useState("");

    const handleInvite = async () => {
        await inviteUser.mutateAsync({ email: inviteEmail, fullName: inviteName });
        setInviteName("");
        setInviteEmail("");
        setInviteOpen(false);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-24">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="ml-3 text-muted-foreground">Carregando equipe...</span>
            </div>
        );
    }

    return (
        <>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-3xl">
                <div className="flex items-end justify-between gap-3 flex-wrap">
                    <div>
                        <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">Equipe</h1>
                        <p className="mt-1 text-sm sm:text-base text-muted-foreground">
                            Gerencie os membros e defina o nível de acesso de cada um.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            onClick={() => syncProfiles.mutate()}
                            disabled={syncProfiles.isPending}
                            title="Sincronizar contas existentes no banco para visualizar quem tem conta e definir prioridades"
                        >
                            {syncProfiles.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Plus className="h-4 w-4" />
                            )}
                            <span className="ml-2 hidden sm:inline">Sincronizar contas</span>
                        </Button>
                        <Button onClick={() => setInviteOpen(true)}>
                            <UserPlus className="mr-2 h-4 w-4" />
                            Convidar
                        </Button>
                    </div>
                </div>

                {/* Team members list */}
                <div className="space-y-3">
                    {(members ?? []).map((member) => (
                        <MemberPermissions key={member.id} member={member} />
                    ))}
                </div>

                {members?.length === 0 && (
                    <Card className="flex flex-col items-center justify-center py-12 text-center">
                        <Users className="h-12 w-12 text-muted-foreground mb-3" />
                        <p className="text-lg font-medium">Nenhum membro na equipe</p>
                        <p className="text-sm text-muted-foreground mt-1">Convide os membros do seu escritório</p>
                    </Card>
                )}
            </motion.div>

            {/* Invite Dialog */}
            <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <UserPlus className="h-5 w-5 text-primary" />
                            Convidar Membro
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="inviteName">Nome completo</Label>
                            <Input
                                id="inviteName"
                                placeholder="Dra. Julia Pelicioni"
                                value={inviteName}
                                onChange={(e) => setInviteName(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="inviteEmail">Email</Label>
                            <Input
                                id="inviteEmail"
                                type="email"
                                placeholder="julia@escritorio.com.br"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                            />
                        </div>
                        <div className="rounded-lg border border-border p-3 bg-muted/30">
                            <p className="text-xs text-muted-foreground">
                                <Mail className="inline h-3 w-3 mr-1" />O membro receberá um email para confirmar a
                                conta e definir a senha. Após o cadastro, você poderá definir as permissões aqui.
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setInviteOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleInvite} disabled={inviteUser.isPending || !inviteEmail || !inviteName}>
                            {inviteUser.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Enviando...
                                </>
                            ) : (
                                <>
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Convidar
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default Equipe;
