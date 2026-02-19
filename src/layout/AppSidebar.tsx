import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";
import { useAuth } from "../context/auth";

// Assume these icons are imported from an icon library
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
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean; roles?: number[] }[];
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
    ],
  },
  {
    name: "Panel de Estudiante",
    icon: <UserCircleIcon />,
    roles: [4],
    subItems: [
      { name: "Dashboard", path: "/student" },
      { name: "Mis Solicitudes", path: "/student/requests" },
    ],
  },
  {
    name: "Gestión",
    icon: <TableIcon />,
    roles: [0, 1, 2],
    subItems: [
      { name: "Período", path: "/period" },
      { name: "Carrera", path: "/careers" },
    ],
  },
  {
    name: "Registro",
    icon: <UserCircleIcon />,
    roles: [0, 1, 2],
    subItems: [
      { name: "Estudiante", path: "/students" },
      { name: "Tutor", path: "/tutors" },
      { name: "Institución", path: "/institutions" },
    ],
  },
  {
    name: "Prácticas Profesionales",
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
      { name: "Configuración de Combos", path: "/configure/lists" },
      { name: "Registro de Actividad", path: "/configure/logs" },
      { name: "Roles y Permisos", path: "/configure/roles" },
      { name: "Mantenimiento", path: "/configure/maintenance" },
      { name: "Respaldos", path: "/configure/backups" },
    ],
  },
  {
    icon: <SparklesIcon />,
    name: "Asistente de IA",
    path: "/ai-assistant",
  },
  {
    icon: <DocsIcon />,
    name: "Manuales",
    path: "/manuals",
  },
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const { user } = useAuth();
  const location = useLocation();

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

  const [openSubmenu, setOpenSubmenu] = useState<number | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<number, number>>(
    {}
  );
  const subMenuRefs = useRef<Record<number, HTMLDivElement | null>>({});

  // const isActive = (path: string) => location.pathname === path;
  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname]
  );

  useEffect(() => {
    let submenuMatched = false;
    navItems.forEach((nav, index) => {
      if (nav.subItems) {
        nav.subItems.forEach((subItem) => {
          if (isActive(subItem.path)) {
            setOpenSubmenu(index);
            submenuMatched = true;
          }
        });
      }
    });

    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [location, isActive]);

  useEffect(() => {
    if (openSubmenu !== null) {
      if (subMenuRefs.current[openSubmenu]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [openSubmenu]: subMenuRefs.current[openSubmenu]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number) => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (prevOpenSubmenu === index) {
        return null;
      }
      return index;
    });
  };

  const renderMenuItems = (items: NavItem[]) => (
    <ul className="flex flex-col gap-4">
      {items.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index)}
              className={`menu-item group ${openSubmenu === index
                ? "menu-item-open"
                : "menu-item-inactive"
                } cursor-pointer ${!isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "lg:justify-start"
                }`}
            >
              <span
                className={`menu-item-icon-size  ${openSubmenu === index
                  ? "text-unefa-blue dark:text-white"
                  : "menu-item-icon-inactive"
                  }`}
              >
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className="menu-item-text">{nav.name}</span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDownIcon
                  className={`ml-auto icon-sm transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${openSubmenu === index
                    ? "rotate-180 text-unefa-blue dark:text-white"
                    : ""
                    }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                to={nav.path}
                className={`menu-item group ${isActive(nav.path) ? "menu-item-active" : "menu-item-inactive"
                  }`}
              >
                <span
                  className={`menu-item-icon-size ${isActive(nav.path)
                    ? "menu-item-icon-active"
                    : "menu-item-icon-inactive"
                    }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text">{nav.name}</span>
                )}
              </Link>
            )
          )}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[index] = el;
              }}
              className="overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
              style={{
                height:
                  openSubmenu === index
                    ? `${subMenuHeight[index]}px`
                    : "0px",
              }}
            >
              <ul className="mt-1.5 space-y-1 ml-6 border-l border-border-light/40 dark:border-white/5 pl-4">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      to={subItem.path}
                      className={`menu-dropdown-item flex items-center group/sub ${isActive(subItem.path)
                        ? "menu-dropdown-item-active"
                        : "menu-dropdown-item-inactive"
                        }`}
                    >
                      <div className={`size-1.5 rounded-full mr-2 transition-all duration-300 ${isActive(subItem.path) ? "bg-white scale-125" : "bg-text-tertiary/40 group-hover/sub:bg-brand-500"}`} />
                      <span className="truncate">{subItem.name}</span>
                      <span className="flex items-center gap-1 ml-auto">
                        {subItem.new && (
                          <span className="px-1.5 py-0.5 text-[8px] font-bold uppercase rounded bg-brand-100 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400">new</span>
                        )}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <aside
      className={`fixed flex flex-col left-0 bg-white dark:bg-bg-dark text-text-primary transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] z-50 border-r border-border-light/60 dark:border-white/5
        ${isExpanded || isHovered || isMobileOpen ? "w-72.5 shadow-xl shadow-gray-200/20 dark:shadow-none" : "w-22.5"}
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
      style={{ height: '100vh', top: 0 }}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`py-8 px-6 flex items-center ${!isExpanded && !isHovered ? "justify-center" : "justify-start"}`}>
        <Link to="/dashboard" className="flex items-center gap-4 group">
          <div className="relative">
            <img src="/logo-nuevo.png" alt="UNEFA" className="size-10 object-contain transition-transform duration-300 group-hover:scale-110" />
            <div className="absolute -inset-1 bg-brand-500/10 rounded-full blur-sm opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          {(isExpanded || isHovered || isMobileOpen) && (
            <div className="flex flex-col">
              <span className="text-lg font-bold leading-tight tracking-tight text-unefa-blue dark:text-white">
                UNEFA
              </span>
              <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-text-tertiary">
                Dashboard
              </span>
            </div>
          )}
        </Link>
      </div>

      <div className="flex-1 flex flex-col px-4 overflow-y-auto no-scrollbar py-2">
        <nav className="flex-1">
          <div className="space-y-6">
            <div>
              <header className={`px-3 mb-3 flex items-center ${!isExpanded && !isHovered ? "justify-center" : "justify-start"}`}>
                {isExpanded || isHovered || isMobileOpen ? (
                  <span className="text-[11px] font-bold uppercase tracking-widest text-text-tertiary/70">Principal</span>
                ) : (
                  <HorizontaLDots className="size-4 text-text-tertiary/40" />
                )}
              </header>
              {renderMenuItems(filteredNavItems as NavItem[])}
            </div>
          </div>
        </nav>

        <div className="mt-auto py-6">
          <PeriodStatusCard />
        </div>
      </div>
    </aside>
  );
};

export default AppSidebar;
