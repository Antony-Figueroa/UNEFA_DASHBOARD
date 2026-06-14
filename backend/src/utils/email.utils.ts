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

  // 2. Resend API (fallback para serverless/producción)
  const resendResult = await tryResend(options);
  if (resendResult !== null) return resendResult;

  // 3. Último recurso: simulación en consola
  return trySimulation(options);
};

// ═════════════════════════════════════════════════════════════════
//  PLANTILLA HTML UNIFICADA
// ═════════════════════════════════════════════════════════════════

interface EmailTemplateOptions {
  /** Título del encabezado (se muestra bajo "SIGP UNEFA") */
  headerSubtitle?: string;
  /** Color del header gradient. Por defecto azul institucional */
  headerGradient?: string;
  /** Color del texto del botón/acento primario */
  accentColor?: string;
  /** Ocultar header */
  noHeader?: boolean;
}

/**
 * Construye HTML completo con el branding unificado de SIGP UNEFA.
 * Todas las funciones de email deben usar esta función para generar el HTML.
 */
export const buildEmailHtml = (bodyContent: string, options?: EmailTemplateOptions): string => {
  const { headerSubtitle = 'Sistema de Gestión de Personal', headerGradient = 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)' } = options || {};

  return `
    <div style="font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
      ${options?.noHeader ? '' : `
        <div style="background: ${headerGradient}; padding: 28px 24px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">SIGP UNEFA</h1>
          <p style="color: rgba(255,255,255,0.75); margin: 6px 0 0; font-size: 13px;">${headerSubtitle}</p>
        </div>
      `}
      <div style="padding: 28px 32px 24px; color: #1e293b; line-height: 1.6;">
        ${bodyContent}
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;">
        <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0;">
          SIGP UNEFA — Sistema de Gestión de Personal<br>
          Este es un mensaje automático, por favor no responder.
        </p>
      </div>
    </div>
  `;
};

/** Helper para badge/box con información */
const infoBox = (content: string, bgColor = '#f8fafc', borderColor = '#e2e8f0'): string => `
  <div style="background: ${bgColor}; border: 1px solid ${borderColor}; border-radius: 8px; padding: 14px 16px; margin: 16px 0;">
    ${content}
  </div>
`;

/** Helper para botón CTA */
const ctaButton = (url: string, label: string, color = '#1e40af'): string => `
  <div style="text-align: center; margin: 24px 0;">
    <a href="${url}" style="display: inline-block; background: ${color}; color: #ffffff; padding: 13px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; box-shadow: 0 2px 4px rgba(0,0,0,0.15);">
      ${label}
    </a>
  </div>
`;

// ═════════════════════════════════════════════════════════════════
//  FUNCIONES DE EMAIL (todas usan buildEmailHtml)
// ═════════════════════════════════════════════════════════════════

/**
 * Envía correo de notificación de reseteo de clave para usuario existente.
 */
export const sendPasswordResetEmail = async (email: string, name: string, userCi: string, tempPass: string): Promise<{ success: boolean; error?: string }> => {
  const portalUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  const body = `
    <h2 style="color: #d97706; font-size: 20px; margin: 0 0 16px;">Clave Reseteada</h2>
    <p style="margin: 0 0 8px;">Hola <strong>${name}</strong>,</p>
    <p style="margin: 0 0 16px; color: #475569;">
      Un administrador ha solicitado el reseteo de tu clave de acceso al SIGP UNEFA.
    </p>
    <p style="margin: 0 0 8px; color: #475569;">A continuación tus credenciales temporales:</p>
    ${infoBox(`
      <p style="margin: 5px 0;"><strong>Usuario:</strong> ${userCi}</p>
      <p style="margin: 5px 0;"><strong>Clave Temporal:</strong> <span style="font-family: monospace; font-size: 1.1em; font-weight: bold; color: #92400e;">${tempPass}</span></p>
    `, '#fefce8', '#fde68a')}
    <p style="margin: 0 0 8px; color: #475569;">Al iniciar sesión se te solicitará cambiar esta clave por una nueva.</p>
    ${ctaButton(`${portalUrl}/signin`, 'Ir al Portal', '#d97706')}
    <p style="font-size: 0.875rem; color: #64748b;">
      Si no solicitaste este cambio, contactá al administrador del sistema de inmediato.
    </p>
  `;

  return sendEmail({
    to: email,
    subject: 'Tu clave ha sido reseteada - SIGP UNEFA',
    html: buildEmailHtml(body, { headerSubtitle: 'Seguridad de Cuenta' }),
    text: `Hola ${name}, tu clave de acceso ha sido reseteada. Usuario: ${userCi}, Clave temporal: ${tempPass}. Accedé en: ${portalUrl}/signin`
  });
};

