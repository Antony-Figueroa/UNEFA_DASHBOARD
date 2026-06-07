import Groq from 'groq-sdk';

// ============================================
// Configuration - Environment Variables
// ============================================

const apiKey = process.env.GROQ_API_KEY || '';

if (!apiKey) {
  console.warn('[Groq] GROQ_API_KEY no configurada en .env');
}

// Model selection based on use case
// See: https://console.groq.com/docs/models
const DEFAULT_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
const MAX_TOKENS = parseInt(process.env.GROQ_MAX_TOKENS || '4096', 10);
const TEMPERATURE = parseFloat(process.env.GROQ_TEMPERATURE || '0.7');

// Client configuration - Best practices from Groq skill
const GROQ_TIMEOUT = parseInt(process.env.GROQ_TIMEOUT || '60000', 10); // 60s default
const GROQ_MAX_RETRIES = parseInt(process.env.GROQ_MAX_RETRIES || '3', 10);

// Prompt caching - 50% discount on repeated prefixes
// Models: openai/gpt-oss-20b, openai/gpt-oss-120b
const PROMPT_CACHING_MODELS = ['openai/gpt-oss-20b', 'openai/gpt-oss-120b'];

// Initialize client with proper configuration
// Using Groq class directly for error type checking
// Ref: Groq Skill - Advanced client configuration
export const groq = new Groq({
  apiKey,
  dangerouslyAllowBrowser: false,
  timeout: GROQ_TIMEOUT,           // Timeout de 60 segundos
  maxRetries: GROQ_MAX_RETRIES,   // Reintentos automáticos
});

console.log(`[Groq] Initialized with model: ${DEFAULT_MODEL}, maxTokens: ${MAX_TOKENS}, temp: ${TEMPERATURE}`);

// ============================================
// Types
// ============================================

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface StreamChatParams {
  messages: ChatMessage[];
  systemInstruction: string;
  maxTokens?: number;
  temperature?: number;
  responseFormat?: ResponseFormat;
  tools?: NonStreamChatParams['tools'];
  tool_choice?: NonStreamChatParams['tool_choice'];
}

export interface NonStreamChatParams extends StreamChatParams {
  // For structured outputs / JSON mode
  responseFormat?: ResponseFormat;
  // Native tool calling via Groq SDK
  tools?: Array<{
    type: 'function';
    function: {
      name: string;
      description: string;
      parameters: Record<string, unknown>;
    };
  }>;
  tool_choice?: 'auto' | 'none' | { type: 'function'; function: { name: string } };
}

export type ResponseFormat = 
  | { type: 'json_object' }
  | { type: 'json_schema'; json_schema: JsonSchemaDefinition };

export interface JsonSchemaDefinition {
  name: string;
  strict: boolean;
  schema: Record<string, unknown>;
}

// ============================================
// Helper Functions
// ============================================

const formatMessages = (messages: ChatMessage[]) => {
  return messages
    .filter(m => m.role !== 'system')
    .map(m => ({
      role: m.role === 'assistant' ? 'assistant' as const : 'user' as const,
      content: m.content
    }));
};

// Check if model supports prompt caching
const supportsPromptCaching = (model: string): boolean => {
  return PROMPT_CACHING_MODELS.includes(model);
};

// ============================================
// Error Handling - Groq Best Practices
// ============================================

/**
 * Custom error class for Groq API errors with context
 * Using 'any' for the error to check against Groq error types
 */
export class GroqAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public isRetryable: boolean = false
  ) {
    super(message);
    this.name = 'GroqAPIError';
  }
}

/**
 * Handle Groq errors with appropriate strategies
 * Uses Groq error class subtypes for proper error handling
 */
const handleGroqError = (error: unknown, operation: string): never => {
  console.error(`[Groq] Error during ${operation}:`, error);

  // Check for Groq-specific error types using instanceof
  // These are subclasses of Groq.APIError
  if (error instanceof Groq.RateLimitError) {
    console.error('[Groq] Rate limit exceeded. Consider implementing retry with backoff.');
    throw new GroqAPIError(
      'Has excedido el límite de solicitudes. Por favor, espera un momento antes de intentar de nuevo.',
      429,
      true
    );
  }

  if (error instanceof Groq.APIConnectionError) {
    console.error('[Groq] Connection error. Check network and API endpoint.');
    throw new GroqAPIError(
      'Error de conexión. Verifica tu conexión a internet.',
      undefined,
      true
    );
  }

  if (error instanceof Groq.APIError) {
    const apiError = error as { status?: number; message?: string };
    const statusCode = apiError.status;
    console.error(`[Groq] API error: status=${statusCode}, message=${apiError.message}`);
    
    // Handle specific status codes
    if (statusCode === 401) {
      throw new GroqAPIError('API key inválida. Verifica la configuración.', 401, false);
    }
    if (statusCode === 403) {
      throw new GroqAPIError('Acceso denegado. Verifica los permisos.', 403, false);
    }
    if (statusCode === 429) {
      throw new GroqAPIError('Límite de requests alcanzado.', 429, true);
    }
    if (statusCode && statusCode >= 500) {
      throw new GroqAPIError(`Error del servidor (${statusCode}). Intenta más tarde.`, statusCode, true);
    }
    
    throw new GroqAPIError(`Error de la API: ${apiError.message}`, statusCode, true);
  }

  // Generic error - also handle unknown errors
  const message = error instanceof Error ? error.message : 'Error desconocido';
  throw new GroqAPIError(message, undefined, true);
};

