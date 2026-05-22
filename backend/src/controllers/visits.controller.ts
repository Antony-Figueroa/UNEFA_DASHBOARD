import { Request, Response } from "express";
import { dbManager } from "../lib/db-manager.js";

export interface VisitRecord {
  VISIT_ID: number;
  PROFESSIONAL_PRACTICE_ID: number;
  TUTOR_ID: number;
  VISIT_DATE: string;
  VISIT_TYPE: string;
  VISIT_CASE: string;
  HOURS_WORKED: number;
  ACTIVITIES_PERFORMED: string;
  OBSERVATIONS: string;
  RECOMMENDATIONS: string;
  STATUS: number;
  CREATED_AT: string;
  UPDATED_AT: string;
  CREATED_BY: number;
}

interface VisitWithDetails extends VisitRecord {
  t_tutors?: {
    TUTOR_ID: number;
    NAME: string;
    SURNAME: string;
    TUTOR_CI: string;
  };
  t_professional_practices?: {
    PROFESSIONAL_PRACTICE_ID: number;
    START_DATE?: string;
    END_DATE?: string;
    t_internships_period?: {
      PERIOD_ID: number;
      START_DATE: string;
      END_DATE: string;
    };
    t_students?: {
      STUDENTS_ID: number;
      STUDENTS_CI: string;
      NAME: string;
      SURNAME: string;
    };
    t_institution?: {
      INSTITUTION_ID: number;
      INSTITUTION_NAME: string;
    };
  };
}

const mapVisitToFrontend = (v: VisitWithDetails) => ({
  visitId: v.VISIT_ID,
  practiceId: v.PROFESSIONAL_PRACTICE_ID,
  tutorId: v.TUTOR_ID,
  tutorName: v.t_tutors ? `${v.t_tutors.NAME} ${v.t_tutors.SURNAME}` : '',
  tutorCi: v.t_tutors?.TUTOR_CI || '',
  studentName: v.t_professional_practices?.t_students 
    ? `${v.t_professional_practices.t_students.NAME} ${v.t_professional_practices.t_students.SURNAME}` 
    : '',
  studentCi: v.t_professional_practices?.t_students?.STUDENTS_CI || '',
  institutionName: v.t_professional_practices?.t_institution?.INSTITUTION_NAME || '',
  visitDate: v.VISIT_DATE,
  visitType: v.VISIT_TYPE,
  visitCase: v.VISIT_CASE || 'SEGUIMIENTO_REGULAR',
  hoursWorked: v.HOURS_WORKED || 0,
  activitiesPerformed: v.ACTIVITIES_PERFORMED || '',
  observations: v.OBSERVATIONS || '',
  recommendations: v.RECOMMENDATIONS || '',
  status: v.STATUS === 1,
  createdAt: v.CREATED_AT,
  updatedAt: v.UPDATED_AT
});

export const getVisitsByPractice = async (req: Request, res: Response) => {
  try {
    const { practiceId } = req.params;
    const { includeInactive } = req.query;
    const supabase = dbManager.getConnection();

    let query = supabase
      .from('t_practice_visits')
      .select(`
        *,
        t_tutors (
          TUTOR_ID,
          NAME,
          SURNAME,
          TUTOR_CI
        ),
        t_professional_practices (
          PROFESSIONAL_PRACTICE_ID,
          START_DATE,
          END_DATE,
          t_internships_period (
            PERIOD_ID,
            START_DATE,
            END_DATE
          ),
          t_students (
            STUDENTS_ID,
            STUDENTS_CI,
            NAME,
            SURNAME
          ),
          t_institution (
            INSTITUTION_ID,
            INSTITUTION_NAME
          )
        )
      `)
      .eq('PROFESSIONAL_PRACTICE_ID', practiceId);

    // Por defecto solo trae activas (STATUS=1)
    // Si includeInactive=true, trae todas
    if (includeInactive !== 'true') {
      query = query.eq('STATUS', 1);
    }

    const { data, error } = await query
      .order('VISIT_DATE', { ascending: false });

    if (error) {
      console.error('[VisitsController] Error fetching visits:', error);
      return res.status(500).json({ message: 'Error al obtener visitas', error });
    }

    // Add period dates to each visit
    const visits = (data as unknown as VisitWithDetails[]).map(v => {
      const visit = mapVisitToFrontend(v);
      // Get period dates from professional practice or periods table
      const practice = v.t_professional_practices;
      const period = practice?.t_internships_period;
      return {
        ...visit,
        periodStartDate: period?.START_DATE || practice?.START_DATE,
        periodEndDate: period?.END_DATE || practice?.END_DATE
      };
    });

    res.json({
      success: true,
      data: visits
    });
  } catch (error) {
    console.error('[VisitsController] Error:', error);
    res.status(500).json({ message: 'Error al obtener visitas', error });
  }
};

