/**
 * @file usePreEnrollment.tsx
 * @description Hook para la gestión de pre-inscripciones en modo demostración.
 */

import { useState, useEffect, useCallback } from "react";
import { PreEnrollment } from "../types";
import * as preEnrollmentService from "../services/preEnrollmentService";
import { useToast } from "../../../context/toast";
import { RecordDetails } from "../../../components/ui/alert/AlertContextualContent";

type Status = "loading" | "success" | "error";

const PRE_ENROLLMENT_LABELS: Record<string, string> = {
  studentName: "Estudiante",
  identificationNumber: "Cédula",
  period: "Período",
  practiceType: "Tipo Práctica",
  enrollmentCode: "Matrícula",
  phone: "Teléfono",
};

export const usePreEnrollment = () => {
  const [preEnrollments, setPreEnrollments] = useState<PreEnrollment[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [loadingAction, setLoadingAction] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    if (loadingAction) {
      timeoutId = setTimeout(() => {
        setLoadingAction(false);
      }, 30000);
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [loadingAction]);

  const refreshPreEnrollments = useCallback(async () => {
    setStatus("loading");
    try {
      const data = await preEnrollmentService.getPreEnrollments();
      setPreEnrollments(data);
      setStatus("success");
    } catch (e) {
      console.error("Error loading pre-enrollments:", e);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    refreshPreEnrollments();
  }, [refreshPreEnrollments]);

  const addPreEnrollment = async (data: Omit<PreEnrollment, "preEnrollmentId" | "preEnrollmentDate">) => {
    setLoadingAction(true);
    await new Promise(resolve => setTimeout(resolve, 800));

    const newEntry: PreEnrollment = {
      ...data,
      preEnrollmentId: Math.random().toString(36).substr(2, 9),
      preEnrollmentDate: new Date(),
    };

    setPreEnrollments(prev => [newEntry, ...prev]);
    setLoadingAction(false);

    addToast({
      variant: "success",
      title: "Pre-Inscripción Registrada",
      message: (
        <>
          <p>La pre-inscripción de <strong>{newEntry.studentName}</strong> ha sido registrada correctamente.</p>
          <RecordDetails
            data={newEntry as unknown as Record<string, unknown>}
            labels={PRE_ENROLLMENT_LABELS}
            fields={['identificationNumber', 'period', 'enrollmentCode']}
          />
        </>
      ),
    });
  };

  const editPreEnrollment = async (data: PreEnrollment) => {
    setLoadingAction(true);
    await new Promise(resolve => setTimeout(resolve, 800));

    setPreEnrollments(prev => prev.map(p => p.preEnrollmentId === data.preEnrollmentId ? data : p));
    setLoadingAction(false);

    addToast({
      variant: "success",
      title: "Pre-Inscripción Actualizada",
      message: <p>Los datos de <strong>{data.studentName}</strong> han sido actualizados.</p>,
    });
  };

  const toggleStatus = async (item: PreEnrollment) => {
    setLoadingAction(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    const updated = { ...item, status: !item.status };
    setPreEnrollments(prev => prev.map(p => p.preEnrollmentId === item.preEnrollmentId ? updated : p));
    setLoadingAction(false);

    addToast({
      variant: updated.status ? "success" : "warning",
      title: updated.status ? "Pre-Inscripción Restaurada" : "Pre-Inscripción Desactivada",
      message: (
        <p>
          La pre-inscripción de <strong>{item.studentName}</strong> ahora está{" "}
          <span className={`font-bold ${updated.status ? "text-success-600" : "text-warning-600"}`}>
            {updated.status ? "ACTIVA" : "INACTIVA"}
          </span>.
        </p>
      ),
    });
  };


  return {
    preEnrollments,
    status,
    loadingAction,
    addPreEnrollment,
    editPreEnrollment,
    toggleStatus,
    refreshPreEnrollments,
  };
};
