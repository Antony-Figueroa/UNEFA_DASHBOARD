import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

/**
 * Cliente de API centralizado para TailAdmin.
 * Configurado con timeouts, reintentos y manejo de errores robusto.
 */
const apiClient = axios.create({
  baseURL: "https://694ed7abb5bc648a93c169dc.mockapi.io", // Conexión directa a MockAPI
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

/**
 * Interceptor de respuesta para manejo de errores global y reintentos.
 */
apiClient.interceptors.response.use(
  (response) => {
    // Validar que la respuesta sea JSON si se espera
    const contentType = response.headers["content-type"];
    if (response.data && contentType && !contentType.includes("application/json")) {
      console.warn(`[API] Respuesta no es JSON: ${contentType}`);
    }
    return response;
  },
  async (error: AxiosError) => {
    const config = error.config as InternalAxiosRequestConfig & { _retryCount?: number };
    
    // Si no hay config (ej: error de red extremo) o ya excedimos los reintentos
    if (!config || (config._retryCount ?? 0) >= 3) {
      return Promise.reject(error);
    }

    config._retryCount = (config._retryCount ?? 0) + 1;

    // Lógica de reintento para errores específicos (429, 503, o errores de red)
    const shouldRetry = 
      error.code === 'ECONNABORTED' || // Timeout
      !error.response || // Error de red
      error.response.status === 429 || // Too many requests
      error.response.status === 503 || // Service unavailable
      error.response.status >= 500;    // Server errors (incluye el 500 que reportó el usuario)

    if (shouldRetry) {
      const delay = Math.pow(2, config._retryCount) * 1000; // Backoff exponencial: 2s, 4s, 8s
      console.warn(`[API] Error ${error.response?.status || error.code}. Reintentando en ${delay}ms... (Intento ${config._retryCount})`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return apiClient(config);
    }

    return Promise.reject(error);
  }
);

export default apiClient;
