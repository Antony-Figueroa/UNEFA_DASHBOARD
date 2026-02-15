import { useState, useCallback, useEffect, useRef } from 'react';
import { Message, UseAIChatReturn, ChatSession } from '../types';
import { GoogleAIService } from '../services/GoogleAIService';
import { OpenRouterService } from '../services/OpenRouterService';
import { useStreamResponse } from './useStreamResponse';
import { useAIContext } from './useAIContext';
import { useAuth } from '../../../context/auth';
import { chatHistoryService } from '../services/ChatHistoryService';

/**
 * Hook principal para manejar la lógica del chat de IA
 */
export const useAIChat = (): UseAIChatReturn => {
    const { user, checkAuth } = useAuth();
    const [messages, setMessages] = useState<Message[]>([]);
    const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { systemContext } = useAIContext();
    
    // Referencias para evitar problemas de clausura en los callbacks de streaming
    const currentSessionRef = useRef<ChatSession | null>(null);
    const messagesRef = useRef<Message[]>([]);

    // Sincronizar refs con el estado
    useEffect(() => {
        currentSessionRef.current = currentSession;
    }, [currentSession]);

    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

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
        
        const newMessages = [...messagesRef.current, assistantMessage];
        setMessages(newMessages);

        // Guardar en persistencia con los datos más recientes
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

    // Referencia al servicio 
    const aiService = useRef<any>(null);

    // 1. Inicializar servicios de IA
    useEffect(() => {
        try {
            const apiKey = import.meta.env.VITE_GOOGLE_AI_KEY;
            const model = 'gemma-3-1b-it'; 
            
            if (apiKey) {
                aiService.current = new GoogleAIService(model, apiKey);
            } else {
                const orKey = import.meta.env.VITE_OPENROUTER_KEY;
                if (orKey) {
                    aiService.current = new OpenRouterService('google/gemma-2-9b-it:free', orKey);
                } else {
                    setError('No se encontró una clave de API configurada para la IA.');
                }
            }
        } catch (err) {
            console.error('Error initializing AI services:', err);
            setError('Error al inicializar los servicios de IA.');
        }
    }, []);

    // 2. Cargar historial cuando el usuario está disponible
    useEffect(() => {
        if (!user) {
            setMessages([]);
            setCurrentSession(null);
            return;
        }

        // Si el usuario vuelve (login exitoso), limpiamos cualquier error de "debes iniciar sesión"
        setError(null);

        const loadLastSession = async () => {
            try {
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
            } catch (err) {
                console.error('Error loading chat session:', err);
                setError('No se pudo cargar el historial de chat.');
            }
        };

        loadLastSession();
    }, [user]);

    // 3. Heartbeat: Mantener la sesión viva mientras el usuario usa el chat
    // Como el chat habla con Google/OpenRouter, el servidor local cree que hay inactividad.
    const pingSession = useCallback(async () => {
        if (!user) return;
        try {
            // Un simple checkAuth refresca la cookie/token en el backend
            await checkAuth();
        } catch (err) {
            console.warn('[AI Heartbeat] Error al refrescar sesión:', err);
        }
    }, [user, checkAuth]);

    useEffect(() => {
        if (!user) return;

        // Ping cada 5 minutos
        const interval = setInterval(pingSession, 5 * 60 * 1000);
        
        return () => clearInterval(interval);
    }, [user, pingSession]);

    const sendMessage = useCallback(async (content: string) => {
        const trimmedContent = content.trim();
        if (!trimmedContent || isLoading || isStreaming) return;

        // Validaciones de estado del servicio
        if (!user) {
            setError('Debes iniciar sesión para usar el chat.');
            return;
        }

        if (!aiService.current) {
            setError('El servicio de IA no está disponible.');
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
        
        // Notificar al servidor que seguimos activos (Heartbeat proactivo)
        pingSession();
        
        // Determinar si debemos actualizar el título (solo en el primer mensaje)
        const currentTitle = currentSession.title;
        const needsTitleUpdate = !currentTitle || currentTitle === "Nueva conversación" || currentSession.messages.length === 0;
        const newTitle = needsTitleUpdate ? trimmedContent.substring(0, 40) : currentTitle;

        // Guardar mensaje del usuario inmediatamente
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
            // Guardar inmediatamente para que aparezca en el historial
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
