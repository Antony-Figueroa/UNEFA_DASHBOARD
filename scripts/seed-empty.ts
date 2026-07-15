// =============================================================================
// seed-empty.ts — Run seed-empty.sql against any PostgreSQL database
// =============================================================================
// Usage:
//   npx tsx scripts/seed-empty.ts --local       # localhost:5432 postgres/postgres
//   npx tsx scripts/seed-empty.ts --cloud PW     # Supabase cloud (PW = db password)
//   npx tsx scripts/seed-empty.ts "postgresql://..."  # custom connection string
//   npx tsx scripts/seed-empty.ts --help          # this message
//
// Flags:
//   --yes    skip 5-second confirmation wait
// =============================================================================

import { spawnSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');
const SEED_FILE = path.join(PROJECT_ROOT, 'backend', 'src', 'seed', 'seed-empty.sql');
const SEED_FULL = path.join(PROJECT_ROOT, 'backend', 'src', 'seed', 'seed-full.sql');

// ─── Parse args ───
const args = process.argv.slice(2);
const flags = new Set(args.filter(a => a.startsWith('--')));
const params = args.filter(a => !a.startsWith('--'));

if (flags.has('--help')) {
  console.log(`
seed-empty.ts — Run seed against any PostgreSQL database

Usage:
  npx tsx scripts/seed-empty.ts --local
  npx tsx scripts/seed-empty.ts --cloud DB_PASSWORD
  npx tsx scripts/seed-empty.ts "postgresql://..."
  npx tsx scripts/seed-empty.ts --full --cloud DB_PASSWORD   # use seed-full.sql instead

Flags:
  --yes    skip 5-second confirmation
  --full   use seed-full.sql instead of seed-empty.sql
`);
  process.exit(0);
}

const useFull = flags.has('--full');
const seedFile = useFull ? SEED_FULL : SEED_FILE;
const seedName = useFull ? 'seed-full.sql' : 'seed-empty.sql';
const skipConfirm = flags.has('--yes');

// Build database URL
let databaseUrl = '';

if (params.length > 0 && (params[0].startsWith('postgresql://') || params[0].startsWith('postgres://'))) {
  databaseUrl = params[0];
} else if (flags.has('--cloud')) {
  const pw = params[0] || process.env.SUPABASE_DB_PASSWORD || '';
  if (!pw) {
    console.error('❌ Need database password.');
    console.error('   Usage: npx tsx scripts/seed-empty.ts --cloud DB_PASSWORD');
    console.error('   Or set SUPABASE_DB_PASSWORD in .env');
    console.error('');
    console.error('   Get password from: Supabase Dashboard → Project Settings → Database');
    process.exit(1);
  }
  databaseUrl = `postgresql://postgres:${pw}@db.rgvnwslyvixviypgegra.supabase.co:5432/postgres`;
} else if (flags.has('--local')) {
  databaseUrl = 'postgresql://postgres:postgres@localhost:5432/postgres';
} else {
  console.error('❌ Unknown option. Use --cloud PW, --local, or a connection string.');
  console.error('   Try: npx tsx scripts/seed-empty.ts --help');
  process.exit(1);
}

// ─── Check psql ───
const psqlCheck = spawnSync('where', ['psql'], { shell: true });
if (psqlCheck.status !== 0) {
  console.error('❌ psql not found in PATH.');
  console.error('   Install: https://www.postgresql.org/download/');
  console.error('   Or add psql to your PATH (usually C:\\Program Files\\PostgreSQL\\17\\bin)');
  process.exit(1);
}

// ─── Check seed file ───
if (!fs.existsSync(seedFile)) {
  console.error(`❌ Seed file not found: ${seedFile}`);
  process.exit(1);
}

// ─── Show summary ───
console.log('');
console.log(`  📄 Seed: ${seedName}`);
console.log(`  🗄️  DB:  ${databaseUrl.replace(/\/\/.*@/, '//***@')}`);
console.log(`  📦 Size: ${(fs.statSync(seedFile).size / 1024).toFixed(0)} KB`);
console.log('');

if (!skipConfirm) {
  console.log('⚠️  This will DROP existing objects and recreate from scratch!');
  console.log('   Press Ctrl+C to cancel, or wait 5 seconds...');
  await new Promise(r => setTimeout(r, 5000));
}

// ─── Run ───
console.log('🚀 Running...');
const result = spawnSync('psql', [
  databaseUrl,
  '-f', seedFile,
  '--set', 'ON_ERROR_STOP=on',
], {
  stdio: 'inherit',
  shell: true,
  timeout: 180000,
});

if (result.status === 0) {
  console.log(`✅ ${seedName} completed successfully!`);
} else {
  console.error(`❌ Seed failed (exit code ${result.status})`);
  process.exit(result.status);
}
