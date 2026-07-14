import { useCallback, useEffect, useState, useMemo, useRef } from "react";
import { useLocation } from "react-router";
import { createPortal } from "react-dom";
import { useTabs } from "../context/tab";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/auth";
import { usePermissions } from "../features/permissions/hooks/usePermissions";
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
} from "../icons";
import { useSidebar } from "../context/sidebar";
import PeriodStatusCard from "../components/Sidebar/PeriodStatusCard";
import PendingTasksCard from "../components/Sidebar/PendingTasksCard";
import { useSystemInfo } from "../context/SystemInfoContext";

type SubNavItem = {
  name: string;
  path?: string;
  pro?: boolean;
  new?: boolean;
  /** Legacy: mostrar solo si el usuario tiene este rol */
  roles?: number[];
  /** Excluir si el usuario tiene este rol (ej: estudiantes no ven admin) */
  notRoles?: number[];
  /** Mostrar solo si el usuario tiene ALGUNO de estos permisos (reemplaza roles) */
  permissions?: string[];
  badge?: string | number;
  /** Renderiza como encabezado de sección (no es un link) */
  isHeader?: boolean;
};

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  /** Legacy: mostrar solo si el usuario tiene este rol */
  roles?: number[];
  /** Excluir si el usuario tiene este rol (ej: estudiantes no ven admin) */
  notRoles?: number[];
  /** Mostrar solo si el usuario tiene ALGUNO de estos permisos (reemplaza roles) */
  permissions?: string[];
  badge?: string | number;
  subItems?: SubNavItem[];
};

type PopupMenuProps = {
  isOpen: boolean;
  position: { top: number; left: number };
  title: string;
  items: { name: string; path: string }[];
  isActive: (path: string) => boolean;
  onEnter: () => void;
  onLeave: () => void;
  onNavigate: () => void;
  openTab: (path: string, name: string) => void;
};

const popupVariants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    x: -8
  },
  visible: {
    opacity: 1,
    scale: 1,
    x: 0,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 30,
      mass: 0.8
    }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    x: -8,
    transition: {
      duration: 0.15
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.03,
      type: "spring" as const,
      stiffness: 400,
      damping: 25
    }
  })
};

