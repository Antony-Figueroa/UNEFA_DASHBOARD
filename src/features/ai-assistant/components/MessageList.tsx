import React, { useRef, useEffect } from 'react';
import { MessageListProps } from '../types';
import { MessageBubble } from './MessageBubble';
import { TypingIndicator } from './TypingIndicator';
import { ChatIcon } from '../../../icons';

/**
 * Lista de mensajes con scroll automático
 * Incluye un empty state institucional cuando no hay mensajes
 */
export const MessageList: React.FC<MessageListProps> = ({
    messages,
    isLoading,
    isStreaming,
    onActionClick
}) => {
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Auto-scroll al último mensaje
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    return (
        <div
            ref={containerRef}
            className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar bg-gray-50/30 dark:bg-gray-900/30"
        >
            {messages.length === 0 && !isLoading ? (
                // Empty state institucional UNEFA
                <div className="flex h-full items-center justify-center min-h-[400px]">
                    <div className="text-center max-w-xl px-4 animate-fade-in">
                        {/* Icon institucional */}
                        <div className="flex justify-center mb-6">
                            <div className="flex h-24 w-24 items-center justify-center rounded-2xl border-2 border-brand-200 dark:border-brand-800 bg-gradient-to-br from-brand-50 to-blue-light-50 dark:from-brand-900/20 dark:to-blue-light-900/20 shadow-theme-sm">
                                <ChatIcon className="text-brand-600 dark:text-brand-400" style={{ width: '48px', height: '48px' }} />
                            </div>
                        </div>

                        {/* Mensaje de bienvenida */}
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                            ¡Hola! Soy tu Asistente de IA UNEFA
                        </h3>
                        <p className="text-base text-gray-600 dark:text-gray-400 mb-8 leading-relaxed max-w-lg mx-auto">
                            Estoy aquí para orientarte en tus procesos académicos y responder dudas sobre el sistema de gestión.
                        </p>

                        {/* Casos de uso UNEFA específicos con diseño de tarjetas sutiles */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
                            <div className="flex flex-col gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 hover:border-brand-300 dark:hover:border-brand-600 transition-colors cursor-default shadow-theme-xs">
                                <span className="text-xl">📅</span>
                                <p className="text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider">Periodo Académico</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Consulta fechas y lapsos del semestre actual.</p>
                            </div>

                            <div className="flex flex-col gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 hover:border-brand-300 dark:hover:border-brand-600 transition-colors cursor-default shadow-theme-xs">
                                <span className="text-xl">📊</span>
                                <p className="text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider">Estadísticas</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Pídeme un resumen de los datos del dashboard.</p>
                            </div>

                            <div className="flex flex-col gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 hover:border-brand-300 dark:hover:border-brand-600 transition-colors cursor-default shadow-theme-xs">
                                <span className="text-xl">📝</span>
                                <p className="text-xs font-semibold text-gray-900 dark:text-white uppercase tracking-wider">Trámites</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Orientación sobre inscripciones y pasantías.</p>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {messages.map((message) => (
                        <MessageBubble
                            key={message.id}
                            message={message}
                            isAI={message.role === 'assistant'}
                            onActionClick={onActionClick}
                        />
                    ))}

                    {/* Loading indicator - Mostrar mientras carga o streaming */}
                    {(isLoading || isStreaming) && (
                        <div className="flex justify-start">
                            <TypingIndicator />
                        </div>
                    )}

                    {/* Auto-scroll anchor */}
                    <div ref={messagesEndRef} className="h-4" />
                </div>
            )}
        </div>
    );
};
