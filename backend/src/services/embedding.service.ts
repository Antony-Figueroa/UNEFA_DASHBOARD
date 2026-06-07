/**
 * Embedding Service — Generación de embeddings para RAG semántico
 *
 * Provider: Google AI Studio (text-embedding-004, 768 dimensiones)
 * Fallback: vector de ceros si no hay API key configurada
 *
 * Groq NO tiene endpoint público de embeddings, por eso usamos Google.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

// ============================================
// Configuration
// ============================================

const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || 'text-embedding-004';
const EMBEDDING_DIMENSION = parseInt(process.env.EMBEDDING_DIMENSION || '768', 10);

const apiKey = process.env.GOOGLE_AI_KEY || '';
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

if (!apiKey) {
  console.warn('[Embedding] GOOGLE_AI_KEY no configurada. Usando fallback (vectores de cero).');
} else {
  console.log(`[Embedding] Inicializado con modelo: ${EMBEDDING_MODEL}, dimensión: ${EMBEDDING_DIMENSION}`);
}

// ============================================
// Types
// ============================================

export interface EmbeddingResult {
  embedding: number[];
  success: boolean;
  error?: string;
}

// ============================================
// Main Functions
// ============================================

/**
 * Genera un embedding para un texto usando Google AI Studio.
 * Si no hay API key configurada, retorna un vector de ceros (fallback).
 */
export async function generateEmbedding(text: string): Promise<EmbeddingResult> {
  if (!genAI || !apiKey) {
    return { embedding: new Array(EMBEDDING_DIMENSION).fill(0), success: false, error: 'No API key' };
  }

  try {
    const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });
    const result = await model.embedContent(text);
    const embedding = result.embedding.values;

    return { embedding, success: true };
  } catch (error: any) {
    console.error('[Embedding] Error generando embedding:', error.message);

    // Fallback a vector de ceros
    return {
      embedding: new Array(EMBEDDING_DIMENSION).fill(0),
      success: false,
      error: error.message,
    };
  }
}

/**
 * Genera embeddings para múltiples textos (batch).
 */
export async function generateEmbeddings(texts: string[]): Promise<EmbeddingResult[]> {
  if (!genAI || !apiKey) {
    return texts.map(() => ({
      embedding: new Array(EMBEDDING_DIMENSION).fill(0),
      success: false,
      error: 'No API key',
    }));
  }

  return Promise.all(texts.map((text) => generateEmbedding(text)));
}

/**
 * Verifica si el servicio de embeddings está disponible.
 */
export function isEmbeddingAvailable(): boolean {
  return !!apiKey && !!genAI;
}

/**
 * Obtiene la dimensión de los embeddings configurada.
 */
export function getEmbeddingDimension(): number {
  return EMBEDDING_DIMENSION;
}

export default {
  generateEmbedding,
  generateEmbeddings,
  isEmbeddingAvailable,
  getEmbeddingDimension,
};
