import { useState, useCallback } from 'react';
import { ChatWindowProps, MessageAction } from '../types';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { AISuggestions } from './AISuggestions';
import { ChatInput } from './ChatInput';
import { ChatSettings } from './ChatSettings';
import { QuickActions } from './QuickActions';
import { useAIChat } from '../hooks/useAIChat';
import { useChatConfig } from '../hooks/useChatConfig';
import { ChatHistorySidebar } from './ChatHistorySidebar';
import { UnifiedDialog } from '../../../components/ui/dialog/UnifiedDialog';

/**
 * Ventana principal de chat de IA (Full Page)
 */
export const ChatWindow: React.FC<ChatWindowProps> = () => {
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    const {
        messages,
        isLoading,
        isStreaming,
        error,
        sendMessage,
        clearHistory,
        currentSession,
        loadSession,
        deleteSession,
        suggestions
    } = useAIChat();

    const { config, getPersonaPrompt } = useChatConfig();

    const handleSend = useCallback((message: string) => {
        if (!message || !message.trim()) return;
        // Agregar prompt de persona si es relevante
        const personaPrompt = getPersonaPrompt();
        sendMessage(message);
    }, [sendMessage, getPersonaPrompt]);

    const handleActionClick = (action: MessageAction) => {
        console.log('Action clicked:', action);
    };

    const handleClearChat = () => {
        setIsClearDialogOpen(true);
    };

    const confirmClearChat = () => {
        clearHistory();
        setIsClearDialogOpen(false);
    };

    const handleSuggestionSelect = (suggestion: string) => {
        if (!isLoading && !isStreaming) {
            sendMessage(suggestion);
        }
    };

    // Manejar acciones rápidas
    const handleQuickAction = (action: string) => {
        if (!isLoading && !isStreaming) {
            sendMessage(action);
        }
    };

    const toggleHistory = () => {
        setIsHistoryOpen(!isHistoryOpen);
    };

    const toggleSettings = () => {
        setIsSettingsOpen(!isSettingsOpen);
    };

    return (
        <div className="flex h-full w-full bg-white dark:bg-gray-900 overflow-hidden relative">
            {/* Main Chat Area */}
            <div className="flex flex-col flex-1 h-full min-w-0">
                <ChatHeader
                    onClearChat={handleClearChat}
                    onHistoryToggle={toggleHistory}
                    onSettingsClick={toggleSettings}
                    messages={messages}
                    title={currentSession?.title || 'Nueva conversación'}
                />

                {error && (
                    <div className="px-6 py-2 bg-error-50 dark:bg-error-900/20 border-b border-error-100 dark:border-error-800">
                        <p className="text-xs text-error-700 dark:text-error-400 font-medium">
                            ⚠️ {error}
                        </p>
                    </div>
                )}

                <div className="flex-1 overflow-hidden flex flex-col">
                    <MessageList
                        messages={messages}
                        isLoading={isLoading || isStreaming}
                        isStreaming={isStreaming}
                        onActionClick={handleActionClick}
                    />

                    {/* Solo mostrar Quick Actions - simplificado */}
                    <QuickActions
                        actions={config.quickActions}
                        onAction={handleQuickAction}
                        disabled={isLoading || isStreaming}
                    />

                    <ChatInput
                        onSend={handleSend}
                        isLoading={isLoading || isStreaming}
                        placeholder={config.persona === 'casual' ? 'Escribe tu mensaje...' : 'Escribe tu mensaje institucional...'}
                        maxLength={2000}
                    />
                </div>
            </div>

            {/* History Sidebar */}
            <ChatHistorySidebar
                isOpen={isHistoryOpen}
                onClose={() => setIsHistoryOpen(false)}
                currentSessionId={currentSession?.id}
                onSelectSession={loadSession}
                onDeleteSession={deleteSession}
                onNewChat={clearHistory}
            />

            {/* Settings Dialog */}
            <ChatSettings
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
            />

            {/* Confirmation Dialog */}
            <UnifiedDialog
                isOpen={isClearDialogOpen}
                onClose={() => setIsClearDialogOpen(false)}
                onConfirm={confirmClearChat}
                variant="confirm"
                title="Limpiar Conversación"
                message="¿Estás seguro de que deseas limpiar esta conversación? Los mensajes se borrarán de la sesión actual."
                confirmLabel="Limpiar"
                cancelLabel="Cancelar"
            />
        </div>
    );
};
