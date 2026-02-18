import { ChatSession, Message } from "../types";

export type { Message };

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const UPDATE_EVENT = "unefa:ai-chat:sessions-updated";

const apiFetch = async (path: string, options?: RequestInit) => {
  const res = await fetch(`${API_BASE}/ai${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Error ${res.status}`);
  }
  return res.json();
};

class ChatHistoryService {
  private notifyUpdate() {
    window.dispatchEvent(new CustomEvent(UPDATE_EVENT));
  }

  async getSessions(_userId: number): Promise<ChatSession[]> {
    try {
      const result = await apiFetch('/sessions');
      return (result.data || []).map((s: any) => ({
        ...s,
        createdAt: new Date(s.createdAt),
        updatedAt: new Date(s.updatedAt),
        messages: (s.messages || []).map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }))
      }));
    } catch (error) {
      console.error("[ChatHistoryService] Error loading sessions:", error);
      return [];
    }
  }

  async saveSession(_userId: number, session: ChatSession): Promise<void> {
    try {
      const isNew = !session.id || session.id.startsWith('session_') || session.messages.length <= 1;
      
      if (isNew && !session.id.includes('-')) {
        const result = await apiFetch('/sessions', {
          method: 'POST',
          body: JSON.stringify({ title: session.title }),
        });
        session.id = result.data.id;
      }

      await apiFetch(`/sessions/${session.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: session.title,
          messages: session.messages,
        }),
      });
      this.notifyUpdate();
    } catch (error) {
      console.error("[ChatHistoryService] Error saving session:", error);
    }
  }

  async deleteSession(_userId: number, sessionId: string): Promise<void> {
    try {
      await apiFetch(`/sessions/${sessionId}`, { method: 'DELETE' });
      this.notifyUpdate();
    } catch (error) {
      console.error("[ChatHistoryService] Error deleting session:", error);
    }
  }

  createNewSession(userId: number, title?: string): ChatSession {
    const uuid = typeof crypto !== 'undefined' && crypto.randomUUID 
      ? crypto.randomUUID() 
      : `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    return {
      id: uuid,
      userId: userId.toString(),
      title: title || "Nueva conversación",
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
}

export const chatHistoryService = new ChatHistoryService();
