import { PGlite } from '@electric-sql/pglite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const pglite = new PGlite({ dataDir: path.join(__dirname, 'data', 'pglite') });

  const r = await pglite.query('SELECT "USER_CI", "USER", "USER_ID", "STATUS" FROM "t_user"');
  console.log('t_user rows:', r.rows.length);
  for (const row of r.rows) console.log(JSON.stringify(row));

  const r2 = await pglite.query('SELECT * FROM "t_user_roles"');
  console.log('t_user_roles rows:', r2.rows.length);
  for (const row of r2.rows) console.log(JSON.stringify(row));

  await pglite.close();
}

main().catch(console.error);
