import { useState, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";
import { motion } from "framer-motion";
import { useTabs } from "../context/tab";
import {
  LayoutDashboard,
  User,
  FileText,
  ClipboardList,
  FolderOpen,
  BarChart3,
  ScrollText,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const studentNav: NavItem[] = [
  { label: "Dashboard", path: "/student", icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: "Perfil", path: "/student/profile", icon: <User className="w-5 h-5" /> },
  { label: "Solicitudes", path: "/student/requests", icon: <FileText className="w-5 h-5" /> },
  { label: "Seguimiento", path: "/student/tracking", icon: <ClipboardList className="w-5 h-5" /> },
  { label: "Documentos", path: "/student/documents", icon: <FolderOpen className="w-5 h-5" /> },
  { label: "Evaluaciones", path: "/student/evaluations", icon: <BarChart3 className="w-5 h-5" /> },
  { label: "Reportes", path: "/student/reports", icon: <ScrollText className="w-5 h-5" /> },
];

const SIDEBAR_EXPANDED = 208;
const SIDEBAR_COLLAPSED = 60;

/** Page title/description map for breadcrumb-style header. */
const pageInfo: Record<string, { title: string; description: string }> = {
  "/student": { title: "Panel de Estudiante", description: "Consultá tu información de pasantía y gestioná tus registros" },
  "/student/profile": { title: "Mi Perfil", description: "Información personal y académica" },
  "/student/requests": { title: "Mis Solicitudes", description: "Gestioná tus solicitudes a coordinación" },
  "/student/tracking": { title: "Mi Seguimiento", description: "Consultá el progreso de tu práctica profesional" },
  "/student/documents": { title: "Mis Documentos", description: "Subí y gestioná tus documentos de pasantía" },
  "/student/evaluations": { title: "Mis Evaluaciones", description: "Resultados de tus evaluaciones de práctica profesional" },
  "/student/reports": { title: "Mis Reportes", description: "Generá y descargá tus reportes institucionales" },
};

export default function StudentLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { tabs, activeTabId, openTab } = useTabs();

  // Auto-collapse sidebar on screens < 1024px
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)');
    setCollapsed(mq.matches);
    const handler = (e: MediaQueryListEvent) => setCollapsed(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const activePath = tabs.find((t) => t.id === activeTabId)?.path ?? location.pathname;

  // Determine current page info
  const info = pageInfo[activePath] || pageInfo["/student"];

  const handleNav = (item: NavItem) => {
    openTab(item.path, item.label);
  };

  // Check if a nav item is active (exact match for root, prefix for sub-paths)
  const isActive = (item: NavItem) => {
    if (item.path === "/student") return activePath === "/student";
    return activePath.startsWith(item.path);
  };

  return (
    <div className="flex min-h-0 flex-1 gap-0">
      {/* ── Sidebar ───────────────────────────────────────────── */}
      <motion.aside
        animate={{ width: collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED }}
        transition={{ type: "spring", stiffness: 300, damping: 28, mass: 0.8 }}
        className="flex flex-col shrink-0 bg-white dark:bg-gray-900 border-r border-border-light dark:border-border-dark overflow-hidden"
      >
        {/* Toggle button */}
        <div className="flex items-center justify-end h-12 px-2 border-b border-border-light/50 dark:border-white/5">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-text-secondary transition-colors"
            aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
          {studentNav.map((item) => {
            const active = isActive(item);
            return (
              <button
                key={item.path}
                onClick={() => handleNav(item)}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  collapsed ? "justify-center" : ""
                } ${
                  active
                    ? "bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400"
                    : "text-text-secondary hover:bg-gray-50 dark:text-text-tertiary dark:hover:bg-white/5 hover:text-text-primary"
                }`}
              >
                <span className="shrink-0">{item.icon}</span>
                {!collapsed && <span className="truncate text-left">{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </motion.aside>

      {/* ── Content area ──────────────────────────────────────── */}
      <div className="flex-1 min-w-0 overflow-y-auto p-4 md:p-6">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-text-emphasis dark:text-text-emphasis">
            {info.title}
          </h1>
          <p className="text-text-secondary dark:text-text-tertiary mt-1">
            {info.description}
          </p>
        </div>

        {/* Child route content via Outlet */}
        <Outlet />
      </div>
    </div>
  );
}