/**
 * Servicio para envío de correos electrónicos de creación de cuenta.
 */
export const sendUserCreationEmail = async (email: string, name: string, userCi: string, tempPass: string): Promise<{ success: boolean; error?: string }> => {
  const portalUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const validityHours = 24;

  const body = `
    <h2 style="color: #1e40af; font-size: 20px; margin: 0 0 16px;">¡Bienvenido, ${name}!</h2>
    <p style="margin: 0 0 12px; color: #475569;">Se ha creado exitosamente tu cuenta en el <strong>Sistema de Gestión de Personal UNEFA</strong>.</p>
    <p style="margin: 0 0 8px; color: #475569;">Para acceder por primera vez, utiliza las siguientes credenciales temporales:</p>
    ${infoBox(`
      <p style="margin: 5px 0;"><strong>Usuario:</strong> ${userCi}</p>
      <p style="margin: 5px 0;"><strong>Contraseña Temporal:</strong> ${tempPass}</p>
    `)}
    <p style="margin: 0 0 4px; font-size: 13px; color: #64748b;">
      <strong>Nota:</strong> Se te solicitará cambiar tu contraseña obligatoriamente en el primer acceso.
      Esta contraseña temporal tiene una validez de ${validityHours} horas.
    </p>
    ${ctaButton(`${portalUrl}/signin`, 'Acceder al Portal')}
  `;

  return sendEmail({
    to: email,
    subject: 'Bienvenido al SIGP UNEFA - Credenciales de Acceso',
    html: buildEmailHtml(body, { headerSubtitle: 'Creación de Cuenta' }),
    text: `Hola ${name}, tu cuenta ha sido creada. Usuario: ${userCi}, Contraseña: ${tempPass}. Accede en: ${portalUrl}/signin`
  });
};

/**
 * Notifica un inicio de sesión exitoso
 */
