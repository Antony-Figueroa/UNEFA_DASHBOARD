import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

export interface DbConfig {
  url: string;
  key: string;
  maxRetries: number;
  retryDelay: number;
}

export class DatabaseManager {
  private static instance: DatabaseManager;
  private client: SupabaseClient | null = null;
  private config: DbConfig;
  private connectionStatus: 'connected' | 'disconnected' | 'connecting' = 'disconnected';

  private connectionPromise: Promise<SupabaseClient> | null = null;

  private constructor() {
    // Forzar recarga de dotenv para asegurar que lee los valores más recientes
    dotenv.config({ override: true });

    this.config = {
      url: (process.env.SUPABASE_URL || '').trim().replace(/['`"]/g, ''),
      key: (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim().replace(/['`"]/g, ''),
      maxRetries: 3,
      retryDelay: 1000,
    };

    if (!this.config.url || !this.config.key) {
      console.error('[DB] ERROR: Missing Supabase credentials');
    }
  }

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  /**
   * Alias for getClient for backward compatibility
   */
  public getConnection(): SupabaseClient {
    return this.getClient();
  }

  public async connect(): Promise<SupabaseClient> {
    if (this.client && this.connectionStatus === 'connected') {
      return this.client;
    }

    if (this.connectionStatus === 'connecting' && this.connectionPromise) {
      return this.connectionPromise;
    }

    this.connectionStatus = 'connecting';
    this.connectionPromise = (async () => {
      try {
        this.client = createClient(this.config.url, this.config.key, {
          auth: {
            persistSession: false,
          },
          global: {
            headers: { 'x-application-name': 'unefa-backend' },
          },
        });

        // Test connection
        const { error, status, statusText } = await this.client.from('t_career').select('count', { count: 'exact', head: true });
        
        if (error) {
          console.error(`[DatabaseManager] [${new Date().toISOString()}] Connection test failed:`, {
            message: error.message,
            code: error.code,
            status,
            statusText
          });
          throw error;
        }

        this.connectionStatus = 'connected';
        console.log('[DB] ✅ Conectado a Supabase');
        return this.client;
      } catch (error: unknown) {
        this.connectionStatus = 'disconnected';
        this.connectionPromise = null;
        const message = error instanceof Error ? error.message : JSON.stringify(error);
        console.error(`[DatabaseManager] [${new Date().toISOString()}] Connection failed:`, message);
        throw error;
      }
    })();

    return this.connectionPromise;
  }

  public getClient(): SupabaseClient {
    if (!this.client) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.client;
  }

  public async checkHealth(): Promise<{ status: string; details?: Record<string, unknown> }> {
    if (!this.client) {
      if (!this.config.url || !this.config.key || this.config.url.includes('your-project') || this.config.key.includes('your-')) {
        return { 
          status: 'unhealthy', 
          details: { error: '⚠️ Credenciales de Supabase no configuradas. Por favor edita el archivo backend/.env con tus credenciales reales.' } 
        };
      }
      return { status: 'disconnected', details: { error: 'Cliente no inicializado' } };
    }

    try {
      const start = Date.now();
      const { error, status, statusText } = await this.client.from('t_career').select('count', { count: 'exact', head: true });
      const duration = Date.now() - start;

      if (error) {
        return { 
          status: 'unhealthy', 
          details: { 
            error: error.message,
            code: error.code,
            hint: error.hint,
            httpStatus: status,
            httpStatusText: statusText
          } 
        };
      }

      return { 
        status: 'healthy', 
        details: { 
          latency: `${duration}ms`,
          url: this.config.url.replace(/\/\/[^@]+@/, '//***:***@') // Ocultar credenciales si las hubiera en el URL
        } 
      };
    } catch (error: unknown) {
      const err = error as { message?: string; code?: string };
      return { 
        status: 'unhealthy', 
        details: { 
          error: err.message || 'Error desconocido de conexión',
          code: err.code 
        } 
      };
    }
  }

  /**
   * Ejecuta una operación con reintentos automáticos y monitoreo de rendimiento
   */
  public async withRetry<T>(operation: (client: SupabaseClient) => Promise<T>, operationName: string = 'Anonymous Operation'): Promise<T> {
    let lastError: unknown;
    const startTime = Date.now();
    
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        const client = await this.connect();
        const result = await operation(client);
        
        const duration = Date.now() - startTime;
        if (duration > 1000) {
          console.warn(`[DB] ⚠️ Operación lenta: ${operationName} (${duration}ms)`);
        }
        
        return result;
      } catch (error: unknown) {
        lastError = error;
        
        // No reintentar si es un error de aplicación ya controlado (tiene status)
        const appError = error as { status?: number };
        if (appError.status && appError.status < 500) {
          throw error;
        }

        const duration = Date.now() - startTime;
        console.debug(`[DB] Intento ${attempt} falló después de ${duration}ms. Reintentando...`);
        
        // Si el error es de conexión, forzar reconexión en el próximo intento
        this.connectionStatus = 'disconnected';
        
        if (attempt < this.config.maxRetries) {
          await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * attempt));
        }
      }
    }

    const totalDuration = Date.now() - startTime;
    console.warn(`[DatabaseManager] [${new Date().toISOString()}] All ${this.config.maxRetries} attempts failed for ${operationName} after ${totalDuration}ms.`);
    throw lastError;
  }
}

export const dbManager = DatabaseManager.getInstance();
export const getSupabase = () => dbManager.getClient();
