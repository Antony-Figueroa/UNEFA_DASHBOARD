import { dbManager } from '../lib/db-manager.js';
import { comparePassword, hashPassword, generateToken, verifyToken as verifyJWT } from '../utils/auth.utils.js';
import { sendLoginNotification, sendSecurityAlert, sendPasswordRecoveryEmail, sendPasswordChangedNotification } from '../utils/email.utils.js';
import { nowStringVenezuela, nowInVenezuela } from '../utils/date.utils.js';
import crypto from 'crypto';

const tokenBlacklist = new Map<string, { userId: number; userCi: string; expiresAt: number }>();

setInterval(() => {
  const now = Date.now();
  for (const [hash, data] of tokenBlacklist.entries()) {
    if (data.expiresAt < now) {
      tokenBlacklist.delete(hash);
    }
  }
}, 60 * 60 * 1000);

export const revokeToken = (token: string, userId: number, userCi: string) => {
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  const decoded = verifyJWT(token) as { exp?: number } | null;
  const expiresAt = decoded?.exp ? decoded.exp * 1000 : Date.now() + 3600000;
  tokenBlacklist.set(hash, { userId, userCi, expiresAt });
};

export const isTokenRevoked = (token: string): { revoked: boolean; data?: { userId: number; userCi: string } } => {
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  const data = tokenBlacklist.get(hash);
  if (data) {
    if (data.expiresAt < Date.now()) {
      tokenBlacklist.delete(hash);
      return { revoked: false };
    }
    return { revoked: true, data };
  }
  return { revoked: false };
};

export const logAuthAction = async (userId: number | null, userCi: string | null, action: string, ip: string, userAgent: string, details: string) => {
  try {
    await dbManager.withRetry(async (supabase) => {
      const { error } = await supabase.from('t_auth_log').insert({
        USER_ID: userId,
        USER_CI: userCi,
        ACTION: action,
        IP_ADDRESS: ip,
        USER_AGENT: userAgent,
        DETAILS: details
      });
      if (error) {
        // Si el error es que la tabla no existe, no lanzamos excepción para no romper el flujo principal
        if (error.code === 'PGRST204' || error.code === 'PGRST205') {
          console.warn(`[AuthLog] La tabla t_auth_log no existe. Acción '${action}' no registrada.`);
          return;
        }
        throw error;
      }
    });
  } catch (error) {
    console.error('[AuthLog] Error al registrar acción de autenticación:', error);
  }
};

interface UserRow {
  USER_ID: number;
  USER_CI: string;
  STATUS: number;
  FAILED_ATTEMPTS?: number;
  LOCK_DATE?: string;
  FORCE_PASSWORD_CHANGE?: boolean;
  LOGIN?: number;
  NAME: string;
  SECOND_NAME?: string;
  SURNAME: string;
  SECOND_SURNAME?: string;
  EMAIL: string;
  PHONE_NUMBER?: string;
  t_user_roles?: { ID_ROLES: number }[];
  /** Flat column for PGlite adapter joins */
  t_user_roles_ID_ROLES?: number;
}

interface UserKeyRow {
  USER_KEY_ID: number;
  USER_ID: number;
  KEY: string;
  STATUS: number;
  IS_TEMPORARY?: boolean;
}

/**
 * Genera un fingerprint simple del dispositivo a partir del User-Agent.
 * Extrae el navegador y SO para detectar si es un dispositivo conocido.
 */
const getDeviceFingerprint = (userAgent: string): string => {
  const ua = userAgent.toLowerCase();
  const browser = ua.includes('firefox') ? 'firefox'
    : ua.includes('edge') || ua.includes('edg/') ? 'edge'
    : ua.includes('chrome') ? 'chrome'
    : ua.includes('safari') ? 'safari'
    : 'unknown';
  const os = ua.includes('windows') ? 'windows'
    : ua.includes('mac os') || ua.includes('macintosh') ? 'mac'
    : ua.includes('linux') || ua.includes('x11') ? 'linux'
    : ua.includes('android') ? 'android'
    : ua.includes('iphone') || ua.includes('ipad') ? 'ios'
    : 'unknown';
  return `${browser}-${os}`;
};

