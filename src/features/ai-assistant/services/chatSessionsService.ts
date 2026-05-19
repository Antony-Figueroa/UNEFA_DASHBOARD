/**
 * Chat Sessions Service - Gestión de sesiones de chat en el frontend
 *
 * Conecta con los endpoints del backend:
 * - GET /api/ai/sessions - Obtener todas las sesiones
 * - POST /api/ai/sessions - Crear nueva sesión
 * - PUT /api/ai/sessions/:id - Actualizar sesión
 * - DELETE /api/ai/sessions/:id - Eliminar sesión
 */

import apiClient from '../../../api/apiClient';

// ============================================
// Types
// ============================================

export interface ChatSessionMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  messages: ChatSessionMessage[];
  createdAt: string;
  updatedAt: string;
}

// ============================================
// API Functions
// ============================================

/**
 * Obtiene todas las sesiones del usuario
 */
export const getSessions = async (): Promise<ChatSession[]> => {
  try {
    const response = await apiClient.get<{ success: boolean; data: ChatSession[] }>(
      '/ai/sessions'
    );
    return response.data.data || [];
  } catch (error) {
    console.error('[ChatSessions] Error fetching sessions:', error);
    return [];
  }
};

/**
 * Obtiene una sesión específica
 */
export const getSession = async (sessionId: string): Promise<ChatSession | null> => {
  try {
    const response = await apiClient.get<{ success: boolean; data: ChatSession }>(
      `/ai/sessions/${sessionId}`
    );
    return response.data.data || null;
  } catch (error) {
    console.error('[ChatSessions] Error fetching session:', error);
    return null;
  }
};

/**
 * Crea una nueva sesión
 */
export const createSession = async (title?: string): Promise<ChatSession | null> => {
  try {
    const response = await apiClient.post<{ success: boolean; data: ChatSession }>(
      '/ai/sessions',
      { title: title || 'Nueva conversación' }
    );
    return response.data.data || null;
  } catch (error) {
    console.error('[ChatSessions] Error creating session:', error);
    return null;
  }
};

/**
 * Actualiza una sesión (guarda mensajes, título, etc.)
 */
export const updateSession = async (
  sessionId: string,
  data: { title?: string; messages?: ChatSessionMessage[] }
): Promise<ChatSession | null> => {
  try {
    const response = await apiClient.put<{ success: boolean; data: ChatSession }>(
      `/ai/sessions/${sessionId}`,
      data
    );
    return response.data.data || null;
  } catch (error) {
    console.error('[ChatSessions] Error updating session:', error);
    return null;
  }
};

/**
 * Elimina una sesión
 */
export const deleteSession = async (sessionId: string): Promise<boolean> => {
  try {
    await apiClient.delete(`/ai/sessions/${sessionId}`);
    return true;
  } catch (error) {
    console.error('[ChatSessions] Error deleting session:', error);
    return false;
  }
};

export default {
  getSessions,
  getSession,
  createSession,
  updateSession,
  deleteSession,
};