import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan credenciales de Supabase');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addMissingColumns() {
  console.log('🔧 Agregando columnas faltantes...\n');

  try {
    // 1. Agregar USER_ID a t_tutors
    console.log('1. Verificando columna USER_ID en t_tutors...');
    
    // Intentar hacer un select para ver si la columna existe
    const { error: checkTutorError } = await supabase
      .from('t_tutors')
      .select('USER_ID')
      .limit(1);

    if (checkTutorError && checkTutorError.message.includes('column') && checkTutorError.message.includes('does not exist')) {
      console.log('   Columna USER_ID no existe, agregando...');
      
      // Ejecutar SQL directo para agregar la columna
      const { error: alterError } = await supabase.rpc('exec_sql', {
        sql: 'ALTER TABLE "t_tutors" ADD COLUMN "USER_ID" INTEGER REFERENCES "t_user"("USER_ID");'
      });

      if (alterError) {
        // Si no hay función RPC, mostrar instrucciones manuales
        console.log('\n⚠️  No se puede ejecutar SQL directamente desde el cliente.');
        console.log('📝 Ejecuta este SQL en Supabase Dashboard > SQL Editor:\n');
        console.log('--'.repeat(30));
        console.log('ALTER TABLE "t_tutors" ADD COLUMN "USER_ID" INTEGER REFERENCES "t_user"("USER_ID");');
        console.log('ALTER TABLE "t_students" ADD COLUMN "USER_ID" INTEGER REFERENCES "t_user"("USER_ID");');
        console.log('--'.repeat(30));
        console.log('\nLuego vuelve a ejecutar: npx tsx scripts/setup-tutor-user.ts');
        return;
      }
      console.log('✅ Columna USER_ID agregada a t_tutors');
    } else {
      console.log('✅ Columna USER_ID ya existe en t_tutors');
    }

    // 2. Verificar t_students
    console.log('\n2. Verificando columna USER_ID en t_students...');
    const { error: checkStudentError } = await supabase
      .from('t_students')
      .select('USER_ID')
      .limit(1);

    if (checkStudentError && checkStudentError.message.includes('column') && checkStudentError.message.includes('does not exist')) {
      console.log('   Columna USER_ID no existe en t_students (se agregará cuando implementes el rol estudiante)');
    } else {
      console.log('✅ Columna USER_ID ya existe en t_students');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

addMissingColumns().then(() => {
  console.log('\n👋 Script finalizado');
  process.exit(0);
});
