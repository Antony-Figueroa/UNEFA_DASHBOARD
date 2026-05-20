/**
 * RAG Cache Service - Sistema de caché para contexto RAG
 *
 * Evita consultas repetitivas a la base de datos
 * TTL configurable por tipo de entidad
 */

import { fetchContextForIntent, DetectedIntent } from './intent-detection.service.js';

// ============================================
// Configuration
// ============================================

interface CacheConfig {
  /** TTL en segundos */
  ttl: number;
  /** Máximo de entradas en caché */
  maxEntries: number;
}

const DEFAULT_TTL = 300; // 5 minutos

const ENTITY_TTL: Record<string, number> = {
  students: 300,   // 5 min - cambian frecuentemente
  careers: 600,   // 10 min - cambian poco
  periods: 300,   // 5 min - depende del período actual
  tutors: 600,   // 10 min - cambian poco
  institutions: 600, // 10 min - cambian poco
  internships: 180, // 3 min - cambian frecuentemente
  users: 300,    // 5 min - cambian frecuentemente
  statistics: 120, // 2 min - siempre нужно actualizado
};

// ============================================
// Types
// ============================================

interface CacheEntry {
  value: string;
  timestamp: number;
  ttl: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  evictions: number;
  size: number;
}

// ============================================
// Cache Implementation
// ============================================

class RagCache {
  private cache: Map<string, CacheEntry> = new Map();
  private stats: CacheStats = { hits: 0, misses: 0, evictions: 0, size: 0 };

  /**
   * Genera clave de caché basada en el intent
   */
  public getCacheKey(intent: DetectedIntent): string {
    const filters = intent.filters ? JSON.stringify(intent.filters) : '';
    return `rag:${intent.entity}:${intent.action}:${intent.limit || 10}:${filters}`;
  }

  /**
   * Obtiene el TTL para una entidad
   */
  private getTTL(entity: string): number {
    return ENTITY_TTL[entity] || DEFAULT_TTL;
  }

  /**
   * Verifica si una entrada es válida
   */
  private isValid(entry: CacheEntry): boolean {
    const now = Date.now();
    const age = (now - entry.timestamp) / 1000; // en segundos
    return age < entry.ttl;
  }

  /**
   * Obtiene una entrada del caché
   */
  get(key: string): string | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      console.log(`[RAG Cache] MISS: ${key}`);
      return null;
    }

    if (!this.isValid(entry)) {
      // Entrada expirada
      this.cache.delete(key);
      this.stats.misses++;
      console.log(`[RAG Cache] EXPIRED: ${key}`);
      return null;
    }

    this.stats.hits++;
    console.log(`[RAG Cache] HIT: ${key} (age: ${(Date.now() - entry.timestamp) / 1000}s)`);
    return entry.value;
  }

  /**
   * Guarda una entrada en el caché
   */
  set(key: string, value: string, entity: string): void {
    // Verificar tamaño máximo
    if (this.cache.size >= 50 && !this.cache.has(key)) {
      // Evictar la entrada más antigua
      let oldestKey: string | null = null;
      let oldestTime = Date.now();

      this.cache.forEach((entry, k) => {
        if (entry.timestamp < oldestTime) {
          oldestTime = entry.timestamp;
          oldestKey = k;
        }
      });

      if (oldestKey) {
        this.cache.delete(oldestKey);
        this.stats.evictions++;
        console.log(`[RAG Cache] EVICTED: ${oldestKey}`);
      }
    }

    const ttl = this.getTTL(entity);
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl,
    });

    this.stats.size = this.cache.size;
    console.log(`[RAG Cache] SET: ${key} (ttl: ${ttl}s)`);
  }

  /**
   * Obtiene estadísticas del caché
   */
  getStats(): CacheStats & { hitRate: number } {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;

    return {
      ...this.stats,
      hitRate: Math.round(hitRate * 100) / 100,
    };
  }

  /**
   * Limpia el caché
   */
  clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0, evictions: 0, size: 0 };
    console.log('[RAG Cache] CLEARED');
  }

  /**
   * Limpia entradas expiradas
   */
  cleanup(): number {
    let cleaned = 0;

    this.cache.forEach((entry, key) => {
      if (!this.isValid(entry)) {
        this.cache.delete(key);
        cleaned++;
      }
    });

    this.stats.size = this.cache.size;
    if (cleaned > 0) {
      console.log(`[RAG Cache] CLEANED: ${cleaned} entries`);
    }

    return cleaned;
  }
}

// ============================================
// Singleton Instance
// ============================================

export const ragCache = new RagCache();

// ============================================
// Wrapper function con caché
// ============================================

/**
 * Obtiene contexto RAG con caché
 * Si existe en caché y es válido, lo retorna directamente
 * Si no, consulta la base de datos y lo guarda en caché
 */
export const fetchContextWithCache = async (
  intent: DetectedIntent,
  requesterId: string | number = 'ai-rag'
): Promise<string | null> => {
  // Solo cachear si hay intent válido
  if (!intent.entity || intent.action === 'none') {
    return fetchContextForIntent(intent, requesterId);
  }

  const cacheKey = ragCache.getCacheKey(intent);

  // Intentar obtener del caché
  const cached = ragCache.get(cacheKey);
  if (cached) {
    console.log(`[RAG] Returning cached context for ${intent.entity}:${intent.action}`);
    return cached;
  }

  // No está en caché, consultar base de datos
  console.log(`[RAG] Fetching fresh context for ${intent.entity}:${intent.action}`);
  const context = await fetchContextForIntent(intent, requesterId);

  // Guardar en caché si hay resultado
  if (context) {
    ragCache.set(cacheKey, context, intent.entity);
  }

  return context;
};

/**
 * Obtiene estadísticas del caché
 */
export const getCacheStats = () => ragCache.getStats();

/**
 * Limpia el caché de RAG
 */
export const clearRagCache = () => ragCache.clear();

/**
 * Limpia entradas expiradas del caché
 */
export const cleanupRagCache = () => ragCache.cleanup();

// ============================================
// Iniciar cleanup automático (cada 60 segundos)
// ============================================

setInterval(() => {
  cleanupRagCache();
}, 60000);

console.log('[RAG Cache] Auto-cleanup scheduled every 60s');

export default {
  fetchContextWithCache,
  getCacheStats,
  clearRagCache,
  cleanupRagCache,
};