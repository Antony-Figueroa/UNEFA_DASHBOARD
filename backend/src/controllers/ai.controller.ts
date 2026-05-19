import { Request, Response } from 'express';
import { aiService, AIQuerySchema } from '../services/ai.service.js';
import { z } from 'zod';
import { AIAuthRequest } from '../middlewares/ai-auth.middleware.js';
import { streamChat as streamChatGoogle, ChatMessage } from '../services/google-ai.service.js';
import { streamChat as streamChatGroq, sendChat as sendChatGroq, GroqAPIError } from '../services/groq-ai.service.js';
import { detectIntent, fetchContextForIntent } from '../services/intent-detection.service.js';
import { fetchContextWithCache, getCacheStats, clearRagCache } from '../services/rag-cache.service.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import * as chatSessionsService from '../services/chat-sessions.service.js';
import { aiProviderFactory, getToolsForProvider } from '../services/ai-provider.factory.js';
import { initializeAITools, getAvailableTools, executeAITool } from '../services/ai-tools.service.js';
import { processMessageWithTools } from '../services/tool-use.service.js';

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

const BASE_SYSTEM_PROMPT = `### REGLA DE ORO DE IDIOMA: responde EXCLUSIVAMENTE EN ESPAÑOL. ###
Está TERMINANTEMENTE PROHIBIDO hablar en inglés, usar palabras en inglés o cerrar el mensaje en inglés. 100% ESPAÑOL.

IDENTIDAD: Eres el ASISTENTE DE IA OFICIAL del Dashboard UNEFA (Universidad Nacional Experimental Politécnica de la Fuerza Armada).
Solo respondes cuando el usuario hace una pregunta explícita o solicita información específica.

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

### PROHIBIDO:
- Dar resúmenes de datos sin que el usuario los solicite
- Agregar "¿Te gustaría saber más sobre...?" cuando no se solicita
- Inventar datos que no estén en el contexto proporcionado
- Responder con más de lo mínimo necesario para saludos o agradecimientos`;

