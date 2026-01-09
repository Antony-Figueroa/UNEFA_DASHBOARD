/**
 * @file useEnrollment.tsx
 * @description Hook para la gestión de inscripciones en modo demostración.
 */

import { useState, useEffect, useCallback } from "react";
import { Enrollment } from "../types";
import * as enrollmentService from "../services/enrollmentService";
import { useToast } from "../../../context/toast";
import { RecordDetails } from "../../../components/ui/alert/AlertContextualContent";

type Status = "loading" | "success" | "error";

const ENROLLMENT_LABELS: Record<string, string> = {
  studentName: "Estudiante",
  identificationNumber: "Cédula",
  academicTutorName: "Tutor Académico",
  methodologicalTutorName: "Tutor Metodológico",
  institutionName: "Institución",
  institutionResponsibleName: "Responsable",
  practiceType: "Tipo Práctica",
  period: "Período",
};

export const useEnrollment = () => {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
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

  const refreshEnrollments = useCallback(async () => {
    setStatus("loading");
    try {
      const data = await enrollmentService.getEnrollments();
      setEnrollments(data);
      setStatus("success");
    } catch (e) {
      console.error("Error loading enrollments:", e);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    refreshEnrollments();
  }, [refreshEnrollments]);

  const addEnrollment = async (data: Omit<Enrollment, "enrollmentId" | "enrollmentDate">) => {
    setLoadingAction(true);
    try {
      const newEntry = await enrollmentService.createEnrollment(data);
      setEnrollments(prev => [newEntry, ...prev]);
      
      addToast({
        variant: "success",
        category: "ESTUDIANTE",
        title: "Inscripción Registrada",
        message: (
          <>
            <p>La inscripción de <strong>{newEntry.studentName}</strong> ha sido registrada correctamente.</p>
            <RecordDetails
              data={newEntry as unknown as Record<string, unknown>}
              labels={ENROLLMENT_LABELS}
              fields={['identificationNumber', 'academicTutorName', 'institutionName']}
            />
          </>
        ),
      });
    } catch (e) {
      console.error(e);
      addToast({ variant: "error", title: "Error", message: "No se pudo registrar la inscripción." });
    } finally {
      setLoadingAction(false);
    }
  };

  const editEnrollment = async (data: Enrollment) => {
    setLoadingAction(true);
    try {
      const updatedEntry = await enrollmentService.updateEnrollment(data);
      setEnrollments(prev => prev.map(p => p.enrollmentId === data.enrollmentId ? updatedEntry : p));
      
      addToast({
        variant: "success",
        category: "ESTUDIANTE",
        title: "Inscripción Actualizada",
        message: <p>Los datos de <strong>{data.studentName}</strong> han sido actualizados.</p>,
      });
    } catch (e) {
      console.error(e);
      addToast({ variant: "error", title: "Error", message: "No se pudo actualizar la inscripción." });
    } finally {
      setLoadingAction(false);
    }
  };

  const toggleStatus = async (item: Enrollment) => {
    setLoadingAction(true);
    try {
      const updatedItem = { ...item, status: !item.status };
      const goingInactive = item.status === true;

      await enrollmentService.updateEnrollment(updatedItem);
      setEnrollments(prev => prev.map(p => p.enrollmentId === item.enrollmentId ? updatedItem : p));
      
      addToast({
        variant: goingInactive ? "warning" : "success",
        category: "ESTUDIANTE",
        title: goingInactive ? "Estudiante Inactivado" : "Estudiante Restaurado",
        message: (
          <div className="space-y-1">
            <p>
              El estudiante <strong>{item.studentName}</strong> ahora está{" "}
              <span className={`font-bold ${goingInactive ? 'text-warning-600' : 'text-success-600'}`}>
                {goingInactive ? 'INACTIVO' : 'ACTIVO'}
              </span>.
            </p>
            <p className="text-xs italic">
              {goingInactive 
                ? "* El estudiante no aparecerá en las listas de asistencia actuales."
                : "* El registro ha sido recuperado con todos sus datos previos."
              }
            </p>
          </div>
        ),
        onUndo: async () => {
          setLoadingAction(true);
          try {
            await enrollmentService.updateEnrollment(item);
            setEnrollments(prev => prev.map(p => p.enrollmentId === item.enrollmentId ? item : p));
            addToast({
              variant: "info",
              title: "Acción Deshecha",
              message: `Se ha restablecido el estado original de ${item.studentName}.`,
            });
          } catch (e) {
            console.error(e);
            addToast({ variant: "error", title: "Error", message: "No se pudo deshacer la acción." });
          } finally {
            setLoadingAction(false);
          }
        }
      });
    } catch (e) {
      console.error(e);
      addToast({ variant: "error", title: "Error", message: "No se pudo cambiar el estado." });
    } finally {
      setLoadingAction(false);
    }
  };

  return {
    enrollments,
    status,
    loadingAction,
    addEnrollment,
    editEnrollment,
    toggleStatus,
    refreshEnrollments,
  };
};
