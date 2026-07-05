// ===============================================================================
// Offline Server Entry Point — UNEFA Dashboard Desktop
// ===============================================================================
// Arranca backend Express con PGlite local + seeds.
// SIN depender de conexión a Supabase para nada.
// ===============================================================================

import { dbManager } from './lib/db-manager.js';
import { PGlite } from '@electric-sql/pglite';
import { PGliteAdapter } from './lib/pglite-adapter.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const __projectRoot = path.resolve(__dirname, '..');

// ─── Config ───
const PORT = parseInt(process.env.OFFLINE_PORT || '3001', 10);
const DATA_DIR = process.env.PGLITE_DATA_DIR || path.join(__projectRoot, 'data', 'pglite');
const SCHEMA_FILE = path.join(__projectRoot, '..', 'DB-postgres.sql');
const SEED_SYSTEM = path.join(__dirname, 'seed', 'seed_system.sql');
const SEED_PRES = path.join(__dirname, 'seed', 'seed-presentacion.sql');

// ─── SQL statement splitter ───
// Divide SQL en statements individuales respetando DO $$ ... $$ blocks
// (cuyos ; internos NO son separadores de statement)
function splitStatements(sql: string): string[] {
  const stmts: string[] = [];
  let cur = '';
  let inDollar = false;
  let inQuote = false;
  let i = 0;

  while (i < sql.length) {
    const c = sql[i];
    const nxt = sql[i + 1] || '';

    // $$ dollar-quote block
    if (c === '$' && nxt === '$') {
      inDollar = !inDollar;
      cur += '$$';
      i += 2;
      continue;
    }

    // ' single-quote string (solo fuera de $$), maneja '' escapado
    if (c === "'" && !inDollar) {
      cur += "'";
      i += 1;
      if (inQuote && nxt === "'") {
        // '' dentro de string = comilla escapada, NO toggle
        cur += "'";
        i += 1;
      } else {
        inQuote = !inQuote;
      }
      continue;
    }

    // ; fuera de string = boundary
    if (c === ';' && !inQuote && !inDollar) {
      const t = cur.trim();
      if (t) stmts.push(t);
      cur = '';
      i += 1;
      continue;
    }

    cur += c;
    i += 1;
  }

  if (cur.trim()) stmts.push(cur.trim());
  return stmts;
}

// ─── Schema extraction ───
function extractCreateStatements(sql: string): string[] {
  const stmts: string[] = [];
  const lines = sql.split('\n');
  let current = '';
  let inTable = false;

  for (const line of lines) {
    const t = line.trim();
    if (t.startsWith('CREATE TABLE IF NOT EXISTS')) {
      inTable = true;
      current = line;
      continue;
    }
    if (inTable) {
      current += '\n' + line;
      if (t === ';' || t.endsWith(';')) {
        stmts.push(current);
        current = '';
        inTable = false;
      }
    }
  }
  return stmts;
}

