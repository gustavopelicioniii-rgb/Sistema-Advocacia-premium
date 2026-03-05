import { Outlet } from "react-router-dom";
import AppSidebar from "./AppSidebar";
import MobileHeader from "./MobileHeader";
import MobileBottomNav from "./MobileBottomNav";
import PermissionRedirect from "@/components/PermissionRedirect";

const AppLayout = () => {
    return (
        <div className="min-h-screen bg-background w-full relative">
            <div className="liquid-bg pointer-events-none" />

            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            >
                Pular para o conteúdo
            </a>
            {/* Desktop sidebar — hidden on mobile */}
            <div className="hidden lg:block shrink-0">
                <AppSidebar />
            </div>

            {/* Mobile header — hidden on desktop */}
            <MobileHeader />

            {/* Main content — min-w-0 + overflow-x-hidden evitam barra de rolagem horizontal */}
            <main id="main-content" className="min-w-0 w-full overflow-x-hidden lg:pl-[280px]" tabIndex={-1}>
                <PermissionRedirect />
                <div className="w-full min-w-0 max-w-full p-4 pb-20 lg:px-10 lg:py-8 lg:pb-0 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))]">
                    <Outlet />
                </div>
            </main>

            {/* Mobile bottom nav — hidden on desktop */}
            <MobileBottomNav />
        </div>
    );
};

export default AppLayout;
