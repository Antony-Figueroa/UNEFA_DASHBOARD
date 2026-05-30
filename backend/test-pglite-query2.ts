import { PGlite } from '@electric-sql/pglite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const pglite = new PGlite({ dataDir: path.join(__dirname, 'data', 'pglite') });

  // Test A: Simple LEFT JOIN without AS alias
  try {
    const r = await pglite.query(
      'SELECT * FROM "t_user" LEFT JOIN "t_user_roles" ON "t_user_roles"."USER_ID" = "t_user"."USER_ID" WHERE "t_user"."USER_CI" = $1 LIMIT 2',
      ['V00000000']
    );
    console.log('Test A - Simple LEFT JOIN (no alias):');
    console.log('  rows:', r.rows.length);
  } catch(e: any) { console.log('Test A failed:', e.message); }

  // Test B: INNER JOIN instead of LEFT JOIN
  try {
    const r = await pglite.query(
      'SELECT * FROM "t_user" INNER JOIN "t_user_roles" ON "t_user_roles"."USER_ID" = "t_user"."USER_ID" WHERE "t_user"."USER_CI" = $1 LIMIT 2',
      ['V00000000']
    );
    console.log('Test B - INNER JOIN (no alias):');
    console.log('  rows:', r.rows.length);
  } catch(e: any) { console.log('Test B failed:', e.message); }

  // Test C: Check t_user_roles table directly
  try {
    const r = await pglite.query('SELECT * FROM "t_user_roles" LIMIT 5');
    console.log('Test C - SELECT FROM t_user_roles:');
    console.log('  rows:', r.rows.length);
    if (r.rows.length > 0) console.log('  cols:', Object.keys(r.rows[0]));
  } catch(e: any) { console.log('Test C failed:', e.message); }

  // Test D: Try JOIN with unqualified ON (no quotes on left side)
  try {
    const r = await pglite.query(
      'SELECT * FROM "t_user" LEFT JOIN "t_user_roles" ON t_user_roles."USER_ID" = "t_user"."USER_ID" WHERE "t_user"."USER_CI" = $1 LIMIT 2',
      ['V00000000']
    );
    console.log('Test D - LEFT JOIN unqualified ON:');
    console.log('  rows:', r.rows.length);
  } catch(e: any) { console.log('Test D failed:', e.message); }

  // Test E: Check if t_user_roles has USER_ID
  try {
    const r = await pglite.query(
      'SELECT column_name, data_type FROM information_schema.columns WHERE table_name = \'t_user_roles\''
    );
    console.log('Test E - t_user_roles columns:');
    r.rows.forEach((row: any) => console.log('  ', row.column_name, '-', row.data_type));
  } catch(e: any) { console.log('Test E failed:', e.message); }

  await pglite.close();
}

main().catch(console.error);
