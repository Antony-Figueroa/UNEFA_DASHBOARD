import { Request, Response } from 'express';
import { dbManager } from '../lib/db-manager.js';

const LISTS_TABLE = 't_prospect_lists';
const ITEMS_TABLE = 't_prospect_list_items';

const handleDbError = (res: Response, error: unknown) => {
  const dbError = error as { message?: string; details?: string; code?: string; hint?: string; status?: number };
  console.error('[ProspectsController] Error:', {
    message: dbError.message,
    code: dbError.code,
    status: dbError.status,
    details: dbError.details,
    hint: dbError.hint
  });

  let userMessage = 'Error en la base de datos';
  if (dbError.code === '23502') {
    userMessage = `Error: El campo ${dbError.details?.match(/"([^"]+)"/)?.[1] || 'requerido'} no puede estar vacío`;
  } else if (dbError.code === '23505') {
    userMessage = 'Error: Ya existe un registro con estos datos (duplicado)';
  } else if (dbError.code === 'PGRST204') {
    userMessage = 'Error: Registro no encontrado';
  } else if (dbError.message) {
    userMessage = dbError.message;
  }

  const statusCode = (error as any)?.status || dbError.status || 500;
  res.status(statusCode).json({
    success: false,
    message: userMessage
  });
};

// -------------------------------------------------------------------------
// Lists CRUD
// -------------------------------------------------------------------------

export const getLists = async (req: Request, res: Response) => {
  try {
    const result = await dbManager.withRetry(async (supabase) => {
      const { data, error } = await supabase
        .from(LISTS_TABLE)
        .select(`
          *,
          t_internships_period (DESCRIPTION)
        `)
        .eq('STATUS', 1)
        .order('CREATED_AT', { ascending: false });

      if (error) throw error;

      const listsWithCount = await Promise.all((data || []).map(async (list: any) => {
        const { count, error: countError } = await supabase
          .from(ITEMS_TABLE)
          .select('ITEM_ID', { count: 'exact', head: true })
          .eq('LIST_ID', list.LIST_ID);

        if (countError) throw countError;

        return {
          listId: list.LIST_ID,
          name: list.NAME,
          description: list.DESCRIPTION,
          periodId: list.PERIOD_ID,
          periodDescription: list.t_internships_period?.DESCRIPTION || '',
          status: list.STATUS,
          createdAt: list.CREATED_AT,
          updatedAt: list.UPDATED_AT,
          createdBy: list.CREATED_BY,
          itemCount: count || 0
        };
      }));

      return listsWithCount;
    });

    res.json({ success: true, data: result, message: 'Listas obtenidas exitosamente' });
  } catch (error) {
    handleDbError(res, error);
  }
};

export const getListById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await dbManager.withRetry(async (supabase) => {
      const { data: list, error } = await supabase
        .from(LISTS_TABLE)
        .select(`
          *,
          t_internships_period (DESCRIPTION)
        `)
        .eq('LIST_ID', id)
        .eq('STATUS', 1)
        .single();

      if (error) throw error;

      const { data: items, error: itemsError } = await supabase
        .from(ITEMS_TABLE)
        .select(`
          *,
          t_students (
            STUDENTS_ID,
            STUDENTS_CI,
            NAME,
            SECOND_NAME,
            SURNAME,
            SECOND_SURNAME,
            CONTACT_PHONE,
            EMAIL
          )
        `)
        .eq('LIST_ID', id)
        .order('ADDED_AT', { ascending: true });

      if (itemsError) throw itemsError;

      return {
        listId: list.LIST_ID,
        name: list.NAME,
        description: list.DESCRIPTION,
        periodId: list.PERIOD_ID,
        periodDescription: list.t_internships_period?.DESCRIPTION || '',
        status: list.STATUS,
        createdAt: list.CREATED_AT,
        updatedAt: list.UPDATED_AT,
        createdBy: list.CREATED_BY,
        items: (items || []).map((item: any) => ({
          itemId: item.ITEM_ID,
          listId: item.LIST_ID,
          studentsId: item.STUDENTS_ID,
          enrolled: item.ENROLLED,
          notes: item.NOTES,
          addedAt: item.ADDED_AT,
          addedBy: item.ADDED_BY,
          student: item.t_students ? {
            studentsId: item.t_students.STUDENTS_ID,
            studentCi: item.t_students.STUDENTS_CI,
            name: item.t_students.NAME,
            secondName: item.t_students.SECOND_NAME,
            surname: item.t_students.SURNAME,
            secondSurname: item.t_students.SECOND_SURNAME,
            contactPhone: item.t_students.CONTACT_PHONE,
            email: item.t_students.EMAIL
          } : null
        }))
      };
    });

    res.json({ success: true, data: result, message: 'Lista obtenida exitosamente' });
  } catch (error) {
    handleDbError(res, error);
  }
};

