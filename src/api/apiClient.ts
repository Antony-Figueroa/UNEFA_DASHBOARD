import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from "axios";

/**
 * @file apiClient.ts
 * @description Cliente de API centralizado basado en Axios para la aplicación UNEFA DASHBOARD.
 * Implementa interceptores para manejo de autenticación, reintentos exponenciales y normalización de errores.
 * 
 * @module core/api
 */

/**
 * Configuración de reintentos para peticiones fallidas.
 */
interface RetryConfig extends InternalAxiosRequestConfig {
  _retryCount?: number;
  silent?: boolean;
}

const isProd = import.meta.env.PROD;
const baseURL = import.meta.env.VITE_API_URL || (isProd ? "/api" : "http://localhost:3000/api");

/**
 * Instancia central de Axios configurada con valores por defecto.
 * 
 * @example
 * import apiClient from '@/api/apiClient';
 * const data = await apiClient.get('/users');
 */
const apiClient = axios.create({
  baseURL,
  timeout: 40000, // 40s para manejar cold-starts en entornos como Render
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

/**
 * Interceptor de solicitud.
 * Permite inyectar tokens o realizar transformaciones antes de enviar la petición.
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Aquí se podrían añadir headers dinámicos si no se usan cookies (withCredentials)
    return config;
  },
  (error: AxiosError) => {
    console.error(`[API Request Error]:`, error);
    return Promise.reject(error);
  }
);

/**
 * Interceptor de respuesta.
 * Maneja la lógica de reintentos, expiración de sesión (401) y normalización de errores.
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const config = error.config as RetryConfig;
    
    // Rutas que no requieren redirección inmediata al login si fallan con 401
    const publicPaths = ['/', '/signin', '/signup', '/first-login', '/password-recovery', '/reset-password'];
    const currentPath = window.location.pathname.replace(/\/$/, '') || '/';
    const isPublicPage = publicPaths.includes(currentPath);
    
    // Rutas de monitoreo que no deben ensuciar el log de errores
    const isMonitoringPath = config?.url?.includes('/health') || config?.url?.includes('/db-status');

    // Verificar si el token fue renovado recientemente (evita falsos positivos)
    const lastRefresh = sessionStorage.getItem('auth_last_refresh');
    const timeSinceLastRefresh = lastRefresh ? Date.now() - parseInt(lastRefresh) : Infinity;
    const wasRecentlyRefreshed = timeSinceLastRefresh < 60000; // Menos de 1 minuto
    
    // 1. Manejo de Sesión Expirada (401)
    if (error.response?.status === 401 && !isPublicPage && !wasRecentlyRefreshed) {
      console.warn('[API] Sesión expirada o no autorizada. Notificando al sistema...');
      
      // Marcar causa de redirección en sessionStorage
      sessionStorage.setItem('auth_redirect_reason', 'expired');
      
      // Emitir evento para que el AuthContext o componentes de UI manejen la expiración con un modal
      window.dispatchEvent(new CustomEvent('unefa:auth:session-expired'));
      
      return Promise.reject(error);
    }

    // 2. Logging de errores
    if (error.response?.status !== 401 && !isPublicPage && !isMonitoringPath && !config?.silent) {
      const isServerError = (error.response?.status ?? 0) >= 500 || !error.response;
      const logMethod = isServerError ? 'error' : 'warn';
      const prefix = isServerError ? '[API Critical Error]' : '[API Business Error]';
      
      console[logMethod](`${prefix}: ${error.message} en ${config?.url}`, {
        status: error.response?.status,
        data: error.response?.data
      });
    }

    // 3. Lógica de Reintentos (Backoff Exponencial)
    const MAX_RETRIES = 3;
    const shouldRetry = 
      !isPublicPage && 
      (error.code === 'ECONNABORTED' || // Timeout
       error.code === 'ERR_NETWORK' ||    // Error de red
       !error.response ||                 // Sin respuesta del servidor
       error.response.status === 429 ||    // Too many requests
       error.response.status === 503 ||    // Service unavailable
       error.response.status >= 500);      // Errores de servidor

    if (config && shouldRetry && (config._retryCount ?? 0) < MAX_RETRIES) {
      config._retryCount = (config._retryCount ?? 0) + 1;
      
      const delay = Math.pow(2, config._retryCount) * 1000;
      console.warn(`[API] Reintentando petición (${config._retryCount}/${MAX_RETRIES}) en ${delay}ms: ${config.url}`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return apiClient(config);
    }

    // 4. Error final si fallan todos los reintentos o no es reintentable
    if (error.code === 'ERR_NETWORK' && !isPublicPage) {
      console.error('[API] Error crítico de red: Verifique su conexión.');
    }

    return Promise.reject(error);
  }
);

export default apiClient;
