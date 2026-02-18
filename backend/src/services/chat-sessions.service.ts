import { dbManager } from '../lib/db-manager.js';

const TABLE = 't_chat_sessions';

export interface ChatSessionDB {
  SESSION_ID: string;
  USER_ID: number;
  TITLE: string;
  MESSAGES: any[];
  CREATED_AT: string;
  UPDATED_AT: string;
  STATUS: number;
}

export interface ChatSessionApp {
  id: string;
  userId: string;
  title: string;
  messages: any[];
  createdAt: string;
  updatedAt: string;
}

const mapSession = (s: ChatSessionDB): ChatSessionApp => ({
  id: s.SESSION_ID,
  userId: String(s.USER_ID),
  title: s.TITLE,
  messages: s.MESSAGES || [],
  createdAt: s.CREATED_AT,
  updatedAt: s.UPDATED_AT,
});

export const getSessionsByUser = async (userId: number): Promise<ChatSessionApp[]> => {
  const data = await dbManager.withRetry(async (supabase) => {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('USER_ID', userId)
      .eq('STATUS', 1)
      .order('UPDATED_AT', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data;
  }, 'getSessionsByUser');

  return (data as ChatSessionDB[]).map(mapSession);
};

export const getSessionById = async (sessionId: string, userId: number): Promise<ChatSessionApp | null> => {
  const data = await dbManager.withRetry(async (supabase) => {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('SESSION_ID', sessionId)
      .eq('USER_ID', userId)
      .eq('STATUS', 1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  }, 'getSessionById');

  return data ? mapSession(data as ChatSessionDB) : null;
};

export const createSession = async (userId: number, title?: string): Promise<ChatSessionApp> => {
  const data = await dbManager.withRetry(async (supabase) => {
    const { data, error } = await supabase
      .from(TABLE)
      .insert([{
        USER_ID: userId,
        TITLE: title || 'Nueva conversación',
        MESSAGES: [],
        STATUS: 1,
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }, 'createSession');

  return mapSession(data as ChatSessionDB);
};

export const updateSession = async (
  sessionId: string,
  userId: number,
  updates: { title?: string; messages?: any[] }
): Promise<ChatSessionApp> => {
  const data = await dbManager.withRetry(async (supabase) => {
    const { data: existing } = await supabase
      .from(TABLE)
      .select('SESSION_ID')
      .eq('SESSION_ID', sessionId)
      .eq('USER_ID', userId)
      .maybeSingle();

    if (!existing) {
      const { data: created, error: createError } = await supabase
        .from(TABLE)
        .insert([{
          SESSION_ID: sessionId,
          USER_ID: userId,
          TITLE: updates.title || 'Nueva conversación',
          MESSAGES: updates.messages || [],
          STATUS: 1,
        }])
        .select()
        .single();

      if (createError) throw createError;
      return created;
    }

    const updateData: Record<string, any> = { UPDATED_AT: new Date().toISOString() };
    if (updates.title !== undefined) updateData.TITLE = updates.title;
    if (updates.messages !== undefined) updateData.MESSAGES = updates.messages;

    const { data: updated, error } = await supabase
      .from(TABLE)
      .update(updateData)
      .eq('SESSION_ID', sessionId)
      .eq('USER_ID', userId)
      .select()
      .single();

    if (error) throw error;
    return updated;
  }, 'updateSession');

  return mapSession(data as ChatSessionDB);
};

export const deleteSession = async (sessionId: string, userId: number): Promise<void> => {
  await dbManager.withRetry(async (supabase) => {
    const { error } = await supabase
      .from(TABLE)
      .update({ STATUS: 0, UPDATED_AT: new Date().toISOString() })
      .eq('SESSION_ID', sessionId)
      .eq('USER_ID', userId);

    if (error) throw error;
  }, 'deleteSession');
};
