import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ override: true, path: path.join(__dirname, '../../.env') });

const url = process.env.SUPABASE_URL?.trim().replace(/['`"]/g, '');
const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim().replace(/['`"]/g, '');

if (!url || !key) {
  console.error('Missing SUPABASE credentials');
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

async function main() {
  const { data: users, error } = await supabase
    .from('t_user')
    .select('USER_ID, USER_CI, NAME, SURNAME, EMAIL, STATUS')
    .limit(20);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('\n=== USUARIOS EN SUPABASE ===');
  for (const u of users || []) {
    const { data: roles } = await supabase
      .from('t_user_roles')
      .select('t_roles!inner(NAME)')
      .eq('USER_ID', u.USER_ID);

    const roleName = (roles?.[0] as any)?.t_roles?.NAME || '(sin rol)';
    console.log(`  CI: ${u.USER_CI} | ${u.NAME} ${u.SURNAME} | ${u.EMAIL} | status: ${u.STATUS} | rol: ${roleName}`);
  }

  const { data: keys } = await supabase
    .from('t_user_key')
    .select('USER_ID, KEY')
    .limit(3);

  console.log('\n=== CLAVES (primeras 3) ===');
  for (const k of keys || []) {
    console.log(`  USER_ID: ${k.USER_ID} | KEY: ${k.KEY?.substring(0, 60)}...`);
  }
}

main().catch(console.error);
