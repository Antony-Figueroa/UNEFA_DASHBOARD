import React from 'react';
import { ChatWindow } from '../../features/ai-assistant/components/ChatWindow';

/**
 * Página del Asistente de IA
 * Accesible desde /ai-assistant
 */
const AIAssistant: React.FC = () => {
    return (
        <div className="bg-white dark:bg-gray-950 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-theme-lg overflow-hidden flex flex-col h-[calc(100vh-220px)] min-h-[600px]">
            <ChatWindow />
        </div>
    );
};

export default AIAssistant;
