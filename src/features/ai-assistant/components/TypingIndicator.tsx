import React from 'react';

/**
 * Indicador profesional de consulta del asistente
 */
export const TypingIndicator: React.FC = () => {
    return (
        <div className="flex gap-3 mb-4 items-start">
            {/* Avatar del asistente */}
            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="10" rx="2" />
                    <circle cx="12" cy="5" r="2" />
                    <path d="M12 7v4" />
                    <line x1="8" y1="16" x2="8.01" y2="16" />
                    <line x1="16" y1="16" x2="16.01" y2="16" />
                </svg>
            </div>

            {/* Professional typing indicator */}
            <div className="flex flex-col gap-1">
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-2.5 rounded-lg rounded-tl-sm">
                    <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                            <div className="h-1.5 w-1.5 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                            <div className="h-1.5 w-1.5 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                            <div className="h-1.5 w-1.5 rounded-full bg-brand-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                        <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                            Consultando documentación...
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};