export const sendLoginNotification = async (email: string, name: string, ip: string, userAgent: string): Promise<{ success: boolean; error?: string }> => {
  const date = new Date().toLocaleString('es-VE');

  const body = `
    <h2 style="color: #1e40af; font-size: 20px; margin: 0 0 16px;">Nuevo inicio de sesión</h2>
    <p style="margin: 0 0 12px; color: #475569;">Hola <strong>${name}</strong>, se ha detectado un nuevo inicio de sesión en tu cuenta de SIGP UNEFA.</p>
    ${infoBox(`
      <p style="margin: 5px 0;"><strong>Fecha:</strong> ${date}</p>
      <p style="margin: 5px 0;"><strong>IP:</strong> ${ip}</p>
      <p style="margin: 5px 0;"><strong>Dispositivo:</strong> ${userAgent}</p>
    `)}
    <p style="font-size: 13px; color: #64748b;">Si has sido tú, puedes ignorar este mensaje. Si no reconoces este acceso, cambia tu contraseña inmediatamente.</p>
  `;

  return sendEmail({
    to: email,
    subject: 'Notificación de Acceso - SIGP UNEFA',
    html: buildEmailHtml(body, { headerSubtitle: 'Seguridad de Cuenta' }),
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

  const body = `
    <h2 style="color: #1e40af; font-size: 20px; margin: 0 0 16px;">Recuperación de Contraseña</h2>
    <p style="margin: 0 0 8px;">Hola <strong>${name}</strong>,</p>
    <p style="margin: 0 0 16px; color: #475569;">
      Recibimos una solicitud para restablecer la contraseña de tu cuenta en el Sistema de Gestión de Personal UNEFA.
    </p>
    <p style="margin: 0 0 20px; color: #475569;">
      Hacé clic en el siguiente botón para crear una nueva contraseña:
    </p>
    ${ctaButton(recoveryUrl, 'Restablecer Contraseña')}
    <p style="margin: 16px 0 8px; font-size: 13px; color: #64748b;">
      Si el botón no funciona, copiá y pegá este enlace en tu navegador:
    </p>
    <p style="word-break: break-all; color: #2563eb; font-size: 13px; background: #f8fafc; padding: 10px 14px; border-radius: 6px; border: 1px solid #e2e8f0; margin: 0 0 20px; font-family: monospace;">${recoveryUrl}</p>
    <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 14px 16px; margin: 16px 0;">
      <p style="margin: 0; font-size: 13px; color: #991b1b;">
        <strong>⚠️ Importante:</strong> Este enlace expira en ${validityHours} horas. Si no solicitaste este cambio, ignorá este mensaje y contactá al administrador del sistema.
      </p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: 'Recuperación de Contraseña - SIGP UNEFA',
    html: buildEmailHtml(body, { headerSubtitle: 'Recuperación de Contraseña' }),
    text: `Hola ${name}, restablecé tu contraseña en: ${recoveryUrl}. Este enlace expira en ${validityHours} horas. Si no solicitaste esto, contactá al administrador.`
  });
};

/**
 * Notifica que la contraseña ha sido cambiada exitosamente
 */
export const sendPasswordChangedNotification = async (email: string, name: string): Promise<{ success: boolean; error?: string }> => {
  const date = new Date().toLocaleString('es-VE');

  const body = `
    <div style="text-align: center; margin-bottom: 8px;">
      <div style="display: inline-flex; align-items: center; justify-content: center; width: 56px; height: 56px; border-radius: 50%; background: #d1fae5;">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
    </div>
    <h2 style="color: #059669; font-size: 20px; margin: 0 0 12px; text-align: center;">Contraseña cambiada</h2>
    <p style="margin: 0; color: #475569; text-align: center;">
      Hola <strong>${name}</strong>, la contraseña de tu cuenta en SIGP UNEFA ha sido actualizada correctamente <strong>${date}</strong>.
    </p>
    <p style="margin: 16px 0 0; font-size: 13px; color: #64748b; text-align: center;">
      Si no has realizado este cambio, contactá al administrador del sistema de inmediato.
    </p>
  `;

  return sendEmail({
    to: email,
    subject: 'Seguridad: Tu contraseña ha sido cambiada - SIGP UNEFA',
    html: buildEmailHtml(body, { headerSubtitle: 'Seguridad de Cuenta' }),
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

  const body = `
    <div style="text-align: center; margin-bottom: 8px;">
      <div style="display: inline-flex; align-items: center; justify-content: center; width: 56px; height: 56px; border-radius: 50%; background: #fef2f2;">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
    </div>
    <h2 style="color: #ef4444; font-size: 20px; margin: 0 0 12px; text-align: center;">${title}</h2>
    <p style="margin: 0 0 12px; color: #475569; text-align: center;">Hola <strong>${name}</strong>, ${message}</p>
    ${infoBox(`
      <p style="margin: 5px 0;"><strong>Fecha:</strong> ${date}</p>
      <p style="margin: 5px 0;"><strong>Origen IP:</strong> ${ip}</p>
    `, '#fef2f2', '#fecaca')}
    <p style="margin: 0; font-size: 13px; color: #64748b; text-align: center;">
      Si no has sido tú, por favor contactá con soporte técnico de UNEFA.
    </p>
  `;

  return sendEmail({
    to: email,
    subject: `${subject} - SIGP UNEFA`,
    html: buildEmailHtml(body, { headerSubtitle: 'Alerta de Seguridad' }),
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
  const body = `
    <h2 style="color: #1e40af; font-size: 18px; margin: 0 0 12px;">${subject}</h2>
    <p style="margin: 0 0 8px;">Hola <strong>{{name}}</strong>,</p>
    <p style="margin: 0 0 16px; color: #475569;">${message}</p>
  `;

  const results = await Promise.all(
    users.map(u =>
      sendEmail({
        to: u.email,
        subject: `${subject} - SIGP UNEFA`,
        html: buildEmailHtml(body.replace('{{name}}', u.name), { headerSubtitle: 'Notificación de Período Académico' }),
        text: `${subject}\n\nHola ${u.name},\n\n${message}`,
      })
    )
  );

  const failed = results.filter(r => !r.success).length;
  if (failed > 0) {
    console.error(`[PeriodEmail] ${failed}/${users.length} emails failed to send`);
  }
};
