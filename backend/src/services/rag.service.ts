/**
 * RAG Service — Pipeline de Retrieval Augmented Generation
 *
 * Flujo:
 * 1. Generar embedding del mensaje del usuario
 * 2. Buscar en KB por similitud semántica
 * 3. Si hay resultados relevantes (> threshold): inyectar como contexto
 * 4. Si NO hay resultados: fallback a intent detection + DB query (comportamiento actual)
 * 5. Retornar contexto formateado + metadata
 */

import * as kbService from './knowledge-base.service.js';
import { detectIntent, fetchContextForIntent } from './intent-detection.service.js';
import { fetchContextWithCache } from './rag-cache.service.js';
import type { DetectedIntent } from './intent-detection.service.js';

// ============================================
// Types
// ============================================

export interface RAGContext {
  /** Contexto formateado para inyectar en system prompt (o null) */
  context: string | null;
  /** Fuente del contexto */
  source: 'kb' | 'db' | 'none';
  /** Cantidad de chunks de KB inyectados */
  kbChunksUsed: number;
  /** Intent detectado (solo para debug) */
  intent?: DetectedIntent | null;
}

// ============================================
// Main Pipeline
// ============================================

/**
 * Pipeline RAG completo.
 *
 * 1. Primero busca en KB por similitud semántica
 * 2. Si no encuentra nada relevante, fallback a intent detection + DB
 * 3. Retorna el contexto formateado
 */
export async function pipeline(
  message: string,
  userRole?: number
): Promise<RAGContext> {
  const userRoles = userRole !== undefined ? [userRole] : undefined;

  // Paso 1: Buscar en KB
  const kbResults = await kbService.searchSemantic({
    query: message,
    userRoles,
    limit: 5,
    threshold: 0.7,
  });

  if (kbResults.length > 0) {
    const context = kbService.formatKBContext(kbResults);
    console.log(`[RAG] KB match: ${kbResults.length} chunks, top similarity: ${(kbResults[0].similarity * 100).toFixed(1)}%`);

    return {
      context,
      source: 'kb',
      kbChunksUsed: kbResults.length,
      intent: null,
    };
  }

  // Paso 2: Fallback a intent detection + DB
  console.log('[RAG] No KB match, falling back to intent detection + DB');
  const intent = detectIntent(message);

  if (intent.entity && intent.action !== 'none') {
    try {
      const dbContext = await fetchContextWithCache(intent, 'ai-rag');

      if (dbContext) {
        const formattedDbContext = `\n### DATOS DEL SISTEMA (obtenidos en tiempo real):\n${dbContext}`;
        return {
          context: formattedDbContext,
          source: 'db',
          kbChunksUsed: 0,
          intent,
        };
      }
    } catch (error: any) {
      console.error('[RAG] DB context fetch error:', error.message);
    }
  }

  // Paso 3: Sin contexto disponible
  return {
    context: null,
    source: 'none',
    kbChunksUsed: 0,
    intent,
  };
}

export default {
  pipeline,
};