export const getAllVisits = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, tutorId, studentCi, visitType } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const supabase = dbManager.getConnection();

    let query = supabase
      .from('t_practice_visits')
      .select(`
        *,
        t_tutors (
          TUTOR_ID,
          NAME,
          SURNAME,
          TUTOR_CI
        ),
        t_professional_practices (
          PROFESSIONAL_PRACTICE_ID,
          t_students (
            STUDENTS_ID,
            STUDENTS_CI,
            NAME,
            SURNAME
          ),
          t_institution (
            INSTITUTION_ID,
            INSTITUTION_NAME
          )
        )
      `, { count: 'exact' })
      .eq('STATUS', 1);

    if (tutorId) {
      query = query.eq('TUTOR_ID', tutorId);
    }
    if (visitType) {
      query = query.eq('VISIT_TYPE', visitType);
    }

    const { data, error, count } = await query
      .order('VISIT_DATE', { ascending: false })
      .range(offset, offset + Number(limit) - 1);

    if (error) {
      console.error('[VisitsController] Error fetching all visits:', error);
      return res.status(500).json({ message: 'Error al obtener visitas', error });
    }

    let visits = (data as unknown as VisitWithDetails[]).map(mapVisitToFrontend);

    if (studentCi) {
      visits = visits.filter(v => 
        v.studentCi.toLowerCase().includes(String(studentCi).toLowerCase())
      );
    }

    res.json({
      success: true,
      data: visits,
      meta: {
        total: count || 0,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil((count || 0) / Number(limit))
      }
    });
  } catch (error) {
    console.error('[VisitsController] Error:', error);
    res.status(500).json({ message: 'Error al obtener visitas', error });
  }
};

export const getVisitById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const supabase = dbManager.getConnection();

    const { data, error } = await supabase
      .from('t_practice_visits')
      .select(`
        *,
        t_tutors (
          TUTOR_ID,
          NAME,
          SURNAME,
          TUTOR_CI
        ),
        t_professional_practices (
          PROFESSIONAL_PRACTICE_ID,
          t_students (
            STUDENTS_ID,
            STUDENTS_CI,
            NAME,
            SURNAME
          ),
          t_institution (
            INSTITUTION_ID,
            INSTITUTION_NAME
          )
        )
      `)
      .eq('VISIT_ID', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ message: 'Visita no encontrada' });
    }

    res.json({
      success: true,
      data: mapVisitToFrontend(data as unknown as VisitWithDetails)
    });
  } catch (error) {
    console.error('[VisitsController] Error:', error);
    res.status(500).json({ message: 'Error al obtener visita', error });
  }
};

/**
 * Verifica si ya existe una visita con la misma fecha (misma hora) para la práctica.
 * Considera duplicado si existe una visita activa (STATUS=1) con exactamente la misma fecha.
 */
