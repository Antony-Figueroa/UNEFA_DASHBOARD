import React from 'react';

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  hasFilters?: boolean;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({
  rows = 5,
  columns = 5,
  hasFilters = true,
}) => {
  return (
    <div className="w-full animate-pulse space-y-4">
      {hasFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-11 bg-gray-100 dark:bg-white/5 rounded-lg"></div>
          ))}
        </div>
      )}
      
      <div className="border border-gray-100 dark:border-white/5 rounded-xl overflow-hidden">
        <div className="h-12 bg-gray-50 dark:bg-white/5 border-b border-gray-100 dark:border-white/5"></div>
        {[...Array(rows)].map((_, i) => (
          <div 
            key={i} 
            className="h-16 bg-white dark:bg-transparent border-b border-gray-100 dark:border-white/5 last:border-0 flex items-center px-6 gap-4"
          >
            {[...Array(columns)].map((_, j) => (
              <div 
                key={j} 
                className={`h-4 bg-gray-100 dark:bg-white/5 rounded-full ${
                  j === 0 ? 'w-8' : j === 1 ? 'w-32' : 'flex-1'
                }`}
              ></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
