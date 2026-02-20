import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";
import { useAuth } from "../context/auth";
import {
  BoxCubeIcon,
  ChevronDownIcon,
  GridIcon,
  HorizontaLDots,
  PieChartIcon,
  PlugInIcon,
  TableIcon,
  UserCircleIcon,
  DocsIcon,
  SparklesIcon,
} from "../icons";
import { useSidebar } from "../context/sidebar";
import PeriodStatusCard from "../components/Sidebar/PeriodStatusCard";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  roles?: number[];
  badge?: string | number;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean; roles?: number[]; badge?: string | number }[];
};

const navItems: NavItem[] = [
  {
    icon: <GridIcon />,
    name: "Inicio",
    path: "/dashboard",
  },
  {
    name: "Panel de Tutor",
    icon: <UserCircleIcon />,
    roles: [3],
    subItems: [
      { name: "Dashboard", path: "/tutor" },
      { name: "Mis Estudiantes", path: "/tutor/students" },
      { name: "Seguimiento", path: "/tutor/tracking" },
      { name: "Cargar Notas", path: "/tutor/grades" },
      { name: "Reportes", path: "/tutor/reports" },
      { name: "Mi Perfil", path: "/tutor/profile" },
    ],
  },
  {
    name: "Panel de Estudiante",
    icon: <UserCircleIcon />,
    roles: [4],
    subItems: [
      { name: "Dashboard", path: "/student" },
      { name: "Mis Solicitudes", path: "/student/requests" },
      { name: "Mis Evaluaciones", path: "/student/evaluations" },
      { name: "Mi Perfil", path: "/student/profile" },
    ],
  },
  {
    name: "Académico",
    icon: <TableIcon />,
    roles: [0, 1, 2],
    subItems: [
      { name: "Período", path: "/period" },
      { name: "Carreras", path: "/careers" },
    ],
  },
  {
    name: "Registros",
    icon: <UserCircleIcon />,
    roles: [0, 1, 2],
    subItems: [
      { name: "Estudiantes", path: "/students" },
      { name: "Tutores", path: "/tutors" },
      { name: "Instituciones", path: "/institutions" },
    ],
  },
  {
    name: "Prácticas",
    icon: <BoxCubeIcon />,
    roles: [0, 1, 2],
    subItems: [
      { name: "Pre-Inscripción", path: "/pre-enrollment" },
      { name: "Inscripción", path: "/enrollment" },
      { name: "Seguimiento", path: "/tracking" },
      { name: "Evaluaciones", path: "/evaluations" },
      { name: "Culminación", path: "/culmination" },
    ],
  },
  {
    name: "Solicitudes",
    icon: <DocsIcon />,
    roles: [0, 1, 2],
    path: "/admin/requests",
  },
  {
    name: "Reportes",
    icon: <PieChartIcon />,
    roles: [0, 1, 2],
    path: "/reports",
  },
  {
    name: "Configuración",
    icon: <PlugInIcon />,
    roles: [0, 1],
    subItems: [
      { name: "Usuarios", path: "/configure/users" },
      { name: "Listas", path: "/configure/lists" },
      { name: "Registro", path: "/configure/logs" },
      { name: "Roles y Permisos", path: "/configure/roles" },
      { name: "Mantenimiento", path: "/configure/maintenance" },
      { name: "Respaldos", path: "/configure/backups" },
    ],
  },
  {
    icon: <SparklesIcon />,
    name: "IA",
    path: "/ai-assistant",
  },
  {
    icon: <DocsIcon />,
    name: "Manuales",
    path: "/manuals",
  },
];

