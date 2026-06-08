import { Request, Response } from 'express';
import { aiService, AIQuerySchema } from '../services/ai.service.js';
import { z } from 'zod';
import { AIAuthRequest } from '../middlewares/ai-auth.middleware.js';
import { streamChat as streamChatGoogle, ChatMessage } from '../services/google-ai.service.js';
import { streamChat as streamChatGroq, sendChat as sendChatGroq, GroqAPIError, ChatResult } from '../services/groq-ai.service.js';
import { getCacheStats, clearRagCache } from '../services/rag-cache.service.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import * as chatSessionsService from '../services/chat-sessions.service.js';
import { aiProviderFactory, getToolsForProvider, AITool } from '../services/ai-provider.factory.js';
import { initializeAITools, getAvailableTools, executeAITool } from '../services/ai-tools.service.js';
import { analyzeFile } from '../services/vision.service.js';
import * as chatConfigService from '../services/chat-config.service.js';
import { pipeline as ragPipeline } from '../services/rag.service.js';

// ============================================
// Initialize AI Tools al cargar el módulo
// ============================================
initializeAITools();

// ============================================
// Configuration
// ============================================

// Priority: GROQ_API_KEY > GOOGLE_AI_KEY
// If GROQ_API_KEY is set, use Groq. Otherwise fallback to Google.
const USE_GROQ = !!process.env.GROQ_API_KEY;
const USE_GOOGLE = !!process.env.GOOGLE_AI_KEY;

// Log available providers at startup
console.log('[AI Controller] Providers:', {
  groq: USE_GROQ ? 'enabled' : 'disabled',
  google: USE_GOOGLE ? 'enabled' : 'disabled',
  activeProvider: USE_GROQ ? 'GROQ' : (USE_GOOGLE ? 'GOOGLE' : 'NONE')
});

// ============================================
// System Prompt
// ============================================

const BASE_SYSTEM_PROMPT = `### REGLA DE ORO DE IDIOMA: responde EXCLUSIVAMENTE EN ESPAÑOL. ###
Está TERMINANTEMENTE PROHIBIDO hablar en inglés, usar palabras en inglés o cerrar el mensaje en inglés. 100% ESPAÑOL.

IDENTIDAD: Eres el ASISTENTE DE IA OFICIAL del Dashboard UNEFA (Universidad Nacional Experimental Politécnica de la Fuerza Armada).
Solo respondes cuando el usuario hace una pregunta explícita o solicita información específica.

### CONTEXTO INSTITUCIONAL:
- Sistema: Dashboard UNEFA
- Módulos disponibles: estudiantes, carreras, períodos, tutores, instituciones, pasantías, evaluaciones, documentos, notificaciones, reportes, usuario
- Roles: Administrador Maestro (0), Administrador (1), Asistente (2), Tutor (3), Estudiante (4)
- El sistema gestiona pasantías/prácticas profesionales institucionales

REGLAS CRÍTICAS DE RESPUESTA:
1. IDIOMA: Responde 100% en ESPAÑOL.
2. RESPONDE ÚNICAMENTE A SOLICITUDES EXPLÍCITAS:
   - Si el usuario dice "hola", responde solo "Hola, ¿en qué puedo ayudarte?"
   - Si el usuario dice "gracias", responde solo "De nada" o "Con gusto"
   - NO proporciones información adicional a menos que el usuario lo solicite
3. VERACIDAD: Usa EXCLUSIVAMENTE los datos proporcionados en el contexto cuando el usuario solicite información.
4. FORMATO: Usa TABLAS MARKDOWN cuando el usuario solicite listas de datos o información estructurada.
5. PRECISIÓN: Si los datos dicen "14 estudiantes activos", responde "Hay 14 estudiantes activos". No digas que no tienes acceso.
6. Si no hay datos de contexto para responder una pregunta específica, indica que la información no está disponible actualmente.

### USO DE LA BASE DE CONOCIMIENTO:
- Tienes acceso a una base de conocimiento con información institucional verificada (reglamentos, procesos, FAQs)
- Cuando te pregunten sobre CÓMO hacer algo en el sistema, busca en la sección INFORMACIÓN DE LA BASE DE CONOCIMIENTO
- Si encuentras una guía relevante, preséntala paso a paso
- Si el contexto no contiene la respuesta, indica que no tienes esa información disponible
- NO inventes datos institucionales, números de artículos, fechas, ni procedimientos

### HERRAMIENTAS DISPONIBLES:
Puedes usar las herramientas del sistema para consultar datos en tiempo real (estudiantes, carreras, pasantías, etc.).
Cuando necesites información específica del sistema, USA las herramientas disponibles. NO inventes datos.

### PROHIBIDO:
- Dar resúmenes de datos sin que el usuario los solicite
- Agregar "¿Te gustaría saber más sobre...?" cuando no se solicita
- Inventar datos que no estén en el contexto proporcionado
- Responder con más de lo mínimo necesario para saludos o agradecimientos`;

