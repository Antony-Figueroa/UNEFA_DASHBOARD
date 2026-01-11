/**
 * @file useInstitutionalResponsibles.tsx
 * @description Hook para la gestión de responsables institucionales.
 */

import { useState, useEffect, useCallback } from "react";
import { InstitutionalResponsible } from "../types";
import { useToast } from "../../../context/toast";
import { ChangeComparison, RecordDetails } from "../../../components/ui/alert/AlertContextualContent";
import * as responsibleService from "../services/institutionalResponsiblesService";

type Status = "loading" | "success" | "error";

const RESPONSIBLE_LABELS: Record<string, string> = {
  identificationPrefix: "Tipo",
  identificationNumber: "Cédula",
  firstName: "Primer Nombre",
  middleName: "Segundo Nombre",
  lastName: "Primer Apellido",
  secondLastName: "Segundo Apellido",
  phone: "Teléfono",
  email: "Correo",
  institutionName: "Institución",
};

export const useInstitutionalResponsibles = () => {
  const [responsibles, setResponsibles] = useState<InstitutionalResponsible[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [loadingAction, setLoadingAction] = useState(false);
  const { addToast } = useToast();

  const refreshResponsibles = useCallback(async () => {
    setStatus("loading");
    try {
      const data = await responsibleService.getInstitutionalResponsibles();
      setResponsibles(data);
      setStatus("success");
    } catch (e) {
      console.error("Error loading responsibles:", e);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    refreshResponsibles();
  }, [refreshResponsibles]);

  const addResponsible = async (respData: Omit<InstitutionalResponsible, "responsibleId" | "registrationDate">) => {
    setLoadingAction(true);
    try {
      const newResp = await responsibleService.createInstitutionalResponsible(respData);
      setResponsibles(prev => [newResp, ...prev]);
      
      addToast({
        variant: "success",
        title: "Responsable Registrado",
        message: (
          <>
            <p>El responsable <strong>{newResp.firstName} {newResp.lastName}</strong> ha sido registrado correctamente.</p>
            <RecordDetails
              data={newResp as unknown as Record<string, unknown>}
              labels={RESPONSIBLE_LABELS}
              fields={['identificationNumber', 'phone', 'email', 'institutionName']}
            />
          </>
        ),
      });
    } catch (error) {
      console.error("Error adding responsible:", error);
      addToast({
        variant: "error",
        title: "Error",
        message: "No se pudo registrar el responsable.",
      });
    } finally {
      setLoadingAction(false);
    }
  };

  const editResponsible = async (respData: InstitutionalResponsible) => {
    setLoadingAction(true);
    try {
      const oldResp = responsibles.find(r => r.responsibleId === respData.responsibleId);
      const updatedResp = await responsibleService.updateInstitutionalResponsible(respData.responsibleId, respData);
      
      setResponsibles(prev => prev.map(r => r.responsibleId === respData.responsibleId ? updatedResp : r));
      
      addToast({
        variant: "success",
        title: "Responsable Actualizado",
        message: (
          <>
            <p>Los datos de <strong>{updatedResp.firstName} {updatedResp.lastName}</strong> han sido actualizados.</p>
            {oldResp && <ChangeComparison 
              oldData={oldResp as unknown as Record<string, unknown>} 
              newData={updatedResp as unknown as Record<string, unknown>} 
              labels={RESPONSIBLE_LABELS} 
            />}
          </>
        ),
      });
    } catch (error) {
      console.error("Error editing responsible:", error);
      addToast({
        variant: "error",
        title: "Error",
        message: "No se pudo actualizar el responsable.",
      });
    } finally {
      setLoadingAction(false);
    }
  };

  const toggleStatus = async (resp: InstitutionalResponsible) => {
    setLoadingAction(true);
    try {
      const newStatus = !resp.status;
      const updatedResp = await responsibleService.toggleInstitutionalResponsibleStatus(resp.responsibleId, newStatus);
      
      setResponsibles(prev => prev.map(r => r.responsibleId === resp.responsibleId ? updatedResp : r));

      addToast({
        variant: newStatus ? "success" : "warning",
        title: newStatus ? "Responsable Restaurado" : "Responsable Inactivado",
        message: `El responsable ${resp.firstName} ${resp.lastName} ahora está ${newStatus ? 'activo' : 'inactivo'}.`,
      });
    } catch (error) {
      console.error("Error toggling status:", error);
      addToast({
        variant: "error",
        title: "Error",
        message: "No se pudo cambiar el estado del responsable.",
      });
    } finally {
      setLoadingAction(false);
    }
  };

  const bulkRemoveResponsibles = async (ids: string[]) => {
    setLoadingAction(true);
    try {
      await Promise.all(ids.map(id => responsibleService.toggleInstitutionalResponsibleStatus(id, false)));
      setResponsibles(prev => prev.map(r => ids.includes(r.responsibleId) ? { ...r, status: false } : r));
      
      addToast({
        variant: "warning",
        title: "Acción Masiva",
        message: `${ids.length} responsables han sido inactivados.`,
      });
    } catch (error) {
      console.error("Error in bulk remove:", error);
      addToast({
        variant: "error",
        title: "Error",
        message: "Ocurrió un error al inactivar los responsables.",
      });
    } finally {
      setLoadingAction(false);
    }
  };

  const bulkRestoreResponsibles = async (ids: string[]) => {
    setLoadingAction(true);
    try {
      await Promise.all(ids.map(id => responsibleService.toggleInstitutionalResponsibleStatus(id, true)));
      setResponsibles(prev => prev.map(r => ids.includes(r.responsibleId) ? { ...r, status: true } : r));
      
      addToast({
        variant: "success",
        title: "Acción Masiva",
        message: `${ids.length} responsables han sido restaurados.`,
      });
    } catch (error) {
      console.error("Error in bulk restore:", error);
      addToast({
        variant: "error",
        title: "Error",
        message: "Ocurrió un error al restaurar los responsables.",
      });
    } finally {
      setLoadingAction(false);
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
