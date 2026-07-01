const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const s = createClient(
  (process.env.SUPABASE_URL || '').replace(/['`"]/g, ''),
  (process.env.SUPABASE_SERVICE_ROLE_KEY || '').replace(/['`"]/g, '')
);
(async () => {
  const { data: links } = await s.from('t_professional_practices_tutor').select('TUTOR_ID, PROFESSIONAL_PRACTICE_ID, TUTOR_TYPE').eq('TUTOR_TYPE', 'ACADEMICO').limit(5);
  console.log('Links:', JSON.stringify(links, null, 2));
  if (links?.[0]) {
    const ppId = links[0].PROFESSIONAL_PRACTICE_ID;
    console.log('\n--- Practice ID:', ppId);
    const { data: pp } = await s.from('t_professional_practices').select('*').eq('PROFESSIONAL_PRACTICE_ID', ppId).single();
    console.log('Practice:', JSON.stringify(pp, null, 2));
    if (pp?.STUDENTS_ID) {
      const { data: stu } = await s.from('t_students').select('*').eq('STUDENTS_ID', pp.STUDENTS_ID).single();
      console.log('\nStudent:', JSON.stringify(stu, null, 2));
    }
    if (pp?.INSTITUTION_ID) {
      const { data: inst } = await s.from('t_institution').select('*').eq('INSTITUTION_ID', pp.INSTITUTION_ID).single();
      console.log('\nInstitution:', JSON.stringify(inst, null, 2));
    }
    const tutorId = links[0].TUTOR_ID;
    console.log('\n--- Tutor ID:', tutorId);
    const { data: tutor } = await s.from('t_tutors').select('*').eq('TUTOR_ID', tutorId).single();
    console.log('Tutor:', JSON.stringify(tutor, null, 2));
    if (tutor?.PERSON_ID) {
      const { data: person } = await s.from('t_persons').select('*').eq('person_id', tutor.PERSON_ID).single();
      console.log('\nPerson:', JSON.stringify(person, null, 2));
    }
  }
})();
