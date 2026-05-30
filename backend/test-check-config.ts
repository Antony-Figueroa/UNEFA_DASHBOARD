import { PGlite } from '@electric-sql/pglite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const pglite = new PGlite({ dataDir: path.join(__dirname, 'data', 'pglite') });

  // Check config table
  const r = await pglite.query('SELECT * FROM "t_config"');
  console.log('=== t_config (' + r.rows.length + ') ===');
  for (const row of r.rows) {
    console.log(JSON.stringify(row));
  }

  // Check what columns exist
  const cols = await pglite.query(
    "SELECT column_name FROM information_schema.columns WHERE table_name = 't_config' ORDER BY ordinal_position"
  );
  console.log('\n=== t_config columns ===');
  for (const c of cols.rows) console.log(' ', c.column_name);

  await pglite.close();
}

main().catch(console.error);
