import { SidebarProvider } from "../context/SidebarContext";
import { useSidebar } from "../context/sidebar";
import { Navigate, useNavigate } from "react-router";
import { useState, useEffect, Suspense, useRef } from "react";
import AppHeader from "./AppHeader";
import Backdrop from "./Backdrop";
import AppSidebar from "./AppSidebar";
import { DatabaseStatusBanner } from "../components/common/DatabaseStatusBanner";
import TopBanner from "../components/layout/TopBanner";
import { useSessionTimeout } from "../hooks/useSessionTimeout";
import { PageTitleProvider } from "../hooks/usePageTitle";
import { TabProvider } from "../context/TabContext";
import NavBar from "../components/navbar/NavBar";
import { useTabs } from "../context/tab";
import { resolveComponent } from "./routeComponents";
import PageLoader from "../components/ui/loader";

/**
 * Keep-alive outlet that renders every open tab simultaneously.
 *
 * - Active tab is visible; inactive tabs are hidden via `display: none`.
 * - Each tab's component stays mounted (state preserved) until explicitly closed.
 * - Tabs are lazy-mounted: the component mounts ONLY on first activation,
 *   then stays alive. No redundant API calls on tab switch.
 * - Each tab has its own `<Suspense>` boundary, so lazy-loading one tab
 *   does NOT show `PageLoader` for the entire layout.
 * - URL sync only fires when the URL actually differs, preventing
 *   cascading re-renders from React Router.
 */
const KeepAliveOutlet = () => {
  const { tabs, activeTabId } = useTabs();
  const navigate = useNavigate();
  const mountedTabsRef = useRef<Set<string>>(new Set());

  // Lazy-mount: mount tab ONLY when first activated (not when created)
  useEffect(() => {
    if (activeTabId) mountedTabsRef.current.add(activeTabId);
  }, [activeTabId]);

  // Cleanup: unmount tabs that have been closed
  useEffect(() => {
    mountedTabsRef.current.forEach((id) => {
      if (!tabs.some((t) => t.id === id)) {
        mountedTabsRef.current.delete(id);
      }
    });
  }, [tabs]);

  // Sync URL only when it actually differs from the active tab's path
  useEffect(() => {
    const activeTab = tabs.find((t) => t.id === activeTabId);
    if (activeTab && window.location.pathname !== activeTab.path) {
      navigate(activeTab.path, { replace: true });
    }
  }, [activeTabId, tabs, navigate]);

  if (tabs.length === 0) return <Navigate to="/dashboard" replace />;

  return (
    <>
      {tabs.map((tab) => {
        const resolved = resolveComponent(tab.path);
        if (!resolved) return null;
        const { component: Component } = resolved;
        const isActive = tab.id === activeTabId;
        return (
          <div
            key={tab.id}
            className={`h-full transition-opacity duration-100 ${isActive ? "opacity-100" : "opacity-0 invisible absolute inset-0 overflow-hidden"}`}
          >
            {mountedTabsRef.current.has(tab.id) && (
              <Suspense fallback={<PageLoader />}>
                <Component />
              </Suspense>
            )}
          </div>
        );
      })}
    </>
  );
};

const LayoutContent = () => {
  const { isExpanded, isMobileOpen } = useSidebar();
  const [isDesktop, setIsDesktop] = useState(true);
  useSessionTimeout();

  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-bg-dark">
      <TopBanner />
      <AppSidebar />
      <Backdrop />
      <div
        className="flex flex-col min-h-screen transition-all duration-300"
        style={{
          marginLeft: isMobileOpen
            ? 0
            : isDesktop
              ? isExpanded
                ? 280
                : 72
              : 0,
          paddingTop: "var(--banner-height, 0px)",
        }}
      >
        <DatabaseStatusBanner />
        <AppHeader />
        <NavBar />
        <main className="flex-1 mx-auto w-full max-w-(--breakpoint-1xl) p-4 pt-8 md:p-6 md:pt-10">
          <KeepAliveOutlet />
        </main>
      </div>
    </div>
  );
};

const AppLayout = () => (
  <TabProvider>
    <SidebarProvider>
      <PageTitleProvider>
        <LayoutContent />
      </PageTitleProvider>
    </SidebarProvider>
  </TabProvider>
);

export default AppLayout;
