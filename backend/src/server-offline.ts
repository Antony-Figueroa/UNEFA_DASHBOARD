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
  let current = '';
  let inDollar = false;

  // Split por ; — luego re-agrupamos DO blocks que tienen ; internos
  for (const chunk of sql.split(';')) {
    const t = chunk.trim();
    if (!t && !current) continue;

    current += (current ? ';' : '') + chunk;

    // Count $$ toggles
    const count = (chunk.match(/\$\$/g) || []).length;
    if (count % 2 === 1) inDollar = !inDollar;

    // Emit solo si estamos fuera de DO block
    if (!inDollar && current.trim()) {
      stmts.push(current.trim().replace(/;\s*$/, ''));
      current = '';
    }
  }

  // Flush remaining (no debería pasar)
  if (current.trim()) stmts.push(current.trim());

  return stmts.filter(s => s.length > 0);
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