const checkDuplicateVisit = async (supabase: any, practiceId: number, visitDate: string, excludeVisitId?: number): Promise<{ isDuplicate: boolean; existingVisit?: any }> => {
  // Parsear la fecha de la visita y normalizar a UTC midnight para comparar solo fecha
  const visitDateNormalized = new Date(visitDate).toISOString();
  
  let query = supabase
    .from('t_practice_visits')
    .select('VISIT_ID, VISIT_DATE, VISIT_TYPE')
    .eq('PROFESSIONAL_PRACTICE_ID', practiceId)
    .eq('STATUS', 1);
  
  // Si estamos editando, excluir la visita actual
  if (excludeVisitId) {
    query = query.neq('VISIT_ID', excludeVisitId);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('[checkDuplicateVisit] Error:', error);
    return { isDuplicate: false };
  }
  
  // Verificar si hay alguna visita con exactamente la misma fecha
  const duplicate = (data || []).find((v: any) => {
    const existingDate = new Date(v.VISIT_DATE).toISOString();
    return existingDate === visitDateNormalized;
  });
  
  return { 
    isDuplicate: !!duplicate, 
    existingVisit: duplicate 
  };
};

/**
 * Valida que la fecha de la visita no sea futura.
 */
const validateFutureDate = (visitDate: string): { valid: boolean; message?: string } => {
  const now = new Date();
  const visitDateParsed = new Date(visitDate);
  
  // Normalizar a medianoche para comparar solo fecha (sin hora)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const visitDay = new Date(visitDateParsed.getFullYear(), visitDateParsed.getMonth(), visitDateParsed.getDate());
  
  if (visitDay > today) {
    return { 
      valid: false, 
      message: 'La fecha de la visita no puede ser futura' 
    };
  }
  
  return { valid: true };
};

export const createVisit = async (req: Request, res: Response) => {
  try {
    const {
      practiceId,
      tutorId,
      visitDate,
      visitType,
      visitCase,
      hoursWorked,
      activitiesPerformed,
      observations,
      recommendations
    } = req.body;

    // Validar que no sea fecha futura
    const futureDateValidation = validateFutureDate(visitDate);
    if (!futureDateValidation.valid) {
      return res.status(400).json({ 
        message: futureDateValidation.message,
        code: 'FUTURE_DATE_NOT_ALLOWED'
      });
    }

    const userId = (req as any).user?.userId;
    const supabase = dbManager.getConnection();

    // Verificar duplicados
    const { isDuplicate, existingVisit } = await checkDuplicateVisit(supabase, practiceId, visitDate);
    if (isDuplicate) {
      const existingDate = new Date(existingVisit.VISIT_DATE).toLocaleString('es-VE');
      return res.status(409).json({ 
        message: `Ya existe una visita registrada para esta práctica en la fecha ${existingDate}. No se permiten visitas duplicadas.`,
        code: 'DUPLICATE_VISIT_DATE',
        existingVisit: {
          visitId: existingVisit.VISIT_ID,
          visitDate: existingVisit.VISIT_DATE,
          visitType: existingVisit.VISIT_TYPE
        }
      });
    }

    const { data, error } = await supabase
      .from('t_practice_visits')
      .insert([{
        PROFESSIONAL_PRACTICE_ID: practiceId,
        TUTOR_ID: tutorId,
        VISIT_DATE: visitDate || new Date().toISOString(),
        VISIT_TYPE: visitType || 'PRESENCIAL',
        VISIT_CASE: visitCase || 'SEGUIMIENTO_REGULAR',
        HOURS_WORKED: hoursWorked || 0,
        ACTIVITIES_PERFORMED: activitiesPerformed || '',
        OBSERVATIONS: observations || '',
        RECOMMENDATIONS: recommendations || '',
        STATUS: 1,
        CREATED_BY: userId
      }])
      .select(`
        *,
        t_tutors (
          TUTOR_ID,
          NAME,
          SURNAME,
          TUTOR_CI
        ),
        t_professional_practices (
          PROFESSIONAL_PRACTICE_ID,
          t_students (
            STUDENTS_ID,
            STUDENTS_CI,
            NAME,
            SURNAME
          ),
          t_institution (
            INSTITUTION_ID,
            INSTITUTION_NAME
          )
        )
      `)
      .single();

    if (error) {
      console.error('[VisitsController] Error creating visit:', error);
      return res.status(500).json({ message: 'Error al crear visita', error });
    }

    res.status(201).json({
      success: true,
      message: 'Visita registrada exitosamente',
      data: mapVisitToFrontend(data as unknown as VisitWithDetails)
    });
  } catch (error) {
    console.error('[VisitsController] Error:', error);
    res.status(500).json({ message: 'Error al crear visita', error });
  }
};

