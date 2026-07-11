import { useLocation, Link, Outlet, useSearchParams } from "react-router";

// ponytail: inline SVG icons, no icon lib dependency
const NAV_ITEMS = [
  {
    section: "Sistema",
    links: [
      { to: "/configure/settings", label: "Parámetros del Sistema", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z" },
      { to: "/configure/organizacion", label: "Organización", icon: "M3 21h18M3 7v14M3 3l6 4-6 4V3zM21 7v14M21 3l-6 4 6 4V3zM9 21V11M15 21V11" },
      { to: "/configure/lists", label: "Listas / Combos", icon: "M4 6h16M4 10h16M4 14h16M4 18h16" },
      { to: "/configure/maintenance", label: "Mantenimiento", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M9 12l2 2 4-4" },
      { to: "/configure/backups", label: "Respaldos", icon: "M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7M4 7c0-2 1-3 3-3h10c2 0 3 1 3 3M4 7h16M8 12h8" },
    ],
  },
  {
    section: "Administración",
    links: [
      { to: "/configure/users", label: "Usuarios", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
      { to: "/configure/roles", label: "Roles / Permisos", icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" },
      { to: "/configure/auditoria", label: "Auditoría", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
    ],
  },
  {
    section: "Personalización",
    links: [
      { to: "/configure/landing", label: "Landing Page", icon: "M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" },
      { to: "/configure/reminders", label: "Recordatorios", icon: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" },
    ],
  },
];

export default function ConfigLayout() {
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const isActive = (to: string) => {
    // Match pathname + search params (for org?tab=evaluacion)
    const [path, qs] = to.split("?");
    if (qs) {
      return location.pathname === path && searchParams.toString() === qs;
    }
    return location.pathname === to;
  };

  return (
    <div className="flex gap-6 animate-fadeIn">
      <aside className="w-64 shrink-0">
        <nav className="space-y-6">
          {NAV_ITEMS.map((group) => (
            <div key={group.section}>
              <h3 className="px-3 text-xs font-semibold uppercase tracking-wider text-text-tertiary dark:text-text-quaternary mb-2">
                {group.section}
              </h3>
              <ul className="space-y-1">
                {group.links.map((link) => {
                  const active = isActive(link.to);
                  return (
                    <li key={link.to}>
                      <Link
                        to={link.to}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          active
                            ? "bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400"
                            : "text-text-secondary dark:text-text-tertiary hover:bg-gray-50 dark:hover:bg-white/5"
                        }`}
                      >
                        <svg
                          className={`w-4 h-4 shrink-0 ${
                            active ? "text-brand-500" : "text-text-tertiary"
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1.5}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d={link.icon} />
                        </svg>
                        {link.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>
      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
