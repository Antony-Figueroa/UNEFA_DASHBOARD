import { Request, Response } from 'express';
import { dbManager } from '../lib/db-manager.js';

const TABLE_NAME = 't_institution_manager';

interface AppError extends Error {
  code?: string;
  details?: string;
}

const handleDbError = (res: Response, error: unknown) => {
  console.error('Database Error:', error);
  const dbError = error as AppError;
  
  let userMessage = 'Error en la base de datos';
  if (dbError.code === '23502') {
    userMessage = `Error: El campo ${dbError.details?.match(/"([^"]+)"/)?.[1] || 'requerido'} no puede estar vacío`;
  } else if (dbError.code === '23505') {
    userMessage = 'Error: Ya existe un registro con estos datos (duplicado)';
  } else if (dbError.code === 'PGRST205') {
    userMessage = 'Error: La tabla no existe en la base de datos';
  } else if (dbError.code === '404') {
    userMessage = dbError.message || 'Registro no encontrado';
    return res.status(404).json({ message: userMessage });
  }

  res.status(500).json({ 
    message: userMessage, 
    error: dbError.message || 'Unknown database error',
    details: dbError.details,
    code: dbError.code
  });
};

interface DBInstitutionalResponsible {
  MANAGER_ID: number;
  MANAGER_CI: string;
  NAME: string;
  SECOND_NAME: string | null;
  SURNAME: string;
  SECOND_SURNAME: string | null;
  CONTACT_PHONE: string;
  EMAIL: string;
  CARGO: string | null;
  CREATION_DATE: string;
  STATUS: number;
  INSTITUTION_ID: number;
  t_institution?: {
    INSTITUTION_NAME: string;
  };
}

const mapDBToFrontend = (r: DBInstitutionalResponsible) => ({
  responsibleId: String(r.MANAGER_ID),
  identificationPrefix: r.MANAGER_CI.includes('-') ? r.MANAGER_CI.split('-')[0] : 'V',
  identificationNumber: r.MANAGER_CI.includes('-') ? r.MANAGER_CI.split('-')[1] : r.MANAGER_CI,
  firstName: r.NAME,
  middleName: r.SECOND_NAME || undefined,
  lastName: r.SURNAME,
  secondLastName: r.SECOND_SURNAME || undefined,
  phone: r.CONTACT_PHONE,
  email: r.EMAIL,
  cargo: r.CARGO || undefined,
  institutionId: String(r.INSTITUTION_ID),
  institutionName: r.t_institution?.INSTITUTION_NAME,
  status: r.STATUS === 1,
  registrationDate: r.CREATION_DATE
});

export const getInstitutionalResponsibles = async (_req: Request, res: Response) => {
  try {
    const data = await dbManager.withRetry(async (supabase) => {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select(`
          *,
          t_institution:INSTITUTION_ID (
            INSTITUTION_NAME
          )
        `)
        .order('NAME', { ascending: true });

      if (error) throw error;
      return data as unknown as DBInstitutionalResponsible[];
    });

    res.json(data.map(mapDBToFrontend));
  } catch (error: unknown) {
    handleDbError(res, error);
  }
};

export const getInstitutionalResponsibleByCi = async (req: Request, res: Response) => {
  try {
    const { ci } = req.params;
    
    const data = await dbManager.withRetry(async (supabase) => {
      const { data: responsible, error } = await supabase
        .from(TABLE_NAME)
        .select(`
          *,
          t_institution:INSTITUTION_ID (
            INSTITUTION_NAME
          )
        `)
        .eq('MANAGER_CI', ci)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return responsible as DBInstitutionalResponsible;
    });

    if (!data) {
      return res.status(404).json({ message: 'Responsable no encontrado', data: null });
    }

    res.json({ data: mapDBToFrontend(data) });
  } catch (error: unknown) {
    handleDbError(res, error);
  }
};

