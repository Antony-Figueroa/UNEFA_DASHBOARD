import { useState, useCallback } from 'react';

export interface TabOption {
  id: string;
  label: string;
  count?: number;
}

interface UseTabsOptions {
  defaultTab?: string;
}

interface UseTabsReturn {
  activeTab: string;
  setActiveTab: (id: string) => void;
  tabProps: {
    activeTab: string;
    onTabChange: (id: string) => void;
  };
}

/**
 * Hook for managing active tab state.
 * Provides consistent state management for the Tabs component.
 *
 * @example
 * ```tsx
 * const tabsState = useTabs({ defaultTab: 'active' });
 *
 * <Tabs
 *   options={[
 *     { id: 'active', label: 'Activos', count: activeCount },
 *     { id: 'inactive', label: 'Inactivos', count: inactiveCount },
 *   ]}
 *   {...tabsState.tabProps}
 *   variant="underline"
 * />
 * ```
 */
export function useTabs({ defaultTab }: UseTabsOptions = {}): UseTabsReturn {
  const [activeTab, setActiveTab] = useState<string>(defaultTab || '');

  const handleTabChange = useCallback((id: string) => {
    setActiveTab(id);
  }, []);

  return {
    activeTab,
    setActiveTab,
    tabProps: {
      activeTab,
      onTabChange: handleTabChange,
    },
  };
}
