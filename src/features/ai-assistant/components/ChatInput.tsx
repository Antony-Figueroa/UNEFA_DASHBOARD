import React, { useState, useRef, KeyboardEvent, useCallback } from 'react';
import { ChatInputProps } from '../types';
import { PaperPlaneIcon } from '../../../icons';
import { analyzeFile, validateFile, formatFileSize } from '../services/fileAnalysisService';

/**
 * Input profesional del asistente de IA UNEFA
 * Diseño institucional con enfoque en usabilidad
 * Incluye soporte para subir archivos
 */
export const ChatInput: React.FC<ChatInputProps> = ({
    onSend,
    isLoading,
    placeholder = 'Escribe tu mensaje...',
    maxLength = 2000,
    onFileAnalyzed,
}) => {
    const [message, setMessage] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Manejar selección de archivo
    const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validar archivo
        const validation = validateFile(file);
        if (!validation.valid) {
            setUploadError(validation.error || 'Archivo no válido');
            return;
        }

        setUploadError(null);
        setSelectedFile(file);
        setIsAnalyzing(true);

        try {
            // Analizar archivo con Vision
            const result = await analyzeFile(file);

            if (result.success && result.analysis) {
                // Notificar al padre con el análisis
                onFileAnalyzed?.(result.analysis, file);
                // Agregar el análisis como mensaje
                onSend(`Analizando imagen: ${file.name}\n\n${result.analysis}`);
            } else {
                setUploadError(result.error || 'Error al analizar el archivo');
            }
        } catch (error: any) {
            setUploadError(error.message || 'Error al procesar el archivo');
        } finally {
            setIsAnalyzing(false);
            setSelectedFile(null);
            // Limpiar el input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    }, [onSend, onFileAnalyzed]);

    // Cancelar selección de archivo
    const handleClearFile = useCallback(() => {
        setSelectedFile(null);
        setUploadError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, []);

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
            {/* File preview */}
            {(selectedFile || uploadError) && (
                <div className="max-w-5xl mx-auto mb-3">
                    {selectedFile && (
                        <div className="flex items-center gap-3 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                                    📎 {selectedFile.name}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-500">
                                    {formatFileSize(selectedFile.size)}
                                </p>
                            </div>
                            {isAnalyzing ? (
                                <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleClearFile}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    )}
                    {uploadError && (
                        <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg">
                            {uploadError}
                        </div>
                    )}
                </div>
            )}

            {/* Input area */}
            <div className="flex items-end gap-3 max-w-5xl mx-auto">
                {/* Hidden file input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                />

                {/* Upload button */}
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading || isAnalyzing}
                    className="flex h-[52px] w-[52px] flex-shrink-0 items-center justify-center rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-500 hover:text-brand-500 hover:border-brand-300 dark:hover:border-brand-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                    aria-label="Subir archivo"
                    title="Subir imagen para analizar"
                >
                    {isAnalyzing ? (
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
                    ) : (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    )}
                </button>

                {/* Textarea container */}
                <div className="flex-1 relative group">
                    <textarea
                        ref={textareaRef}
                        value={message}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        disabled={isLoading || isAnalyzing}
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
                    disabled={!message.trim() || isLoading || isAnalyzing}
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
                Presiona <kbd className="px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 font-sans font-medium">Enter</kbd> para enviar • <kbd className="px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 font-sans font-medium">Shift + Enter</kbd> para nueva línea • <span className="text-brand-500">📎 Imágenes para analizar</span>
            </div>
        </div>
    );
};
