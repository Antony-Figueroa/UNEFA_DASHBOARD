// ===============================================================================
// Offline Server Entry Point — UNEFA Dashboard Desktop
// ===============================================================================
// Arranca el backend Express con PGlite en vez de Supabase.
// Todas las queries de los controllers se ejecutan contra PostgreSQL WASM local.
//
// USO:
//   cd backend && npx tsx src/server-offline.ts
//
// O desde Electron (producción):
//   node dist/server-offline.js
// ===============================================================================

import { dbManager } from './lib/db-manager.js';
import { PGlite } from '@electric-sql/pglite';
import { PGliteAdapter } from './lib/pglite-adapter.js';
import { SyncService } from './services/sync.service.js';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Config ───
// IMPORTANTE: los imports estáticos se ejecutan antes que el código de módulo.
// db-manager.ts ejecuta dotenv.config({ override: true }) que pisa PORT=3000 del .env.
// Por eso usamos OFFLINE_PORT exclusivamente.
const BACKEND_PORT = parseInt(process.env.OFFLINE_PORT || '3001', 10);

// Directorio para persistencia de datos PGlite
// En desarrollo: ./data/pglite
// En producción: app.getPath('userData')/pglite (lo setea Electron)
const DATA_DIR = process.env.PGLITE_DATA_DIR || path.join(process.cwd(), 'data', 'pglite');

// ─── Schema SQL ───
// Extrae solo CREATE TABLE del schema completo.
// El archivo DB-postgres.sql tiene ~60KB con tablas + datos.
// Para offline, necesitamos solo la estructura.
const SCHEMA_FILE = path.join(__dirname, '../../DB-postgres.sql');

/**
 * Lee el schema SQL y extrae solo las sentencias CREATE TABLE IF NOT EXISTS.
 * Ignora INSERTs, COMMITs, TRIGGERs, etc.
 */
function extractCreateStatements(sql: string): string[] {
  const statements: string[] = [];
  const lines = sql.split('\n');
  let currentStatement = '';
  let inCreateTable = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.toUpperCase().startsWith('CREATE TABLE IF NOT EXISTS')) {
      inCreateTable = true;
      currentStatement = line;
      continue;
    }

    if (inCreateTable) {
      currentStatement += '\n' + line;
      // La sentencia termina con ;
      if (trimmed === ';' || trimmed.endsWith(';')) {
        statements.push(currentStatement);
        currentStatement = '';
        inCreateTable = false;
      }
    }
  }

  return statements;
}

/**
 * Inicializa la base de datos PGlite con el schema.
 * Si ya existe un archivo de base de datos persistente, solo se conecta.
 * Si no, crea las tablas desde DB-postgres.sql.
 */
