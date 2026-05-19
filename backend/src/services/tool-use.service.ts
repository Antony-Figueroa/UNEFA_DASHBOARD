/**
 * Tool Use Service - Procesamiento de herramientas en tiempo real
 *
 * Flujo:
 * 1. Enviar mensaje + herramientas a Groq
 * 2. Groq devuelve tool_calls si necesita ejecutar herramientas
 * 3. Ejecutar las herramientas
 * 4. Enviar resultados a Groq
 * 5. Generar respuesta final
 */

import { sendChat, ChatMessage } from './groq-ai.service.js';
import { getToolsForProvider, executeTool } from './ai-provider.factory.js';

// ============================================
// Types
// ============================================

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface ToolUseResult {
  toolCalls: ToolCall[];
  results: Array<{
    toolCallId: string;
    toolName: string;
    result: unknown;
    error?: string;
  }>;
}

// ============================================
// Main Function - Procesar mensaje con Tool Use
// ============================================

/**
 * Procesa un mensaje con herramientas - maneja el ciclo completo de Tool Use
 */
export const processMessageWithTools = async (
  messages: ChatMessage[],
  systemInstruction: string
): Promise<{ text: string; toolUse: boolean; toolCount: number }> => {
  // Obtener herramientas disponibles
  const tools = getToolsForProvider();

  if (tools.length === 0) {
    // No hay herramientas, usar chat normal
    const response = await sendChat({
      messages,
      systemInstruction,
      maxTokens: 4096,
      temperature: 0.7,
    });
    return { text: response, toolUse: false, toolCount: 0 };
  }

  console.log('[Tool Use] Processing with', tools.length, 'tools');

  // ============================================
  // Primera Llamada: Obtener tool_calls
  // ============================================

  const response1 = await sendChat({
    messages,
    systemInstruction: systemInstruction + '\n\n### IMPORTANTE: Cuando necesites datos específicos del sistema (estudiantes, carreras, pasantías, etc.), USA las herramientas disponibles. NO inventes datos. Responde en formato JSON si usas herramientas.',
    maxTokens: 4096,
    temperature: 0.3,
  });

  // ============================================
  // Parsear respuesta para detectar tool_calls
  // ============================================

  // Groq no devuelve tool_calls directamente en la respuesta de texto
  //，所以我们 necesitamos verificar si la respuesta contiene una solicitud de herramienta
  // Buscar patrones como "Voy a consultar" o "Necesito obtener"

  const toolCallPatterns = [
    /consultar.*estudiantes/i,
    /consultar.*carreras/i,
    /consultar.*pasant[ií]as/i,
    /obtener.*datos/i,
    /verificar.*informaci[ió]n/i,
    /necesito.*consultar/i,
    /voy a.*consultar/i,
    /obtener.*estad[iú]sticas/i,
    /obtener.*lista/i,
    /buscar.*datos/i,
    /\bget_students\b/i,
    /\bget_careers\b/i,
    /\bget_internships\b/i,
    /\bget_statistics\b/i,
    /\bget_tutors\b/i,
    /\bget_institutions\b/i,
    /\bget_periods\b/i,
  ];

  const needsToolCall = toolCallPatterns.some(pattern => pattern.test(response1));

  // Si la respuesta ya contiene datos de la DB (por RAG), usarla directamente
  if (!needsToolCall && (response1.includes('[') || response1.includes('estudiantes') || response1.includes('carreras'))) {
    console.log('[Tool Use] Response already contains data, using direct response');
    return { text: response1, toolUse: false, toolCount: 0 };
  }

  // Si parece que la IA quiere datos pero no tiene tool_call, forzamos una segunda llamada con las tools
  if (needsToolCall) {
    console.log('[Tool Use] Detected tool need, attempting tool execution');

    // Intentar detectar qué herramienta usar basándose en la pregunta
    const toolToUse = detectToolFromMessage(messages[messages.length - 1]?.content || '');

    if (toolToUse) {
      try {
        console.log('[Tool Use] Executing tool:', toolToUse.name);
        const toolResult = await executeTool(toolToUse.name, toolToUse.args || {});

        // ============================================
        // Segunda Llamada: Enviar resultado de la herramienta
        // ============================================

        const resultMessage: ChatMessage = {
          role: 'user',
          content: `Aquí está el resultado de la herramienta ${toolToUse.name}:\n\n${JSON.stringify(toolResult, null, 2)}\n\nPor favor, presenta esta información de manera clara al usuario.`,
        };

        const response2 = await sendChat({
          messages: [...messages, resultMessage],
          systemInstruction: systemInstruction + '\n\n### USO DE HERRAMIENTAS: El usuario solicitó información y usaste la herramienta ' + toolToUse.name + '. Aquí están los resultados. Preséntalos de manera clara y útil.',
          maxTokens: 4096,
          temperature: 0.5,
        });

        console.log('[Tool Use] Tool executed successfully, got final response');
        return { text: response2, toolUse: true, toolCount: 1 };
      } catch (toolError: any) {
        console.error('[Tool Use] Tool execution error:', toolError.message);
        // Si falla la herramienta, retornar la respuesta original
        return { text: response1, toolUse: false, toolCount: 0 };
      }
    }
  }

  // Si no se detectó necesidad de herramienta, retornar respuesta normal
  return { text: response1, toolUse: false, toolCount: 0 };
};

// ============================================
// Helper - Detectar qué herramienta usar
// ============================================

interface ToolInfo {
  name: string;
  args?: Record<string, unknown>;
}

const detectToolFromMessage = (message: string): ToolInfo | null => {
  const lowerMessage = message.toLowerCase();

  // Estudiantes
  if (/estudiantes?|alumnos?|cu[aá]ntos.*estudiante/i.test(lowerMessage)) {
    return { name: 'get_students', args: { limit: 10 } };
  }

  // Carreras
  if (/carreras?|ingenier[ií]as?|carrera.*actual/i.test(lowerMessage)) {
    return { name: 'get_careers', args: { active_only: true } };
  }

  // Pasantías/Prácticas
  if (/pasant[ií]as?|prácticas?|internships/i.test(lowerMessage)) {
    return { name: 'get_internships', args: { limit: 10 } };
  }

  // Estadísticas
  if (/estad[iú]sticas?|resumen|m[ié]tricas?|diagnóstico|reporte/i.test(lowerMessage)) {
    return { name: 'get_statistics', args: {} };
  }

  // Tutores
  if (/tutores?|asesores?/i.test(lowerMessage)) {
    return { name: 'get_tutors', args: { limit: 10 } };
  }

  // Instituciones/Empresas
  if (/instituciones?|empresas?|empresa.*colaboradora/i.test(lowerMessage)) {
    return { name: 'get_institutions', args: { limit: 10 } };
  }

  // Períodos
  if (/per[ií]odos?|lapsos?|semestre|per[ií]odo.*actual/i.test(lowerMessage)) {
    return { name: 'get_periods', args: { active_only: true } };
  }

  return null;
};

export default {
  processMessageWithTools,
};