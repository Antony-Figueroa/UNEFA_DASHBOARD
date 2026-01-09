import {
  ArrowDownIcon,
  ArrowUpIcon,
  BoxIconLine,
  GroupIcon,
} from "../../icons";
import Badge from "../ui/badge/Badge";

export default function EcommerceMetrics() {
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
              Customers
            </span>
            <h4 className="mt-2 font-bold text-text-emphasis text-title-sm dark:text-text-emphasis">
              3,782
            </h4>
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
              Orders
            </span>
            <h4 className="mt-2 font-bold text-text-emphasis text-title-sm dark:text-text-emphasis">
              5,359
            </h4>
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
