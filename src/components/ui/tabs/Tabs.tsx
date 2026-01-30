import React from 'react';
import { cn } from '../../../utils/cn';

/**
 * Represents a single tab option.
 */
interface TabOption {
  /** Unique identifier for the tab. */
  id: string;
  /** Display label for the tab. */
  label: string;
  /** Optional count badge to show next to the label. */
  count?: number;
}

/**
 * Props for the Tabs component.
 */
interface TabsProps {
  /** Array of tab options. */
  options: TabOption[];
  /** ID of the currently active tab. */
  activeTab: string;
  /** Callback fired when a tab is clicked. */
  onTabChange: (id: string) => void;
  /** Visual variant of the tabs. Defaults to 'underline'. */
  variant?: 'pills' | 'underline';
  /** Additional CSS classes for the container. */
  className?: string;
}

/**
 * Flexible Tabs component with support for pills and underline variants.
 * Includes accessibility features like role="tablist" and keyboard support.
 * 
 * @example
 * ```tsx
 * <Tabs 
 *   options={[{ id: 'all', label: 'Todos', count: 10 }, { id: 'active', label: 'Activos' }]} 
 *   activeTab={active} 
 *   onTabChange={setActive} 
 * />
 * ```
 */
export const Tabs: React.FC<TabsProps> = ({
  options,
  activeTab,
  onTabChange,
  variant = 'underline',
  className = "",
}) => {
  if (variant === 'pills') {
    return (
      <div 
        className={cn("flex flex-wrap gap-2 sm:gap-4", className)} 
        role="tablist"
        aria-label="Tabs de navegación"
      >
        {options.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              id={`tab-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "px-6 py-2 rounded-lg font-medium transition-all duration-200 text-sm",
                isActive
                  ? "bg-brand-500 text-white shadow-md"
                  : "bg-bg-main text-text-secondary hover:bg-brand-500 hover:text-white dark:bg-bg-dark dark:text-text-tertiary dark:hover:bg-brand-500 dark:hover:text-white border border-border-light dark:border-border-dark"
              )}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className={cn(
                  "ml-2 px-1.5 py-0.5 text-[10px] rounded-full",
                  isActive ? "bg-white/20" : "bg-bg-secondary dark:bg-white/10"
                )}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "flex border-b border-border-light dark:border-border-dark overflow-x-auto scrollbar-hide", 
        className
      )} 
      role="tablist"
      aria-label="Tabs de navegación"
    >
      {options.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${tab.id}`}
            id={`tab-${tab.id}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "pb-3 px-4 text-sm font-medium transition-colors relative whitespace-nowrap min-w-max",
              isActive 
                ? "text-brand-500" 
                : "text-text-tertiary hover:text-text-primary dark:hover:text-text-emphasis"
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-bg-secondary dark:bg-white/10 rounded-full">
                {tab.count}
              </span>
            )}
            {isActive && (
              <div 
                className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-500 animate-slideInLeft" 
                aria-hidden="true"
              />
            )}
          </button>
        );
      })}
    </div>
  );
};
