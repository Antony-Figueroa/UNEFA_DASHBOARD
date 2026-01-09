import React from 'react';
import { UserIcon } from '../../../icons';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = "",
}) => {
  return (
    <div className={`py-12 flex flex-col items-center justify-center text-center animate-fadeIn ${className}`}>
      <div className="mb-4 rounded-full bg-bg-secondary p-4 dark:bg-white/5">
        {icon || <UserIcon className="h-8 w-8 text-text-tertiary" />}
      </div>
      <h3 className="text-sm font-bold text-text-primary dark:text-text-emphasis">
        {title}
      </h3>
      {description && (
        <p className="mt-1 text-xs text-text-secondary dark:text-text-tertiary max-w-62.5 mx-auto">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
};
