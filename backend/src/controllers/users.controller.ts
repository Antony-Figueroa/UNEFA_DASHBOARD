import { Request, Response } from 'express';
import * as usersService from '../services/users.service.js';
import { generateRandom4Digits } from '../utils/security.utils.js';
import { sendUserCreationEmail } from '../utils/email.utils.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';

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
  } catch (error: any) {
    console.error('[UserController] Error in createUser:', error);
    
    // Manejo de errores específicos
    if (error.code === 'USER_ALREADY_EXISTS') {
      return res.status(409).json({ 
        message: error.message,
        error: error.code 
      });
    }

    // Errores de Supabase/Base de datos
    if (error.code === '23505') { // Unique violation
      return res.status(409).json({ 
        message: 'El usuario o correo ya se encuentra registrado', 
        error: error.code 
      });
    }

    if (error.code === '23502') { // Not null violation
      return res.status(400).json({ 
        message: 'Faltan campos obligatorios en el registro', 
        error: error.code 
      });
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
