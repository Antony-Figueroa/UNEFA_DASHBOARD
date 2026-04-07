import { Request, Response } from "express";
import { DatabaseManager } from "../lib/db-manager.js";

interface DBProfessionalPractice {
  PROFESSIONAL_PRACTICE_ID: number;
  REPORT_TITLE: string;
  TRANSFER: number;
  TOUR: string;
  OBSERVATION: string;
  STATUS: number;
  CREATION_DATE: string;
  STUDENTS_ID: number;
  STUDENT_CI: string;
  STUDENT_NAME: string;
  STUDENT_SURNAME: string;
}

interface DBTrackingResponse extends DBProfessionalPractice {
  t_students?: {
    STUDENTS_CI: string;
    NAME: string;
    SURNAME: string;
    t_career?: {
      CAREER_ID: number;
      CAREER_NAME: string;
    };
  };
}

const mapDBToFrontend = (p: DBTrackingResponse) => ({
  trackingId: String(p.PROFESSIONAL_PRACTICE_ID),
  studentIdNumber: p.STUDENT_CI,
  studentName: `${p.STUDENT_NAME} ${p.STUDENT_SURNAME}`,
  reportTitle: p.REPORT_TITLE,
  transfer: p.TRANSFER === 1,
  route: p.TOUR,
  observations: p.OBSERVATION,
  status: p.STATUS === 1,
  creationDate: new Date(p.CREATION_DATE),
  careerName: p.t_students?.t_career?.CAREER_NAME || null
});

export const getTrackings = async (_req: Request, res: Response) => {
  try {
    const db = DatabaseManager.getInstance();
    const { data, error } = await db.getConnection()
      .from('t_professional_practices')
      .select(`
        *,
        t_students:STUDENTS_ID (
          STUDENTS_CI,
          NAME,
          SURNAME,
          t_career:CAREER_ID (
            CAREER_ID,
            CAREER_NAME
          )
        )
      `)
      .eq('PRACTICES_STATUS', 2)
      .eq('STATUS', 1);

    if (error) throw error;

    const formattedData = (data as unknown as DBTrackingResponse[]).map(p => ({
      ...p,
      STUDENT_CI: p.t_students?.STUDENTS_CI || "",
      STUDENT_NAME: p.t_students?.NAME || "",
      STUDENT_SURNAME: p.t_students?.SURNAME || "",
      CAREER_NAME: p.t_students?.t_career?.CAREER_NAME || null
    })).map(mapDBToFrontend);

    res.json(formattedData);
  } catch (error: unknown) {
    const err = error as Error;
    console.error("[TrackingController] Error in getTrackings:", err);
    res.status(500).json({ error: err.message || "Error al obtener seguimientos" });
  }
};

export const createTracking = async (req: Request, res: Response) => {
  try {
    const db = DatabaseManager.getInstance();
    const { studentIdNumber, reportTitle, transfer, route, observations } = req.body;

    // First find student ID by CI
    const { data: student, error: studentError } = await db.getConnection()
      .from('t_students')
      .select('STUDENTS_ID')
      .eq('STUDENTS_CI', studentIdNumber)
      .single();

    if (studentError || !student) {
      return res.status(404).json({ error: "Estudiante no encontrado" });
    }

    const newPractice = {
      STUDENTS_ID: student.STUDENTS_ID,
      REPORT_TITLE: reportTitle,
      TRANSFER: transfer ? 1 : 0,
      TOUR: route,
      OBSERVATION: observations || "",
      STATUS: 1,
      CREATION_DATE: new Date().toISOString(),
      START_DATE: new Date().toISOString().split('T')[0], // Default dates
      END_DATE: new Date().toISOString().split('T')[0],
      REGISTRATION_DATE: new Date().toISOString(),
      GRADE: 0,
      PRACTICES_STATUS: 'ACTIVA',
      PERIOD_ID: 1, // Default or need to be handled
      INSTITUTION_ID: 1,
      MANAGER_ID: 1,
      ENROLLMENT: 'N/A',
      INTERNSHIP_STATUS: 1,
      INTERNSHIP_TYPE_ID: 1
    };

    const { data, error } = await db.getConnection()
      .from('t_professional_practices')
      .insert([newPractice])
      .select(`
        *,
        t_students:STUDENTS_ID (
          STUDENTS_CI,
          NAME,
          SURNAME
        )
      `)
      .single();

    if (error) throw error;

    const p = data as unknown as DBTrackingResponse;
    const formatted = mapDBToFrontend({
      ...p,
      STUDENT_CI: p.t_students?.STUDENTS_CI || "",
      STUDENT_NAME: p.t_students?.NAME || "",
      STUDENT_SURNAME: p.t_students?.SURNAME || ""
    });

    res.status(201).json(formatted);
  } catch (error: unknown) {
    const err = error as Error;
    console.error("[TrackingController] Error in createTracking:", err);
    res.status(500).json({ error: err.message || "Error al crear seguimiento" });
  }
};

