import { AIService } from './AIService';
import { ChatRequest, ChatResponse, Message } from '../types';

/**
 * Implementación del servicio de IA usando OpenRouter.ai
 * Sirve como fallback o para usar modelos específicos (Llama, Claude, etc.)
 */
export class OpenRouterService extends AIService {
    constructor(model: string, apiKey: string) {
        super(model, apiKey, 'https://openrouter.ai/api/v1');
    }

    async sendMessage(request: ChatRequest): Promise<ChatResponse> {
        try {
            const response = await fetch(`${this.baseURL}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'HTTP-Referer': 'https://unefa.edu.ve', // Opcional para OpenRouter ranking
                    'X-Title': 'UNEFA Dashboard AI',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: this.formatMessages(request.messages),
                    temperature: request.temperature || 0.7,
                    max_tokens: request.maxTokens || 2048,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || 'Error en OpenRouter Service');
            }

            const data = await response.json();
            const content = data.choices?.[0]?.message?.content || '';

            return {
                id: data.id || Date.now().toString(),
                message: {
                    id: Date.now().toString(),
                    role: 'assistant',
                    content,
                    timestamp: new Date(),
                },
                model: this.model,
                finishReason: data.choices?.[0]?.finish_reason || 'stop',
            };
        } catch (error) {
            console.error('Error in OpenRouterService.sendMessage:', error);
            throw error;
        }
    }

    async streamMessage(
        request: ChatRequest,
        onChunk: (chunk: string) => void
    ): Promise<void> {
        try {
            const response = await fetch(`${this.baseURL}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'HTTP-Referer': 'https://unefa.edu.ve',
                    'X-Title': 'UNEFA Dashboard AI',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: this.formatMessages(request.messages),
                    temperature: request.temperature || 0.7,
                    max_tokens: request.maxTokens || 2048,
                    stream: true,
                }),
            });

            if (!response.ok) {
                throw new Error('Error al iniciar stream con OpenRouter');
            }

            const reader = response.body?.getReader();
            if (!reader) throw new Error('Cuerpo de respuesta no disponible');

            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n').filter(line => line.trim() !== '');

                for (const line of lines) {
                    if (line.includes('[DONE]')) return;
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.slice(6));
                            const text = data.choices?.[0]?.delta?.content || '';
                            if (text) onChunk(text);
                        } catch (e) {
                            // Errores de parseo en chunks incompletos
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error in OpenRouterService.streamMessage:', error);
            throw error;
        }
    }

    protected formatMessages(messages: Message[]): any[] {
        return messages.map(msg => ({
            role: msg.role,
            content: msg.content
        }));
    }
}
