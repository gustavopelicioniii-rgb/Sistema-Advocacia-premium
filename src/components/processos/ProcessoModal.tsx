import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
    useCreateProcesso,
    useUpdateProcesso,
    useProcessPlanLimit,
    type Processo,
    type ProcessoInsert,
} from "@/hooks/useProcessos";
import { useAuth } from "@/contexts/AuthContext";
import { useTeamMembers } from "@/hooks/useTeam";

interface ProcessoModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    processo?: Processo | null; // If provided, we are editing
}

const emptyForm: ProcessoInsert = {
    number: "",
    client: "",
    court: "",
    class: "",
    subject: "",
    active_party: "",
    passive_party: "",
    responsible: "",
    phase: "",
    status: "Em andamento",
    next_deadline: null,
    last_movement: "",
    value: 0,
    docs_count: 0,
    owner_id: null,
};

export default function ProcessoModal({ open, onOpenChange, processo }: ProcessoModalProps) {
    const { user } = useAuth();
    const createMutation = useCreateProcesso();
    const updateMutation = useUpdateProcesso();
    const { limit, currentCount, atLimit } = useProcessPlanLimit();
    const { data: teamMembers } = useTeamMembers();
    const isEditing = !!processo;

    const [form, setForm] = useState<ProcessoInsert>(
        processo
            ? {
                  number: processo.number,
                  client: processo.client,
                  court: processo.court,
                  class: processo.class,
                  subject: processo.subject,
                  active_party: processo.active_party,
                  passive_party: processo.passive_party,
                  responsible: processo.responsible,
                  phase: processo.phase,
                  status: processo.status,
                  next_deadline: processo.next_deadline,
                  last_movement: processo.last_movement,
                  value: processo.value,
                  docs_count: processo.docs_count,
                  owner_id: processo.owner_id,
              }
            : { ...emptyForm, owner_id: user?.id ?? null },
    );

    const set = (field: keyof ProcessoInsert, value: ProcessoInsert[keyof ProcessoInsert]) =>
        setForm((prev) => ({ ...prev, [field]: value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!form.client || !form.court) return;

        if (isEditing && processo) {
            await updateMutation.mutateAsync({ id: processo.id, ...form });
        } else {
            await createMutation.mutateAsync(form);
        }
        onOpenChange(false);
    };

    const isPending = createMutation.isPending || updateMutation.isPending;

    // Build team member options for responsible dropdown
    const memberOptions = (teamMembers ?? [])
        .filter((m) => m.full_name)
        .map((m) => ({
            value: m.full_name!,
            label: m.full_name!,
            role: m.role,
        }));

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className="max-w-2xl max-h-[90vh] overflow-y-auto"
                onInteractOutside={(e) => e.preventDefault()}
                onPointerDownOutside={(e) => e.preventDefault()}
            >
                <DialogHeader>
                    <DialogTitle className="font-display text-xl">
                        {isEditing ? "Editar Processo" : "Novo Processo"}
                    </DialogTitle>
                    {!isEditing && (
                        <p className="text-sm text-muted-foreground">
                            Processos no plano: {currentCount} / {limit}
                            {atLimit && " — Limite atingido. Atualize o plano para cadastrar mais."}
                        </p>
                    )}
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="number">Numero do Processo</Label>
                            <Input
                                id="number"
                                placeholder="0012345-67.2024.8.26.0100 (opcional)"
                                value={form.number}
                                onChange={(e) => set("number", e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="client">Cliente *</Label>
                            <Input
                                id="client"
                                placeholder="Nome do cliente"
                                value={form.client}
                                onChange={(e) => set("client", e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="court">Tribunal *</Label>
                            <Input
                                id="court"
                                placeholder="TJ-SP, TRT-2, STJ..."
                                value={form.court}
                                onChange={(e) => set("court", e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="class">Classe Processual</Label>
                            <Input
                                id="class"
                                placeholder="Procedimento Comum Cível"
                                value={form.class}
                                onChange={(e) => set("class", e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="subject">Assunto</Label>
                        <Input
                            id="subject"
                            placeholder="Indenização por Danos Morais"
                            value={form.subject}
                            onChange={(e) => set("subject", e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="active_party">Parte Ativa (Autor)</Label>
                            <Input
                                id="active_party"
                                placeholder="Nome do autor"
                                value={form.active_party}
                                onChange={(e) => set("active_party", e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="passive_party">Parte Passiva (Réu)</Label>
                            <Input
                                id="passive_party"
                                placeholder="Nome do réu"
                                value={form.passive_party}
                                onChange={(e) => set("passive_party", e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Advogado(a) Responsável</Label>
                            <Select value={form.responsible} onValueChange={(v) => set("responsible", v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione o responsável" />
                                </SelectTrigger>
                                <SelectContent>
                                    {memberOptions.map((m) => (
                                        <SelectItem key={m.value} value={m.value}>
                                            {m.label}
                                            {m.role === "admin" ? " (Admin)" : ""}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phase">Fase Processual</Label>
                            <Input
                                id="phase"
                                placeholder="Instrução, Recurso, Execução..."
                                value={form.phase}
                                onChange={(e) => set("phase", e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select value={form.status} onValueChange={(v) => set("status", v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Em andamento">Em andamento</SelectItem>
                                    <SelectItem value="Aguardando prazo">Aguardando prazo</SelectItem>
                                    <SelectItem value="Concluído">Concluído</SelectItem>
                                    <SelectItem value="Suspenso">Suspenso</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="next_deadline">Próximo Prazo</Label>
                            <Input
                                id="next_deadline"
                                type="date"
                                value={form.next_deadline ?? ""}
                                onChange={(e) => set("next_deadline", e.target.value || null)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="value">Valor da Causa (R$)</Label>
                            <Input
                                id="value"
                                type="number"
                                step="0.01"
                                placeholder="0,00"
                                value={form.value}
                                onChange={(e) => set("value", parseFloat(e.target.value) || 0)}
                            />
                            <p className="text-xs text-muted-foreground">
                                Valor em discussão no processo. Os honorários (valores cobrados ao cliente) são
                                registrados em Financeiro.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="last_movement">Última Movimentação</Label>
                        <Textarea
                            id="last_movement"
                            placeholder="Descreva a última movimentação do processo..."
                            value={form.last_movement}
                            onChange={(e) => set("last_movement", e.target.value)}
                            rows={2}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isPending || (!isEditing && atLimit)}>
                            {isPending ? "Salvando..." : isEditing ? "Salvar Alterações" : "Criar Processo"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
