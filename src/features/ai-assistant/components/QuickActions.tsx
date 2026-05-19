/**
 * QuickActions - Botones de acciones rápidas
 *
 * Botones predefinidos para acciones comunes
 */

import React from 'react';
import { QuickAction } from '../hooks/useChatConfig';

interface QuickActionsProps {
  actions: QuickAction[];
  onAction: (action: string) => void;
  disabled?: boolean;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  actions,
  onAction,
  disabled = false,
}) => {
  if (!actions || actions.length === 0) {
    return null;
  }

  return (
    <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400 flex-shrink-0">
          Acciones:
        </span>
        {actions.map(action => (
          <button
            key={action.id}
            onClick={() => onAction(action.action)}
            disabled={disabled}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-brand-50 dark:hover:bg-brand-900/20 hover:border-brand-300 dark:hover:border-brand-700 hover:text-brand-600 dark:hover:text-brand-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all whitespace-nowrap"
          >
            {action.icon && <span>{action.icon}</span>}
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;