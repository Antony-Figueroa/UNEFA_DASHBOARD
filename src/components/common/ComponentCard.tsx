import { cn } from "../../utils/cn";

/**
 * Props for the ComponentCard component.
 */
interface ComponentCardProps {
  /** The title of the card. */
  title: string;
  /** The content to be displayed inside the card body. */
  children: React.ReactNode;
  /** Additional CSS classes for the card container. */
  className?: string;
  /** Optional description text displayed below the title. */
  desc?: string;
  /** Optional action element (e.g., a button) displayed in the header. */
  headerAction?: React.ReactNode;
}

/**
 * A reusable card component for UI sections.
 * Includes a header with title/description and a body for content.
 * 
 * @example
 * ```tsx
 * <ComponentCard 
 *   title="User Profile" 
 *   desc="Manage user settings"
 *   headerAction={<Button>Edit</Button>}
 * >
 *   <p>Profile details...</p>
 * </ComponentCard>
 * ```
 */
const ComponentCard: React.FC<ComponentCardProps> = ({
  title,
  children,
  className = "",
  desc = "",
  headerAction,
}) => {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border-light bg-white dark:bg-bg-dark transition-all duration-300 shadow-theme-md hover:shadow-theme-lg focus-within:ring-2 focus-within:ring-brand-500/20",
        className
      )}
    >
      {/* Card Header */}
      <div className="px-6 py-5 flex items-center justify-between">
        <div>
          <h3 className="text-base font-medium text-text-emphasis dark:text-text-emphasis">
            {title}
          </h3>
          {desc && (
            <p className="mt-1 text-sm text-text-secondary dark:text-text-tertiary">
              {desc}
            </p>
          )}
        </div>
        {headerAction && (
          <div className="flex items-center gap-2">
            {headerAction}
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="p-4 border-t border-border-light dark:border-border-dark sm:p-6">
        <div className="space-y-6">{children}</div>
      </div>
    </div>
  );
};

export default ComponentCard;
