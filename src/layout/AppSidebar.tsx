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
} from "../icons";
import { useSidebar } from "../context/sidebar";

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
    name: "Gestión",
    icon: <TableIcon />,
    subItems: [
      { name: "Período", path: "/period" },
      { name: "Carrera", path: "/careers" },
    ],
  },
  {
    name: "Registro",
    icon: <UserCircleIcon />,
    subItems: [
      { name: "Estudiante", path: "/students" },
      { name: "Tutor", path: "/tutors" },
      { name: "Institución", path: "/institutions" },
    ],
  },
  {
    name: "Prácticas Profesionales",
    icon: <BoxCubeIcon />,
    subItems: [
      { name: "Pre-Inscripción", path: "/pre-enrollment" },
      { name: "Inscripción", path: "/enrollment" },
      { name: "Seguimiento", path: "/tracking" },
      { name: "Culminación Prácticas Profesionales", path: "/blank" },
    ],
  },
  {
    name: "Reportes",
    icon: <PieChartIcon />,
    subItems: [
      { name: "Reportes Generales", path: "/blank" },
    ],
  },
  {
    name: "Configuración",
    icon: <PlugInIcon />,
    roles: [0, 1], // Maestro y Admin
    subItems: [
      { name: "Usuarios", path: "/configure/users" },
      { name: "Configuración de Combos", path: "/configure/lists" },
      { name: "Configuración", path: "/blank" },
      { name: "Roles y Permisos", path: "/blank" },
      { name: "Logs de Actividad", path: "/blank" },
      { name: "Mantenimiento", path: "/blank" },
    ],
  },
  {
    icon: <DocsIcon />,
    name: "Manuales",
    path: "/blank",
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
                ? "menu-item-active"
                : "menu-item-inactive"
                } cursor-pointer ${!isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "lg:justify-start"
                }`}
            >
              <span
                className={`menu-item-icon-size  ${openSubmenu === index
                  ? "menu-item-icon-active"
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
                  className={`ml-auto icon-sm transition-transform duration-200 ${openSubmenu === index
                    ? "rotate-180 text-brand-500"
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
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu === index
                    ? `${subMenuHeight[index]}px`
                    : "0px",
              }}
            >
              <ul className="mt-2 space-y-1 ml-9">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      to={subItem.path}
                      className={`menu-dropdown-item ${isActive(subItem.path)
                        ? "menu-dropdown-item-active"
                        : "menu-dropdown-item-inactive"
                        }`}
                    >
                      {subItem.name}
                      <span className="flex items-center gap-1 ml-auto">
                        {subItem.new && (
                          <span
                            className={`ml-auto ${isActive(subItem.path)
                              ? "menu-dropdown-badge-active"
                              : "menu-dropdown-badge-inactive"
                              } menu-dropdown-badge`}
                          >
                            new
                          </span>
                        )}
                        {subItem.pro && (
                          <span
                            className={`ml-auto ${isActive(subItem.path)
                              ? "menu-dropdown-badge-active"
                              : "menu-dropdown-badge-inactive"
                              } menu-dropdown-badge`}
                          >
                            pro
                          </span>
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
      style={{ 
        height: '100vh',
        top: 0
      }}
      className={`fixed flex flex-col px-5 left-0 bg-white dark:bg-bg-dark dark:border-white/10 text-text-primary transition-all duration-300 ease-in-out z-999999 border-r border-border-light shadow-theme-md 
        ${isExpanded || isMobileOpen
          ? "w-72.5"
          : isHovered
            ? "w-72.5"
            : "w-22.5"
        }
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0`}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`py-6 flex ${!isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
          }`}
      >
        <Link to="/dashboard">
          {isExpanded || isHovered || isMobileOpen ? (
            <div className="flex items-center gap-5">
              <img
                src="/logo-nuevo.png"
                alt="Logo"
                width={35}
                height={35}
              />
              <span className="text-xl font-bold text-text-emphasis">
                Dashboard UNEFA
              </span>
            </div>
          ) : (
            <img
              src="/logo-nuevo.png"
              alt="Logo"
              width={35}
              height={35}
            />
          )}
        </Link>
      </div>
      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <nav className="mb-6">
          <div className="flex flex-col gap-4">
            <div>
              <h2
                className={`mb-4 text-xs uppercase flex leading-5 text-text-tertiary ${!isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "justify-start"
                  }`}
              >
                {isExpanded || isHovered || isMobileOpen ? (
                  "Menu"
                ) : (
                  <HorizontaLDots className="icon-md" />
                )}
              </h2>
              {renderMenuItems(filteredNavItems as NavItem[])}
            </div>
          </div>
        </nav>
      </div>
    </aside>
  );
};

export default AppSidebar;
