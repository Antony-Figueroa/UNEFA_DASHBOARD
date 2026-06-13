import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

interface Municipality { municipio: string; capital: string; parroquias: string[]; }
interface StateData { id_estado: number; estado: string; municipios: Municipality[]; }

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function normalize(s: string): string {
  return s.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

const UNPARSEABLE_WORDS = new Set(['no', 'se', 's/n', 'sn', 'sin', 'ninguna', 'vive', 'desconocida']);

function isUnparseable(addr: string): boolean {
  const words = addr.toLowerCase().split(/\s+/).filter(Boolean);
  return words.length <= 3 && words.every(w => UNPARSEABLE_WORDS.has(w) || w.length <= 2);
}

async function main() {
  const raw = JSON.parse(
    readFileSync(join(__dirname, '..', 'assets', 'venezuela.json'), 'utf-8')
  ) as StateData[];

  // Build lookup from JSON
  const estadoNormalized = new Map<string, string>();
  const municipioNormalized = new Map<string, string>();
  const parroquiaNormalized = new Map<string, string>();
  for (const st of raw) {
    const normE = normalize(st.estado);
    estadoNormalized.set(normE, st.estado);
    for (const mun of st.municipios) {
      const normM = normalize(mun.municipio);
      municipioNormalized.set(normM, mun.municipio);
      for (const par of mun.parroquias) {
        const normP = normalize(par);
        if (!parroquiaNormalized.has(normP)) parroquiaNormalized.set(normP, par);
      }
    }
  }

  // Get all DB records for ID lookup
  const [dbE, dbM, dbP] = await Promise.all([
    supabase.from('t_estado').select('estado_id, name'),
    supabase.from('t_municipio').select('municipio_id, name, estado_id'),
    supabase.from('t_parroquia').select('parroquia_id, name, municipio_id'),
  ]);

  const estadoDb = new Map<string, number>();
  const municipioDb = new Map<string, { id: number; estadoId: number }>();
  const parroquiaDb = new Map<string, { id: number; municipioId: number }>();

  for (const e of dbE.data || []) estadoDb.set(normalize(e.name), e.estado_id);
  for (const m of dbM.data || []) municipioDb.set(normalize(m.name), { id: m.municipio_id, estadoId: m.estado_id });
  for (const p of dbP.data || []) parroquiaDb.set(normalize(p.name), { id: p.parroquia_id, municipioId: p.municipio_id });

  // Get already-linked persons and institutions (idempotency guard)
  const [linkedPersons, linkedInstitutions] = await Promise.all([
    supabase.from('t_person_address').select('person_id'),
    supabase.from('t_institution_address').select('institution_id'),
  ]);
  const alreadyLinkedPerson = new Set((linkedPersons.data || []).map(r => r.person_id));
  const alreadyLinkedInstitution = new Set((linkedInstitutions.data || []).map(r => r.institution_id));

  let created = 0, skipped = 0;

  // ── Migrate institutions ──
  const { data: institutions } = await supabase
    .from('t_institution')
    .select('INSTITUTION_ID, INSTITUTION_ADDRESS')
    .neq('INSTITUTION_ADDRESS', '')
    .not('INSTITUTION_ADDRESS', 'is', null);

  for (const inst of institutions || []) {
    const instId = inst.INSTITUTION_ID;
    if (alreadyLinkedInstitution.has(instId)) { skipped++; continue; }

    const addr: string = inst.INSTITUTION_ADDRESS;
    if (!addr || isUnparseable(addr)) { skipped++; continue; }

    const parts = addr.split(',').map((s: string) => s.trim()).filter(Boolean);
    let estadoName = '', municipioName = '', parroquiaName = '', street = '';

    // Known format: REGION, NUCLEO, EXTENSION, TYPE, ESTADO, MUNICIPIO, PARROQUIA, STREET
    if (parts.length >= 8) {
      estadoName = parts[4]; municipioName = parts[5]; parroquiaName = parts[6];
      street = parts.slice(7).join(', ');
    } else {
      for (const p of parts) {
        const norm = normalize(p);
        if (!estadoName && estadoNormalized.has(norm)) estadoName = p;
        else if (!municipioName && municipioNormalized.has(norm)) municipioName = p;
        else if (!parroquiaName && parroquiaNormalized.has(norm)) parroquiaName = p;
        else street = street ? `${street}, ${p}` : p;
      }
    }

    const normP = normalize(parroquiaName);
    const parRecord = parroquiaDb.get(normP);
    if (!parRecord) { skipped++; continue; }

    const result = await supabase.from('t_address')
      .insert({ parroquia_id: parRecord.id, street_address: street.toUpperCase() })
      .select('address_id').single();
    if (result.error) { skipped++; continue; }

    const bridge = await supabase.from('t_institution_address').insert({
      institution_id: instId, address_id: result.data.address_id,
      address_type_id: 4, is_primary: true,
    });
    if (bridge.error) { console.error('inst bridge error:', bridge.error); skipped++; continue; }
    created++;
  }

  // ── Migrate persons ──
  const { data: persons } = await supabase
    .from('t_persons')
    .select('person_id, address')
    .neq('address', '')
    .not('address', 'is', null);

  for (const person of persons || []) {
    if (alreadyLinkedPerson.has(person.person_id)) { skipped++; continue; }

    const addr: string = person.address;
    if (!addr || isUnparseable(addr)) { skipped++; continue; }

    const normAddr = normalize(addr);
    let foundParroquia: { id: number; municipioId: number } | null = null;

    // Match parroquia name in text
    for (const [norm, record] of parroquiaDb) {
      if (normAddr.includes(norm)) { foundParroquia = record; break; }
    }
    if (!foundParroquia) { skipped++; continue; }

    const result = await supabase.from('t_address')
      .insert({ parroquia_id: foundParroquia.id, street_address: addr.toUpperCase() })
      .select('address_id').single();
    if (result.error) { skipped++; continue; }

    const bridge = await supabase.from('t_person_address').insert({
      person_id: person.person_id, address_id: result.data.address_id,
      address_type_id: 3, is_primary: true,
    });
    if (bridge.error) { console.error('person bridge error:', bridge.error); skipped++; continue; }
    created++;
  }

  console.log(`Migration: created=${created}, skipped=${skipped}`);
}

main().catch(console.error);
