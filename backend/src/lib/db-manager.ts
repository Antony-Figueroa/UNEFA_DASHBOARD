import dns from 'dns';

// Forzar resolución DNS IPv4 para todas las conexiones salientes del backend.
// Render usa IPv6 internamente pero la conectividad IPv6 con servicios externos
// (Supabase, Gmail SMTP, etc.) es intermitente y causa timeouts/connection resets.
dns.setServers(['8.8.8.8', '1.1.1.1']);

// Preferir IPv4 sobre IPv6 en todas las resoluciones DNS.
// Node 17+ soporta 'ipv4first' que afecta a dns.lookup() usado por
// fetch(), http.request(), y nodemailer internamente.
dns.setDefaultResultOrder('ipv4first');

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { DatabaseAdapter, DbConnection } from './db-adapter.js';
import { SupabaseAdapter } from './supabase-adapter.js';

dotenv.config();

export type DbMode = 'cloud' | 'offline';

export interface DbConfig {
  url: string;
  key: string;
  maxRetries: number;
  retryDelay: number;
}

/**
 * DatabaseManager — Singleton que gestiona la conexión a la base de datos.
 *
 * Soporta dos modos:
 * - 'cloud': usa Supabase SDK (comportamiento actual, por defecto)
 * - 'offline': usa PGliteAdapter (para la app desktop Electron)
 *
 * Los controllers NO cambian: siempre llaman a dbManager.getConnection()
 * y reciben un objeto con .from() y .rpc().
 */
export class DatabaseManager {
  private static instance: DatabaseManager;
  private client: SupabaseClient | null = null;
  private config: DbConfig;
  private connectionStatus: 'connected' | 'disconnected' | 'connecting' = 'disconnected';
  private connectionPromise: Promise<SupabaseClient> | null = null;

  // ─── Modo offline ───
  private mode: DbMode = 'cloud';
  private offlineAdapter: DatabaseAdapter | null = null;

  private constructor() {
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

  // ─── Gestión de modo ───

  /** Cambiar entre modo cloud y offline */
  public setMode(mode: DbMode): void {
    if (mode === this.mode) return;
    console.log(`[DB] Cambiando a modo: ${mode}`);
    this.mode = mode;
  }

  /** Obtener el modo actual */
  public getMode(): DbMode {
    return this.mode;
  }

  /** Inyectar el adaptador offline (PGlite) desde Electron */
  public setOfflineAdapter(adapter: DatabaseAdapter): void {
    this.offlineAdapter = adapter;
    console.log('[DB] ✅ Adaptador offline configurado');
  }

  // ─── Conexión ───

  /**
   * Obtiene la conexión activa según el modo actual.
   * En modo 'cloud': devuelve el SupabaseClient (envuelto en SupabaseAdapter)
   * En modo 'offline': devuelve el PGliteAdapter
   */
  public getConnection(): DbConnection {
    if (this.mode === 'offline') {
      if (!this.offlineAdapter) {
        throw new Error('[DB] Modo offline activado pero no hay adaptador configurado. Llama a setOfflineAdapter() primero.');
      }
      return this.offlineAdapter;
    }

    // Modo cloud: devolver SupabaseClient directamente (backward compat)
    if (!this.client) {
      throw new Error('[DB] Database not connected. Call connect() first.');
    }
    return this.client as unknown as DbConnection;
  }

  public async connect(): Promise<SupabaseClient> {
    if (this.mode === 'offline') {
      throw new Error('[DB] No se puede conectar a Supabase Cloud en modo offline');
    }

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

  /**
   * Devuelve el SupabaseClient directamente (solo modo cloud).
   * Lanza error si está en modo offline.
   */
  public getClient(): SupabaseClient {
    if (this.mode === 'offline') {
      throw new Error('[DB] getClient() no está disponible en modo offline. Usa getConnection() en su lugar.');
    }
    if (!this.client) {
      throw new Error('[DB] Database not connected. Call connect() first.');
    }
    return this.client;
  }

  public async checkHealth(): Promise<{ status: string; details?: Record<string, unknown> }> {
    if (this.mode === 'offline') {
      if (!this.offlineAdapter) {
        return { status: 'unhealthy', details: { error: 'Adaptador offline no configurado' } };
      }
      return { status: 'healthy', details: { mode: 'offline', engine: 'PGlite (PostgreSQL WASM)' } };
    }

    if (!this.client) {
      if (!this.config.url || !this.config.key || this.config.url.includes('your-project') || this.config.key.includes('your-')) {
        return { 
          status: 'unhealthy', 
          details: { error: 'Credenciales de Supabase no configuradas. Por favor edita el archivo backend/.env con tus credenciales reales.' } 
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
          url: this.config.url.replace(/\/\/[^@]+@/, '//***:***@')
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
   * Ejecuta una operación con reintentos automáticos.
   * En modo offline, ejecuta sin reintentos (no hay red).
   */
  public async withRetry<T>(operation: (client: any) => Promise<T>, operationName: string = 'Anonymous Operation'): Promise<T> {
    // En modo offline, ejecutar directo sin reintentos
    if (this.mode === 'offline') {
      try {
        const client = this.getConnection();
        return await operation(client);
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : JSON.stringify(error);
        console.error(`[DB] Error en operación offline ${operationName}:`, message);
        throw error;
      }
    }

    // Modo cloud: con reintentos
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
        
        const appError = error as { status?: number };
        if (appError.status && appError.status < 500) {
          throw error;
        }

        const duration = Date.now() - startTime;
        console.debug(`[DB] Intento ${attempt} falló después de ${duration}ms. Reintentando...`);
        
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
