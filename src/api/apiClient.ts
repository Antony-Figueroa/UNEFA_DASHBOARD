import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from "axios";
import {
  getCachedData,
  cacheData,
  queueOfflineMutation,
  shouldCacheEndpoint,
  extractCacheKeyFromUrl,
  type PendingMutation,
} from '../lib/offline/index';

/**
 * @file apiClient.ts
 * @description Cliente de API centralizado basado en Axios para la aplicación UNEFA DASHBOARD.
 * Implementa interceptores para manejo de autenticación, reintentos exponenciales y normalización de errores.
 * También integra soporte offline con caché en IndexedDB.
 * 
 * @module core/api
 */

/**
 * Configuración de reintentos para peticiones fallidas.
 */
interface RetryConfig extends InternalAxiosRequestConfig {
  _retryCount?: number;
  silent?: boolean;
  _skipOfflineCache?: boolean;
}

const isProd = import.meta.env.PROD;
const baseURL = import.meta.env.VITE_API_URL || (isProd ? "/api" : "http://localhost:3000/api");

/**
 * Instancia central de Axios configurada con valores por defecto.
 */
const apiClient = axios.create({
  baseURL,
  timeout: 40000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

/**
 * Verifica si una petición debe ser cacheada.
 */
function shouldCacheRequest(config: InternalAxiosRequestConfig & RetryConfig): boolean {
  const method = config.method?.toUpperCase();
  if (method !== 'GET') return false;
  if (config._skipOfflineCache) return false;
  if (!config.url) return false;
  
  return shouldCacheEndpoint(config.url);
}

/**
 * Interceptor de solicitud.
 * Maneja cache offline para peticiones GET.
 */
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    if (shouldCacheRequest(config) && !navigator.onLine) {
      try {
        const cacheKey = await extractCacheKeyFromUrl(config.url!);
        const cachedData = await getCachedData<unknown>(cacheKey);
        
        if (cachedData) {
          console.info(`[API] Serving cached data for: ${config.url}`);
          const mockResponse = {
            data: cachedData,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: config,
            isCached: true,
          } as AxiosResponse;
          
          return Promise.reject({
            ...new Error('CACHED_RESPONSE'),
            isCachedResponse: true,
            cachedResponse: mockResponse,
            config,
          });
        }
      } catch (error) {
        console.warn('[API] Error reading cache:', error);
      }
    }
    
    return config;
  },
  (error: AxiosError) => {
    console.error(`[API Request Error]:`, error);
    return Promise.reject(error);
  }
);

/**
 * Interceptor de respuesta.
 * Maneja la lógica de reintentos, expiración de sesión (401), normalización de errores,
 * y cache de respuestas para offline.
 */
apiClient.interceptors.response.use(
  async (response: AxiosResponse) => {
    const config = response.config as RetryConfig;
    
    if (shouldCacheRequest(config) && response.data) {
      try {
        const cacheKey = await extractCacheKeyFromUrl(config.url!);
        await cacheData(cacheKey, response.data);
        console.debug(`[API] Cached response for: ${config.url}`);
      } catch (error) {
        console.warn('[API] Error caching response:', error);
      }
    }
    
    return response;
  },
  async (error: AxiosError) => {
    const config = error.config as RetryConfig;
    
    if (error.message === 'CACHED_RESPONSE' && (error as any).isCachedResponse) {
      return (error as any).cachedResponse;
    }
    
    if (error.message === 'CACHED_RESPONSE') {
      return Promise.reject(error);
    }
    
    const publicPaths = ['/', '/signin', '/signup', '/first-login', '/password-recovery', '/reset-password'];
    const currentPath = window.location.pathname.replace(/\/$/, '') || '/';
    const isPublicPage = publicPaths.includes(currentPath);
    
    const isMonitoringPath = config?.url?.includes('/health') || config?.url?.includes('/db-status');

    const lastRefresh = sessionStorage.getItem('auth_last_refresh');
    const timeSinceLastRefresh = lastRefresh ? Date.now() - parseInt(lastRefresh) : Infinity;
    const wasRecentlyRefreshed = timeSinceLastRefresh < 60000;
    
    if (error.response?.status === 401 && !isPublicPage && !wasRecentlyRefreshed) {
      const lastExpEvent = sessionStorage.getItem('auth_last_exp_event');
      const timeSinceLastExp = lastExpEvent ? Date.now() - parseInt(lastExpEvent) : Infinity;
      
      if (timeSinceLastExp > 5000) { 
        console.warn('[API] Sesión expirada o no autorizada. Redirigiendo...');
        sessionStorage.setItem('auth_last_exp_event', Date.now().toString());
        sessionStorage.setItem('auth_redirect_reason', 'expired');
        window.dispatchEvent(new CustomEvent('unefa:auth:session-expired'));
      }
      
      return Promise.reject(error);
    }

    if (error.response?.status !== 401 && !isPublicPage && !isMonitoringPath && !config?.silent) {
      const isServerError = (error.response?.status ?? 0) >= 500 || !error.response;
      const logMethod = isServerError ? 'error' : 'warn';
      const prefix = isServerError ? '[API Critical Error]' : '[API Business Error]';
      
      console[logMethod](`${prefix}: ${error.message} en ${config?.url}`, {
        status: error.response?.status,
        data: error.response?.data
      });
    }

    const MAX_RETRIES = 3;
    const shouldRetry = 
      !isPublicPage && 
      (error.code === 'ECONNABORTED' ||
       error.code === 'ERR_NETWORK' ||
       !error.response ||
       error.response.status === 429 ||
       error.response.status === 503 ||
       error.response.status >= 500);

    if (config && shouldRetry && (config._retryCount ?? 0) < MAX_RETRIES) {
      config._retryCount = (config._retryCount ?? 0) + 1;
      
      const delay = Math.pow(2, config._retryCount) * 1000;
      console.warn(`[API] Reintentando petición (${config._retryCount}/${MAX_RETRIES}) en ${delay}ms: ${config.url}`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return apiClient(config);
    }

    if (error.code === 'ERR_NETWORK' && !isPublicPage && !config?.silent) {
      console.error('[API] Error crítico de red: Verifique su conexión.');
      
      if (shouldCacheRequest(config) && config?.url) {
        try {
          const cacheKey = await extractCacheKeyFromUrl(config.url);
          const cachedData = await getCachedData<unknown>(cacheKey);
          
          if (cachedData) {
            console.info(`[API] Serving cached data after network error for: ${config.url}`);
            return {
              data: cachedData,
              status: 200,
              statusText: 'OK (Cached)',
              headers: {},
              config: config,
              isCached: true,
            } as AxiosResponse;
          }
        } catch (cacheError) {
          console.warn('[API] Error reading cache after network error:', cacheError);
        }
      }
      
      const method = config?.method?.toUpperCase();
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method || '') && config?.url) {
        try {
          const mutationType: PendingMutation['type'] = 
            method === 'POST' ? 'create' :
            method === 'DELETE' ? 'delete' : 'update';
          
          const mutationId = await queueOfflineMutation(
            mutationType,
            config.url,
            method as PendingMutation['method'],
            config.data
          );
          
          console.info(`[API] Mutation queued for offline sync: ${mutationType} ${config.url}`, { mutationId });
          
          return {
            data: { success: true, queued: true, mutationId },
            status: 202,
            statusText: 'Accepted (Offline)',
            headers: {},
            config: config,
            isOfflineQueued: true,
          } as AxiosResponse;
        } catch (queueError) {
          console.error('[API] Error queuing mutation:', queueError);
        }
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;

export { apiClient as client };

export function createOfflineAwareClient() {
  return apiClient;
}
