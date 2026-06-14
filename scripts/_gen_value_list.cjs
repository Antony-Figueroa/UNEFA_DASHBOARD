const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ override: true, path: '../backend/.env' });

const url = process.env.SUPABASE_URL.trim().replace(/['"`]/g, '');
const key = process.env.SUPABASE_SERVICE_ROLE_KEY.trim().replace(/['"`]/g, '');
const supabase = createClient(url, key);

const esc = (s) => {
  if (s === null || s === undefined || s === '') return 'NULL';
  return `'${String(s).replace(/'/g, "''")}'`;
};

(async () => {
  const { data: vl, error } = await supabase
    .from('t_value_list')
    .select('*')
    .order('VALUE_LIST_ID', { ascending: true });

  if (error) { console.error(error); process.exit(1); }
  
  const rows = vl.map(r => {
    const abbr = r.ABBREVIATION && r.ABBREVIATION !== '' ? esc(r.ABBREVIATION.trim()) : 'NULL';
    return `(${r.VALUE_LIST_ID}, ${esc(r.NAME)}, ${abbr}, ${r.LIST_ID}, NOW(), ${r.MODIF_USER_ID || 0}, NOW(), ${r.ELIM_USER_ID || 0}, NOW(), ${r.REST_USER_ID || 0}, NOW(), ${r.STATUS})`;
  });

  console.log('INSERT INTO "t_value_list" ...');
  console.log(rows.join(',\n'));
})();
