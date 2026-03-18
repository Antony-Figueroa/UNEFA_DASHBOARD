/**
 * @file useEnrollment.tsx
 * @description Hook for managing student enrollment state and operations.
 * Provides functions for adding, editing, and toggling the status of enrollments.
 */

import { Enrollment, CreateEnrollmentPayload, UpdateEnrollmentPayload } from "../types";
import * as enrollmentService from "../services/enrollmentService";
import { useToast } from "../../../context/toast";
import { RecordDetails } from "../../../components/ui/alert/AlertContextualContent";
import { useCrud } from "../../../hooks/useCrud";

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
 * @returns An object containing enrollment state and actions.
 */
export const useEnrollment = () => {
  const { addToast } = useToast();

  const {
    data: enrollments,
    status,
    loadingAction,
    refresh: refreshEnrollments,
    createItem: baseAddEnrollment,
    updateItem: baseEditEnrollment,
  } = useCrud<Enrollment, CreateEnrollmentPayload, UpdateEnrollmentPayload>(enrollmentService as any, {
    resourceName: "Inscripción",
    idField: "enrollmentId",
  });

  /**
   * Registers a new student enrollment.
   * @param data - The enrollment payload to create.
   */
  const addEnrollment = async (data: CreateEnrollmentPayload) => {
    try {
      const newEntry = await baseAddEnrollment(data, { silent: true });
      
      if (newEntry) {
        addToast({
          variant: "success",
          category: "ESTUDIANTE",
          title: "Inscripción Registrada",
          message: (
            <>
              <p>La inscripción de <strong>{newEntry.studentName}</strong> ha sido registrada exitosamente.</p>
              <RecordDetails
                data={newEntry as unknown as Record<string, unknown>}
                labels={ENROLLMENT_LABELS}
                fields={['identificationNumber', 'academicTutorName', 'institutionName']}
              />
            </>
          ),
        });
      }
    } catch (e) {
      const axiosError = e as any;
      if (!axiosError.response || axiosError.response.status >= 500) {
        console.error("[useEnrollment] Error crítico al inscribir:", e);
      }
      addToast({ 
        variant: "error", 
        title: "Error de Registro", 
        message: axiosError.response?.data?.message || axiosError.message || "No se pudo registrar la inscripción." 
      });
    }
  };

  /**
   * Updates an existing student enrollment record.
   * @param data - The updated enrollment data.
   */
  const editEnrollment = async (data: UpdateEnrollmentPayload) => {
    try {
      const updatedEntry = await baseEditEnrollment(data, { silent: true });
      
      if (updatedEntry) {
        addToast({
          variant: "success",
          category: "ESTUDIANTE",
          title: "Inscripción Actualizada",
          message: <p>Los datos de <strong>{updatedEntry.studentName}</strong> han sido actualizados exitosamente.</p>,
        });
      }
    } catch (e) {
      const axiosError = e as any;
      if (!axiosError.response || axiosError.response.status >= 500) {
        console.error("[useEnrollment] Error crítico al editar inscripción:", e);
      }
      addToast({ 
        variant: "error", 
        title: "Error de Actualización", 
        message: axiosError.response?.data?.message || axiosError.message || "No se pudo actualizar la inscripción." 
      });
    }
  };

  /**
   * Toggles the active status of an enrollment record.
   * @param item - The enrollment record to toggle.
   */
  const toggleStatus = async (item: Enrollment) => {
    try {
      const newStatus = !item.status;
      const updatedItem = await baseEditEnrollment({
        enrollmentId: item.enrollmentId,
        status: newStatus
      } as UpdateEnrollmentPayload, { silent: true });
      
      if (updatedItem) {
        const goingInactive = item.status === true;

        addToast({
          variant: goingInactive ? "warning" : "success",
          category: "ESTUDIANTE",
          title: goingInactive ? "Inscripción Inactivada" : "Inscripción Restaurada",
          message: (
            <div className="space-y-1">
              <p>
                La inscripción de <strong>{item.studentName}</strong> ahora está{" "}
                <span className={`font-bold ${goingInactive ? 'text-warning-600' : 'text-success-600'}`}>
                  {goingInactive ? 'INACTIVA' : 'ACTIVA'}
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
            try {
              await baseEditEnrollment({
                enrollmentId: item.enrollmentId,
                status: item.status
              } as UpdateEnrollmentPayload, { silent: true });
              
              addToast({
                variant: "info",
                title: "Acción Deshecha",
                message: `Se ha restablecido el estado original de la inscripción de ${item.studentName}.`,
              });
            } catch (e) {
              console.error("[useEnrollment] Error undoing status toggle:", e);
              addToast({ variant: "error", title: "Error", message: "No se pudo deshacer la acción." });
            }
          }
        });
      }
    } catch (e) {
      console.error("[useEnrollment] Error toggling status:", e);
      addToast({ 
        variant: "error", 
        title: "Error de Estado", 
        message: "No se pudo cambiar el estado de la inscripción." 
      });
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
