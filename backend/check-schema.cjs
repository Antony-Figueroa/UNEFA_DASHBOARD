const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  (process.env.SUPABASE_URL || '').replace(/['`"]/g, ''),
  (process.env.SUPABASE_SERVICE_ROLE_KEY || '').replace(/['`"]/g, '')
);

(async () => {
  // Check t_persons columns
  const { data: p } = await supabase.from('t_persons').select('*').limit(1);
  if (p?.[0]) {
    console.log('t_persons columns:', Object.keys(p[0]).join(', '));
    console.log('Sample:', JSON.stringify(p[0], null, 2));
  }

  // Check if phone exists and values
  const { data: withPhone } = await supabase.from('t_persons').select('person_id, ci, phone, email').not('phone', 'is', null).limit(3);
  console.log('\nWith phone:', JSON.stringify(withPhone, null, 2));

  // Check the actual query data
  const { data: tp } = await supabase
    .from('t_professional_practices_tutor')
    .select(`
      TUTOR_ID,
      TUTOR_TYPE,
      t_tutors (
        TUTOR_ID,
        CONDITION, DEDICATION, CATEGORY, EMAIL,
        t_persons!inner (
          ci, first_name, middle_name, last_name, second_last_name, phone, email
        )
      ),
      t_professional_practices (
        PROFESSIONAL_PRACTICE_ID, PERIOD_ID,
        t_students (
          STUDENTS_ID, STUDENTS_CI, NAME, SECOND_NAME, SURNAME,
          SECOND_SURNAME, GENDER, STUDENT_TYPE, MILITARY_RANK, CONTACT_PHONE
        ),
        t_career (CAREER_ID, CAREER_NAME),
        t_professional_practices_tutor (
          TUTOR_TYPE,
          t_tutors (
            TUTOR_ID, TUTOR_CI, NAME, SECOND_NAME, SURNAME,
            SECOND_SURNAME, TITULO, CONTACT_PHONE, EMAIL
          )
        )
      )
    `)
    .eq('TUTOR_TYPE', 'ACADEMICO')
    .limit(3);

  console.log('\n\nQuery result count:', tp?.length || 0);
  if (tp?.[0]) {
    const first = tp[0];
    const tutor = first.t_tutors;
    const practice = first.t_professional_practices;
    
    console.log('\n=== TUTOR PERSONS ===');
    console.log(JSON.stringify(tutor?.t_persons, null, 2));
    console.log('Phone from getPersonField:', tutor?.t_persons?.phone || (Array.isArray(tutor?.t_persons) ? tutor.t_persons[0]?.phone : 'NOT FOUND'));
    
    console.log('\n=== PRACTICE STUDENT ===');
    const student = practice?.t_students;
    console.log('Student keys:', student ? Object.keys(student).join(', ') : 'null');
    console.log('Student data:', JSON.stringify(student, null, 2));
    
    console.log('\n=== PRACTICE TUTOR INST ===');
    const nestedTutors = practice?.t_professional_practices_tutor;
    console.log('Nested tutors count:', nestedTutors?.length || 0);
    console.log(JSON.stringify(nestedTutors, null, 2));
    
    console.log('\n=== INSTITUTION ===');
    const inst = practice?.t_institution;
    console.log('Institution keys:', inst ? Object.keys(inst).join(', ') : 'null');
  }
})();
