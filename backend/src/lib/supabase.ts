import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from backend/ root (two levels up from lib/)
dotenv.config({ path: resolve(__dirname, '..', '..', '.env'), override: true });

const supabaseUrl = (process.env.SUPABASE_URL || '').trim().replace(/['`"]/g, '');
const supabaseServiceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim().replace(/['`"]/g, '');

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('[CONFIG] ERROR: Missing Supabase credentials in .env');
}

function emptyResponse(): any {
  return { data: null, error: null };
}

function noopChain(result: any = { data: [], error: null }): any {
  return new Proxy({}, {
    get: () => () => noopChain(result),
    apply: (_, __, args) => Promise.resolve(args[0]?.(result) ?? result),
  });
}

// ponytail: offline mode — mock client that never hits network
export const supabase: SupabaseClient = (supabaseUrl && supabaseServiceRoleKey)
  ? createClient(supabaseUrl, supabaseServiceRoleKey)
  : new Proxy({} as any, {
      get(_t, prop) {
        if (prop === 'then') return undefined; // not a thenable
        if (prop === 'rpc') return async () => emptyResponse();
        if (prop === 'storage') return { from: () => ({ upload: async () => emptyResponse(), download: async () => emptyResponse(), getPublicUrl: () => emptyResponse() }) };
        if (prop === 'auth') return { getSession: async () => emptyResponse(), signOut: async () => emptyResponse() };
        // from('table').select(...).eq(...).single() → noop chain
        return () => noopChain(emptyResponse());
      },
    });
