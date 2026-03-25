import { Request, Response } from 'express';
import { dbManager } from '../lib/db-manager.js';

const TABLE_NAME = 't_institution_manager';

interface AppError extends Error {
  code?: string;
  details?: string;
}

const handleDbError = (res: Response, error: unknown) => {
  console.error('[DB Error Controller]:', error);
  const dbError = error as { message?: string; details?: string; code?: string; status?: number };
  
  let userMessage = 'Error en la base de datos';
  let statusCode = dbError.status || 500;

  if (dbError.code === '23502') {
    userMessage = `Error: El campo ${dbError.details?.match(/"([^"]+)"/)?.[1] || 'requerido'} no puede estar vacío`;
    statusCode = 400;
  } else if (dbError.code === '23505') {
    userMessage = 'Error: Ya existe un responsable con esta cédula';
    statusCode = 400;
  } else if (dbError.code === '23503') {
    userMessage = 'Error: La institución seleccionada no es válida o no existe';
    statusCode = 400;
  } else if (dbError.code === '22001') {
    userMessage = 'Error: Los datos ingresados exceden el límite permitido. Verifique la longitud de los campos.';
    statusCode = 400;
  } else if (dbError.code === 'PGRST205') {
    userMessage = 'Error: La tabla no existe en la base de datos';
  } else if (dbError.code === '42703' || (dbError.message && dbError.message.includes('column') && dbError.message.includes('not exist'))) {
    userMessage = 'Error estructural: Un campo requerido no existe en su base de datos. Por favor, contacte al administrador.';
  } else if (dbError.code === 'PGRST116' || dbError.code === '404' || dbError.status === 404) {
    userMessage = dbError.message || 'Registro no encontrado';
    return res.status(404).json({ message: userMessage });
  }

  res.status(statusCode).json({ 
    message: userMessage, 
    error: dbError.message || 'Unknown database error',
    details: dbError.details,
    code: dbError.code,
    raw: dbError // Enviar error completo para depuración profunda
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
  cargo: string | null; // Corregido a minúsculas según esquema visual
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
  cargo: r.cargo || undefined, // Mapeado desde 'cargo' minúscula
  institutionId: String(r.INSTITUTION_ID),
  institutionName: r.t_institution?.INSTITUTION_NAME,
  status: r.STATUS === 1,
  registrationDate: r.CREATION_DATE
});

export const getInstitutionalResponsibles = async (_req: Request, res: Response) => {
  try {
    const data = await dbManager.withRetry(async (supabase) => {
      // 1. Consulta simple
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .order('NAME', { ascending: true });

      if (error) throw error;

      // 2. Obtener nombres de instituciones para el mapeo (opcional pero recomendado)
      const { data: instData } = await supabase.from('t_institution').select('INSTITUTION_ID, INSTITUTION_NAME');
      const instMap = new Map((instData || []).map(i => [i.INSTITUTION_ID, i.INSTITUTION_NAME]));

      return (data || []).map((r: any) => ({
        ...r,
        t_institution: { INSTITUTION_NAME: instMap.get(r.INSTITUTION_ID) || 'N/A' }
      })) as unknown as DBInstitutionalResponsible[];
    }, 'getInstitutionalResponsibles');

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
        .select('*')
        .eq('MANAGER_CI', ci)
        .maybeSingle();

      if (error) throw error;
      if (!responsible) return null;

      // Obtener nombre de la institución
      const { data: inst } = await supabase
        .from('t_institution')
        .select('INSTITUTION_NAME')
        .eq('INSTITUTION_ID', responsible.INSTITUTION_ID)
        .single();

      return {
        ...responsible,
        t_institution: inst || { INSTITUTION_NAME: 'N/A' }
      } as DBInstitutionalResponsible;
    }, 'getInstitutionalResponsibleByCi');

    if (!data) {
      return res.status(200).json({ message: 'Responsable no encontrado', data: null });
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
    
    if (!r.institutionId) {
      return res.status(400).json({ message: 'El ID de institución es requerido' });
    }
    
    const institutionIdNum = parseInt(r.institutionId);
    if (isNaN(institutionIdNum)) {
      return res.status(400).json({ message: 'El ID de institución debe ser un número válido' });
    }
    
    const creationDate = new Date().toISOString().slice(0, 19).replace('T', ' ');

    const buildDbData = () => {
      const data: any = {
        MANAGER_CI: `${r.identificationPrefix}-${r.identificationNumber}`,
        NAME: String(r.firstName).toUpperCase(),
        SECOND_NAME: r.middleName ? String(r.middleName).toUpperCase() : null,
        SURNAME: String(r.lastName).toUpperCase(),
        SECOND_SURNAME: r.secondLastName ? String(r.secondLastName).toUpperCase() : null,
        CONTACT_PHONE: r.phone,
        EMAIL: String(r.email).toUpperCase(),
        INSTITUTION_ID: institutionIdNum,
        STATUS: r.status === false ? 0 : 1,
        CREATION_DATE: creationDate,
        cargo: r.cargo ? String(r.cargo).toUpperCase() : null // Usando nombre exacto de la columna 'cargo'
      };
      
      return data;
    };

    const data = await dbManager.withRetry(async (supabase) => {
      // Verificar duplicado
      const managerCi = `${r.identificationPrefix}-${r.identificationNumber}`;
      const { data: existing } = await supabase
        .from(TABLE_NAME)
        .select('MANAGER_ID')
        .eq('MANAGER_CI', managerCi)
        .maybeSingle();

      if (existing) {
        const err = new Error('Ya existe un responsable con esa cédula');
        (err as any).status = 400;
        throw err;
      }

      let dbData = buildDbData();
      let { data, error } = await supabase
        .from(TABLE_NAME)
        .insert([dbData])
        .select('*')
        .single();

      if (error) {
        console.error('[createInstitutionalResponsible] DB Insert Error:', error);
        throw error;
      }

      // Obtener nombre de institución para el mapeo final
      const { data: inst } = await supabase
        .from('t_institution')
        .select('INSTITUTION_NAME')
        .eq('INSTITUTION_ID', (data as any).INSTITUTION_ID)
        .single();

      return {
        ...data,
        t_institution: inst || { INSTITUTION_NAME: 'N/A' }
      } as DBInstitutionalResponsible;
    }, 'createInstitutionalResponsible');

    res.status(201).json(mapDBToFrontend(data));
  } catch (error: unknown) {
    handleDbError(res, error);
  }
};