export const createList = async (req: Request, res: Response) => {
  try {
    const { name, description, periodId, createdBy } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'El nombre de la lista es requerido' });
    }

    if (!periodId) {
      return res.status(400).json({ success: false, message: 'El período académico es requerido' });
    }

    const result = await dbManager.withRetry(async (supabase) => {
      const { data, error } = await supabase
        .from(LISTS_TABLE)
        .insert([{
          NAME: name.trim(),
          DESCRIPTION: description || null,
          PERIOD_ID: periodId,
          CREATED_BY: createdBy || null
        }])
        .select()
        .single();

      if (error) throw error;

      return {
        listId: data.LIST_ID,
        name: data.NAME,
        description: data.DESCRIPTION,
        periodId: data.PERIOD_ID,
        status: data.STATUS,
        createdAt: data.CREATED_AT,
        updatedAt: data.UPDATED_AT,
        createdBy: data.CREATED_BY
      };
    });

    res.status(201).json({ success: true, data: result, message: 'Lista creada exitosamente' });
  } catch (error) {
    handleDbError(res, error);
  }
};

export const updateList = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const result = await dbManager.withRetry(async (supabase) => {
      const updateData: Record<string, unknown> = {
        UPDATED_AT: new Date().toISOString().slice(0, 19).replace('T', ' ')
      };

      if (name !== undefined) updateData.NAME = name.trim();
      if (description !== undefined) updateData.DESCRIPTION = description;

      const { data, error } = await supabase
        .from(LISTS_TABLE)
        .update(updateData)
        .eq('LIST_ID', id)
        .eq('STATUS', 1)
        .select()
        .single();

      if (error) throw error;

      return {
        listId: data.LIST_ID,
        name: data.NAME,
        description: data.DESCRIPTION,
        periodId: data.PERIOD_ID,
        status: data.STATUS,
        createdAt: data.CREATED_AT,
        updatedAt: data.UPDATED_AT,
        createdBy: data.CREATED_BY
      };
    });

    res.json({ success: true, data: result, message: 'Lista actualizada exitosamente' });
  } catch (error) {
    handleDbError(res, error);
  }
};

export const deleteList = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await dbManager.withRetry(async (supabase) => {
      const { error } = await supabase
        .from(LISTS_TABLE)
        .update({ STATUS: 0, UPDATED_AT: new Date().toISOString().slice(0, 19).replace('T', ' ') })
        .eq('LIST_ID', id);

      if (error) throw error;
    });

    res.json({ success: true, message: 'Lista eliminada exitosamente' });
  } catch (error) {
    handleDbError(res, error);
  }
};

// -------------------------------------------------------------------------
// List Items
// -------------------------------------------------------------------------

export const getListItems = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await dbManager.withRetry(async (supabase) => {
      const { data, error } = await supabase
        .from(ITEMS_TABLE)
        .select(`
          *,
          t_students (
            STUDENTS_ID,
            STUDENTS_CI,
            NAME,
            SECOND_NAME,
            SURNAME,
            SECOND_SURNAME,
            CONTACT_PHONE,
            EMAIL
          )
        `)
        .eq('LIST_ID', id)
        .order('ADDED_AT', { ascending: true });

      if (error) throw error;

      return (data || []).map((item: any) => ({
        itemId: item.ITEM_ID,
        listId: item.LIST_ID,
        studentsId: item.STUDENTS_ID,
        enrolled: item.ENROLLED,
        notes: item.NOTES,
        addedAt: item.ADDED_AT,
        addedBy: item.ADDED_BY,
        student: item.t_students ? {
          studentsId: item.t_students.STUDENTS_ID,
          studentCi: item.t_students.STUDENTS_CI,
          name: item.t_students.NAME,
          secondName: item.t_students.SECOND_NAME,
          surname: item.t_students.SURNAME,
          secondSurname: item.t_students.SECOND_SURNAME,
          contactPhone: item.t_students.CONTACT_PHONE,
          email: item.t_students.EMAIL
        } : null
      }));
    });

    res.json({ success: true, data: result, message: 'Items obtenidos exitosamente' });
  } catch (error) {
    handleDbError(res, error);
  }
};

