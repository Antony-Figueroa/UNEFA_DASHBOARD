import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRifList() {
  console.log('--- Checking "Rif" List ---');
  const { data: rifList, error: rifError } = await supabase
    .from('t_list')
    .select('*')
    .eq('NAME', 'Rif')
    .single();

  if (rifError) {
    console.error('Error fetching Rif list:', rifError);
  } else {
    console.log('Rif List:', rifList);
    const { data: rifValues, error: valuesError } = await supabase
      .from('t_value_list')
      .select('*')
      .eq('LIST_ID', rifList.LIST_ID);
    
    if (valuesError) {
      console.error('Error fetching Rif values:', valuesError);
    } else {
      console.log('Rif Values:', JSON.stringify(rifValues, null, 2));
    }
  }

  console.log('\n--- Checking "Nacionalidad" List ---');
  const { data: nacList, error: nacError } = await supabase
    .from('t_list')
    .select('*')
    .eq('NAME', 'Nacionalidad')
    .single();

  if (nacError) {
    console.error('Error fetching Nacionalidad list:', nacError);
  } else {
    console.log('Nacionalidad List:', nacList);
    const { data: nacValues, error: nacValuesError } = await supabase
      .from('t_value_list')
      .select('*')
      .eq('LIST_ID', nacList.LIST_ID);
    
    if (nacValuesError) {
      console.error('Error fetching Nacionalidad values:', nacValuesError);
    } else {
      console.log('Nacionalidad Values:', JSON.stringify(nacValues, null, 2));
    }
  }
}

checkRifList().catch(console.error);
