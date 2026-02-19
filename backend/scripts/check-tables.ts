import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  console.log('=== ESTRUCTURA DE TABLAS ===\n');

  // t_user
  const { data: userCols } = await supabase
    .rpc('query', { 
      query: "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 't_user' ORDER BY ordinal_position"
    })
    .catch(() => ({ data: null }));
  
  console.log('t_user columns:', userCols || 'No se pudo obtener');

  // Intentar ver un registro
  const { data: userSample, error: userError } = await supabase
    .from('t_user')
    .select('*')
    .limit(1);
  
  console.log('\nt_user sample:', userSample);
  if (userError) console.log('Error:', userError.message);
}

checkTables();