export const updateVisit = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      visitDate,
      visitType,
      visitCase,
      hoursWorked,
      activitiesPerformed,
      observations,
      recommendations,
      practiceId // needed for duplicate check
    } = req.body;

    // Validar que no sea fecha futura (si se está actualizando la fecha)
    if (visitDate) {
      const futureDateValidation = validateFutureDate(visitDate);
      if (!futureDateValidation.valid) {
        return res.status(400).json({ 
          message: futureDateValidation.message,
          code: 'FUTURE_DATE_NOT_ALLOWED'
        });
      }

      // Verificar duplicados solo si se está cambiando la fecha
      const { isDuplicate, existingVisit } = await checkDuplicateVisit(
        dbManager.getConnection(), 
        practiceId, 
        visitDate,
        parseInt(id)
      );
      if (isDuplicate) {
        const existingDate = new Date(existingVisit.VISIT_DATE).toLocaleString('es-VE');
        return res.status(409).json({ 
          message: `Ya existe una visita registrada para esta práctica en la fecha ${existingDate}. No se permiten visitas duplicadas.`,
          code: 'DUPLICATE_VISIT_DATE',
          existingVisit: {
            visitId: existingVisit.VISIT_ID,
            visitDate: existingVisit.VISIT_DATE,
            visitType: existingVisit.VISIT_TYPE
          }
        });
      }
    }

    const supabase = dbManager.getConnection();

    const updateData: Record<string, unknown> = {
      UPDATED_AT: new Date().toISOString()
    };

    if (visitDate) updateData.VISIT_DATE = visitDate;
    if (visitType) updateData.VISIT_TYPE = visitType;
    if (visitCase) updateData.VISIT_CASE = visitCase;
    if (hoursWorked !== undefined) updateData.HOURS_WORKED = hoursWorked;
    if (activitiesPerformed !== undefined) updateData.ACTIVITIES_PERFORMED = activitiesPerformed;
    if (observations !== undefined) updateData.OBSERVATIONS = observations;
    if (recommendations !== undefined) updateData.RECOMMENDATIONS = recommendations;

    const { data, error } = await supabase
      .from('t_practice_visits')
      .update(updateData)
      .eq('VISIT_ID', id)
      .select(`
        *,
        t_tutors (
          TUTOR_ID,
          NAME,
          SURNAME,
          TUTOR_CI
        ),
        t_professional_practices (
          PROFESSIONAL_PRACTICE_ID,
          t_students (
            STUDENTS_ID,
            STUDENTS_CI,
            NAME,
            SURNAME
          ),
          t_institution (
            INSTITUTION_ID,
            INSTITUTION_NAME
          )
        )
      `)
      .single();

    if (error) {
      console.error('[VisitsController] Error updating visit:', error);
      return res.status(500).json({ message: 'Error al actualizar visita', error });
    }

    res.json({
      success: true,
      message: 'Visita actualizada exitosamente',
      data: mapVisitToFrontend(data as unknown as VisitWithDetails)
    });
  } catch (error) {
    console.error('[VisitsController] Error:', error);
    res.status(500).json({ message: 'Error al actualizar visita', error });
  }
};

export const deleteVisit = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const supabase = dbManager.getConnection();

    const { error } = await supabase
      .from('t_practice_visits')
      .update({ STATUS: 0, UPDATED_AT: new Date().toISOString() })
      .eq('VISIT_ID', id);

    if (error) {
      console.error('[VisitsController] Error deleting visit:', error);
      return res.status(500).json({ message: 'Error al eliminar visita', error });
    }

    res.json({
      success: true,
      message: 'Visita eliminada exitosamente'
    });
  } catch (error) {
    console.error('[VisitsController] Error:', error);
    res.status(500).json({ message: 'Error al eliminar visita', error });
  }
};

