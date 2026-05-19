/**
 * ChatSettings - Panel de configuración del chat IA
 *
 * Opciones:
 * - Persona IA
 * - Acciones rápidas
 * - Preferencias
 */

import React from 'react';
import { useChatConfig, ChatPersona } from '../hooks/useChatConfig';
import { QuickAction } from '../hooks/useChatConfig';

interface ChatSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

const personaOptions: { value: ChatPersona; label: string; description: string }[] = [
  { value: 'formal', label: 'Formal', description: 'Profesional y respetuoso' },
  { value: 'casual', label: 'Casual', description: 'Amigable y cercano' },
  { value: 'tecnico', label: 'Técnico', description: 'Preciso y detallado' },
];

export const ChatSettings: React.FC<ChatSettingsProps> = ({ isOpen, onClose }) => {
  const {
    config,
    setPersona,
    toggleNotifications,
    toggleDarkMode,
    resetConfig,
  } = useChatConfig();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Configuración del Chat
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Persona */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Personalidad del Asistente
            </h3>
            <div className="space-y-2">
              {personaOptions.map(option => (
                <label
                  key={option.value}
                  className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${
                    config.persona === option.value
                      ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="persona"
                    value={option.value}
                    checked={config.persona === option.value}
                    onChange={() => setPersona(option.value)}
                    className="sr-only"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {option.label}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {option.description}
                    </p>
                  </div>
                  {config.persona === option.value && (
                    <span className="text-brand-500">✓</span>
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Preferences */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Preferencias
            </h3>
            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Notificaciones
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Notificar cuando el AI responde
                  </p>
                </div>
                <button
                  onClick={toggleNotifications}
                  className={`w-11 h-6 rounded-full transition-colors ${
                    config.enableNotifications ? 'bg-brand-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`block w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                      config.enableNotifications ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </label>
            </div>
          </div>

          {/* Reset */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
            <button
              onClick={resetConfig}
              className="w-full py-2 px-4 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Restablecer configuración
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800">
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 bg-brand-500 hover:bg-brand-600 text-white font-medium rounded-xl transition-colors"
          >
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatSettings;