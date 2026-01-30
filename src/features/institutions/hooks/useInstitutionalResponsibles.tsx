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
  identificationPrefix: "Tipo",
  identificationNumber: "Cédula",
  fullName: "Nombre Completo",
  phone: "Teléfono",
  email: "Correo",
  institutionName: "Institución",
  position: "Cargo",
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
    toggleItemStatus: baseToggleStatus
  } = useCrud<InstitutionalResponsible, CreateInstitutionalResponsiblePayload, UpdateInstitutionalResponsiblePayload>(responsibleService, {
    resourceName: "Responsable",
    idField: "responsibleId",
  });

  /**
   * Adds a new institutional responsible with custom notification.
   * @param respData - The payload for the new responsible person.
   */
  const addResponsible = async (respData: CreateInstitutionalResponsiblePayload) => {
    const newResp = await baseAddResponsible(respData);
    if (newResp) {
      const fullName = `${newResp.firstName} ${newResp.lastName}`;
      addToast({
        variant: "success",
        title: "Responsable Registrado",
        message: (
          <>
            <p>El responsable <strong>{fullName}</strong> ha sido registrado correctamente.</p>
            <RecordDetails
              data={newResp as unknown as Record<string, unknown>}
              labels={RESPONSIBLE_LABELS}
              fields={['firstName', 'lastName', 'phone', 'email', 'institutionName']}
            />
          </>
        ),
      });
    }
  };

  /**
   * Updates an existing institutional responsible with custom comparison notification.
   * @param id - The ID of the responsible person to update.
   * @param respData - The partial data to update.
   */
  const editResponsible = async (respData: UpdateInstitutionalResponsiblePayload) => {
    const { responsibleId } = respData;
    const oldResp = responsibles.find(r => r.responsibleId === responsibleId);
    const updatedResp = await baseEditResponsible(respData);
    
    if (updatedResp) {
      const fullName = `${updatedResp.firstName} ${updatedResp.lastName}`;
      addToast({
        variant: "success",
        title: "Responsable Actualizado",
        message: (
          <>
            <p>Los datos de <strong>{fullName}</strong> han sido actualizados.</p>
            {oldResp && <ChangeComparison 
              oldData={oldResp as unknown as Record<string, unknown>} 
              newData={updatedResp as unknown as Record<string, unknown>} 
              labels={RESPONSIBLE_LABELS} 
            />}
          </>
        ),
      });
    }
  };

  /**
   * Toggles the active status of an institutional responsible with custom notification.
   * @param resp - The responsible person object to toggle.
   */
  const toggleStatus = async (resp: InstitutionalResponsible) => {
    const newStatus = !resp.status;
    const success = await baseToggleStatus(resp.responsibleId, newStatus);
    if (success) {
      const fullName = `${resp.firstName} ${resp.lastName}`;
      addToast({
        variant: newStatus ? "success" : "warning",
        title: newStatus ? "Responsable Restaurado" : "Responsable Inactivado",
        message: `El responsable ${fullName} ahora está ${newStatus ? 'activo' : 'inactivo'}.`,
      });
    }
  };

  /**
   * Inactivates multiple responsibles in bulk.
   * @param ids - Array of responsible person IDs to inactivate.
   */
  const bulkRemoveResponsibles = async (ids: string[]) => {
    try {
      await Promise.all(ids.map(id => responsibleService.toggleStatus(id, false)));
      refreshResponsibles();
      
      addToast({
        variant: "warning",
        title: "Acción Masiva",
        message: `${ids.length} responsables han sido inactivados.`,
      });
    } catch (error) {
      console.error("[useInstitutionalResponsibles] Error in bulk remove:", error);
      addToast({
        variant: "error",
        title: "Error",
        message: "Ocurrió un error al inactivar los responsables.",
      });
    }
  };

  /**
   * Restores multiple responsibles in bulk.
   * @param ids - Array of responsible person IDs to restore.
   */
  const bulkRestoreResponsibles = async (ids: string[]) => {
    try {
      await Promise.all(ids.map(id => responsibleService.toggleStatus(id, true)));
      refreshResponsibles();
      
      addToast({
        variant: "success",
        title: "Acción Masiva",
        message: `${ids.length} responsables han sido restaurados.`,
      });
    } catch (error) {
      console.error("[useInstitutionalResponsibles] Error in bulk restore:", error);
      addToast({
        variant: "error",
        title: "Error",
        message: "Ocurrió un error al restaurar los responsables.",
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
