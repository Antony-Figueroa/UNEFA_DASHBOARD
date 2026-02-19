import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Faltan credenciales de Supabase');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupTutorUser() {
  console.log('🔧 Configurando usuario tutor...\n');

  const defaultPassword = 'Tutor123!';

  try {
    // 1. Obtener el primer tutor disponible sin USER_ID
    console.log('1. Buscando tutor sin usuario vinculado...');
    const { data: tutors, error: tutorsError } = await supabase
      .from('t_tutors')
      .select('TUTOR_ID, TUTOR_CI, NAME, SECOND_NAME, SURNAME, SECOND_SURNAME, EMAIL, CONTACT_PHONE, USER_ID')
      .eq('STATUS', 1)
      .is('USER_ID', null)
      .limit(1)
      .maybeSingle();

    if (tutorsError) {
      console.error('❌ Error al buscar tutor:', tutorsError.message);
      return;
    }

    if (!tutors) {
      // Verificar si ya existe un tutor vinculado
      const { data: linkedTutor } = await supabase
        .from('t_tutors')
        .select('TUTOR_ID, TUTOR_CI, NAME, SURNAME, EMAIL, USER_ID')
        .eq('STATUS', 1)
        .not('USER_ID', 'is', null)
        .limit(1)
        .single();

      if (linkedTutor) {
        console.log('⚠️  El tutor ya está vinculado:', linkedTutor.NAME, linkedTutor.SURNAME);
        console.log('   USER_ID:', linkedTutor.USER_ID);
        
        // Verificar rol
        const { data: roleData } = await supabase
          .from('t_user_roles')
          .select('ID_ROLES')
          .eq('ID_USER', linkedTutor.USER_ID)
          .single();

        if (roleData?.ID_ROLES === 3) {
          console.log('✅ Ya tiene rol TUTOR asignado');
        } else if (roleData) {
          console.log('🔄 Actualizando rol a TUTOR...');
          await supabase
            .from('t_user_roles')
            .update({ ID_ROLES: 3 })
            .eq('ID_USER', linkedTutor.USER_ID);
          console.log('✅ Rol actualizado');
        }
        
        console.log('\n' + '='.repeat(50));
        console.log('✅ TUTOR LISTO PARA USAR');
        console.log('='.repeat(50));
        console.log(`👤 Usuario: ${linkedTutor.TUTOR_CI}`);
        console.log(`🔑 Contraseña: ${defaultPassword}`);
        console.log(`📧 Email: ${linkedTutor.EMAIL}`);
        console.log('='.repeat(50));
        return;
      }
      
      console.log('❌ No hay tutores disponibles');
      return;
    }

    console.log(`📋 Tutor encontrado: ${tutors.NAME} ${tutors.SURNAME} (CI: ${tutors.TUTOR_CI})`);

    // 2. Verificar si ya existe usuario con esa cédula
    const { data: existingUser } = await supabase
      .from('t_user')
      .select('USER_ID')
      .eq('USER_CI', tutors.TUTOR_CI)
      .maybeSingle();

    let userId: number;

    if (existingUser) {
      console.log('⚠️  Usuario ya existe con esa cédula (ID:', existingUser.USER_ID, ')');
      userId = existingUser.USER_ID;
    } else {
      // 3. Crear usuario en t_user
      console.log('\n2. Creando usuario en t_user...');
      const now = new Date().toISOString();

      const { data: newUser, error: userError } = await supabase
        .from('t_user')
        .insert({
          USER: tutors.TUTOR_CI,
          USER_CI: tutors.TUTOR_CI,
          NAME: tutors.NAME,
          SECOND_NAME: tutors.SECOND_NAME || null,
          SURNAME: tutors.SURNAME,
          SECOND_SURNAME: tutors.SECOND_SURNAME || null,
          EMAIL: tutors.EMAIL,
          PHONE_NUMBER: tutors.CONTACT_PHONE || null,
          CREATION_DATE: now,
          LOGIN: 0,
          TERMS_CONDITIONS: 'ACEPTADO',
          STATUS_SESSION: 1,
          STATUS: 1,
          FAILED_ATTEMPTS: 0,
          FORCE_PASSWORD_CHANGE: false
        })
        .select('USER_ID')
        .single();

      if (userError) {
        console.error('❌ Error al crear usuario:', userError.message);
        return;
      }

      userId = newUser.USER_ID;
      console.log('✅ Usuario creado (ID:', userId, ')');

      // 4. Crear contraseña en t_password_history
      console.log('\n3. Creando contraseña...');
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);

      const { error: passwordError } = await supabase
        .from('t_password_history')
        .insert({
          USER_ID: userId,
          KEY: hashedPassword,
          CREATION_DATE: now
        });

      if (passwordError) {
        console.error('❌ Error al crear contraseña:', passwordError.message);
        return;
      }
      console.log('✅ Contraseña creada');
    }

    // 5. Vincular usuario al tutor
    console.log('\n4. Vinculando usuario al tutor...');
    const { error: linkError } = await supabase
      .from('t_tutors')
      .update({ USER_ID: userId })
      .eq('TUTOR_ID', tutors.TUTOR_ID);

    if (linkError) {
      console.error('❌ Error al vincular:', linkError.message);
      return;
    }
    console.log('✅ Usuario vinculado al tutor');

    // 6. Asignar rol TUTOR (3)
    console.log('\n5. Asignando rol TUTOR (3)...');
    
    // Verificar si ya tiene rol
    const { data: existingRole } = await supabase
      .from('t_user_roles')
      .select('*')
      .eq('ID_USER', userId)
      .maybeSingle();

    if (existingRole) {
      const { error: roleError } = await supabase
        .from('t_user_roles')
        .update({ ID_ROLES: 3 })
        .eq('ID_USER', userId);

      if (roleError) {
        console.error('❌ Error al actualizar rol:', roleError.message);
        return;
      }
      console.log('✅ Rol actualizado a TUTOR');
    } else {
      const { error: roleError } = await supabase
        .from('t_user_roles')
        .insert({ ID_USER: userId, ID_ROLES: 3 });

      if (roleError) {
        console.error('❌ Error al asignar rol:', roleError.message);
        return;
      }
      console.log('✅ Rol TUTOR asignado');
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ CONFIGURACIÓN COMPLETADA');
    console.log('='.repeat(50));
    console.log(`👤 Usuario: ${tutors.TUTOR_CI}`);
    console.log(`🔑 Contraseña: ${defaultPassword}`);
    console.log(`📧 Email: ${tutors.EMAIL}`);
    console.log('='.repeat(50));

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

setupTutorUser().then(() => {
  console.log('\n👋 Script finalizado');
  process.exit(0);
});
