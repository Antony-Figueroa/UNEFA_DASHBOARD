import { useEffect, useRef, useState } from "react";
import { useSidebar } from "../context/sidebar";
import { useAuth } from "../context/auth";
import { useCommandPalette } from "../components/command-palette/CommandPaletteContext";
import { ThemeToggleButton } from "../components/common/ThemeToggleButton";
import NotificationDropdown from "../components/header/NotificationDropdown";
import UserDropdown from "../components/header/UserDropdown";
import { SearchIcon } from "../icons";

const AppHeader: React.FC = () => {
  const [isApplicationMenuOpen, setApplicationMenuOpen] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);
  const headerRef = useRef<HTMLElement>(null);
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const { open: openCommandPalette } = useCommandPalette();

  const { isMobileOpen, toggleSidebar, toggleMobileSidebar } = useSidebar();

  useEffect(() => {
    const handleResize = () => {
      if (headerRef.current) {
        setHeaderHeight(headerRef.current.offsetHeight);
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty("--header-height", `${headerHeight}px`);
    document.documentElement.style.setProperty("--header-spacing", `0px`);
  }, [headerHeight]);

  const handleToggle = () => {
    if (window.innerWidth >= 1024) {
      toggleSidebar();
    } else {
      toggleMobileSidebar();
    }
  };

  const toggleApplicationMenu = () => {
    setApplicationMenuOpen(!isApplicationMenuOpen);
  };

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        openCommandPalette();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [openCommandPalette]);

  const isHeaderTooTall = headerHeight > (typeof window !== "undefined" ? window.innerHeight * 0.3 : 0);

  return (
    <header
      ref={headerRef}
      className="sticky flex w-full bg-white border-b border-border-light/50 z-40 dark:border-white/5 dark:bg-bg-dark"
      style={{
        top: 'var(--banner-height, 0px)',
        marginBottom: 'var(--header-spacing)',
        maxHeight: isHeaderTooTall ? '30vh' : 'none',
        overflowY: isHeaderTooTall ? 'auto' : 'visible'
      }}
    >
      <div className="flex flex-col items-center justify-between grow lg:flex-row lg:px-6">
        <div className="flex items-center justify-between w-full gap-3 px-4 py-3 border-b border-border-light/50 dark:border-white/5 sm:gap-4 lg:justify-normal lg:border-b-0 lg:px-0 lg:py-3.5">
          <button
            className="flex items-center justify-center size-9 rounded-xl text-text-secondary border border-border-light/50 hover:bg-gray-50 hover:border-border-light transition-all duration-200 dark:border-white/10 dark:text-text-tertiary dark:hover:bg-white/5 dark:hover:border-white/20"
            onClick={handleToggle}
            aria-label="Toggle Sidebar"
          >
            {isMobileOpen ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            ) : (
              <svg width="18" height="14" viewBox="0 0 18 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M0 1h18M0 7h12M0 13h18" />
              </svg>
            )}
          </button>

          <button
            onClick={toggleApplicationMenu}
            className="flex items-center justify-center size-9 rounded-xl text-text-secondary hover:bg-gray-50 transition-all duration-200 dark:text-text-tertiary dark:hover:bg-white/5 lg:hidden"
            aria-label="Menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="5" cy="12" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="19" cy="12" r="2" />
            </svg>
          </button>

          <div className="hidden lg:block flex-1 max-w-md ml-5">
            <div className="relative">
              <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-text-tertiary pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Buscar..."
                className="h-10 w-full rounded-xl border border-border-light/50 bg-gray-50/50 py-2 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-300 focus:bg-white focus:ring-2 focus:ring-brand-500/10 transition-all duration-200 dark:border-white/10 dark:bg-white/3 dark:text-white dark:placeholder:text-white/30 dark:focus:border-brand-500 dark:focus:bg-white/5"
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden xl:inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-medium text-text-tertiary bg-white border border-border-light rounded dark:bg-white/5 dark:border-white/10">
                <span className="text-xs">⌘</span>K
              </kbd>
            </div>
          </div>
        </div>

        <div
          className={`${isApplicationMenuOpen ? "flex" : "hidden"} items-center justify-between w-full gap-3 px-4 py-3 lg:flex lg:gap-4 lg:px-0 lg:py-3.5 lg:w-auto`}
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggleButton />
            {isAuthenticated && <NotificationDropdown />}
          </div>

          <div className="h-8 w-px bg-border-light/50 dark:bg-white/10 hidden sm:block" />

          <UserDropdown />
        </div>
      </div>
    </header>
  );
};

export default AppHeader;