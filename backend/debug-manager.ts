import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl!, supabaseKey!);

async function checkTable() {
  console.log('--- Checking t_institution_manager ---');
  // Try to select all columns to see what's available
  const { data, error } = await supabase
    .from('t_institution_manager')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error selecting *:', error);
  } else {
    console.log('Sample record keys:', Object.keys(data[0] || {}));
  }

  // Check if CARGO exists
  const { error: cargoError } = await supabase
    .from('t_institution_manager')
    .select('CARGO')
    .limit(1);

  if (cargoError) {
    console.log('CARGO column check failed:', cargoError.message);
  } else {
    console.log('CARGO column exists.');
  }
}

checkTable();
