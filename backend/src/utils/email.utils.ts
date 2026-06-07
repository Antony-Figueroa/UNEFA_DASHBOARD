import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// ─── Transportes ───────────────────────────────────────────────

type SendResult = { success: true } | { success: false; error: string };

/** Enviar via Gmail SMTP con contraseña de aplicación */
const tryGmail = async (opts: { to: string; subject: string; html: string; text?: string }): Promise<SendResult | null> => {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASS;
  if (!user || !pass) return null; // no configurado

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    });

    await transporter.sendMail({
      from: `"SIGP UNEFA" <${user}>`,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      ...(opts.text && { text: opts.text }),
    });

    console.log(`✅ [Gmail] Correo enviado a ${opts.to}`);
    return { success: true };
  } catch (error: any) {
    const reason = error?.message || error?.code || 'Error Gmail SMTP';
    console.error(`❌ [Gmail] Error enviando a ${opts.to}:`, reason);
    return { success: false, error: reason };
  }
};

/** Enviar via Resend API */
const tryResend = async (opts: { to: string; subject: string; html: string; text?: string }): Promise<SendResult | null> => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null; // no configurado

  const resend = new Resend(apiKey);
  const fromName = process.env.RESEND_FROM_NAME || 'SIGP UNEFA';
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

  try {
    const { data, error } = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      ...(opts.text && { text: opts.text }),
    });

    if (error) throw error;

    console.log(`✅ [Resend] Correo enviado a ${opts.to}: ${data?.id}`);
    return { success: true };
  } catch (error: any) {
    const reason = error?.message || error?.name || 'Error Resend';
    console.error(`❌ [Resend] Error enviando a ${opts.to}:`, reason);
    return { success: false, error: reason };
  }
};

/** Simular envío en consola (último recurso) */
const trySimulation = (opts: { to: string; subject: string; html: string; text?: string }): SendResult => {
  console.log(`
    -----------------------------------------
    SIMULACIÓN DE ENVÍO DE EMAIL
    Para: ${opts.to}
    Asunto: ${opts.subject}
    Contenido: ${opts.text || 'Ver HTML'}
    -----------------------------------------
  `);
  return { success: true };
};

/**
 * Función genérica para enviar correos.
 * Prioridad: Gmail SMTP → Resend → Simulación en consola.
 */
export const sendEmail = async (options: { to: string; subject: string; html: string; text?: string }): Promise<SendResult> => {
  // 1. Gmail SMTP (si está configurado)
  const gmailResult = await tryGmail(options);
  if (gmailResult !== null) return gmailResult;

  // 2. Simulación en consola (Resend deshabilitado por ahora)
  return trySimulation(options);
};

/**
 * Servicio para envío de correos electrónicos.
 */
