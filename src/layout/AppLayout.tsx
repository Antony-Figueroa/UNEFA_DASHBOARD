import { SidebarProvider } from "../context/SidebarContext";
import { useSidebar } from "../context/sidebar";
import { Outlet } from "react-router";
import AppHeader from "./AppHeader";
import Backdrop from "./Backdrop";
import AppSidebar from "./AppSidebar";
import { DatabaseStatusBanner } from "../components/common/DatabaseStatusBanner";
import TopBanner from "../components/layout/TopBanner";
import { useSessionTimeout } from "../hooks/useSessionTimeout";

const LayoutContent: React.FC = () => {
  const { isExpanded, isMobileOpen } = useSidebar();
  useSessionTimeout();

  return (
    <div
      className="min-h-screen bg-gray-50 dark:bg-bg-dark"
      style={{ paddingTop: 'var(--banner-height, 0px)' }}
    >
      <TopBanner />
      <div>
        <AppSidebar />
        <Backdrop />
      </div>
      <div
        className={`flex flex-col min-h-screen transition-all duration-300 ease-in-out ${isExpanded ? "lg:pl-72" : "lg:pl-[72px]"
          } ${isMobileOpen ? "pl-0" : ""}`}
      >
        <div
          className="sticky z-40"
          style={{ top: 'var(--banner-height, 0px)' }}
        >
          <DatabaseStatusBanner />
          <AppHeader />
        </div>
        <div className="flex-1 mx-auto w-full max-w-(--breakpoint-1xl) p-4 pt-8 md:p-6 md:pt-10">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

const AppLayout: React.FC = () => {
  return (
    <SidebarProvider>
      <LayoutContent />
    </SidebarProvider>
  );
};

export default AppLayout;
