import React from 'react';
import { ChatHeaderProps } from '../types';
import { TrashBinIcon } from '../../../icons';

const SettingsIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v6m0 6v6M5.6 5.6l4.2 4.2m4.2 4.2l4.2 4.2M1 12h6m6 0h6M5.6 18.4l4.2-4.2m4.2-4.2l4.2-4.2" />
    </svg>
);



const ClockIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
    </svg>
);

/**
 * Header profesional del asistente de IA UNEFA
 * Diseño institucional con badge oficial
 */
export const ChatHeader: React.FC<ChatHeaderProps> = ({
    onClearChat,
    onSettingsClick,
    onHistoryToggle
}) => {
    return (
        <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950/50 backdrop-blur-md sticky top-0 z-10">
            <div className="flex items-center justify-between px-6 py-5">
                {/* Left section */}
                <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2 mb-1">
                            <h1 className="text-base font-semibold text-gray-900 dark:text-white">
                                Asistente de IA UNEFA
                            </h1>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Siempre disponible para ayudarte
                        </p>
                    </div>
                </div>

                {/* Right section - Actions */}
                <div className="flex items-center gap-3">
                    {/* Actions */}
                    <div className="flex items-center gap-1">
                        {onHistoryToggle && (
                            <button
                                onClick={onHistoryToggle}
                                className="flex h-9 px-3 items-center gap-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border border-gray-200 dark:border-gray-700"
                                aria-label="Historial de conversaciones"
                                title="Historial de conversaciones"
                            >
                                <ClockIcon />
                                <span className="text-xs font-medium hidden md:inline">Historial</span>
                            </button>
                        )}

                        {onClearChat && (
                            <button
                                onClick={onClearChat}
                                className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-error-50 dark:hover:bg-error-900/20 hover:text-error-600 transition-colors"
                                aria-label="Limpiar conversación"
                                title="Limpiar conversación"
                            >
                                <TrashBinIcon className="h-5 w-5" />
                            </button>
                        )}

                        <button
                            onClick={onSettingsClick}
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            aria-label="Configuración"
                            title="Configuración"
                        >
                            <SettingsIcon />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
