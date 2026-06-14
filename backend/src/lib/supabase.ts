import { createClient } from '@supabase/supabase-js';
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

export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
