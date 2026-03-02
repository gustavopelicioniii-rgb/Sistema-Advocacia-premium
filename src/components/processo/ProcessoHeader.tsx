import { ArrowLeft, Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";

interface Processo {
    number: string;
    status: string;
    client: string;
    court: string;
}

interface Props {
    processo: Processo;
    onNewAndamento: () => void;
    onOpenStatus: () => void;
}

export function ProcessoHeader({ processo, onNewAndamento, onOpenStatus }: Props) {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex items-center gap-2 min-w-0 flex-1">
                <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    onClick={() => navigate("/processos")}
                    aria-label="Voltar para processos"
                >
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <h1 className="font-display text-xl sm:text-2xl font-bold truncate">{processo.number}</h1>
                        <Badge variant={processo.status === "Concluído" ? "secondary" : "default"} className="shrink-0">
                            {processo.status}
                        </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                        {processo.client} • {processo.court}
                    </p>
                </div>
            </div>
            <div className="flex gap-2 shrink-0 flex-wrap">
                <Button variant="outline" size="sm" onClick={onNewAndamento}>
                    <Plus className="mr-2 h-4 w-4" /> Novo Andamento
                </Button>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button size="sm">Ações do Processo</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={onOpenStatus}>
                            <Pencil className="mr-2 h-4 w-4" /> Alterar status
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}
