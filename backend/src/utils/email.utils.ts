import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Configuración del transportador de nodemailer
const createTransporter = () => {
  // Asegurarse de que dotenv esté configurado (aunque ya se llama arriba)
  dotenv.config();
  
  console.log('[Email] Intentando configurar transportador SMTP...');
  console.log('[Email] Host:', process.env.SMTP_HOST);
  console.log('[Email] User:', process.env.SMTP_USER);
  
  // Solo crear el transportador si las variables de entorno están presentes
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('⚠️ Configuración SMTP incompleta. Los correos se simularán en la consola.');
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true para 465, false para otros
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      // No fallar en certificados que no coinciden (útil para algunos servidores corporativos)
      rejectUnauthorized: process.env.NODE_ENV === 'production'
    }
  });
};

const transporter = createTransporter();

/**
 * Función genérica para enviar correos
 */
const sendEmail = async (options: { to: string, subject: string, html: string, text?: string }) => {
  const fromName = process.env.SMTP_FROM_NAME || 'SIGP UNEFA';
  const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;

  if (!transporter) {
    console.log(`
      -----------------------------------------
      SIMULACIÓN DE ENVÍO DE EMAIL
      Para: ${options.to}
      Asunto: ${options.subject}
      Contenido: ${options.text || 'Ver HTML'}
      -----------------------------------------
    `);
    
    // Si no hay transportador, es un error de configuración, no deberíamos simular éxito silencioso si SMTP está en el env
    if (process.env.SMTP_HOST) {
       console.error('❌ Error crítico: SMTP_HOST existe pero el transportador no se inicializó correctamente.');
    }
    
    return true;
  }

  try {
    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });
    console.log(`✅ Correo enviado a ${options.to}: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`❌ Error enviando correo a ${options.to}:`, error);
    // En desarrollo, no bloqueamos el flujo por error de correo si no es crítico
    if (process.env.NODE_ENV === 'development') {
      console.warn('Continuando flujo a pesar del error de correo (entorno de desarrollo)');
      return true;
    }
    throw error;
  }
};

/**
 * Servicio para envío de correos electrónicos.
 */
export const sendUserCreationEmail = async (email: string, name: string, userCi: string, tempPass: string) => {
  const portalUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const validityHours = 24;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #1e40af; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">SIGP UNEFA</h1>
      </div>
      <div style="padding: 30px; color: #1e293b; line-height: 1.6;">
        <h2 style="color: #1e40af;">¡Bienvenido, ${name}!</h2>
        <p>Se ha creado exitosamente tu cuenta en el <strong>Sistema de Gestión de Personal UNEFA</strong>.</p>
        <p>Para acceder por primera vez, utiliza las siguientes credenciales temporales:</p>
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Usuario:</strong> ${userCi}</p>
          <p style="margin: 5px 0;"><strong>Contraseña Temporal:</strong> ${tempPass}</p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${portalUrl}/signin" style="background-color: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Acceder al Portal</a>
        </div>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;">
        <p style="font-size: 0.875rem; color: #64748b;">
          <strong>Nota:</strong> Se te solicitará cambiar tu contraseña obligatoriamente en el primer acceso. 
          Esta contraseña temporal tiene una validez de ${validityHours} horas.
        </p>
      </div>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: 'Bienvenido al SIGP UNEFA - Credenciales de Acceso',
    html,
    text: `Hola ${name}, tu cuenta ha sido creada. Usuario: ${userCi}, Contraseña: ${tempPass}. Accede en: ${portalUrl}/signin`
  });
};

/**
 * Notifica un inicio de sesión exitoso
 */
export const sendLoginNotification = async (email: string, name: string, ip: string, userAgent: string) => {
  const date = new Date().toLocaleString('es-VE');
  
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 30px; color: #1e293b;">
      <h2 style="color: #1e40af;">Nuevo inicio de sesión</h2>
      <p>Hola ${name}, se ha detectado un nuevo inicio de sesión en tu cuenta de SIGP UNEFA.</p>
      <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Fecha:</strong> ${date}</p>
        <p style="margin: 5px 0;"><strong>IP:</strong> ${ip}</p>
        <p style="margin: 5px 0;"><strong>Dispositivo:</strong> ${userAgent}</p>
      </div>
      <p style="font-size: 0.875rem; color: #64748b;">Si has sido tú, puedes ignorar este mensaje. Si no reconoces este acceso, cambia tu contraseña inmediatamente.</p>
    </div>
  `;
  
  return sendEmail({
    to: email,
    subject: 'Notificación de Acceso - SIGP UNEFA',
    html,
    text: `Nuevo inicio de sesión en tu cuenta el ${date} desde la IP ${ip}.`
  });
};

