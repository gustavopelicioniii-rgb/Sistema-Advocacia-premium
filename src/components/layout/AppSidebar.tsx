import { Link, useLocation } from "react-router-dom";
import {
    LayoutDashboard,
    Scale,
    FileText,
    Users,
    DollarSign,
    Settings,
    LogOut,
    Sparkles,
    Calendar,
    FolderOpen,
    Newspaper,
    BarChart3,
    Video,
    UsersRound,
    MessageCircle,
    Calculator,
    Inbox,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useMyPermissions } from "@/hooks/useTeam";
import { useGoogleCalendar } from "@/hooks/useGoogleCalendar";
import { useInbox } from "@/hooks/useInbox";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useMemo } from "react";
import { format } from "date-fns";

const mainNavItems: Array<{
    name: string;
    href: string;
    icon: React.ElementType;
    iconSrc?: string;
    badge?: boolean;
    useCount?: boolean;
    module?: string;
}> = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard, iconSrc: "/icons/dashboard.svg" },
    { name: "Processos", href: "/processos", icon: Scale, iconSrc: "/icons/scale.svg", module: "processos" },
    { name: "Agenda", href: "/agenda", icon: Calendar, useCount: true, module: "agenda" },
    { name: "Gerador de Peças", href: "/pecas", icon: FileText, badge: true, module: "pecas" },
    { name: "CRM", href: "/crm", icon: Users, module: "crm" },
    { name: "WhatsApp", href: "/whatsapp", icon: MessageCircle, iconSrc: "/icons/whatsapp.svg" },
    { name: "Financeiro", href: "/financeiro", icon: DollarSign, module: "financeiro" },
    { name: "Inbox", href: "/inbox", icon: Inbox, useCount: true },
];

const secondaryNav: Array<{
    name: string;
    href: string;
    icon: React.ElementType;
    iconSrc?: string;
    module?: string;
    adminOnly?: boolean;
}> = [
    { name: "Calculadora Jurídica", href: "/calculadora", icon: Calculator, iconSrc: "/icons/calculator.svg" },
    { name: "Documentos", href: "/documentos", icon: FolderOpen, module: "documentos" },
    { name: "Publicações", href: "/publicacoes", icon: Newspaper, module: "publicacoes" },
    { name: "Relatórios", href: "/relatorios", icon: BarChart3, module: "relatorios" },
    { name: "Equipe", href: "/equipe", icon: UsersRound, adminOnly: true },
    { name: "Configurações", href: "/configuracoes", icon: Settings, module: "configuracoes" },
];

function getMainNav(todayCount: number, inboxUnreadCount: number) {
    return mainNavItems.map((item) => {
        if ("useCount" in item && item.useCount) {
            const { useCount, ...rest } = item;
            if (item.name === "Inbox") return { ...rest, count: inboxUnreadCount };
            return { ...rest, count: todayCount };
        }
        return item;
    });
}

type NavItemType = {
    name: string;
    href: string;
    icon: React.ElementType;
    iconSrc?: string;
    badge?: boolean;
    count?: number;
    module?: string;
    adminOnly?: boolean;
};

const NavItem = ({ item, isActive }: { item: NavItemType; isActive: boolean }) => {
    const isWhatsApp = item.name.toLowerCase() === "whatsapp";

    return (
        <Link
            to={item.href}
            className={cn(
                "group flex items-center gap-3.5 rounded-xl px-3.5 py-3 text-sm font-medium transition-all duration-300 relative overflow-hidden",
                isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-md shadow-black/10"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/40 hover:text-sidebar-accent-foreground",
            )}
        >
            {/* Decorative indicator for active item */}
            {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-sidebar-primary" />
            )}

            {item.iconSrc ? (
                <img
                    src={item.iconSrc}
                    alt=""
                    className={cn(
                        "h-5 w-5 shrink-0 object-contain transition-all duration-300",
                        isActive ? "opacity-100 scale-110" : "opacity-60 group-hover:opacity-100",
                        // Força visibilidade no fundo escuro da sidebar (ícones de ferramentas)
                        !isWhatsApp && "brightness-0 invert opacity-80 group-hover:opacity-100",
                    )}
                    aria-hidden
                />
            ) : (
                <item.icon
                    className={cn(
                        "h-5 w-5 shrink-0 transition-all duration-300",
                        isActive
                            ? "text-sidebar-primary scale-110"
                            : "text-sidebar-foreground/60 group-hover:text-sidebar-accent-foreground",
                    )}
                />
            )}
            <span className="truncate transition-transform duration-300 group-hover:translate-x-0.5">{item.name}</span>
            {item.badge && <Sparkles className="ml-auto h-3.5 w-3.5 shrink-0 text-sidebar-primary animate-pulse" />}
            {item.count != null && item.count > 0 && (
                <span className="ml-auto flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-[10px] font-bold text-sidebar-primary-foreground px-1 shadow-sm">
                    {item.count}
                </span>
            )}
        </Link>
    );
};