/**
 * Construye el system prompt completo con contexto del usuario, RAG y herramientas.
 */
const buildSystemPrompt = (
  userContext: any,
  ragContext: string | null,
  tools: AITool[]
): string => {
  const parts: string[] = [BASE_SYSTEM_PROMPT];

  // Contexto del usuario
  if (userContext) {
    const roleNames: Record<number, string> = {
      0: 'Administrador Maestro',
      1: 'Administrador',
      2: 'Asistente',
      3: 'Tutor',
      4: 'Estudiante',
    };
    parts.push(`\n### CONTEXTO DEL USUARIO:`);
    parts.push(`- Nombre: ${userContext.name || 'No identificado'} ${userContext.surname || ''}`);
    parts.push(`- Rol: ${roleNames[userContext.role] || `Rol ${userContext.role}`}`);
    parts.push(`- Fecha actual: ${new Date().toLocaleDateString('es-VE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`);
  }

  // Contexto RAG (KB o DB)
  if (ragContext) {
    parts.push(ragContext);
    parts.push(`\nUSA ESTOS DATOS para responder la pregunta del usuario. Son datos REALES y ACTUALIZADOS.`);
  }

  // Herramientas disponibles
  if (tools.length > 0) {
    const toolsDesc = tools
      .map(t => `- ${t.function.name}: ${t.function.description}`)
      .join('\n');
    parts.push(`\n### HERRAMIENTAS:\n${toolsDesc}`);
  }

  return parts.join('\n');
};

// ============================================
// Sliding Window
// ============================================

/**
 * Limita el historial a los últimos N mensajes para controlar tokens.
 * Si hay más de N, resume los primeros en un mensaje system.
 */
function trimContext(messages: ChatMessage[], maxMessages = 20): ChatMessage[] {
  if (messages.length <= maxMessages) return messages;

  // Separar: los primeros para resumir, los últimos para mantener
  const keepCount = maxMessages - 1; // 1 slot para el resumen
  const toSummarize = messages.slice(0, messages.length - keepCount);
  const keep = messages.slice(-keepCount);

  // Construir resumen simple
  const summaryLines = toSummarize
    .filter(m => m.role === 'user' || m.role === 'assistant')
    .slice(-8) // últimos 8 mensajes interesantes
    .map(m => {
      const preview = m.content.substring(0, 120).replace(/\n/g, ' ');
      return `${m.role === 'user' ? 'Usuario' : 'Asistente'}: ${preview}`;
    });

  const summary: ChatMessage = {
    role: 'system',
    content: `[Resumen de la conversación anterior (${toSummarize.length} mensajes):\n${summaryLines.join('\n')}\n]`,
  };

  return [summary, ...keep];
}

/**
 * Ejecuta el ciclo de tool calling nativo de Groq.
 */