export const login = async (userCi: string, password: string, ip: string, userAgent: string, jwtExpiresIn?: string) => {
   return await dbManager.withRetry(async (supabase) => {
     // 1. Buscar usuario por CI
     const { data: userData, error: userError } = await supabase
       .from('t_user')
       .select('*, t_user_roles(ID_ROLES)')
       .eq('USER_CI', userCi)
       .single();

    const user = userData as unknown as UserRow;

    if (userError || !user) {
      await logAuthAction(null, userCi, 'LOGIN_FAILED', ip, userAgent, 'Usuario no encontrado');
      return { success: false, status: 401, message: 'Credenciales inválidas.' };
    }

    // 2. Verificar si está bloqueado
    if (user.STATUS === 0 && user.LOCK_DATE) {
      const lockDate = new Date(user.LOCK_DATE);
      if (lockDate > new Date()) {
        const remainingMs = lockDate.getTime() - Date.now();
        const minutes = Math.ceil(remainingMs / (60 * 1000));
        await logAuthAction(user.USER_ID, userCi, 'LOGIN_FAILED', ip, userAgent, 'Cuenta bloqueada');
        return { 
          success: false, 
          status: 403, 
          message: 'Cuenta bloqueada temporalmente. Intente más tarde.' 
        };
      } else {
        // Desbloquear automáticamente si ya pasó el tiempo
        await supabase.from('t_user').update({ STATUS: 1, FAILED_ATTEMPTS: 0, LOCK_DATE: null }).eq('USER_ID', user.USER_ID);
        user.STATUS = 1;
        user.FAILED_ATTEMPTS = 0;
      }
    } else if (user.STATUS === 0) {
      await logAuthAction(user.USER_ID, userCi, 'LOGIN_FAILED', ip, userAgent, 'Cuenta bloqueada');
      return { success: false, status: 403, message: 'Cuenta bloqueada temporalmente. Intente más tarde.' };
    }

    // 3. Obtener la clave actual activa
    const { data: keyData, error: keyError } = await supabase
      .from('t_user_key')
      .select('*')
      .eq('USER_ID', user.USER_ID)
      .eq('STATUS', 1)
      .order('START_DATE', { ascending: false })
      .limit(1)
      .single();

    const userKey = keyData as unknown as UserKeyRow;

    if (keyError || !userKey) {
      await logAuthAction(user.USER_ID, userCi, 'LOGIN_FAILED', ip, userAgent, 'Clave no configurada');
      return { success: false, status: 401, message: 'Credenciales inválidas' };
    }

    // 4. Comparar contraseña
    const isMatch = await comparePassword(password, userKey.KEY);

    if (!isMatch) {
      const newFailedAttempts = (user.FAILED_ATTEMPTS || 0) + 1;
      
      const { data: configData } = await supabase
        .from('t_config')
        .select('ATTEMPTS_KEY_BLOCK, BLOCKING_DAYS')
        .eq('CONFIG_ID', 1)
        .single();
      
      const MAX_ATTEMPTS = (configData as any)?.ATTEMPTS_KEY_BLOCK || 5;
      const BLOCKING_DAYS = (configData as any)?.BLOCKING_DAYS || 1;
      const attemptsRemaining = MAX_ATTEMPTS - newFailedAttempts;
      
      try {
        if (newFailedAttempts >= MAX_ATTEMPTS) {
          const lockUntil = new Date(Date.now() + BLOCKING_DAYS * 24 * 60 * 60 * 1000).toISOString();
          const updateData: Partial<UserRow> = { STATUS: 0 };
          
          if ('FAILED_ATTEMPTS' in user) updateData.FAILED_ATTEMPTS = newFailedAttempts;
          if ('LOCK_DATE' in user) updateData.LOCK_DATE = lockUntil;
          
          await supabase.from('t_user').update(updateData).eq('USER_ID', user.USER_ID);
          
          await logAuthAction(user.USER_ID, userCi, 'ACCOUNT_LOCKED', ip, userAgent, `Máximo de intentos alcanzado. Bloqueado hasta ${lockUntil}`);
          
          sendSecurityAlert(user.EMAIL, user.NAME, 'ACCOUNT_LOCKED', ip).catch(console.error);

          return { 
            success: false, 
            status: 403, 
            message: 'Cuenta bloqueada por demasiados intentos fallidos. Intente más tarde.' 
          };
        } else {
          if ('FAILED_ATTEMPTS' in user) {
            await supabase.from('t_user').update({ FAILED_ATTEMPTS: newFailedAttempts }).eq('USER_ID', user.USER_ID);
          }
          await logAuthAction(user.USER_ID, userCi, 'LOGIN_FAILED', ip, userAgent, `Intento fallido ${newFailedAttempts}/${MAX_ATTEMPTS}`);
          
          if (newFailedAttempts >= 3) {
            sendSecurityAlert(user.EMAIL, user.NAME, 'FAILED_ATTEMPT', ip).catch(console.error);
          }

          return { 
            success: false, 
            status: 401, 
            message: 'Credenciales inválidas.'
          };
        }
      } catch (updateError) {
        console.error('[Auth] Error al actualizar intentos fallidos (posiblemente faltan columnas en DB):', updateError);
        return { 
          success: false, 
          status: 401, 
          message: 'Contraseña incorrecta.' 
        };
      }
    }

    // 5. Login exitoso - Resetear intentos
    try {
      const resetData: Partial<UserRow> = { STATUS: 1 };
      if ('FAILED_ATTEMPTS' in user) resetData.FAILED_ATTEMPTS = 0;
      if ('LOCK_DATE' in user) resetData.LOCK_DATE = undefined;
      await supabase.from('t_user').update(resetData).eq('USER_ID', user.USER_ID);
    } catch (resetError) {
      console.warn('[Auth] No se pudieron resetear los intentos fallidos:', resetError);
    }

    // Extraer role — soporta tanto Supabase (anidado) como PGlite (plano)
    const roleId = user.t_user_roles?.[0]?.ID_ROLES ?? user.t_user_roles_ID_ROLES ?? null;

    // 6. Verificar si requiere cambio de clave
    if (userKey.IS_TEMPORARY || user.FORCE_PASSWORD_CHANGE) {
      const isFirstLogin = (user.LOGIN ?? 0) === 0;
      // Generar token temporal (15 min) para que el frontend pueda llamar cambio de clave
      const tempToken = generateToken({ 
        userId: user.USER_ID, 
        userCi: user.USER_CI,
        role: roleId 
      }, '15m');
      return { 
        success: true,
        requirePasswordChange: true,
        userId: user.USER_ID,
        isFirstLogin,
        tempToken,
        message: isFirstLogin 
          ? 'Debe completar la configuración inicial de su cuenta'
          : 'Un administrador reseteó su clave. Debe cambiarla antes de continuar.'
      };
    }

    // 7. Generar Token
    const token = generateToken({ 
      userId: user.USER_ID, 
      userCi: user.USER_CI,
      role: roleId 
    }, jwtExpiresIn);

    await logAuthAction(user.USER_ID, userCi, 'LOGIN_SUCCESS', ip, userAgent, 'Inicio de sesión exitoso');

    // Notificar solo si es un dispositivo/IP no reconocido
    const deviceFingerprint = getDeviceFingerprint(userAgent);
    try {
      const { count: knownLogins } = await supabase
        .from('t_auth_log')
        .select('*', { count: 'exact', head: true })
        .eq('USER_ID', user.USER_ID)
        .eq('ACTION', 'LOGIN_SUCCESS')
        .or(`USER_AGENT.ilike.%${deviceFingerprint}%,IP_ADDRESS.eq.${ip}`)
        .gte('CREATED_AT', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (!knownLogins || knownLogins === 0) {
        sendLoginNotification(user.EMAIL, user.NAME, ip, userAgent).catch(console.error);
      }
    } catch {
      // Fallback: enviar notificación si falla la verificación
      sendLoginNotification(user.EMAIL, user.NAME, ip, userAgent).catch(console.error);
    }

    return { 
      success: true,
      token,
      user: {
        id: user.USER_ID,
        name: user.NAME,
        surname: user.SURNAME,
        email: user.EMAIL,
        role: roleId
      }
    };
  });
};

export const verifyMaster = async (userId: number, password: string, ip: string, userAgent: string) => {
  return await dbManager.withRetry(async (supabase) => {
    // 1. Obtener usuario y su clave
    const { data: userData, error: userError } = await supabase
      .from('t_user')
      .select('*, t_user_roles(ID_ROLES)')
      .eq('USER_ID', userId)
      .single();

    if (userError || !userData) return { success: false, message: 'Usuario no encontrado' };

    const user = userData as unknown as UserRow;

    // 2. Verificar rol (Debe ser ADMIN = 1)
    const userRole = user.t_user_roles?.[0]?.ID_ROLES ?? user.t_user_roles_ID_ROLES;
    if (userRole !== 1) {
      return { success: false, message: 'Acceso denegado: Se requieren permisos administrativos' };
    }

    // 3. Obtener clave activa
    const { data: keyData } = await supabase
      .from('t_user_key')
      .select('KEY')
      .eq('USER_ID', userId)
      .eq('STATUS', 1)
      .single();

    if (!keyData) return { success: false, message: 'No se encontró una clave activa para este usuario.' };

    // 4. Comparar clave
    const isValid = await comparePassword(password, keyData.KEY);
    if (!isValid) {
      await logAuthAction(userId, user.USER_CI, 'MASTER_VERIFICATION_FAILED', ip, userAgent, 'Contraseña incorrecta para verificación maestra');
      return { success: false, message: 'La contraseña ingresada es incorrecta.' };
    }

    // 5. Generar token de verificación de corta duración (5 min)
    const verificationToken = generateToken({ 
      userId, 
      type: 'master_verification',
      timestamp: Date.now()
    }, '5m');

    await logAuthAction(userId, user.USER_CI, 'MASTER_VERIFICATION_SUCCESS', ip, userAgent, 'Verificación maestra exitosa');

    return { success: true, verificationToken };
  });
};

interface ProfileData {
  name?: string;
  secondName?: string;
  surname?: string;
  secondSurname?: string;
  phoneNumber?: string;
  email?: string;
}

export const changePassword = async (
  userId: number, 
  newPassword: string, 
  securityQuestions?: { questionId: number, answer: string, customQuestion?: string, isCustom?: boolean }[],
  profileData?: ProfileData
) => {
  return await dbManager.withRetry(async (supabase) => {
    // 1. Obtener claves anteriores para evitar reutilización
    const { data: previousKeys } = await supabase
      .from('t_user_key')
      .select('KEY')
      .eq('USER_ID', userId)
      .order('START_DATE', { ascending: false })
      .limit(5);

    const { data: historyKeys } = await supabase
      .from('t_password_history')
      .select('KEY')
      .eq('USER_ID', userId)
      .order('CREATION_DATE', { ascending: false })
      .limit(5);

    const allPreviousKeys = [...(previousKeys || []), ...(historyKeys || [])];

    for (const entry of allPreviousKeys) {
      const isMatch = await comparePassword(newPassword, entry.KEY);
      if (isMatch) {
        throw new Error('No puede reutilizar ninguna de sus últimas 5 contraseñas por motivos de seguridad.');
      }
    }

    // 2. Registrar la clave actual en el historial antes de cambiarla
    const { data: currentKey } = await supabase
      .from('t_user_key')
      .select('KEY')
      .eq('USER_ID', userId)
      .eq('STATUS', 1)
      .single();

    if (currentKey) {
      try {
        await supabase.from('t_password_history').insert({
          USER_ID: userId,
          KEY: currentKey.KEY,
          CREATION_DATE: nowStringVenezuela()
        });
      } catch (e) {
        console.warn('[Auth] No se pudo guardar en el historial (posiblemente la tabla no existe):', e);
      }
    }

    const hashedPassword = await hashPassword(newPassword);

    // 3. Desactivar clave anterior
    await supabase.from('t_user_key').update({ STATUS: 0 }).eq('USER_ID', userId).eq('STATUS', 1);

    // 4. Insertar nueva clave
    const nowVe = nowStringVenezuela();
    const expiry = new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString();
    
    await supabase.from('t_user_key').insert({
      USER_ID: userId,
      KEY: hashedPassword,
      START_DATE: nowVe,
      END_DATE: expiry,
      STATUS: 1,
      IS_TEMPORARY: false,
      MODIF_USER_ID: userId,
      MODIF_USER_DATE: nowVe,
      ELIM_USER_ID: 0,
      ELIM_USER_DATE: '2025-01-01 00:00:00',
      REST_USER_ID: 0,
      REST_USER_DATE: '2025-01-01 00:00:00'
    });

    // 5. Actualizar estado del usuario y perfil (si es primer ingreso)
    // Primero actualizamos los datos del perfil
    const profileUpdateData: any = { 
        LOGIN: 1,
        TERMS_CONDITIONS: 'ACEPTADO'
    };
    
    if (profileData) {
        if (profileData.name) profileUpdateData.NAME = profileData.name.toUpperCase();
        if (profileData.secondName) profileUpdateData.SECOND_NAME = profileData.secondName.toUpperCase();
        if (profileData.surname) profileUpdateData.SURNAME = profileData.surname.toUpperCase();
        if (profileData.secondSurname) profileUpdateData.SECOND_SURNAME = profileData.secondSurname.toUpperCase();
        if (profileData.phoneNumber) profileUpdateData.PHONE_NUMBER = profileData.phoneNumber;
        if (profileData.email) profileUpdateData.EMAIL = profileData.email.toUpperCase();
    }
    
    // Segundo, nos aseguramos de desactivar los flags de seguridad
    const securityResetData: Partial<UserRow> = { 
        FORCE_PASSWORD_CHANGE: false,
        // También resetear intentos fallidos por seguridad
        FAILED_ATTEMPTS: 0,
        LOCK_DATE: undefined
    };
    
    // Aplicar actualización de perfil si hay datos
    if (Object.keys(profileUpdateData).length > 0) {
        await supabase.from('t_user').update(profileUpdateData).eq('USER_ID', userId);
    }
    
    // Siempre aplicar reset de seguridad
    await supabase.from('t_user').update(securityResetData).eq('USER_ID', userId);

    // 6. Guardar preguntas de seguridad
    if (securityQuestions && Array.isArray(securityQuestions)) {
      // Primero eliminar anteriores si existen
      await supabase.from('t_security_questions').delete().eq('USER_ID', userId);
      
      // Mapear preguntas (preset y personalizadas)
      const questionsToInsert = securityQuestions
        .filter(q => q.isCustom ? q.customQuestion && q.customQuestion.trim() : q.questionId > 0)
        .map(q => ({
          USER_ID: userId,
          PRESET_QUESTION_ID: q.isCustom ? null : q.questionId,
          CUSTOM_QUESTION: q.isCustom ? q.customQuestion?.toUpperCase() : null,
          ANSWER: q.answer.toUpperCase()
        }));
      
      if (questionsToInsert.length > 0) {
        await supabase.from('t_security_questions').insert(questionsToInsert);
      }
    }

    return { success: true, message: 'Contraseña actualizada correctamente' };
  });
};

/**
 * Solicita la recuperación de contraseña por email
 */
export const requestPasswordReset = async (email: string, ip: string, userAgent: string) => {
  // Siempre responder con el mismo mensaje para evitar user enumeration
  try {
    await dbManager.withRetry(async (supabase) => {
      const { data: user } = await supabase
        .from('t_user')
        .select('USER_ID, NAME, EMAIL, USER_CI, STATUS')
        .eq('EMAIL', email)
        .single();

      if (user && user.STATUS !== 0) {
        const token = crypto.randomBytes(32).toString('hex');
        const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

        await supabase.from('t_recovery_tokens').insert({
          USER_ID: user.USER_ID,
          TOKEN: token,
          EXPIRATION_DATE: expiry,
          STATUS: 1
        }).catch(() => {});

        await logAuthAction(user.USER_ID, user.USER_CI, 'PASSWORD_RESET_REQUESTED', ip, userAgent, 'Solicitud de restablecimiento de contraseña vía email').catch(() => {});
        sendPasswordRecoveryEmail(user.EMAIL, user.NAME, token).catch(() => {});
      }
    });
  } catch {
    // Silently ignore — same generic response either way
  }

  return { success: true, message: 'Si el correo está registrado, recibirás las instrucciones para restablecer tu contraseña.' };
};

/**
 * Restablece la contraseña usando un token válido
 */
export const resetPasswordWithToken = async (token: string, newPassword: string, ip: string, userAgent: string) => {
  return await dbManager.withRetry(async (supabase) => {
    // 1. Validar token
    const { data: tokenData, error: tokenError } = await supabase
      .from('t_recovery_tokens')
      .select('TOKEN_ID, USER_ID, EXPIRATION_DATE, STATUS, t_user(NAME, EMAIL, USER_CI)')
      .eq('TOKEN', token)
      .single();

    if (tokenError || !tokenData) {
      return { success: false, message: 'El enlace de recuperación no es válido o ha expirado.' };
    }

    if (tokenData.STATUS === 0) {
      return { success: false, message: 'Este enlace ya ha sido utilizado.' };
    }

    if (new Date(tokenData.EXPIRATION_DATE) < new Date()) {
      return { success: false, message: 'El enlace de recuperación ha expirado.' };
    }

    const userData = Array.isArray(tokenData.t_user) ? tokenData.t_user[0] : tokenData.t_user;
    if (!userData) {
      return { success: false, message: 'Usuario no encontrado.' };
    }

    // 2. Cambiar contraseña (reutilizamos la lógica de cambio con validaciones)
    const changeResult = await changePassword(tokenData.USER_ID, newPassword);
    
    if (!changeResult.success) return changeResult;

    // 3. Marcar token como usado
    await supabase.from('t_recovery_tokens').update({ STATUS: 0 }).eq('TOKEN_ID', tokenData.TOKEN_ID);

    // 4. Registrar auditoría
    await logAuthAction(tokenData.USER_ID, userData.USER_CI, 'PASSWORD_RESET_COMPLETED', ip, userAgent, 'Restablecimiento de contraseña exitoso mediante token de email');

    // 5. Notificar por email
    await sendPasswordChangedNotification(userData.EMAIL, userData.NAME);

    return { success: true, message: 'Tu contraseña ha sido restablecida exitosamente.' };
  });
};

export const getSecurityQuestions = async (_userCi: string) => {
  return await dbManager.withRetry(async (_supabase) => {
    // Respuesta genérica idéntica para evitar user enumeration
    return { success: true, message: 'Si la cédula está registrada, recibirás las instrucciones en tu correo electrónico.' };
  });
};

export const verifySecurityQuestions = async (userId: number, answers: { questionId: number, answer: string, isCustom?: boolean }[]) => {
  return await dbManager.withRetry(async (supabase) => {
    interface SecurityQuestionResult {
      PRESET_QUESTION_ID: number | null;
      CUSTOM_QUESTION: string | null;
      ANSWER: string;
    }

    const { data: storedQuestions, error } = await supabase
      .from('t_security_questions')
      .select('PRESET_QUESTION_ID, CUSTOM_QUESTION, ANSWER')
      .eq('USER_ID', userId);

    if (error || !storedQuestions || storedQuestions.length === 0) {
      return { success: false, message: 'No se encontraron preguntas de seguridad configuradas' };
    }

    const stored = storedQuestions as unknown as SecurityQuestionResult[];

    // Verificar cada respuesta
    for (const provided of answers) {
      let isValid = false;

      if (provided.isCustom) {
        // Para preguntas personalizadas, buscar por CUSTOM_QUESTION
        const customStored = stored.find(q => !q.PRESET_QUESTION_ID && q.CUSTOM_QUESTION);
        if (customStored && customStored.ANSWER.toLowerCase().trim() === provided.answer.toLowerCase().trim()) {
          isValid = true;
        }
      } else {
        // Para preguntas preset
        const presetStored = stored.find(q => q.PRESET_QUESTION_ID === provided.questionId);
        if (presetStored && presetStored.ANSWER.toLowerCase().trim() === provided.answer.toLowerCase().trim()) {
          isValid = true;
        }
      }

      if (!isValid) {
        return { success: false, message: 'Una o más respuestas son incorrectas' };
      }
    }

    // Si todas son correctas, generar un token temporal para el cambio de clave
    const resetToken = generateToken({ userId, type: 'password_reset' });
    
    return { success: true, resetToken };
  });
};

export const resetPassword = async (userId: number, newPassword: string) => {
  return await dbManager.withRetry(async (supabase) => {
    const hashedPassword = await hashPassword(newPassword);
    const nowVe = nowStringVenezuela();
    const expiry = new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString();

    // 1. Desactivar clave anterior
    await supabase.from('t_user_key').update({ STATUS: 0 }).eq('USER_ID', userId).eq('STATUS', 1);

    // 2. Insertar nueva clave
    await supabase.from('t_user_key').insert({
      USER_ID: userId,
      KEY: hashedPassword,
      START_DATE: nowVe,
      END_DATE: expiry,
      STATUS: 1,
      IS_TEMPORARY: false,
      MODIF_USER_ID: userId,
      MODIF_USER_DATE: nowVe,
      ELIM_USER_ID: 0,
      ELIM_USER_DATE: '2025-01-01 00:00:00',
      REST_USER_ID: 0,
      REST_USER_DATE: '2025-01-01 00:00:00'
    });

    // 3. Resetear intentos fallidos y asegurar que la cuenta esté activa
    // Intentamos resetear columnas de seguridad si existen
    try {
      await supabase.from('t_user').update({
        STATUS: 1,
        FAILED_ATTEMPTS: 0,
        LOCK_DATE: undefined,
        FORCE_PASSWORD_CHANGE: false,
        LOGIN: 1
      } as Partial<UserRow>).eq('USER_ID', userId);
    } catch {
      // Fallback si las columnas no existen
      await supabase.from('t_user').update({ 
        STATUS: 1,
        FAILED_ATTEMPTS: 0,
        FORCE_PASSWORD_CHANGE: false
      }).eq('USER_ID', userId);
    }

    return { success: true, message: 'Contraseña restablecida correctamente' };
  });
};

export const getUserById = async (userId: number) => {
  return await dbManager.withRetry(async (supabase) => {
    const { data, error } = await supabase
      .from('t_user')
      .select('USER_ID, USER_CI, NAME, SECOND_NAME, SURNAME, SECOND_SURNAME, EMAIL, PHONE_NUMBER, STATUS, FAILED_ATTEMPTS, LOCK_DATE, FORCE_PASSWORD_CHANGE, t_user_roles(ID_ROLES)')
      .eq('USER_ID', userId)
      .single();

    if (error || !data) {
      return { success: false, message: 'Usuario no encontrado' };
    }

    const user = data as unknown as UserRow;
    return {
      success: true,
      user: {
        id: user.USER_ID,
        userCi: user.USER_CI,
        name: user.NAME,
        secondName: user.SECOND_NAME,
        surname: user.SURNAME,
        secondSurname: user.SECOND_SURNAME,
        email: user.EMAIL,
        phoneNumber: user.PHONE_NUMBER,
        status: user.STATUS,
        failedAttempts: user.FAILED_ATTEMPTS,
        lockDate: user.LOCK_DATE,
        forcePasswordChange: user.FORCE_PASSWORD_CHANGE,
        role: user.t_user_roles?.[0]?.ID_ROLES ?? user.t_user_roles_ID_ROLES ?? 0
      }
    };
  });
};

export const updateProfile = async (userId: number, data: { 
  name: string; 
  secondName?: string; 
  surname: string; 
  secondSurname?: string; 
  email: string; 
  phoneNumber?: string;
}, ip: string = '', userAgent: string = '') => {
  return await dbManager.withRetry(async (supabase) => {
    // 1. Obtener datos actuales para auditoría
    const { data: oldData } = await supabase
      .from('t_user')
      .select('NAME, SECOND_NAME, SURNAME, SECOND_SURNAME, EMAIL, PHONE_NUMBER')
      .eq('USER_ID', userId)
      .single();

    // 2. Actualizar perfil
    const { error } = await supabase
      .from('t_user')
      .update({
        NAME: data.name,
        SECOND_NAME: data.secondName || null,
        SURNAME: data.surname,
        SECOND_SURNAME: data.secondSurname || null,
        EMAIL: data.email,
        PHONE_NUMBER: data.phoneNumber || null
      })
      .eq('USER_ID', userId);

    if (error) {
      console.error('[Auth] Error al actualizar perfil:', error);
      return { success: false, message: 'No se pudo actualizar el perfil' };
    }

    // 3. Registro de auditoría
    const changes = [];
    if (oldData) {
      if (oldData.NAME !== data.name) changes.push(`Nombre: ${oldData.NAME} -> ${data.name}`);
      if (oldData.SECOND_NAME !== (data.secondName || null)) changes.push(`Segundo Nombre: ${oldData.SECOND_NAME} -> ${data.secondName}`);
      if (oldData.SURNAME !== data.surname) changes.push(`Apellido: ${oldData.SURNAME} -> ${data.surname}`);
      if (oldData.SECOND_SURNAME !== (data.secondSurname || null)) changes.push(`Segundo Apellido: ${oldData.SECOND_SURNAME} -> ${data.secondSurname}`);
      if (oldData.EMAIL !== data.email) changes.push(`Email: ${oldData.EMAIL} -> ${data.email}`);
      if (oldData.PHONE_NUMBER !== (data.phoneNumber || null)) changes.push(`Teléfono: ${oldData.PHONE_NUMBER} -> ${data.phoneNumber}`);
    }

    if (changes.length > 0) {
      await logAuthAction(userId, '', 'PROFILE_UPDATE', ip, userAgent, `Cambios realizados: ${changes.join(', ')}`);
    }

    return { success: true, message: 'Perfil actualizado correctamente' };
  });
};

export const getPresetQuestions = async () => {
  return await dbManager.withRetry(async (supabase) => {
    const { data, error } = await supabase
      .from('t_preset_questions')
      .select('PRESET_QUESTION_ID, DESCRIPTION')
      .eq('STATUS', 1);

    if (error) throw error;

    return { 
      success: true, 
      questions: data.map(q => ({
        id: q.PRESET_QUESTION_ID,
        description: q.DESCRIPTION
      }))
    };
  });
};

/**
 * Genera un nuevo token JWT para renovar la sesión
 */
export const generateRefreshToken = (payload: { userId: number; userCi: string; role: number }, expiresIn?: string): string => {
  return generateToken({ 
    userId: payload.userId, 
    userCi: payload.userCi, 
    role: payload.role 
  }, expiresIn || '1h');
};

export const verifyCurrentPassword = async (userId: number, currentPassword: string): Promise<boolean> => {
  return await dbManager.withRetry(async (supabase) => {
    const { data } = await supabase
      .from('t_user_key')
      .select('KEY')
      .eq('USER_ID', userId)
      .eq('STATUS', 1)
      .single();

    if (!data) return false;
    return comparePassword(currentPassword, data.KEY);
  });
};

export const getLoginHistory = async (userId: number, limit: number = 10) => {
  return await dbManager.withRetry(async (supabase) => {
    const { data, error } = await supabase
      .from('t_auth_log')
      .select('*')
      .eq('USER_ID', userId)
      .in('ACTION', ['LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT'])
      .order('CREATED_AT', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  });
};

export const getAllAuthLogs = async (limit: number = 100, offset: number = 0, userId?: number) => {
  return await dbManager.withRetry(async (supabase) => {
    let query = supabase
      .from('t_auth_log')
      .select('*, t_user(USER_CI, NAME, SURNAME)', { count: 'exact' });

    if (userId) {
      query = query.eq('USER_ID', userId);
    }

    const { data, error, count } = await query
      .order('CREATED_AT', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    
    // Transform data to match frontend expectations
    const transformedData = (data || []).map((log: any) => ({
      ...log,
      CREATION_DATE: log.CREATED_AT,  // Map CREATED_AT to CREATION_DATE
      user: log.t_user || null         // Map t_user to user
    }));
    
    return { data: transformedData, total: count || 0 };
  });
};

/**
 * Solicita recuperación de contraseña por cédula
 */
export const requestPasswordResetByCi = async (userCi: string, ip: string, userAgent: string) => {
  // Respuesta genérica idéntica independientemente de si el CI existe
  try {
    return await dbManager.withRetry(async (supabase) => {
      const { data: user } = await supabase
        .from('t_user')
        .select('USER_ID, NAME, EMAIL, USER_CI, STATUS')
        .eq('USER_CI', userCi)
        .single();

      if (user && user.STATUS !== 0 && user.EMAIL) {
        const token = crypto.randomBytes(32).toString('hex');
        const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

        await supabase.from('t_recovery_tokens').insert({
          USER_ID: user.USER_ID,
          TOKEN: token,
          EXPIRATION_DATE: expiry,
          STATUS: 1
        }).catch(() => {});

        await logAuthAction(user.USER_ID, user.USER_CI, 'PASSWORD_RESET_REQUESTED', ip, userAgent, 'Solicitud de restablecimiento de contraseña').catch(() => {});
        sendPasswordRecoveryEmail(user.EMAIL, user.NAME, token).catch(() => {});
      }

      // Misma respuesta para todos los casos
      return { success: true, message: 'Si la cédula está registrada, recibirás las instrucciones en tu correo electrónico.' };
    });
  } catch {
    return { success: true, message: 'Si la cédula está registrada, recibirás las instrucciones en tu correo electrónico.' };
  }
};

/**
 * Obtiene las preguntas de seguridad de un usuario para recuperación
 */
export const getUserSecurityQuestions = async (userCi: string) => {
  try {
    const result = await dbManager.withRetry(async (supabase) => {
      const { data: user } = await supabase
        .from('t_user')
        .select('USER_ID, NAME, EMAIL, STATUS')
        .eq('USER_CI', userCi)
        .single();

      if (user && user.STATUS !== 0) {
        const { data: questions } = await supabase
          .from('t_security_questions')
          .select(`
            PRESET_QUESTION_ID,
            CUSTOM_QUESTION,
            t_preset_questions(DESCRIPTION)
          `)
          .eq('USER_ID', user.USER_ID);

        if (questions && questions.length >= 3) {
          interface SecurityQuestionResult {
            PRESET_QUESTION_ID: number | null;
            CUSTOM_QUESTION: string | null;
            t_preset_questions: { DESCRIPTION: string } | { DESCRIPTION: string }[] | null;
          }

          const formattedQuestions = (questions as unknown as SecurityQuestionResult[]).map(q => ({
            id: q.PRESET_QUESTION_ID || 0,
            questionText: q.PRESET_QUESTION_ID 
              ? (Array.isArray(q.t_preset_questions) ? q.t_preset_questions[0]?.DESCRIPTION : q.t_preset_questions?.DESCRIPTION) || ''
              : q.CUSTOM_QUESTION || '',
            isCustom: !q.PRESET_QUESTION_ID
          }));

          return { 
            success: true, 
            userId: user.USER_ID,
            userCi: userCi,
            email: user.EMAIL ? `${user.EMAIL.substring(0, 3)}***@${user.EMAIL.split('@')[1]}` : '',
            questions: formattedQuestions
          };
        }
      }

      return null;
    });

    if (result) return result;
  } catch {
    // Fall through to generic response
  }

  // Respuesta genérica — no revelar si el CI existe
  return { success: false, message: 'No se encontraron preguntas de seguridad configuradas para esta cédula.' };
};

/**
 * Verifica las respuestas de seguridad y restablece la contraseña
 */
export const verifySecurityAnswersAndReset = async (
  userCi: string, 
  answers: Array<{ questionId: number; answer: string; isCustom?: boolean }>, 
  newPassword: string,
  ip: string,
  userAgent: string
) => {
  return await dbManager.withRetry(async (supabase) => {
    const { data: user, error: userError } = await supabase
      .from('t_user')
      .select('USER_ID, USER_CI, NAME, EMAIL, STATUS')
      .eq('USER_CI', userCi)
      .single();

    if (userError || !user) {
      return { success: false, status: 401, message: 'Las respuestas de seguridad no son correctas.' };
    }

    if (user.STATUS === 0) {
      return { success: false, status: 401, message: 'Las respuestas de seguridad no son correctas.' };
    }

    // Obtener las preguntas de seguridad del usuario
    const { data: storedQuestions, error: qError } = await supabase
      .from('t_security_questions')
      .select('PRESET_QUESTION_ID, CUSTOM_QUESTION, ANSWER')
      .eq('USER_ID', user.USER_ID);

    if (qError || !storedQuestions || storedQuestions.length === 0) {
      return { success: false, status: 401, message: 'Las respuestas de seguridad no son correctas.' };
    }

    let correctCount = 0;
    
    for (const ans of answers) {
      let isValid = false;

      if (ans.isCustom) {
        const customStored = storedQuestions.find(q => !q.PRESET_QUESTION_ID && q.CUSTOM_QUESTION);
        if (customStored && customStored.ANSWER.toLowerCase().trim() === ans.answer.toLowerCase().trim()) {
          isValid = true;
        }
      } else {
        const presetStored = storedQuestions.find(q => q.PRESET_QUESTION_ID === ans.questionId);
        if (presetStored && presetStored.ANSWER.toLowerCase().trim() === ans.answer.toLowerCase().trim()) {
          isValid = true;
        }
      }

      if (isValid) {
        correctCount++;
      }
    }

    if (correctCount < 3) {
      await logAuthAction(user.USER_ID, user.USER_CI, 'SECURITY_QUESTIONS_FAILED', ip, userAgent, 'Respuestas de seguridad incorrectas');
      return { 
        success: false, 
        status: 401, 
        message: 'Las respuestas de seguridad no son correctas.' 
      };
    }

    const changeResult = await changePassword(user.USER_ID, newPassword);
    
    if (!changeResult.success) return changeResult;

    await logAuthAction(user.USER_ID, user.USER_CI, 'PASSWORD_RESET_COMPLETED', ip, userAgent, 'Restablecimiento de contraseña exitoso mediante preguntas de seguridad');

    if (user.EMAIL) {
      await sendPasswordChangedNotification(user.EMAIL, user.NAME);
    }

    return { success: true, message: 'Tu contraseña ha sido restablecida exitosamente.' };
  });
};

// ─── Avatar Storage ───

export const uploadAvatar = async (userId: number, fileName: string, contentType: string) => {
  return await dbManager.withRetry(async (supabase) => {
    const uuid = crypto.randomUUID();
    const filePath = `avatars/${userId}/${uuid}`;

    const { data, error } = await supabase.storage
      .from('avatars')
      .createSignedUploadUrl(filePath);

    if (error) {
      console.error('[Auth] Error creating signed upload URL:', error);
      return { success: false, message: 'Error al generar URL de carga' };
    }

    const { data: publicUrlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    return { success: true, uploadUrl: data.signedUrl, publicUrl: publicUrlData.publicUrl };
  });
};

export const deleteAvatar = async (userId: number) => {
  return await dbManager.withRetry(async (supabase) => {
    const { data: files, error: listError } = await supabase.storage
      .from('avatars')
      .list(`avatars/${userId}`);

    if (listError) {
      console.error('[Auth] Error listing avatar files:', listError);
      return { success: false, message: 'Error al listar archivos de avatar' };
    }

    if (!files || files.length === 0) {
      return { success: true, message: 'No hay avatar para eliminar' };
    }

    const filePaths = files.map((f: any) => `avatars/${userId}/${f.name}`);

    const { error: removeError } = await supabase.storage
      .from('avatars')
      .remove(filePaths);

    if (removeError) {
      console.error('[Auth] Error deleting avatar files:', removeError);
      return { success: false, message: 'Error al eliminar avatar' };
    }

    return { success: true, message: 'Avatar eliminado correctamente' };
  });
};

// ─── Session Management ───

export const getActiveSessions = async (userId: number) => {
  return await dbManager.withRetry(async (supabase) => {
    const { data, error } = await supabase
      .from('t_user_sessions')
      .select('*')
      .eq('USER_ID', userId)
      .eq('STATUS', 1)
      .order('LAST_ACTIVITY', { ascending: false });

    if (error) throw error;

    const sessions = (data || []).map((s: any) => {
      const deviceInfo = s.DEVICE_INFO || '';
      let deviceName = 'Desconocido';
      if (deviceInfo) {
        const parts = deviceInfo.split('-');
        deviceName = parts.map((p: string) => p.charAt(0).toUpperCase() + p.slice(1)).join(' - ');
      }
      return {
        id: s.ID,
        deviceName,
        ipAddress: s.IP_ADDRESS || '',
        lastActivity: s.LAST_ACTIVITY,
        isCurrent: false,
        createdAt: s.CREATED_AT
      };
    });

    return { success: true, data: sessions };
  });
};

export const terminateSession = async (userId: number, sessionId: number) => {
  return await dbManager.withRetry(async (supabase) => {
    const { error } = await supabase
      .from('t_user_sessions')
      .update({ STATUS: 0 })
      .eq('ID', sessionId)
      .eq('USER_ID', userId);

    if (error) throw error;

    return { success: true, message: 'Sesión cerrada correctamente' };
  });
};

// ─── Notification Preferences ───

const DEFAULT_NOTIF_TYPES = ['LOGIN_ALERT', 'PASSWORD_CHANGE', 'NEW_DEVICE', 'ACCOUNT_UPDATE', 'GENERAL'];
const DEFAULT_NOTIF_CHANNELS = ['email', 'in_app'];

export const getNotificationPrefs = async (userId: number) => {
  return await dbManager.withRetry(async (supabase) => {
    const { data, error } = await supabase
      .from('t_user_notification_prefs')
      .select('TYPE, CHANNEL, ENABLED')
      .eq('USER_ID', userId);

    if (error) throw error;

    if (!data || data.length === 0) {
      const defaults: { type: string; channel: string; enabled: boolean }[] = [];
      for (const type of DEFAULT_NOTIF_TYPES) {
        for (const channel of DEFAULT_NOTIF_CHANNELS) {
          defaults.push({ type, channel, enabled: true });
        }
      }
      return { success: true, data: defaults };
    }

    const prefs = data.map((p: any) => ({
      type: p.TYPE,
      channel: p.CHANNEL,
      enabled: p.ENABLED
    }));

    return { success: true, data: prefs };
  });
};

export const saveNotificationPrefs = async (userId: number, preferences: Array<{ type: string; channel: string; enabled: boolean }>) => {
  return await dbManager.withRetry(async (supabase) => {
    const rows = preferences.map(p => ({
      USER_ID: userId,
      TYPE: p.type,
      CHANNEL: p.channel,
      ENABLED: p.enabled
    }));

    const { error } = await supabase
      .from('t_user_notification_prefs')
      .upsert(rows, { onConflict: 'USER_ID, TYPE, CHANNEL' });

    if (error) throw error;

    return { success: true, message: 'Preferencias guardadas correctamente' };
  });
};

// ─── Account Deactivation ───

export const deactivateAccount = async (userId: number, reason: string) => {
  return await dbManager.withRetry(async (supabase) => {
    const { error } = await supabase
      .from('t_user')
      .update({ STATUS: 0 })
      .eq('USER_ID', userId);

    if (error) throw error;

    await logAuthAction(userId, '', 'ACCOUNT_DEACTIVATED', '', '', reason || 'Desactivación voluntaria');

    return { success: true, message: 'Cuenta desactivada correctamente' };
  });
};

// ─── Locale ───

export const updateLocale = async (userId: number, locale: string) => {
  return await dbManager.withRetry(async (supabase) => {
    const { error } = await supabase
      .from('t_user')
      .update({ LOCALE: locale })
      .eq('USER_ID', userId);

    if (error) throw error;

    return { success: true, locale };
  });
};

