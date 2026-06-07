/**
 * AI Provider Factory - Abstracción unificada para proveedores de IA
 * Patrón: Factory + Strategy para soportar múltiples proveedores
 *
 * Proveedores soportados:
 * - Groq (primary)
 * - Google (fallback)
 */

import { ChatMessage, streamChat as streamGroq, sendChat as sendGroq } from './groq-ai.service.js';
import { streamChat as streamGoogle, sendChat as sendGoogle } from './google-ai.service.js';

// ============================================
// Types - Interfaz común para proveedores
// ============================================

export interface AIProvider {
  name: string;
  streamChat(params: StreamParams, onChunk: (text: string) => void): Promise<string>;
  sendChat(params: NonStreamParams): Promise<string>;
  isAvailable(): boolean;
}

export interface StreamParams {
  messages: ChatMessage[];
  systemInstruction: string;
  maxTokens?: number;
  temperature?: number;
  tools?: AITool[];
}

export interface NonStreamParams extends StreamParams {
  responseFormat?: ResponseFormat;
}

export interface ResponseFormat {
  type: 'json_object' | 'json_schema';
  json_schema?: JsonSchemaDefinition;
}

export interface JsonSchemaDefinition {
  name: string;
  strict: boolean;
  schema: Record<string, unknown>;
}

export interface AITool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, unknown>;
      required?: string[];
    };
  };
}

// ============================================
// Tool Registry - Sistema de herramientas para Tool Use
// ============================================

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
  handler: ToolHandler;
}

export type ToolHandler = (args: Record<string, unknown>) => Promise<unknown>;

// Registro centralizado de herramientas disponibles
const toolRegistry: Map<string, ToolDefinition> = new Map();

/**
 * Registra una nueva herramienta para uso de la IA
 */
export const registerTool = (tool: ToolDefinition): void => {
  toolRegistry.set(tool.name, tool);
  console.log(`[AI Tools] Registered: ${tool.name}`);
};

/**
 * Obtiene todas las herramientas registradas en formato Groq
 */
export const getToolsForProvider = (): AITool[] => {
  const tools: AITool[] = [];

  toolRegistry.forEach((tool, name) => {
    tools.push({
      type: 'function',
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters as AITool['function']['parameters'],
      },
    });
  });

  return tools;
};

/**
 * Ejecuta una herramienta por nombre
 */
export const executeTool = async (name: string, args: Record<string, unknown>): Promise<unknown> => {
  const tool = toolRegistry.get(name);
  if (!tool) {
    throw new Error(`Tool '${name}' no encontrada`);
  }

  console.log(`[AI Tools] Executing: ${name}`, args);
  return await tool.handler(args);
};

// ============================================
// Groq Provider Implementation
// ============================================

class GroqProvider implements AIProvider {
  name = 'GROQ';

  isAvailable(): boolean {
    return !!process.env.GROQ_API_KEY;
  }

  async streamChat(params: StreamParams, onChunk: (text: string) => void): Promise<string> {
    return streamGroq(params, onChunk);
  }

  async sendChat(params: NonStreamParams): Promise<string> {
    // Agregar tools si están disponibles
    const tools = params.tools && params.tools.length > 0 ? params.tools : undefined;

    const result = await sendGroq({
      ...params,
      responseFormat: params.responseFormat,
    } as any);

    // sendGroq ahora retorna ChatResult { content, tool_calls }
    return result.content;
  }
}

// ============================================
// Google Provider Implementation
// ============================================

class GoogleProvider implements AIProvider {
  name = 'GOOGLE';

  isAvailable(): boolean {
    return !!process.env.GOOGLE_AI_KEY;
  }

  async streamChat(params: StreamParams, onChunk: (text: string) => void): Promise<string> {
    return streamGoogle(params, onChunk);
  }

  async sendChat(params: NonStreamParams): Promise<string> {
    return sendGoogle(params);
  }
}

// ============================================
// Factory - Selección automática del mejor provider
// ============================================

class AIProviderFactory {
  private providers: AIProvider[] = [
    new GroqProvider(),
    new GoogleProvider(),
  ];