export const createInstitutionalResponsible = async (req: Request, res: Response) => {
  try {
    const r = req.body;
    
    console.log('[createInstitutionalResponsible] Request body:', JSON.stringify(r));
    console.log('[createInstitutionalResponsible] institutionId:', r.institutionId, 'type:', typeof r.institutionId);
    
    if (!r.institutionId) {
      return res.status(400).json({ message: 'El ID de institución es requerido' });
    }
    
    const institutionIdNum = parseInt(r.institutionId);
    if (isNaN(institutionIdNum)) {
      return res.status(400).json({ message: 'El ID de institución debe ser un número válido' });
    }
    
    const dbData = {
      MANAGER_CI: `${r.identificationPrefix}-${r.identificationNumber}`,
      NAME: r.firstName,
      SECOND_NAME: r.middleName || null,
      SURNAME: r.lastName,
      SECOND_SURNAME: r.secondLastName || null,
      CONTACT_PHONE: r.phone,
      EMAIL: r.email,
      CARGO: r.cargo || null,
      INSTITUTION_ID: institutionIdNum,
      STATUS: r.status ? 1 : 0,
      CREATION_DATE: new Date().toISOString()
    };

    const data = await dbManager.withRetry(async (supabase) => {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .insert([dbData])
        .select(`
          *,
          t_institution:INSTITUTION_ID (
            INSTITUTION_NAME
          )
        `)
        .single();

      if (error) throw error;
      return data as DBInstitutionalResponsible;
    });

    res.status(201).json(mapDBToFrontend(data));
  } catch (error: unknown) {
    handleDbError(res, error);
  }
};

export const updateInstitutionalResponsible = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const r = req.body;
    const dbData: Partial<DBInstitutionalResponsible> = {};
    
    if (r.identificationPrefix !== undefined && r.identificationNumber !== undefined) {
      dbData.MANAGER_CI = `${r.identificationPrefix}-${r.identificationNumber}`;
    }
    if (r.firstName !== undefined) dbData.NAME = r.firstName;
    if (r.middleName !== undefined) dbData.SECOND_NAME = r.middleName || null;
    if (r.lastName !== undefined) dbData.SURNAME = r.lastName;
    if (r.secondLastName !== undefined) dbData.SECOND_SURNAME = r.secondLastName || null;
    if (r.phone !== undefined) dbData.CONTACT_PHONE = r.phone;
    if (r.email !== undefined) dbData.EMAIL = r.email;
    if (r.cargo !== undefined) dbData.CARGO = r.cargo || null;
    if (r.institutionId !== undefined) dbData.INSTITUTION_ID = parseInt(r.institutionId);
    if (r.status !== undefined) dbData.STATUS = r.status ? 1 : 0;

    const data = await dbManager.withRetry(async (supabase) => {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .update(dbData)
        .eq('MANAGER_ID', id)
        .select(`
          *,
          t_institution:INSTITUTION_ID (
            INSTITUTION_NAME
          )
        `)
        .single();

      if (error) throw error;
      return data as DBInstitutionalResponsible;
    });

    res.json(mapDBToFrontend(data));
  } catch (error: unknown) {
    handleDbError(res, error);
  }
};

export const deleteInstitutionalResponsible = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await dbManager.withRetry(async (supabase) => {
      const { error } = await supabase
        .from(TABLE_NAME)
        .update({ STATUS: 0 })
        .eq('MANAGER_ID', id);

      if (error) throw error;
    });
    res.status(204).send();
  } catch (error: unknown) {
    handleDbError(res, error);
  }
};

export const toggleInstitutionalResponsibleStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const data = await dbManager.withRetry(async (supabase) => {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .update({ STATUS: status ? 1 : 0 })
        .eq('MANAGER_ID', id)
        .select(`
          *,
          t_institution:INSTITUTION_ID (
            INSTITUTION_NAME
          )
        `)
        .single();

      if (error) throw error;
      return data as DBInstitutionalResponsible;
    });

    res.json(mapDBToFrontend(data));
  } catch (error: unknown) {
    handleDbError(res, error);
  }
};
