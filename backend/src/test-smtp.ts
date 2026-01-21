import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar .env desde la raíz del backend
dotenv.config({ path: path.join(__dirname, '../.env') });

async function testSMTP() {
  console.log('--- TEST DE CONFIGURACIÓN SMTP ---');
  console.log('Host:', process.env.SMTP_HOST);
  console.log('Port:', process.env.SMTP_PORT);
  console.log('User:', process.env.SMTP_USER);
  console.log('Secure:', process.env.SMTP_SECURE);
  console.log('From Name:', process.env.SMTP_FROM_NAME);
  console.log('From Email:', process.env.SMTP_FROM_EMAIL);
  console.log('----------------------------------');

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error('❌ Error: Configuración SMTP incompleta en .env');
    return;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    console.log('⏳ Verificando conexión con el servidor SMTP...');
    await transporter.verify();
    console.log('✅ Conexión SMTP exitosa');

    console.log('⏳ Intentando enviar correo de prueba...');
    const info = await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER, // Enviar a sí mismo para probar
      subject: 'Prueba de Conexión SMTP - SIGP UNEFA',
      text: 'Este es un correo de prueba para verificar la configuración SMTP del sistema SIGP UNEFA.',
      html: '<h1>Prueba de Conexión SMTP</h1><p>Este es un correo de prueba para verificar la configuración SMTP del sistema <b>SIGP UNEFA</b>.</p>',
    });

    console.log('✅ Correo de prueba enviado exitosamente');
    console.log('ID del mensaje:', info.messageId);
  } catch (err: unknown) {
    if (err instanceof Error) {
      const error = err as Error & { code?: string; command?: string };
      console.error('❌ Error en la prueba SMTP:');
      console.error('Mensaje:', error.message);
      if (error.code) console.error('Código:', error.code);
      if (error.command) console.error('Comando:', error.command);
      
      if (error.message.includes('EAUTH')) {
        console.log('\n💡 Sugerencia: Error de autenticación. Verifique el usuario y la contraseña de aplicación.');
      } else if (error.message.includes('ECONNREFUSED')) {
        console.log('\n💡 Sugerencia: No se pudo conectar al host. Verifique el nombre del servidor y el puerto.');
      } else if (error.message.includes('ETIMEDOUT')) {
        console.log('\n💡 Sugerencia: Tiempo de espera agotado. Verifique su conexión a internet o el puerto (587 suele ser bloqueado por algunos ISPs).');
      }
    } else {
      console.error('❌ Error desconocido en la prueba SMTP:', err);
    }
  }
}

testSMTP();
