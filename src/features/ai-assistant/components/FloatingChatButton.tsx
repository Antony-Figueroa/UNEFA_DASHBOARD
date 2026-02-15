import React from 'react';
import { FloatingChatButtonProps } from '../types';
import { MessageCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Botón flotante para abrir el chat de IA
 * Se muestra en la esquina inferior derecha del dashboard
 */
export const FloatingChatButton: React.FC<FloatingChatButtonProps> = ({
    isOpen,
    onToggle,
    unreadCount = 0
}) => {
    return (
        <motion.button
            onClick={onToggle}
            className="fixed bottom-6 right-6 z-50 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg transition-all hover:shadow-xl hover:scale-105 focus:outline-none focus:ring-4 focus:ring-primary-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label={isOpen ? 'Cerrar asistente de IA' : 'Abrir asistente de IA'}
        >
            <AnimatePresence mode="wait">
                {isOpen ? (
                    <motion.div
                        key="close"
                        initial={{ rotate: -90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: 90, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <X size={28} />
                    </motion.div>
                ) : (
                    <motion.div
                        key="open"
                        initial={{ rotate: 90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: -90, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="relative"
                    >
                        <MessageCircle size={28} />

                        {/* Badge de mensajes no leídos */}
                        {unreadCount > 0 && (
                            <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold"
                            >
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </motion.span>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.button>
    );
};