async function executeNativeToolCalling(
  messages: ChatMessage[],
  systemInstruction: string,
  tools: AITool[]
): Promise<{ text: string; toolCount: number }> {
  console.log('[AI Controller] Native tool calling cycle started');

  // Primera llamada: enviar mensaje + tools a Groq
  const result = await sendChatGroq({
    messages,
    systemInstruction,
    maxTokens: 4096,
    temperature: 0.7,
    tools,
    tool_choice: 'auto',
  });

  // Si Groq no usó herramientas, retornar respuesta directa
  if (!result.tool_calls || result.tool_calls.length === 0) {
    console.log('[AI Controller] No tool calls, using direct response');
    return { text: result.content, toolCount: 0 };
  }

  console.log(`[AI Controller] Groq requested ${result.tool_calls.length} tool calls`);

  // Ejecutar cada tool
  const toolResults: Array<{
    role: 'tool';
    tool_call_id: string;
    content: string;
  }> = [];

  for (const toolCall of result.tool_calls) {
    try {
      const args = JSON.parse(toolCall.function.arguments);
      console.log(`[AI Controller] Executing tool: ${toolCall.function.name}`, args);

      const toolResult = await executeAITool(toolCall.function.name, args);

      toolResults.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: JSON.stringify(toolResult),
      });
    } catch (err: any) {
      console.error(`[AI Controller] Tool execution error: ${toolCall.function.name}`, err.message);
      toolResults.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: JSON.stringify({ success: false, error: err.message }),
      });
    }
  }

  // Segunda llamada: enviar resultados de las tools a Groq
  console.log('[AI Controller] Sending tool results back to Groq');
  const finalResult = await sendChatGroq({
    messages: [
      ...messages,
      { role: 'assistant', content: result.content || null, tool_calls: result.tool_calls } as any,
      ...toolResults,
    ].filter(Boolean),
    systemInstruction: systemInstruction + '\n\nLos resultados de las herramientas están arriba. Presenta esta información de manera clara al usuario.',
    maxTokens: 4096,
    temperature: 0.5,
    tools,
    tool_choice: 'none', // No permitir más tool calls en la segunda vuelta
  });

  return { text: finalResult.content, toolCount: result.tool_calls.length };
}

export const executeAIQuery = async (req: AIAuthRequest, res: Response) => {
  try {
    const query = AIQuerySchema.parse(req.body);
    const requesterId = req.aiAgent?.id || 'unknown';
    const result = await aiService.executeQuery(query, requesterId);

    res.json({
      success: true,
      data: result.data,
      meta: result.meta
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query format',
        errors: error.flatten().fieldErrors
      });
    }

    if (error instanceof Error) {
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Unknown error occurred'
    });
  }
};