async function initSchema(pglite: PGlite): Promise<void> {
  console.log('[Offline] 🔧 Schema...');
  await pglite.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`).catch(() => {});

  if (!fs.existsSync(SCHEMA_FILE)) {
    console.warn(`[Offline] ⚠️ No hay schema file: ${SCHEMA_FILE}`);
    return;
  }

  const sql = fs.readFileSync(SCHEMA_FILE, 'utf-8');
  const stmts = extractCreateStatements(sql);
  let ok = 0;

  for (const stmt of stmts) {
    try {
      await pglite.query(stmt);
      ok++;
    } catch {
      // Expected for some tables (FK deps)
    }
  }
  console.log(`[Offline] ✅ Schema: ${ok}/${stmts.length} tablas`);

  // Tablas adicionales que están en migraciones separadas de Supabase
  await pglite.query(`
    CREATE TABLE IF NOT EXISTS "t_user_sessions" (
      "ID" SERIAL NOT NULL,
      "USER_ID" INTEGER NOT NULL,
      "TOKEN_HASH" VARCHAR(64) NOT NULL,
      "DEVICE_INFO" TEXT,
      "IP_ADDRESS" VARCHAR(45),
      "LAST_ACTIVITY" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      "CREATED_AT" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      "STATUS" SMALLINT DEFAULT 1,
      PRIMARY KEY ("ID")
    )
  `).catch(() => {});
  await pglite.query(`CREATE INDEX IF NOT EXISTS "idx_user_sessions_user" ON "t_user_sessions"("USER_ID")`).catch(() => {});
}

async function runSeed(pglite: PGlite, filePath: string, label: string): Promise<void> {
  if (!fs.existsSync(filePath)) {
    console.warn(`[Offline] ⚠️ Seed no encontrado: ${filePath}`);
    return;
  }

  const sql = fs.readFileSync(filePath, 'utf-8');
  const stmts = splitStatements(sql);
  let ok = 0;

  for (const stmt of stmts) {
    // Saltar BEGIN/COMMIT (PGlite maneja transacciones implícitas)
    const upper = stmt.replace(/^--.*$/gm, '').trim().toUpperCase();
    if (upper === 'BEGIN' || upper === 'BEGIN;' || upper === 'COMMIT' || upper === 'COMMIT;') continue;

    try {
      await pglite.query(stmt);
      ok++;
    } catch (err: any) {
      const msg = err.message || '';
      // En PGlite, un error aborta la transacción implícita. Hay que resetear.
      // Usamos execProtocol para emitir ROLLBACK sin depender del query builder.
      try { await (pglite as any).execProtocol?.('ROLLBACK'); } catch {}
      if (msg.includes('duplicate key') || msg.includes('already exists')) continue;
      if (msg.includes('does not exist') || msg.includes('relation') && msg.includes('does not exist')) continue;
      console.warn(`[Offline] ⚠️ [${label}] ${msg.slice(0, 100)}`);
    }
  }
  console.log(`[Offline] ✅ ${label}: ${ok}/${stmts.length} statements`);
}

// ─── MAIN ───
async function main() {
  console.log('═══════════════════════════════════════');
  console.log('  UNEFA Dashboard — Backend OFFLINE');
  console.log('  PGlite + seeds locales');
  console.log(`  Puerto: ${PORT}`);
  console.log('═══════════════════════════════════════');

  fs.mkdirSync(DATA_DIR, { recursive: true });
  const pglite = new PGlite({ dataDir: DATA_DIR });

  await initSchema(pglite);
  await runSeed(pglite, SEED_SYSTEM, 'system');
  // seed-presentacion.sql tiene ; dentro de strings literales — el splitter
  // por ; no los respeta. Saltamos por ahora, los datos demo no son críticos.
  // await runSeed(pglite, SEED_PRES, 'presentacion');

  // Configurar modo offline
  console.log('[Offline] 🔄 Configurando adaptador offline...');
  dbManager.setOfflineAdapter(new PGliteAdapter(pglite));
  dbManager.setMode('offline');

  // JWT fallback para offline — dotenv no carga .env como SYSTEM user
  process.env.JWT_SECRET ||= 'offline-dev-secret-do-not-use-in-production';
  process.env.MODE = 'offline';

  // Importar app (connect() falla, ok)
  console.log('[Offline] 📦 Importando Express...');
  const { app } = await import('./app.js');

  const server = app.listen(PORT, '127.0.0.1', () => {
    console.log(`\n🚀 http://localhost:${PORT}`);
    console.log(`🔑 V12345678 / Admin123\n`);
  });

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ Puerto ${PORT} en uso.`);
      process.exit(1);
    }
    console.error('❌', err);
    process.exit(1);
  });

  const shutdown = async () => {
    console.log('\n[Offline] 👋 Cerrando...');
    server.close();
    await (pglite as any).close?.();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch(err => { console.error('❌', err); process.exit(1); });
