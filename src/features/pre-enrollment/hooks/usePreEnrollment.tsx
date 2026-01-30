/**
 * @file usePreEnrollment.tsx
 * @description Hook personalizado para la gestión del estado y lógica de negocio de Pre-Inscripciones.
 * Proporciona métodos para listar, crear, editar y eliminar pre-inscripciones con notificaciones integradas.
 */

import { useState, useEffect, useCallback } from "react";
import { PreEnrollment, CreatePreEnrollmentPayload, UpdatePreEnrollmentPayload } from "../types";
import * as preEnrollmentService from "../services/preEnrollmentService";
import { useToast } from "../../../context/toast";
import { RecordDetails } from "../../../components/ui/alert/AlertContextualContent";

/** Estados posibles de la carga de datos inicial */
type Status = "loading" | "success" | "error";

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
  const [preEnrollments, setPreEnrollments] = useState<PreEnrollment[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [loadingAction, setLoadingAction] = useState(false);
  const { addToast } = useToast();

  /**
   * Limpia el estado de carga de acción después de un tiempo de espera (30s)
   * para evitar bloqueos infinitos de la UI si una petición falla silenciosamente.
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
   * Carga o refresca la lista de pre-inscripciones desde el servicio.
   */
  const refreshPreEnrollments = useCallback(async () => {
    setStatus("loading");
    try {
      const data = await preEnrollmentService.getPreEnrollments();
      setPreEnrollments(data);
      setStatus("success");
    } catch (e) {
      console.error("[usePreEnrollment] Error al cargar pre-inscripciones:", e);
      setStatus("error");
    }
  }, []);

  /** Carga inicial al montar el hook */
  useEffect(() => {
    refreshPreEnrollments();
  }, [refreshPreEnrollments]);

  /**
   * Registra una nueva pre-inscripción.
   * 
   * @param payload - Datos de la pre-inscripción a crear.
   */
  const addPreEnrollment = async (payload: CreatePreEnrollmentPayload) => {
    setLoadingAction(true);
    try {
      await preEnrollmentService.createPreEnrollment(payload);
      
      addToast({
        variant: "success",
        title: "Pre-Inscripción Registrada",
        message: (
          <>
            <p>La pre-inscripción de <strong>{payload.studentName}</strong> ha sido registrada correctamente.</p>
            <RecordDetails
              data={payload as unknown as Record<string, unknown>}
              labels={PRE_ENROLLMENT_LABELS}
              fields={['identificationNumber', 'period', 'enrollmentCode']}
            />
          </>
        ),
      });

      await refreshPreEnrollments();
    } catch (error) {
      console.error("[usePreEnrollment] Error al crear pre-inscripción:", error);
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

  /**
   * Actualiza los datos de una pre-inscripción existente.
   * 
   * @param payload - Datos a actualizar incluyendo el ID.
   */
  const editPreEnrollment = async (payload: UpdatePreEnrollmentPayload) => {
    setLoadingAction(true);
    try {
      await preEnrollmentService.updatePreEnrollment(payload);

      addToast({
        variant: "success",
        title: "Pre-Inscripción Actualizada",
        message: <p>Los datos de <strong>{payload.studentName || "el estudiante"}</strong> han sido actualizados.</p>,
      });

      await refreshPreEnrollments();
    } catch (error) {
      console.error(`[usePreEnrollment] Error al editar pre-inscripción ${payload.preEnrollmentId}:`, error);
      addToast({
        variant: "error",
        title: "Error al Actualizar",
        message: "Hubo un problema al actualizar los datos. Intente nuevamente.",
      });
      throw error;
    } finally {
      setLoadingAction(false);
    }
  };

  /**
   * Cambia el estado (activo/inactivo) de una pre-inscripción.
   * 
   * @param preEnrollment - La pre-inscripción a la cual cambiar el estado.
   */
  const toggleStatus = async (preEnrollment: PreEnrollment) => {
    setLoadingAction(true);
    try {
      const newStatus = !preEnrollment.status;
      await preEnrollmentService.updatePreEnrollment({
        preEnrollmentId: preEnrollment.preEnrollmentId,
        status: newStatus,
      });

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

      await refreshPreEnrollments();
    } catch (error) {
      console.error(`[usePreEnrollment] Error al cambiar estado de ${preEnrollment.preEnrollmentId}:`, error);
      addToast({
        variant: "error",
        title: "Error de Estado",
        message: "No se pudo cambiar el estado de la pre-inscripción.",
      });
    } finally {
      setLoadingAction(false);
    }
  };

  /**
   * Cambia el estado en lote de varias pre-inscripciones.
   * 
   * @param ids - Array de IDs de pre-inscripciones.
   * @param newStatus - Nuevo estado a aplicar.
   */
  const bulkToggleStatus = async (ids: string[], newStatus: boolean) => {
    setLoadingAction(true);
    try {
      // Si el servicio no tiene bulk, lo hacemos secuencialmente por ahora
      // O podemos añadirlo al servicio si es necesario.
      await Promise.all(ids.map(id => 
        preEnrollmentService.updatePreEnrollment({
          preEnrollmentId: id,
          status: newStatus
        })
      ));

      addToast({
        variant: "success",
        title: newStatus ? "Activación en Lote" : "Desactivación en Lote",
        message: `Se han ${newStatus ? "activado" : "desactivado"} ${ids.length} registros correctamente.`,
      });

      await refreshPreEnrollments();
    } catch (error) {
      console.error("[usePreEnrollment] Error en operación por lote:", error);
      addToast({
        variant: "error",
        title: "Error en Lote",
        message: "No se pudieron actualizar algunos registros.",
      });
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
    bulkToggleStatus,
    refreshPreEnrollments,
  };
};