export const chatWithAI = async (req: AuthRequest, res: Response) => {
  const requestId = `req-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  console.log(`[AI Chat:${requestId}] Request received from user: ${req.user?.userId || 'unknown'}`);

  try {
    const { messages } = req.body as { messages: ChatMessage[] };
    console.log(`[AI Chat:${requestId}] Messages count: ${messages?.length}`);

    // Validate messages
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      console.log(`[AI Chat:${requestId}] Invalid messages - empty or not array`);
      return res.status(400).json({
        success: false,
        message: 'Se requiere un array de mensajes'
      });
    }

    const lastUserMessage = messages[messages.length - 1];
    console.log(`[AI Chat:${requestId}] Last message preview:`, lastUserMessage?.content?.substring(0, 50) || '(empty)');

    // RAG Pipeline — busca en KB primero, fallback a DB
    const ragCtx = await ragPipeline(lastUserMessage.content, req.user?.role);
    console.log(`[AI Chat:${requestId}] RAG source: ${ragCtx.source}, kbChunks: ${ragCtx.kbChunksUsed}`);

    // Sliding Window
    const trimmedMessages = trimContext(messages, 20);
    console.log(`[AI Chat:${requestId}] Messages trimmed: ${messages.length} → ${trimmedMessages.length}`);

    // Build system prompt (sin tools para streaming)
    const tools = USE_GROQ ? getAvailableTools() : [];
    const systemPrompt = buildSystemPrompt(
      req.user ? { name: req.user.userCi, surname: '', role: req.user.role } : null,
      ragCtx.context,
      []
    );
    console.log(`[AI Chat:${requestId}] System prompt built, length: ${systemPrompt.length} chars`);

    // Set up SSE headers
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    console.log(`[AI Chat:${requestId}] SSE headers sent`);

    // Handle client disconnect
    const aborted = { value: false };
    req.on('close', () => {
      aborted.value = true;
      console.log(`[AI Chat:${requestId}] Client disconnected`);
    });

    // Determine which provider to use with better fallback logic
    let streamChatFn;
    let providerName: string;

    if (USE_GROQ) {
      streamChatFn = streamChatGroq;
      providerName = 'GROQ';
      console.log(`[AI Chat:${requestId}] Using GROQ as primary provider`);
    } else if (USE_GOOGLE) {
      streamChatFn = streamChatGoogle;
      providerName = 'GOOGLE';
      console.log(`[AI Chat:${requestId}] Using Google as primary provider`);
    } else {
      // No providers available
      console.error(`[AI Chat:${requestId}] No AI providers configured!`);
      res.write(`data: ${JSON.stringify({ error: 'No hay proveedores de IA configurados. Contacta al administrador.' })}\n\n`);
      res.end();
      return;
    }

    // Start streaming
    console.log(`[AI Chat:${requestId}] Starting stream with ${providerName}...`);
    const startTime = Date.now();

    try {
      await streamChatFn(
        {
          messages: trimmedMessages,
          systemInstruction: systemPrompt,
          maxTokens: 4096,
          temperature: 0.7,
        },
        (chunk: string) => {
          if (!aborted.value) {
            res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
          }
        }
      );
      
      const elapsed = Date.now() - startTime;
      console.log(`[AI Chat:${requestId}] Stream completed in ${elapsed}ms`);

    } catch (streamError: any) {
      console.error(`[AI Chat:${requestId}] Stream error:`, streamError.message);
      
      // If Groq failed and Google is available, try fallback
      if (USE_GROQ && USE_GOOGLE && streamError instanceof GroqAPIError && streamError.isRetryable) {
        console.log(`[AI Chat:${requestId}] GROQ failed (retryable), trying GOOGLE as fallback...`);
        
        try {
          await streamChatGoogle(
            {
              messages: trimmedMessages,
              systemInstruction: systemPrompt,
              maxTokens: 4096,
              temperature: 0.7,
            },
            (chunk: string) => {
              if (!aborted.value) {
                res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
              }
            }
          );
          console.log(`[AI Chat:${requestId}] Fallback to GOOGLE succeeded`);
        } catch (fallbackError: any) {
          console.error(`[AI Chat:${requestId}] Fallback also failed, sending friendly error.`);
          if (!aborted.value) {
            res.write(`data: ${JSON.stringify({ error: 'El servicio de IA está con alta demanda. Esperá unos segundos y reintentá.' })}\n\n`);
            res.write(`data: [DONE]\n\n`);
            res.end();
          }
          return;
        }
      } else {
        throw streamError;
      }
    }

    if (!aborted.value) {
      res.write(`data: [DONE]\n\n`);
      res.end();
      console.log(`[AI Chat:${requestId}] Response completed successfully`);
    }

  } catch (error: any) {
    const errorMessage = error.message || 'Error al comunicarse con la IA';
    console.error(`[AI Chat:${requestId}] Error:`, errorMessage);
    console.error(`[AI Chat:${requestId}] Stack:`, error.stack);
    
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: errorMessage
      });
    }

    // If headers already sent (SSE started), send error as SSE message
    res.write(`data: ${JSON.stringify({ error: errorMessage })}\n\n`);
    res.end();
  }
};

export const getSessions = async (req: AuthRequest, res: Response) => {
  try {
    const sessions = await chatSessionsService.getSessionsByUser(req.user!.userId);
    res.json({ success: true, data: sessions });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSession = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const session = await chatSessionsService.getSessionById(id, req.user!.userId);
    
    if (!session) {
      res.status(404).json({ success: false, message: 'Sesión no encontrada' });
      return;
    }
    
    res.json({ success: true, data: session });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createSession = async (req: AuthRequest, res: Response) => {
  try {
    const { title } = req.body;
    const session = await chatSessionsService.createSession(req.user!.userId, title);
    res.status(201).json({ success: true, data: session });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSession = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { title, messages } = req.body;
    const session = await chatSessionsService.updateSession(id, req.user!.userId, { title, messages });
    res.json({ success: true, data: session });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteSession = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await chatSessionsService.deleteSession(id, req.user!.userId);
    res.json({ success: true, message: 'Sesión eliminada' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================
// ENDPOINT SIN STREAMING - Con Tool Use y RAG
// ============================================
export const chatWithAINoStream = async (req: AuthRequest, res: Response) => {
  const requestId = `req-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  console.log(`[AI Chat NoStream:${requestId}] Request received from user: ${req.user?.userId || 'unknown'}`);

  try {
    const { messages } = req.body as { messages: ChatMessage[] };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Se requiere un array de mensajes'
      });
    }

    const lastUserMessage = messages[messages.length - 1];
    console.log(`[AI Chat NoStream:${requestId}] Last message:`, lastUserMessage?.content?.substring(0, 80));

    // ============================================
    // 1. RAG Pipeline — busca en KB primero, fallback a DB
    // ============================================
    const ragCtx = await ragPipeline(lastUserMessage.content, req.user?.role);
    console.log(`[AI Chat NoStream:${requestId}] RAG source: ${ragCtx.source}, kbChunks: ${ragCtx.kbChunksUsed}`);

    // ============================================
    // 2. Sliding Window — limitar historial
    // ============================================
    const trimmedMessages = trimContext(messages, 20);
    console.log(`[AI Chat NoStream:${requestId}] Messages trimmed: ${messages.length} → ${trimmedMessages.length}`);

    // ============================================
    // 3. Tools — disponibles solo con Groq
    // ============================================
    const availableTools = USE_GROQ ? getAvailableTools() : [];
    console.log(`[AI Chat NoStream:${requestId}] Tools available: ${availableTools.length}`);

    // ============================================
    // 4. Build System Prompt con contexto RAG + herramientas
    // ============================================
    const systemPrompt = buildSystemPrompt(
      req.user ? { name: req.user.userCi, surname: '', role: req.user.role } : null,
      ragCtx.context,
      availableTools
    );

    // ============================================
    // 5. Ejecutar con native tool calling (si es Groq) o simple (Google)
    // ============================================
    const providerName = USE_GROQ ? 'GROQ' : 'GOOGLE';
    let responseText: string;
    let toolCount = 0;

    try {
      if (USE_GROQ) {
        // Native tool calling con Groq
        const result = await executeNativeToolCalling(
          trimmedMessages,
          systemPrompt,
          availableTools
        );
        responseText = result.text;
        toolCount = result.toolCount;
      } else {
        // Google no soporta tools, chat simple
        const googleChat = (await import('../services/google-ai.service.js')).sendChat;
        responseText = await googleChat({
          messages: trimmedMessages,
          systemInstruction: systemPrompt,
          maxTokens: 4096,
          temperature: 0.7,
        });
      }
    } catch (primaryError: any) {
      // Fallback a Google si Groq falla por rate limit
      const isRateLimit = primaryError?.status === 429 ||
        primaryError?.message?.includes('Rate limit') ||
        primaryError?.message?.includes('rate_limit');
      const shouldFallback = USE_GROQ && USE_GOOGLE && isRateLimit;

      if (shouldFallback) {
        console.log(`[AI Chat NoStream:${requestId}] Groq rate limited, trying GOOGLE fallback...`);
        try {
          const googleChat = (await import('../services/google-ai.service.js')).sendChat;
          responseText = await googleChat({
            messages: trimmedMessages,
            systemInstruction: systemPrompt,
            maxTokens: 4096,
            temperature: 0.7,
          });
          console.log(`[AI Chat NoStream:${requestId}] Fallback to GOOGLE successful`);
        } catch (fallbackError: any) {
          console.error(`[AI Chat NoStream:${requestId}] Fallback also failed. Returning friendly message.`);
          // Fallback también falló — devolver mensaje amigable en vez de 500
          return res.status(429).json({
            success: false,
            message: 'El servicio de IA está experimentando alta demanda. Por favor, esperá unos segundos y reintentá.',
            retryAfter: 5,
          });
        }
      } else {
        throw primaryError;
      }
    }

    console.log(`[AI Chat NoStream:${requestId}] Response length: ${responseText.length} chars, tools used: ${toolCount}`);

    // ============================================
    // 6. Response
    // ============================================
    res.json({
      success: true,
      text: responseText,
      meta: {
        provider: providerName,
        source: ragCtx.source,
        kbChunksUsed: ragCtx.kbChunksUsed,
        toolsUsed: toolCount > 0,
        toolCount,
      },
    });

  } catch (error: any) {
    console.error(`[AI Chat NoStream:${requestId}] Error:`, error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al comunicarse con la IA'
    });
  }
};

