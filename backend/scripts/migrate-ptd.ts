import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const url = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

async function main() {
  console.log(`Connecting to Supabase at ${url}...`);
  const supabase = createClient(url, key);

  // Try exec_sql first (local Supabase has it)
  const sql = `
    CREATE TABLE IF NOT EXISTS "t_period_type_dates" (
      "ID" SERIAL NOT NULL,
      "PERIOD_ID" INTEGER NOT NULL,
      "INTERNSHIP_TYPE_ID" INTEGER NOT NULL,
      "START_DATE" DATE,
      "END_DATE" DATE,
      "CREATION_DATE" TIMESTAMP DEFAULT NOW(),
      "MODIF_USER_ID" INTEGER,
      "MODIF_USER_DATE" TIMESTAMP,
      UNIQUE ("PERIOD_ID", "INTERNSHIP_TYPE_ID")
    );
  `;

  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql });
    console.log('exec_sql result:', { data, error: error?.message });
    if (error) throw error;
  } catch (e: any) {
    console.log('exec_sql failed, trying direct query:', e.message);
    // Try exec_sql with different param name
    try {
      const { data, error } = await supabase.rpc('exec_sql', { query: sql });
      console.log('exec_sql(query) result:', { data, error: error?.message });
      if (error) throw error;
    } catch (e2: any) {
      console.log('exec_sql(query) failed too:', e2.message);
    }
  }

  // Test: check if table exists
  const { data, error } = await supabase.from('t_period_type_dates').select('*', { count: 'exact', head: true });
  if (error) {
    console.log('Table test error:', error.message, error.code, error.hint);
    console.log('Please create the table manually via SQL.');
    process.exit(1);
  } else {
    console.log('Table exists! Count:', data);
    console.log('Migration complete.');
  }
}

main().catch(console.error);
