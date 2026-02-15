import { AIService } from './AIService';
import { ChatRequest, ChatResponse, Message } from '../types';

/**
 * Implementación del servicio de IA usando Google Generative AI (Gemini)
 */
export class GoogleAIService extends AIService {
    private endpoint: string;

    constructor(model: string, apiKey: string) {
        super(model, apiKey);
        // v1beta suele ser más permisivo con nuevos modelos y streaming
        this.endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    }

    async sendMessage(request: ChatRequest): Promise<ChatResponse> {
        try {
            // Gemma 3 y Gemini soportan system_instruction nativo en v1beta, 
            // pero gemma-3-1b-it parece rechazarlo explícitamente vía API
            const supportsSystemInstruction = !this.model.includes('gemma');
            
            const body: any = {
                contents: this.formatMessages(request.messages, !supportsSystemInstruction ? request.systemInstruction : undefined),
                generationConfig: {
                    maxOutputTokens: request.maxTokens || 2048,
                    temperature: request.temperature || 0.7,
                }
            };

            if (request.systemInstruction && supportsSystemInstruction) {
                body.system_instruction = {
                    parts: [{ text: request.systemInstruction }]
                };
            }

            const response = await fetch(this.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error?.message || `Error en Google AI Service: ${response.status}`);
            }

            const data = await response.json();
            const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

            return {
                id: data.id || Date.now().toString(),
                message: {
                    id: Date.now().toString(),
                    role: 'assistant',
                    content,
                    timestamp: new Date(),
                },
                model: this.model,
                finishReason: 'stop',
            };
        } catch (error) {
            console.error('Error in GoogleAIService.sendMessage:', error);
            throw error;
        }
    }

    async streamMessage(
        request: ChatRequest,
        onChunk: (chunk: string) => void
    ): Promise<void> {
        // Para streaming real, Google recomienda v1beta con alt=sse
        const streamEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:streamGenerateContent?alt=sse&key=${this.apiKey}`;

        try {
            const supportsSystemInstruction = !this.model.includes('gemma');

            const body: any = {
                contents: this.formatMessages(request.messages, !supportsSystemInstruction ? request.systemInstruction : undefined),
                generationConfig: {
                    maxOutputTokens: request.maxTokens || 2048,
                    temperature: request.temperature || 0.7,
                }
            };

            if (request.systemInstruction && supportsSystemInstruction) {
                body.system_instruction = {
                    parts: [{ text: request.systemInstruction }]
                };
            }

            const response = await fetch(streamEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error?.message || `Error al iniciar stream: ${response.status}`);
            }

            const reader = response.body?.getReader();
            if (!reader) throw new Error('Cuerpo de respuesta no disponible');

            const decoder = new TextDecoder();
            let lineBuffer = '';
            
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const decoded = decoder.decode(value, { stream: true });
                lineBuffer += decoded;
                
                const lines = lineBuffer.split('\n');
                // Mantener el residuo en el buffer
                lineBuffer = lines.pop() || '';

                for (const line of lines) {
                    const trimmedLine = line.trim();
                    if (trimmedLine.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(trimmedLine.substring(6));
                            const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
                            if (text) onChunk(text);
                        } catch (e) {
                            // Ignorar errores de parsing en chunks intermedios
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error in GoogleAIService.streamMessage:', error);
            throw error;
        }
    }

    protected formatMessages(messages: Message[], systemPrompt?: string): any[] {
        const formatted = messages.map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }]
        }));

        // Si hay un systemPrompt y el modelo no soporta system_instruction nativo,
        // lo inyectamos al principio del primer mensaje de usuario.
        if (systemPrompt && formatted.length > 0 && formatted[0].role === 'user') {
            formatted[0].parts[0].text = `INSTRUCCIONES DE SISTEMA:\n${systemPrompt}\n\nMENSAJE DEL USUARIO:\n${formatted[0].parts[0].text}`;
        }

        return formatted;
    }
}
