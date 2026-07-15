/**
 * Seed Empty — esquema + datos esenciales (referencia)
 *
 * Uso:
 *   npx tsx scripts/seed-empty.ts              → Local Docker
 *   npx tsx scripts/seed-empty.ts --cloud      → Supabase cloud
 *   npx tsx scripts/seed-empty.ts --help       → Ayuda
 *   npx tsx scripts/seed-empty.ts -y           → Sin confirmación
 */

import { runSeed } from './seed-runner';

await runSeed({
  sqlFile: 'seed-empty.sql',
  label: 'Seed Empty — esquema + datos esenciales',
});
