import { Request, Response } from 'express';
import * as careersService from '../services/careers.service.js';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { auditCreate, auditUpdate, auditDelete, auditStatusChange } from '../utils/audit-helpers.js';
import { sendNotificationByRole } from '../services/sse.service.js';

const handleDbError = (res: Response, error: unknown) => {
  console.error('Database Error:', error);
  const dbError = error as { message?: string; details?: string; code?: string };
  
  if (dbError.code === 'BUSINESS_RULE_VIOLATION') {
    return res.status(400).json({ message: dbError.message });
  }

  if (dbError.code === 'NOT_FOUND') {
    return res.status(404).json({ message: dbError.message });
  }

  // Mensaje amigable según el código de error de Postgres
  let userMessage = 'Error en la base de datos';
  if (dbError.code === '23502') {
    userMessage = `Error: El campo ${dbError.details?.match(/"([^"]+)"/)?.[1] || 'requerido'} no puede estar vacío`;
  } else if (dbError.code === '23505') {
    userMessage = 'Error: Ya existe un registro con estos datos (duplicado)';
  } else if (dbError.code === '22P02') {
    userMessage = 'Error: Formato de datos inválido (ej: número esperado en lugar de texto)';
  }

  res.status(500).json({ 
    message: userMessage, 
    error: dbError.message || 'Unknown database error',
    details: dbError.details,
    code: dbError.code
  });
};

export const getCareers = async (_req: Request, res: Response) => {
  try {
    const result = await careersService.getCareers();
    res.json(result);
  } catch (error) {
    handleDbError(res, error);
  }
};

export const getCareersByInternshipType = async (req: Request, res: Response) => {
  try {
    const { typeId } = req.params;
    if (!typeId) {
      return res.status(400).json({ message: 'Se requiere el ID del tipo de práctica' });
    }
    const result = await careersService.getCareersByInternshipType(typeId);
    res.json(result);
  } catch (error) {
    handleDbError(res, error);
  }
};

export const getCareerById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const result = await careersService.getCareerById(id);
    res.json(result);
  } catch (error) {
    handleDbError(res, error);
  }
};

export const getCareerByCode = async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    const result = await careersService.getCareerByCode(code);
    if (!result) {
      return res.status(404).json({ message: 'Carrera no encontrada', data: null });
    }
    res.json({ data: result });
  } catch (error) {
    handleDbError(res, error);
  }
};

export const createCareer = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId || 1;
    const careerName = req.body.CAREER_NAME || req.body.name || '';
    const result = await careersService.createCareer(req.body, userId);
    
    // Auditoría de creación de carrera
    if (result.success) {
      try {
        await auditCreate(req, 't_career', {
          ...req.body,
          CAREER_NAME: String(careerName).toUpperCase()
        }, ['CAREER_NAME', 'CAREER_CODE', 'CAREER_ABBREVIATION', 'MINIMUM_GRADE', 'CAREER_TYPE']);
      } catch (auditError) {
        console.error('[Audit] Error auditing career creation:', auditError);
      }
      
      // Notificar a todos los usuarios sobre la nueva carrera
      try {
        await sendNotificationByRole(
          'all',
          'system',
          '🎓 Nueva Carrera Creada',
          `Se ha creado la carrera "${careerName}".`
        );
      } catch (notifError) {
        console.error('[CareersController] Error en notificación:', notifError);
      }
    }
    
    res.status(201).json(result);
  } catch (error) {
    handleDbError(res, error);
  }
};

export const updateCareer = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId || 1;
    
    // Obtener datos actuales antes de actualizar
    const currentCareer = await careersService.getCareerById(id);
    const newCareerName = req.body.CAREER_NAME || req.body.name || '';
    const result = await careersService.updateCareer(id, req.body, userId);
    
    // Auditoría de actualización de carrera
    if (result.success && currentCareer.success && currentCareer.data) {
      try {
        await auditUpdate(req, 't_career', 
          currentCareer.data as Record<string, any>, 
          req.body as Record<string, any>,
          ['CAREER_NAME', 'CAREER_CODE', 'CAREER_ABBREVIATION', 'MINIMUM_GRADE', 'CAREER_TYPE']
        );
      } catch (auditError) {
        console.error('[Audit] Error auditing career update:', auditError);
      }
      
      // Notificar a todos los usuarios sobre la actualización
      const oldName = (currentCareer.data as any)?.CAREER_NAME || 'la carrera';
      try {
        await sendNotificationByRole(
          'all',
          'system',
          '✏️ Carrera Modificada',
          `La carrera "${oldName}" ha sido actualizada.`
        );
      } catch (notifError) {
        console.error('[CareersController] Error en notificación:', notifError);
      }
    }
    
    res.json(result);
  } catch (error) {
    handleDbError(res, error);
  }
};

export const deleteCareer = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId || 1;
    
    // Obtener datos actuales antes de eliminar
    const currentCareer = await careersService.getCareerById(id);
    const deletedName = currentCareer.success ? (currentCareer.data as any)?.CAREER_NAME : '';
    
    await careersService.deleteCareer(id, userId);
    
    // Auditoría de eliminación de carrera
    if (currentCareer.success && currentCareer.data) {
      try {
        await auditDelete(req, 't_career', 
          currentCareer.data as Record<string, any>,
          ['CAREER_NAME', 'CAREER_CODE', 'CAREER_ABBREVIATION']
        );
      } catch (auditError) {
        console.error('[Audit] Error auditing career deletion:', auditError);
      }
      
      // Notificar a todos los usuarios sobre la eliminación
      if (deletedName) {
        try {
          await sendNotificationByRole(
            'all',
            'system',
            '🗑️ Carrera Eliminada',
            `La carrera "${deletedName}" ha sido eliminada.`
          );
        } catch (notifError) {
          console.error('[CareersController] Error en notificación:', notifError);
        }
      }
    }
    
    res.status(204).send();
  } catch (error) {
    handleDbError(res, error);
  }
};

export const bulkDeleteCareers = async (req: AuthRequest, res: Response) => {
  try {
    const { ids } = req.body;
    const userId = req.user?.userId || 1;
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ message: 'Se requiere un array de IDs' });
    }

    await careersService.bulkDeleteCareers(ids, userId);
    res.status(204).send();
  } catch (error) {
    handleDbError(res, error);
  }
};

export const bulkRestoreCareers = async (req: AuthRequest, res: Response) => {
  try {
    const { ids } = req.body;
    const userId = req.user?.userId || 1;
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ message: 'Se requiere un array de IDs' });
    }

    await careersService.bulkRestoreCareers(ids, userId);
    res.status(204).send();
  } catch (error) {
    handleDbError(res, error);
  }
};

export const toggleCareerStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user?.userId || 1;
    
    if (status === false || status === 0) {
      await careersService.deleteCareer(id, userId);
    } else {
      await careersService.bulkRestoreCareers([id], userId);
    }
    
    res.status(204).send();
  } catch (error) {
    handleDbError(res, error);
  }
};
