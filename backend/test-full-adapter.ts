import { PGlite } from '@electric-sql/pglite';
import path from 'path';
import { fileURLToPath } from 'url';
import { PGliteAdapter } from './src/lib/pglite-adapter.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const pglite = new PGlite({ dataDir: path.join(__dirname, 'data', 'pglite') });
  const adapter = new PGliteAdapter(pglite);

  // Test login query exactly as auth.service does it
  console.log('=== Test 1: Login query via PGliteAdapter ===');
  const result1 = await adapter
    .from('t_user')
    .select('*, t_user_roles(ID_ROLES)')
    .eq('USER_CI', 'V00000000')
    .single();

  console.log('error:', result1.error?.message || null);
  console.log('data:', result1.data ? 'found: ' + result1.data.USER_CI : 'null');
  if (result1.data) {
    console.log('roles:', JSON.stringify((result1.data as any).t_user_roles));
  }

  // Test key query
  console.log('\n=== Test 2: User key query ===');
  const USER_ID = 1;
  const result2 = await adapter
    .from('t_user_key')
    .select('*')
    .eq('USER_ID', USER_ID)
    .eq('STATUS', 1)
    .order('START_DATE', { ascending: false })
    .limit(1)
    .single();

  console.log('error:', result2.error?.message || null);
  console.log('data:', result2.data ? 'KEY found: ' + (result2.data as any).KEY?.substring(0, 30) + '...' : 'null');

  // Test config query
  console.log('\n=== Test 3: Config query ===');
  const result3 = await adapter
    .from('t_config')
    .select('*')
    .eq('CONFIG_ID', 1)
    .single();

  console.log('error:', result3.error?.message || null);
  console.log('data:', result3.data ? 'config found' : 'null');

  // Test with maybeSingle instead for config
  console.log('\n=== Test 4: Config with maybeSingle ===');
  const result4 = await adapter
    .from('t_config')
    .select('*')
    .eq('CONFIG_ID', 1)
    .maybeSingle();

  console.log('error:', result4.error?.message || null);
  console.log('data:', result4.data ? 'config found (first row)' : 'null');

  await pglite.close();
}

main().catch(console.error);