export const updateInstitutionalResponsible = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const r = req.body;
    console.log(`[updateInstitutionalResponsible] Updating ID: ${id}, Body:`, JSON.stringify(r));
    
    const dbData: any = {};
    
    if (r.identificationPrefix !== undefined && r.identificationNumber !== undefined) {
      dbData.MANAGER_CI = `${r.identificationPrefix}-${r.identificationNumber}`;
    }
    if (r.firstName !== undefined) dbData.NAME = String(r.firstName).toUpperCase();
    if (r.middleName !== undefined) dbData.SECOND_NAME = r.middleName ? String(r.middleName).toUpperCase() : null;
    if (r.lastName !== undefined) dbData.SURNAME = String(r.lastName).toUpperCase();
    if (r.secondLastName !== undefined) dbData.SECOND_SURNAME = r.secondLastName ? String(r.secondLastName).toUpperCase() : null;
    if (r.phone !== undefined) dbData.CONTACT_PHONE = r.phone;
    if (r.email !== undefined) dbData.EMAIL = String(r.email).toUpperCase();
    if (r.cargo !== undefined) dbData.cargo = r.cargo ? String(r.cargo).toUpperCase() : null; // Corregido a minúsculas
    if (r.institutionId !== undefined) {
      // Si llega vacío o "0", lo tratamos como null para desvincular
      dbData.INSTITUTION_ID = (r.institutionId === "" || r.institutionId === "0") ? null : parseInt(r.institutionId);
    }
    if (r.status !== undefined) dbData.STATUS = r.status ? 1 : 0;

    const data = await dbManager.withRetry(async (supabase) => {
      // 1. Actualizar el registro base
      const { error: updateError } = await supabase
        .from(TABLE_NAME)
        .update(dbData)
        .eq('MANAGER_ID', id);
      
      if (updateError) throw updateError;

      // 2. Recuperar el registro actualizado
      const { data: updatedData, error: selectError } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('MANAGER_ID', id)
        .single();

      if (selectError) throw selectError;

      // 3. Obtener el nombre de la institución si existe una vinculada
      let instName = 'N/A';
      if (updatedData.INSTITUTION_ID) {
        const { data: inst } = await supabase
          .from('t_institution')
          .select('INSTITUTION_NAME')
          .eq('INSTITUTION_ID', updatedData.INSTITUTION_ID)
          .single();
        if (inst) instName = inst.INSTITUTION_NAME;
      }

      return {
        ...updatedData,
        t_institution: { INSTITUTION_NAME: instName }
      } as DBInstitutionalResponsible;
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
