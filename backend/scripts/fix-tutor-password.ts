import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixTutorPassword() {
  console.log('🔧 Actualizando contraseña del tutor...\n');

  // Contraseña con mayúsculas y minúsculas
  const newPassword = 'Tutor.123';

  try {
    // Buscar el usuario tutor
    const { data: tutorUser, error: tutorError } = await supabase
      .from('t_user')
      .select('USER_ID, USER_CI, NAME, EMAIL')
      .eq('USER_CI', 'V-13227478')
      .single();

    if (tutorError || !tutorUser) {
      console.error('❌ Usuario tutor no encontrado');
      return;
    }

    console.log('👤 Usuario encontrado:', tutorUser.NAME, '(' + tutorUser.USER_CI + ')');

    // Generar hash de la nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const now = new Date().toISOString();

    // Verificar si existe en t_user_key
    const { data: existingKey } = await supabase
      .from('t_user_key')
      .select('*')
      .eq('USER_ID', tutorUser.USER_ID)
      .eq('STATUS', 1)
      .maybeSingle();

    if (existingKey) {
      // Actualizar clave existente
      const { error: updateError } = await supabase
        .from('t_user_key')
        .update({ KEY: hashedPassword })
        .eq('USER_ID', tutorUser.USER_ID)
        .eq('STATUS', 1);

      if (updateError) {
        console.error('❌ Error al actualizar clave:', updateError.message);
        return;
      }
      console.log('✅ Clave actualizada en t_user_key');
    } else {
      // Crear nueva clave
      const endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() + 1); // Vence en 1 año

      const { error: insertError } = await supabase
        .from('t_user_key')
        .insert({
          USER_ID: tutorUser.USER_ID,
          KEY: hashedPassword,
          START_DATE: now,
          END_DATE: endDate.toISOString(),
          MODIF_USER_ID: 1,
          MODIF_USER_DATE: now,
          ELIM_USER_ID: 1,
          ELIM_USER_DATE: now,
          REST_USER_ID: 1,
          REST_USER_DATE: now,
          STATUS: 1,
          IS_TEMPORARY: false
        });

      if (insertError) {
        console.error('❌ Error al crear clave:', insertError.message);
        return;
      }
      console.log('✅ Clave creada en t_user_key');
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ CONTRASEÑA ACTUALIZADA');
    console.log('='.repeat(50));
    console.log(`👤 Usuario: ${tutorUser.USER_CI}`);
    console.log(`🔑 Contraseña: ${newPassword}`);
    console.log('='.repeat(50));

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

fixTutorPassword().then(() => {
  console.log('\n👋 Script finalizado');
  process.exit(0);
});