export const restoreVisit = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const supabase = dbManager.getConnection();

    const { error } = await supabase
      .from('t_practice_visits')
      .update({ STATUS: 1, UPDATED_AT: new Date().toISOString() })
      .eq('VISIT_ID', id);

    if (error) {
      console.error('[VisitsController] Error restoring visit:', error);
      return res.status(500).json({ message: 'Error al restaurar visita', error });
    }

    res.json({
      success: true,
      message: 'Visita restaurada exitosamente'
    });
  } catch (error) {
    console.error('[VisitsController] Error:', error);
    res.status(500).json({ message: 'Error al restaurar visita', error });
  }
};

export const getVisitStats = async (req: Request, res: Response) => {
  try {
    const { tutorId, practiceId } = req.query;
    const supabase = dbManager.getConnection();

    let query = supabase
      .from('t_practice_visits')
      .select('VISIT_ID, HOURS_WORKED, VISIT_TYPE, VISIT_DATE', { count: 'exact' })
      .eq('STATUS', 1);

    if (tutorId) {
      query = query.eq('TUTOR_ID', tutorId);
    }
    if (practiceId) {
      query = query.eq('PROFESSIONAL_PRACTICE_ID', practiceId);
    }

    const { data, count, error } = await query;

    if (error) {
      console.error('[VisitsController] Error fetching visit stats:', error);
      return res.status(500).json({ message: 'Error al obtener estadísticas', error });
    }

    const totalHours = (data || []).reduce((sum: number, v: any) => sum + (v.HOURS_WORKED || 0), 0);
    
    const visitsByType: Record<string, number> = {};
    (data || []).forEach((v: any) => {
      visitsByType[v.VISIT_TYPE] = (visitsByType[v.VISIT_TYPE] || 0) + 1;
    });

    const visitsByMonth: Record<string, number> = {};
    (data || []).forEach((v: any) => {
      const date = new Date(v.VISIT_DATE);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      visitsByMonth[monthKey] = (visitsByMonth[monthKey] || 0) + 1;
    });

    res.json({
      success: true,
      data: {
        totalVisits: count || 0,
        totalHours,
        visitsByType,
        visitsByMonth: Object.entries(visitsByMonth)
          .map(([month, count]) => ({ month, count }))
          .sort((a, b) => a.month.localeCompare(b.month))
      }
    });
  } catch (error) {
    console.error('[VisitsController] Error:', error);
    res.status(500).json({ message: 'Error al obtener estadísticas', error });
  }
};

/**
 * Obtiene el conteo de visitas por tutor para mostrar en el selector.
 * Retorna todos los tutores activos con su cantidad de visitas.
 */
export const getVisitsCountByTutor = async (req: Request, res: Response) => {
  try {
    const supabase = dbManager.getConnection();

    // Primero obtener todos los tutores activos
    const { data: tutors, error: tutorsError } = await supabase
      .from('t_tutors')
      .select('TUTOR_ID, NAME, SURNAME')
      .eq('STATUS', 1);

    if (tutorsError) {
      console.error('[VisitsController] Error fetching tutors:', tutorsError);
      return res.status(500).json({ message: 'Error al obtener tutores', error: tutorsError });
    }

    // Obtener conteo de visitas por tutor
    const { data: visitCounts, error: visitsError } = await supabase
      .from('t_practice_visits')
      .select('TUTOR_ID', { count: 'exact' })
      .eq('STATUS', 1);

    if (visitsError) {
      console.error('[VisitsController] Error fetching visit counts:', visitsError);
      return res.status(500).json({ message: 'Error al obtener conteo', error: visitsError });
    }

    // Agrupar conteos por tutor
    const countsMap: Record<number, number> = {};
    (visitCounts || []).forEach((v: any) => {
      countsMap[v.TUTOR_ID] = (countsMap[v.TUTOR_ID] || 0) + 1;
    });

    // Combinar tutores con sus conteos
    const result = (tutors || []).map(tutor => ({
      tutorId: tutor.TUTOR_ID,
      tutorName: `${tutor.NAME || ''} ${tutor.SURNAME || ''}`.trim(),
      visitCount: countsMap[tutor.TUTOR_ID] || 0
    }));

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('[VisitsController] Error:', error);
    res.status(500).json({ message: 'Error al obtener conteo por tutor', error });
  }
};
