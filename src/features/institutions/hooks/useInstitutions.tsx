/**
 * @file useInstitutions.tsx
 * @description Hook para la gestión de instituciones en modo demostración.
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
  const [loadingAction, setLoadingAction] = useState(false);
  const { addToast } = useToast();

  const refreshInstitutions = useCallback(async () => {
    setStatus("loading");
    try {
      const data = await institutionsService.getInstitutions();
      setInstitutions(data);
      setStatus("success");
    } catch (e) {
      console.error("Error loading institutions:", e);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    refreshInstitutions();
  }, [refreshInstitutions]);

  const addInstitution = async (instData: Omit<Institution, "institutionId" | "registrationDate">) => {
    setLoadingAction(true);
    await new Promise(resolve => setTimeout(resolve, 800));

    const newInst: Institution = {
      ...instData,
      institutionId: Math.random().toString(36).substr(2, 9),
      registrationDate: new Date(),
    };

    setInstitutions(prev => [newInst, ...prev]);
    setLoadingAction(false);

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
  };

  const editInstitution = async (instData: Institution) => {
    setLoadingAction(true);
    await new Promise(resolve => setTimeout(resolve, 800));

    const oldInst = institutions.find(i => i.institutionId === instData.institutionId);
    setInstitutions(prev => prev.map(i => i.institutionId === instData.institutionId ? instData : i));
    setLoadingAction(false);

    addToast({
      variant: "success",
      title: "Institución Actualizada",
      message: (
        <>
          <p>Los datos de <strong>{instData.name}</strong> han sido actualizados.</p>
          {oldInst && <ChangeComparison 
            oldData={oldInst as unknown as Record<string, unknown>} 
            newData={instData as unknown as Record<string, unknown>} 
            labels={INSTITUTION_LABELS} 
          />}
        </>
      ),
    });
  };

  const toggleStatus = async (inst: Institution) => {
    setLoadingAction(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    const newStatus = !inst.status;
    setInstitutions(prev => prev.map(i => i.institutionId === inst.institutionId ? { ...i, status: newStatus } : i));
    setLoadingAction(false);

    addToast({
      variant: newStatus ? "success" : "warning",
      title: newStatus ? "Institución Restaurada" : "Institución Inactivada",
      message: `La institución ${inst.name} ahora está ${newStatus ? 'activa' : 'inactiva'}.`,
    });
  };

  const bulkRemoveInstitutions = async (ids: string[]) => {
    setLoadingAction(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setInstitutions(prev => prev.map(i => ids.includes(i.institutionId) ? { ...i, status: false } : i));
    setLoadingAction(false);
    addToast({
      variant: "warning",
      title: "Acción Masiva",
      message: `${ids.length} instituciones han sido inactivadas.`,
    });
  };

  const bulkRestoreInstitutions = async (ids: string[]) => {
    setLoadingAction(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setInstitutions(prev => prev.map(i => ids.includes(i.institutionId) ? { ...i, status: true } : i));
    setLoadingAction(false);
    addToast({
      variant: "success",
      title: "Acción Masiva",
      message: `${ids.length} instituciones han sido restauradas.`,
    });
  };

  return {
    institutions,
    status,
    loadingAction,
    addInstitution,
    editInstitution,
    toggleStatus,
    bulkRemoveInstitutions,
    bulkRestoreInstitutions,
  };
};
