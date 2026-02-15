import { useState, useCallback, useEffect, useRef } from 'react';
import { Message, UseAIChatReturn, ChatSession } from '../types';
import { GoogleAIService } from '../services/GoogleAIService';
import { OpenRouterService } from '../services/OpenRouterService';
import { useStreamResponse } from './useStreamResponse';
import { useAIContext } from './useAIContext';
import { useAuth } from '../../auth/hooks/useAuth';
import { chatHistoryService } from '../services/ChatHistoryService';

/**
 * Hook principal para manejar la lógica del chat de IA
 */
export const useAIChat = (): UseAIChatReturn => {
    const { user } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { systemContext } = useAIContext();
    
    // Al terminar el stream, añadimos el mensaje final del asistente y guardamos
    const { 
        streamingText, 
        isStreaming, 
        startStreaming, 
        handleChunk, 
        endStreaming 
    } = useStreamResponse((fullText) => {
        const assistantMessage: Message = {
            id: Date.now().toString(),
            role: 'assistant',
            content: fullText,
            timestamp: new Date(),
        };
        
        setMessages(prev => {
            const newMessages = [...prev, assistantMessage];
            // Guardar en persistencia
            if (user && currentSession) {
                chatHistoryService.saveSession(user.id, {
                    ...currentSession,
                    messages: newMessages
                });
            }
            return newMessages;
        });
    });

    // Referencia al servicio 
    const aiService = useRef<any>(null);

    // 1. Inicializar servicios de IA
    useEffect(() => {
        const apiKey = import.meta.env.VITE_GOOGLE_AI_KEY;
        const model = 'gemma-3-1b-it'; 
        
        if (apiKey) {
            aiService.current = new GoogleAIService(model, apiKey);
        } else {
            const orKey = import.meta.env.VITE_OPENROUTER_KEY;
            if (orKey) {
                aiService.current = new OpenRouterService('google/gemma-2-9b-it:free', orKey);
            }
        }
    }, []);

    // 2. Cargar historial cuando el usuario está disponible
    useEffect(() => {
        if (!user) {
            setMessages([]);
            setCurrentSession(null);
            return;
        }

        const loadLastSession = async () => {
            const sessions = await chatHistoryService.getSessions(user.id);
            if (sessions.length > 0) {
                // Cargar la más reciente
                const last = sessions[0];
                setCurrentSession(last);
                setMessages(last.messages);
            } else {
                // Crear una nueva si no hay ninguna
                const newSession = chatHistoryService.createNewSession(user.id);
                setCurrentSession(newSession);
                setMessages([]);
            }
        };

        loadLastSession();
    }, [user]);

    const sendMessage = useCallback(async (content: string) => {
        if (!content.trim() || !aiService.current || !user || !currentSession || isLoading || isStreaming) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content,
            timestamp: new Date(),
        };

        const updatedMessages = [...messages, userMessage];
        setMessages(updatedMessages);
        
        // Guardar mensaje del usuario inmediatamente
        chatHistoryService.saveSession(user.id, {
            ...currentSession,
            messages: updatedMessages,
            title: currentSession.messages.length === 0 ? content.substring(0, 40) : currentSession.title
        });

        setIsLoading(true);
        setError(null);

        try {
            startStreaming();
            await aiService.current.streamMessage(
                { 
                    messages: updatedMessages,
                    systemInstruction: systemContext
                },
                (chunk: string) => handleChunk(chunk)
            );
            endStreaming();
        } catch (err: any) {
            console.error('Error sending message:', err);
            setError(err.message || 'Error al comunicarse con la IA');
            // Si hay error, detenemos el streaming
            endStreaming();
        } finally {
            setIsLoading(false);
        }
    }, [messages, startStreaming, handleChunk, endStreaming, user, currentSession, systemContext, isLoading, isStreaming]);

    const clearHistory = useCallback(() => {
        if (user) {
            const newSession = chatHistoryService.createNewSession(user.id);
            setCurrentSession(newSession);
            setMessages([]);
        }
        setError(null);
    }, [user]);

    const retryLastMessage = useCallback(async () => {
        const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
        if (lastUserMsg) {
            setMessages(prev => prev.filter(m => m.id !== prev[prev.length - 1].id));
            await sendMessage(lastUserMsg.content);
        }
    }, [messages, sendMessage]);

    const allMessages = isStreaming 
        ? [...messages, { 
            id: 'streaming', 
            role: 'assistant' as const, 
            content: streamingText, 
            timestamp: new Date(),
            status: 'streaming' as const
          }]
        : messages;

    const loadSession = useCallback(async (sessionId: string) => {
        if (!user) return;
        const sessions = await chatHistoryService.getSessions(user.id);
        const session = sessions.find(s => s.id === sessionId);
        if (session) {
            setCurrentSession(session);
            setMessages(session.messages);
        }
    }, [user]);

    const deleteSession = useCallback(async (sessionId: string) => {
        if (!user) return;
        await chatHistoryService.deleteSession(user.id, sessionId);
        if (currentSession?.id === sessionId) {
            clearHistory();
        }
    }, [user, currentSession, clearHistory]);

    const suggestions = [
        '¿Cómo va el proceso de pasantías?',
        'Requisitos para inscripción',
        'Estado del periodo actual',
        'Manual de usuario del dashboard'
    ];

    return {
        messages: allMessages,
        isLoading,
        isStreaming,
        error,
        sendMessage,
        clearHistory,
        retryLastMessage,
        currentSession,
        loadSession,
        deleteSession,
        suggestions
    };
};
