// fix-sequences.ts
// Re-anchors EVERY SERIAL/IDENTITY sequence to MAX(col)+1 after a data load
// that inserted explicit IDs (seed restore, sync, PGlite -> Supabase, etc.).
// Running this is what prevents "duplicate key violates unique constraint" on
// the next application insert (which relies on nextval).
//
// Usage:
//   tsx fix-sequences.ts          -> local Docker Postgres (default)
//   tsx fix-sequences.ts --cloud  -> remote Supabase (needs SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY)

import { createClient } from '@supabase/supabase-js';
import { execSync } from 'child_process';

const CONTAINER = 'supabase_db_UNEFA_DASHBOARD';

const RESYNC_SQL = `
DO $$
DECLARE
  r record;
  maxval bigint;
  seqname text;
BEGIN
  FOR r IN
    SELECT c.relname AS tbl, a.attname AS col, s.relname AS seq
    FROM pg_class s
    JOIN pg_depend d ON d.objid = s.oid AND d.deptype = 'a'
    JOIN pg_class c ON d.refobjid = c.oid
    JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = d.refobjsubid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE s.relkind = 'S' AND n.nspname = 'public'
  LOOP
    EXECUTE format('SELECT COALESCE(MAX(%I), 0) FROM %I', r.col, r.tbl) INTO maxval;
    seqname := format('%I', r.seq);
    EXECUTE format('SELECT setval(%L, %s + 1, false)', seqname, maxval);
  END LOOP;
END $$;`;

async function main(): Promise<void> {
  const cloud = process.argv.includes('--cloud');
  if (cloud) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error('Para --cloud definí SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY');
    }
    const sb = createClient(url, key, { auth: { persistSession: false } });
    const { error } = await sb.rpc('exec_sql', { sql: RESYNC_SQL });
    if (error) throw error;
    console.log('✅ Secuencias resincronizadas (cloud)');
  } else {
    execSync(`docker exec -i ${CONTAINER} psql -U postgres -v ON_ERROR_STOP=0 -f -`, {
      input: RESYNC_SQL,
      encoding: 'utf8',
      timeout: 60000,
    });
    console.log('✅ Secuencias resincronizadas (local)');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
