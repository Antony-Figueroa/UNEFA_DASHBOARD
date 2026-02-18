import { Message } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const streamChatFromBackend = async (
  messages: Message[],
  onChunk: (text: string) => void
): Promise<void> => {
  console.log('[Frontend] Sending request to:', `${API_BASE}/ai/chat`);
  console.log('[Frontend] Messages:', messages.map(m => ({ role: m.role, content: m.content.substring(0, 50) })));
  
  const response = await fetch(`${API_BASE}/ai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
      })),
    }),
  });

  console.log('[Frontend] Response status:', response.status);
  console.log('[Frontend] Response ok:', response.ok);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('[Frontend] Error response:', errorData);
    throw new Error(errorData.message || `Error del servidor: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error('Respuesta sin cuerpo');

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data: ')) continue;

      const payload = trimmed.substring(6);
      if (payload === '[DONE]') return;

      try {
        const data = JSON.parse(payload);
        if (data.error) throw new Error(data.error);
        if (data.text) onChunk(data.text);
      } catch (e: any) {
        if (e.message && !e.message.includes('JSON')) throw e;
      }
    }
  }
};
