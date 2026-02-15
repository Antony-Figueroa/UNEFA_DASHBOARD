import React from 'react';
import { MessageBubbleProps } from '../types';
import { cn } from '../../../utils/cn';

// Custom icon components matching the project's icon system
const BotIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="11" width="18" height="10" rx="2" />
        <circle cx="12" cy="5" r="2" />
        <path d="M12 7v4" />
        <line x1="8" y1="16" x2="8.01" y2="16" />
        <line x1="16" y1="16" x2="16.01" y2="16" />
    </svg>
);

const UserIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
    </svg>
);

const CopyIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
);

const ExternalLinkIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        <polyline points="15 3 21 3 21 9" />
        <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
);

/**
 * Burbuja de mensaje con diseño estructurado institucional
 * TODO: Reactivar Markdown una vez instaladas las dependencias
 */
export const MessageBubble: React.FC<MessageBubbleProps> = ({
    message,
    isAI,
    onActionClick
}) => {
    const formattedTime = new Date(message.timestamp).toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
    });

    return (
        <div
            className={cn(
                'flex gap-3 mb-4 animate-fade-in',
                isAI ? 'justify-start' : 'justify-end'
            )}
        >
            {/* Avatar del asistente (solo para mensajes de IA) */}
            {isAI && (
                <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white shadow-theme-sm">
                    <BotIcon />
                </div>
            )}

            <div className={cn('flex flex-col gap-1.5 max-w-[85%]', isAI ? 'items-start' : 'items-end')}>
                {/* Mensaje con diseño estructurado */}
                <div
                    className={cn(
                        'border px-4 py-2.5 transition-colors shadow-theme-xs',
                        isAI
                            ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-lg rounded-tl-sm'
                            : 'bg-brand-500 text-white border-brand-600 rounded-lg rounded-tr-sm'
                    )}
                >
                    <div className={cn(
                        "text-sm leading-relaxed whitespace-pre-wrap",
                        !isAI && "text-white"
                    )}>
                        {message.content}
                    </div>

                    {/* Status indicators */}
                    {message.status === 'sending' && !isAI && (
                        <div className="flex items-center gap-1.5 mt-2 text-xs opacity-80">
                            <div className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full" />
                            <span>Enviando...</span>
                        </div>
                    )}

                    {message.status === 'error' && (
                        <div className="flex items-center gap-1.5 mt-2 text-xs text-error-300">
                            <span>❌ Error al enviar</span>
                        </div>
                    )}
                </div>

                {/* Acciones del mensaje */}
                {message.actions && message.actions.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                        {message.actions.map((action, index) => (
                            <button
                                key={index}
                                onClick={() => onActionClick?.(action)}
                                className={cn(
                                    'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors',
                                    action.variant === 'primary'
                                        ? 'bg-brand-500 text-white border-brand-600 hover:bg-brand-600'
                                        : action.variant === 'secondary'
                                            ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600'
                                            : 'bg-transparent text-brand-600 border-brand-200 hover:bg-brand-50 dark:hover:bg-brand-900/20'
                                )}
                            >
                                {action.type === 'navigate' && <ExternalLinkIcon />}
                                {action.type === 'copy' && <CopyIcon />}
                                {action.label}
                            </button>
                        ))}
                    </div>
                )}

                {/* Timestamp */}
                <span className="text-[10px] text-gray-500 dark:text-gray-500 px-1">
                    {formattedTime}
                </span>
            </div>

            {/* Avatar del usuario (solo para mensajes de usuario) */}
            {!isAI && (
                <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center shadow-theme-xs">
                    <UserIcon />
                </div>
            )}
        </div>
    );
};

