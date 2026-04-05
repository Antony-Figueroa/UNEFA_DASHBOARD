import { Request, Response } from 'express';
import { dbManager } from '../lib/db-manager.js';

const TABLE_NAME = 't_institution_manager';
const PIVOT_TABLE = 't_institution_manager_institution';

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
    raw: dbError
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
  cargo: string | null;
  CREATION_DATE: string;
  STATUS: number;
  institutions?: Array<{
    institutionId: string;
    institutionName: string;
    cargo: string;
  }>;
}

/**
 * Obtiene las instituciones asociadas a un responsable desde la tabla pivote
 * Devuelve array de objetos con id, nombre y cargo por cada relación
 */
const getInstitutionsForManager = async (supabase: any, managerId: number) => {
  const { data: pivotData, error: pivotError } = await supabase
    .from(PIVOT_TABLE)
    .select('"INSTITUTION_ID", cargo')
    .eq('"MANAGER_ID"', managerId);

  if (pivotError || !pivotData || pivotData.length === 0) {
    return [];
  }

  const institutionIds = pivotData.map((d: any) => d.INSTITUTION_ID);

  const { data: instData } = await supabase
    .from('t_institution')
    .select('INSTITUTION_ID, INSTITUTION_NAME')
    .in('INSTITUTION_ID', institutionIds);

  const instMap = new Map((instData || []).map((i: any) => [i.INSTITUTION_ID, i.INSTITUTION_NAME]));

  // Devolver array de objetos - cada relación es independiente
  return pivotData.map((p: any) => ({
    institutionId: String(p.INSTITUTION_ID),
    institutionName: instMap.get(p.INSTITUTION_ID) || 'N/A',
    cargo: p.cargo || ''
  }));
};

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
  // El cargo ahora viene por cada institución, no global
  cargo: r.institutions?.[0]?.cargo || r.cargo || undefined,
  institutions: r.institutions || [],
  status: r.STATUS === 1,
  registrationDate: r.CREATION_DATE
});

