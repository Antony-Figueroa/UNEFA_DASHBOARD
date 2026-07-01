const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const s = createClient(
  (process.env.SUPABASE_URL || '').replace(/['`"]/g, ''),
  (process.env.SUPABASE_SERVICE_ROLE_KEY || '').replace(/['`"]/g, '')
);
(async () => {
  // 1. Check ALL academic tutors, get person_id from t_tutors, then check t_persons for phone
  const { data: tutors } = await s.from('t_tutors').select('TUTOR_ID, person_id, CONTACT_PHONE, CONDITION, DEDICATION, CATEGORY').limit(10);
  console.log('All tutors (first 10):');
  for (const t of tutors || []) {
    if (t.person_id) {
      const { data: p } = await s.from('t_persons').select('person_id, ci, first_name, last_name, phone, email').eq('person_id', t.person_id).single();
      console.log(`  TUTOR_ID=${t.TUTOR_ID} person_id=${t.person_id} t_persons.phone="${p?.phone}" ci="${p?.ci}" name="${p?.first_name} ${p?.last_name}"`);
    }
  }

  // 2. Check what the working relacion-individual-docente endpoint uses
  console.log('\n\n--- Check student_person_id approach ---');
  const { data: practices } = await s.from('t_professional_practices').select('PROFESSIONAL_PRACTICE_ID, STUDENTS_ID, student_person_id, CAREER_ID, INSTITUTION_ID').limit(5);
  for (const pp of practices || []) {
    if (pp.student_person_id) {
      const { data: p } = await s.from('t_persons').select('person_id, ci, first_name, last_name, phone, email').eq('person_id', pp.student_person_id).single();
      console.log(`  Practice ${pp.PROFESSIONAL_PRACTICE_ID}: student_person_id=${pp.student_person_id} => "${p?.first_name} ${p?.last_name}" ci="${p?.ci}" phone="${p?.phone}"`);
    }
  }

  // 3. Check institution column names
  console.log('\n\n--- Institution columns ---');
  const { data: inst } = await s.from('t_institution').select('*').limit(1);
  if (inst?.[0]) {
    console.log('Columns:', Object.keys(inst[0]).join(', '));
  }
})();
