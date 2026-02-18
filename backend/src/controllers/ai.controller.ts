import { Request, Response } from 'express';
import { aiService, AIQuerySchema } from '../services/ai.service.js';
import { z } from 'zod';
import { AIAuthRequest } from '../middlewares/ai-auth.middleware.js';
import { streamChat as streamChatGoogle, ChatMessage } from '../services/google-ai.service.js';
import { streamChat as streamChatGroq } from '../services/groq-ai.service.js';
import { detectIntent, fetchContextForIntent } from '../services/intent-detection.service.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import * as chatSessionsService from '../services/chat-sessions.service.js';

const USE_GROQ = !!process.env.GROQ_API_KEY;

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
  console.log('[AI Chat] Request received');
  try {
    const { messages } = req.body as { messages: ChatMessage[] };
    console.log('[AI Chat] Messages count:', messages?.length);

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      console.log('[AI Chat] Invalid messages');
      return res.status(400).json({
        success: false,
        message: 'Se requiere un array de mensajes'
      });
    }

    const lastUserMessage = messages[messages.length - 1];
    console.log('[AI Chat] Last message:', lastUserMessage?.content?.substring(0, 50));
    
    if (lastUserMessage.role !== 'user') {
       console.log('[AI Chat] Last message is not user');
       // Handle edge case or just proceed? 
       // Generally last message should be user.
    }

    console.log('[AI Chat] Detecting intent...');
    const intent = detectIntent(lastUserMessage.content);
    console.log('[AI Chat] Intent detected:', intent?.action, intent?.entity);
    
    let ragContext: string | null = null;

    if (intent.entity && intent.action !== 'none') {
      console.log('[AI Chat] Fetching context for intent...');
      ragContext = await fetchContextForIntent(intent, req.user?.userId || 'ai-chat');
      console.log('[AI Chat] Context fetched, length:', ragContext?.length);
    }

    const systemPrompt = buildSystemPrompt(
      req.user ? { name: req.user.userCi, role: req.user.role } : null,
      ragContext
    );
    console.log('[AI Chat] System prompt built');

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });
    console.log('[AI Chat] Headers sent');

    const aborted = { value: false };
    req.on('close', () => { aborted.value = true; });

    const streamChat = USE_GROQ ? streamChatGroq : streamChatGoogle;
    console.log('[AI Chat] Starting stream with provider:', USE_GROQ ? 'GROQ' : 'Google');
    
    await streamChat(
      {
        messages,
        systemInstruction: systemPrompt,
        maxTokens: 4096,
        temperature: 0.7,
      },
      (chunk: string) => {
        if (!aborted.value) {
          // console.log('[AI Chat] Writing chunk, length:', chunk.length);
          res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
        }
      }
    );
    console.log('[AI Chat] Stream finished');

    if (!aborted.value) {
      res.write(`data: [DONE]\n\n`);
      res.end();
    }

  } catch (error: any) {
    console.error('[AI Chat] Error CRASH:', error);
    console.error('[AI Chat] Stack:', error.stack);
    
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: error.message || 'Error al comunicarse con la IA'
      });
    }

    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
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