/**
 * Envía un correo con el enlace para restablecer la contraseña
 */
export const sendPasswordRecoveryEmail = async (email: string, name: string, token: string) => {
  const portalUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const recoveryUrl = `${portalUrl}/reset-password?token=${token}`;
  const validityHours = 24;

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #1e40af; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">SIGP UNEFA</h1>
      </div>
      <div style="padding: 30px; color: #1e293b; line-height: 1.6;">
        <h2 style="color: #1e40af;">Recuperación de Contraseña</h2>
        <p>Hola ${name}, has solicitado restablecer tu contraseña para acceder al Panel de Control UNEFA.</p>
        <p>Para continuar con el proceso, haz clic en el siguiente botón seguro:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${recoveryUrl}" style="background-color: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Restablecer Contraseña</a>
        </div>
        <p>O copia y pega el siguiente enlace en tu navegador:</p>
        <p style="word-break: break-all; color: #1e40af; font-size: 0.875rem;">${recoveryUrl}</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;">
        <p style="font-size: 0.875rem; color: #64748b;">
          Este enlace tiene una validez de ${validityHours} horas. Si no has solicitado este cambio, puedes ignorar este mensaje.
        </p>
      </div>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: 'Recuperación de Contraseña - SIGP UNEFA',
    html,
    text: `Hola ${name}, restablece tu contraseña en: ${recoveryUrl}`
  });
};

/**
 * Notifica que la contraseña ha sido cambiada exitosamente
 */
export const sendPasswordChangedNotification = async (email: string, name: string) => {
  const date = new Date().toLocaleString('es-VE');

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; padding: 30px; color: #1e293b;">
      <h2 style="color: #10b981;">Contraseña cambiada exitosamente</h2>
      <p>Hola ${name}, te informamos que la contraseña de tu cuenta en SIGP UNEFA ha sido actualizada correctamente el ${date}.</p>
      <p style="font-size: 0.875rem; color: #64748b;">Si no has realizado este cambio, contacta al administrador del sistema de inmediato.</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: 'Seguridad: Tu contraseña ha sido cambiada - SIGP UNEFA',
    html,
    text: `Tu contraseña de SIGP UNEFA fue cambiada exitosamente el ${date}.`
  });
};

/**
 * Notifica un intento de inicio de sesión fallido o bloqueo
 */
export const sendSecurityAlert = async (email: string, name: string, type: 'FAILED_ATTEMPT' | 'ACCOUNT_LOCKED', ip: string) => {
  const date = new Date().toLocaleString('es-VE');
  const subject = type === 'ACCOUNT_LOCKED' ? 'ALERTA: Cuenta bloqueada' : 'Intento de acceso detectado';
  const title = type === 'ACCOUNT_LOCKED' ? 'Tu cuenta ha sido bloqueada' : 'Múltiples intentos fallidos';
  const message = type === 'ACCOUNT_LOCKED' 
    ? 'Debido a múltiples intentos de acceso fallidos, tu cuenta ha sido bloqueada temporalmente por seguridad.'
    : 'Se han detectado varios intentos fallidos de inicio de sesión en tu cuenta.';

  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ef4444; border-radius: 8px; padding: 30px; color: #1e293b;">
      <h2 style="color: #ef4444;">${title}</h2>
      <p>Hola ${name}, ${message}</p>
      <div style="background-color: #fef2f2; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Fecha:</strong> ${date}</p>
        <p style="margin: 5px 0;"><strong>Origen IP:</strong> ${ip}</p>
      </div>
      <p>Si no has sido tú, por favor contacta con soporte técnico de UNEFA.</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: `${subject} - SIGP UNEFA`,
    html,
    text: `${message} Fecha: ${date}, IP: ${ip}.`
  });
};
