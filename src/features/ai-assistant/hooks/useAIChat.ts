/**
 * useAIChat - Hook para el Chat de IA con historial de sesiones
 *
 * Funcionalidades:
 * - Chat con IA
 * - Historial de sesiones guardado en DB
 * - Sugerencias contextuales
 */

import { useState, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';
import { TOAST_SUCCESS, TOAST_ERROR } from '@/components/ui/dialog/DialogConfig';
import { streamChatFromBackend } from '../services/BackendChatService';
import * as chatSessionsService from '../services/chatSessionsService';
import { notifyNewMessage, requestNotificationPermission } from '../services/notificationService';
import { Message, ChatSession, UseAIChatReturn } from '../types';
import { detectIntent } from '../utils/intentDetector';
import { useChatConfig } from './useChatConfig';

// ============================================
// Sugerencias predefinidas por defecto
// ============================================

const DEFAULT_SUGGESTIONS = [
  '¿Cuántos estudiantes hay activos?',
  'Muéstrame las carreras disponibles',
  '¿Cuáles son las estadísticas del sistema?',
  'Dame un resumen de las pasantías',
];

// ============================================
// Hook Principal
// ============================================

export const useAIChat = (): UseAIChatReturn => {
  // ============================================
  // States
  // ============================================

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>(DEFAULT_SUGGESTIONS);
  const [currentSession, setCurrentSession] = useState<any | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);

  // ============================================
  // Effects - Cargar sesiones al inicio
  // ============================================

  useEffect(() => {
    loadSessions();
  }, []);

  // ============================================
  // Functions - Sesiones
  // ============================================

  /**
   * Carga todas las sesiones del usuario
   */
  const loadSessions = useCallback(async () => {
    try {
      const loadedSessions = await chatSessionsService.getSessions();
      setSessions(loadedSessions);
    } catch (error) {
      console.error('[useAIChat] Error loading sessions:', error);
    }
  }, []);

  /**
   * Carga una sesión específica
   */
  const loadSession = useCallback(async (sessionId: string) => {
    try {
      const session = await chatSessionsService.getSession(sessionId);
      if (session) {
        setCurrentSession(session);
        // Convertir mensajes del formato de BD al formato de la app
        const convertedMessages: Message[] = session.messages.map((m, idx) => ({
          id: m.id || `msg-${idx}`,
          role: m.role,
          content: m.content,
          timestamp: new Date(m.timestamp),
          status: 'sent' as const,
        }));
        setMessages(convertedMessages);
        console.log('[useAIChat] Session loaded:', session.title);
      }
    } catch (error) {
      console.error('[useAIChat] Error loading session:', error);
      toast.error(TOAST_ERROR.load('Sesión'));
    }
  }, []);

  /**
   * Crea una nueva sesión
   */
  const createNewSession = useCallback(async () => {
    try {
      const newSession = await chatSessionsService.createSession();
      if (newSession) {
        setCurrentSession(newSession);
        setMessages([]);
        setSessions(prev => [newSession, ...prev]);
        toast.success(TOAST_SUCCESS.created('Conversación'));
        return newSession;
      }
    } catch (error) {
      console.error('[useAIChat] Error creating session:', error);
      toast.error(TOAST_ERROR.create('Sesión'));
    }
    return null;
  }, []);

  /**
   * Guarda la sesión actual
   */
  const saveCurrentSession = useCallback(async () => {
    if (!currentSession) {
      // Crear nueva sesión SIN limpiar mensajes (no usar createNewSession)
      try {
        const firstUserMessage = messages.find(m => m.role === 'user');
        const title = firstUserMessage
          ? firstUserMessage.content.substring(0, 50) + (firstUserMessage.content.length > 50 ? '...' : '')
          : 'Conversación';

        const messagesToSave = messages
          .filter(m => m.role === 'user' || m.role === 'assistant')
          .map(m => ({
            id: m.id,
            role: m.role as 'user' | 'assistant',
            content: m.content,
            timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : new Date().toISOString(),
          }));

        const newSession = await chatSessionsService.createSession();
        if (newSession) {
          await chatSessionsService.updateSession(newSession.id, { title, messages: messagesToSave });
          setCurrentSession(newSession);
          setSessions(prev => [newSession, ...prev]);
          window.dispatchEvent(new CustomEvent('unefa:ai-chat:sessions-updated'));
          console.log('[useAIChat] Session created and saved:', title);
        }
      } catch (error) {
        console.error('[useAIChat] Error creating session:', error);
        toast.error(TOAST_ERROR.create('Sesión'));
      }
      return;
    }

    try {
      // Generar título desde el primer mensaje del usuario
      const firstUserMessage = messages.find(m => m.role === 'user');
      const title = firstUserMessage
        ? firstUserMessage.content.substring(0, 50) + (firstUserMessage.content.length > 50 ? '...' : '')
        : 'Conversación';

      // Convertir mensajes al formato de la BD
      const messagesToSave = messages
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .map(m => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        content: m.content,
        timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : new Date().toISOString(),
      }));

      await chatSessionsService.updateSession(currentSession.id, {
        title,
        messages: messagesToSave,
      });

      console.log('[useAIChat] Session saved');
    } catch (error) {
      console.error('[useAIChat] Error saving session:', error);
    }
  }, [currentSession, messages]);

  /**
   * Elimina una sesión
   */
  const deleteSession = useCallback(async (sessionId: string) => {
    try {
      const success = await chatSessionsService.deleteSession(sessionId);
      if (success) {
        setSessions(prev => prev.filter(s => s.id !== sessionId));
        if (currentSession?.id === sessionId) {
          setCurrentSession(null);
          setMessages([]);
        }
        toast.success(TOAST_SUCCESS.deleted('Sesión'));
      }
    } catch (error) {
      console.error('[useAIChat] Error deleting session:', error);
      toast.error(TOAST_ERROR.delete('Sesión'));
    }
  }, [currentSession]);

  // ============================================
  // Functions - Mensajes y Sugerencias
  // ============================================

  /**
   * Actualiza las sugerencias basadas en el intent
   */
  const updateSuggestionsBasedOnIntent = useCallback((message: string) => {
    const intent = detectIntent(message);

    // Sugerencias específicas por tipo de intent
    const intentSuggestions: Record<string, string[]> = {
      students: [
        '¿Cuántos estudiantes hay activos?',
        'Ver lista de estudiantes',
        'Estudiantes por carrera',
      ],
      careers: [
        '¿Cuántas carreras hay?',
        'Ver carreras activas',
        'Carreras con más estudiantes',
      ],
      periods: [
        '¿Qué período está activo?',
        'Ver todos los períodos',
        'Período actual',
      ],
      internships: [
        '¿Cuántas pasantías hay activas?',
        'Ver listado de pasantías',
        'Resumen de prácticas',
      ],
      tutors: [
        '¿Cuántos tutores hay?',
        'Ver lista de tutores',
        'Tutores por carrera',
      ],
      institutions: [
        '¿Cuántas empresas colaboradoras?',
        'Ver instituciones',
        'Empresas con más prácticas',
      ],
      statistics: [
        'Estadísticas del sistema',
        'Resumen general',
        'Diagnóstico completo',
      ],
    };

    if (intent.entity && intentSuggestions[intent.entity]) {
      setSuggestions(intentSuggestions[intent.entity]);
    } else {
      setSuggestions(DEFAULT_SUGGESTIONS);
    }
  }, []);

  /**
   * Envía un mensaje al chat de IA
   */
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    // Crear mensaje del usuario
    const userMessage: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date(),
      status: 'sent',
    };

    // Agregar mensaje del usuario
    setMessages(prev => [...prev, userMessage]);
    setError(null);
    setIsLoading(true);
    setIsStreaming(true);

    // Actualizar sugerencias basadas en el intent
    updateSuggestionsBasedOnIntent(content);

    // Crear placeholder para respuesta del asistente
    const assistantMessageId = `msg-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      status: 'streaming',
    };

    setMessages(prev => [...prev, assistantMessage]);

    try {
      console.log('[useAIChat] Sending message:', content.substring(0, 50));

      // Llamar al backend
      await streamChatFromBackend(
        [...messages, userMessage],
        (chunk: string) => {
          setMessages(prev =>
            prev.map(msg =>
              msg.id === assistantMessageId
                ? { ...msg, content: msg.content + chunk }
                : msg
            )
          );
        }
      );

      // Marcar streaming como completo
      setMessages(prev =>
        prev.map(msg =>
          msg.id === assistantMessageId
            ? { ...msg, status: 'sent' }
            : msg
        )
      );

      // Guardar sesión después de recibir respuesta
      setTimeout(() => saveCurrentSession(), 1000);

      console.log('[useAIChat] Message completed successfully');

    } catch (err: any) {
      console.error('[useAIChat] Error:', err.message);

      const errorMessage = err.message || 'Error al comunicarse con la IA';
      setError(errorMessage);

      setMessages(prev =>
        prev.map(msg =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content: 'Lo siento, hubo un error al procesar tu mensaje. Por favor, intenta de nuevo.',
                status: 'error',
              }
            : msg
        )
      );

      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  }, [messages, updateSuggestionsBasedOnIntent, saveCurrentSession]);

  /**
   * Limpia el historial de mensajes
   */
  const clearHistory = useCallback(() => {
    setMessages([]);
    setCurrentSession(null);
    setSuggestions(DEFAULT_SUGGESTIONS);
  }, []);

  /**
   * Reintenta el último mensaje
   */
  const retryLastMessage = useCallback(async () => {
    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
    if (lastUserMessage) {
      await sendMessage(lastUserMessage.content);
    }
  }, [messages, sendMessage]);

  // ============================================
  // Return
  // ============================================

  return {
    messages,
    isLoading,
    isStreaming,
    error,
    sendMessage,
    clearHistory,
    retryLastMessage,
    currentSession,
    loadSession,
    deleteSession,
    suggestions,
    sessions,
    createNewSession,
  };
};

// ============================================
// Export default
// ============================================

export default useAIChat;