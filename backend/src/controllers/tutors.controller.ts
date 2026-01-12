import { Request, Response } from 'express';
import { dbManager } from '../lib/db-manager';

const TABLE_NAME = 't_tutors';

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

interface DBTutor {
  TUTOR_ID: number;
  TUTOR_CI: string;
  NAME: string;
  SECOND_NAME: string;
  SURNAME: string;
  SECOND_SURNAME: string;
  CONTACT_PHONE: string;
  GENDER: string;
  EMAIL: string;
  PROFESSION: string;
  CONDITION: string;
  DEDICATION: string;
  CATEGORY: string;
  CREATION_DATE: string;
  STATUS: number;
}

export const getTutors = async (_req: Request, res: Response) => {
  try {
    const data = await dbManager.withRetry(async (supabase) => {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .order('NAME', { ascending: true });

      if (error) throw error;
      return data as DBTutor[];
    });

    // Mapear de DB a Frontend
    const mappedData = data.map((t) => {
      const ciParts = (t.TUTOR_CI || '').split('-');
      const prefix = ciParts.length > 1 ? ciParts[0] : 'V';
      const number = ciParts.length > 1 ? ciParts[1] : ciParts[0];

      return {
        tutorId: String(t.TUTOR_ID),
        identificationPrefix: prefix,
        identificationNumber: number,
        firstName: t.NAME,
        middleName: t.SECOND_NAME || undefined,
        lastName: t.SURNAME,
        secondLastName: t.SECOND_SURNAME || undefined,
        sex: t.GENDER,
        phone: t.CONTACT_PHONE,
        email: t.EMAIL,
        profession: t.PROFESSION,
        condition: t.CONDITION,
        dedication: t.DEDICATION,
        category: t.CATEGORY,
        registrationDate: t.CREATION_DATE,
        status: t.STATUS === 1,
        carreras: []
      };
    });

    res.json(mappedData);
  } catch (error: unknown) {
    handleDbError(res, error);
  }
};

const mapDBToFrontend = (t: DBTutor) => {
  const ciParts = (t.TUTOR_CI || '').split('-');
  const prefix = ciParts.length > 1 ? ciParts[0] : 'V';
  const number = ciParts.length > 1 ? ciParts[1] : ciParts[0];

  return {
    tutorId: String(t.TUTOR_ID),
    identificationPrefix: prefix,
    identificationNumber: number,
    firstName: t.NAME,
    middleName: t.SECOND_NAME || undefined,
    lastName: t.SURNAME,
    secondLastName: t.SECOND_SURNAME || undefined,
    sex: t.GENDER,
    phone: t.CONTACT_PHONE,
    email: t.EMAIL,
    profession: t.PROFESSION,
    condition: t.CONDITION,
    dedication: t.DEDICATION,
    category: t.CATEGORY,
    registrationDate: t.CREATION_DATE,
    status: t.STATUS === 1,
    carreras: []
  };
};

export const createTutor = async (req: Request, res: Response) => {
  try {
    const t = req.body;
    const dbData = {
      TUTOR_CI: `${t.identificationPrefix}-${t.identificationNumber}`,
      NAME: t.firstName,
      SECOND_NAME: t.middleName || null,
      SURNAME: t.lastName,
      SECOND_SURNAME: t.secondLastName || null,
      GENDER: t.sex,
      CONTACT_PHONE: t.phone,
      EMAIL: t.email,
      PROFESSION: t.profession,
      CONDITION: t.condition,
      DEDICATION: t.dedication,
      CATEGORY: t.category,
      STATUS: t.status ? 1 : 0,
      CREATION_DATE: new Date().toISOString()
    };

    const data = await dbManager.withRetry(async (supabase) => {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .insert([dbData])
        .select()
        .single();

      if (error) throw error;
      return data as DBTutor;
    });

    res.status(201).json(mapDBToFrontend(data));
  } catch (error: unknown) {
    handleDbError(res, error);
  }
};

export const updateTutor = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const t = req.body;
    const dbData = {
      TUTOR_CI: `${t.identificationPrefix}-${t.identificationNumber}`,
      NAME: t.firstName,
      SECOND_NAME: t.middleName || null,
      SURNAME: t.lastName,
      SECOND_SURNAME: t.secondLastName || null,
      GENDER: t.sex,
      CONTACT_PHONE: t.phone,
      EMAIL: t.email,
      PROFESSION: t.profession,
      CONDITION: t.condition,
      DEDICATION: t.dedication,
      CATEGORY: t.category,
      STATUS: t.status ? 1 : 0
    };

    const data = await dbManager.withRetry(async (supabase) => {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .update(dbData)
        .eq('TUTOR_ID', id)
        .select()
        .single();

      if (error) throw error;
      return data as DBTutor;
    });

    res.json(mapDBToFrontend(data));
  } catch (error: unknown) {
    handleDbError(res, error);
  }
};

export const deleteTutor = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await dbManager.withRetry(async (supabase) => {
      const { error } = await supabase
        .from(TABLE_NAME)
        .delete()
        .eq('TUTOR_ID', id);

      if (error) throw error;
    });
    res.status(204).send();
  } catch (error: unknown) {
    handleDbError(res, error);
  }
};

export const toggleTutorStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const data = await dbManager.withRetry(async (supabase) => {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .update({ STATUS: status ? 1 : 0 })
        .eq('TUTOR_ID', id)
        .select()
        .single();

      if (error) throw error;
      return data as DBTutor;
    });

    res.json(mapDBToFrontend(data));
  } catch (error: unknown) {
    handleDbError(res, error);
  }
};