const buildSystemPrompt = (userContext: any, ragContext: string | null): string => {
  const parts: string[] = [BASE_SYSTEM_PROMPT];

  if (userContext) {
    parts.push(`\nCONTEXTO DEL USUARIO:`);
    parts.push(`- Nombre: ${userContext.name || 'No identificado'} ${userContext.surname || ''}`);
    parts.push(`- Rol: ${userContext.role === 0 ? 'Administrador Maestro' : userContext.role === 1 ? 'Administrador' : 'Asistente'}`);
    parts.push(`- Fecha actual: ${new Date().toLocaleDateString('es-VE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`);
  }

  if (ragContext) {
    parts.push(`\nDATOS DEL SISTEMA (obtenidos en tiempo real de la base de datos):`);
    parts.push(ragContext);
    parts.push(`\nUSA ESTOS DATOS para responder la pregunta del usuario. Son datos REALES y ACTUALIZADOS.`);
  }

  return parts.join('\n');
};

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

    // Detect intent and fetch RAG context
    console.log(`[AI Chat:${requestId}] Detecting intent...`);
    const intent = detectIntent(lastUserMessage.content);
    console.log(`[AI Chat:${requestId}] Intent: action=${intent?.action}, entity=${intent?.entity}`);
    
    let ragContext: string | null = null;

    if (intent.entity && intent.action !== 'none') {
      console.log(`[AI Chat:${requestId}] Fetching RAG context for entity: ${intent.entity}`);
      try {
        ragContext = await fetchContextForIntent(intent, req.user?.userId || 'ai-chat');
        console.log(`[AI Chat:${requestId}] RAG context fetched, length: ${ragContext?.length || 0} chars`);
      } catch (ragError: any) {
        console.error(`[AI Chat:${requestId}] RAG Error:`, ragError.message);
        ragContext = '[NOTA: No se pudo obtener contexto de la base de datos. Responde basado en tu conocimiento.]';
      }
    }

    // Build system prompt
    const systemPrompt = buildSystemPrompt(
      req.user ? { name: req.user.userCi, role: req.user.role } : null,
      ragContext
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
          messages,
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
              messages,
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
          console.error(`[AI Chat:${requestId}] Fallback also failed:`, fallbackError.message);
          throw fallbackError;
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
    console.log(`[AI Chat NoStream:${requestId}] Last message:`, lastUserMessage?.content?.substring(0, 50));

    // Detect intent y verificar si necesita herramientas
    const intent = detectIntent(lastUserMessage.content);
    console.log(`[AI Chat NoStream:${requestId}] Intent:`, intent?.action, intent?.entity);

    // Obtener herramientas disponibles (solo si es Groq)
    const availableTools = USE_GROQ ? getAvailableTools() : [];
    const useTools = availableTools.length > 0 && intent.entity && intent.action !== 'none';

    if (useTools) {
      console.log(`[AI Chat NoStream:${requestId}] Using Tool Use with ${availableTools.length} tools`);
    }

    // Obtener contexto RAG (con caché)
    let ragContext: string | null = null;

    if (intent.entity && intent.action !== 'none') {
      try {
        // Usar caché para evitar consultas repetitivas
        ragContext = await fetchContextWithCache(intent, req.user?.userId || 'ai-chat');
        console.log(`[AI Chat NoStream:${requestId}] RAG context: ${ragContext ? 'found' : 'not found'}`);
      } catch (ragError: any) {
        console.error(`[AI Chat NoStream:${requestId}] RAG Error:`, ragError.message);
        ragContext = null; // Si falla, la IA usará las herramientas
      }
    }

    // Log de estadísticas del caché (para debugging)
    const cacheStats = getCacheStats();
    console.log(`[AI Chat NoStream:${requestId}] Cache stats:`, cacheStats);

    // Construir prompt del sistema
    const systemPrompt = buildSystemPrompt(
      req.user ? { name: req.user.userCi, role: req.user.role } : null,
      ragContext
    );

    // Agregar instrucciones de herramientas al prompt si corresponde
    let enhancedSystemPrompt = systemPrompt;
    if (useTools) {
      const toolsDescription = availableTools
        .map(t => `- ${t.function.name}: ${t.function.description}`)
        .join('\n');

      enhancedSystemPrompt += `\n\n### HERRAMIENTAS DISPONIBLES:\nPuedes usar las siguientes herramientas para obtener datos de la base de datos:\n${toolsDescription}\n\nCuando necesites información específica del sistema, usa estas herramientas en lugar de pedirle al usuario que la proporcione.`;
    }

    const providerName = USE_GROQ ? 'GROQ' : 'GOOGLE';
    console.log(`[AI Chat NoStream:${requestId}] Using ${providerName}, tools: ${useTools}`);

    // Obtener respuesta - usar Tool Use completo si hay intent detectado
    let responseText: string;
    let toolUseDetected = false;
    let toolCount = 0;

    if (USE_GROQ && intent.entity && intent.action !== 'none') {
      // Usar procesamiento completo de Tool Use
      console.log(`[AI Chat NoStream:${requestId}] Using full Tool Use processing`);
      const toolResult = await processMessageWithTools(messages, enhancedSystemPrompt);
      responseText = toolResult.text;
      toolUseDetected = toolResult.toolUse;
      toolCount = toolResult.toolCount;
    } else {
      // Usar chat normal sin Tool Use
      responseText = await (USE_GROQ ? sendChatGroq : (await import('../services/google-ai.service.js')).sendChat)({
        messages,
        systemInstruction: enhancedSystemPrompt,
        maxTokens: 4096,
        temperature: 0.7,
      });
    }

    console.log(`[AI Chat NoStream:${requestId}] Response length: ${responseText.length} chars, toolUse: ${toolUseDetected}, toolCount: ${toolCount}`);

    // Return complete response as JSON
    res.json({
      success: true,
      text: responseText,
      meta: {
        provider: providerName,
        usedTools: toolUseDetected,
        toolCount,
        intentDetected: intent.action !== 'none' ? intent : null,
      }
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
          streaming: false, // Deshabilitado por problemas de compatibility
          noStream: true,
          toolUse: USE_GROQ,
          structuredOutputs: true,
          ragCaching: true,
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
