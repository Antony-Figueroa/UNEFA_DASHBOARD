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

async function fixNacionalidad() {
  console.log('Checking for "Nacionalidad " (with space)...');
  const { data: listWithSpace, error: error1 } = await supabase
    .from('t_list')
    .select('*')
    .eq('NAME', 'Nacionalidad ')
    .single();

  if (listWithSpace) {
    console.log('Found "Nacionalidad ". Renaming to "Nacionalidad" and setting status to 1...');
    const { error: error2 } = await supabase
      .from('t_list')
      .update({ NAME: 'Nacionalidad', STATUS: 1 })
      .eq('LIST_ID', listWithSpace.LIST_ID);
    
    if (error2) console.error('Error updating:', error2);
    else console.log('Successfully fixed "Nacionalidad ".');
  } else {
    console.log('"Nacionalidad " not found. Checking for "Nacionalidad"...');
    const { data: listNoSpace, error: error3 } = await supabase
      .from('t_list')
      .select('*')
      .eq('NAME', 'Nacionalidad')
      .single();

    if (listNoSpace) {
      console.log('Found "Nacionalidad". Ensuring status is 1...');
      const { error: error4 } = await supabase
        .from('t_list')
        .update({ STATUS: 1 })
        .eq('LIST_ID', listNoSpace.LIST_ID);
      
      if (error4) console.error('Error updating:', error4);
      else console.log('Successfully ensured "Nacionalidad" is active.');
    } else {
      console.log('"Nacionalidad" not found at all.');
    }
  }

  // Also check values
  console.log('Checking values for Nacionalidad...');
  const { data: list } = await supabase
    .from('t_list')
    .select('LIST_ID')
    .eq('NAME', 'Nacionalidad')
    .single();

  if (list) {
    const { data: values } = await supabase
      .from('t_value_list')
      .select('*')
      .eq('LIST_ID', list.LIST_ID);
    
    console.log('Current values:', JSON.stringify(values, null, 2));
  }
}

fixNacionalidad().catch(console.error);
