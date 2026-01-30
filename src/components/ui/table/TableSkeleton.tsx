import React from 'react';
import { cn } from '../../../utils/cn';

/**
 * Props for the TableSkeleton component.
 */
interface TableSkeletonProps {
  /** Number of rows to display. Defaults to 5. */
  rows?: number;
  /** Number of columns to display. Defaults to 5. */
  columns?: number;
  /** Whether to show a skeleton for filters above the table. Defaults to true. */
  hasFilters?: boolean;
  /** Additional CSS classes for the container. */
  className?: string;
}

/**
 * Loading skeleton component specifically for tables.
 * Mimics the structure of a standard table with optional filter section.
 * 
 * @example
 * ```tsx
 * <TableSkeleton rows={10} columns={4} />
 * ```
 */
export const TableSkeleton: React.FC<TableSkeletonProps> = ({
  rows = 5,
  columns = 5,
  hasFilters = true,
  className = "",
}) => {
  return (
    <div className={cn("w-full animate-pulse space-y-4", className)} aria-hidden="true">
      {hasFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-11 bg-bg-secondary dark:bg-white/5 rounded-lg" />
          ))}
        </div>
      )}
      
      <div className="border border-border-light dark:border-border-dark rounded-xl overflow-hidden">
        <div className="h-12 bg-bg-secondary dark:bg-white/5 border-b border-border-light dark:border-border-dark" />
        {[...Array(rows)].map((_, i) => (
          <div 
            key={i} 
            className="h-16 bg-bg-main dark:bg-transparent border-b border-border-light dark:border-border-dark last:border-0 flex items-center px-6 gap-4"
          >
            {[...Array(columns)].map((_, j) => (
              <div 
                key={j} 
                className={cn(
                  "h-4 bg-bg-secondary dark:bg-white/5 rounded-full",
                  j === 0 ? 'w-8' : j === 1 ? 'w-32' : 'flex-1'
                )}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
