// create-user.ts — Crea usuario Admin (CI 00000000 / Admin123!) en Supabase local
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const url = process.env.SUPABASE_URL || 'http://127.0.0.1:54321';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!key) throw new Error('Set SUPABASE_SERVICE_ROLE_KEY env var before running');
const supabase = createClient(url, key, { auth: { persistSession: false } });

const ADMIN_CI = 'V00000000';
const ADMIN_PASSWORD = 'Admin123!';

async function main() {
  // 0. Clean up orphaned records from previous run with wrong CI format
  await cleanupOldRecords();

  // 1. Create or find person (t_persons — lowercase columns per schema)
  const { data: existingPerson } = await supabase
    .from('t_persons')
    .select('person_id')
    .eq('ci', ADMIN_CI)
    .maybeSingle();

  let personId: number;
  if (existingPerson) {
    personId = existingPerson.person_id;
    console.log(`[PERSON] Already exists, id=${personId}`);
  } else {
    const { data: p, error: pe } = await supabase
      .from('t_persons')
      .insert({
        ci: ADMIN_CI,
        first_name: 'ADMIN',
        middle_name: null,
        last_name: 'SISTEMA',
        second_last_name: null,
        email: 'admin@sistema.com',
        phone: null,
        gender: 'M',
        status: 1,
      })
      .select('person_id')
      .single();
    if (pe) { console.error('[PERSON] ERROR:', pe.message); return; }
    personId = p.person_id;
    console.log(`[PERSON] Created, id=${personId}`);
  }

  // 2. Create or find user (t_user — UPPERCASE columns per schema)
  const { data: existingUser } = await supabase
    .from('t_user')
    .select('USER_ID')
    .eq('USER_CI', ADMIN_CI)
    .maybeSingle();

  if (existingUser) {
    console.log(`[USER] Already exists, USER_ID=${existingUser.USER_ID}`);
    // Still ensure password key exists
    await ensurePasswordKey(existingUser.USER_ID);
    return;
  }

  const { data: u, error: ue } = await supabase
    .from('t_user')
    .insert({
      person_id: personId,
      USER: 'admin',
      USER_CI: ADMIN_CI,
      NAME: 'ADMIN',
      SECOND_NAME: null,
      SURNAME: 'SISTEMA',
      SECOND_SURNAME: null,
      EMAIL: 'admin@sistema.com',
      PHONE_NUMBER: null,
      CREATION_DATE: new Date().toISOString(),
      LOGIN: 0,
      TERMS_CONDITIONS: 'A',
      STATUS_SESSION: 0,
      STATUS: 1,
    })
    .select('USER_ID')
    .single();
  if (ue) { console.error('[USER] ERROR:', ue.message); return; }

  console.log(`[USER] Created, USER_ID=${u.USER_ID}`);

  // 3. Insert password in t_user_key
  await ensurePasswordKey(u.USER_ID);

  // 4. Assign admin role in t_user_roles
  await assignAdminRole(u.USER_ID);

  console.log(`[DONE] User ready — CI=${ADMIN_CI} / Password=${ADMIN_PASSWORD}`);
}

async function cleanupOldRecords() {
  // Remove orphaned records from previous run where CI was stored without prefix
  const { data: oldUser } = await supabase
    .from('t_user')
    .select('USER_ID, person_id')
    .eq('USER_CI', '00000000')
    .maybeSingle();

  if (oldUser) {
    // Delete password key first (FK dependency)
    await supabase.from('t_user_key').delete().eq('USER_ID', oldUser.USER_ID);
    // Delete user
    await supabase.from('t_user').delete().eq('USER_ID', oldUser.USER_ID);
    // Delete person
    if (oldUser.person_id) {
      await supabase.from('t_persons').delete().eq('person_id', oldUser.person_id);
    }
    console.log('[CLEANUP] Removed old records with CI=00000000');
  }
}

const ADMIN_ROLE_ID = 1; // Admin role in t_roles

async function assignAdminRole(userId: number) {
  const { data: existing } = await supabase
    .from('t_user_roles')
    .select('ID_USER')
    .eq('ID_USER', userId)
    .eq('ID_ROLES', ADMIN_ROLE_ID)
    .maybeSingle();

  if (existing) {
    console.log(`[ROLE] Admin role already assigned for USER_ID=${userId}`);
    return;
  }

  const { error } = await supabase
    .from('t_user_roles')
    .insert({ ID_USER: userId, ID_ROLES: ADMIN_ROLE_ID });

  if (error) { console.error('[ROLE] ERROR:', error.message); return; }
  console.log(`[ROLE] Admin role (ID_ROLES=${ADMIN_ROLE_ID}) assigned to USER_ID=${userId}`);
}

async function ensurePasswordKey(userId: number) {
  const { data: existing } = await supabase
    .from('t_user_key')
    .select('USER_KEY_ID')
    .eq('USER_ID', userId)
    .maybeSingle();

  if (existing) {
    console.log(`[KEY] Password key already exists for USER_ID=${userId}`);
    return;
  }

  const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const now = new Date().toISOString();

  const { error } = await supabase
    .from('t_user_key')
    .insert({
      USER_ID: userId,
      KEY: hash,
      START_DATE: now,
      END_DATE: '2099-12-31T23:59:59.000Z',
      MODIF_USER_ID: 0,
      MODIF_USER_DATE: now,
      ELIM_USER_ID: 0,
      ELIM_USER_DATE: now,
      REST_USER_ID: 0,
      REST_USER_DATE: now,
      STATUS: 1,
      IS_TEMPORARY: false,
    });

  if (error) { console.error('[KEY] ERROR:', error.message); return; }
  console.log(`[KEY] Password hash stored for USER_ID=${userId}`);
}

main().then(() => { process.exitCode = 0; }).catch(e => { console.error(e); process.exitCode = 1; });
