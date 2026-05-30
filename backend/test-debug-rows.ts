import { PGlite } from '@electric-sql/pglite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const pglite = new PGlite({ dataDir: path.join(__dirname, 'data', 'pglite') });

  // Check exact count
  const r1 = await pglite.query('SELECT count(*) as cnt FROM "t_user" WHERE "USER_CI" = $1', ['V00000000']);
  console.log('Count V00000000:', r1.rows[0].cnt);

  // Check all rows with this CI
  const r2 = await pglite.query('SELECT "USER_ID", "USER", "USER_CI" FROM "t_user" WHERE "USER_CI" = $1', ['V00000000']);
  console.log('Rows:', r2.rows.length);
  for (const row of r2.rows) console.log(' -', JSON.stringify(row));

  // Check total user count
  const r3 = await pglite.query('SELECT count(*) as cnt FROM "t_user"');
  console.log('Total users:', r3.rows[0].cnt);

  // Now test the JOIN query
  const r4 = await pglite.query(
    'SELECT "t_user"."USER_ID", "t_user"."USER_CI", "t_user_roles"."ID_USER", "t_user_roles"."ID_ROLES" FROM "t_user" LEFT JOIN "t_user_roles" AS "t_user_roles" ON "t_user_roles"."ID_USER" = "t_user"."USER_ID" WHERE "t_user"."USER_CI" = $1',
    ['V00000000']
  );
  console.log('\nJOIN query rows:', r4.rows.length);
  for (const row of r4.rows) console.log(' -', JSON.stringify(row));

  // Test without the WHERE qualification
  const r5 = await pglite.query(
    'SELECT "t_user"."USER_ID", "t_user"."USER_CI", "t_user_roles"."ID_USER", "t_user_roles"."ID_ROLES" FROM "t_user" LEFT JOIN "t_user_roles" AS "t_user_roles" ON "t_user_roles"."ID_USER" = "t_user"."USER_ID" WHERE "USER_CI" = $1',
    ['V00000000']
  );
  console.log('\nUnqualified WHERE rows:', r5.rows.length);
  for (const row of r5.rows) console.log(' -', JSON.stringify(row));

  await pglite.close();
}

main().catch(console.error);