export const addListItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { studentsId, notes, addedBy } = req.body;

    if (!studentsId) {
      return res.status(400).json({ success: false, message: 'El ID del estudiante es requerido' });
    }

    const result = await dbManager.withRetry(async (supabase) => {
      const { data, error } = await supabase
        .from(ITEMS_TABLE)
        .insert([{
          LIST_ID: parseInt(id),
          STUDENTS_ID: studentsId,
          NOTES: notes || null,
          ADDED_BY: addedBy || null
        }])
        .select(`
          *,
          t_students (
            STUDENTS_ID,
            STUDENTS_CI,
            NAME,
            SECOND_NAME,
            SURNAME,
            SECOND_SURNAME,
            CONTACT_PHONE,
            EMAIL
          )
        `)
        .single();

      if (error) throw error;

      return {
        itemId: data.ITEM_ID,
        listId: data.LIST_ID,
        studentsId: data.STUDENTS_ID,
        enrolled: data.ENROLLED,
        notes: data.NOTES,
        addedAt: data.ADDED_AT,
        addedBy: data.ADDED_BY,
        student: data.t_students ? {
          studentsId: data.t_students.STUDENTS_ID,
          studentCi: data.t_students.STUDENTS_CI,
          name: data.t_students.NAME,
          secondName: data.t_students.SECOND_NAME,
          surname: data.t_students.SURNAME,
          secondSurname: data.t_students.SECOND_SURNAME,
          contactPhone: data.t_students.CONTACT_PHONE,
          email: data.t_students.EMAIL
        } : null
      };
    });

    res.status(201).json({ success: true, data: result, message: 'Estudiante agregado a la lista exitosamente' });
  } catch (error) {
    handleDbError(res, error);
  }
};

export const bulkAddListItems = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { studentIds, addedBy } = req.body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Se requiere al menos un ID de estudiante' });
    }

    const result = await dbManager.withRetry(async (supabase) => {
      const items = studentIds.map((studentsId: number) => ({
        LIST_ID: parseInt(id),
        STUDENTS_ID: studentsId,
        ADDED_BY: addedBy || null
      }));

      const { data, error } = await supabase
        .from(ITEMS_TABLE)
        .insert(items)
        .select();

      if (error) throw error;

      return {
        addedCount: data?.length || 0,
        items: (data || []).map((item: any) => ({
          itemId: item.ITEM_ID,
          listId: item.LIST_ID,
          studentsId: item.STUDENTS_ID,
          enrolled: item.ENROLLED,
          notes: item.NOTES,
          addedAt: item.ADDED_AT,
          addedBy: item.ADDED_BY
        }))
      };
    });

    res.status(201).json({ success: true, data: result, message: `${result.addedCount} estudiante(s) agregado(s) exitosamente` });
  } catch (error) {
    handleDbError(res, error);
  }
};

export const removeListItem = async (req: Request, res: Response) => {
  try {
    const { itemId } = req.params;

    await dbManager.withRetry(async (supabase) => {
      const { error } = await supabase
        .from(ITEMS_TABLE)
        .delete()
        .eq('ITEM_ID', itemId);

      if (error) throw error;
    });

    res.json({ success: true, message: 'Estudiante eliminado de la lista exitosamente' });
  } catch (error) {
    handleDbError(res, error);
  }
};

export const toggleEnrolled = async (req: Request, res: Response) => {
  try {
    const { itemId } = req.params;

    const result = await dbManager.withRetry(async (supabase) => {
      const { data: current, error: fetchError } = await supabase
        .from(ITEMS_TABLE)
        .select('ENROLLED')
        .eq('ITEM_ID', itemId)
        .single();

      if (fetchError) throw fetchError;

      const { data, error } = await supabase
        .from(ITEMS_TABLE)
        .update({ ENROLLED: !current.ENROLLED })
        .eq('ITEM_ID', itemId)
        .select()
        .single();

      if (error) throw error;

      return {
        itemId: data.ITEM_ID,
        listId: data.LIST_ID,
        studentsId: data.STUDENTS_ID,
        enrolled: data.ENROLLED,
        notes: data.NOTES,
        addedAt: data.ADDED_AT
      };
    });

    res.json({ success: true, data: result, message: 'Estado de inscripción actualizado exitosamente' });
  } catch (error) {
    handleDbError(res, error);
  }
};

// -------------------------------------------------------------------------
// Eligible Students
// -------------------------------------------------------------------------

