// ===============================================================================
// dump-prod-to-local.ts
// Dump ALL data from production Supabase → local Supabase (127.0.0.1:54321)
// ===============================================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const PROD_URL = 'https://rgvnwslyvixviypgegra.supabase.co';
const PROD_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJndm53c2x5dml4dml5cGdlZ3JhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzg5MzA0NywiZXhwIjoyMDgzNDY5MDQ3fQ.***REMOVED***';

const LOCAL_URL = 'http://127.0.0.1:54321';
const LOCAL_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.***REMOVED***';

const prod = createClient(PROD_URL, PROD_KEY, { auth: { persistSession: false } });
const local = createClient(LOCAL_URL, LOCAL_KEY, { auth: { persistSession: false } });

const PAGE_SIZE = 1000;
const BATCH_SIZE = 100;
const SKIP_TABLES = new Set(['_sync_log', 't_backups', 't_change_log']);

// FK dependency graph — includes locally-added FKs for PostgREST
const FK_MAP: Record<string, string[]> = {
  t_internship_type: [], t_career: [], t_institution: [], t_permissions: [],
  t_roles: [], t_operation: [], t_tables: [], t_internships_period: [],
  t_evaluation_criteria: [], t_request_types: [], t_persons: [],
  t_list: [], t_address_type: [], t_estado: [], t_municipio: ['t_estado'],
  t_parroquia: ['t_municipio'], t_address: ['t_address_type'],
  t_person_address: ['t_persons', 't_address'],
  t_institution_address: ['t_institution', 't_address'],
  t_institution_manager: ['t_persons', 't_institution'],
  t_user: ['t_persons'], t_tutors: ['t_persons'], t_students: ['t_persons', 't_career'],
  t_tutor_career: ['t_tutors', 't_career'],
  t_career_internship_type: ['t_career', 't_internship_type'],
  t_user_roles: ['t_user', 't_roles'],
  t_roles_permissions: ['t_roles', 't_permissions'],
  t_columns: ['t_tables'],
  t_institution_manager_institution: ['t_institution_manager', 't_institution'],
  t_enrollment: ['t_students', 't_internships_period', 't_career'],
  t_professional_practices: ['t_persons', 't_students', 't_institution', 't_career', 't_internships_period', 't_institution_manager', 't_internship_type'],
  t_professional_practices_tutor: ['t_persons', 't_tutors', 't_professional_practices'],
  t_practice_visits: ['t_persons', 't_professional_practices', 't_tutors'],
  t_visit: ['t_professional_practices', 't_tutors'],
  t_activity_logs: ['t_persons', 't_professional_practices', 't_students'],
  t_evaluation: ['t_professional_practices', 't_user'],
  t_evaluation_detail: ['t_evaluation', 't_evaluation_criteria'],
  t_student_documents: ['t_persons', 't_students'],
  t_student_requests: ['t_persons', 't_students', 't_request_types'],
  t_notifications: ['t_user'],
  t_value_list: ['t_list'],
};

function topologicalSort(tables: string[]): string[] {
  const deps = new Map<string, Set<string>>();
  for (const t of tables) deps.set(t, new Set(FK_MAP[t] || []));
  const inDegree = new Map<string, number>();
  for (const t of tables) inDegree.set(t, deps.get(t)!.size);
  const queue = tables.filter(t => (inDegree.get(t) || 0) === 0);
  const sorted: string[] = [];
  while (queue.length > 0) {
    queue.sort((a, b) => tables.indexOf(a) - tables.indexOf(b));
    const node = queue.shift()!;
    sorted.push(node);
    for (const t of tables) {
      if (deps.get(t)?.has(node)) {
        deps.get(t)!.delete(node);
        const newDeg = (inDegree.get(t) || 1) - 1;
        inDegree.set(t, newDeg);
        if (newDeg === 0) queue.push(t);
      }
    }
  }
  for (const t of tables) { if (!sorted.includes(t)) sorted.push(t); }
  return sorted;
}

async function getTableNames(): Promise<string[]> {
  console.log('[dump] 🔍 Querying table list from production...');
  const { data, error } = await prod.rpc('get_all_tables');
  if (error) {
    console.warn('[dump] ⚠️ get_all_tables() RPC failed, using FK_MAP keys:', error.message);
    return Object.keys(FK_MAP);
  }
  const raw = data as { table_name?: string }[];
  return raw.map(r => r.table_name || '').filter(Boolean).filter(t => !SKIP_TABLES.has(t));
}

async function tableHasData(client: SupabaseClient, table: string): Promise<boolean> {
  const { count, error } = await client.from(table).select('*', { count: 'exact', head: true });
  return !error && (count || 0) > 0;
}

async function readAllRows(client: SupabaseClient, table: string): Promise<{ rows: any[]; columns: string[] }> {
  const { data: firstBatch, error } = await client.from(table).select('*').limit(1);
  if (error) throw error;
  if (!firstBatch || firstBatch.length === 0) return { rows: [], columns: [] };
  const columns = Object.keys(firstBatch[0]);

  const allRows: any[] = [];
  let offset = 0;
  while (true) {
    const { data, error: pageErr } = await client.from(table).select('*').range(offset, offset + PAGE_SIZE - 1);
    if (pageErr) throw pageErr;
    if (!data || data.length === 0) break;
    for (const row of data) {
      const filtered: any = {};
      for (const col of columns) filtered[col] = row[col] ?? null;
      allRows.push(filtered);
    }
    offset += data.length;
    if (data.length < PAGE_SIZE) break;
  }
  return { rows: allRows, columns };
}