const PopupMenu: React.FC<PopupMenuProps> = ({ isOpen, position, title, items, isActive, onEnter, onLeave, onNavigate, openTab }) => {
  return createPortal(
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          key={title}
          variants={popupVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="fixed w-56 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-border-light/50 dark:border-white/10 overflow-hidden"
          style={{
            top: position.top,
            left: position.left,
            zIndex: 60
          }}
          onMouseEnter={onEnter}
          onMouseLeave={onLeave}
          layoutId={`popup-${title}`}
        >
          <div className="py-2">
            <motion.div
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-text-tertiary border-b border-border-light/50 dark:border-white/5"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
            >
              {title}
            </motion.div>
            <ul className="py-1">
              {items.map((subItem, i) => (
                <motion.li
                  key={subItem.name}
                  custom={i}
                  variants={itemVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <button
                    onClick={() => {
                      openTab(subItem.path, subItem.name);
                      onNavigate();
                    }}
                    className={`w-full text-left flex items-center gap-2 px-4 py-2 text-theme-sm transition-all duration-200 ${isActive(subItem.path)
                        ? "text-brand-600 bg-brand-50 dark:text-brand-400 dark:bg-brand-900/30"
                        : "text-text-secondary hover:text-text-primary hover:bg-gray-50 dark:text-text-tertiary dark:hover:text-white dark:hover:bg-white/3"
                      }`}
                  >
                    <motion.span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${isActive(subItem.path) ? "bg-brand-500" : "bg-text-tertiary/40"}`}
                      whileHover={{ scale: 1.5 }}
                      transition={{ type: "spring", stiffness: 500 }}
                    />
                    <span className="truncate">{subItem.name}</span>
                  </button>
                </motion.li>
              ))}
            </ul>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

const navItems: NavItem[] = [
  { icon: <GridIcon />, name: "Inicio", path: "/dashboard", notRoles: [3], permissions: ['dashboard:view'] },
  {
    name: "Panel de Tutor", icon: <UserCircleIcon />, roles: [3],
    subItems: [
      { name: "Dashboard", path: "/tutor" },
      { name: "Mis Estudiantes", path: "/tutor/students" },
      { name: "Cargar Notas", path: "/tutor/grades" },
      { name: "Mi Perfil", path: "/tutor/profile" },
    ],
  },
  {
    name: "Panel de Estudiante", icon: <UserCircleIcon />, roles: [4],
    subItems: [
      { name: "Mis Solicitudes", path: "/student/requests" },
      { name: "Mi Seguimiento", path: "/student/tracking" },
      { name: "Mis Evaluaciones", path: "/student/evaluations" },
      { name: "Mi Perfil", path: "/student/profile" },
    ],
  },
  {
    name: "Gestión", icon: <TableIcon />, notRoles: [4],
    subItems: [
      { name: "Período", path: "/period", permissions: ['periods:view'] },
      { name: "Carreras", path: "/careers", permissions: ['careers:view'] },
    ],
  },
  {
    name: "Registros", icon: <UserCircleIcon />, notRoles: [3, 4],
    subItems: [
      { name: "Estudiantes", path: "/students", permissions: ['students:view'] },
      { name: "Tutores", path: "/tutors", permissions: ['tutors:view'] },
      { name: "Empresas o Instituciones", path: "/institutions", permissions: ['institutions:view'] },
    ],
  },
  {
    name: "Prácticas Profesionales", icon: <BoxCubeIcon />, notRoles: [4],
    subItems: [
      { name: "Pre-Inscripción", path: "/pre-enrollment", permissions: ['enrollments:view'], notRoles: [3] },
      { name: "Inscripción", path: "/enrollment", permissions: ['enrollments:view'], notRoles: [3] },
      { name: "Seguimiento", path: "/tracking", permissions: ['tracking:view'], notRoles: [3] },
      { name: "Evaluaciones", path: "/evaluations", permissions: ['evaluations:view'], notRoles: [3] },
    ],
  },
  { name: "Solicitudes", icon: <DocsIcon />, path: "/admin/requests", permissions: ['requests:view'], notRoles: [3, 4] },
  { name: "Reportes", icon: <PieChartIcon />, path: "/reports", permissions: ['reports:view'], notRoles: [3, 4] },
  {
    name: "Configuración", icon: <PlugInIcon />,
    notRoles: [3, 4],
    permissions: ['users:view', 'lists:view', 'activity-logs:view', 'roles:manage', 'config:view', 'backups:view', 'evaluations:view'],
    subItems: [
      // 👥 Administración
      { name: "ADMINISTRACIÓN", isHeader: true },
      { name: "Usuarios", path: "/configure/users", permissions: ['users:view'] },
      { name: "Roles y Permisos", path: "/configure/roles", permissions: ['roles:manage'] },
      { name: "Auditoría", path: "/configure/auditoria", permissions: ['activity-logs:view'] },

      // 🗂️ Sistema
      { name: "SISTEMA", isHeader: true },
      { name: "Parámetros", path: "/configure/settings", permissions: ['config:view'] },
      { name: "Organización", path: "/configure/organizacion", permissions: ['config:view'] },
      { name: "Listas (Combos)", path: "/configure/lists", permissions: ['lists:view'] },
      { name: "Respaldos", path: "/configure/backups", permissions: ['backups:view'] },
      { name: "Mantenimiento", path: "/configure/maintenance", permissions: ['config:view'] },

      // 🎨 Personalización
      { name: "PERSONALIZACIÓN", isHeader: true },
      { name: "Dashboard", path: "/dashboard/configure", permissions: ['config:view'] },
      { name: "Recordatorios", path: "/configure/reminders", permissions: ['config:view'] },
    ],
  },
  { icon: <DocsIcon />, name: "Manuales", path: "/manuals" },
];

const COLLAPSED_WIDTH = 72;
const EXPANDED_WIDTH = 280;

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, setIsMobileOpen } = useSidebar();
  const { user } = useAuth();
  const { hasAnyPermission } = usePermissions();
  const location = useLocation();
  const { tabs, activeTabId, openTab } = useTabs();

  // Active path from tabs (URL is synced via history.replaceState, not React Router)
  const activePath = useMemo(() => {
    if (!activeTabId) return location.pathname;
    const tab = tabs.find(t => t.id === activeTabId);
    return tab?.path ?? location.pathname;
  }, [tabs, activeTabId, location.pathname]);
  const systemInfo = useSystemInfo();

  const [openSubmenus, setOpenSubmenus] = useState<Set<string>>(new Set());
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const userRole = user?.role;

  /**
   * Verifica si un item debe mostrarse según roles (legacy) o permisos.
   * - Si tiene `permissions`: visible si el usuario tiene ALGUNO
   * - Si tiene `roles`: visible si el rol del usuario coincide
   * - Si no tiene ni permissions ni roles: visible para todos
   */
  const isItemVisible = useCallback((item: { roles?: number[]; notRoles?: number[]; permissions?: string[] }): boolean => {
    // Exclusión por rol (prioritario): si el usuario está en notRoles, no se muestra
    if (item.notRoles && item.notRoles.length > 0 && userRole !== undefined) {
      if (item.notRoles.includes(userRole)) return false;
    }

    const hasPermissions = item.permissions && item.permissions.length > 0;
    const hasRoles = item.roles && item.roles.length > 0;

    let permissionCheck = true;
    let roleCheck = true;

    if (hasPermissions) {
      permissionCheck = hasAnyPermission(...(item.permissions!));
    }
    if (hasRoles) {
      roleCheck = userRole !== undefined && item.roles!.includes(userRole);
    }

    // Si tiene ambos, el usuario debe pasar AMBAS verificaciones
    if (hasPermissions && hasRoles) {
      return permissionCheck && roleCheck;
    }

    // Si solo tiene uno, verificar ese
    if (hasPermissions) return permissionCheck;
    if (hasRoles) return roleCheck;

    return true;
  }, [hasAnyPermission, userRole]);

  const filteredNavItems = useMemo(() => {
    return navItems.filter(item => {
      const parentVisible = isItemVisible(item);
      
      // Grupo con subItems: primero ver si el padre es visible (roles/permissions propios)
      // luego ver si al menos un subItem es visible
      if (item.subItems && item.subItems.length > 0) {
        if (!parentVisible) return false;
        const visibleSubItems = item.subItems.filter(sub => isItemVisible(sub));
        return visibleSubItems.length > 0;
      }
      
      // Item simple: filtro normal
      return parentVisible;
    }).map(item => ({
      ...item,
      subItems: item.subItems
        ?.filter(sub => isItemVisible(sub))
        // ponytail: remover headers sin items visibles después
        ?.filter((sub, i, arr) => {
          if (!sub.isHeader) return true;
          // Un header es visible solo si hay al menos un item no-header después
          return arr.slice(i + 1).some(s => !s.isHeader);
        })
    }));
  }, [isItemVisible]);

  const isActive = useCallback((path: string) => activePath === path, [activePath]);

  const hasActiveSubItem = (nav: NavItem) => {
    if (!nav.subItems) return false;
    return nav.subItems.some(subItem => subItem.path === activePath);
  };

  useEffect(() => {
    const openMenus = new Set<string>();
    filteredNavItems.forEach(nav => {
      if (nav.subItems && nav.subItems.some(sub => sub.path === activePath)) {
        openMenus.add(nav.name);
      }
    });
    setOpenSubmenus(openMenus);
  }, [activePath, filteredNavItems]);

  const handleSubmenuToggle = (menuName: string) => {
    setOpenSubmenus(prev => {
      const next = new Set(prev);
      if (next.has(menuName)) next.delete(menuName);
      else next.add(menuName);
      return next;
    });
  };

  const updatePopupPosition = (menuName: string) => {
    const button = buttonRefs.current[menuName];
    if (button) {
      const rect = button.getBoundingClientRect();
      setPopupPosition({
        top: rect.top - 4,
        left: rect.right + 8
      });
    }
  };

  const handleMouseEnter = (menuName: string) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    updatePopupPosition(menuName);
    setHoveredItem(menuName);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredItem(null);
    }, 150);
  };

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  const isCollapsed = !isExpanded && !isMobileOpen;
  const sidebarWidth = isCollapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH;

  const renderMenuItem = (nav: NavItem) => {
    const hasSubmenu = nav.subItems && nav.subItems.length > 0;
    const isSubmenuOpen = openSubmenus.has(nav.name);
    const hasActiveChild = hasActiveSubItem(nav);
    const isDirectActive = nav.path ? isActive(nav.path) : false;
    const isHovered = hoveredItem === nav.name;

    const buttonBaseClass = `group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-theme-sm font-medium transition-all duration-200 w-full`;

    if (isCollapsed) {
      const popupItems = hasSubmenu
        ? (nav.subItems || []).filter((s): s is SubNavItem & { path: string } => !s.isHeader && !!s.path)
        : nav.path ? [{ name: nav.name, path: nav.path }] : [];

      const ButtonContent = (
        <span className={`shrink-0 ${hasActiveChild || isDirectActive
          ? hasSubmenu ? "text-brand-500" : "text-white"
          : "text-text-tertiary group-hover:text-text-primary dark:group-hover:text-white"
          }`}>
          {nav.icon}
        </span>
      );

      const buttonClassName = `${buttonBaseClass} justify-center ${hasActiveChild || isDirectActive
        ? hasSubmenu
          ? "bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400"
          : "bg-brand-500 text-white shadow-lg shadow-brand-500/20"
        : "text-text-secondary hover:bg-gray-50/70 hover:text-text-primary dark:text-text-tertiary dark:hover:bg-white/3 dark:hover:text-white"
        }`;

      return (
        <div
          ref={el => { if (el) buttonRefs.current[nav.name] = el.querySelector('button, a'); }}
          onMouseEnter={() => handleMouseEnter(nav.name)}
          onMouseLeave={handleMouseLeave}
        >
          {hasSubmenu ? (
            <button className={buttonClassName}>
              {ButtonContent}
            </button>
          ) : (
            <button
              onClick={() => {
                openTab(nav.path!, nav.name);
                setIsMobileOpen(false);
              }}
              className={buttonClassName}
            >
              {ButtonContent}
            </button>
          )}

          <PopupMenu
            isOpen={isHovered}
            position={popupPosition}
            title={nav.name}
            items={popupItems}
            isActive={isActive}
            onEnter={() => handleMouseEnter(nav.name)}
            onLeave={handleMouseLeave}
            onNavigate={() => {
              setHoveredItem(null);
              setIsMobileOpen(false);
            }}
            openTab={openTab}
          />
        </div>
      );
    }

    if (hasSubmenu) {
      return (
        <div>
          <button
            onClick={() => handleSubmenuToggle(nav.name)}
            className={`${buttonBaseClass} ${hasActiveChild
              ? "bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400"
              : isSubmenuOpen
                ? "bg-gray-50 text-text-primary dark:bg-white/5 dark:text-white"
                : "text-text-secondary hover:bg-gray-50/70 hover:text-text-primary dark:text-text-tertiary dark:hover:bg-white/3 dark:hover:text-white"
              }`}
          >
            <span className={`shrink-0 transition-colors duration-200 ${hasActiveChild
              ? "text-brand-500"
              : isSubmenuOpen
                ? "text-text-primary dark:text-white"
                : "text-text-tertiary group-hover:text-text-primary dark:group-hover:text-white"
              }`}>
              {nav.icon}
            </span>
            <span className="flex-1 text-left truncate">{nav.name}</span>
            <ChevronDownIcon className={`size-4 shrink-0 transition-transform duration-200 ease-out ${isSubmenuOpen ? "rotate-180" : ""} ${hasActiveChild ? "text-brand-400" : "text-text-tertiary"}`} />
          </button>

          <div className="overflow-hidden transition-all duration-200 ease-out" style={{ maxHeight: isSubmenuOpen ? 500 : 0, opacity: isSubmenuOpen ? 1 : 0 }}>
            <ul className="py-1 pl-4 ml-3 border-l-2 border-border-light/50 dark:border-white/5">
              {nav.subItems?.map(subItem => {
                if (subItem.isHeader) {
                  return (
                    <li key={subItem.name} className="pt-4 pb-1 first:pt-0">
                      <span className="flex items-center gap-2 px-3">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary/50">{subItem.name}</span>
                        <span className="flex-1 h-px bg-border-light/40 dark:bg-white/5" />
                      </span>
                    </li>
                  );
                }
                return (
                  <li key={subItem.name}>
                    <button
                      onClick={() => {
                        openTab(subItem.path!, subItem.name);
                        setIsMobileOpen(false);
                      }}
                      className={`group/sub relative w-full text-left flex items-center gap-2 px-3 py-2 text-theme-sm rounded-lg transition-all duration-200 ${subItem.path && isActive(subItem.path)
                          ? "text-brand-600 bg-brand-50 dark:text-brand-400 dark:bg-brand-900/20"
                          : "text-text-secondary hover:text-text-primary hover:bg-gray-50 dark:text-text-tertiary dark:hover:text-white dark:hover:bg-white/3"
                        }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 transition-all duration-200 ${subItem.path && isActive(subItem.path) ? "bg-brand-500 scale-125" : "bg-text-tertiary/40 group-hover/sub:bg-brand-400"}`} />
                      <span className="truncate">{subItem.name}</span>
                      {subItem.new && <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-brand-500 text-white">NUEVO</span>}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      );
    }

    return (
      <button
        onClick={() => {
          openTab(nav.path!, nav.name);
          setIsMobileOpen(false);
        }}
        className={`${buttonBaseClass} ${isDirectActive
          ? "bg-brand-500 text-white shadow-lg shadow-brand-500/20"
          : "text-text-secondary hover:bg-gray-50/70 hover:text-text-primary dark:text-text-tertiary dark:hover:bg-white/3 dark:hover:text-white"
          }`}
      >
        <span className={`shrink-0 ${isDirectActive ? "text-white" : "text-text-tertiary group-hover:text-text-primary dark:group-hover:text-white"}`}>
          {nav.icon}
        </span>
        <span className="flex-1 text-left truncate">{nav.name}</span>
        {nav.badge && <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-warning-500 text-white">{nav.badge}</span>}
      </button>
    );
  };

  return (
    <>
      {isMobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setIsMobileOpen(false)} />
      )}

      <aside
        className={`fixed flex flex-col left-0 bg-white dark:bg-bg-dark text-text-primary transition-all duration-300 ease-out border-r border-border-light/50 dark:border-white/5
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
        style={{ width: sidebarWidth, height: '100vh', top: 0, zIndex: isMobileOpen ? 50 : 30 }}
      >
        <div className={`py-5 flex items-center border-b border-border-light/30 dark:border-white/5 ${isCollapsed ? "justify-center px-0" : "px-4"}`}>
          <button
            onClick={() => openTab("/dashboard", "Inicio")}
            className="flex items-center gap-3 group"
          >
            <div className="relative shrink-0">
              <img
                src={systemInfo.logoUrl}
                alt={systemInfo.commercialName}
                className="size-9 object-contain transition-transform duration-300 group-hover:scale-105"
                onError={(e) => { (e.target as HTMLImageElement).src = '/logo-nuevo.png'; }}
              />
              <div className="absolute -inset-1 bg-brand-500/10 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-base font-bold leading-tight tracking-tight text-unefa-blue dark:text-white truncate">{systemInfo.commercialName}</span>
                <span className="text-[10px] font-medium uppercase tracking-wider text-text-tertiary">Dashboard</span>
              </div>
            )}
          </button>
        </div>

        <div className="flex-1 flex flex-col px-3 overflow-y-auto no-scrollbar py-4">
          <nav className="flex-1">
            <div className="space-y-1">
              {isCollapsed && (
                <header className="flex justify-center py-2 mb-2">
                  <HorizontaLDots className="size-4 text-text-tertiary/40" />
                </header>
              )}
              {!isCollapsed && (
                <header className="px-3 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary/60">Navegación</span>
                </header>
              )}
              <ul className="flex flex-col gap-1">
                {filteredNavItems.map(nav => (
                  <li key={nav.name}>{renderMenuItem(nav)}</li>
                ))}
              </ul>
            </div>
          </nav>

          <div className="mt-auto pt-4 border-t border-border-light/30 dark:border-white/5">
            <PendingTasksCard />
          </div>
        </div>
      </aside>
    </>
  );
};

export default AppSidebar;
