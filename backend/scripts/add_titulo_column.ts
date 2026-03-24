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

async function addTituloColumn() {
  console.log('🔍 Verificando columna TITULO en tabla t_tutors...\n');

  try {
    // 1. Intentar seleccionar la columna para ver si existe
    const { error: checkError } = await supabase
      .from('t_tutors')
      .select('TITULO')
      .limit(1);

    if (checkError && checkError.message.includes('column') && checkError.message.includes('does not exist')) {
      console.log('❌ Columna TITULO no existe, agregando...');
      
      // Usar la función execute_sql que ya está creada en la base de datos
      const sql = 'ALTER TABLE "t_tutors" ADD COLUMN IF NOT EXISTS "TITULO" varchar(50) DEFAULT NULL;';
      const { error: alterError } = await supabase.rpc('execute_sql', { sql });

      if (alterError) {
        console.error('❌ Error al agregar columna:', alterError.message);
        console.log('\n📝 Ejecuta este SQL manualmente en Supabase Dashboard > SQL Editor:\n');
        console.log('--'.repeat(30));
        console.log(sql);
        console.log('--'.repeat(30));
        return;
      }
      
      console.log('✅ Columna TITULO agregada exitosamente a t_tutors');
      
      // Verificar que se agregó correctamente
      const { error: verifyError } = await supabase
        .from('t_tutors')
        .select('TITULO')
        .limit(1);
      
      if (verifyError) {
        console.log('⚠️  Advertencia: La columna podría no haberse agregado correctamente:', verifyError.message);
      } else {
        console.log('✅ Verificación exitosa: La columna TITULO está disponible');
      }
      
    } else {
      console.log('✅ Columna TITULO ya existe en t_tutors');
    }

    // 2. Mostrar estructura actual de la tabla
    console.log('\n📊 Verificando estructura actual de t_tutors...');
    const { data: columns, error: schemaError } = await supabase
      .rpc('get_table_columns', { table_name: 't_tutors' });
    
    if (!schemaError && columns) {
      console.log('   Columnas en t_tutors:');
      columns.forEach((col: any) => {
        console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(NULL)' : '(NOT NULL)'}`);
      });
    } else {
      console.log('   No se pudo obtener la estructura automáticamente');
    }

  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

addTituloColumn().then(() => {
  console.log('\n👋 Script finalizado');
  process.exit(0);
});