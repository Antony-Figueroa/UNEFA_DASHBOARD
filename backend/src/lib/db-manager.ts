import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

export interface DbConfig {
  url: string;
  key: string;
  maxRetries: number;
  retryDelay: number;
}

class DatabaseManager {
  private static instance: DatabaseManager;
  private client: SupabaseClient | null = null;
  private config: DbConfig;
  private connectionStatus: 'connected' | 'disconnected' | 'connecting' = 'disconnected';

  private constructor() {
    this.config = {
      url: process.env.SUPABASE_URL || '',
      key: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      maxRetries: 3,
      retryDelay: 1000,
    };

    if (!this.config.url || !this.config.key) {
      console.error('[DatabaseManager] CRITICAL: Missing Supabase credentials');
    }
  }

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  public async connect(): Promise<SupabaseClient> {
    if (this.client && this.connectionStatus === 'connected') {
      return this.client;
    }

    this.connectionStatus = 'connecting';
    console.log(`[DatabaseManager] [${new Date().toISOString()}] Connecting to Supabase...`);

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
      const { error } = await this.client.from('t_career').select('count', { count: 'exact', head: true });
      
      if (error) throw error;

      this.connectionStatus = 'connected';
      console.log(`[DatabaseManager] [${new Date().toISOString()}] Successfully connected to Supabase`);
      return this.client;
    } catch (error: unknown) {
      this.connectionStatus = 'disconnected';
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[DatabaseManager] [${new Date().toISOString()}] Connection failed:`, message);
      throw error;
    }
  }

  public getClient(): SupabaseClient {
    if (!this.client) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.client;
  }

  public async checkHealth(): Promise<{ status: string; details?: Record<string, unknown> }> {
    if (!this.client) return { status: 'disconnected' };

    try {
      const start = Date.now();
      const { error } = await this.client.from('t_career').select('count', { count: 'exact', head: true });
      const duration = Date.now() - start;

      if (error) throw error;

      return { 
        status: 'healthy', 
        details: { 
          latency: `${duration}ms`,
          url: this.config.url
        } 
      };
    } catch (error: unknown) {
      const err = error as { message?: string; code?: string };
      return { 
        status: 'unhealthy', 
        details: { 
          error: err.message || 'Unknown error',
          code: err.code 
        } 
      };
    }
  }

  /**
   * Ejecuta una operación con reintentos automáticos
   */
  public async withRetry<T>(operation: (client: SupabaseClient) => Promise<T>): Promise<T> {
    let lastError: unknown;
    
    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        const client = await this.connect();
        return await operation(client);
      } catch (error: unknown) {
        lastError = error;
        console.warn(`[DatabaseManager] [${new Date().toISOString()}] Attempt ${attempt} failed. Retrying in ${this.config.retryDelay * attempt}ms...`);
        
        // Si el error es de conexión, forzar reconexión en el próximo intento
        this.connectionStatus = 'disconnected';
        
        if (attempt < this.config.maxRetries) {
          await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * attempt));
        }
      }
    }

    console.error(`[DatabaseManager] [${new Date().toISOString()}] All ${this.config.maxRetries} attempts failed.`);
    throw lastError;
  }
}

export const dbManager = DatabaseManager.getInstance();
export const getSupabase = () => dbManager.getClient();
