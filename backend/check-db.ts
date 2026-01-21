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

async function checkStudents() {
  console.log('--- Checking t_students ---');
  const { data, error } = await supabase
    .from('t_students')
    .select(`
      STUDENTS_CI,
      NAME,
      SURNAME
    `);

  if (error) {
    console.error('Error:', error);
    return;
  }

  if (!data || data.length === 0) {
    console.log('No student records found.');
    return;
  }

  console.log(`Found ${data.length} records:`);
  data.forEach(r => {
    // Correctly handle data structure and avoid linter errors
    const student = r as { NAME: string; SURNAME: string; STUDENTS_CI: string };
    console.log(`Student: ${student.NAME} ${student.SURNAME} (${student.STUDENTS_CI})`);
  });
}

checkStudents();
