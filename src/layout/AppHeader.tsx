import { useEffect, useRef, useState } from "react";
import { useSidebar } from "../context/sidebar";
import { useAuth } from "../context/auth";
import { useCommandPalette } from "../components/command-palette/CommandPaletteContext";
import { ThemeToggleButton } from "../components/common/ThemeToggleButton";
import NotificationDropdown from "../components/header/NotificationDropdown";
import UserDropdown from "../components/header/UserDropdown";
import { SearchIcon } from "../icons";
import { usePeriods } from "../features/periods/hooks/usePeriods";
import { useMemo } from "react";
import { Tooltip } from "../components/ui/tooltip/Tooltip";

const AppHeader: React.FC = () => {
  const [isApplicationMenuOpen, setApplicationMenuOpen] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);
  const headerRef = useRef<HTMLElement>(null);
  const { user } = useAuth();
  const { periodos } = usePeriods();
  const isAuthenticated = !!user;
  const { open: openCommandPalette } = useCommandPalette();

  const currentPeriod = useMemo(() => {
    if (!periodos || periodos.length === 0) return null;
    return periodos.find(p => p.periodStatus === 2 && p.status) || null;
  }, [periodos]);

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
            <div className="relative flex items-center gap-3">
              <div className="relative flex-1">
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

              {/* Indicador de período actual */}
              {currentPeriod && (
                <Tooltip
                  content={
                    <div className="px-1">
                      <p className="font-bold text-sm">{currentPeriod.description}</p>
                      <div className="flex items-center gap-1.5 mt-1.5 pt-1.5 border-t border-white/20">
                        <svg className="w-3.5 h-3.5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                        </svg>
                        <span className="text-xs opacity-90">
                          {new Date(currentPeriod.startDate).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' })}
                          {' → '}
                          {new Date(currentPeriod.endDate).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                  }
                >
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-success-50/60 dark:bg-success-500/10 border border-success-200/40 dark:border-success-500/20 shrink-0 cursor-default select-none">
                    <div className="relative flex items-center justify-center w-4 h-4 rounded-full bg-success-500">
                      <span className="absolute -inset-0 rounded-full bg-success-400 animate-ping opacity-50" />
                      <span className="w-1 h-1 rounded-full bg-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-bold uppercase tracking-widest text-success-600 dark:text-success-400 leading-none whitespace-nowrap">Período</p>
                      <p className="text-[11px] font-semibold text-text-primary dark:text-white mt-0.5 truncate leading-tight whitespace-nowrap">
                        {currentPeriod.description}
                      </p>
                    </div>
                  </div>
                </Tooltip>
              )}
            </div>
          </div>

          {/* Versión móvil: buscar y período en la misma línea */}
          <div className="flex lg:hidden items-center gap-2 flex-1">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-text-tertiary pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar..."
                className="h-10 w-full rounded-xl border border-border-light/50 bg-gray-50/50 py-2 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-brand-300 focus:bg-white focus:ring-2 focus:ring-brand-500/10 transition-all duration-200 dark:border-white/10 dark:bg-white/3 dark:text-white dark:placeholder:text-white/30 dark:focus:border-brand-500 dark:focus:bg-white/5"
              />
            </div>

            {/* Indicador de período actual - móvil */}
            {currentPeriod && (
              <div
                className="flex items-center gap-1.5 px-2.5 py-2 rounded-lg bg-success-50/60 dark:bg-success-500/10 border border-success-200/40 dark:border-success-500/20 shrink-0 cursor-default"
                title={`${currentPeriod.description} (${new Date(currentPeriod.startDate).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' })} - ${new Date(currentPeriod.endDate).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' })})`}
              >
                <div className="relative flex items-center justify-center w-3.5 h-3.5 rounded-full bg-success-500">
                  <span className="absolute -inset-0 rounded-full bg-success-400 animate-ping opacity-50" />
                  <span className="w-1 h-1 rounded-full bg-white" />
                </div>
                <span className="text-[10px] font-semibold text-success-600 dark:text-success-400 whitespace-nowrap">
                  {currentPeriod.description}
                </span>
              </div>
            )}
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