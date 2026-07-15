/**
 * Seed Full — esquema + datos completos (réplica exacta)
 *
 * Uso:
 *   npx tsx scripts/seed-full.ts               → Local Docker
 *   npx tsx scripts/seed-full.ts --cloud       → Supabase cloud
 *   npx tsx scripts/seed-full.ts --help        → Ayuda
 *   npx tsx scripts/seed-full.ts -y            → Sin confirmación
 */

import { runSeed } from './seed-runner';

await runSeed({
  sqlFile: 'seed-full.sql',
  label: 'Seed Full — esquema + datos completos',
});
