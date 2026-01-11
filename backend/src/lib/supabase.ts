import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('[Supabase] CRITICAL: Missing credentials in .env');
} else {
  console.log(`[Supabase] Initializing client for: ${supabaseUrl}`);
}

export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// Prueba de conexión inicial
supabase.from('t_career').select('count', { count: 'exact', head: true })
  .then(({ error }) => {
    if (error) {
      console.error('[Supabase] Error de conexión inicial:', error.message);
    } else {
      console.log('[Supabase] Conexión establecida exitosamente.');
    }
  });
