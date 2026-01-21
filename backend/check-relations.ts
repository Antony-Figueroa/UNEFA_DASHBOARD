import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRelations() {
  console.log('--- Checking t_career_internship_type ---');
  const { data, error } = await supabase
    .from('t_career_internship_type')
    .select(`
      CAREER_ID,
      INTERNSHIP_TYPE_ID,
      t_career (CAREER_NAME),
      t_internship_type (NAME)
    `);

  if (error) {
    console.error('Error:', error);
    return;
  }

  if (!data || data.length === 0) {
    console.log('No records found.');
    return;
  }

  console.log(`Found ${data.length} records:`);
  data.forEach(r => {
    const career = (Array.isArray(r.t_career) ? r.t_career[0] : r.t_career) as { CAREER_NAME: string } | null;
    const type = (Array.isArray(r.t_internship_type) ? r.t_internship_type[0] : r.t_internship_type) as { NAME: string } | null;
    console.log(`Career: ${career?.CAREER_NAME || 'N/A'} (${r.CAREER_ID}) <-> Type: ${type?.NAME || 'N/A'} (${r.INTERNSHIP_TYPE_ID})`);
  });
}

checkRelations();
