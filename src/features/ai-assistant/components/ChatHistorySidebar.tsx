import React, { useEffect, useState } from 'react';
import { ChatSession } from '../types';
import { chatHistoryService } from '../services/ChatHistoryService';
import { useAuth } from '../../../context/auth';
import { TrashBinIcon } from '../../../icons';
import { UnifiedDialog } from '../../../components/ui/dialog/UnifiedDialog';

interface ChatHistorySidebarProps {
    isOpen: boolean;
    onClose: () => void;
    currentSessionId?: string;
    onSelectSession: (sessionId: string) => void;
    onDeleteSession: (sessionId: string) => void;
    onNewChat: () => void;
}

export const ChatHistorySidebar: React.FC<ChatHistorySidebarProps> = ({
    isOpen,
    onClose,
    currentSessionId,
    onSelectSession,
    onDeleteSession,
    onNewChat
}) => {
    const { user } = useAuth();
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);

    useEffect(() => {
        const fetchSessions = () => {
            if (user && isOpen) {
                chatHistoryService.getSessions(user.id).then(setSessions);
            }
        };

        fetchSessions();

        // Escuchar actualizaciones de sesiones (mensajes nuevos, títulos, etc.)
        window.addEventListener('unefa:ai-chat:sessions-updated', fetchSessions);

        return () => {
            window.removeEventListener('unefa:ai-chat:sessions-updated', fetchSessions);
        };
    }, [user, isOpen]);

    const handleDeleteClick = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setDeleteSessionId(id);
    };

    const confirmDelete = () => {
        if (deleteSessionId) {
            onDeleteSession(deleteSessionId);
            setSessions(prev => prev.filter(s => s.id !== deleteSessionId));
            setDeleteSessionId(null);
        }
    };

    return (
        <>
            {/* Backdrop for mobile */}
            <div
                className={`fixed inset-0 z-50 bg-gray-600/30 backdrop-blur-sm transition-opacity duration-300 sm:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                onClick={onClose}
            />

            <div
                className={`fixed inset-y-0 right-0 z-50 flex overflow-hidden transition-all duration-300 ease-in-out sm:relative sm:z-auto ${isOpen ? 'w-80 opacity-100' : 'w-0 opacity-0 pointer-events-none'
                    }`}
            >
                <div className="w-80 flex-shrink-0 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 shadow-xl sm:shadow-none flex flex-col h-full">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                        <h2 className="font-semibold text-gray-900 dark:text-white">Conversaciones</h2>
                        <button
                            onClick={onClose}
                            className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="p-4">
                        <button
                            onClick={() => {
                                onNewChat();
                                onClose();
                            }}
                            className="w-full py-2.5 px-4 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-medium transition-colors flex items-center justify-center gap-2 mb-4 shadow-sm shadow-brand-200 dark:shadow-none"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            Nuevo Chat
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto px-2 space-y-1 pb-4">
                        {sessions.length === 0 ? (
                            <div className="text-center py-10 px-4 text-gray-500 text-sm italic">
                                No hay conversaciones guardadas.
                            </div>
                        ) : (
                            sessions.map(session => (
                                <div
                                    key={session.id}
                                    onClick={() => {
                                        onSelectSession(session.id);
                                        onClose();
                                    }}
                                    className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${currentSessionId === session.id
                                        ? 'bg-brand-50 dark:bg-brand-900/20 border border-brand-100 dark:border-brand-800'
                                        : 'hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent'
                                        }`}
                                >
                                    <div className="flex flex-col min-w-0 flex-1">
                                        <span className={`text-sm truncate ${currentSessionId === session.id
                                            ? 'text-brand-900 dark:text-brand-300 font-semibold'
                                            : 'text-gray-700 dark:text-gray-300 font-medium'
                                            }`}>
                                            {session.title || 'Conversación sin título'}
                                        </span>
                                        <span className="text-[10px] text-gray-500 dark:text-gray-500 mt-0.5">
                                            {new Date(session.updatedAt).toLocaleDateString('es-VE', {
                                                day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                                            })}
                                        </span>
                                    </div>

                                    <button
                                        onClick={(e) => handleDeleteClick(e, session.id)}
                                        className="p-1.5 rounded-md hover:bg-error-50 dark:hover:bg-error-900/30 text-gray-400 hover:text-error-600 opacity-0 group-hover:opacity-100 transition-all sm:group-hover:flex"
                                        title="Eliminar conversación"
                                    >
                                        <TrashBinIcon className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/30 text-[10px] text-gray-400 text-center">
                        Los chats se guardan automáticamente por usuario
                    </div>
                </div>
            </div>

            <UnifiedDialog
                isOpen={!!deleteSessionId}
                onClose={() => setDeleteSessionId(null)}
                onConfirm={confirmDelete}
                variant="confirm"
                title="Eliminar Conversación"
                message="¿Estás seguro de que deseas eliminar esta conversación del historial? Esta acción no se puede deshacer."
                confirmLabel="Eliminar"
                cancelLabel="Cancelar"
            />
        </>
    );
};
