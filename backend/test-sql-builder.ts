import { PGlite } from '@electric-sql/pglite';
import path from 'path';
import { fileURLToPath } from 'url';
import { SqlBuilder } from './src/lib/pglite-adapter.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  // 1. Print the generated SQL from the builder
  const builder = new SqlBuilder('t_user');
  builder.setSelect('*, t_user_roles(ID_ROLES)');
  builder.addFilter('eq', 'USER_CI', 'V00000000');
  builder.setSingle();

  const { sql, params } = builder.buildSQL();
  console.log('=== GENERATED SQL ===');
  console.log(sql);
  console.log('Params:', JSON.stringify(params));

  // 2. Execute against real PGlite
  const pglite = new PGlite({ dataDir: path.join(__dirname, 'data', 'pglite') });

  try {
    console.log('\n=== EXECUTING ===');
    const result = await pglite.query(sql, params);
    console.log('Rows:', result.rows.length);
    if (result.rows.length > 0) {
      console.log('First row:', JSON.stringify(result.rows[0], null, 2));
    }
  } catch (e: any) {
    console.error('QUERY ERROR:', e.message);
    console.error('Detail:', e);
  }

  // 3. Also test without the join
  try {
    const simpleSql = 'SELECT * FROM "t_user" WHERE "USER_CI" = $1 LIMIT 2';
    const result = await pglite.query(simpleSql, ['V00000000']);
    console.log('\n=== SIMPLE QUERY ===');
    console.log('Rows:', result.rows.length);
    if (result.rows.length > 0) {
      console.log('User found:', result.rows[0].USER, result.rows[0].USER_CI);
    }
  } catch (e: any) {
    console.error('SIMPLE ERROR:', e.message);
  }

  await pglite.close();
}

main().catch(console.error);
