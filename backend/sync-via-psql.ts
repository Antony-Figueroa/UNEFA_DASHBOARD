// sync-via-psql.ts
// Read from prod via Supabase REST API, write to local via docker exec psql
// Bypasses local REST API entirely (which was failing with "fetch failed")

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { execSync } from 'child_process';

const PROD_URL = process.env.SUPABASE_URL || 'https://rgvnwslyvixviypgegra.supabase.co';
const PROD_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!PROD_KEY) throw new Error('Set SUPABASE_SERVICE_ROLE_KEY env var before running');
const prod = createClient(PROD_URL, PROD_KEY, { auth: { persistSession: false } });

const PAGE_SIZE = 1000;
const SKIP_TABLES = new Set(['_sync_log', 't_backups', 't_change_log']);

// Tables to sync in dependency order
const TABLES = [
  // Root (no FK deps)
  't_internship_type', 't_career', 't_institution', 't_permissions',
  't_roles', 't_operation', 't_tables', 't_internships_period',
  't_evaluation_criteria', 't_request_types', 't_list', 't_address_type',
  't_estado', 't_persons', 't_preset_questions', 't_chat_config', 't_config',
  't_email_templates', 't_knowledge_base', 't_landing_config',
  't_person_merge_log', 't_report_text_templates', 't_system_institution',
  // Level 1
  't_municipio', 't_user',
  // Level 2 — FK deps first: parroquia BEFORE address
  't_parroquia',
  't_address',
  // Level 3 — depends on t_address + t_persons
  't_person_address', 't_institution_address',
  // Level 4
  't_institution_manager', 't_tutors', 't_students', 't_user_key',
  // Level 3
  't_user_roles', 't_user_questions', 't_user_theme', 't_password_history',
  't_recovery_tokens', 't_session', 't_academic_config', 't_auth_log',
  't_chat_sessions', 't_security_questions', 't_notifications',
  't_tutor_career', 't_career_internship_type', 't_coordinadores',
  't_roles_permissions', 't_columns', 't_institution_manager_institution',
  't_institution_career', 't_institution_internship_type',
  't_professional_practices', 't_prospect_lists',
  // Level 4
  't_session_attempts', 't_session_history', 't_evaluation',
  't_professional_practices_tutor', 't_activity_logs', 't_student_documents',
  't_student_requests', 't_visit', 't_practice_visits', 't_key_history',
  // Level 5
  't_evaluation_detail', 't_prospect_list_items', 't_value_list',
  // From migration 025 (prod-only tables)
  't_practice_culmination', 't_enrollment_field_changes',
  't_committee_assignment', 't_culmination_reversals',
];

/** Escape a value for SQL insertion */
function esc(val: any): string {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  if (typeof val === 'number') return String(val);
  if (typeof val === 'object') {
    const json = JSON.stringify(val);
    const s = json.replace(/\\/g, '\\\\').replace(/'/g, "''");
    return `'${s}'::jsonb`;
  }
  const s = String(val)
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "''");
  return `'${s}'`;
}

/** Escape column name (quoted identifier) */
function escCol(c: string): string {
  return `"${c.replace(/"/g, '""')}"`;
}

/**
 * After a bulk insert-with-explicit-ID load, every SERIAL/IDENTITY sequence is
 * left behind the real MAX(ID). This DO block re-anchors ALL of them to
 * MAX(col)+1 so the next application insert (which relies on nextval) stops
 * colliding with existing rows. Idempotent and safe to run any time.
 */
