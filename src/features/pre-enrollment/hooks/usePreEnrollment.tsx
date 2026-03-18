/**
 * @file usePreEnrollment.tsx
 * @description Hook personalizado para la gestión del estado y lógica de negocio de Pre-Inscripciones.
 * Proporciona métodos para listar, crear, editar y eliminar pre-inscripciones con notificaciones integradas.
 */

import { PreEnrollment, CreatePreEnrollmentPayload, UpdatePreEnrollmentPayload } from "../types";
import { preEnrollmentService } from "../services/preEnrollmentService";
import { useToast } from "../../../context/toast";
import { RecordDetails } from "../../../components/ui/alert/AlertContextualContent";
import { useCrud } from "../../../hooks/useCrud";

/** Etiquetas legibles para los campos de pre-inscripción en notificaciones */
const PRE_ENROLLMENT_LABELS: Record<string, string> = {
  studentName: "Estudiante",
  identificationNumber: "Cédula",
  period: "Período",
  practiceType: "Tipo Práctica",
  enrollmentCode: "Matrícula",
  phone: "Teléfono",
};

/**
 * Hook para manejar la lógica de pre-inscripciones.
 * 
 * @returns Un objeto con el estado de las pre-inscripciones y funciones para manipularlas.
 */
export const usePreEnrollment = () => {
  const { addToast } = useToast();

  const {
    data: preEnrollments,
    status,
    loadingAction,
    error,
    refresh: refreshPreEnrollments,
    createItem: baseAddPreEnrollment,
    updateItem: baseEditPreEnrollment,
    toggleItemStatus: baseToggleStatus,
    bulkDelete: baseBulkDelete,
    bulkRestore: baseBulkRestore
  } = useCrud<PreEnrollment, CreatePreEnrollmentPayload, UpdatePreEnrollmentPayload>(preEnrollmentService, {
    resourceName: "Pre-Inscripción",
    idField: "preEnrollmentId",
  });

  /**
   * Registra una nueva pre-inscripción.
   * 
   * @param payload - Datos de la pre-inscripción a crear.
   */
  const addPreEnrollment = async (payload: CreatePreEnrollmentPayload) => {
    try {
      const newPreEnrollment = await baseAddPreEnrollment(payload, { silent: true });
      
      if (newPreEnrollment) {
        addToast({
          variant: "success",
          title: "Pre-Inscripción Registrada",
          message: (
            <>
              <p>La pre-inscripción de <strong>{newPreEnrollment.studentName}</strong> ha sido registrada exitosamente.</p>
              <RecordDetails
                data={newPreEnrollment as unknown as Record<string, unknown>}
                labels={PRE_ENROLLMENT_LABELS}
                fields={['identificationNumber', 'period', 'enrollmentCode']}
              />
            </>
          ),
        });
      }
    } catch (error: any) {
      if (!error.response || error.response.status >= 500) {
        console.error("[usePreEnrollment] Error crítico al crear pre-inscripción:", error);
      }
      const backendMessage = error.response?.data?.message || "No se pudo registrar la pre-inscripción en el sistema.";
      addToast({
        variant: "error",
        title: "Error de Registro",
        message: backendMessage,
      });
      throw error;
    }
  };

  /**
   * Actualiza los datos de una pre-inscripción existente.
   * 
   * @param payload - Datos a actualizar incluyendo el ID.
   */
  const editPreEnrollment = async (payload: UpdatePreEnrollmentPayload) => {
    try {
      const updatedPreEnrollment = await baseEditPreEnrollment(payload, { silent: true });

      if (updatedPreEnrollment) {
        addToast({
          variant: "success",
          title: "Pre-Inscripción Actualizada",
          message: <p>Los datos de <strong>{updatedPreEnrollment.studentName || "el estudiante"}</strong> han sido actualizados exitosamente.</p>,
        });
      }
    } catch (error: any) {
      if (!error.response || error.response.status >= 500) {
        console.error(`[usePreEnrollment] Error crítico al editar pre-inscripción:`, error);
      }
      const backendMessage = error.response?.data?.message || "No se pudieron actualizar los datos de la pre-inscripción.";
      addToast({
        variant: "error",
        title: "Error de Actualización",
        message: backendMessage,
      });
      throw error;
    }
  };

  /**
   * Cambia el estado (activo/inactivo) de una pre-inscripción.
   * 
   * @param preEnrollment - La pre-inscripción a la cual cambiar el estado.
   */
  const toggleStatus = async (preEnrollment: PreEnrollment) => {
    try {
      const newStatus = !preEnrollment.status;
      await baseToggleStatus(preEnrollment.preEnrollmentId, newStatus, { silent: true });

      addToast({
        variant: "success",
        title: newStatus ? "Pre-Inscripción Activada" : "Pre-Inscripción Desactivada",
        message: (
          <p>
            La pre-inscripción de <strong>{preEnrollment.studentName}</strong> ha sido{" "}
            {newStatus ? "activada" : "desactivada"} exitosamente.
          </p>
        ),
      });
    } catch (error) {
      console.error(`[usePreEnrollment] Error al cambiar estado:`, error);
      addToast({
        variant: "error",
        title: "Error de Estado",
        message: "No se pudo cambiar el estado de la pre-inscripción.",
      });
    }
  };

  /**
   * Cambia el estado en lote de varias pre-inscripciones.
   * 
   * @param ids - Array de IDs de pre-inscripciones.
   * @param newStatus - Nuevo estado a aplicar.
   */
  const bulkToggleStatus = async (ids: string[], newStatus: boolean) => {
    try {
      if (newStatus) {
        await baseBulkRestore(ids, { silent: true });
      } else {
        await baseBulkDelete(ids, { silent: true });
      }

      addToast({
        variant: "success",
        title: "Acción Masiva",
        message: `Se han ${newStatus ? "activado" : "desactivado"} ${ids.length} registros exitosamente.`,
      });
    } catch (error) {
      console.error("[usePreEnrollment] Error en operación por lote:", error);
      addToast({
        variant: "error",
        title: "Error Masivo",
        message: "No se pudieron actualizar los registros seleccionados.",
      });
    }
  };

  return {
    preEnrollments,
    status,
    loadingAction,
    error,
    addPreEnrollment,
    editPreEnrollment,
    toggleStatus,
    bulkToggleStatus,
    refreshPreEnrollments,
  };
};
