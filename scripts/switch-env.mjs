import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const MODE = process.argv[2]?.toLowerCase();
if (!['local', 'cloud'].includes(MODE)) {
  console.log('Uso: node scripts/switch-env.mjs [local|cloud]'); process.exit(1);
}

const K = {
  local: {
    url: 'http://127.0.0.1:54321',
    anon: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
    svc: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU',
  },
  cloud: {
    url: 'https://rgvnwslyvixviypgegra.supabase.co',
    anon: 'sb_publishable_ZKn6i60l4mOlaQf13Pk08A_2JaEJMDo',
    svc: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJndm53c2x5dml4dml5cGdlZ3JhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Nzg5MzA0NywiZXhwIjoyMDgzNDY5MDQ3fQ.DPCy1Mcz__uFfmgy-1czBxVTUUghRx6oOa84LPBI0kY',
    jwt: 'FvR/3O/wJqrjxx8GcqPuLx+03M924jr8G8pZsJRzeM9zIeh4c+h5ghBwFL0R0lchSVi+glIeJlD4jV0/FasvUg==',
  },
};

// ── Root .env ──
let root = readFileSync(join(ROOT, '.env'), 'utf-8');
for (const [key, val] of Object.entries({ VITE_SUPABASE_URL: K[MODE].url, VITE_SUPABASE_ANON_KEY: K[MODE].anon, NEXT_PUBLIC_SUPABASE_URL: K[MODE].url, NEXT_PUBLIC_SUPABASE_ANON_KEY: K[MODE].anon }))
  root = root.replace(new RegExp(`^${key}=.*$`, 'm'), `${key}=${val}`);
writeFileSync(join(ROOT, '.env'), root);

// ── Backend .env ──
let be = readFileSync(join(ROOT, 'backend', '.env'), 'utf-8');
const local = `# LOCAL MODE\nSUPABASE_URL=${K.local.url}\nSUPABASE_ANON_KEY=${K.local.anon}\nSUPABASE_SERVICE_ROLE_KEY=${K.local.svc}\n`;
const cloud = `# CLOUD MODE\nSUPABASE_URL=${K.cloud.url}\nSUPABASE_ANON_KEY=${K.cloud.anon}\nSUPABASE_SERVICE_ROLE_KEY=${K.cloud.svc}\nSUPABASE_JWT_SECRET=${K.cloud.jwt}\n`;

be = MODE === 'local'
  ? be.replace(/# LOCAL MODE\n(?:#?SUPABASE_.*\n)+/, local)
       .replace(/# CLOUD.*\n(?:#?SUPABASE_.*\n)+/, v => v.split('\n').map(l => l.startsWith('#') || !l.trim() ? l : `#${l}`).join('\n'))
       .replace(/^NEXT_PUBLIC_SUPABASE_URL=.*$/m, `NEXT_PUBLIC_SUPABASE_URL=${K.local.url}`)
       .replace(/^NEXT_PUBLIC_SUPABASE_ANON_KEY=.*$/m, `NEXT_PUBLIC_SUPABASE_ANON_KEY=${K.local.anon}`)
  : be.replace(/# LOCAL MODE\n(?:#?SUPABASE_.*\n)+/, '# LOCAL MODE (comentado)\n' + local.split('\n').map(l => l.startsWith('#') ? l : `#${l}`).join('\n') + '\n')
       .replace(/# CLOUD.*\n(?:#?SUPABASE_.*\n)+/, cloud)
       .replace(/^NEXT_PUBLIC_SUPABASE_URL=.*$/m, `NEXT_PUBLIC_SUPABASE_URL=${K.cloud.url}`)
       .replace(/^NEXT_PUBLIC_SUPABASE_ANON_KEY=.*$/m, `NEXT_PUBLIC_SUPABASE_ANON_KEY=${K.cloud.anon}`);
writeFileSync(join(ROOT, 'backend', '.env'), be);

// ── Post-hook: grants ──
if (MODE === 'local') {
  try {
    execSync(`psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" -c "GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role; GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role; GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role; GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;"`, { stdio: 'pipe', windowsHide: true });
  } catch { /* ya existen o no hay psql */ }
}

console.log(`✅ Switched to ${MODE.toUpperCase()} Supabase`);
