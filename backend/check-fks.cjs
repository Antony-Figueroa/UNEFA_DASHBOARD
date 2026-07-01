const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const s = createClient(
  (process.env.SUPABASE_URL || '').replace(/['`"]/g, ''),
  (process.env.SUPABASE_SERVICE_ROLE_KEY || '').replace(/['`"]/g, '')
);
(async () => {
  // Check FK relationships via information_schema
  const { data: fks } = await s.rpc('get_foreign_keys' as any);
  // Might not exist, try raw query
  const sql = `
    SELECT
      tc.constraint_name,
      tc.table_name,
      kcu.column_name,
      ccu.table_name AS foreign_table_name,
      ccu.column_name AS foreign_column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu
      ON tc.constraint_name = ccu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name IN ('t_professional_practices', 't_students', 't_tutors', 't_professional_practices_tutor')
    ORDER BY tc.table_name, kcu.column_name;
  `;
  const { data: fkData, error } = await s.rpc('exec_sql', { query: sql });
  if (error) {
    // Try direct query via REST
    const { data: pp } = await s.from('t_professional_practices').select('PROFESSIONAL_PRACTICE_ID, STUDENTS_ID, student_person_id, INSTITUTION_ID, CAREER_ID').limit(3);
    console.log('Practice sample:');
    console.log(JSON.stringify(pp, null, 2));
    
    // Check if student_person_id FK exists
    // by trying to join through it
    const { data: joinTest } = await s.from('t_professional_practices').select('PROFESSIONAL_PRACTICE_ID, student_person_id, t_persons!student_person_id(ci, first_name, last_name)').limit(3);
    console.log('\nJoin test via student_person_id:');
    console.log(JSON.stringify(joinTest, null, 2));
  } else {
    console.log('FKs:', JSON.stringify(fkData, null, 2));
  }
})();
