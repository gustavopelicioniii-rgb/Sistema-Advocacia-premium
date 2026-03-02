import { motion } from "framer-motion";
import { Bell, Newspaper, FileText, CheckCircle2, Clock, MoreVertical, Check, Trash2, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useInbox, useMarkAsRead, useMarkAllAsRead } from "@/hooks/useInbox";
import { format, parseISO, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";
import { usePagination } from "@/hooks/usePagination";
import { TablePagination } from "@/components/ui/table-pagination";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const getIcon = (tipo: string) => {
    switch (tipo) {
        case "Publicação":
            return <Newspaper className="h-4 w-4" />;
        case "Andamento":
            return <Clock className="h-4 w-4" />;
        case "Documento":
            return <FileText className="h-4 w-4" />;
        case "Tarefa":
            return <CheckCircle2 className="h-4 w-4" />;
        default:
            return <Bell className="h-4 w-4" />;
    }
};

const getPriorityColor = (prioridade: string) => {
    switch (prioridade) {
        case "Urgente":
            return "destructive";
        case "Alta":
            return "secondary";
        case "Normal":
            return "secondary";
        default:
            return "outline";
    }
};

const Inbox = () => {
    const { user } = useAuth();
    const { data: items, isLoading } = useInbox();
    const markAsRead = useMarkAsRead();
    const markAllAsRead = useMarkAllAsRead();

    const unreadCount = items?.filter((i) => !i.lido).length ?? 0;
    const todayItems = items?.filter((i) => isToday(parseISO(i.created_at))) ?? [];
    const otherItems = items?.filter((i) => !isToday(parseISO(i.created_at))) ?? [];
    const hasToday = todayItems.length > 0;

    const olderList = hasToday ? otherItems : (items ?? []);
    const { page, pageCount, pageData: olderPage, totalItems: olderTotal, goTo } = usePagination(olderList, 20);

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="font-display text-3xl font-bold text-foreground">Caixa de Entrada Jurídica</h1>
                    <p className="mt-1 text-muted-foreground">
                        Novas publicações, andamentos, documentos recebidos e tarefas em um só lugar.
                    </p>
                </div>
                <div className="flex gap-2">
                    {unreadCount > 0 && (
                        <Button variant="outline" size="sm" onClick={() => user && markAllAsRead.mutate(user.id)}>
                            <Check className="mr-2 h-4 w-4" /> Marcar todos como lidos
                        </Button>
                    )}
                    <Button variant="outline" size="sm">
                        <Filter className="mr-2 h-4 w-4" /> Filtros
                    </Button>
                </div>
            </div>

            {hasToday && (
                <Card className="border-primary/20 bg-primary/[0.02]">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="font-display text-lg flex items-center gap-2">
                            📥 Atualizações hoje
                            <Badge variant="default">{todayItems.length}</Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {todayItems.map((item) => (
                            <div
                                key={item.id}
                                className={`flex items-start gap-4 rounded-lg border p-4 transition-all hover:bg-muted/50 group relative ${!item.lido ? "border-primary/30 bg-primary/[0.02]" : "border-border opacity-80"}`}
                                onClick={() => !item.lido && markAsRead.mutate(item.id)}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                        if (!item.lido) markAsRead.mutate(item.id);
                                    }
                                }}
                            >
                                <div
                                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${!item.lido ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
                                >
                                    {getIcon(item.tipo)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <p
                                            className={`text-sm font-semibold truncate ${!item.lido ? "text-foreground" : "text-muted-foreground"}`}
                                        >
                                            {item.titulo}
                                        </p>
                                        <Badge
                                            variant={getPriorityColor(item.prioridade)}
                                            className="text-[10px] uppercase"
                                        >
                                            {item.prioridade}
                                        </Badge>
                                        {!item.lido && <div className="h-2 w-2 rounded-full bg-primary" />}
                                    </div>
                                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{item.descricao}</p>
                                    <div className="flex items-center gap-3">
                                        <Badge variant="outline" className="text-[10px]">
                                            {item.tipo}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {format(parseISO(item.created_at), "HH:mm", { locale: ptBR })}
                                        </span>
                                    </div>
                                </div>
                                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => markAsRead.mutate(item.id)}>
                                                <Check className="mr-2 h-4 w-4" /> Marcar como lido
                                            </DropdownMenuItem>
                                            <DropdownMenuItem className="text-destructive">
                                                <Trash2 className="mr-2 h-4 w-4" /> Excluir
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="font-display text-xl flex items-center gap-2">
                        {hasToday ? "Outras atualizações" : "📥 Atualizações recentes"}
                        {unreadCount > 0 && (
                            <Badge variant="destructive" className="ml-2 animate-pulse">
                                {unreadCount} novas
                            </Badge>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                            <p>Carregando atualizações...</p>
                        </div>
                    ) : !items || items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                            <Bell className="h-12 w-12 mb-4 opacity-20" />
                            <p className="text-sm">Sua caixa de entrada está vazia.</p>
                            <p className="text-xs mt-1">Ótimo trabalho! Tudo sob controle.</p>
                        </div>
                    ) : (
                        <>
                            {olderPage.map((item) => (
                                <div
                                    key={item.id}
                                    className={`flex items-start gap-4 rounded-lg border p-4 transition-all hover:bg-muted/50 group relative ${!item.lido ? "border-primary/30 bg-primary/[0.02]" : "border-border opacity-80"}`}
                                    onClick={() => !item.lido && markAsRead.mutate(item.id)}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                            if (!item.lido) markAsRead.mutate(item.id);
                                        }
                                    }}
                                >
                                    <div
                                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${!item.lido ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
                                    >
                                        {getIcon(item.tipo)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <p
                                                className={`text-sm font-semibold truncate ${!item.lido ? "text-foreground" : "text-muted-foreground"}`}
                                            >
                                                {item.titulo}
                                            </p>
                                            <Badge
                                                variant={getPriorityColor(item.prioridade)}
                                                className="text-[10px] uppercase"
                                            >
                                                {item.prioridade}
                                            </Badge>
                                            {!item.lido && <div className="h-2 w-2 rounded-full bg-primary" />}
                                        </div>
                                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                                            {item.descricao}
                                        </p>
                                        <div className="flex items-center gap-3">
                                            <Badge variant="outline" className="text-[10px]">
                                                {item.tipo}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {format(parseISO(item.created_at), "dd 'de' MMMM 'às' HH:mm", {
                                                    locale: ptBR,
                                                })}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => markAsRead.mutate(item.id)}>
                                                    <Check className="mr-2 h-4 w-4" /> Marcar como lido
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive">
                                                    <Trash2 className="mr-2 h-4 w-4" /> Excluir
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            ))}
                            <TablePagination
                                page={page}
                                pageCount={pageCount}
                                totalItems={olderTotal}
                                pageSize={20}
                                onPageChange={goTo}
                            />
                        </>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default Inbox;
