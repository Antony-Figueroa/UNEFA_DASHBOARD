import React, { useState, useRef, useEffect } from "react";
import { IoChatbubbleEllipsesOutline, IoCloseOutline, IoSend } from "react-icons/io5";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: "¡Hola! Soy tu asistente virtual de UNEFA. ¿En qué puedo ayudarte hoy?",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => `unefa-session-${Math.random().toString(36).substring(7)}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const n8nWebhookUrl = import.meta.env.VITE_N8N_WEBHOOK_URL;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: message,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setMessage("");
    setIsLoading(true);

    try {
      if (!n8nWebhookUrl) {
        throw new Error("N8N_URL_MISSING");
      }

      const response = await fetch(n8nWebhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          message: userMessage.text,
          sessionId: sessionId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("[ChatBot] Detalle del error de n8n:", errorData);
        
        if (response.status === 404) {
          throw new Error("WEBHOOK_NOT_FOUND");
        }
        if (response.status >= 500) {
          throw new Error("N8N_SERVER_ERROR");
        }
        throw new Error(`HTTP_ERROR_${response.status}`);
      }

      const data = await response.json();
      
      // Intentar extraer el texto de diferentes formatos comunes de n8n
      let botText = "";
      if (typeof data === 'string') {
        botText = data;
      } else if (Array.isArray(data) && data.length > 0) {
        const firstItem = data[0];
        botText = firstItem.output || firstItem.message || firstItem.text || firstItem.response || JSON.stringify(firstItem);
      } else {
        botText = data.output || data.message || data.text || data.response || (typeof data === 'object' ? JSON.stringify(data) : "Lo siento, no pude procesar tu solicitud.");
      }
      
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: botText,
        sender: "bot",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botResponse]);
    } catch (error: any) {
      console.error("Error in ChatBot:", error);
      
      let errorMessageText = "Hubo un error al conectar con el asistente.";
      
      if (error.message === "N8N_URL_MISSING") {
        errorMessageText = "La URL del webhook de n8n no está configurada en el archivo .env.";
      } else if (error.message === "WEBHOOK_NOT_FOUND") {
        errorMessageText = "No se encontró el webhook en n8n. Verifica que el flujo esté activo y la URL sea correcta.";
      } else if (error.message === "N8N_SERVER_ERROR") {
        errorMessageText = "n8n devolvió un error interno (500). Por favor, revisa la pestaña 'Executions' en tu workflow de n8n para ver qué falló.";
      } else if (error instanceof TypeError && error.message === "Failed to fetch") {
        errorMessageText = "Error de conexión. Si estás en desarrollo, asegúrate de haber reiniciado el servidor después de configurar el proxy.";
      }

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: errorMessageText,
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Botón Flotante */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-500 text-white shadow-lg transition-transform hover:scale-110 active:scale-95 dark:bg-brand-600"
      >
        {isOpen ? (
          <IoCloseOutline className="h-8 w-8" />
        ) : (
          <IoChatbubbleEllipsesOutline className="h-7 w-7" />
        )}
      </button>

      {/* Ventana de Chat */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-20 right-0 flex h-[500px] w-[350px] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800"
            style={{ willChange: "transform, opacity" }}
          >
            {/* Cabecera */}
            <div className="flex items-center justify-between bg-brand-500 p-4 text-white dark:bg-brand-600">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-white/20 p-2">
                  <img src="/logo-nuevo.svg" alt="UNEFA" className="h-full w-full invert" />
                </div>
                <div>
                  <h3 className="font-semibold">Asistente UNEFA</h3>
                  <p className="text-xs text-brand-100">En línea</p>
                </div>
              </div>
            </div>

            {/* Mensajes */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                      msg.sender === "user"
                        ? "bg-brand-500 text-white"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100"
                    }`}
                  >
                    {msg.text}
                    <div
                      className={`mt-1 text-[10px] ${
                        msg.sender === "user" ? "text-brand-100" : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-2xl bg-gray-100 px-4 py-2 text-sm dark:bg-gray-700">
                    <div className="flex gap-1">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400"></span>
                      <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:0.2s]"></span>
                      <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:0.4s]"></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="border-t border-gray-100 p-4 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Escribe tu mensaje..."
                  className="flex-1 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
                <button
                  type="submit"
                  disabled={!message.trim() || isLoading}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 text-white transition-colors hover:bg-brand-600 disabled:bg-gray-300 dark:disabled:bg-gray-600"
                >
                  <IoSend className="h-5 w-5" />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatBot;
