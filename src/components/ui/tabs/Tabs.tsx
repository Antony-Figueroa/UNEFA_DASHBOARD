import React from 'react';

interface TabOption {
  id: string;
  label: string;
  count?: number;
}

interface TabsProps {
  options: TabOption[];
  activeTab: string;
  onTabChange: (id: string) => void;
  variant?: 'pills' | 'underline';
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  options,
  activeTab,
  onTabChange,
  variant = 'underline',
  className = "",
}) => {
  if (variant === 'pills') {
    return (
      <div className={`flex gap-4 ${className}`}>
        {options.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              activeTab === tab.id
                ? "bg-brand-500 text-white shadow-md"
                : "bg-bg-main text-text-secondary hover:bg-bg-secondary dark:bg-bg-dark dark:text-text-tertiary dark:hover:bg-white/10 border border-border-light dark:border-border-dark"
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className={`ml-2 px-1.5 py-0.5 text-[10px] rounded-full ${
                activeTab === tab.id ? "bg-white/20" : "bg-bg-secondary dark:bg-white/10"
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className={`flex border-b border-border-light dark:border-border-dark ${className}`}>
      {options.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`pb-3 px-4 text-sm font-medium transition-colors relative ${
            activeTab === tab.id 
              ? "text-brand-500" 
              : "text-text-tertiary hover:text-text-primary dark:hover:text-text-emphasis"
          }`}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-bg-secondary dark:bg-white/10 rounded-full">
              {tab.count}
            </span>
          )}
          {activeTab === tab.id && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-500 animate-slideInLeft" />
          )}
        </button>
      ))}
    </div>
  );
};
