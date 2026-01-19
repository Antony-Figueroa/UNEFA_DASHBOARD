import { DatabaseManager } from './src/lib/db-manager';

async function checkNacionalidad() {
  const dbManager = DatabaseManager.getInstance();
  const supabase = dbManager.getClient();

  console.log('Checking Nacionalidad list...');
  const { data: list, error: listError } = await supabase
    .from('t_list')
    .select('*')
    .ilike('NAME', 'Nacionalidad%');

  if (listError) {
    console.error('Error fetching list:', listError);
    return;
  }

  console.log('List found:', JSON.stringify(list, null, 2));

  if (list && list.length > 0) {
    const { data: values, error: valuesError } = await supabase
      .from('t_value_list')
      .select('*')
      .eq('LIST_ID', list[0].LIST_ID);

    if (valuesError) {
      console.error('Error fetching values:', valuesError);
      return;
    }

    console.log('Values found:', JSON.stringify(values, null, 2));
  }
}

checkNacionalidad().catch(console.error);