async function initializeDatabase(pglite: PGlite): Promise<void> {
  console.log('[OfflineServer] 🔧 Inicializando base de datos local...');

  // 1. Extensiones necesarias (pgcrypto no disponible en PGlite WASM, no crítico)
  await pglite.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`).catch(() => {});

  // 2. Cargar schema desde DB-postgres.sql
  if (!fs.existsSync(SCHEMA_FILE)) {
    console.warn(`[OfflineServer] ⚠️ No se encontró ${SCHEMA_FILE}. Las tablas se crearán bajo demanda.`);
    return;
  }

  const fullSql = fs.readFileSync(SCHEMA_FILE, 'utf-8');
  const statements = extractCreateStatements(fullSql);

  console.log(`[OfflineServer] 📦 Ejecutando ${statements.length} CREATE TABLEs...`);

  let failures = 0;
  for (const stmt of statements) {
    try {
      await pglite.query(stmt);
    } catch (err: any) {
      failures++;
      // Solo loggear el primer error, los demás son ruido
      if (failures === 1) {
        console.warn(`[OfflineServer] ⚠️ Primer CREATE TABLE falló: ${err.message?.slice(0, 120)}`);
        console.warn(`[OfflineServer]   (${statements.length - 1} más omitidos — probablemente causa raíz relacionada)`);
      }
    }
  }

  if (failures === 0) {
    console.log(`[OfflineServer] ✅ Schema cargado: ${statements.length} tablas`);
  } else {
    console.warn(`[OfflineServer] ⚠️ Schema cargado con ${failures}/${statements.length} fallos (algunas tablas pueden faltar)`);
  }

  // 3. Tabla auxiliar para sync offline
  await pglite.query(`
    CREATE TABLE IF NOT EXISTS "_sync_log" (
      "id" SERIAL PRIMARY KEY,
      "table_name" VARCHAR(100) NOT NULL,
      "record_id" INTEGER NOT NULL,
      "operation" VARCHAR(10) NOT NULL,
      "changed_at" TIMESTAMP NOT NULL DEFAULT NOW(),
      "synced" BOOLEAN NOT NULL DEFAULT FALSE
    )
  `).catch(() => {});
}

// ─── MAIN ───
async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('  UNEFA Dashboard — Backend OFFLINE');
  console.log('  Base de datos local: PGlite (PostgreSQL WASM)');
  console.log(`  Puerto: ${BACKEND_PORT}`);
  console.log('═══════════════════════════════════════════');

  // 1. Importar app.js en modo CLOUD (default)
  //    Esto permite que connect() se conecte a Supabase y los seeders poblaren datos
  console.log('[OfflineServer] 📦 Importando aplicación (modo cloud para sync)...');
  const { app } = await import('./app.js');

  // 2. Esperar conexión a Supabase
  console.log('[OfflineServer] 🔌 Conectando a Supabase para sincronización...');
  const supabaseConnected = await dbManager.connect().then(() => true).catch((err) => {
    console.warn(`[OfflineServer] ⚠️ No se pudo conectar a Supabase: ${err.message}`);
    return false;
  });

  // 3. Crear directorio de datos si no existe
  console.log(`[OfflineServer] 📁 Directorio de datos: ${DATA_DIR}`);
  fs.mkdirSync(DATA_DIR, { recursive: true });

  // 4. Inicializar PGlite
  const pglite = new PGlite({
    dataDir: DATA_DIR,
  });

  // 5. Inicializar schema de base de datos
  await initializeDatabase(pglite);

  // 6. Sync: si hay conexión a Supabase, traer datos a PGlite
  if (supabaseConnected) {
    try {
      const supabase = dbManager.getClient();
      const syncer = new SyncService(supabase, pglite, SCHEMA_FILE);
      const result = await syncer.syncAll();
      if (result.failed.length > 0) {
        console.warn(`[OfflineServer] ⚠️ Sync completado con ${result.failed.length} errores`);
      } else {
        console.log(`[OfflineServer] ✅ Sync completado: ${result.synced} tablas, ${result.durationMs}ms`);
      }
    } catch (syncErr: any) {
      console.warn(`[OfflineServer] ⚠️ Sync falló: ${syncErr.message}`);
      console.warn('[OfflineServer] ⚠️ La BD local puede estar incompleta');
    }
  } else {
    console.warn('[OfflineServer] ⚠️ Sin conexión a Supabase. La BD local está vacía.');
  }

  // 7. Setear contraseña conocida para desarrollo (admin123)
  //    El hash real de Supabase no coincide con ninguna contraseña documentada,
  //    así que forzamos un hash conocido para poder hacer login.
  try {
    const defaultHash = await bcrypt.hash('admin123', 10);
    await pglite.query(
      `UPDATE "t_user_key" SET "KEY" = $1 WHERE "USER_ID" = 1 AND "STATUS" = 1`,
      [defaultHash]
    );
    console.log('[OfflineServer] 🔑 Contraseña admin123 seteada para usuario V00000000');
  } catch (pwErr: any) {
    console.warn('[OfflineServer] ⚠️ No se pudo setear contraseña por defecto:', pwErr.message);
  }

  // 8. Cambiar a modo offline y configurar adapter
  dbManager.setMode('offline');
  const adapter = new PGliteAdapter(pglite);
  dbManager.setOfflineAdapter(adapter);
  console.log('[OfflineServer] 🔄 Modo offline activado — todas las queries van a PGlite');

  // 8. Iniciar servidor Express
  const server: http.Server = app.listen(BACKEND_PORT, '127.0.0.1', () => {
    console.log(`\n🚀 Backend OFFLINE corriendo en http://localhost:${BACKEND_PORT}`);
    console.log(`📡 API endpoints: http://localhost:${BACKEND_PORT}/api/...`);
    console.log(`💡 Health check: http://localhost:${BACKEND_PORT}/api/health\n`);
  });

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ Puerto ${BACKEND_PORT} en uso. Cerrá el proceso o cambiá la variable PORT.`);
      process.exit(1);
    }
    console.error('❌ Error del servidor:', err);
    process.exit(1);
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.log('\n[OfflineServer] 👋 Cerrando servidor...');
    server.close();
    await (pglite as any).close?.();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error('[OfflineServer] ❌ Error fatal:', err);
  process.exit(1);
});
