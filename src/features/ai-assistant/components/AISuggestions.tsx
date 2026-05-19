import React from 'react';
import { AISuggestionsProps } from '../types';

const LightbulbIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 18h6" />
        <path d="M10 22h4" />
        <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14" />
    </svg>
);

/**
 * Sugerencias rápidas institucionales para el usuario
 */
export const AISuggestions: React.FC<AISuggestionsProps> = ({
    suggestions,
    onSelect,
    maxVisible = 3
}) => {
    if (!suggestions || suggestions.length === 0) return null;

    const visibleSuggestions = (suggestions || []).slice(0, maxVisible);

    return (
        <div className="border-t border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 px-6 py-4">
            <div className="flex items-start gap-3">
                <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-brand-100 dark:bg-brand-900/30">
                    <LightbulbIcon />
                </div>

                <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2.5">
                        Sugerencias rápidas:
                    </p>

                    <div className="flex flex-wrap gap-2">
                        {visibleSuggestions.map((suggestion, index) => (
                            <button
                                key={index}
                                onClick={() => onSelect(suggestion)}
                                className="text-xs font-medium text-brand-700 dark:text-brand-400 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-brand-300 dark:hover:border-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 px-3 py-1.5 rounded-lg transition-colors"
                            >
                                {suggestion}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
