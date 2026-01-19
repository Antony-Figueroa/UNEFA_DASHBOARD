import React from "react";
import { MoreDotIcon } from "../../icons";
import { DashboardStats } from "../../features/dashboard/types";

interface QuickStatItemProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  colorClass: string;
  loading?: boolean;
}

const QuickStatItem: React.FC<QuickStatItemProps> = ({ icon, label, value, colorClass, loading }) => {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-border-light bg-bg-main p-3 dark:border-border-dark dark:bg-bg-dark">
      <div className="flex items-center gap-2.5">
        <div className={`flex size-9 items-center justify-center rounded-xl ${colorClass}`}>
          {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: "size-4.5" })}
        </div>
        <div>
          <span className="text-[10px] leading-tight text-text-secondary dark:text-text-tertiary">
            {label}
          </span>
          {loading ? (
            <div className="h-4 w-12 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
          ) : (
            <h4 className="text-xs font-bold leading-tight text-text-primary dark:text-white">
              {value}
            </h4>
          )}
        </div>
      </div>
      <button className="text-text-tertiary hover:text-text-primary dark:hover:text-white">
        <MoreDotIcon className="size-4" />
      </button>
    </div>
  );
};

interface HomeQuickStatsProps {
  stats: DashboardStats | null;
  loading: boolean;
}

const HomeQuickStats: React.FC<HomeQuickStatsProps> = ({ stats, loading }) => {
  const periodInfo = stats?.currentPeriod 
    ? `${stats.currentPeriod.description} (${stats.currentPeriod.startDate} / ${stats.currentPeriod.endDate})`
    : "Sin período activo";

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <QuickStatItem
        icon={
          <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        }
        label="Período en curso"
        value={periodInfo}
        colorClass="bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400"
        loading={loading}
      />
      <QuickStatItem
        icon={
          <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        }
        label="Estudiantes activos"
        value={stats?.activeStudents || 0}
        colorClass="bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-400"
        loading={loading}
      />
      <QuickStatItem
        icon={
          <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        }
        label="Instituciones activas"
        value={stats?.activeInstitutions || 0}
        colorClass="bg-warning-50 text-warning-600 dark:bg-warning-500/10 dark:text-warning-400"
        loading={loading}
      />
    </div>
  );
};

export default HomeQuickStats;
