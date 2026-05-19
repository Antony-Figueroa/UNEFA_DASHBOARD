/**
 * Structured Outputs Service - Sistema de respuestas estructuradas
 *
 * Permite que la IA responda con formatos controlados usando JSON Schema
 * Útil para: tablas, acciones, formularios, etc.
 */

import { sendChat } from './groq-ai.service.js';

// ============================================
// Types - Esquemas de respuesta estructurada
// ============================================

/**
 * Schema para respuestas que incluyen datos tabulares
 */
export const TableResponseSchema = {
  type: 'object' as const,
  properties: {
    response_type: { type: 'string', enum: ['table', 'text', 'action', 'error'] },
    title: { type: 'string' },
    description: { type: 'string' },
    columns: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          key: { type: 'string' },
          label: { type: 'string' },
          align: { type: 'string', enum: ['left', 'center', 'right'] },
        },
        required: ['key', 'label'],
      },
    },
    rows: { type: 'array', items: { type: 'object' } },
    total: { type: 'number' },
    message: { type: 'string' },
  },
  required: ['response_type', 'title'],
};

/**
 * Schema para respuestas de acción (crear, actualizar, eliminar)
 */
export const ActionResponseSchema = {
  type: 'object' as const,
  properties: {
    response_type: { type: 'string', enum: ['action'] },
    action: { type: 'string', enum: ['create', 'update', 'delete', 'navigate', 'show'] },
    entity: { type: 'string' },
    success: { type: 'boolean' },
    message: { type: 'string' },
    data: { type: 'object' },
    redirect: { type: 'string' },
  },
  required: ['response_type', 'action', 'success'],
};

/**
 * Schema para respuestas de error
 */
export const ErrorResponseSchema = {
  type: 'object' as const,
  properties: {
    response_type: { type: 'string', enum: ['error'] },
    error: { type: 'string' },
    message: { type: 'string' },
    suggestion: { type: 'string' },
  },
  required: ['response_type', 'error', 'message'],
};

// ============================================
// Base System Prompt para Structured Outputs
// ============================================

const BASE_STRUCTURED_PROMPT = `### IMPORTANTE: Debes responder en formato JSON válido según el esquema indicado ###

Cuando el usuario solicite información tabular (listas, estadísticas, resúmenes):
Responde usando el esquema de TABLA:
{
  "response_type": "table",
  "title": "Título de la tabla",
  "description": "Descripción opcional",
  "columns": [
    {"key": "campo1", "label": "Etiqueta 1", "align": "left"},
    {"key": "campo2", "label": "Etiqueta 2", "align": "right"}
  ],
  "rows": [
    {"campo1": "valor1", "campo2": "valor2"}
  ],
  "total": 10,
  "message": "Mensaje adicional opcional"
}

Cuando el usuario realice una acción (crear, modificar, eliminar):
Responde usando el esquema de ACCIÓN:
{
  "response_type": "action",
  "action": "create|update|delete|navigate|show",
  "entity": "nombre de la entidad",
  "success": true|false,
  "message": "Mensaje del resultado",
  "data": { ...datos opcional },
  "redirect": "ruta opcional"
}

Cuando haya un error:
Responde usando el esquema de ERROR:
{
  "response_type": "error",
  "error": "Tipo de error",
  "message": "Mensaje de error",
  "suggestion": "Sugerencia para el usuario"
}

Para preguntas generales o conversaciones:
Responde en texto plano (no es necesario JSON).

### IDIOMA: 100% ESPAÑOL - PROHIBIDO Usar inglés ###`;

// ============================================
// Functions
// ============================================

/**
 * Envia una consulta que espera respuesta estructurada (tipo tabla)
 */
export const sendStructuredTableQuery = async (
  userMessage: string,
  systemContext: string,
  columns: Array<{ key: string; label: string }>
): Promise<Record<string, unknown>> => {
  const prompt = `${BASE_STRUCTURED_PROMPT}

Contexto del sistema:
${systemContext}

El usuario pregunta: "${userMessage}"

Genera una respuesta en formato JSON con los datos solicitados en formato de tabla.`;

  const response = await sendChat({
    messages: [{ role: 'user', content: userMessage }],
    systemInstruction: prompt,
    maxTokens: 4096,
    temperature: 0.3, // Baja temperatura para respuestas más consistentes
    responseFormat: { type: 'json_object' },
  });

  try {
    const parsed = JSON.parse(response);

    // Validar que tenga el formato correcto
    if (parsed.response_type === 'table') {
      return parsed;
    }

    // Si no es tabla, envolver en formato texto
    return {
      response_type: 'text',
      message: response,
    };
  } catch {
    // Si no es JSON válido, retornar como texto
    return {
      response_type: 'text',
      message: response,
    };
  }
};

/**
 * Envia una consulta de acción (crear, actualizar, etc.)
 */
export const sendActionQuery = async (
  action: 'create' | 'update' | 'delete' | 'navigate' | 'show',
  entity: string,
  details: string,
  systemContext: string
): Promise<Record<string, unknown>> => {
  const prompt = `${BASE_STRUCTURED_PROMPT}

Contexto del sistema:
${systemContext}

El usuario quiere realizar una acción: ${action} sobre ${entity}
Detalles: ${details}

Genera una respuesta en formato JSON con el resultado de la acción.`;

  const response = await sendChat({
    messages: [{ role: 'user', content: `Por favor, ejecuta la acción: ${action} ${entity}` }],
    systemInstruction: prompt,
    maxTokens: 2048,
    temperature: 0.2, // Temperatura muy baja para acciones
    responseFormat: { type: 'json_object' },
  });

  try {
    return JSON.parse(response);
  } catch {
    return {
      response_type: 'error',
      error: 'parsing_error',
      message: 'No se pudo procesar la respuesta',
      suggestion: 'Intenta de nuevo con una solicitud más específica',
    };
  }
};

/**
 * Detecta si una pregunta requiere respuesta estructurada
 */
export const requiresStructuredOutput = (message: string): boolean => {
  const lowerMessage = message.toLowerCase();

  const tableKeywords = [
    /mostrar.*tabla/i,
    /lista de/i,
    /cuántos/i,
    /total de/i,
    /estadísticas/i,
    /resumen de/i,
    /reporte/i,
    /listado/i,
    /informe/i,
  ];

  const actionKeywords = [
    /crear/i,
    /registrar/i,
    /agregar/i,
    /actualizar/i,
    /modificar/i,
    /eliminar/i,
    /borrar/i,
    /ir a/i,
    /navegar/i,
    /abrir/i,
  ];

  return (
    tableKeywords.some(k => k.test(lowerMessage)) ||
    actionKeywords.some(k => k.test(lowerMessage))
  );
};

export default {
  sendStructuredTableQuery,
  sendActionQuery,
  requiresStructuredOutput,
  TableResponseSchema,
  ActionResponseSchema,
  ErrorResponseSchema,
};