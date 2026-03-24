/**
 * @file SidebarWidget.tsx
 * @description Widget lateral con métricas rápidas y acciones del dashboard
 */

import { UsersIcon, TableIcon, FileIcon, PlusIcon } from "../icons";

export default function SidebarWidget() {
  // Datos estáticos por ahora (sin conexión a API)
  const quickStats = [
    { label: "Estudiantes Activos", value: "1,247", icon: <UsersIcon className="w-5 h-5" />, color: "text-brand-500" },
    { label: "Pre-inscripciones Pendientes", value: "23", icon: <TableIcon className="w-5 h-5" />, color: "text-amber-500" },
    { label: "Inscripciones del Período", value: "89", icon: <FileIcon className="w-5 h-5" />, color: "text-green-500" },
  ];

  const quickActions = [
    { label: "Nuevo Estudiante", action: "app:openStudentModal" },
    { label: "Nueva Pre-inscripción", action: "app:openPreEnrollmentModal" },
    { label: "Nueva Inscripción", action: "app:openEnrollmentModal" },
  ];

  const handleActionClick = (action: string) => {
    window.dispatchEvent(new CustomEvent(action));
  };

  return (
    <div className="mx-auto mb-10 w-full max-w-60 space-y-6">
      {/* Quick Stats */}
      <div className="rounded-2xl bg-bg-secondary px-4 py-5 dark:bg-white/3">
        <h3 className="mb-4 font-semibold text-text-emphasis text-sm dark:text-white">
          Estadísticas Rápidas
        </h3>
        <div className="space-y-3">
          {quickStats.map((stat, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={stat.color}>{stat.icon}</span>
                <span className="text-xs text-text-secondary dark:text-text-tertiary">
                  {stat.label}
                </span>
              </div>
              <span className="font-semibold text-text-emphasis text-sm dark:text-white">
                {stat.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-2xl bg-bg-secondary px-4 py-5 dark:bg-white/3">
        <h3 className="mb-4 font-semibold text-text-emphasis text-sm dark:text-white">
          Acciones Rápidas
        </h3>
        <div className="space-y-2">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={() => handleActionClick(action.action)}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-text-primary transition-all duration-200 hover:bg-brand-50 hover:text-brand-600 dark:text-white dark:hover:bg-brand-500/20"
            >
              <PlusIcon className="w-4 h-4 text-brand-500" />
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}