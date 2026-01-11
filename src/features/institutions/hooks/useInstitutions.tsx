/**
 * @file useInstitutions.tsx
 * @description Hook para la gestión de instituciones conectada a la API.
 */

import { useState, useEffect, useCallback } from "react";
import { Institution } from "../types";
import * as institutionsService from "../services/institutionsService";
import { useToast } from "../../../context/toast";
import { ChangeComparison, RecordDetails } from "../../../components/ui/alert/AlertContextualContent";

type Status = "loading" | "success" | "error";

const INSTITUTION_LABELS: Record<string, string> = {
  rif: "RIF",
  name: "Nombre",
  fiscalAddress: "Dirección Fiscal",
  phone: "Teléfono",
  practiceType: "Tipo de Práctica",
  careerName: "Carrera",
  region: "Región",
  nucleus: "Núcleo",
  extension: "Extensión",
  institutionType: "Tipo de Institución",
};

export const useInstitutions = () => {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<Error | null>(null);
  const [loadingAction, setLoadingAction] = useState(false);
  const { addToast } = useToast();

  const refreshInstitutions = useCallback(async () => {
    setStatus("loading");
    try {
      const data = await institutionsService.getInstitutions();
      setInstitutions(data);
      setStatus("success");
      setError(null);
    } catch (e) {
      console.error("Error loading institutions:", e);
      setStatus("error");
      const err = e instanceof Error ? e : new Error("Error al cargar instituciones");
      setError(err);
      addToast({
        variant: "error",
        title: "Error de conexión",
        message: "No se pudo conectar con la base de datos o el servidor. Por favor, verifique su conexión.",
      });
    }
  }, [addToast]);

  useEffect(() => {
    refreshInstitutions();
  }, [refreshInstitutions]);

  const addInstitution = async (instData: Omit<Institution, "institutionId" | "registrationDate">) => {
    setLoadingAction(true);
    try {
      const newInst = await institutionsService.createInstitution(instData);
      setInstitutions(prev => [newInst, ...prev]);
      
      addToast({
        variant: "success",
        title: "Institución Registrada",
        message: (
          <>
            <p>La institución <strong>{newInst.name}</strong> ha sido registrada correctamente.</p>
            <RecordDetails
              data={newInst as unknown as Record<string, unknown>}
              labels={INSTITUTION_LABELS}
              fields={['rif', 'practiceType', 'careerName']}
            />
          </>
        ),
      });
    } catch (e) {
      console.error("Error adding institution:", e);
      addToast({
        variant: "error",
        title: "Error al registrar",
        message: "No se pudo registrar la institución. Intente de nuevo.",
      });
    } finally {
      setLoadingAction(false);
    }
  };

  const editInstitution = async (instData: Institution) => {
    setLoadingAction(true);
    try {
      const updatedInst = await institutionsService.updateInstitution(instData.institutionId, instData);
      const oldInst = institutions.find(i => i.institutionId === instData.institutionId);
      
      setInstitutions(prev => prev.map(i => i.institutionId === instData.institutionId ? updatedInst : i));

      addToast({
        variant: "success",
        title: "Institución Actualizada",
        message: (
          <>
            <p>Los datos de <strong>{updatedInst.name}</strong> han sido actualizados.</p>
            {oldInst && <ChangeComparison 
              oldData={oldInst as unknown as Record<string, unknown>} 
              newData={updatedInst as unknown as Record<string, unknown>} 
              labels={INSTITUTION_LABELS} 
            />}
          </>
        ),
      });
    } catch (e) {
      console.error("Error editing institution:", e);
      addToast({
        variant: "error",
        title: "Error al actualizar",
        message: "No se pudo actualizar la institución. Intente de nuevo.",
      });
    } finally {
      setLoadingAction(false);
    }
  };

  const toggleStatus = async (inst: Institution) => {
    setLoadingAction(true);
    try {
      const newStatus = !inst.status;
      const updatedInst = await institutionsService.toggleInstitutionStatus(inst.institutionId, newStatus);
      
      setInstitutions(prev => prev.map(i => i.institutionId === inst.institutionId ? updatedInst : i));

      addToast({
        variant: newStatus ? "success" : "warning",
        title: newStatus ? "Institución Restaurada" : "Institución Inactivada",
        message: `La institución ${inst.name} ahora está ${newStatus ? 'activa' : 'inactiva'}.`,
      });
    } catch (e) {
      console.error("Error toggling institution status:", e);
      addToast({
        variant: "error",
        title: "Error de estado",
        message: "No se pudo cambiar el estado de la institución.",
      });
    } finally {
      setLoadingAction(false);
    }
  };

  const bulkRemoveInstitutions = async (ids: string[]) => {
    setLoadingAction(true);
    try {
      // Inactivar cada una (o usar un endpoint bulk si existiera)
      await Promise.all(ids.map(id => institutionsService.toggleInstitutionStatus(id, false)));
      
      setInstitutions(prev => prev.map(i => ids.includes(i.institutionId) ? { ...i, status: false } : i));
      
      addToast({
        variant: "warning",
        title: "Acción Masiva",
        message: `${ids.length} instituciones han sido inactivadas.`,
      });
    } catch (e) {
      console.error("Error in bulk remove:", e);
      addToast({
        variant: "error",
        title: "Error masivo",
        message: "No se pudieron inactivar todas las instituciones seleccionadas.",
      });
    } finally {
      setLoadingAction(false);
    }
  };

  const bulkRestoreInstitutions = async (ids: string[]) => {
    setLoadingAction(true);
    try {
      await Promise.all(ids.map(id => institutionsService.toggleInstitutionStatus(id, true)));
      
      setInstitutions(prev => prev.map(i => ids.includes(i.institutionId) ? { ...i, status: true } : i));
      
      addToast({
        variant: "success",
        title: "Acción Masiva",
        message: `${ids.length} instituciones han sido restauradas.`,
      });
    } catch (e) {
      console.error("Error in bulk restore:", e);
      addToast({
        variant: "error",
        title: "Error masivo",
        message: "No se pudieron restaurar todas las instituciones seleccionadas.",
      });
    } finally {
      setLoadingAction(false);
    }
  };

  return {
    institutions,
    status,
    error,
    loadingAction,
    addInstitution,
    editInstitution,
    toggleStatus,
    bulkRemoveInstitutions,
    bulkRestoreInstitutions,
    refreshInstitutions,
  };
};
