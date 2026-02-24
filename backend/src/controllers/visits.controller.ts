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
      .eq('PROFESSIONAL_PRACTICE_ID', practiceId)
      .eq('STATUS', 1)
      .order('VISIT_DATE', { ascending: false });

    if (error) {
      console.error('[VisitsController] Error fetching visits:', error);
      return res.status(500).json({ message: 'Error al obtener visitas', error });
    }

    const visits = (data as unknown as VisitWithDetails[]).map(mapVisitToFrontend);

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

    const userId = (req as any).user?.userId;
    const supabase = dbManager.getConnection();

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
      recommendations
    } = req.body;

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
