/**
 * useChatConfig - Configuración del chat IA
 *
 * Opciones:
 * - Persona: formal, casual, técnico
 * - Acciones rápidas
 * - Preferencias de UI
 *
 * Persistencia: Backend (DB) en lugar de localStorage
 */

import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/context/toast';
import { TOAST } from '@/components/ui/dialog/DialogConfig';
import chatConfigService from '../services/chatConfigService';

// ============================================
// Types
// ============================================

export type ChatPersona = 'formal' | 'casual' | 'tecnico';

export interface ChatConfig {
  persona: ChatPersona;
  quickActions: QuickAction[];
  showSuggestions: boolean;
  enableNotifications: boolean;
  darkMode: boolean;
}

export interface QuickAction {
  id: string;
  label: string;
  icon?: string;
  action: string;
  color?: string;
}

// ============================================
// Configuraciones predefinidas
// ============================================

const PERSONA_PROMPTS: Record<ChatPersona, string> = {
  formal: 'Responde de manera profesional y respetuosa. Usa lenguaje formal y estructuras claras.',
  casual: 'Responde de manera amigable y cercana. Usa un tono conversacional pero tetaprofesional.',
  tecnico: 'Responde de manera técnica y precisa. Incluye detalles técnicos cuando sea relevante.',
};

const DEFAULT_QUICK_ACTIONS: QuickAction[] = [
  { id: 'periods', label: 'Periodo académico', icon: '📅', action: '¿Qué período académico está activo?' },
  { id: 'stats', label: 'Estadísticas', icon: '📊', action: '-Dame las estadísticas completas del sistema' },
  { id: 'students', label: 'Estudiantes', icon: '👥', action: '¿Cuántos estudiantes hay activos?' },
  { id: 'internships', label: 'Pasantías', icon: '💼', action: 'Resumen de pasantías activas' },
  { id: 'help', label: 'Ayuda', icon: '❓', action: '¿Qué puedes hacer? ¿Cuáles son tus funciones?' },
];

const DEFAULT_CONFIG: ChatConfig = {
  persona: 'formal',
  quickActions: DEFAULT_QUICK_ACTIONS,
  showSuggestions: true,
  enableNotifications: true,
  darkMode: false,
};

// ============================================
// Hook
// ============================================

export const useChatConfig = () => {
  const [config, setConfig] = useState<ChatConfig>(DEFAULT_CONFIG);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { addToast } = useToast();

  // Cargar configuración desde el backend al iniciar
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const backendConfig = await chatConfigService.getConfig();
        setConfig(prev => ({
          ...prev,
          persona: backendConfig.persona,
          quickActions: backendConfig.quickActions,
          enableNotifications: backendConfig.enableNotifications,
          showSuggestions: backendConfig.showSuggestions,
          darkMode: backendConfig.darkMode,
        }));
      } catch (error) {
        console.warn('[useChatConfig] Error loading from DB, using defaults:', error);
        // Usar valores por defecto si falla
      } finally {
        setIsLoading(false);
      }
    };

    loadConfig();
  }, []);

  // Guardar configuración en el backend cuando cambie (debounced)
  const saveToBackend = useCallback(async (newConfig: ChatConfig) => {
    if (isLoading) return; // No guardar hasta que cargue
    
    setIsSaving(true);
    try {
      await chatConfigService.saveConfig(newConfig);
    } catch (error) {
      console.error('[useChatConfig] Error saving to DB:', error);
      addToast(TOAST.updateError('Configuración'));
    } finally {
      setIsSaving(false);
    }
  }, [isLoading]);

  // Actualizar persona
  const setPersona = useCallback((persona: ChatPersona) => {
    setConfig(prev => {
      const newConfig = { ...prev, persona };
      saveToBackend(newConfig);
      return newConfig;
    });
  }, [saveToBackend]);

  // Actualizar acciones rápidas
  const setQuickActions = useCallback((quickActions: QuickAction[]) => {
    setConfig(prev => {
      const newConfig = { ...prev, quickActions };
      saveToBackend(newConfig);
      return newConfig;
    });
  }, [saveToBackend]);

  // Toggle de sugerencias
  const toggleSuggestions = useCallback(() => {
    setConfig(prev => {
      const newConfig = { ...prev, showSuggestions: !prev.showSuggestions };
      saveToBackend(newConfig);
      return newConfig;
    });
  }, [saveToBackend]);

  // Toggle de notificaciones
  const toggleNotifications = useCallback(() => {
    setConfig(prev => {
      const newConfig = { ...prev, enableNotifications: !prev.enableNotifications };
      saveToBackend(newConfig);
      return newConfig;
    });
  }, [saveToBackend]);

  // Toggle dark mode (no se persiste en DB, se maneja con theme global)
  const toggleDarkMode = useCallback(() => {
    setConfig(prev => ({ ...prev, darkMode: !prev.darkMode }));
  }, []);

  // Reset a valores por defecto
  const resetConfig = useCallback(() => {
    setConfig(DEFAULT_CONFIG);
    saveToBackend(DEFAULT_CONFIG);
  }, [saveToBackend]);

  // Obtener el prompt del sistema según la persona
  const getPersonaPrompt = useCallback((): string => {
    return PERSONA_PROMPTS[config.persona];
  }, [config.persona]);

  return {
    config,
    isLoading,
    isSaving,
    setPersona,
    setQuickActions,
    toggleSuggestions,
    toggleNotifications,
    toggleDarkMode,
    resetConfig,
    getPersonaPrompt,
  };
};

// ============================================
// Export
// ============================================

export default useChatConfig;