  private activeProvider: AIProvider | null = null;
  private fallbackProvider: AIProvider | null = null;

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders(): void {
    // Prioridad: Groq > Google
    const groqProvider = this.providers.find(p => p.name === 'GROQ');
    const googleProvider = this.providers.find(p => p.name === 'GOOGLE');

    if (groqProvider?.isAvailable()) {
      this.activeProvider = groqProvider;
      console.log('[AI Factory] Active provider: GROQ');
    } else if (googleProvider?.isAvailable()) {
      this.activeProvider = googleProvider;
      console.log('[AI Factory] Active provider: GOOGLE');
    }

    // Setup fallback
    if (this.activeProvider?.name === 'GROQ' && googleProvider?.isAvailable()) {
      this.fallbackProvider = googleProvider;
      console.log('[AI Factory] Fallback provider: GOOGLE');
    }
  }

  /**
   * Obtiene el proveedor activo
   */
  getActiveProvider(): AIProvider {
    if (!this.activeProvider) {
      throw new Error('No hay proveedores de IA disponibles');
    }
    return this.activeProvider;
  }

  /**
   * Obtiene el proveedor de fallback
   */
  getFallbackProvider(): AIProvider | null {
    return this.fallbackProvider;
  }

  /**
   * Ejecuta chat con fallback automático
   */
  async sendChatWithFallback(params: NonStreamParams): Promise<{ text: string; provider: string }> {
    if (!this.activeProvider) {
      throw new Error('No hay proveedores de IA disponibles');
    }

    try {
      const text = await this.activeProvider.sendChat(params);
      return { text, provider: this.activeProvider.name };
    } catch (error: any) {
      // Si el provider activo falló y hay fallback, intentar con fallback
      if (this.fallbackProvider && error?.isRetryable) {
        console.log(`[AI Factory] Primary failed, trying fallback: ${this.fallbackProvider.name}`);
        const text = await this.fallbackProvider.sendChat(params);
        return { text, provider: this.fallbackProvider.name };
      }
      throw error;
    }
  }

  /**
   * Ejecuta streaming con fallback automático
   */
  async streamChatWithFallback(
    params: StreamParams,
    onChunk: (text: string) => void
  ): Promise<{ fullText: string; provider: string }> {
    if (!this.activeProvider) {
      throw new Error('No hay proveedores de IA disponibles');
    }

    try {
      const fullText = await this.activeProvider.streamChat(params, onChunk);
      return { fullText, provider: this.activeProvider.name };
    } catch (error: any) {
      // Si el provider activo falló y hay fallback, intentar con fallback
      if (this.fallbackProvider && error?.isRetryable) {
        console.log(`[AI Factory] Primary stream failed, trying fallback: ${this.fallbackProvider.name}`);
        const fullText = await this.fallbackProvider.streamChat(params, onChunk);
        return { fullText, provider: this.fallbackProvider.name };
      }
      throw error;
    }
  }

  /**
   * Obtiene información del estado de los providers
   */
  getStatus(): { active: string | null; fallback: string | null; available: string[] } {
    const available = this.providers.filter(p => p.isAvailable()).map(p => p.name);
    return {
      active: this.activeProvider?.name || null,
      fallback: this.fallbackProvider?.name || null,
      available,
    };
  }
}

// ============================================
// Export singleton instance
// ============================================

export const aiProviderFactory = new AIProviderFactory();

// ============================================
// Helper functions para uso común
// ============================================

/**
 * Envia un chat simple con el provider activo
 */
export const sendSimpleChat = async (
  messages: ChatMessage[],
  systemInstruction: string
): Promise<string> => {
  const provider = aiProviderFactory.getActiveProvider();
  return provider.sendChat({ messages, systemInstruction });
};

/**
 * Envia un chat con herramientas (Tool Use)
 */
export const sendChatWithTools = async (
  messages: ChatMessage[],
  systemInstruction: string,
  tools: AITool[]
): Promise<{ text: string; toolCalls?: ToolCallResult[] }> => {
  const provider = aiProviderFactory.getActiveProvider();
  const toolCalls: ToolCallResult[] = [];

  // Primera llamada: obtener respuesta + tool calls
  const response = await provider.sendChat({
    messages,
    systemInstruction,
    tools,
  } as NonStreamParams);

  // Procesar tool calls si los hay
  // Por ahora retornamos la respuesta directa
  // El procesamiento de tool calls se hace en el controller

  return { text: response, toolCalls };
};

export interface ToolCallResult {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  result?: unknown;
}