export const sendUserCreationEmail = async (email: string, name: string, userCi: string, tempPass: string): Promise<{ success: boolean; error?: string }> => {
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
export const sendLoginNotification = async (email: string, name: string, ip: string, userAgent: string): Promise<{ success: boolean; error?: string }> => {
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
export const sendPasswordRecoveryEmail = async (email: string, name: string, token: string): Promise<{ success: boolean; error?: string }> => {
  const portalUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const recoveryUrl = `${portalUrl}/reset-password?token=${token}`;
  const validityHours = 24;

  const html = `
    <div style="font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%); padding: 32px 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">SIGP UNEFA</h1>
        <p style="color: rgba(255,255,255,0.75); margin: 6px 0 0; font-size: 14px;">Sistema de Gestión de Personal</p>
      </div>

      <!-- Body -->
      <div style="padding: 32px 32px 24px; color: #1e293b; line-height: 1.6;">
        <h2 style="color: #1e40af; font-size: 20px; margin: 0 0 16px;">Recuperación de Contraseña</h2>
        <p style="margin: 0 0 8px;">Hola <strong>${name}</strong>,</p>
        <p style="margin: 0 0 16px; color: #475569;">
          Recibimos una solicitud para restablecer la contraseña de tu cuenta en el Sistema de Gestión de Personal UNEFA.
        </p>
        <p style="margin: 0 0 20px; color: #475569;">
          Hacé clic en el siguiente botón para crear una nueva contraseña:
        </p>

        <!-- Button -->
        <div style="text-align: center; margin: 24px 0;">
          <a href="${recoveryUrl}" style="display: inline-block; background: linear-gradient(135deg, #1e40af 0%, #2563eb 100%); color: #ffffff; padding: 14px 36px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; letter-spacing: 0.3px; box-shadow: 0 2px 4px rgba(30,64,175,0.3);">
            Restablecer Contraseña
          </a>
        </div>

        <!-- Fallback link -->
        <p style="margin: 20px 0 8px; font-size: 13px; color: #64748b;">
          Si el botón no funciona, copiá y pegá este enlace en tu navegador:
        </p>
        <p style="word-break: break-all; color: #2563eb; font-size: 13px; background: #f8fafc; padding: 10px 14px; border-radius: 6px; border: 1px solid #e2e8f0; margin: 0 0 24px; font-family: monospace;">${recoveryUrl}</p>

        <!-- Divider -->
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">

        <!-- Security notice -->
        <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 14px 16px; margin: 16px 0;">
          <p style="margin: 0; font-size: 13px; color: #991b1b;">
            <strong>⚠️ Importante:</strong> Este enlace expira en ${validityHours} horas. Si no solicitaste este cambio, ignorá este mensaje y contactá al administrador del sistema.
          </p>
        </div>

        <!-- Footer -->
        <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 24px 0 0;">
          SIGP UNEFA — Sistema de Gestión de Personal<br>
          Si tenés dudas, contactá a soporte técnico.
        </p>
      </div>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: 'Recuperación de Contraseña - SIGP UNEFA',
    html,
    text: `Hola ${name}, restablecé tu contraseña en: ${recoveryUrl}. Este enlace expira en ${validityHours} horas. Si no solicitaste esto, contactá al administrador.`
  });
};

/**
 * Notifica que la contraseña ha sido cambiada exitosamente
 */
export const sendPasswordChangedNotification = async (email: string, name: string): Promise<{ success: boolean; error?: string }> => {
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
export const sendSecurityAlert = async (email: string, name: string, type: 'FAILED_ATTEMPT' | 'ACCOUNT_LOCKED', ip: string): Promise<{ success: boolean; error?: string }> => {
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

/**
 * Envía notificaciones de período académico por email a múltiples usuarios
 */
export const sendPeriodNotification = async (
  users: Array<{ email: string; name: string }>,
  subject: string,
  message: string,
  periodName: string,
): Promise<void> => {
  const html = `
    <div style="font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%); padding: 24px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 20px;">SIGP UNEFA</h1>
        <p style="color: rgba(255,255,255,0.75); margin: 6px 0 0; font-size: 13px;">Notificación de Período Académico</p>
      </div>
      <div style="padding: 28px; color: #1e293b; line-height: 1.6;">
        <h2 style="color: #1e40af; font-size: 18px; margin: 0 0 12px;">${subject}</h2>
        <p style="margin: 0 0 16px; color: #475569;">${message}</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">
        <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0;">
          SIGP UNEFA — Sistema de Gestión de Personal<br>
          Este es un mensaje automático, por favor no responder.
        </p>
      </div>
    </div>
  `;

  const results = await Promise.all(
    users.map(u =>
      sendEmail({
        to: u.email,
        subject: `${subject} - SIGP UNEFA`,
        html,
        text: `${subject}\n\nHola ${u.name},\n\n${message}`,
      })
    )
  );

  const failed = results.filter(r => !r.success).length;
  if (failed > 0) {
    console.error(`[PeriodEmail] ${failed}/${users.length} emails failed to send`);
  }
};