const AppSidebar = () => {
    const location = useLocation();
    const { user, role, signOut } = useAuth();
    const { data: profile } = useProfile();
    const { isAdmin, byModule } = useMyPermissions();
    const { events: gcalEvents } = useGoogleCalendar();
    const { data: inboxItems } = useInbox();
    const todayCount = useMemo(() => {
        const todayStr = format(new Date(), "yyyy-MM-dd");
        return (gcalEvents ?? []).filter((e) => {
            const start = e.start?.dateTime || e.start?.date;
            if (!start) return false;
            const d = new Date(start);
            return format(d, "yyyy-MM-dd") === todayStr;
        }).length;
    }, [gcalEvents]);
    const inboxUnreadCount = useMemo(() => (inboxItems ?? []).filter((i) => !i.lido).length, [inboxItems]);

    const mainNav = useMemo(() => {
        const list = getMainNav(todayCount, inboxUnreadCount);
        return list.filter((item) => {
            if ("adminOnly" in item && item.adminOnly && !isAdmin) return false;
            if ("module" in item && item.module && !byModule(item.module).can_view) return false;
            return true;
        });
    }, [todayCount, inboxUnreadCount, isAdmin, byModule]);

    const secondaryNavFiltered = useMemo(() => {
        return secondaryNav.filter((item) => {
            if (item.adminOnly && !isAdmin) return false;
            if (item.module && !byModule(item.module).can_view) return false;
            return true;
        });
    }, [isAdmin, byModule]);

    const isActive = (href: string) => (href === "/" ? location.pathname === "/" : location.pathname.startsWith(href));

    const displayName = profile?.full_name || user?.email?.split("@")[0] || "Usuário";
    const initials = displayName
        .split(" ")
        .map((w) => w.charAt(0).toUpperCase())
        .slice(0, 2)
        .join("");

    return (
        <aside className="fixed inset-y-0 left-0 z-50 flex w-[272px] flex-col bg-sidebar border-r border-sidebar-border shadow-2xl shadow-black/20">
            {/* Logo Section */}
            <div className="flex h-24 items-center gap-3 px-6 border-b border-sidebar-border bg-gradient-to-b from-black/20 to-transparent">
                {profile?.firm_logo_url ? (
                    <div className="flex items-center justify-center w-full p-2 bg-white/[0.03] rounded-xl border border-white/5 backdrop-blur-sm shadow-inner overflow-hidden min-h-[60px]">
                        <img
                            src={profile.firm_logo_url}
                            alt="Logo do escritório"
                            className="h-auto max-h-[50px] w-auto max-w-full object-contain transition-transform duration-300 hover:scale-105"
                        />
                    </div>
                ) : (
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-sidebar-primary to-sidebar-primary/80 shadow-lg shadow-sidebar-primary/20">
                            <Scale className="h-6 w-6 text-sidebar-primary-foreground" />
                        </div>
                        <div>
                            <h1 className="font-display text-xl font-black tracking-tight text-white leading-tight">
                                Smart<span className="text-sidebar-primary">Case</span>
                                <span className="block text-[10px] uppercase tracking-[0.2em] font-medium text-sidebar-foreground/40">
                                    Mate Advisor
                                </span>
                            </h1>
                        </div>
                    </div>
                )}
            </div>

            {/* Main Navigation */}
            <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-8 custom-scrollbar">
                <div className="space-y-1.5">
                    <p className="px-4 mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-sidebar-foreground/70">
                        Principal
                    </p>
                    {mainNav.map((item) => (
                        <NavItem key={item.name} item={item} isActive={isActive(item.href)} />
                    ))}
                </div>

                <div className="space-y-1.5">
                    <p className="px-4 mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-sidebar-foreground/70">
                        Ferramentas
                    </p>
                    {secondaryNavFiltered.map((item) => (
                        <NavItem key={item.name} item={item} isActive={isActive(item.href)} />
                    ))}
                </div>

                <div className="px-3.5 pt-3">
                    <ThemeToggle />
                </div>
            </nav>

            {/* Footer */}
            <div className="border-t border-sidebar-border p-4">
                <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sidebar-accent text-xs font-semibold text-sidebar-accent-foreground">
                        {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-sidebar-accent-foreground truncate">{displayName}</p>
                        <p className="text-xs text-sidebar-foreground/80 truncate">
                            {role === "admin" ? "Administrador" : "Advogado"}
                        </p>
                    </div>
                    <button
                        onClick={signOut}
                        className="text-sidebar-foreground hover:text-sidebar-accent-foreground"
                        title="Sair"
                    >
                        <LogOut className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default AppSidebar;
