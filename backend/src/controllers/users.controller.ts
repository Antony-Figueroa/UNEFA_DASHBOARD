import { Request, Response } from 'express';
import * as usersService from '../services/users.service.js';
import * as personService from '../services/person.service.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { dbManager } from '../lib/db-manager.js';
import * as authService from '../services/auth.service.js';
import { sendUserCreationEmail, sendPasswordResetEmail } from '../utils/email.utils.js';

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

export const checkUserCi = async (req: Request, res: Response) => {
  try {
    const { ci } = req.params;
    if (!ci || ci.length < 6) {
      return res.status(400).json({ message: 'Cédula inválida' });
    }

    // Construir CI completo (V/E + guión + número)
    const ciClean = ci.replace(/^[VE]/i, '').replace(/\D/g, '');
    const ciMatch = ci.match(/^([VE])?/i);
    const ciPrefix = ciMatch?.[1]?.toUpperCase() || 'V';
    const fullCi = `${ciPrefix}-${ciClean}`;

    // 1. Verificar si la CI ya está registrada como usuario en t_user
    const { data: existingUser } = await (dbManager.withRetry(
      async (supabase) => await supabase
        .from('t_user')
        .select('USER_ID')
        .eq('USER_CI', ciClean)
        .maybeSingle(),
      'checkUserCi_t_user'
    ) as any);

    if (existingUser) {
      return res.json({ exists: true, asUser: true });
    }

    // 2. Verificar si la CI ya existe como persona en t_persons
    const existingPerson = await personService.getPersonByCi(fullCi);
    if (existingPerson) {
      return res.json({
        exists: true,
        asUser: false,
        person: {
          personId: existingPerson.personId,
          ci: existingPerson.ci,
          prefixCi: existingPerson.prefixCi,
          identificationNumber: existingPerson.identificationNumber,
          firstName: existingPerson.firstName,
          middleName: existingPerson.middleName,
          lastName: existingPerson.lastName,
          secondLastName: existingPerson.secondLastName,
          email: existingPerson.email,
          phone: existingPerson.phone,
          gender: existingPerson.gender,
          birthDate: existingPerson.birthDate,
          address: existingPerson.address,
          maritalStatus: existingPerson.maritalStatus,
        },
      });
    }

    // 3. No existe en ninguna tabla
    return res.json({ exists: false });
  } catch (error) {
    console.error('[UserController] Error in checkCi:', error);
    res.status(500).json({ message: 'Error verificando cédula' });
  }
};

export const createUser = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.userId;
    const userData = req.body;
    
    // La contraseña inicial será la cédula del usuario
    const tempPass = String(userData.userCi);
    
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
    
    // Enviar email con credenciales (no bloqueante)
    sendUserCreationEmail(userData.email, userData.name, userData.userCi, tempPass)
      .catch(err => console.error('[UserController] Error sending welcome email:', err));

    res.status(201).json(newUser);
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

    res.json(updatedUser);
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

export const resetUserPassword = async (req: AuthRequest, res: Response) => {
  try {
    const adminId = req.user?.userId;
    const { id } = req.params;

    const result = await usersService.resetUserPassword(Number(id));

    // Enviar email con la nueva clave temporal (no bloqueante)
    if (result.isFirstLogin) {
      // Primera vez → email de bienvenida con setup completo
      sendUserCreationEmail(result.email, result.name, result.userCi, result.tempPassword)
        .catch(err => console.error('[UserController] Error sending welcome email:', err));
    } else {
      // Usuario existente → email de notificación de reseteo
      sendPasswordResetEmail(result.email, result.name, result.userCi, result.tempPassword)
        .catch(err => console.error('[UserController] Error sending reset email:', err));
    }

    // Registrar auditoría
    await dbManager.withRetry(async (supabase) => {
      await supabase.from('t_auth_log').insert({
        USER_ID: adminId,
        ACTION: 'RESET_PASSWORD',
        IP_ADDRESS: req.ip,
        USER_AGENT: req.headers['user-agent'],
        DETAILS: `Reset de clave para usuario ID: ${id} (${result.name})`
      });
    });

    res.json({ success: true, message: 'Clave reseteada exitosamente. El usuario recibirá un correo con la nueva clave temporal.' });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    
    if (error && typeof error === 'object' && 'code' in error) {
      const svcError = error as { code: string; status?: number; message: string };
      if (svcError.code === 'USER_NOT_FOUND') {
        return res.status(404).json({ message: svcError.message });
      }
      if (svcError.code === 'USER_NO_EMAIL') {
        return res.status(400).json({ message: svcError.message });
      }
    }
    
    res.status(500).json({ message: 'Error al resetear clave', error: errorMessage });
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

export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await usersService.getUserDetail(Number(id));
    res.json(result);
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'code' in error) {
      const svcError = error as { code: string; status?: number; message: string };
      if (svcError.code === 'USER_NOT_FOUND') {
        return res.status(404).json({ message: svcError.message });
      }
    }
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    res.status(500).json({ message: 'Error obteniendo usuario', error: errorMessage });
  }
};

export const getUserLoginHistory = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const limit = req.query.limit ? Number(req.query.limit) : 20;
    const offset = req.query.offset ? Number(req.query.offset) : 0;
    
    const result = await authService.getAllAuthLogs(limit, offset, Number(id));
    res.json({ success: true, logs: result.data, totalCount: result.total });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    res.status(500).json({ message: 'Error obteniendo historial de login', error: errorMessage });
  }
};
