import { PGlite } from '@electric-sql/pglite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const pglite = new PGlite({ dataDir: path.join(__dirname, 'data', 'pglite') });

  // Test 1: Simple SELECT
  try {
    const r1 = await pglite.query('SELECT * FROM "t_user" LIMIT 2');
    console.log('Test 1 - SELECT * FROM t_user:');
    console.log('  columns:', r1.fields?.map((f: any) => f.name));
    console.log('  rows:', r1.rows.length);
  } catch(e: any) { console.log('Test 1 failed:', e.message); }

  // Test 2: SELECT with WHERE on USER_CI
  try {
    const r2 = await pglite.query('SELECT * FROM "t_user" WHERE "USER_CI" = $1 LIMIT 2', ['V00000000']);
    console.log('Test 2 - SELECT with USER_CI filter:');
    console.log('  rows:', r2.rows.length);
    if (r2.rows.length > 0) console.log('  first row:', JSON.stringify(r2.rows[0]).substring(0, 300));
  } catch(e: any) { console.log('Test 2 failed:', e.message); }

  // Test 3: SELECT with JOIN + qualified WHERE
  try {
    const r3 = await pglite.query(
      'SELECT * FROM "t_user" LEFT JOIN "t_user_roles" AS "tur" ON "tur"."USER_ID" = "t_user"."USER_ID" WHERE "t_user"."USER_CI" = $1 LIMIT 2',
      ['V00000000']
    );
    console.log('Test 3 - JOIN with qualified WHERE:');
    console.log('  rows:', r3.rows.length);
    if (r3.rows.length > 0) console.log('  first row cols:', Object.keys(r3.rows[0]));
  } catch(e: any) { console.log('Test 3 failed:', e.message); }

  // Test 4: SELECT with JOIN, test columns
  try {
    const r4 = await pglite.query(
      'SELECT "t_user"."USER_CI", "tur"."ID_ROLES" FROM "t_user" LEFT JOIN "t_user_roles" AS "tur" ON "tur"."USER_ID" = "t_user"."USER_ID" WHERE "t_user"."USER_CI" = $1 LIMIT 2',
      ['V00000000']
    );
    console.log('Test 4 - JOIN with specific columns:');
    console.log('  rows:', r4.rows.length);
  } catch(e: any) { console.log('Test 4 failed:', e.message); }

  // Test 5: Use the SELECT * with join
  try {
    const r5 = await pglite.query(
      'SELECT *, tur."ID_ROLES" AS "tur_ID_ROLES" FROM "t_user" LEFT JOIN "t_user_roles" AS "tur" ON "tur"."USER_ID" = "t_user"."USER_ID" WHERE "t_user"."USER_CI" = $1 LIMIT 2',
      ['V00000000']
    );
    console.log('Test 5 - SELECT *, joined.col with qualified WHERE:');
    console.log('  rows:', r5.rows.length);
    if (r5.rows.length > 0) console.log('  cols:', Object.keys(r5.rows[0]));
  } catch(e: any) { console.log('Test 5 failed:', e.message); }

  await pglite.close();
}

main().catch(console.error);
