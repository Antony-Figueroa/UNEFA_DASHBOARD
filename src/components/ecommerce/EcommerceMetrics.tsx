import {
  ArrowDownIcon,
  ArrowUpIcon,
  BoxIconLine,
  GroupIcon,
} from "../../icons";
import Badge from "../ui/badge/Badge";
import { DashboardStats } from "../../features/dashboard/types";

interface EcommerceMetricsProps {
  stats: DashboardStats | null;
  loading: boolean;
}

export default function EcommerceMetrics({ stats, loading }: EcommerceMetricsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
      {/* <!-- Metric Item Start --> */}
      <div className="rounded-2xl border border-border-light bg-bg-main p-5 dark:border-border-dark dark:bg-bg-dark md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-bg-secondary rounded-xl dark:bg-white/5">
          <GroupIcon className="text-text-emphasis size-6 dark:text-text-emphasis" />
        </div>

        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-text-secondary dark:text-text-tertiary">
              Estudiantes
            </span>
            {loading ? (
              <div className="mt-2 h-7 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
            ) : (
              <h4 className="mt-2 font-bold text-text-emphasis text-title-sm dark:text-text-emphasis">
                {stats?.totalStudents.toLocaleString() || "0"}
              </h4>
            )}
          </div>
          <Badge color="success">
            <ArrowUpIcon />
            11.01%
          </Badge>
        </div>
      </div>
      {/* <!-- Metric Item End --> */}

      {/* <!-- Metric Item Start --> */}
      <div className="rounded-2xl border border-border-light bg-bg-main p-5 dark:border-border-dark dark:bg-bg-dark md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-bg-secondary rounded-xl dark:bg-white/5">
          <BoxIconLine className="text-text-emphasis size-6 dark:text-text-emphasis" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-text-secondary dark:text-text-tertiary">
              Inscripciones
            </span>
            {loading ? (
              <div className="mt-2 h-7 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700"></div>
            ) : (
              <h4 className="mt-2 font-bold text-text-emphasis text-title-sm dark:text-text-emphasis">
                {stats?.totalEnrollments.toLocaleString() || "0"}
              </h4>
            )}
          </div>

          <Badge color="error">
            <ArrowDownIcon />
            9.05%
          </Badge>
        </div>
      </div>
      {/* <!-- Metric Item End --> */}
    </div>
  );
}
