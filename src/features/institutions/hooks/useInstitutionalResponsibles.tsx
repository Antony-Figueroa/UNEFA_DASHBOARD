/**
 * @fileoverview Custom hook for managing institutional responsibles state and operations.
 * Connects UI components with the responsibles service and manages global notifications.
 */

import { InstitutionalResponsible, CreateInstitutionalResponsiblePayload, UpdateInstitutionalResponsiblePayload } from "../types";
import { useToast } from "../../../context/toast";
import { ChangeComparison, RecordDetails } from "../../../components/ui/alert/AlertContextualContent";
import { responsibleService } from "../services/institutionalResponsiblesService";
import { useCrud } from "../../../hooks/useCrud";

/**
 * Labels for responsible person fields used in toast notifications and comparisons.
 */
const RESPONSIBLE_LABELS: Record<string, string> = {
  identificationPrefix: "Tipo de ID",
  identificationNumber: "Cédula / Rif",
  firstName: "Nombre",
  lastName: "Apellido",
  fullName: "Nombre Completo",
  phone: "Teléfono",
  email: "Correo Electrónico",
  institutionName: "Sede / Institución",
  cargo: "Cargo",
  status: "Estado",
};

/**
 * Hook to manage institutional responsibles.
 * Provides state for responsibles list, loading status, and actions for CRUD operations using the useCrud hook.
 * 
 * @returns An object containing the responsibles state and action functions.
 * 
 * @example
 * const { responsibles, addResponsible, editResponsible, toggleStatus } = useInstitutionalResponsibles();
 */
export const useInstitutionalResponsibles = () => {
  const { addToast } = useToast();

  const {
    data: responsibles,
    status,
    loadingAction,
    refresh: refreshResponsibles,
    createItem: baseAddResponsible,
    updateItem: baseEditResponsible,
    toggleItemStatus: baseToggleStatus,
    bulkDelete: baseBulkDelete,
    bulkRestore: baseBulkRestore
  } = useCrud<InstitutionalResponsible, CreateInstitutionalResponsiblePayload, UpdateInstitutionalResponsiblePayload>(responsibleService, {
    resourceName: "Responsable",
    idField: "responsibleId",
  });

  /**
   * Adds a new institutional responsible with custom notification.
   * @param respData - The payload for the new responsible person.
   */
  const addResponsible = async (respData: CreateInstitutionalResponsiblePayload) => {
    try {
      const newResp = await baseAddResponsible(respData, { silent: true });
      if (newResp) {
        const fullName = `${newResp.firstName} ${newResp.lastName}`;
        addToast({
          variant: "success",
          title: "Responsable Registrado",
          message: (
            <>
              <p>El responsable <strong>{fullName}</strong> ha sido registrado exitosamente.</p>
              <RecordDetails
                data={newResp as unknown as Record<string, unknown>}
                labels={RESPONSIBLE_LABELS}
                fields={['firstName', 'lastName', 'phone', 'email', 'institutionName']}
              />
            </>
          ),
        });
      }
    } catch (e) {
      console.error("[useInstitutionalResponsibles] Error adding responsible:", e);
      const axiosError = e as any;
      addToast({
        variant: "error",
        title: "Error de Registro",
        message: axiosError.response?.data?.message || axiosError.message || "No se pudo registrar el responsable.",
      });
      throw e;
    }
  };

  /**
   * Updates an existing institutional responsible with custom comparison notification.
   * @param respData - The partial data to update.
   */
  const editResponsible = async (respData: UpdateInstitutionalResponsiblePayload) => {
    try {
      const { responsibleId } = respData;
      const oldResp = responsibles.find(r => r.responsibleId === responsibleId);
      const updatedResp = await baseEditResponsible(respData, { silent: true });
      
      if (updatedResp) {
        const fullName = `${updatedResp.firstName} ${updatedResp.lastName}`;
        addToast({
          variant: "success",
          title: "Responsable Actualizado",
          message: (
            <>
              <p>Los datos de <strong>{fullName}</strong> han sido actualizados exitosamente.</p>
              {oldResp && <ChangeComparison 
                oldData={oldResp as unknown as Record<string, unknown>} 
                newData={updatedResp as unknown as Record<string, unknown>} 
                labels={RESPONSIBLE_LABELS} 
              />}
            </>
          ),
        });
      }
    } catch (e) {
      console.error("[useInstitutionalResponsibles] Error editing responsible:", e);
      const axiosError = e as any;
      addToast({
        variant: "error",
        title: "Error de Actualización",
        message: axiosError.response?.data?.message || axiosError.message || "No se pudo actualizar el responsable.",
      });
      throw e;
    }
  };

  /**
   * Toggles the status of a responsible person.
   * @param resp - The responsible person object.
   */
  const toggleStatus = async (resp: InstitutionalResponsible) => {
    const newStatus = !resp.status;
    try {
      await baseToggleStatus(resp.responsibleId, newStatus, { silent: true });
      const fullName = `${resp.firstName} ${resp.lastName}`;
      
      addToast({
        variant: newStatus ? "success" : "warning",
        title: "Estado Actualizado",
        message: `El responsable ${fullName} ahora está ${newStatus ? 'activo' : 'inactivo'} exitosamente.`,
      });
    } catch (e) {
      console.error("[useInstitutionalResponsibles] Error toggling status:", e);
      addToast({
        variant: "error",
        title: "Error de Estado",
        message: "No se pudo cambiar el estado del responsable.",
      });
    }
  };

  /**
   * Inactivates multiple responsibles in bulk.
   * @param ids - Array of responsible person IDs to inactivate.
   */
  const bulkRemoveResponsibles = async (ids: string[]) => {
    try {
      await baseBulkDelete(ids, { silent: true });
      
      addToast({
        variant: "warning",
        title: "Acción Masiva",
        message: `${ids.length} responsables han sido inactivados exitosamente.`,
      });
    } catch (error) {
      console.error("[useInstitutionalResponsibles] Error in bulk remove:", error);
      addToast({
        variant: "error",
        title: "Error Masivo",
        message: "Ocurrió un error al inactivar los responsables en lote.",
      });
    }
  };

  /**
   * Restores multiple responsibles in bulk.
   * @param ids - Array of responsible person IDs to restore.
   */
  const bulkRestoreResponsibles = async (ids: string[]) => {
    try {
      await baseBulkRestore(ids, { silent: true });
      
      addToast({
        variant: "success",
        title: "Acción Masiva",
        message: `${ids.length} responsables han sido restaurados exitosamente.`,
      });
    } catch (error) {
      console.error("[useInstitutionalResponsibles] Error in bulk restore:", error);
      addToast({
        variant: "error",
        title: "Error Masivo",
        message: "Ocurrió un error al restaurar los responsables en lote.",
      });
    }
  };

  return {
    responsibles,
    status,
    loadingAction,
    addResponsible,
    editResponsible,
    toggleStatus,
    bulkRemoveResponsibles,
    bulkRestoreResponsibles,
    refreshResponsibles,
  };
};
