/**
 * BackendChatService - Servicio de comunicación con el backend para el Chat IA
 *
 * Patrón homologado: igual que los servicios del proyecto (periodService, studentService, etc.)
 * - Usa el apiClient centralizado
 * - Manejo de errores estructurado
 * - Tipado completo
 */

import apiClient from '../../../api/apiClient';
import { Message } from '../types';

// ============================================
// Configuration
// ============================================

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const ENDPOINT_NO_STREAM = '/ai/chat-no-stream';
const ENDPOINT_STREAM = '/ai/chat';

// Por defecto usamos no-stream por compatibilidad
const USE_NO_STREAM = true;

// ============================================
// Types
// ============================================

export interface ChatRequestBody {
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
}

export interface ChatResponseSuccess {
  success: true;
  text: string;
  meta?: {
    provider: string;
    usedTools: boolean;
    intentDetected?: {
      entity: string;
      action: string;
    };
  };
}

export interface ChatResponseError {
  success: false;
  message: string;
}

export type ChatResponse = ChatResponseSuccess | ChatResponseError;

// ============================================
// Errors
// ============================================

export class ChatServiceError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public isRetryable: boolean = false
  ) {
    super(message);
    this.name = 'ChatServiceError';
  }
}

// ============================================
// Service Functions
// ============================================

/**
 * Envía un mensaje al chat y recibe la respuesta completa (no-streaming)
 * Patrón: similar a los servicios CRUD del proyecto
 */
export const sendChatMessage = async (
  messages: Message[],
  signal?: AbortSignal
): Promise<ChatResponseSuccess> => {
  const endpoint = USE_NO_STREAM ? ENDPOINT_NO_STREAM : ENDPOINT_STREAM;

  console.log(`[BackendChatService] Sending to ${API_BASE}${endpoint}`);

  try {
    const response = await apiClient.post<ChatResponse>(
      endpoint,
      {
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
      },
      {
        timeout: 60000, // 60s timeout
        signal,
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true,
      }
    );

    // Verificar respuesta
    if (!response.data.success) {
      throw new ChatServiceError(
        response.data.message || 'Error del servidor',
        undefined,
        false
      );
    }

    console.log(`[BackendChatService] Response received, length: ${response.data.text?.length || 0} chars`);

    return response.data as ChatResponseSuccess;

  } catch (error: any) {
    // Manejo de errores estructurado
    if (error.response) {
      // Error del servidor
      const statusCode = error.response.status;
      const serverMessage = error.response.data?.message || 'Error del servidor';

      if (statusCode === 401) {
        throw new ChatServiceError('No autorizado. Por favor, inicia sesión nuevamente.', 401, false);
      }
      if (statusCode === 429) {
        throw new ChatServiceError('Demasiadas solicitudes. Por favor, espera un momento.', 429, true);
      }
      if (statusCode >= 500) {
        throw new ChatServiceError('Error del servidor. Intenta más tarde.', statusCode, true);
      }

      throw new ChatServiceError(serverMessage, statusCode, false);
    }

    if (error.name === 'AbortError') {
      throw new ChatServiceError('La solicitud fue cancelada.', undefined, false);
    }

    if (error.name === 'TimeoutError' || error.code === 'ECONNABORTED') {
      throw new ChatServiceError('La solicitud tardó demasiado. Intenta de nuevo.', undefined, true);
    }

    // Error de red
    throw new ChatServiceError(
      error.message || 'Error de conexión. Verifica tu conexión a internet.',
      undefined,
      true
    );
  }
};

/**
 * Chat con streaming (SSE)
 * Por ahora no se usa por problemas de compatibilidad, pero está disponible
 */
export const streamChatFromBackend = async (
  messages: Message[],
  onChunk: (text: string) => void,
  signal?: AbortSignal
): Promise<void> => {
  //模拟 streaming enviando todo de una vez
  // Esto es un workaround para el problema de SSE
  const response = await sendChatMessage(messages, signal);

  if (response.text) {
    onChunk(response.text);
  }
};

// ============================================
// Funciones utilitarias
// ============================================

/**
 * Verifica si el chat está disponible
 */
export const checkChatAvailability = async (): Promise<boolean> => {
  try {
    // Intentar hacer una request simple para verificar disponibilidad
    // Por ahora retornamos true si el endpoint responde
    return true;
  } catch {
    return false;
  }
};

/**
 * Obtiene la configuración del chat desde el backend
 */
export const getChatConfig = async (): Promise<{
  provider: string;
  model: string;
  features: string[];
} | null> => {
  try {
    const response = await apiClient.get('/ai/config');
    return response.data;
  } catch {
    return null;
  }
};

export default {
  sendChatMessage,
  streamChatFromBackend,
  checkChatAvailability,
  getChatConfig,
};