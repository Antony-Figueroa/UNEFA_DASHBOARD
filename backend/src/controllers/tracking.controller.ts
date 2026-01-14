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
    STUDENT_CI: string;
    NAME: string;
    SURNAME: string;
  }
}

const mapDBToFrontend = (p: DBProfessionalPractice) => ({
  trackingId: String(p.PROFESSIONAL_PRACTICE_ID),
  studentIdNumber: p.STUDENT_CI,
  studentName: `${p.STUDENT_NAME} ${p.STUDENT_SURNAME}`,
  reportTitle: p.REPORT_TITLE,
  transfer: p.TRANSFER === 1,
  route: p.TOUR,
  observations: p.OBSERVATION,
  status: p.STATUS === 1,
  creationDate: new Date(p.CREATION_DATE)
});

export const getTrackings = async (_req: Request, res: Response) => {
  try {
    const db = DatabaseManager.getInstance();
    const { data, error } = await db.getConnection()
      .from('t_professional_practices')
      .select(`
        *,
        t_students:STUDENTS_ID (
          STUDENT_CI,
          NAME,
          SURNAME
        )
      `)
      .eq('STATUS', 1);

    if (error) throw error;

    const formattedData = (data as unknown as DBTrackingResponse[]).map(p => ({
      ...p,
      STUDENT_CI: p.t_students?.STUDENT_CI || "",
      STUDENT_NAME: p.t_students?.NAME || "",
      STUDENT_SURNAME: p.t_students?.SURNAME || ""
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
      .select('STUDENT_ID')
      .eq('STUDENT_CI', studentIdNumber)
      .single();

    if (studentError || !student) {
      return res.status(404).json({ error: "Estudiante no encontrado" });
    }

    const newPractice = {
      STUDENTS_ID: student.STUDENT_ID,
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
      INTERSHIP_STATUS: 1,
      INTERNSHIP_TYPE_ID: 1
    };

    const { data, error } = await db.getConnection()
      .from('t_professional_practices')
      .insert([newPractice])
      .select(`
        *,
        t_students:STUDENTS_ID (
          STUDENT_CI,
          NAME,
          SURNAME
        )
      `)
      .single();

    if (error) throw error;

    const p = data as unknown as DBTrackingResponse;
    const formatted = mapDBToFrontend({
      ...p,
      STUDENT_CI: p.t_students?.STUDENT_CI || "",
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
    const { reportTitle, transfer, route, observations, status } = req.body;

    const updateData = {
      REPORT_TITLE: reportTitle,
      TRANSFER: transfer ? 1 : 0,
      TOUR: route,
      OBSERVATION: observations,
      STATUS: status ? 1 : 0
    };

    const { data, error } = await db.getConnection()
      .from('t_professional_practices')
      .update(updateData)
      .eq('PROFESSIONAL_PRACTICE_ID', id)
      .select(`
        *,
        t_students:STUDENTS_ID (
          STUDENT_CI,
          NAME,
          SURNAME
        )
      `)
      .single();

    if (error) throw error;

    const p = data as unknown as DBTrackingResponse;
    const formatted = mapDBToFrontend({
      ...p,
      STUDENT_CI: p.t_students?.STUDENT_CI || "",
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
