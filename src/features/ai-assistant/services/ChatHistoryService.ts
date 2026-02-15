/**
 * @file ChatHistoryService.ts
 * @description Service for managing chat history persistence.
 * Uses localStorage as a temporary persistence layer, keyed by userId.
 */

import { ChatSession, Message } from "../types";

// Just to satisfy linting if Message is only used for type annotations in other files
export type { Message };

const STORAGE_PREFIX = "unefa_ai_chat_";

class ChatHistoryService {
  /**
   * Generates the storage key for a specific user.
   */
  private getStorageKey(userId: number): string {
    return `${STORAGE_PREFIX}${userId}_sessions`;
  }

  /**
   * Retrieves all chat sessions for a specific user.
   */
  async getSessions(userId: number): Promise<ChatSession[]> {
    try {
      const data = localStorage.getItem(this.getStorageKey(userId));
      if (!data) return [];
      
      const sessions = JSON.parse(data) as ChatSession[];
      // Normalize dates
      return sessions.map(s => ({
        ...s,
        createdAt: new Date(s.createdAt),
        updatedAt: new Date(s.updatedAt),
        messages: s.messages.map(m => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }))
      }));
    } catch (error) {
      console.error("[ChatHistoryService] Error loading sessions:", error);
      return [];
    }
  }

  /**
   * Saves or updates a chat session.
   */
  async saveSession(userId: number, session: ChatSession): Promise<void> {
    try {
      const sessions = await this.getSessions(userId);
      const index = sessions.findIndex(s => s.id === session.id);
      
      const updatedSession = {
        ...session,
        updatedAt: new Date()
      };

      if (index >= 0) {
        sessions[index] = updatedSession;
      } else {
        sessions.unshift(updatedSession);
      }

      localStorage.setItem(this.getStorageKey(userId), JSON.stringify(sessions));
    } catch (error) {
      console.error("[ChatHistoryService] Error saving session:", error);
    }
  }

  /**
   * Deletes a specific session.
   */
  async deleteSession(userId: number, sessionId: string): Promise<void> {
    try {
      const sessions = await this.getSessions(userId);
      const filtered = sessions.filter(s => s.id !== sessionId);
      localStorage.setItem(this.getStorageKey(userId), JSON.stringify(filtered));
    } catch (error) {
      console.error("[ChatHistoryService] Error deleting session:", error);
    }
  }

  /**
   * Creates a new empty session object.
   */
  createNewSession(userId: number, title?: string): ChatSession {
    return {
      id: crypto.randomUUID(),
      userId: userId.toString(),
      title: title || "Nueva conversación",
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
}

export const chatHistoryService = new ChatHistoryService();
