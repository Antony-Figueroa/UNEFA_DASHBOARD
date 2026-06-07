/**
 * @file test-all-emails.ts
 * @description Envía una prueba de TODOS los tipos de email configurados
 * a las direcciones especificadas.
 *
 * USO: npx tsx src/scripts/test-all-emails.ts
 */

import { sendUserCreationEmail } from '../utils/email.utils.js';
import { sendPasswordRecoveryEmail } from '../utils/email.utils.js';
import { sendPasswordChangedNotification } from '../utils/email.utils.js';
import { sendSecurityAlert } from '../utils/email.utils.js';
import { sendPeriodNotification } from '../utils/email.utils.js';

const TARGETS = ['antony.job.2026@gmail.com', 'antonysamuel0903@gmail.com'];

const run = async () => {
  console.log('📧 Enviando pruebas de TODOS los tipos de email...\n');

  // ── 1. Creación de usuario ─────────────────────────────────────────────
  console.log('1️⃣  Enviando email de CREACIÓN DE USUARIO...');
  for (const email of TARGETS) {
    await sendUserCreationEmail(
      email,
      'Antony González',
      'V-12345678',
      'TempPass2026!',
    );
    console.log(`   ✓ ${email}`);
  }

  // ── 2. Recuperación de contraseña ──────────────────────────────────────
  console.log('2️⃣  Enviando email de RECUPERACIÓN DE CONTRASEÑA...');
  for (const email of TARGETS) {
    await sendPasswordRecoveryEmail(
      email,
      'Antony González',
      'https://app.unefa.edu.ve/auth/reset?token=test-token-123',
    );
    console.log(`   ✓ ${email}`);
  }

  // ── 3. Contraseña cambiada ─────────────────────────────────────────────
  console.log('3️⃣  Enviando email de CONTRASEÑA CAMBIADA...');
  for (const email of TARGETS) {
    await sendPasswordChangedNotification(email, 'Antony González');
    console.log(`   ✓ ${email}`);
  }

  // ── 4. Alerta de seguridad ─────────────────────────────────────────────
  console.log('4️⃣  Enviando email de ALERTA DE SEGURIDAD (cuenta bloqueada)...');
  for (const email of TARGETS) {
    await sendSecurityAlert(email, 'Antony González', 'ACCOUNT_LOCKED', '190.210.5.123');
    console.log(`   ✓ ${email}`);
  }

  console.log('   Enviando email de ALERTA DE SEGURIDAD (intento fallido)...');
  for (const email of TARGETS) {
    await sendSecurityAlert(email, 'Antony González', 'FAILED_ATTEMPT', '190.210.5.123');
    console.log(`   ✓ ${email}`);
  }

  // ── 5. Notificación de período ─────────────────────────────────────────
  console.log('5️⃣  Enviando email de NOTIFICACIÓN DE PERÍODO...');
  const users = TARGETS.map(email => ({ email, name: 'Antony González' }));
  await sendPeriodNotification(
    users,
    '🚀 Período Académico Iniciado',
    'El período "Enero-Julio 2026" ha iniciado formalmente. Ingresá al sistema para más detalles.',
    'Enero-Julio 2026',
  );
  console.log('   ✓ Enviado a ambos');

  console.log('\n✅ PRUEBAS COMPLETADAS. Revisá las bandejas de entrada.');
};

run().catch(err => {
  console.error('Error ejecutando pruebas:', err);
  process.exit(1);
});
