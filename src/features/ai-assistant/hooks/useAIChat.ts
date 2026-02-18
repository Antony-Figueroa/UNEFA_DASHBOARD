import { useState, useCallback, useEffect, useRef } from 'react';
import { Message, UseAIChatReturn, ChatSession } from '../types';
import { useStreamResponse } from './useStreamResponse';
import { useAuth } from '../../../context/auth';
import { chatHistoryService } from '../services/ChatHistoryService';
import { streamChatFromBackend } from '../services/BackendChatService';

export const useAIChat = (): UseAIChatReturn => {
    const { user, checkAuth } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const currentSessionRef = useRef<ChatSession | null>(null);
    const messagesRef = useRef<Message[]>([]);

    useEffect(() => {
        currentSessionRef.current = currentSession;
    }, [currentSession]);

    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

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
        
        const newMessages = [...messagesRef.current, assistantMessage];
        setMessages(newMessages);

        if (user && currentSessionRef.current) {
            const updatedSession = {
                ...currentSessionRef.current,
                messages: newMessages,
                updatedAt: new Date()
            };
            chatHistoryService.saveSession(user.id, updatedSession);
            setCurrentSession(updatedSession);
        }
    });

    useEffect(() => {
        if (!user) {
            setMessages([]);
            setCurrentSession(null);
            return;
        }

        setError(null);

        const loadLastSession = async () => {
            try {
                const sessions = await chatHistoryService.getSessions(user.id);
                if (sessions.length > 0) {
                    const last = sessions[0];
                    setCurrentSession(last);
                    setMessages(last.messages);
                } else {
                    const newSession = chatHistoryService.createNewSession(user.id);
                    setCurrentSession(newSession);
                    setMessages([]);
                }
            } catch (err) {
                console.error('Error loading chat session:', err);
                setError('No se pudo cargar el historial de chat.');
            }
        };

        loadLastSession();
    }, [user]);

    const pingSession = useCallback(async () => {
        if (!user) return;
        try {
            await checkAuth();
        } catch (err) {
            console.warn('[AI Heartbeat] Error al refrescar sesión:', err);
        }
    }, [user, checkAuth]);

    useEffect(() => {
        if (!user) return;
        const interval = setInterval(pingSession, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [user, pingSession]);

    const sendMessage = useCallback(async (content: string) => {
        const trimmedContent = content.trim();
        if (!trimmedContent || isLoading || isStreaming) return;

        if (!user) {
            setError('Debes iniciar sesión para usar el chat.');
            return;
        }

        if (!currentSession) {
            setError('No hay una sesión de chat activa.');
            return;
        }

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: trimmedContent,
            timestamp: new Date(),
        };

        const updatedMessages = [...messages, userMessage];
        setMessages(updatedMessages);
        
        pingSession();
        
        const currentTitle = currentSession.title;
        const needsTitleUpdate = !currentTitle || currentTitle === "Nueva conversación" || currentSession.messages.length === 0;
        const newTitle = needsTitleUpdate ? trimmedContent.substring(0, 40) : currentTitle;

        const updatedSession: ChatSession = {
            ...currentSession,
            messages: updatedMessages,
            title: newTitle,
            updatedAt: new Date()
        };
        
        chatHistoryService.saveSession(user.id, updatedSession);
        setCurrentSession(updatedSession);

        setIsLoading(true);
        setError(null);

        try {
            startStreaming();
            await streamChatFromBackend(
                updatedMessages,
                (chunk: string) => handleChunk(chunk)
            );
            endStreaming();
        } catch (err: any) {
            console.error('Error sending message:', err);
            setError(err.message || 'Error al comunicarse con la IA');
            endStreaming();
        } finally {
            setIsLoading(false);
        }
    }, [messages, startStreaming, handleChunk, endStreaming, user, currentSession, isLoading, isStreaming, pingSession]);

    const clearHistory = useCallback(() => {
        if (user) {
            const newSession = chatHistoryService.createNewSession(user.id);
            setCurrentSession(newSession);
            setMessages([]);
            chatHistoryService.saveSession(user.id, newSession);
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
        '¿Cómo va el progreso de inscripciones?',
        '¿Cuántos estudiantes activos hay?',
        '¿Resumen de periodos académicos?',
        '¿Qué procesos están activos hoy?'
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
