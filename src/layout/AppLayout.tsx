import { SidebarProvider } from "../context/SidebarContext";
import { useSidebar } from "../context/sidebar";
import { Navigate } from "react-router";
import { useState, useEffect, Suspense, useRef, memo } from "react";
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
 * Memoized wrapper for a single tab's content.
 *
 * Each tab is a separate `<div>` with CSS visibility toggling.
 * `React.memo` prevents inactive tabs from re-rendering when
 * the parent (KeepAliveOutlet) re-renders on tab switch.
 *
 * The component mounts on first activation (lazy-mount) and stays
 * alive until the tab is closed. API calls run only once.
 */
const TabContent = memo(function TabContent({
  path,
  isActive,
  isMounted,
}: {
  path: string;
  isActive: boolean;
  isMounted: boolean;
}) {
  const resolved = resolveComponent(path);
  if (!resolved) return null;
  const { component: Component } = resolved;

  return (
    <div
      className={`h-full transition-opacity duration-100 ${isActive ? "opacity-100" : "opacity-0 invisible absolute inset-0 overflow-hidden"}`}
    >
      {isMounted && (
        <Suspense fallback={<PageLoader />}>
          <Component />
        </Suspense>
      )}
    </div>
  );
});

/**
 * Keep-alive outlet that renders every open tab simultaneously.
 *
 * - Active tab is visible; inactive tabs are hidden via CSS opacity/invisible.
 * - Each tab's component stays mounted (state preserved) until explicitly closed.
 * - Tabs are lazy-mounted: the component mounts ONLY on first activation,
 *   then stays alive. No redundant API calls on tab switch.
 * - URL is synced via `history.replaceState()` (NOT React Router's `navigate()`)
 *   to avoid cascading re-renders through the Router tree.
 */
const KeepAliveOutlet = () => {
  const { tabs, activeTabId } = useTabs();
  const mountedTabsRef = useRef<Set<string>>(new Set());
  // Track synced URL to avoid redundant history.replaceState calls
  const lastSyncedPathRef = useRef<string>("");

  // Lazy-mount: mount tab ONLY when first activated (not when created)
  // Use a layout effect so it runs BEFORE the browser paints
  const prevActiveTabRef = useRef<string | null>(null);
  if (activeTabId && activeTabId !== prevActiveTabRef.current) {
    mountedTabsRef.current.add(activeTabId);
    prevActiveTabRef.current = activeTabId;
  }

  // Sync URL via history.replaceState to avoid React Router re-renders
  useEffect(() => {
    const activeTab = tabs.find((t) => t.id === activeTabId);
    if (activeTab && window.location.pathname !== activeTab.path) {
      if (lastSyncedPathRef.current !== activeTab.path) {
        lastSyncedPathRef.current = activeTab.path;
        window.history.replaceState(null, "", activeTab.path);
      }
    }
  }, [activeTabId, tabs]);

  // Redirect to dashboard if no tabs exist (e.g. last pinned closed)
  if (tabs.length === 0) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <>
      {tabs.map((tab) => (
        <TabContent
          key={tab.id}
          path={tab.path}
          isActive={tab.id === activeTabId}
          isMounted={mountedTabsRef.current.has(tab.id)}
        />
      ))}
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
