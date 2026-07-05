import { PGlite } from '@electric-sql/pglite';

const db = new PGlite({ dataDir: 'data/offline' });
const r = await db.query(`SELECT USER_CI, USER_PASSWORD, USER_STATE FROM t_user WHERE USER_CI = 'V12345678'`);
console.log('Rows:', JSON.stringify(r.rows, null, 2));
if (r.rows.length > 0) {
  const pw = r.rows[0].user_password;
  console.log('Password hash:', typeof pw, pw?.substring(0, 30) + '...');
  console.log('State:', r.rows[0].user_state);
} else {
  console.log('User not found!');
  const all = await db.query('SELECT USER_CI, USER_STATE FROM t_user LIMIT 5');
  console.log('All users:', JSON.stringify(all.rows));
}
await db.close();
