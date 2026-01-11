import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const isProd = import.meta.env.PROD;
const baseURL = import.meta.env.VITE_API_URL || (isProd ? "/api" : "http://localhost:5000/api");

console.log(`[API] Inicializando cliente. Modo: ${isProd ? "Producción" : "Desarrollo"}. BaseURL: ${baseURL}`);

/**
 * Cliente de API centralizado para TailAdmin.
 * Configurado con timeouts, reintentos y manejo de errores robusto.
 */
const apiClient = axios.create({
  baseURL,
  timeout: 20000, // Aumentado para dar margen a la BD
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

/**
 * Interceptor de solicitud para logging.
 */
apiClient.interceptors.request.use((config) => {
  console.log(`[API] Solicitud enviada: ${config.method?.toUpperCase()} ${config.url}`);
  return config;
}, (error) => {
  console.error(`[API] Error en solicitud:`, error);
  return Promise.reject(error);
});

/**
 * Interceptor de respuesta para manejo de errores global y reintentos.
 */
apiClient.interceptors.response.use(
  (response) => {
    console.log(`[API] Respuesta recibida: ${response.status} ${response.config.url}`);
    // Validar que la respuesta sea JSON si se espera
    const contentType = response.headers["content-type"];
    if (response.data && contentType && !contentType.includes("application/json")) {
      console.warn(`[API] Respuesta no es JSON: ${contentType}`);
    }
    return response;
  },
  async (error: AxiosError) => {
    console.error(`[API] Error detectado: ${error.message} (${error.code}) en ${error.config?.url}`);
    const config = error.config as InternalAxiosRequestConfig & { _retryCount?: number };
    
    // Si no hay config (ej: error de red extremo) o ya excedimos los reintentos
    if (!config || (config._retryCount ?? 0) >= 3) {
      if (error.code === 'ERR_NETWORK') {
        console.error('[API] ERROR CRÍTICO DE RED: Posible problema de CORS o servidor caído.');
      }
      return Promise.reject(error);
    }

    config._retryCount = (config._retryCount ?? 0) + 1;

    // Lógica de reintento para errores específicos (429, 503, o errores de red)
    const shouldRetry = 
      error.code === 'ECONNABORTED' || // Timeout
      error.code === 'ERR_NETWORK' || // Error de red
      !error.response || // Sin respuesta
      error.response.status === 429 || // Too many requests
      error.response.status === 503 || // Service unavailable
      error.response.status >= 500;    // Server errors

    if (shouldRetry) {
      const delay = Math.pow(2, config._retryCount) * 1000; // Backoff exponencial: 2s, 4s, 8s
      console.warn(`[API] Intento ${config._retryCount} fallido. Reintentando en ${delay}ms...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return apiClient(config);
    }

    return Promise.reject(error);
  }
);

export default apiClient;
