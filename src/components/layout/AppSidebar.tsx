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
                "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition-all duration-300 relative",
                isActive
                    ? "bg-white text-[#001D4A] shadow-[0_4px_20px_rgba(0,0,0,0.05)]"
                    : "text-foreground/50 hover:text-[#001D4A] hover:bg-white/40",
            )}
        >
            {/* Indicator */}
            {isActive && <div className="absolute left-[-16px] h-8 w-1.5 rounded-r-xl bg-[#001D4A]" />}

            <div
                className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-300",
                    isActive ? "bg-[#D9E2F2]" : "bg-transparent group-hover:bg-white/50",
                )}
            >
                {item.iconSrc ? (
                    <img
                        src={item.iconSrc}
                        alt=""
                        className={cn(
                            "h-5 w-5 shrink-0 object-contain transition-all duration-300",
                            isActive ? "opacity-100 scale-110" : "opacity-40 group-hover:opacity-100",
                            !isWhatsApp && "brightness-0 opacity-80 group-hover:opacity-100",
                        )}
                        aria-hidden
                    />
                ) : (
                    <item.icon
                        className={cn(
                            "h-5 w-5 shrink-0 transition-all duration-300",
                            isActive ? "text-[#001D4A] scale-110" : "text-foreground/30 group-hover:text-[#001D4A]",
                        )}
                    />
                )}
            </div>

            <span className="truncate">{item.name}</span>

            {item.badge && <Sparkles className="ml-auto h-4 w-4 shrink-0 text-amber-500 animate-pulse" />}
            {item.count != null && item.count > 0 && (
                <span className="ml-auto flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[#001D4A] text-[10px] font-bold text-white px-1">
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
        <aside className="fixed left-0 top-0 bottom-0 z-50 flex w-[280px] flex-col glass rounded-none border-none transition-all duration-500">
            {/* Logo Section */}
            <div className="flex h-28 items-center gap-4 px-8 border-b border-black/[0.02]">
                {profile?.firm_logo_url ? (
                    <div className="flex items-center justify-center w-full p-3 glass-card rounded-[24px] border-white/20 shadow-none overflow-hidden min-h-[60px]">
                        <img
                            src={profile.firm_logo_url}
                            alt="Logo do escritório"
                            className="h-auto max-h-[45px] w-auto max-w-full object-contain transition-transform duration-500 hover:scale-110"
                        />
                    </div>
                ) : (
                    <div className="flex items-center gap-4">
                        <div className="flex h-11 w-11 items-center justify-center rounded-[16px] bg-[#001D4A] shadow-xl shadow-[#001D4A]/10 transition-transform hover:rotate-3">
                            <Scale className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h1 className="font-sans text-lg font-bold tracking-tighter text-[#001D4A] leading-none">
                                Smart<span className="text-primary">Case</span>
                                <span className="block text-[8px] uppercase tracking-[0.4em] font-bold text-[#001D4A]/20 mt-1.5">
                                    Adviser Premium
                                </span>
                            </h1>
                        </div>
                    </div>
                )}
            </div>

            {/* Main Navigation */}
            <nav className="flex-1 overflow-y-auto px-4 py-8 space-y-10 custom-scrollbar">
                <div className="space-y-3">
                    <p className="px-4 mb-4 text-[11px] font-bold uppercase tracking-[0.25em] text-foreground/20">
                        Principal
                    </p>
                    <div className="space-y-1">
                        {mainNav.map((item) => (
                            <NavItem key={item.name} item={item} isActive={isActive(item.href)} />
                        ))}
                    </div>
                </div>

                <div className="space-y-3">
                    <p className="px-4 mb-4 text-[11px] font-bold uppercase tracking-[0.25em] text-foreground/20">
                        Ferramentas
                    </p>
                    <div className="space-y-1">
                        {secondaryNavFiltered.map((item) => (
                            <NavItem key={item.name} item={item} isActive={isActive(item.href)} />
                        ))}
                    </div>
                </div>

                <div className="px-4 pt-4">
                    <ThemeToggle />
                </div>
            </nav>

            {/* Footer Profile Section */}
            <div className="p-6">
                <div className="flex items-center gap-3 bg-white/60 rounded-[28px] p-3 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-white/20 transition-all hover:scale-[1.02] hover:bg-white/80">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#001D4A] text-sm font-bold text-white shadow-lg shadow-[#001D4A]/20">
                        {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[#001D4A] truncate">{displayName}</p>
                        <p className="text-[10px] font-bold text-foreground/30 truncate uppercase tracking-widest">
                            {role === "admin" ? "Administrador" : "Advogado"}
                        </p>
                    </div>
                    <button
                        onClick={signOut}
                        className="p-2.5 rounded-xl text-foreground/30 hover:text-[#001D4A] hover:bg-white transition-all shadow-none hover:shadow-sm"
                        title="Sair"
                    >
                        <LogOut className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default AppSidebar;
