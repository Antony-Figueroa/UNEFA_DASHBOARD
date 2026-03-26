import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ override: true });

const supabaseUrl = (process.env.SUPABASE_URL || '').trim().replace(/['`"]/g, '');
const supabaseServiceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim().replace(/['`"]/g, '');

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('[CONFIG] ERROR: Missing Supabase credentials in .env');
}

export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