async function clearTable(table: string): Promise<boolean> {
  try {
    const { data: allRows } = await local.from(table).select('*');
    if (!allRows || allRows.length === 0) return true;
    // Detect PK from local data (case-insensitive match)
    const localKeys = Object.keys(allRows[0]);
    const pkCol = localKeys.find(k => k.toLowerCase().endsWith('_id') || k.toLowerCase() === 'id')
      || localKeys.find(k => k.toLowerCase() === 'ci' || k.toLowerCase() === 'code')
      || localKeys[0];
    if (!pkCol) {
      const { error } = await local.from(table).delete().neq('', '');
      return !error;
    }
    const ids = allRows.map((r: any) => r[pkCol]).filter((id: any) => id != null);
    for (let i = 0; i < ids.length; i += 100) {
      const batch = ids.slice(i, i + 100);
      const { error } = await local.from(table).delete().in(pkCol, batch);
      if (error) { console.warn(`[dump] ⚠️  Error limpiando ${table}: ${error.message.slice(0, 120)}`); return false; }
    }
    return true;
  } catch {
    return false;
  }
}

async function syncTable(table: string): Promise<{ status: string; rows: number }> {
  try {
    console.log(`[dump] 📖 Reading ${table}...`);
    const { rows, columns } = await readAllRows(prod, table);
    if (rows.length === 0) { console.log(`[dump] ➖ ${table}: vacía`); return { status: 'empty', rows: 0 }; }

    console.log(`[dump] 💾 Insertando ${rows.length} rows en ${table}...`);
    let inserted = 0;
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      const { error: insErr } = await local.from(table).insert(batch);
      if (insErr) {
        for (const row of batch) {
          const { error: singleErr } = await local.from(table).insert(row);
          if (singleErr) console.warn(`[dump] ⚠️  Fila omitida en ${table}: ${singleErr.message.slice(0, 120)}`);
        }
      }
      inserted += batch.length;
      process.stdout.write(`\r[dump] 📊 ${table}: ${inserted}/${rows.length}`);
    }
    console.log(`\n[dump] ✅ ${table}: ${rows.length} registros`);
    return { status: 'synced', rows: rows.length };
  } catch (err: any) {
    console.error(`\n[dump] ❌ ${table}: ${err.message?.slice(0, 200)}`);
    return { status: 'failed', rows: 0 };
  }
}

async function main() {
  console.log(`[dump] 🚀 Conectando a producción...`);
  const { error: prodErr } = await prod.from('t_career').select('count', { count: 'exact', head: true });
  if (prodErr) { console.error(`[dump] ❌ ${prodErr.message}`); process.exit(1); }
  console.log(`[dump] ✅ Producción OK`);

  console.log(`[dump] 🚀 Conectando a local...`);
  const { error: localErr } = await local.from('t_career').select('count', { count: 'exact', head: true });
  if (localErr) console.warn(`[dump] ⚠️ Local: ${localErr.message}`);
  else console.log(`[dump] ✅ Local OK`);

  const allTables = await getTableNames();
  const orderedTables = topologicalSort(allTables);
  console.log(`[dump] 📋 ${orderedTables.length} tablas\n`);

  // Phase 1: Read ALL data from production first (before any writes)
  console.log(`[dump] 📖 Fase 1: Leyendo todas las tablas desde producción...\n`);
  const tableData = new Map<string, { rows: any[]; columns: string[] }>();
  for (const table of orderedTables) {
    if (SKIP_TABLES.has(table)) continue;
    try {
      const data = await readAllRows(prod, table);
      tableData.set(table, data);
      console.log(`[dump]   ${table}: ${data.rows.length} filas`);
    } catch (err: any) {
      console.warn(`[dump] ⚠️  Error leyendo ${table}: ${err.message.slice(0, 120)} — omitida`);
      tableData.set(table, { rows: [], columns: [] });
    }
  }

  // Phase 2: Clear ALL local tables in REVERSE dependency order (children first)
  console.log(`\n[dump] 🗑️  Fase 2: limpiando tablas locales (orden inverso)...`);
  const reversed = [...orderedTables].reverse();
  for (const table of reversed) {
    if (SKIP_TABLES.has(table)) continue;
    const data = tableData.get(table);
    if (!data || data.rows.length === 0) continue;
    const cleared = await clearTable(table);
    console.log(`[dump]   ${table}: ${cleared ? 'OK' : '⚠️  falló'}`);
  }

  // Phase 3: Insert ALL data in dependency order
  console.log(`\n[dump] 💾 Fase 3: insertando datos...\n`);
  const results: { table: string; status: string; rows: number }[] = [];
  for (const table of orderedTables) {
    if (SKIP_TABLES.has(table)) continue;
    const data = tableData.get(table);
    if (!data || data.rows.length === 0) {
      results.push({ table, status: 'empty', rows: 0 });
      continue;
    }
    const result = await syncTable(table);
    results.push({ table, ...result });
  }

  console.log(`\n[dump] ─── RESUMEN ───`);
  const synced = results.filter(r => r.status === 'synced');
  const empty = results.filter(r => r.status === 'empty');
  const failed = results.filter(r => r.status === 'failed');
  console.log(`[dump] ✅ ${synced.length} tablas (${synced.reduce((s, r) => s + r.rows, 0)} filas)`);
  console.log(`[dump] ➖ ${empty.length} tablas vacías`);
  if (failed.length > 0) {
    console.log(`[dump] ❌ ${failed.length} fallaron:`);
    for (const f of failed) console.log(`[dump]    • ${f.table}`);
  }
}

main().catch(console.error);
