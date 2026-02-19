import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupStudentUser() {
  console.log('🔧 Configurando usuario estudiante...\n');

  const defaultPassword = 'Estudiante.123';

  try {
    // 1. Buscar estudiante sin USER_ID
    console.log('1. Buscando estudiante sin usuario vinculado...');
    const { data: students, error: studentsError } = await supabase
      .from('t_students')
      .select('STUDENTS_ID, STUDENTS_CI, NAME, SECOND_NAME, SURNAME, SECOND_SURNAME, EMAIL, CONTACT_PHONE, USER_ID')
      .eq('STATUS', 1)
      .is('USER_ID', null)
      .limit(1)
      .maybeSingle();

    if (studentsError) {
      console.error('❌ Error al buscar estudiante:', studentsError.message);
      return;
    }

    if (!students) {
      // Verificar si ya existe uno vinculado
      const { data: linkedStudent } = await supabase
        .from('t_students')
        .select('STUDENTS_ID, STUDENTS_CI, NAME, SURNAME, EMAIL, USER_ID')
        .eq('STATUS', 1)
        .not('USER_ID', 'is', null)
        .limit(1)
        .single();

      if (linkedStudent) {
        console.log('⚠️  El estudiante ya está vinculado:', linkedStudent.NAME, linkedStudent.SURNAME);
        
        const { data: roleData } = await supabase
          .from('t_user_roles')
          .select('ID_ROLES')
          .eq('ID_USER', linkedStudent.USER_ID)
          .single();

        if (roleData?.ID_ROLES === 4) {
          console.log('✅ Ya tiene rol ESTUDIANTE asignado');
        } else if (roleData) {
          console.log('🔄 Actualizando rol a ESTUDIANTE...');
          await supabase
            .from('t_user_roles')
            .update({ ID_ROLES: 4 })
            .eq('ID_USER', linkedStudent.USER_ID);
          console.log('✅ Rol actualizado');
        }
        
        console.log('\n' + '='.repeat(50));
        console.log('✅ ESTUDIANTE LISTO PARA USAR');
        console.log('='.repeat(50));
        console.log(`👤 Usuario: ${linkedStudent.STUDENTS_CI}`);
        console.log(`🔑 Contraseña: ${defaultPassword}`);
        console.log(`📧 Email: ${linkedStudent.EMAIL}`);
        console.log('='.repeat(50));
        return;
      }
      
      console.log('❌ No hay estudiantes disponibles');
      return;
    }

    console.log(`📋 Estudiante encontrado: ${students.NAME} ${students.SURNAME} (CI: ${students.STUDENTS_CI})`);

    // 2. Verificar si ya existe usuario con esa cédula
    const { data: existingUser } = await supabase
      .from('t_user')
      .select('USER_ID')
      .eq('USER_CI', students.STUDENTS_CI)
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
          USER: students.STUDENTS_CI,
          USER_CI: students.STUDENTS_CI,
          NAME: students.NAME,
          SECOND_NAME: students.SECOND_NAME || null,
          SURNAME: students.SURNAME,
          SECOND_SURNAME: students.SECOND_SURNAME || null,
          EMAIL: students.EMAIL,
          PHONE_NUMBER: students.CONTACT_PHONE || null,
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

      // 4. Crear contraseña en t_user_key
      console.log('\n3. Creando contraseña...');
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);
      const endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() + 1);

      const { error: passwordError } = await supabase
        .from('t_user_key')
        .insert({
          USER_ID: userId,
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

      if (passwordError) {
        console.error('❌ Error al crear contraseña:', passwordError.message);
        return;
      }
      console.log('✅ Contraseña creada');
    }

    // 5. Vincular usuario al estudiante
    console.log('\n4. Vinculando usuario al estudiante...');
    const { error: linkError } = await supabase
      .from('t_students')
      .update({ USER_ID: userId })
      .eq('STUDENTS_ID', students.STUDENTS_ID);

    if (linkError) {
      console.error('❌ Error al vincular:', linkError.message);
      return;
    }
    console.log('✅ Usuario vinculado al estudiante');

    // 6. Asignar rol ESTUDIANTE (4)
    console.log('\n5. Asignando rol ESTUDIANTE (4)...');
    
    const { data: existingRole } = await supabase
      .from('t_user_roles')
      .select('*')
      .eq('ID_USER', userId)
      .maybeSingle();

    if (existingRole) {
      const { error: roleError } = await supabase
        .from('t_user_roles')
        .update({ ID_ROLES: 4 })
        .eq('ID_USER', userId);

      if (roleError) {
        console.error('❌ Error al actualizar rol:', roleError.message);
        return;
      }
      console.log('✅ Rol actualizado a ESTUDIANTE');
    } else {
      const { error: roleError } = await supabase
        .from('t_user_roles')
        .insert({ ID_USER: userId, ID_ROLES: 4 });

      if (roleError) {
        console.error('❌ Error al asignar rol:', roleError.message);
        return;
      }
      console.log('✅ Rol ESTUDIANTE asignado');
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ CONFIGURACIÓN COMPLETADA');
    console.log('='.repeat(50));
    console.log(`👤 Usuario: ${students.STUDENTS_CI}`);
    console.log(`🔑 Contraseña: ${defaultPassword}`);
    console.log(`📧 Email: ${students.EMAIL}`);
    console.log('='.repeat(50));

  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

setupStudentUser().then(() => {
  console.log('\n👋 Script finalizado');
  process.exit(0);
});