export const getEligibleStudents = async (req: Request, res: Response) => {
  try {
    const { search, careerId: careerIdParam, periodId: periodIdParam, page, limit } = req.query;

    const pageNum = parseInt(page as string) || 0;
    const limitNum = Math.min(parseInt(limit as string) || 20, 100);
    const careerId = careerIdParam ? parseInt(careerIdParam as string) : null;
    const periodId = periodIdParam ? parseInt(periodIdParam as string) : null;

    if (limitNum > 100) {
      return res.status(400).json({
        success: false,
        message: 'Limit no puede exceder 100'
      });
    }

    const result = await dbManager.withRetry(async (supabase) => {
      // Step 1: Get excluded student IDs (active/completed practices)
      let practicesQuery = supabase
        .from('t_professional_practices')
        .select('STUDENTS_ID')
        .in('PRACTICES_STATUS', [1, 2, 3]);

      if (periodId) {
        practicesQuery = practicesQuery.eq('PERIOD_ID', periodId);
      }

      const { data: excludedPractices } = await practicesQuery;
      const excludedIds = [...new Set((excludedPractices || []).map((p: any) => p.STUDENTS_ID))];

      // Step 2: Query eligible students
      let query = supabase
        .from('t_students')
        .select(`
          STUDENTS_ID,
          STUDENTS_CI,
          NAME,
          SECOND_NAME,
          SURNAME,
          SECOND_SURNAME,
          CONTACT_PHONE,
          EMAIL,
          t_persons!person_id (
            ci,
            first_name,
            middle_name,
            last_name,
            second_last_name
          )
        `, { count: 'exact' })
        .eq('STATUS', 1);

      if (excludedIds.length > 0) {
        query = query.not('STUDENTS_ID', 'in', `(${excludedIds.join(',')})`);
      }

      if (search && (search as string).trim()) {
        const term = (search as string).trim();
        query = query.or(
          `STUDENTS_CI.ilike.%${term}%,` +
          `NAME.ilike.%${term}%,` +
          `SURNAME.ilike.%${term}%`
        );
      }

      const { count: totalCount, error: countError } = await query;
      if (countError) throw countError;

      const from = pageNum * limitNum;
      const to = from + limitNum - 1;

      const { data: students, error } = await query
        .order('SURNAME', { ascending: true })
        .order('NAME', { ascending: true })
        .range(from, to);

      if (error) throw error;

      // Step 3: Get career info for eligible students
      const studentIds = (students || []).map((s: any) => s.STUDENTS_ID);
      const careerMap: Record<number, { CAREER_ID: number; CAREER_NAME: string }> = {};

      if (studentIds.length > 0) {
        const { data: latestPractices } = await supabase
          .from('t_professional_practices')
          .select(`
            STUDENTS_ID,
            CAREER_ID,
            t_career!inner (
              CAREER_NAME
            )
          `)
          .in('STUDENTS_ID', studentIds)
          .not('CAREER_ID', 'is', null)
          .order('CREATION_DATE', { ascending: false });

        const practiceMap = new Map<number, any>();
        (latestPractices || []).forEach((p: any) => {
          if (!practiceMap.has(p.STUDENTS_ID)) {
            practiceMap.set(p.STUDENTS_ID, p);
          }
        });

        for (const [id, p] of practiceMap.entries()) {
          careerMap[id] = {
            CAREER_ID: p.CAREER_ID,
            CAREER_NAME: p.t_career?.CAREER_NAME || ''
          };
        }
      }

      // Step 4: Map response data
      const mappedData = (students || []).map((s: any) => {
        const ciParts = s.t_persons?.ci?.split('-') || ['', ''];
        const career = careerMap[s.STUDENTS_ID] || null;

        const studentData: Record<string, unknown> = {
          studentsId: s.STUDENTS_ID,
          studentCi: s.t_persons?.ci || '',
          identificationPrefix: ciParts[0] || 'V',
          identificationNumber: ciParts[1] || s.STUDENTS_CI || '',
          firstName: s.t_persons?.first_name || s.NAME || '',
          middleName: s.t_persons?.middle_name || s.SECOND_NAME || '',
          lastName: s.t_persons?.last_name || s.SURNAME || '',
          secondLastName: s.t_persons?.second_last_name || s.SECOND_SURNAME || '',
          email: s.t_persons?.email || s.EMAIL || '',
          phone: s.t_persons?.phone || s.CONTACT_PHONE || ''
        };

        if (career) {
          studentData.careerName = career.CAREER_NAME;
          studentData.careerId = career.CAREER_ID;
        } else {
          studentData.careerName = '';
          studentData.careerId = null;
        }

        return studentData;
      });

      // Apply career filter post-query
      const filtered = careerId
        ? mappedData.filter(s => s.careerId === careerId)
        : mappedData;

      return {
        data: filtered,
        meta: {
          total: careerId ? filtered.length : totalCount || 0,
          page: pageNum,
          limit: limitNum
        }
      };
    });

    res.json({
      success: true,
      data: result.data,
      meta: result.meta
    });
  } catch (error) {
    handleDbError(res, error);
  }
};
