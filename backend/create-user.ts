// create-user.ts — Crea usuario 00000000 / Admin123! en Supabase local
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const url = 'http://127.0.0.1:54321';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.***REMOVED***';
const supabase = createClient(url, key, { auth: { persistSession: false } });

async function main() {
  // 1. Check local schema for t_persons
  const { data: cols } = await supabase.from('t_persons').select('*').limit(1);
  const personCols = cols && cols.length > 0 ? Object.keys(cols[0]) : [];
  console.log('[PERSON] Columns: ' + personCols.join(', '));

  // Try CI primary, fall back to lowercase 'ci'
  const ciCol = personCols.includes('CI') ? 'CI' : 'ci';
  const nameCol = personCols.includes('FIRST_NAME') ? 'FIRST_NAME' : 'first_name';
  const surnameCol = personCols.includes('FIRST_SURNAME') ? 'FIRST_SURNAME' : 'last_name';
  const emailCol = personCols.includes('EMAIL') ? 'EMAIL' : 'email';
  const genderCol = personCols.includes('GENDER') ? 'GENDER' : 'gender';
  const statusCol = personCols.includes('STATUS') ? 'STATUS' : 'status';

  const { data: existing } = await supabase.from('t_persons').select('person_id').eq(ciCol, '00000000').maybeSingle();
  let personId: number;
  if (existing) {
    personId = existing.person_id;
    console.log('[PERSON] Already exists, id=' + personId);
  } else {
    const personData: any = {};
    personData[ciCol] = '00000000';
    personData[nameCol] = 'ADMIN';
    personData[surnameCol] = 'SISTEMA';
    if (personCols.includes('SECOND_NAME')) personData['SECOND_NAME'] = null;
    if (personCols.includes('middle_name')) personData['middle_name'] = null;
    if (personCols.includes('SECOND_SURNAME')) personData['SECOND_SURNAME'] = null;
    if (personCols.includes('second_last_name')) personData['second_last_name'] = null;
    personData[genderCol] = 'M';
    personData[emailCol] = 'admin@sistema.com';
    if (personCols.includes('PHONE_NUMBER')) personData['PHONE_NUMBER'] = null;
    if (personCols.includes('phone')) personData['phone'] = null;
    personData[statusCol] = 1;

    const { data: p, error: pe } = await supabase.from('t_persons').insert(personData).select().single();
    if (pe) { console.log('[PERSON] ERROR: ' + pe.message); return; }
    personId = p.person_id;
    console.log('[PERSON] Created, id=' + personId);
  }

  // 2. Check user columns
  const { data: ucols } = await supabase.from('t_user').select('*').limit(1);
  const userCols = ucols && ucols.length > 0 ? Object.keys(ucols[0]) : [];
  console.log('[USER] Columns: ' + userCols.join(', '));

  const userCiCol = userCols.includes('USER_CI') ? 'USER_CI' : 'user_ci';
  const userNameCol = userCols.includes('NAME') ? 'NAME' : 'name';
  const userEmailCol = userCols.includes('EMAIL') ? 'EMAIL' : 'email';
  const userPassCol = userCols.includes('PASSWORD') ? 'PASSWORD' : 'password';
  const userStatusCol = userCols.includes('STATUS') ? 'STATUS' : 'status';

  const { data: existingUser } = await supabase.from('t_user').select('USER_ID').eq(userCiCol, '00000000').maybeSingle();
  if (existingUser) {
    console.log('[USER] Already exists, id=' + existingUser.USER_ID);
    return;
  }

  const hash = await bcrypt.hash('Admin123!', 10);
  const userData: any = {};
  userData[userCiCol] = '00000000';
  userData[userNameCol] = 'ADMIN SISTEMA';
  userData[userEmailCol] = 'admin@sistema.com';
  userData[userPassCol] = hash;
  userData[userStatusCol] = 1;
  userData['person_id'] = personId;
  if (userCols.includes('CREATION_DATE')) userData['CREATION_DATE'] = new Date().toISOString();
  if (userCols.includes('created_at')) userData['created_at'] = new Date().toISOString();

  const { data: u, error: ue } = await supabase.from('t_user').insert(userData).select().single();
  if (ue) { console.log('[USER] ERROR: ' + ue.message); return; }
  console.log('[USER] ✅ Created, USER_ID=' + u.USER_ID + '  CI=00000000 / Admin123!');
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
