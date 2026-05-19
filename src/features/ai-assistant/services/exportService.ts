/**
 * Export Service - Exportar conversaciones del chat
 *
 * Formatos soportados:
 * - JSON: Export completo con metadata
 * - PDF: Export formateado para impresión
 */

import { Message } from '../types';
import { ChatSession } from './chatSessionsService';

// ============================================
// Types
// ============================================

export interface ExportOptions {
  format: 'json' | 'pdf';
  includeMetadata?: boolean;
  includeTimestamp?: boolean;
}

export interface ExportedConversation {
  title: string;
  exportedAt: string;
  messages: ExportedMessage[];
  metadata?: ConversationMetadata;
}

export interface ExportedMessage {
  role: string;
  content: string;
  timestamp: string;
}

export interface ConversationMetadata {
  totalMessages: number;
  userMessages: number;
  aiMessages: number;
  duration?: string;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Formatea una fecha para el export
 */
const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('es-VE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Calcula la duración de la conversación
 */
const calculateDuration = (messages: Message[]): string | undefined => {
  if (messages.length < 2) return undefined;

  const firstMsg = messages.find(m => m.role === 'user');
  const lastMsg = messages[messages.length - 1];

  if (!firstMsg?.timestamp || !lastMsg?.timestamp) return undefined;

  const start = new Date(firstMsg.timestamp).getTime();
  const end = new Date(lastMsg.timestamp).getTime();
  const diffMs = end - start;

  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'menos de 1 minuto';
  if (minutes === 1) return '1 minuto';
  if (minutes < 60) return `${minutes} minutos`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
};

/**
 * Genera metadata de la conversación
 */
const generateMetadata = (messages: Message[]): ConversationMetadata => {
  const userMessages = messages.filter(m => m.role === 'user').length;
  const aiMessages = messages.filter(m => m.role === 'assistant').length;

  return {
    totalMessages: messages.length,
    userMessages,
    aiMessages,
    duration: calculateDuration(messages),
  };
};

// ============================================
// Export Functions
// ============================================

/**
 * Exporta una conversación a formato JSON
 */
export const exportToJSON = (
  messages: Message[],
  title: string = 'Conversación'
): string => {
  const exported: ExportedConversation = {
    title,
    exportedAt: new Date().toISOString(),
    messages: messages.map(m => ({
      role: m.role,
      content: m.content,
      timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : String(m.timestamp),
    })),
    metadata: generateMetadata(messages),
  };

  return JSON.stringify(exported, null, 2);
};

/**
 * Exporta una conversación a formato texto plano
 */
export const exportToText = (
  messages: Message[],
  title: string = 'Conversación'
): string => {
  const lines: string[] = [
    '=' .repeat(50),
    title.toUpperCase(),
    `Exportado: ${formatDate(new Date())}`,
    '=' .repeat(50),
    '',
  ];

  messages.forEach((msg, idx) => {
    const role = msg.role === 'user' ? '👤 USUARIO' : '🤖 ASISTENTE';
    const time = formatDate(msg.timestamp);
    lines.push(`[${time}] ${role}`);
    lines.push('-'.repeat(40));
    lines.push(msg.content);
    lines.push('');
    lines.push('');
  });

  const metadata = generateMetadata(messages);
  lines.push('=' .repeat(50));
  lines.push('ESTADÍSTICAS');
  lines.push('-'.repeat(40));
  lines.push(`Total de mensajes: ${metadata.totalMessages}`);
  lines.push(`Mensajes del usuario: ${metadata.userMessages}`);
  lines.push(`Mensajes del AI: ${metadata.aiMessages}`);
  if (metadata.duration) {
    lines.push(`Duración: ${metadata.duration}`);
  }

  return lines.join('\n');
};

/**
 * Descarga un archivo en el navegador
 */
export const downloadFile = (content: string, filename: string, mimeType: string): void => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};

/**
 * Wrapper para exportar conversación completa
 */
export const exportConversation = (
  messages: Message[],
  title: string = 'Conversación',
  format: 'json' | 'text' = 'text'
): void => {
  const timestamp = new Date().toISOString().split('T')[0];
  const safeTitle = title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);

  if (format === 'json') {
    const content = exportToJSON(messages, title);
    downloadFile(content, `${safeTitle}_${timestamp}.json`, 'application/json');
  } else {
    const content = exportToText(messages, title);
    downloadFile(content, `${safeTitle}_${timestamp}.txt`, 'text/plain;charset=utf-8');
  }
};

/**
 * Copia el contenido al portapapeles
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};

export default {
  exportToJSON,
  exportToText,
  exportConversation,
  copyToClipboard,
  downloadFile,
};