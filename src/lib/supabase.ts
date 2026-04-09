import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[Supabase Frontend] Missing credentials in .env');
  console.error('[Supabase Frontend] VITE_SUPABASE_URL:', supabaseUrl || 'undefined');
  console.error('[Supabase Frontend] VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'set' : 'undefined');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
