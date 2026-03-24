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

async function testTituloInsert() {
  console.log('🔍 Probando inserción en columna TITULO...\n');

  try {
    // 1. Contar registros en t_tutors
    console.log('1. Contando registros en t_tutors...');
    const { count, error: countError } = await supabase
      .from('t_tutors')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ Error al contar registros:', countError.message);
      return;
    }
    
    console.log(`   Total de tutores: ${count || 0}`);
    
    if (count === 0) {
      console.log('   No hay tutores para probar. Creando uno temporal...');
      
      // Insertar un tutor temporal (ajusta los campos según tu esquema)
      const tempTutor = {
        TUTOR_ID: Date.now(), // ID temporal
        NOMBRE: 'Test',
        APELLIDO: 'Tutor',
        CEDULA: '12345678',
        TITULO: 'Ing. Sistemas'
      };
      
      const { data: insertData, error: insertError } = await supabase
        .from('t_tutors')
        .insert(tempTutor)
        .select();
      
      if (insertError) {
        console.error('❌ Error al insertar tutor temporal:', insertError.message);
        console.log('   Mensaje completo:', JSON.stringify(insertError, null, 2));
        
        // Si el error es por columna TITULO no existente
        if (insertError.message.includes('column') && insertError.message.includes('TITULO')) {
          console.log('\n❌ La columna TITULO NO existe en la tabla');
          console.log('   Ejecuta el SQL manualmente:');
          console.log('   ALTER TABLE "t_tutors" ADD COLUMN IF NOT EXISTS "TITULO" varchar(50) DEFAULT NULL;');
        }
        return;
      }
      
      console.log('✅ Tutor temporal insertado con TITULO:', insertData);
      
      // Limpiar: eliminar el tutor temporal
      const { error: deleteError } = await supabase
        .from('t_tutors')
        .delete()
        .eq('TUTOR_ID', tempTutor.TUTOR_ID);
      
      if (deleteError) {
        console.log('⚠️  No se pudo eliminar el tutor temporal:', deleteError.message);
      } else {
        console.log('✅ Tutor temporal eliminado');
      }
      
    } else {
      // Hay tutores, probar actualizar uno existente
      console.log('2. Probando actualización de TITULO en tutor existente...');
      
      // Obtener el primer tutor
      const { data: tutor, error: fetchError } = await supabase
        .from('t_tutors')
        .select('TUTOR_ID, TITULO')
        .limit(1)
        .single();
      
      if (fetchError) {
        console.error('❌ Error al obtener tutor:', fetchError.message);
        return;
      }
      
      console.log(`   Tutor ID: ${tutor.TUTOR_ID}, TITULO actual: ${tutor.TITULO || 'NULL'}`);
      
      // Actualizar con un valor de prueba
      const testTitulo = 'Test ' + Date.now();
      const { error: updateError } = await supabase
        .from('t_tutors')
        .update({ TITULO: testTitulo })
        .eq('TUTOR_ID', tutor.TUTOR_ID);
      
      if (updateError) {
        console.error('❌ Error al actualizar TITULO:', updateError.message);
        console.log('   Esto puede indicar que la columna TITULO no existe o no es accesible');
        return;
      }
      
      console.log('✅ TITULO actualizado exitosamente');
      
      // Verificar que se actualizó
      const { data: updatedTutor, error: verifyError } = await supabase
        .from('t_tutors')
        .select('TITULO')
        .eq('TUTOR_ID', tutor.TUTOR_ID)
        .single();
      
      if (verifyError) {
        console.error('❌ Error al verificar actualización:', verifyError.message);
      } else {
        console.log(`   TITULO después de actualizar: ${updatedTutor.TITULO}`);
        
        // Restaurar valor original
        const { error: restoreError } = await supabase
          .from('t_tutors')
          .update({ TITULO: tutor.TITULO })
          .eq('TUTOR_ID', tutor.TUTOR_ID);
        
        if (restoreError) {
          console.log('⚠️  No se pudo restaurar el valor original:', restoreError.message);
        } else {
          console.log('✅ Valor original restaurado');
        }
      }
    }

  } catch (error) {
    console.error('❌ Error inesperado:', error);
  }
}

testTituloInsert().then(() => {
  console.log('\n👋 Script finalizado');
  process.exit(0);
});