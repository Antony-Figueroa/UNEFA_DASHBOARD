import { Request, Response } from 'express';
import * as usersService from '../services/users.service.js';
import { generateSecurePassword } from '../utils/security.utils.js';
import { sendUserCreationEmail } from '../utils/email.utils.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { dbManager } from '../lib/db-manager.js';

export const getUsers = async (req: Request, res: Response) => {
  try {
    const { role, status, search, name, surname, userCi, page, limit } = req.query;
    const result = await usersService.getUsers(
      { 
        role: role ? Number(role) : undefined, 
        status: status ? Number(status) : undefined, 
        search: search as string,
        name: name as string,
        surname: surname as string,
        userCi: userCi as string
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

export const createUser = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.userId;
    const userData = req.body;
    const tempPass = await generateSecurePassword();
    
    const newUser = await usersService.createUser(userData, tempPass);
    
    // Registrar auditoría de creación
    await dbManager.withRetry(async (supabase) => {
      await supabase.from('t_auth_log').insert({
        USER_ID: adminId,
        ACTION: 'CREATE_USER',
        IP_ADDRESS: req.ip,
        USER_AGENT: req.headers['user-agent'],
        DETAILS: `Creación de nuevo usuario: ${userData.name} ${userData.surname} (CI: ${userData.userCi}, Rol: ${userData.role})`
      });
    });
    
    // Enviar email con la clave temporal
    await sendUserCreationEmail(userData.email, userData.name, userData.userCi, tempPass);

    res.status(201).json({ 
      message: 'Usuario creado exitosamente', 
      user: newUser
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

export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.userId;
    const { id } = req.params;
    const userData = req.body;
    const updatedUser = await usersService.updateUser(Number(id), userData);
    
    // Registrar auditoría de actualización
    await dbManager.withRetry(async (supabase) => {
      await supabase.from('t_auth_log').insert({
        USER_ID: adminId,
        ACTION: 'UPDATE_USER',
        IP_ADDRESS: req.ip,
        USER_AGENT: req.headers['user-agent'],
        DETAILS: `Actualización de usuario ID: ${id}. Cambios: ${JSON.stringify(userData)}`
      });
    });

    res.json({ message: 'Usuario actualizado exitosamente', user: updatedUser });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    res.status(500).json({ message: 'Error actualizando usuario', error: errorMessage });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.userId;
    const { id } = req.params;
    
    if (adminId === Number(id)) {
      return res.status(400).json({ message: 'No puedes eliminar tu propia cuenta' });
    }

    await usersService.deleteUser(Number(id));
    
    await dbManager.withRetry(async (supabase) => {
      await supabase.from('t_auth_log').insert({
        USER_ID: adminId,
        ACTION: 'DELETE_USER',
        IP_ADDRESS: req.ip,
        USER_AGENT: req.headers['user-agent'],
        DETAILS: `Eliminación (soft delete) de usuario ID: ${id}`
      });
    });

    res.json({ message: 'Usuario eliminado exitosamente' });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    res.status(500).json({ message: 'Error eliminando usuario', error: errorMessage });
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
