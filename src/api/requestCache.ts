/**
 * @file requestCache.ts
 * @description Deduplica requests en-flight y cachea datos de referencia.
 * 
 * - In-flight dedup: si 2 componentes piden getCareers() simultáneamente,
 *   solo se hace 1 HTTP request y ambos reciben la misma promesa.
 * - Cache con TTL: después de resolver, el resultado se guarda por un tiempo.
 */

const inFlight = new Map<string, Promise<any>>();
const cache = new Map<string, { data: any; expiry: number }>();

const DEFAULT_TTL = 30000; // 30s para datos de referencia

/**
 * Ejecuta una función async con deduplicación en-flight y cache opcional.
 * 
 * @param key Identificador único (ej: 'careers:list', 'lists:SEMESTRE')
 * @param fetcher Función que hace el request real
 * @param ttl Tiempo de cache en ms (0 = solo dedup en-flight, sin cache)
 */
export function dedupeRequest<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = DEFAULT_TTL
): Promise<T> {
  // Cache vigente?
  if (ttl > 0) {
    const entry = cache.get(key);
    if (entry && Date.now() < entry.expiry) {
      return Promise.resolve(entry.data as T);
    }
  }

  // Ya hay un request en-flight para esta key?
  const pending = inFlight.get(key);
  if (pending) return pending as Promise<T>;

  // Nuevo request
  const promise = fetcher()
    .then((result) => {
      inFlight.delete(key);
      if (ttl > 0) {
        cache.set(key, { data: result, expiry: Date.now() + ttl });
      }
      return result;
    })
    .catch((err) => {
      inFlight.delete(key);
      throw err;
    });

  inFlight.set(key, promise);
  return promise;
}

/**
 * Invalida la cache para una key o prefix.
 */
export function invalidateCache(keyOrPrefix: string): void {
  for (const key of cache.keys()) {
    if (key === keyOrPrefix || key.startsWith(keyOrPrefix)) {
      cache.delete(key);
    }
  }
}

/**
 * Limpia toda la cache (útil al hacer logout).
 */
export function clearCache(): void {
  cache.clear();
}
