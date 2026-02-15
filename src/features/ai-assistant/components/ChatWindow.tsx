import { useState } from 'react';
import { ChatWindowProps, MessageAction } from '../types';
import { ChatHeader } from './ChatHeader';
import { MessageList } from './MessageList';
import { AISuggestions } from './AISuggestions';
import { ChatInput } from './ChatInput';
import { useNavigate } from 'react-router';
import { useAIChat } from '../hooks/useAIChat';
import { ChatHistorySidebar } from './ChatHistorySidebar';
import { UnifiedDialog } from '../../../components/ui/dialog/UnifiedDialog';

/**
 * Ventana principal de chat de IA (Full Page)
 */
export const ChatWindow: React.FC<ChatWindowProps> = () => {
    const navigate = useNavigate();
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);

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

    const handleSend = (message: string) => {
        // Validación: No permitir mensajes vacíos o solo espacios
        if (!message || !message.trim()) return;
        sendMessage(message);
    };

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

    const handleBack = () => {
        navigate('/dashboard');
    };

    const toggleHistory = () => {
        setIsHistoryOpen(!isHistoryOpen);
    };

    return (
        <div className="flex h-full w-full bg-white dark:bg-gray-900 overflow-hidden relative">
            {/* Main Chat Area */}
            <div className="flex flex-col flex-1 h-full min-w-0">
                <ChatHeader
                    model="Gemma 3 1B Instruct"
                    onBackClick={handleBack}
                    onClearChat={handleClearChat}
                    onHistoryToggle={toggleHistory}
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
                        onActionClick={handleActionClick}
                    />

                    <AISuggestions
                        suggestions={suggestions}
                        onSelect={handleSuggestionSelect}
                        maxVisible={4}
                    />

                    <ChatInput
                        onSend={handleSend}
                        isLoading={isLoading || isStreaming}
                        placeholder="Escribe tu mensaje institucional..."
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
