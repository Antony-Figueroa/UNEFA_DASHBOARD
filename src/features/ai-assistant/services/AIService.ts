import { ChatRequest, ChatResponse, Message } from '../types';

/**
 * Clase base para servicios de IA
 * Define la interfaz común para diferentes proveedores
 */
export abstract class AIService {
    protected model: string;
    protected apiKey: string;
    protected baseURL: string;

    constructor(model: string, apiKey: string, baseURL: string = '') {
        this.model = model;
        this.apiKey = apiKey;
        this.baseURL = baseURL;
    }

    /**
     * Envía un mensaje y recibe una respuesta completa
     */
    abstract sendMessage(request: ChatRequest): Promise<ChatResponse>;

    /**
     * Envía un mensaje y recibe una respuesta en streaming
     */
    abstract streamMessage(
        request: ChatRequest,
        onChunk: (chunk: string) => void
    ): Promise<void>;

    /**
     * Formatea el historial de mensajes para el proveedor específico
     */
    protected abstract formatMessages(messages: Message[]): any[];
}
