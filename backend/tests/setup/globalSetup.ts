/**
 * Global Setup para tests de integración del backend.
 *
 * Crea un usuario maestro ADMIN en Supabase que se usa para autenticar
 * todas las requests durante la suite de tests.
 *
 * Usa UPSERT en vez de DELETE+CREATE para ser robusto ante fallos
 * de sesiones anteriores que dejaron datos huérfanos.
 */

import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Cargar .env desde backend/
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// ============================================================
// CONSTANTES DEL USUARIO MAESTRO
// ============================================================
export const TEST_USER_CI = 'V-TESTADM';
export const TEST_USER_PASSWORD = 'TestAdmin123!';
export const TEST_USER_EMAIL = 'test.admin@unefa.edu.ve';

// ============================================================
// SETUP — usa UPSERT para ser tolerante a datos residuales
// ============================================================
export async function setup(): Promise<void> {
  const supabaseUrl = (process.env.SUPABASE_URL || '').trim().replace(/['`"]/g, '');
  const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim().replace(/['`"]/g, '');

  if (!supabaseUrl || !supabaseKey) {
    console.error(
      '[TestSetup] ERROR: SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY no están definidas.\n' +
      'Asegurate de tener backend/.env configurado con las credenciales de Supabase.'
    );
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  console.log('[TestSetup] 👤 Upsertando usuario maestro ADMIN...');

  // 1. Upsert persona en t_persons (unique por CI)
  const now = new Date().toISOString();
  const { data: person, error: personError } = await supabase
    .from('t_persons')
    .upsert(
      {
        ci: TEST_USER_CI,
        first_name: 'Test',
        last_name: 'Admin',
        email: TEST_USER_EMAIL,
        gender: 'M',
        status: 1,
      },
      { onConflict: 'ci', ignoreDuplicates: false }
    )
    .select('person_id')
    .single();

  if (personError || !person) {
    console.error('[TestSetup] Error haciendo upsert de persona:', personError);
    process.exit(1);
  }
  console.log('[TestSetup]   → Persona (ID: ' + person.person_id + ')');

  // 2. Upsert usuario en t_user (unique por USER_CI)
  const { data: user, error: userError } = await supabase
    .from('t_user')
    .upsert(
      {
        person_id: person.person_id,
        USER: 'TEST-ADMIN',
        USER_CI: TEST_USER_CI,
        NAME: 'Test',
        SURNAME: 'Admin',
        EMAIL: TEST_USER_EMAIL,
        STATUS: 1,
        FORCE_PASSWORD_CHANGE: false,
        LOGIN: 1,
        CREATION_DATE: now,
        TERMS_CONDITIONS: 'ACEPTADO',
        STATUS_SESSION: 2,
      },
      { onConflict: 'USER_CI', ignoreDuplicates: false }
    )
    .select('USER_ID')
    .single();

  if (userError || !user) {
    console.error('[TestSetup] Error haciendo upsert de usuario:', userError);
    process.exit(1);
  }
  console.log('[TestSetup]   → Usuario (ID: ' + user.USER_ID + ')');

  // 3. Desactivar claves anteriores y crear nueva clave
  await supabase.from('t_user_key').update({ STATUS: 0 }).eq('USER_ID', user.USER_ID);

  const hashedPassword = await bcrypt.hash(TEST_USER_PASSWORD, 10);
  const farFuture = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();

  const { error: keyError } = await supabase.from('t_user_key').insert({
    USER_ID: user.USER_ID,
    KEY: hashedPassword,
    STATUS: 1,
    IS_TEMPORARY: false,
    START_DATE: now,
    END_DATE: farFuture,
    MODIF_USER_ID: user.USER_ID,
    MODIF_USER_DATE: now,
    ELIM_USER_ID: user.USER_ID,
    ELIM_USER_DATE: now,
    REST_USER_ID: user.USER_ID,
    REST_USER_DATE: now,
  });

  if (keyError) {
    console.error('[TestSetup] Error insertando clave:', keyError);
    process.exit(1);
  }
  console.log('[TestSetup]   → Clave creada (no temporal, bcrypt)');

  // 4. Asegurar rol ADMIN
  const { error: roleDeleteError } = await supabase
    .from('t_user_roles')
    .delete()
    .eq('ID_USER', user.USER_ID);

  if (roleDeleteError) {
    console.warn('[TestSetup]   ⚠ No se pudieron limpiar roles previos:', roleDeleteError.message);
  }

  const { error: roleError } = await supabase.from('t_user_roles').insert({
    ID_USER: user.USER_ID,
    ID_ROLES: 1,
  });

  if (roleError) {
    console.error('[TestSetup] Error asignando rol ADMIN:', roleError);
    process.exit(1);
  }
  console.log('[TestSetup]   → Rol ADMIN asignado');

  // Guardar en process.env para que los tests puedan acceder
  process.env.TEST_USER_CI = TEST_USER_CI;
  process.env.TEST_USER_PASS = TEST_USER_PASSWORD;
  process.env.TEST_USER_ID = String(user.USER_ID);
  process.env.TEST_PERSON_ID = String(person.person_id);

  console.log('[TestSetup] ✅ Usuario maestro listo:', TEST_USER_CI);
}

// ============================================================
// TEARDOWN — elimina datos de prueba
// ============================================================
export async function teardown(): Promise<void> {
  const supabaseUrl = (process.env.SUPABASE_URL || '').trim().replace(/['`"]/g, '');
  const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim().replace(/['`"]/g, '');

  if (!supabaseUrl || !supabaseKey) {
    console.warn('[TestTeardown] Sin credenciales — saltando cleanup');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const userId = parseInt(process.env.TEST_USER_ID || '0');

  console.log('[TestTeardown] 🧹 Limpiando usuario maestro...');

  if (userId) {
    await supabase.from('t_user_key').delete().eq('USER_ID', userId);
    await supabase.from('t_user_roles').delete().eq('ID_USER', userId);
    await supabase.from('t_user').delete().eq('USER_ID', userId);
    console.log('[TestTeardown]   → Usuario eliminado (ID: ' + userId + ')');
  }

  // NO eliminamos t_persons porque otros tests pueden haber creado
  // estudiantes que referencian otras personas — solo limpiamos el user

  console.log('[TestTeardown] ✅ Cleanup completado');
}