export const getInstitutionalResponsibles = async (_req: Request, res: Response) => {
  try {
    const data = await dbManager.withRetry(async (supabase) => {
      const { data: responsibles, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .order('NAME', { ascending: true });

      if (error) throw error;

      // Obtener mapa de instituciones
      const { data: instData } = await supabase.from('t_institution').select('INSTITUTION_ID, INSTITUTION_NAME');
      const instMap = new Map((instData || []).map((i: any) => [i.INSTITUTION_ID, i.INSTITUTION_NAME]));

      // Obtener relaciones de la tabla pivote CON cargo
      const { data: pivotData } = await supabase
        .from(PIVOT_TABLE)
        .select('"MANAGER_ID", "INSTITUTION_ID", cargo');

      // Agrupar instituciones por manager CON su cargo
      const managerInstitutions = new Map<number, Array<{ institutionId: string; institutionName: string; cargo: string }>>();
      (pivotData || []).forEach((p: any) => {
        const existing = managerInstitutions.get(p.MANAGER_ID) || [];
        existing.push({
          institutionId: String(p.INSTITUTION_ID),
          institutionName: instMap.get(p.INSTITUTION_ID) || 'N/A',
          cargo: p.cargo || ''
        });
        managerInstitutions.set(p.MANAGER_ID, existing);
      });

      return (responsibles || []).map((r: any) => {
        const institutions = managerInstitutions.get(r.MANAGER_ID) || [];
        return {
          ...r,
          institutions
        };
      }) as unknown as DBInstitutionalResponsible[];
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

      // Obtener instituciones desde la tabla pivote (ahora devuelve array de objetos)
      const institutions = await getInstitutionsForManager(supabase, responsible.MANAGER_ID);

      return {
        ...responsible,
        institutions
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
    
    // Nueva estructura: institutions array con objetos { institutionId, cargo }
    // También acepta backward compatibility con institutionIds array simple
    let institutions: Array<{ institutionId: string; cargo: string }> = [];
    
    if (r.institutions && Array.isArray(r.institutions)) {
      // Nueva estructura: [{ institutionId: "1", cargo: "Gerente" }, ...]
      institutions = r.institutions.map((inst: any) => ({
        institutionId: String(inst.institutionId),
        cargo: inst.cargo || ''
      }));
    } else if (r.institutionIds && Array.isArray(r.institutionIds)) {
      // Backward: [1, 2, 3] - usar cargo global si existe
      institutions = r.institutionIds.map((id: string) => ({
        institutionId: String(id),
        cargo: r.cargo || ''
      }));
    } else if (r.institutionId) {
      // Backward: single institutionId
      institutions = [{
        institutionId: String(r.institutionId),
        cargo: r.cargo || ''
      }];
    }
    
    // La institución ya no es obligatoria - se puede agregar después desde la institución
    // if (institutions.length === 0) {
    //   return res.status(400).json({ message: 'Debe seleccionar al menos una institución' });
    // }
    
    // Validar que todos los IDs sean válidos (solo si hay instituciones)
    const validInstitutions = institutions.filter(inst => {
      const num = parseInt(inst.institutionId);
      return !isNaN(num) && num > 0;
    });
    
    // Solo validar si hay instituciones - si está vacío, permitirlo
    if (institutions.length > 0 && validInstitutions.length === 0) {
      return res.status(400).json({ message: 'Los IDs de institución deben ser números válidos' });
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
        // Mantener el campo antiguo por compatibilidad, pero será null
        INSTITUTION_ID: null,
        STATUS: r.status === false ? 0 : 1,
        CREATION_DATE: creationDate,
        // El cargo global se mantiene por compatibilidad pero no se usa
        cargo: null
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
      let { data: newManager, error } = await supabase
        .from(TABLE_NAME)
        .insert([dbData])
        .select('*')
        .single();

      if (error) {
        console.error('[createInstitutionalResponsible] DB Insert Error:', error);
        throw error;
      }

      // Insertar relaciones en la tabla pivote CON cargo
      const pivotInserts = validInstitutions.map((inst: any) => ({
        "MANAGER_ID": newManager.MANAGER_ID,
        "INSTITUTION_ID": parseInt(inst.institutionId),
        cargo: inst.cargo ? String(inst.cargo).toUpperCase() : null
      }));

      const { error: pivotError } = await supabase
        .from(PIVOT_TABLE)
        .insert(pivotInserts);

      if (pivotError) {
        console.error('[createInstitutionalResponsible] Pivot Insert Error:', pivotError);
        // Si falla la tabla pivote, eliminamos el manager creado
        await supabase.from(TABLE_NAME).delete().eq('MANAGER_ID', newManager.MANAGER_ID);
        throw pivotError;
      }

      // Obtener instituciones para devolver al frontend
      const instIds = validInstitutions.map((i: any) => parseInt(i.institutionId));
      const { data: instData } = await supabase
        .from('t_institution')
        .select('INSTITUTION_ID, INSTITUTION_NAME')
        .in('INSTITUTION_ID', instIds);

      const instMap = new Map((instData || []).map((i: any) => [i.INSTITUTION_ID, i.INSTITUTION_NAME]));

      const resultInstitutions = validInstitutions.map((inst: any) => ({
        institutionId: inst.institutionId,
        institutionName: instMap.get(parseInt(inst.institutionId)) || 'N/A',
        cargo: inst.cargo
      }));

      return {
        ...newManager,
        institutions: resultInstitutions
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
    // El cargo ya no se guarda en la tabla principal, está en la pivote
    // dbData.cargo = r.cargo ? String(r.cargo).toUpperCase() : null;
    
    // Mantener INSTITUTION_ID como null (las relaciones están en la tabla pivote)
    dbData.INSTITUTION_ID = null;
    
    if (r.status !== undefined) dbData.STATUS = r.status ? 1 : 0;

    const data = await dbManager.withRetry(async (supabase) => {
      // 1. Actualizar el registro base
      const { error: updateError } = await supabase
        .from(TABLE_NAME)
        .update(dbData)
        .eq('MANAGER_ID', id);
      
      if (updateError) throw updateError;

      // 2. Si se enviaron institutions, actualizar la tabla pivote
      if (r.institutions !== undefined) {
        // Nueva estructura: [{ institutionId: "1", cargo: "Gerente" }, ...]
        const newInstitutions = (r.institutions as Array<{ institutionId: string; cargo: string }>)
          .map(inst => ({
            institutionId: parseInt(inst.institutionId),
            cargo: inst.cargo ? String(inst.cargo).toUpperCase() : ''
          }))
          .filter(inst => !isNaN(inst.institutionId) && inst.institutionId > 0);
        
        // Eliminar relaciones existentes
        await supabase
          .from(PIVOT_TABLE)
          .delete()
          .eq('"MANAGER_ID"', id);

        // Insertar nuevas relaciones CON cargo
        if (newInstitutions.length > 0) {
          const pivotInserts = newInstitutions.map((inst: any) => ({
            "MANAGER_ID": parseInt(id),
            "INSTITUTION_ID": inst.institutionId,
            cargo: inst.cargo || null
          }));

          const { error: pivotError } = await supabase
            .from(PIVOT_TABLE)
            .insert(pivotInserts);

          if (pivotError) throw pivotError;
        }
      }

      // 3. Recuperar el registro actualizado con sus instituciones
      const { data: updatedData, error: selectError } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('MANAGER_ID', id)
        .single();

      if (selectError) throw selectError;

      // 4. Obtener instituciones desde la tabla pivote (ahora devuelve array de objetos)
      const institutions = await getInstitutionsForManager(supabase, parseInt(id));

      return {
        ...updatedData,
        institutions
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
      const { data: updatedData, error } = await supabase
        .from(TABLE_NAME)
        .update({ STATUS: status ? 1 : 0 })
        .eq('MANAGER_ID', id)
        .select('*')
        .single();

      if (error) throw error;

      // Obtener instituciones (ahora devuelve array de objetos)
      const institutions = await getInstitutionsForManager(supabase, parseInt(id));

      return {
        ...updatedData,
        institutions
      } as DBInstitutionalResponsible;
    });

    res.json(mapDBToFrontend(data));
  } catch (error: unknown) {
    handleDbError(res, error);
  }
};
