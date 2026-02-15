import React, { useState, useRef, KeyboardEvent } from 'react';
import { ChatInputProps } from '../types';
import { PaperPlaneIcon } from '../../../icons';

/**
 * Input profesional del asistente de IA UNEFA
 * Diseño institucional con enfoque en usabilidad
 */
export const ChatInput: React.FC<ChatInputProps> = ({
    onSend,
    isLoading,
    placeholder = 'Escribe tu mensaje...',
    maxLength = 2000,
}) => {
    const [message, setMessage] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleSend = () => {
        const trimmedMessage = message.trim();
        if (trimmedMessage && !isLoading) {
            onSend(trimmedMessage);
            setMessage('');
            // Reset textarea height
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
            }
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        // Enter sin Shift = enviar
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        if (value.length <= maxLength) {
            setMessage(value);

            // Auto-resize textarea
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
                textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
            }
        }
    };

    const characterCount = message.length;
    const isNearLimit = characterCount > maxLength * 0.9;

    return (
        <div className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-6 py-4">
            {/* Input area */}
            <div className="flex items-end gap-3 max-w-5xl mx-auto">
                {/* Textarea container */}
                <div className="flex-1 relative group">
                    <textarea
                        ref={textareaRef}
                        value={message}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        disabled={isLoading}
                        rows={1}
                        className="w-full resize-none rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3.5 pr-14 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-brand-500 dark:focus:border-brand-500 focus:outline-none focus:ring-4 focus:ring-brand-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        style={{ minHeight: '52px', maxHeight: '120px' }}
                    />

                    {/* Character counter */}
                    {characterCount > 0 && (
                        <div
                            className={`absolute right-4 bottom-3 text-[10px] font-medium transition-colors ${isNearLimit
                                ? 'text-error-500 dark:text-error-400'
                                : 'text-gray-400 dark:text-gray-500'
                                }`}
                        >
                            {characterCount}/{maxLength}
                        </div>
                    )}
                </div>

                {/* Send button */}
                <button
                    type="button"
                    onClick={handleSend}
                    disabled={!message.trim() || isLoading}
                    className="flex h-[52px] w-[52px] flex-shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white hover:bg-brand-600 active:bg-brand-700 disabled:opacity-40 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed transition-all shadow-theme-sm"
                    aria-label="Enviar mensaje"
                >
                    {isLoading ? (
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                        <PaperPlaneIcon className="text-white h-5 w-5" />
                    )}
                </button>
            </div>

            {/* Hint text */}
            <div className="mt-2 text-[10px] text-center text-gray-500 dark:text-gray-500">
                Presiona <kbd className="px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 font-sans font-medium">Enter</kbd> para enviar • <kbd className="px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 font-sans font-medium">Shift + Enter</kbd> para nueva línea
            </div>
        </div>
    );
};
