import React from 'react';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { MessageBubbleProps } from '../types';
import { cn } from '../../../utils/cn';

// Custom icon components matching the project's icon system
const BotIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
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

// Markdown components for rich rendering
const MarkdownComponents: Components = {
    // Table styling
    table: ({ ...props }: any) => (
        <div className="overflow-x-auto my-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700" {...props} />
        </div>
    ),
    thead: ({ ...props }: any) => (
        <thead className="bg-gray-50 dark:bg-gray-800" {...props} />
    ),
    th: ({ ...props }: any) => (
        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider" {...props} />
    ),
    tbody: ({ ...props }: any) => (
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700" {...props} />
    ),
    tr: ({ ...props }: any) => (
        <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors" {...props} />
    ),
    td: ({ children, ...props }: any) => {
        // Status badge logic
        const content = String(children).toLowerCase().trim();
        let badgeClass = "";
        
        if (content === "culminado" || content.includes("culminado")) {
            badgeClass = "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800";
        } else if (content === "en curso" || content.includes("en curso")) {
            badgeClass = "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800";
        } else if (content === "próximo" || content.includes("próximo")) {
            badgeClass = "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800";
        }

        if (badgeClass) {
             return (
                <td className="px-4 py-3 text-sm whitespace-nowrap" {...props}>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badgeClass}`}>
                        {children}
                    </span>
                </td>
             );
        }
        
        return (
            <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300" {...props}>
                {children}
            </td>
        );
    },
    // List styling
    ul: ({ ...props }: any) => <ul className="list-disc pl-5 my-2 space-y-1" {...props} />,
    ol: ({ ...props }: any) => <ol className="list-decimal pl-5 my-2 space-y-1" {...props} />,
    li: ({ ...props }: any) => <li className="text-sm" {...props} />,
    // Heading styling
    h1: ({ ...props }: any) => <h1 className="text-xl font-bold mt-4 mb-2" {...props} />,
    h2: ({ ...props }: any) => <h2 className="text-lg font-bold mt-3 mb-2" {...props} />,
    h3: ({ ...props }: any) => <h3 className="text-md font-bold mt-2 mb-1" {...props} />,
    // Paragraph
    p: ({ ...props }: any) => <p className="mb-2 last:mb-0" {...props} />,
    // Links
    a: ({ ...props }: any) => (
        <a 
            className="text-brand-600 dark:text-brand-400 hover:underline font-medium inline-flex items-center gap-1" 
            target="_blank" 
            rel="noopener noreferrer" 
            {...props}
        >
            {props.children}
            <ExternalLinkIcon />
        </a>
    ),
};

/**
 * Burbuja de mensaje con diseño estructurado institucional
 * Renderiza Markdown con soporte avanzado para tablas y estilos
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
                <div className="shrink-0 h-8 w-8 rounded-lg bg-linear-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white shadow-theme-sm">
                    <BotIcon />
                </div>
            )}

            <div className={cn('flex flex-col gap-1.5 max-w-[95%] md:max-w-[85%]', isAI ? 'items-start' : 'items-end')}>
                {/* Mensaje con diseño estructurado */}
                <div
                    className={cn(
                        'border px-4 py-2.5 transition-colors shadow-theme-xs',
                        isAI
                            ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-lg rounded-tl-sm w-full'
                            : 'bg-brand-500 text-white border-brand-600 rounded-lg rounded-tr-sm'
                    )}
                >
                    <div className={cn(
                        "text-sm leading-relaxed",
                        !isAI && "text-white"
                    )}>
                        {isAI ? (
                            <ReactMarkdown 
                                remarkPlugins={[remarkGfm]}
                                components={MarkdownComponents}
                            >
                                {message.content}
                            </ReactMarkdown>
                        ) : (
                            <div className="whitespace-pre-wrap">{message.content}</div>
                        )}
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
                <div className="shrink-0 h-8 w-8 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center shadow-theme-xs">
                    <UserIcon />
                </div>
            )}
        </div>
    );
};

