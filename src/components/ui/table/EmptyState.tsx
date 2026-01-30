import React from 'react';
import { UserIcon } from '../../../icons';
import { cn } from '../../../utils/cn';

/**
 * Props for the EmptyState component.
 */
interface EmptyStateProps {
  /** Optional icon to display. Defaults to UserIcon. */
  icon?: React.ReactNode;
  /** Main title for the empty state. */
  title: string;
  /** Supporting description text. */
  description?: string;
  /** Optional action element (e.g., a button). */
  action?: React.ReactNode;
  /** Additional CSS classes. */
  className?: string;
}

/**
 * Component to display when there is no data to show in a list or table.
 * Provides visual feedback and optional call-to-action.
 * 
 * @example
 * ```tsx
 * <EmptyState 
 *   title="No hay estudiantes" 
 *   description="Comienza agregando uno nuevo."
 *   action={<Button>Agregar Estudiante</Button>}
 * />
 * ```
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  className = "",
}) => {
  return (
    <div className={cn(
      "py-12 flex flex-col items-center justify-center text-center animate-fadeIn",
      className
    )}>
      <div className="mb-4 rounded-full bg-bg-secondary p-4 dark:bg-white/5" aria-hidden="true">
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
