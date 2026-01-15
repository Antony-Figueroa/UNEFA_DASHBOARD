import { Request, Response } from 'express';
import * as usersService from '../services/users.service.js';
import { generateRandom4Digits, decrypt } from '../utils/security.utils.js';
import { sendUserCreationEmail } from '../utils/email.utils.js';
import { AuthRequest, ROLES } from '../middlewares/auth.middleware.js';
import { dbManager } from '../lib/db-manager.js';

export const getUsers = async (req: Request, res: Response) => {
  try {
    const { role, status, search, page, limit } = req.query;
    const result = await usersService.getUsers(
      { 
        role: role ? Number(role) : undefined, 
        status: status ? Number(status) : undefined, 
        search: search as string 
      },
      page ? Number(page) : 1,
      limit ? Number(limit) : 10
    );
    res.json(result);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    res.status(500).json({ message: 'Error obteniendo usuarios', error: errorMessage });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const userData = req.body;
    const tempPassSuffix = generateRandom4Digits();
    const tempPass = `TempPass${tempPassSuffix}`;
    
    const newUser = await usersService.createUser(userData, tempPass);
    
    // Enviar email con la clave temporal
    await sendUserCreationEmail(userData.email, userData.name, tempPass);

    res.status(201).json({ 
      message: 'Usuario creado exitosamente', 
      user: newUser,
      tempPass // Opcional: devolverlo también en la respuesta para el administrador
    });
  } catch (error: unknown) {
    console.error('[UserController] Error in createUser:', error);
    
    // Manejo de errores específicos
    if (error && typeof error === 'object' && 'code' in error) {
      const dbError = error as { code: string; message: string };
      
      if (dbError.code === 'USER_ALREADY_EXISTS') {
        return res.status(409).json({ 
          message: dbError.message,
          error: dbError.code 
        });
      }

      // Errores de Supabase/Base de datos
      if (dbError.code === '23505') { // Unique violation
        return res.status(409).json({ 
          message: 'El usuario o correo ya se encuentra registrado', 
          error: dbError.code 
        });
      }

      if (dbError.code === '23502') { // Not null violation
        return res.status(400).json({ 
          message: 'Faltan campos obligatorios en el registro', 
          error: dbError.code 
        });
      }
    }

    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    res.status(500).json({ 
      message: 'Error interno al crear el usuario. Por favor, intente de nuevo más tarde.', 
      error: errorMessage 
    });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userData = req.body;
    const updatedUser = await usersService.updateUser(Number(id), userData);
    res.json({ message: 'Usuario actualizado exitosamente', user: updatedUser });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    res.status(500).json({ message: 'Error actualizando usuario', error: errorMessage });
  }
};

export const saveSecurityQuestions = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }
    const { questions } = req.body;
    
    if (!questions || questions.length !== 3) {
      return res.status(400).json({ message: 'Se requieren 3 preguntas de seguridad' });
    }

    await usersService.saveSecurityQuestions(userId, questions);
    res.json({ message: 'Preguntas de seguridad guardadas exitosamente' });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    res.status(500).json({ message: 'Error guardando preguntas de seguridad', error: errorMessage });
  }
};

/**
 * Obtiene la contraseña desencriptada de un usuario.
 * SOLO accesible para MASTER_ADMIN con auditoría.
 */
export const getUserCredentials = async (req: AuthRequest, res: Response) => {
  try {
    const masterAdminId = req.user?.userId;
    const { userId } = req.params;
    const { reason } = req.body; // Motivo de la consulta para auditoría

    if (!reason) {
      return res.status(400).json({ message: 'Se requiere un motivo para acceder a esta información sensible.' });
    }

    // 1. Verificar rol (Middleware ya lo hace, pero re-verificamos por seguridad)
    if (req.user?.role !== ROLES.MASTER_ADMIN) {
      return res.status(403).json({ message: 'Acceso denegado: Se requieren permisos de Administrador Maestro.' });
    }

    await dbManager.withRetry(async (supabase) => {
      // 2. Obtener la clave encriptada
      const { data, error } = await supabase
        .from('t_user_key')
        .select('ENCRYPTED_KEY, t_user(NAME, SURNAME, USER_CI)')
        .eq('USER_ID', userId)
        .eq('STATUS', 1)
        .single();

      if (error || !data?.ENCRYPTED_KEY) {
        return res.status(404).json({ message: 'No se encontró una clave activa para este usuario.' });
      }

      // 3. Registrar auditoría
      const { error: auditError } = await supabase
        .from('t_auth_log')
        .insert({
          USER_ID: masterAdminId,
          ACTION: 'VIEW_USER_PASSWORD',
          IP_ADDRESS: req.ip,
          USER_AGENT: req.headers['user-agent'],
          DETAILS: `Visualización de clave para Usuario ID: ${userId}. Motivo: ${reason}`
        });

      if (auditError) console.error('[Audit] Error recording access:', auditError);

      // 4. Desencriptar y devolver
      const decryptedPassword = decrypt(data.ENCRYPTED_KEY);
      
      // Manejar t_user como objeto o array dependiendo de la inferencia de Supabase
      const userData = Array.isArray(data.t_user) ? data.t_user[0] : data.t_user;

      res.json({
        password: decryptedPassword,
        targetUser: userData ? `${userData.NAME} ${userData.SURNAME} (${userData.USER_CI})` : 'Usuario desconocido',
        timestamp: new Date().toISOString()
      });
    });
  } catch (error: unknown) {
    console.error('[UserController] Error in getUserCredentials:', error);
    res.status(500).json({ message: 'Error al recuperar las credenciales.' });
  }
};
