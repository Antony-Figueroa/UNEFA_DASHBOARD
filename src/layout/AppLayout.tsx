import { SidebarProvider } from "../context/SidebarContext";
import { useSidebar } from "../context/sidebar";
import { Outlet } from "react-router";
import { useState, useEffect } from "react";
import AppHeader from "./AppHeader";
import Backdrop from "./Backdrop";
import AppSidebar from "./AppSidebar";
import { DatabaseStatusBanner } from "../components/common/DatabaseStatusBanner";
import TopBanner from "../components/layout/TopBanner";
import { useSessionTimeout } from "../hooks/useSessionTimeout";
import { PageTitleProvider } from "../hooks/usePageTitle";
import { OfflineIndicator } from "../components/common/OfflineIndicator";

const LayoutContent = () => {
  const { isExpanded, isMobileOpen } = useSidebar();
  const [isDesktop, setIsDesktop] = useState(true);
  useSessionTimeout();

  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-bg-dark">
      <TopBanner />
      <AppSidebar />
      <Backdrop />
      <OfflineIndicator variant="banner" />
      <div
        className="flex flex-col min-h-screen transition-all duration-300"
        style={{ 
          marginLeft: isMobileOpen ? 0 : (isDesktop ? (isExpanded ? 280 : 72) : 0),
          paddingTop: 'var(--banner-height, 0px)'
        }}
      >
        <DatabaseStatusBanner />
        <AppHeader />
        <main className="flex-1 mx-auto w-full max-w-(--breakpoint-1xl) p-4 pt-8 md:p-6 md:pt-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

const AppLayout = () => (
  <SidebarProvider>
    <PageTitleProvider>
      <LayoutContent />
    </PageTitleProvider>
  </SidebarProvider>
);

export default AppLayout;
