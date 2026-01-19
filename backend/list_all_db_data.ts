import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function listAllLists() {
  console.log('--- Listing all lists from t_list ---');
  const { data: lists, error } = await supabase
    .from('t_list')
    .select('LIST_ID, NAME, STATUS')
    .order('LIST_ID');

  if (error) {
    console.error('Error fetching lists:', error);
    return;
  }

  for (const list of lists) {
    const { data: values, error: valuesError } = await supabase
      .from('t_value_list')
      .select('NAME, ABBREVIATION')
      .eq('LIST_ID', list.LIST_ID);

    console.log(`List ID: ${list.LIST_ID}, Name: "${list.NAME}", Status: ${list.STATUS}`);
    if (valuesError) {
      console.error(`  Error fetching values for list ${list.LIST_ID}:`, valuesError);
    } else {
      values.forEach(v => {
        console.log(`  - ${v.NAME} (${v.ABBREVIATION})`);
      });
    }
  }
}

listAllLists();
