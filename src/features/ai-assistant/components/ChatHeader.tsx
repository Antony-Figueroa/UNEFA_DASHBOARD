import React from 'react';
import { ChatHeaderProps } from '../types';
import { TrashBinIcon } from '../../../icons';
import { exportConversation } from '../services/exportService';
import { Message } from '../types';

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

const DownloadIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
);

const CopyIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
);

/**
 * Header profesional del asistente de IA UNEFA
 * Diseño institucional con badge oficial
 */
export const ChatHeader: React.FC<ChatHeaderProps & { messages?: Message[]; title?: string; onExport?: (format: 'json' | 'text') => void }> = ({
    onClearChat,
    onSettingsClick,
    onHistoryToggle,
    messages,
    title = 'Conversación',
    onExport,
}) => {

    const handleExportJSON = () => {
        if (messages && messages.length > 0) {
            exportConversation(messages, title, 'json');
        }
    };

    const handleExportText = () => {
        if (messages && messages.length > 0) {
            exportConversation(messages, title, 'text');
        }
    };

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
                        {/* Export buttons */}
                        {messages && messages.length > 0 && (
                            <>
                                <button
                                    onClick={handleExportJSON}
                                    className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                    aria-label="Exportar como JSON"
                                    title="Exportar JSON"
                                >
                                    <span className="text-xs font-bold">{'{}'}</span>
                                </button>
                                <button
                                    onClick={handleExportText}
                                    className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                    aria-label="Exportar como texto"
                                    title="Exportar TXT"
                                >
                                    <DownloadIcon />
                                </button>
                            </>
                        )}

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
