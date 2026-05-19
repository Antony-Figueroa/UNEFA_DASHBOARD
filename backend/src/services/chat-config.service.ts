/**
 * Chat Config Service - Configuración del chat IA por usuario
 *
 * Maneja la persistencia de configuración en la base de datos
 */

import { dbManager } from '../lib/db-manager.js';

const TABLE = 't_chat_config';

// ============================================
// Types
// ============================================

export interface ChatConfigDB {
  config_id: string;
  user_id: number;
  persona: 'formal' | 'casual' | 'tecnico';
  quick_actions: Array<{
    id: string;
    label: string;
    icon?: string;
    action: string;
    color?: string;
  }>;
  show_notifications: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChatConfigInput {
  persona?: 'formal' | 'casual' | 'tecnico';
  quickActions?: Array<{
    id: string;
    label: string;
    icon?: string;
    action: string;
    color?: string;
  }>;
  showNotifications?: boolean;
}

// ============================================
// Functions
// ============================================

/**
 * Obtiene la configuración del chat para un usuario
 */
export const getChatConfig = async (userId: number): Promise<ChatConfigDB | null> => {
  const data = await dbManager.withRetry(async (supabase) => {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows found
      throw error;
    }
    return data;
  }, 'getChatConfig');

  return data as ChatConfigDB | null;
};

/**
 * Crea o actualiza la configuración del chat para un usuario
 */
export const saveChatConfig = async (userId: number, config: ChatConfigInput): Promise<ChatConfigDB> => {
  const data = await dbManager.withRetry(async (supabase) => {
    // Intentar actualizar primero
    const { data: existing } = await supabase
      .from(TABLE)
      .select('config_id')
      .eq('user_id', userId)
      .single();

    if (existing) {
      // Actualizar registro existente
      const { data: updated, error } = await supabase
        .from(TABLE)
        .update({
          persona: config.persona,
          quick_actions: config.quickActions ? JSON.stringify(config.quickActions) : undefined,
          show_notifications: config.showNotifications,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return updated;
    } else {
      // Crear nuevo registro
      const { data: created, error } = await supabase
        .from(TABLE)
        .insert({
          user_id: userId,
          persona: config.persona || 'formal',
          quick_actions: config.quickActions ? JSON.stringify(config.quickActions) : '[]',
          show_notifications: config.showNotifications ?? true,
        })
        .select()
        .single();

      if (error) throw error;
      return created;
    }
  }, 'saveChatConfig');

  return data as ChatConfigDB;
};

/**
 * Obtiene la configuración con valores por defecto si no existe
 */
export const getChatConfigWithDefaults = async (userId: number): Promise<{
  persona: 'formal' | 'casual' | 'tecnico';
  quickActions: Array<{ id: string; label: string; icon?: string; action: string; color?: string }>;
  showNotifications: boolean;
}> => {
  const dbConfig = await getChatConfig(userId);

  if (!dbConfig) {
    // Valores por defecto
    return {
      persona: 'formal',
      quickActions: [
        { id: 'periods', label: 'Periodo académico', icon: '📅', action: '¿Qué período académico está activo?' },
        { id: 'stats', label: 'Estadísticas', icon: '📊', action: 'Dame las estadísticas completas del sistema' },
        { id: 'students', label: 'Estudiantes', icon: '👥', action: '¿Cuántos estudiantes hay activos?' },
        { id: 'internships', label: 'Pasantías', icon: '💼', action: 'Resumen de pasantías activas' },
        { id: 'help', label: 'Ayuda', icon: '❓', action: '¿Qué puedes hacer?' },
      ],
      showNotifications: true,
    };
  }

  // Parsear quick_actions del JSON
  let quickActions = [];
  try {
    quickActions = typeof dbConfig.quick_actions === 'string' 
      ? JSON.parse(dbConfig.quick_actions) 
      : dbConfig.quick_actions;
  } catch {
    quickActions = [];
  }

  return {
    persona: dbConfig.persona as 'formal' | 'casual' | 'tecnico',
    quickActions,
    showNotifications: dbConfig.show_notifications,
  };
};

export default {
  getChatConfig,
  saveChatConfig,
  getChatConfigWithDefaults,
};