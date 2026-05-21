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
  };
  t_career?: {
    CAREER_ID: number;
    CAREER_NAME: string;
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
  careerName: p.t_career?.CAREER_NAME || null
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
          SURNAME
        ),
        t_career:CAREER_ID (
          CAREER_ID,
          CAREER_NAME
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
      CAREER_NAME: p.t_career?.CAREER_NAME || null
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
          SURNAME
        ),
        t_career:CAREER_ID (
          CAREER_ID,
          CAREER_NAME
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

    // 1. Historical trend (last 6 months — grouped by day)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const { data: trendData, error: trendError } = await supabase
      .from('t_professional_practices')
      .select(`
        CREATION_DATE,
        t_students:STUDENTS_ID (
          STUDENTS_CI,
          NAME,
          SURNAME
        )
      `)
      .gte('CREATION_DATE', sixMonthsAgo.toISOString())
      .order('CREATION_DATE', { ascending: true });

    if (trendError) throw trendError;

    // Group by day (YYYY-MM-DD) with student details
    const dayMap = new Map<string, { count: number; students: { name: string; ci: string }[] }>();
    trendData?.forEach((item: any) => {
      const date = new Date(item.CREATION_DATE);
      const dayKey = date.toISOString().split('T')[0];
      
      const student = item.t_students;
      const studentCi = student?.STUDENTS_CI || 'Desconocido';
      const studentName = student ? `${(student.NAME || '').trim()} ${(student.SURNAME || '').trim()}`.trim() : studentCi;
      
      if (!dayMap.has(dayKey)) {
        dayMap.set(dayKey, { count: 0, students: [] });
      }
      const entry = dayMap.get(dayKey)!;
      entry.count += 1;
      entry.students.push({ name: studentName, ci: studentCi });
    });

    const historicalTrend = Array.from(dayMap.entries()).map(([date, data]) => ({
      date,
      count: data.count,
      students: data.students
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

    res.json({ message: "Seguimiento eliminado exitosamente" });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("[TrackingController] Error in deleteTracking:", err);
    res.status(500).json({ error: err.message || "Error al eliminar seguimiento" });
  }
};

export const getTrackingById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = DatabaseManager.getInstance();

    console.log("[TrackingController] Querying for PROFESSIONAL_PRACTICE_ID:", id);
    
    // Query con JOIN correcto a través de t_professional_practices_tutor para tutor académico
    const { data, error } = await db.getConnection()
      .from('t_professional_practices')
      .select(`
        *,
        t_students:STUDENTS_ID (
          STUDENTS_CI,
          NAME,
          SURNAME
        ),
        t_career:CAREER_ID (
          CAREER_ID,
          CAREER_NAME
        ),
        t_institution:INSTITUTION_ID (
          INSTITUTION_ID,
          INSTITUTION_NAME
        ),
        t_internships_period:PERIOD_ID (
          PERIOD_ID,
          START_DATE,
          END_DATE
        ),
        t_professional_practices_tutor (
          TUTOR_ID,
          TUTOR_TYPE,
          t_tutors (
            NAME,
            SURNAME
          )
        )
      `)
      .eq('PROFESSIONAL_PRACTICE_ID', id)
      .eq('STATUS', 1)
      .single();

    console.log("[TrackingController] Query result - data:", !!data, "error:", error);
    if (data) {
      console.log("[TrackingController] Found practice:", data.PROFESSIONAL_PRACTICE_ID);
    }

    if (error) {
      console.log("[TrackingController] DB Error:", JSON.stringify(error));
      return res.status(500).json({ error: "Error de base de datos: " + error.message });
    }
    
    if (!data) {
      console.log("[TrackingController] No data found - returning 404");
      return res.status(404).json({ error: "Seguimiento no encontrado" });
    }

    const practice = data as any;
    const student = practice.t_students || {};
    const career = practice.t_career || {};
    const institution = practice.t_institution || {};
    const period = practice.t_internships_period || {};
    
    // Construir arreglo completo de tutores asignados (con ID, nombre y tipo)
    const assignedTutors: { tutorId: number; tutorName: string; tutorType: string }[] = [];
    
    if (practice.t_professional_practices_tutor && practice.t_professional_practices_tutor.length > 0) {
      practice.t_professional_practices_tutor.forEach((t: any) => {
        if (t.TUTOR_ID) {
          assignedTutors.push({
            tutorId: t.TUTOR_ID,
            tutorName: `${t.t_tutors?.NAME || ""} ${t.t_tutors?.SURNAME || ""}`.trim(),
            tutorType: t.TUTOR_TYPE === 'METODOLOGICO' || t.TUTOR_TYPE === 'METODOLÓGICO' ? 'METODOLOGICO' : 'ACADEMICO'
          });
        }
      });
    }

    // Buscar tutor académico (backwards compatibility)
    const academicTutorData = assignedTutors.find(t => t.tutorType === 'ACADEMICO') || assignedTutors[0] || null;
    const methodologicalTutorData = assignedTutors.find(t => t.tutorType === 'METODOLOGICO') || null;
    const tutorName = academicTutorData?.tutorName || "";
    const tutorMethodologicalName = methodologicalTutorData?.tutorName || "";

    res.json({
      success: true,
      data: {
        trackingId: String(practice.PROFESSIONAL_PRACTICE_ID),
        studentIdNumber: student.STUDENTS_CI || "",
        studentName: `${student.NAME || ""} ${student.SURNAME || ""}`.trim(),
        careerName: career.CAREER_NAME || null,
        institutionName: institution.INSTITUTION_NAME || "",
        tutorName: tutorName,
        tutorMethodologicalName: tutorMethodologicalName,
        assignedTutors: assignedTutors,
        periodStartDate: period.START_DATE || null,
        periodEndDate: period.END_DATE || null,
        reportTitle: practice.REPORT_TITLE || "",
        transfer: practice.TRANSFER === 1,
        route: practice.TOUR || "",
        observations: practice.OBSERVATION || "",
        status: practice.STATUS === 1,
        creationDate: new Date(practice.CREATION_DATE),
        startDate: practice.START_DATE || null,
        endDate: practice.END_DATE || null
      }
    });
  } catch (error: unknown) {
    const err = error as Error;
    console.error("[TrackingController] Error in getTrackingById:", err);
    res.status(500).json({ error: err.message || "Error al obtener seguimiento" });
  }
};
