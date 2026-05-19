/**
 * Chat Config Service - Persistencia de configuración del chat
 * 
 * Comunica con el backend para guardar/cargar configuración de la DB
 */

import apiClient from '@/api/apiClient';
import type { ChatConfig, QuickAction } from '../hooks/useChatConfig';

interface ChatConfigResponse {
  success: boolean;
  data: {
    persona: 'formal' | 'casual' | 'tecnico';
    quickActions: QuickAction[];
    showNotifications: boolean;
  };
}

interface SaveConfigRequest {
  persona?: 'formal' | 'casual' | 'tecnico';
  quickActions?: QuickAction[];
  showNotifications?: boolean;
}

export const chatConfigService = {
  /**
   * Obtiene la configuración del chat desde la DB
   */
  getConfig: async (): Promise<ChatConfig> => {
    const response = await apiClient.get<ChatConfigResponse>('/ai/chat-config');
    
    if (!response.data.success) {
      throw new Error('Error al obtener configuración');
    }
    
    const { data } = response.data;
    
    // Mapear al formato del hook
    return {
      persona: data.persona,
      quickActions: data.quickActions,
      showSuggestions: true, // Por defecto
      enableNotifications: data.showNotifications,
      darkMode: false, // Por defecto (se maneja con theme global)
    };
  },

  /**
   * Guarda la configuración del chat en la DB
   */
  saveConfig: async (config: Partial<ChatConfig>): Promise<void> => {
    const request: SaveConfigRequest = {
      persona: config.persona,
      quickActions: config.quickActions,
      showNotifications: config.enableNotifications,
    };

    await apiClient.post('/ai/chat-config', request);
  },
};

export default chatConfigService;