import { PGlite } from '@electric-sql/pglite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const pglite = new PGlite({ dataDir: path.join(__dirname, 'data', 'pglite') });

  // Check users
  const users = await pglite.query('SELECT "USER_ID", "USER", "USER_CI", "NAME", "SURNAME", "STATUS" FROM "t_user"');
  console.log('=== USUARIOS (' + users.rows.length + ') ===');
  for (const row of users.rows) {
    console.log(`  ID:${row.USER_ID} CI:${row.USER_CI} USER:${row.USER} NAME:${row.NAME} STATUS:${row.STATUS}`);
  }

  // Check a specific user's details - try CI V-00000000
  const userDetail = await pglite.query(
    'SELECT * FROM "t_user" WHERE "USER_CI" = $1',
    ['V00000000']
  );
  if (userDetail.rows.length > 0) {
    console.log('\n=== DETALLE V00000000 ===');
    console.log(JSON.stringify(userDetail.rows[0], null, 2));
  } else {
    console.log('\n⚠️ No user found with CI V00000000');
  }

  // Check all CI values
  const allCis = await pglite.query('SELECT "USER_CI" FROM "t_user"');
  console.log('\n=== CIs disponibles ===');
  for (const row of allCis.rows) {
    console.log(`  ${row.USER_CI}`);
  }

  await pglite.close();
}

main().catch(console.error);
