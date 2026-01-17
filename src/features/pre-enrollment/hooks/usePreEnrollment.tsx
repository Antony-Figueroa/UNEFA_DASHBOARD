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
    try {
      await preEnrollmentService.createPreEnrollment(data);
      
      addToast({
        variant: "success",
        title: "Pre-Inscripción Registrada",
        message: (
          <>
            <p>La pre-inscripción de <strong>{data.studentName}</strong> ha sido registrada correctamente.</p>
            <RecordDetails
              data={data as unknown as Record<string, unknown>}
              labels={PRE_ENROLLMENT_LABELS}
              fields={['identificationNumber', 'period', 'enrollmentCode']}
            />
          </>
        ),
      });

      // Refrescar la lista para mostrar los datos actualizados
      await refreshPreEnrollments();
    } catch (error) {
      console.error("Error creating pre-enrollment:", error);
      addToast({
        variant: "error",
        title: "Error al Registrar",
        message: "No se pudo registrar la pre-inscripción. Intente nuevamente.",
      });
      throw error;
    } finally {
      setLoadingAction(false);
    }
  };

  const editPreEnrollment = async (data: PreEnrollment) => {
    setLoadingAction(true);
    try {
      await preEnrollmentService.updatePreEnrollment(data);

      addToast({
        variant: "success",
        title: "Pre-Inscripción Actualizada",
        message: <p>Los datos de <strong>{data.studentName}</strong> han sido actualizados.</p>,
      });

      // Refrescar la lista para mostrar los datos actualizados
      await refreshPreEnrollments();
    } catch (error) {
      console.error("Error updating pre-enrollment:", error);
      addToast({
        variant: "error",
        title: "Error al Actualizar",
        message: "No se pudo actualizar la pre-inscripción. Intente nuevamente.",
      });
      throw error;
    } finally {
      setLoadingAction(false);
    }
  };

  const toggleStatus = async (item: PreEnrollment) => {
    setLoadingAction(true);
    try {
      const updated = { ...item, status: !item.status };
      await preEnrollmentService.updatePreEnrollment(updated);

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

      // Refrescar la lista para mostrar los datos actualizados
      await refreshPreEnrollments();
    } catch (error) {
      console.error("Error toggling pre-enrollment status:", error);
      addToast({
        variant: "error",
        title: "Error al Cambiar Estado",
        message: "No se pudo cambiar el estado de la pre-inscripción. Intente nuevamente.",
      });
      throw error;
    } finally {
      setLoadingAction(false);
    }
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
