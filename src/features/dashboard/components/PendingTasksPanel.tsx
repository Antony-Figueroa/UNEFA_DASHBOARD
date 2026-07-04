/**
 * @file PendingTasksPanel.tsx
 * @description Contenido del panel lateral de tareas pendientes.
 * Muestra secciones agrupadas: solicitudes, evaluaciones, visitas y período actual.
 */

import { useMemo, useCallback } from 'react';
import { FiClipboard, FiCheckSquare, FiCalendar, FiClock, FiChevronRight, FiInbox } from 'react-icons/fi';
import { useTabs } from '../../../context/tab';
import type { DashboardStats } from '../types';

interface PendingTasksPanelProps {
  stats: DashboardStats | null;
  onTaskNavigate?: () => void;
}

/** Calcula los días restantes hasta una fecha */
const daysRemaining = (endDate: string): number => {
  const now = new Date();
  const end = new Date(endDate);
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

/** Calcula el progreso porcentual entre dos fechas */
const periodProgress = (startDate: string, endDate: string): number => {
  const now = new Date().getTime();
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  if (end <= start) return 100;
  const elapsed = now - start;
  const total = end - start;
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
};

/** Formatea fecha ISO a locale es-VE */
const formatDate = (dateStr: string): string =>
  new Date(dateStr).toLocaleDateString('es-VE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

// ─── Sección de tarea individual ──────────────────────────────────

interface TaskSectionProps {
  icon: React.ReactNode;
  title: string;
  count: number;
  href: string;
  description?: string;
  color: string;
  onNavigate?: () => void;
}

const TaskSection = ({ icon, title, count, href, description, color, onNavigate }: TaskSectionProps) => {
  const { openTab } = useTabs();

  const handleClick = useCallback(() => {
    openTab(href, title);
    onNavigate?.();
  }, [openTab, href, title, onNavigate]);

  if (count === 0) return null;

  return (
    <button
      onClick={handleClick}
      className="w-full flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left group"
    >
      <div className={`flex items-center justify-center size-10 rounded-xl shrink-0 ${color}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-text-emphasis dark:text-text-emphasis text-sm">{title}</p>
        {description && (
          <p className="text-xs text-text-secondary mt-0.5">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-lg font-bold text-text-emphasis dark:text-text-emphasis">{count}</span>
        <FiChevronRight className="size-4 text-text-secondary group-hover:text-text-emphasis transition-colors" />
      </div>
    </button>
  );
};

// ─── Sección de período actual ────────────────────────────────────

interface PeriodSectionProps {
  period: NonNullable<DashboardStats['currentPeriod']>;
  onNavigate?: () => void;
}

const PeriodSection = ({ period, onNavigate }: PeriodSectionProps) => {
  const { openTab } = useTabs();
  const remaining = useMemo(() => daysRemaining(period.endDate), [period.endDate]);
  const progress = useMemo(() => periodProgress(period.startDate, period.endDate), [period.startDate, period.endDate]);

  const handleClick = useCallback(() => {
    openTab('/period', 'Período');
    onNavigate?.();
  }, [openTab, onNavigate]);

  return (
    <button
      onClick={handleClick}
      className="w-full p-4 rounded-xl bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-800/30 text-left group hover:bg-brand-100 dark:hover:bg-brand-900/30 transition-colors"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center justify-center size-10 rounded-xl bg-brand-100 dark:bg-brand-800/40 shrink-0">
          <FiClock className="size-5 text-brand-600 dark:text-brand-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-brand-700 dark:text-brand-300 text-sm">Período Actual</p>
          <p className="text-xs text-brand-600/70 dark:text-brand-400/70 mt-0.5 truncate">{period.description}</p>
        </div>
        <FiChevronRight className="size-4 text-brand-400 group-hover:text-brand-600 transition-colors shrink-0" />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5 sm:gap-0 text-xs text-brand-600/60 dark:text-brand-400/60 mb-2">
        <span>Inicio: {formatDate(period.startDate)}</span>
        <span>Cierre: {formatDate(period.endDate)}</span>
      </div>

      {/* Barra de progreso */}
      <div className="w-full h-2 bg-brand-200 dark:bg-brand-800/40 rounded-full overflow-hidden mb-2">
        <div
          className="h-full bg-brand-500 dark:bg-brand-500 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-brand-600 dark:text-brand-400">{progress}% completado</span>
        <span className="text-xs font-semibold text-brand-700 dark:text-brand-300">
          {remaining > 0 ? `Faltan ${remaining} días` : 'Finalizando'}
        </span>
      </div>
    </button>
  );
};

// ─── Sin período activo ───────────────────────────────────────────

interface NoPeriodBannerProps {
  onNavigate?: () => void;
}

const NoPeriodBanner = ({ onNavigate }: NoPeriodBannerProps) => {
  const { openTab } = useTabs();

  const handleClick = useCallback(() => {
    openTab('/period', 'Período');
    onNavigate?.();
  }, [openTab, onNavigate]);

  return (
    <button
      onClick={handleClick}
      className="w-full p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 text-left group hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center size-10 rounded-xl bg-amber-100 dark:bg-amber-800/40 shrink-0">
          <FiClock className="size-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-amber-700 dark:text-amber-300 text-sm">No hay período activo</p>
          <p className="text-xs text-amber-600/70 dark:text-amber-400/70 mt-0.5">Configurar período académico</p>
        </div>
        <FiChevronRight className="size-4 text-amber-400 group-hover:text-amber-600 transition-colors shrink-0" />
      </div>
    </button>
  );
};

// ─── Empty State ──────────────────────────────────────────────────

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center h-full text-center px-4">
    <div className="flex items-center justify-center size-16 rounded-full bg-green-50 dark:bg-green-900/20 mb-4">
      <FiInbox className="size-7 text-green-500 dark:text-green-400" />
    </div>
    <p className="text-lg font-semibold text-text-emphasis dark:text-text-emphasis">No hay tareas pendientes</p>
    <p className="text-sm text-text-secondary mt-1 max-w-[240px]">Todo está al día. Disfruta el silencio administrativo.</p>
  </div>
);

// ─── Componente principal ─────────────────────────────────────────

const PendingTasksPanel = ({ stats, onTaskNavigate }: PendingTasksPanelProps) => {
  const pendingRequests = stats?.pendingRequests ?? 0;
  const pendingEvaluations = stats?.pendingEvaluations ?? 0;
  const upcomingVisits = stats?.upcomingVisits ?? 0;
  const currentPeriod = stats?.currentPeriod ?? null;

  const totalPending = pendingRequests + pendingEvaluations + upcomingVisits;
  const hasContent = totalPending > 0 || currentPeriod !== null;

  if (!hasContent) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-4">
      {/* Solicitudes Pendientes */}
      <TaskSection
        icon={<FiClipboard className="size-5 text-orange-600 dark:text-orange-400" />}
        title="Solicitudes Pendientes"
        count={pendingRequests}
        href="/admin/requests"
        description="Esperando atención"
        color="bg-orange-100 dark:bg-orange-900/30"
        onNavigate={onTaskNavigate}
      />

      {/* Evaluaciones Pendientes */}
      <TaskSection
        icon={<FiCheckSquare className="size-5 text-purple-600 dark:text-purple-400" />}
        title="Evaluaciones Pendientes"
        count={pendingEvaluations}
        href="/evaluations"
        description="Estudiantes por evaluar"
        color="bg-purple-100 dark:bg-purple-900/30"
        onNavigate={onTaskNavigate}
      />

      {/* Visitas Próximas */}
      <TaskSection
        icon={<FiCalendar className="size-5 text-blue-600 dark:text-blue-400" />}
        title="Visitas Próximas"
        count={upcomingVisits}
        href="/tracking"
        description="Próximos 7 días"
        color="bg-blue-100 dark:bg-blue-900/30"
        onNavigate={onTaskNavigate}
      />

      {/* Separador solo si hay tareas Y período */}
      {(pendingRequests > 0 || pendingEvaluations > 0 || upcomingVisits > 0) && (
        <div className="border-t border-border-light dark:border-border-dark pt-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary mb-2 px-1">Sistema</p>
        </div>
      )}

      {/* Período Actual */}
      {currentPeriod ? (
        <PeriodSection period={currentPeriod} onNavigate={onTaskNavigate} />
      ) : (
        <NoPeriodBanner onNavigate={onTaskNavigate} />
      )}
    </div>
  );
};

export default PendingTasksPanel;
