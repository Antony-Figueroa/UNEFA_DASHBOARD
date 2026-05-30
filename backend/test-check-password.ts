import { PGlite } from '@electric-sql/pglite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const pglite = new PGlite({ dataDir: path.join(__dirname, 'data', 'pglite') });

  // Check t_user_key table
  try {
    const uk = await pglite.query('SELECT * FROM "t_user_key"');
    console.log('=== t_user_key (' + uk.rows.length + ') ===');
    for (const row of uk.rows) console.log(JSON.stringify(row));
  } catch (e: any) { console.log('t_user_key error:', e.message); }

  // Check t_password_history
  try {
    const ph = await pglite.query('SELECT * FROM "t_password_history"');
    console.log('\n=== t_password_history (' + ph.rows.length + ') ===');
    for (const row of ph.rows) console.log(JSON.stringify(row));
  } catch (e: any) { console.log('t_password_history error:', e.message); }

  // Check t_user columns - look for any password/key related
  try {
    const cols = await pglite.query(
      "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 't_user' ORDER BY ordinal_position"
    );
    console.log('\n=== t_user columns ===');
    for (const row of cols.rows) console.log(`  ${row.column_name} (${row.data_type}) nullable=${row.is_nullable}`);
  } catch (e: any) { console.log('columns error:', e.message); }

  // Check t_key_history
  try {
    const kh = await pglite.query('SELECT * FROM "t_key_history"');
    console.log('\n=== t_key_history (' + kh.rows.length + ') ===');
    for (const row of kh.rows) console.log(JSON.stringify(row).substring(0, 300));
  } catch (e: any) { console.log('t_key_history error:', e.message); }

  await pglite.close();
}

main().catch(console.error);