// ============================================
// Main Functions
// ============================================

export const streamChat = async (
  params: StreamChatParams,
  onChunk: (text: string) => void
): Promise<string> => {
  const model = DEFAULT_MODEL;
  const maxTokens = params.maxTokens || MAX_TOKENS;
  const temperature = params.temperature || TEMPERATURE;

  console.log(`[Groq] Streaming with model: ${model}, maxTokens: ${maxTokens}, temp: ${temperature}`);

  try {
    // Build messages array
    const systemMessage = { role: 'system' as const, content: params.systemInstruction };
    const formattedMessages = formatMessages(params.messages);

    // Check for prompt caching support (future enhancement)
    // For now, we'll use the standard approach
    const usePromptCaching = supportsPromptCaching(model);
    if (usePromptCaching) {
      console.log('[Groq] Model supports prompt caching (50% discount)');
    }

    const completion = await groq.chat.completions.create({
      model,
      messages: [systemMessage, ...formattedMessages],
      max_tokens: maxTokens,
      temperature,
      stream: true,
      // Response format for JSON mode if specified
      ...(params.responseFormat && { response_format: params.responseFormat }),
    });

    let fullText = '';
    let tokenCount = 0;

    for await (const chunk of completion) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        fullText += content;
        tokenCount++;
        onChunk(content);
      }
    }

    console.log(`[Groq] Stream completed. Total chunks: ${tokenCount}, response length: ${fullText.length} chars`);
    return fullText;

  } catch (error: unknown) {
    handleGroqError(error, 'streaming');
  }
};

export interface ChatResult {
  content: string;
  tool_calls?: Array<{
    id: string;
    type: 'function';
    function: { name: string; arguments: string };
  }>;
}

export const sendChat = async (params: NonStreamChatParams): Promise<ChatResult> => {
  const model = DEFAULT_MODEL;
  const maxTokens = params.maxTokens || MAX_TOKENS;
  const temperature = params.temperature || TEMPERATURE;

  console.log(`[Groq] Non-streaming chat with model: ${model}${params.tools ? `, tools: ${params.tools.length}` : ''}`);

  try {
    const systemMessage = { role: 'system' as const, content: params.systemInstruction };
    const formattedMessages = formatMessages(params.messages);

    const completion = await groq.chat.completions.create({
      model,
      messages: [systemMessage, ...formattedMessages],
      max_tokens: maxTokens,
      temperature,
      // Response format for JSON mode / structured outputs
      ...(params.responseFormat && { response_format: params.responseFormat }),
      // Native tool calling
      ...(params.tools && { tools: params.tools }),
      ...(params.tools && { tool_choice: params.tool_choice || 'auto' }),
    });

    const message = completion.choices[0]?.message;
    const content = message?.content || '';
    
    // Log usage stats if available
    if (completion.usage) {
      console.log(`[Groq] Usage - Prompt: ${completion.usage.prompt_tokens}, Completion: ${completion.usage.completion_tokens}, Total: ${completion.usage.total_tokens}`);
    }

    // Check for tool_calls in the response
    if (message?.tool_calls && message.tool_calls.length > 0) {
      console.log(`[Groq] Tool calls detected: ${message.tool_calls.length}`);
      return {
        content,
        tool_calls: message.tool_calls.map(tc => ({
          id: tc.id,
          type: 'function' as const,
          function: {
            name: tc.function.name,
            arguments: tc.function.arguments,
          },
        })),
      };
    }

    return { content, tool_calls: undefined };

  } catch (error: unknown) {
    handleGroqError(error, 'non-streaming chat');
  }
};

// ============================================
// Utility: JSON Mode Helper
// ============================================

/**
 * Send a chat request expecting JSON response
 */
export const sendJsonChat = async (
  params: Omit<NonStreamChatParams, 'responseFormat'>
): Promise<Record<string, unknown>> => {
  const result = await sendChat({
    ...params,
    responseFormat: { type: 'json_object' }
  });
  
  try {
    return JSON.parse(result.content);
  } catch {
    console.error('[Groq] Failed to parse JSON response:', result.content);
    throw new GroqAPIError('La respuesta de la IA no es un JSON válido.', undefined, false);
  }
};
