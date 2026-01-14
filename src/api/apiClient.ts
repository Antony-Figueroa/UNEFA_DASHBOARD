import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const isProd = import.meta.env.PROD;
const baseURL = import.meta.env.VITE_API_URL || (isProd ? "/api" : "http://localhost:5000/api");

/**
 * Cliente de API centralizado para TailAdmin.
 * Configurado con timeouts, reintentos y manejo de errores robusto.
 */
const apiClient = axios.create({
  baseURL,
  timeout: 20000, // Aumentado para dar margen a la BD
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

/**
 * Interceptor de solicitud para logging opcional.
 */
apiClient.interceptors.request.use((config) => {
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
    return response;
  },
  async (error: AxiosError) => {
    const config = error.config as InternalAxiosRequestConfig & { _retryCount?: number };
    
    // No loguear errores 401 como "Error detectado" ya que son parte del flujo normal de auth
    if (error.response?.status !== 401) {
      console.error(`[API] Error: ${error.message} en ${error.config?.url}`);
    }
    
    // Si no hay config (ej: error de red extremo) o ya excedimos los reintentos
    if (!config || (config._retryCount ?? 0) >= 3) {
      if (error.code === 'ERR_NETWORK') {
        console.error('[API] Error de red: Verifique su conexión o el estado del servidor.');
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
      const delay = Math.pow(2, config._retryCount) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
      return apiClient(config);
    }

    return Promise.reject(error);
  }
);

export default apiClient;