// ============================================
// ENDPOINT DE MÉTRICAS Y CONFIGURACIÓN
// ============================================
export const getAIConfig = async (req: AuthRequest, res: Response) => {
  try {
    // Obtener estado de los providers
    const providerStatus = aiProviderFactory.getStatus();

    // Obtener estadísticas del caché
    const cacheStats = getCacheStats();

    // Obtener herramientas disponibles
    const tools = getAvailableTools();

    res.json({
      success: true,
      data: {
        providers: providerStatus,
        cache: {
          enabled: true,
          stats: cacheStats,
        },
        tools: {
          count: tools.length,
          list: tools.map(t => ({
            name: t.function.name,
            description: t.function.description,
          })),
        },
        features: {
          streaming: true,
          noStream: true,
          toolUse: USE_GROQ, // Native Groq tool calling
          nativeToolCalling: USE_GROQ,
          ragSemantic: true,  // KB + pgvector
          knowledgeBase: true,
          slidingWindow: true,
          structuredOutputs: true,
        },
        model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// ENDPOINT PARA LIMPIAR CACHÉ
// ============================================
export const clearAICache = async (req: AuthRequest, res: Response) => {
  try {
    clearRagCache();
    res.json({
      success: true,
      message: 'Caché de RAG limpiado correctamente',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================
// ENDPOINT PARA ANALIZAR ARCHIVOS (Vision)
// ============================================
export const analyzeFileUpload = async (req: AuthRequest, res: Response) => {
  const requestId = `req-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  console.log(`[AI AnalyzeFile:${requestId}] Request received from user: ${req.user?.userId || 'unknown'}`);

  try {
    // Verificar que hay archivo en la request
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se recibió ningún archivo',
      });
    }

    const file = req.file;
    console.log(`[AI AnalyzeFile:${requestId}] File: ${file.originalname}, ${file.mimetype}, ${file.size} bytes`);

    // Verificar tamaño máximo (5MB)
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return res.status(400).json({
        success: false,
        message: 'El archivo es demasiado grande. Máximo 5MB.',
      });
    }

    // Verificar tipo de archivo permitido
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de archivo no permitido. Solo imágenes (JPG, PNG, GIF, WebP) y PDF.',
      });
    }

    // Analizar el archivo
    const prompt = req.body.prompt || 'Describe esta imagen o documento detalladamente. ¿Qué información contiene?';
    const result = await analyzeFile(file.buffer, file.mimetype, prompt);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.error,
      });
    }

    console.log(`[AI AnalyzeFile:${requestId}] Analysis completed, length: ${result.analysis?.length || 0} chars`);

    res.json({
      success: true,
      analysis: result.analysis,
      file: {
        name: file.originalname,
        type: file.mimetype,
        size: file.size,
      },
    });

  } catch (error: any) {
    console.error(`[AI AnalyzeFile:${requestId}] Error:`, error.message);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al analizar el archivo',
    });
  }
};

// ============================================
// Chat Config - Persistencia en DB
// ============================================

export const getChatConfig = async (req: AuthRequest, res: Response) => {
  try {
    const config = await chatConfigService.getChatConfigWithDefaults(req.user!.userId);
    res.json({ success: true, data: config });
  } catch (error: any) {
    console.error('[getChatConfig] Error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const saveChatConfig = async (req: AuthRequest, res: Response) => {
  try {
    const { persona, quickActions, showNotifications } = req.body;
    
    const config = await chatConfigService.saveChatConfig(req.user!.userId, {
      persona,
      quickActions,
      showNotifications,
    });
    
    res.json({ success: true, data: config });
  } catch (error: any) {
    console.error('[saveChatConfig] Error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};