const RESYNC_SEQUENCES_SQL = `
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

function execPsql(sql: string): void {
  execSync(`docker exec -i supabase_db_UNEFA_DASHBOARD psql -U postgres -t -v ON_ERROR_STOP=1`, {
    input: sql,
    encoding: 'utf8',
    timeout: 60000,
  });
}

async function readAllRows(client: SupabaseClient, table: string): Promise<any[]> {
  const allRows: any[] = [];
  let offset = 0;
  while (true) {
    const { data, error } = await client.from(table).select('*').range(offset, offset + PAGE_SIZE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    allRows.push(...data);
    offset += data.length;
    if (data.length < PAGE_SIZE) break;
  }
  return allRows;
}

async function main() {
  // Get column info locally
  const colResult = execSync(
    `docker exec supabase_db_UNEFA_DASHBOARD psql -U postgres -t -A -F"," -c "SELECT table_name, column_name FROM information_schema.columns WHERE table_schema='public' ORDER BY table_name, ordinal_position"`,
    { encoding: 'utf8', timeout: 10000 }
  );
  const localCols = new Map<string, string[]>();
  for (const line of colResult.trim().split('\n').filter(Boolean)) {
    const [tname, cname] = line.split(',');
    if (!localCols.has(tname)) localCols.set(tname, []);
    const existing = localCols.get(tname)!;
    if (!existing.includes(cname)) existing.push(cname);
  }

  // Read and insert each table
  for (const table of TABLES) {
    if (SKIP_TABLES.has(table)) continue;
    try {
      const rows = await readAllRows(prod, table);
      if (rows.length === 0) {
        console.log(`[sync] ➖ ${table}: vacía`);
        continue;
      }

      const cols = localCols.get(table) || [];
      if (cols.length === 0) {
        console.log(`[sync] ⚠️ ${table}: no hay columnas locales, skipping`);
        continue;
      }

      const colList = cols.map(escCol).join(', ');
      const rowsPerInsert = 20;
      let inserted = 0;
      let errors = 0;

      for (let i = 0; i < rows.length; i += rowsPerInsert) {
        const batch = rows.slice(i, i + rowsPerInsert);
        const values = batch.map(row => {
          const vals = cols.map(col => {
            const key = Object.keys(row).find(k => k.toLowerCase() === col.toLowerCase());
            return key ? esc(row[key]) : 'NULL';
          });
          return `(${vals.join(', ')})`;
        }).join(',\n');

        const sql = `INSERT INTO "${table}" (${colList}) VALUES\n${values}\nON CONFLICT DO NOTHING;\n`;
        try {
          execPsql(sql);
          inserted += batch.length;
        } catch (e: any) {
          errors++;
          // Fallback: row by row
          for (const row of batch) {
            const rowVals = cols.map(col => {
              const key = Object.keys(row).find(k => k.toLowerCase() === col.toLowerCase());
              return key ? esc(row[key]) : 'NULL';
            });
            const singleSql = `INSERT INTO "${table}" (${colList}) VALUES (${rowVals.join(', ')}) ON CONFLICT DO NOTHING;\n`;
            try {
              execPsql(singleSql);
              inserted++;
            } catch (e2: any) {
              errors++;
              process.stderr.write(`[sync] ⚠️ ${table} fila ${inserted + 1}: ${(e2 as Error).message.slice(0, 120)}\n`);
            }
          }
        }
        process.stdout.write(`\r[sync] 📊 ${table}: ${inserted}/${rows.length} (${errors} errors)`);
      }
      console.log(`\n[sync] ✅ ${table}: ${rows.length} registros (${errors} errores)`);
    } catch (e: any) {
      console.error(`\n[sync] ❌ ${table}: ${e.message.slice(0, 200)}`);
    }
  }

  // Re-anchor every sequence after the explicit-ID bulk load (root-cause fix
  // for "duplicate key violates unique constraint" on the next app insert).
  try {
    console.log(`\n[sync] 🔧 Resincronizando secuencias...`);
    execPsql(RESYNC_SEQUENCES_SQL);
    console.log(`[sync] ✅ Secuencias resincronizadas`);
  } catch (e: any) {
    console.error(`\n[sync] ⚠️ No se pudieron resincronizar las secuencias: ${e.message.slice(0, 200)}`);
  }

  console.log(`\n[sync] ✅ SYNC COMPLETADO`);
}

main().catch(console.error);
