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
  const { isExpanded, isHovered, isMobileOpen } = useSidebar();
  useSessionTimeout();

  return (
    <div className="min-h-screen xl:flex">
      <div>
        <AppSidebar />
        <Backdrop />
      </div>
      <div
        className={`flex-1 transition-all duration-300 ease-in-out ${isExpanded || isHovered ? "lg:ml-72.5" : "lg:ml-22.5"
          } ${isMobileOpen ? "ml-0" : ""}`}
      >
        <TopBanner />
        <div className="sticky top-0 z-9999">
          <DatabaseStatusBanner />
          <AppHeader />
        </div>
        <div className="mx-auto max-w-(--breakpoint-2xl) p-4 pt-24 md:p-6 md:pt-28">
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
