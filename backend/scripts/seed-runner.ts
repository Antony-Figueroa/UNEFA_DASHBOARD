/**
 * Seed runner — shared utility for seed-empty.sql and seed-full.sql
 *
 * Usage:
 *   npx tsx scripts/seed-empty.ts          → local Docker (default)
 *   npx tsx scripts/seed-empty.ts --cloud  → remote Supabase
 *   npx tsx scripts/seed-empty.ts --help
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import * as readline from 'readline';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONTAINER = 'supabase_db_UNEFA_DASHBOARD';

// ─── CLI parsing ───────────────────────────────────────────

export interface SeedOptions {
  sqlFile: string;
  label: string;
}

function parseArgs(): { cloud: boolean; help: boolean; noConfirm: boolean } {
  const args = process.argv.slice(2);
  return {
    cloud: args.includes('--cloud'),
    help: args.includes('--help') || args.includes('-h'),
    noConfirm: args.includes('--no-confirm') || args.includes('-y'),
  };
}

function printHelp(label: string, sqlFile: string): void {
  const tsFile = sqlFile.replace(/\.sql$/, '.ts');
  console.log(`
  ${label}
  ──────────────────────────────────────────────

  Uso:
    npx tsx scripts/${tsFile}                  → Local Docker (default)
    npx tsx scripts/${tsFile} --cloud          → Remoto Supabase
    npx tsx scripts/${tsFile} --no-confirm     → Sin pedir confirmación
    npx tsx scripts/${tsFile} --help           → Esta ayuda

  Flags:
    --cloud        Ejecutar contra Supabase cloud (requiere SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY)
    --no-confirm   Saltar la confirmación interactiva
    -y             Igual a --no-confirm
    -h, --help     Mostrar esta ayuda

  Variables de entorno (para --cloud):
    SUPABASE_URL                URL del proyecto Supabase
    SUPABASE_SERVICE_ROLE_KEY   Service role key
  `);
}

// ─── Confirmation prompt ──────────────────────────────────

async function confirm(message: string): Promise<boolean> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(`\n${message} (y/N): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y');
    });
  });
}

// ─── SQL statement splitter (handles $function$ blocks) ───

export function splitStatements(sql: string): string[] {
  const statements: string[] = [];
  let current = '';
  let inFunction = false;

  for (const line of sql.split('\n')) {
    current += line + '\n';

    // Track $function$ delimiters — odd count flips state
    const matches = line.match(/\$function\$/g);
    if (matches && matches.length % 2 === 1) {
      inFunction = !inFunction;
    }

    // Flush on blank line outside function blocks
    if (!inFunction && line.trim() === '' && current.trim()) {
      statements.push(current.trim());
      current = '';
    }
  }

  if (current.trim()) {
    statements.push(current.trim());
  }

  return statements;
}

// ─── Local execution (docker exec psql) ───────────────────

function runLocal(sqlPath: string, label: string): void {
  console.log(`\n  Modo:    Local (Docker)`);
  console.log(`  Archivo: ${label}`);
  console.log(`  Container: ${CONTAINER}`);

  const sql = readFileSync(sqlPath, 'utf8');
  const lineCount = sql.split('\n').length;
  const sizeKB = (Buffer.byteLength(sql, 'utf8') / 1024).toFixed(0);
  console.log(`  Tamaño:  ${lineCount} líneas, ${sizeKB} KB\n`);

  const start = Date.now();
  try {
    execSync(
      `docker exec -i ${CONTAINER} psql -U postgres -v ON_ERROR_STOP=0`,
      { input: sql, encoding: 'utf8', timeout: 600_000 },
    );
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`\n  ✅ Completado en ${elapsed}s`);
  } catch (e: any) {
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    // psql may exit with code 1 on some errors but still apply most statements
    console.error(`\n  ⚠️  psql terminó con errores (${elapsed}s)`);
    if (e.stdout) console.log(e.stdout.toString().slice(-2000));
    if (e.stderr) console.error(e.stderr.toString().slice(-2000));
  }
}

// ─── Cloud execution (Supabase RPC) ───────────────────────

async function runCloud(sqlPath: string, label: string): Promise<void> {
  // Dynamic import — only needed in cloud mode
  const { createClient } = await import('@supabase/supabase-js');

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    console.error('\n  ❌ Para --cloud definí SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  console.log(`\n  Modo:    Cloud (Supabase)`);
  console.log(`  Archivo: ${label}`);
  console.log(`  URL:     ${url}`);

  const sb = createClient(url, key, { auth: { persistSession: false } });

  // Quick connectivity check — if execute_sql doesn't exist, bail early
  const { error: probeErr } = await sb.rpc('execute_sql', { sql: 'SELECT 1' });
  if (probeErr && probeErr.message.includes('function') && probeErr.message.includes('does not exist')) {
    console.error('\n  ❌ La función execute_sql no existe en la base de datos.');
    console.error('     Creala una vez desde el SQL Editor de Supabase:');
    console.error('     CREATE OR REPLACE FUNCTION execute_sql(sql text)');
    console.error('       RETURNS void LANGUAGE plpgsql SECURITY DEFINER');
    console.error('     AS $$ BEGIN EXECUTE sql; END; $$;');
    process.exit(1);
  }

  const sql = readFileSync(sqlPath, 'utf8');
  const statements = splitStatements(sql);
  const sizeKB = (Buffer.byteLength(sql, 'utf8') / 1024).toFixed(0);
  console.log(`  Statements: ${statements.length} (${sizeKB} KB)\n`);

  let success = 0;
  let skipped = 0;
  let errors = 0;
  const start = Date.now();

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];

    // Skip pure comment blocks
    const nonEmpty = stmt.split('\n').filter((l) => l.trim() !== '');
    if (nonEmpty.length === 0 || nonEmpty.every((l) => l.trim().startsWith('--'))) {
      skipped++;
      continue;
    }

    try {
      const { error } = await sb.rpc('execute_sql', { sql: stmt });
      if (error) {
        // Some errors are expected (e.g., "already exists") — log but continue
        const msg = error.message || '';
        if (msg.includes('already exists') || msg.includes('does not exist, skipping')) {
          skipped++;
        } else {
          errors++;
          process.stderr.write(`\n  ⚠️  #${i + 1}: ${msg.slice(0, 150)}`);
        }
      } else {
        success++;
      }
    } catch {
      errors++;
    }

    // Progress every 50 statements
    if ((i + 1) % 50 === 0 || i === statements.length - 1) {
      const elapsed = ((Date.now() - start) / 1000).toFixed(0);
      process.stdout.write(
        `\r  Progreso: ${i + 1}/${statements.length}  ✅ ${success}  ⏭ ${skipped}  ⚠️ ${errors}  (${elapsed}s)`,
      );
    }
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  console.log(`\n\n  ✅ Completado en ${elapsed}s — ${success} OK, ${skipped} skipped, ${errors} errores`);
}

// ─── Main entry point ─────────────────────────────────────

export async function runSeed(options: SeedOptions): Promise<void> {
  const { sqlFile, label } = options;
  const { cloud, help, noConfirm } = parseArgs();

  if (help) {
    printHelp(label, sqlFile);
    process.exit(0);
  }

  const sqlPath = resolve(__dirname, sqlFile);

  console.log(`\n  🌱 UNEFA Dashboard — ${label}`);
  console.log(`  ─────────────────────────────────────────`);

  if (!noConfirm) {
    const target = cloud ? 'Supabase cloud' : 'base local (Docker)';
    const proceed = await confirm(`  Esto aplicará el seed a ${target}. ¿Continuar?`);
    if (!proceed) {
      console.log('  Cancelado.');
      process.exit(0);
    }
  }

  if (cloud) {
    await runCloud(sqlPath, label);
  } else {
    runLocal(sqlPath, label);
  }
}
