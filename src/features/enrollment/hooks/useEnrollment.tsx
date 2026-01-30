/**
 * @file useEnrollment.tsx
 * @description Hook for managing student enrollment state and operations.
 * Provides functions for adding, editing, and toggling the status of enrollments.
 */

import { useState, useEffect, useCallback } from "react";
import { Enrollment, CreateEnrollmentPayload, UpdateEnrollmentPayload } from "../types";
import * as enrollmentService from "../services/enrollmentService";
import { useToast } from "../../../context/toast";
import { RecordDetails } from "../../../components/ui/alert/AlertContextualContent";

/** Possible loading states for the enrollment feature */
type Status = "loading" | "success" | "error";

/** Display labels for enrollment record fields used in toast notifications */
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

/**
 * Custom hook to manage student enrollments.
 * 
 * @returns An object containing:
 * - `enrollments`: Array of current enrollment records.
 * - `status`: Current data fetching status.
 * - `loadingAction`: Boolean indicating if a mutation (add/edit/toggle) is in progress.
 * - `addEnrollment`: Function to create a new enrollment.
 * - `editEnrollment`: Function to update an existing enrollment.
 * - `toggleStatus`: Function to switch between active and inactive status.
 * - `refreshEnrollments`: Function to reload enrollment data.
 */
export const useEnrollment = () => {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [loadingAction, setLoadingAction] = useState(false);
  const { addToast } = useToast();

  /**
   * Fetches the latest enrollment records from the service.
   */
  const refreshEnrollments = useCallback(async () => {
    setStatus("loading");
    try {
      const data = await enrollmentService.getEnrollments();
      setEnrollments(data);
      setStatus("success");
    } catch (e) {
      console.error("[useEnrollment] Error loading enrollments:", e);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    refreshEnrollments();
  }, [refreshEnrollments]);

  /**
   * Safety timeout for long-running actions.
   */
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

  /**
   * Registers a new student enrollment.
   * @param data - The enrollment payload to create.
   */
  const addEnrollment = async (data: CreateEnrollmentPayload) => {
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
      console.error("[useEnrollment] Error adding enrollment:", e);
      addToast({ variant: "error", title: "Error", message: "No se pudo registrar la inscripción." });
    } finally {
      setLoadingAction(false);
    }
  };

  /**
   * Updates an existing student enrollment record.
   * @param data - The updated enrollment data.
   */
  const editEnrollment = async (data: UpdateEnrollmentPayload) => {
    setLoadingAction(true);
    try {
      const updatedEntry = await enrollmentService.updateEnrollment(data);
      setEnrollments(prev => prev.map(p => p.enrollmentId === data.enrollmentId ? updatedEntry : p));
      
      addToast({
        variant: "success",
        category: "ESTUDIANTE",
        title: "Inscripción Actualizada",
        message: <p>Los datos de <strong>{updatedEntry.studentName}</strong> han sido actualizados.</p>,
      });
    } catch (e) {
      console.error("[useEnrollment] Error editing enrollment:", e);
      addToast({ variant: "error", title: "Error", message: "No se pudo actualizar la inscripción." });
    } finally {
      setLoadingAction(false);
    }
  };

  /**
   * Toggles the active status of an enrollment record.
   * @param item - The enrollment record to toggle.
   */
  const toggleStatus = async (item: Enrollment) => {
    setLoadingAction(true);
    try {
      const newStatus = !item.status;
      const updatedItem = await enrollmentService.updateEnrollment({
        enrollmentId: item.enrollmentId,
        status: newStatus
      } as UpdateEnrollmentPayload);
      
      const goingInactive = item.status === true;

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
            const restoredItem = await enrollmentService.updateEnrollment({
              enrollmentId: item.enrollmentId,
              status: item.status
            } as UpdateEnrollmentPayload);
            
            setEnrollments(prev => prev.map(p => p.enrollmentId === item.enrollmentId ? restoredItem : p));
            addToast({
              variant: "info",
              title: "Acción Deshecha",
              message: `Se ha restablecido el estado original de ${item.studentName}.`,
            });
          } catch (e) {
            console.error("[useEnrollment] Error undoing status toggle:", e);
            addToast({ variant: "error", title: "Error", message: "No se pudo deshacer la acción." });
          } finally {
            setLoadingAction(false);
          }
        }
      });
    } catch (e) {
      console.error("[useEnrollment] Error toggling status:", e);
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