const COLLAPSED_WIDTH = 72;
const EXPANDED_WIDTH = 288;

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, setIsMobileOpen } = useSidebar();
  const { user } = useAuth();
  const location = useLocation();

  const [openSubmenus, setOpenSubmenus] = useState<Set<string>>(new Set());
  const [hoveredMenu, setHoveredMenu] = useState<string | null>(null);
  const [isHoveringSidebar, setIsHoveringSidebar] = useState(false);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sidebarRef = useRef<HTMLElement>(null);

  const filteredNavItems = navItems.filter(item => {
    if (item.roles && user && !item.roles.includes(user.role)) return false;
    return true;
  }).map(item => ({
    ...item,
    subItems: item.subItems?.filter(sub => {
      if (sub.roles && user && !sub.roles.includes(user.role)) return false;
      return true;
    })
  }));

  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname]
  );

  const hasActiveSubItem = useCallback(
    (nav: NavItem) => {
      if (!nav.subItems) return false;
      return nav.subItems.some((subItem) => isActive(subItem.path));
    },
    [isActive]
  );

  useEffect(() => {
    const openMenus = new Set<string>();
    filteredNavItems.forEach((nav) => {
      if (nav.subItems && hasActiveSubItem(nav)) {
        openMenus.add(nav.name);
      }
    });
    setOpenSubmenus(openMenus);
  }, [location.pathname, hasActiveSubItem, filteredNavItems]);

  const handleSubmenuToggle = (menuName: string) => {
    setOpenSubmenus(prev => {
      const next = new Set(prev);
      if (next.has(menuName)) {
        next.delete(menuName);
      } else {
        next.add(menuName);
      }
      return next;
    });
  };

  const handleMouseEnter = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setIsHoveringSidebar(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHoveringSidebar(false);
      setHoveredMenu(null);
    }, 150);
  }, []);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const showExpanded = isExpanded || isHoveringSidebar || isMobileOpen;
  const sidebarWidth = showExpanded ? EXPANDED_WIDTH : COLLAPSED_WIDTH;

  const MenuItem: React.FC<{
    item: NavItem;
    isCollapsed: boolean;
    forceShowSubmenu?: boolean;
    onHover?: (name: string | null) => void;
    isHovered?: boolean;
  }> = ({ item, isCollapsed, forceShowSubmenu = false, onHover, isHovered }) => {
    const hasSubmenu = item.subItems && item.subItems.length > 0;
    const isSubmenuOpen = openSubmenus.has(item.name) || forceShowSubmenu;
    const hasActiveChild = hasActiveSubItem(item);
    const isDirectActive = item.path ? isActive(item.path) : false;

    if (isCollapsed && hasSubmenu) {
      return (
        <div 
          className="relative"
          onMouseEnter={() => onHover?.(item.name)}
          onMouseLeave={() => onHover?.(null)}
        >
          <button
            className={`group relative flex items-center justify-center w-full gap-3 px-3 py-2.5 rounded-xl text-theme-sm font-medium transition-all duration-200 ${
              hasActiveChild
                ? "bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400"
                : "text-text-secondary hover:bg-gray-50/70 hover:text-text-primary dark:text-text-tertiary dark:hover:bg-white/[0.03] dark:hover:text-white"
            }`}
            title={item.name}
          >
            <span className={`shrink-0 ${
              hasActiveChild
                ? "text-brand-500"
                : "text-text-tertiary group-hover:text-text-primary dark:group-hover:text-white"
            }`}>
              {item.icon}
            </span>
          </button>

          {isHovered && (
            <div 
              className="absolute left-full top-0 ml-2 w-56 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-border-light/50 dark:border-white/10 z-[60] overflow-hidden"
              style={{ marginTop: '-4px' }}
            >
              <div className="py-2">
                <div className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-text-tertiary border-b border-border-light/50 dark:border-white/5">
                  {item.name}
                </div>
                <ul className="py-1">
                  {item.subItems?.map((subItem) => (
                    <li key={subItem.name}>
                      <Link
                        to={subItem.path}
                        onClick={() => setIsMobileOpen(false)}
                        className={`flex items-center gap-2 px-4 py-2 text-theme-sm transition-all duration-200 ${
                          isActive(subItem.path)
                            ? "text-brand-600 bg-brand-50 dark:text-brand-400 dark:bg-brand-900/30"
                            : "text-text-secondary hover:text-text-primary hover:bg-gray-50 dark:text-text-tertiary dark:hover:text-white dark:hover:bg-white/[0.03]"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          isActive(subItem.path)
                            ? "bg-brand-500"
                            : "bg-text-tertiary/40"
                        }`} />
                        <span className="truncate">{subItem.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (hasSubmenu) {
      return (
        <div>
          <button
            onClick={() => handleSubmenuToggle(item.name)}
            className={`group relative flex items-center w-full gap-3 px-3 py-2.5 rounded-xl text-theme-sm font-medium transition-all duration-200 ${
              hasActiveChild
                ? "bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400"
                : isSubmenuOpen
                ? "bg-gray-50 text-text-primary dark:bg-white/5 dark:text-white"
                : "text-text-secondary hover:bg-gray-50/70 hover:text-text-primary dark:text-text-tertiary dark:hover:bg-white/[0.03] dark:hover:text-white"
            }`}
            title={isCollapsed ? item.name : undefined}
          >
            <span className={`shrink-0 transition-colors duration-200 ${
              hasActiveChild
                ? "text-brand-500"
                : isSubmenuOpen
                ? "text-text-primary dark:text-white"
                : "text-text-tertiary group-hover:text-text-primary dark:group-hover:text-white"
            }`}>
              {item.icon}
            </span>
            <span className="flex-1 text-left truncate">{item.name}</span>
            <ChevronDownIcon
              className={`size-4 shrink-0 transition-transform duration-200 ease-out ${
                isSubmenuOpen ? "rotate-180" : ""
              } ${
                hasActiveChild
                  ? "text-brand-400"
                  : "text-text-tertiary"
              }`}
            />
          </button>

          <div
            className="overflow-hidden transition-all duration-200 ease-out"
            style={{
              height: isSubmenuOpen ? 'auto' : "0px",
              opacity: isSubmenuOpen ? 1 : 0,
            }}
          >
            <ul className="py-1 pl-4 ml-3 border-l-2 border-border-light/50 dark:border-white/5">
              {item.subItems?.map((subItem) => (
                <li key={subItem.name}>
                  <Link
                    to={subItem.path}
                    onClick={() => setIsMobileOpen(false)}
                    className={`group/sub relative flex items-center gap-2 px-3 py-2 text-theme-sm rounded-lg transition-all duration-200 ${
                      isActive(subItem.path)
                        ? "text-brand-600 bg-brand-50 dark:text-brand-400 dark:bg-brand-900/20"
                        : "text-text-secondary hover:text-text-primary hover:bg-gray-50 dark:text-text-tertiary dark:hover:text-white dark:hover:bg-white/[0.03]"
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 transition-all duration-200 ${
                      isActive(subItem.path)
                        ? "bg-brand-500 scale-125"
                        : "bg-text-tertiary/40 group-hover/sub:bg-brand-400"
                    }`} />
                    <span className="truncate">{subItem.name}</span>
                    {subItem.new && (
                      <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-brand-500 text-white">
                        NUEVO
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      );
    }

    return (
      <Link
        to={item.path!}
        onClick={() => setIsMobileOpen(false)}
        className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-theme-sm font-medium transition-all duration-200 ${
          isDirectActive
            ? "bg-brand-500 text-white shadow-lg shadow-brand-500/20"
            : "text-text-secondary hover:bg-gray-50/70 hover:text-text-primary dark:text-text-tertiary dark:hover:bg-white/[0.03] dark:hover:text-white"
        } ${isCollapsed ? "justify-center" : ""}`}
        title={isCollapsed ? item.name : undefined}
      >
        <span className={`shrink-0 ${
          isDirectActive
            ? "text-white"
            : "text-text-tertiary group-hover:text-text-primary dark:group-hover:text-white"
        }`}>
          {item.icon}
        </span>
        {!isCollapsed && (
          <>
            <span className="flex-1 truncate">{item.name}</span>
            {item.badge && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-warning-500 text-white">
                {item.badge}
              </span>
            )}
          </>
        )}
      </Link>
    );
  };

  return (
    <>
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <aside
        ref={sidebarRef}
        className={`fixed flex flex-col left-0 bg-white dark:bg-bg-dark text-text-primary transition-all duration-300 ease-out z-50 border-r border-border-light/50 dark:border-white/5
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
        style={{ 
          width: sidebarWidth,
          height: '100vh',
          top: 0
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className={`py-5 flex items-center border-b border-border-light/30 dark:border-white/5 ${!showExpanded ? "justify-center px-0" : "px-4"}`}>
          <Link to="/dashboard" className="flex items-center gap-3 group">
            <div className="relative shrink-0">
              <img 
                src="/logo-nuevo.png" 
                alt="UNEFA" 
                className="size-9 object-contain transition-transform duration-300 group-hover:scale-105" 
              />
              <div className="absolute -inset-1 bg-brand-500/10 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            {showExpanded && (
              <div className="flex flex-col min-w-0">
                <span className="text-base font-bold leading-tight tracking-tight text-unefa-blue dark:text-white truncate">
                  UNEFA
                </span>
                <span className="text-[10px] font-medium uppercase tracking-wider text-text-tertiary">
                  Dashboard
                </span>
              </div>
            )}
          </Link>
        </div>

        <div className="flex-1 flex flex-col px-3 overflow-y-auto no-scrollbar py-4">
          <nav className="flex-1">
            <div className="space-y-1">
              {!showExpanded && (
                <header className="flex justify-center py-2 mb-2">
                  <HorizontaLDots className="size-4 text-text-tertiary/40" />
                </header>
              )}
              {showExpanded && (
                <header className="px-3 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary/60">
                    Navegación
                  </span>
                </header>
              )}
              <ul className="flex flex-col gap-1">
                {filteredNavItems.map((nav) => (
                  <li key={nav.name}>
                    <MenuItem 
                      item={nav} 
                      isCollapsed={!showExpanded}
                      onHover={!showExpanded ? setHoveredMenu : undefined}
                      isHovered={hoveredMenu === nav.name}
                    />
                  </li>
                ))}
              </ul>
            </div>
          </nav>

          <div className="mt-auto pt-4 border-t border-border-light/30 dark:border-white/5">
            <PeriodStatusCard />
          </div>
        </div>
      </aside>
    </>
  );
};

export default AppSidebar;