export const updateTracking = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = DatabaseManager.getInstance();
    const { reportTitle, transfer, route, observations } = req.body;

    // No actualizamos el STATUS - solo actualizamos los datos del seguimiento
    const updateData = {
      REPORT_TITLE: reportTitle,
      TRANSFER: transfer ? 1 : 0,
      TOUR: route,
      OBSERVATION: observations
    };

    const { data, error } = await db.getConnection()
      .from('t_professional_practices')
      .update(updateData)
      .eq('PROFESSIONAL_PRACTICE_ID', id)
      .select(`
        *,
        t_students:STUDENTS_ID (
          STUDENTS_CI,
          NAME,
          SURNAME,
          t_career:CAREER_ID (
            CAREER_ID,
            CAREER_NAME
          )
        )
      `)
      .single();

    if (error) throw error;

    const p = data as unknown as DBTrackingResponse;
    const formatted = mapDBToFrontend({
      ...p,
      STUDENT_CI: p.t_students?.STUDENTS_CI || "",
      STUDENT_NAME: p.t_students?.NAME || "",
      STUDENT_SURNAME: p.t_students?.SURNAME || ""
    });

    res.json(formatted);
  } catch (error: unknown) {
    const err = error as Error;
    console.error("[TrackingController] Error in updateTracking:", err);
    res.status(500).json({ error: err.message || "Error al actualizar seguimiento" });
  }
};

export const getTrackingStats = async (req: Request, res: Response) => {
  try {
    const db = DatabaseManager.getInstance();
    const supabase = db.getConnection();

    // 1. Historical trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const { data: trendData, error: trendError } = await supabase
      .from('t_professional_practices')
      .select('CREATION_DATE')
      .gte('CREATION_DATE', sixMonthsAgo.toISOString())
      .order('CREATION_DATE', { ascending: true });

    if (trendError) throw trendError;

    // Group by month
    const monthsMap = new Map<string, number>();
    trendData?.forEach(item => {
      const date = new Date(item.CREATION_DATE);
      const monthYear = date.toLocaleString('default', { month: 'short' });
      monthsMap.set(monthYear, (monthsMap.get(monthYear) || 0) + 1);
    });

    const historicalTrend = Array.from(monthsMap.entries()).map(([label, count]) => ({
      label,
      count
    }));

    // 2. Comparison between periods
    const { data: periodData, error: periodError } = await supabase
      .from('t_professional_practices')
      .select('PERIOD_ID, t_internships_period(DESCRIPTION)')
      .limit(1000);

    if (periodError) throw periodError;

    const periodMap = new Map<string, number>();
    
    interface PeriodStatItem {
      PERIOD_ID: number;
      t_internships_period: { DESCRIPTION: string } | { DESCRIPTION: string }[] | null;
    }

    (periodData as unknown as PeriodStatItem[])?.forEach((item) => {
      const periodInfo = Array.isArray(item.t_internships_period) 
        ? item.t_internships_period[0] 
        : item.t_internships_period;
      const periodName = periodInfo?.DESCRIPTION || `Periodo ${item.PERIOD_ID}`;
      periodMap.set(periodName, (periodMap.get(periodName) || 0) + 1);
    });

    const periodComparison = Array.from(periodMap.entries()).map(([label, count]) => ({
      label,
      count
    }));

    res.json({
      historicalTrend,
      periodComparison
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("[TrackingController] Error in getTrackingStats:", err);
    res.status(500).json({ error: err.message || "Error al obtener estadísticas de seguimiento" });
  }
};

export const deleteTracking = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = DatabaseManager.getInstance();

    const { error } = await db.getConnection()
      .from('t_professional_practices')
      .update({ STATUS: 0 })
      .eq('PROFESSIONAL_PRACTICE_ID', id);

    if (error) throw error;

    res.status(204).send();
  } catch (error: unknown) {
    const err = error as Error;
    console.error("[TrackingController] Error in deleteTracking:", err);
    res.status(500).json({ error: err.message || "Error al eliminar seguimiento" });
  }
};
