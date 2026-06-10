import { useState, useEffect } from "react";
import { Institution, CreateInstitutionPayload, UpdateInstitutionPayload } from "../types";
import { institutionService, updateInstitutionCareers } from "../services/institutionsService";
import { useToast } from "../../../context/toast";
import { RecordDetails, ChangeComparison } from "../../../components/ui/alert/AlertContextualContent";
import { useCrud } from "../../../hooks/useCrud";

/**
 * Labels for institution fields used in toast notifications and comparisons.
 */
const INSTITUTION_LABELS: Record<string, string> = {
  rif: "RIF",
  name: "Nombre",
  fiscalAddress: "Dirección Fiscal",
  phone: "Teléfono",
  practiceType: "Tipo de Práctica",
  region: "Región",
  nucleus: "Núcleo",
  extension: "Extensión",
  institutionType: "Tipo de Empresa o Institución",
};

/**
 * Maps technical internshipTypeId values to human-readable practice type names.
 * Ensures toast notifications show descriptive names instead of raw IDs.
 */
const PRACTICE_TYPE_MAP: Record<string, string> = {
  "1": "ORDINARIA / ÚNICA",
  "2": "HOSPITALARIA",
  "3": "COMUNITARIA",
};

const humanizeInstitutionData = (inst: any) => {
  const id = String(inst.internshipTypeId ?? "");
  const humanType =
    PRACTICE_TYPE_MAP[id] ||
    inst.practiceType ||
    (id ? `Tipo ${id}` : "No asignado");

  return {
    ...inst,
    practiceType: humanType,
  };
};

/**
 * Hook to manage institutions.
 *
 * Refactorizado para utilizar useCrud como motor de estado base,
 * manteniendo las notificaciones enriquecidas y acciones masivas.
 *
 * @returns An object containing the institutions state and action functions.
 */
export const useInstitutions = () => {
  const { addToast } = useToast();

  const {
    data: institutions,
    status,
    loadingAction,
    error,
    refresh: refreshInstitutions,
    deleteItem: removeInstitution,
    pagination,
    setPage,
    setLimit,
  } = useCrud<Institution, CreateInstitutionPayload, UpdateInstitutionPayload>(institutionService, {
    resourceName: "Empresa o Institución",
    idField: "institutionId",
    optimistic: true,
    usePagination: true,
    pageSize: 20,
  });

  /**
   * Adds a new institution with enriched notifications.
   * @returns The newly created institution, or undefined on error.
   */
  const addInstitution = async (instData: CreateInstitutionPayload): Promise<Institution | undefined> => {
    try {
      const newInst = await institutionService.create(instData);
      if (newInst && instData.careerIds && instData.careerIds.length > 0) {
        await updateInstitutionCareers(newInst.institutionId, instData.careerIds);
      }

      await refreshInstitutions();

      const humanNewInst = humanizeInstitutionData(newInst);

      addToast({
        variant: "success",
        title: "Empresa o Institución Registrada",
        message: (
          <>
            <p>La empresa o institución <strong>{newInst.name}</strong> ha sido registrada exitosamente.</p>
            <RecordDetails
              data={humanNewInst as unknown as Record<string, unknown>}
              labels={INSTITUTION_LABELS}
              fields={["rif", "practiceType"]}
            />
          </>
        ),
      });

      return newInst;
    } catch (e) {
      console.error("Error adding institution:", e);
      addToast({
        variant: "error",
        title: "Error de Registro",
        message: "No se pudo registrar la empresa o institución. Intente de nuevo.",
      });
      return undefined;
    }
  };

  /**
   * Updates an existing institution with change comparison.
   */
  const editInstitution = async (instData: UpdateInstitutionPayload) => {
    try {
      const { institutionId } = instData;
      const oldInst = institutions.find((i) => i.institutionId === institutionId);
      const updatedInst = await institutionService.update(instData);
      if (instData.careerIds) {
        await updateInstitutionCareers(institutionId, instData.careerIds);
      }
      await refreshInstitutions();

      const humanOld = oldInst ? humanizeInstitutionData(oldInst) : null;
      const humanNew = humanizeInstitutionData(updatedInst);

      addToast({
        variant: "success",
        title: "Empresa o Institución Actualizada",
        message: (
          <>
            <p>Los datos de <strong>{updatedInst.name}</strong> han sido actualizados exitosamente.</p>
            {humanOld && (
              <ChangeComparison
                oldData={humanOld as unknown as Record<string, unknown>}
                newData={humanNew as unknown as Record<string, unknown>}
                labels={INSTITUTION_LABELS}
                excludeFields={["internshipTypeId", "careerIds", "id", "internshipTypeIds"]}
              />
            )}
          </>
        ),
      });
    } catch (e) {
      console.error("Error editing institution:", e);
      addToast({
        variant: "error",
        title: "Error al actualizar",
        message: "No se pudo actualizar la empresa o institución. Intente de nuevo.",
      });
    }
  };

  /**
   * Toggles the active status of an institution.
   */
  const toggleStatus = async (inst: Institution) => {
    try {
      const newStatus = !inst.status;
      await institutionService.toggleStatus!(inst.institutionId, newStatus);
      await refreshInstitutions();

      addToast({
        variant: newStatus ? "success" : "warning",
        title: newStatus ? "Empresa o Institución Restaurada" : "Empresa o Institución Inactivada",
        message: `La empresa o institución ${inst.name} ahora está ${newStatus ? "activa" : "inactiva"}.`,
      });
    } catch (e) {
      console.error("Error toggling institution status:", e);
      const error = e as { response?: { data?: { message?: string } } };
      const errorMessage =
        error.response?.data?.message || "No se pudo cambiar el estado de la empresa o institución.";
      addToast({
        variant: "error",
        title: "Error de validación",
        message: errorMessage,
      });
    }
  };

  /**
   * Inactivates multiple institutions in bulk.
   */
  const bulkRemoveInstitutions = async (ids: string[]) => {
    let successCount = 0;
    const failMessages: string[] = [];

    try {
      const results = await Promise.allSettled(
        ids.map(id => institutionService.toggleStatus!(id, false))
      );

      for (const result of results) {
        if (result.status === 'fulfilled') {
          successCount++;
        } else {
          const error = result.reason as { response?: { data?: { message?: string } } };
          const msg = error.response?.data?.message || 'Error al inactivar empresa o institución';
          if (!failMessages.includes(msg)) failMessages.push(msg);
        }
      }

      await refreshInstitutions();

      if (successCount > 0) {
        addToast({
          variant: "warning",
          title: "Acción Masiva",
          message: `${successCount} empresas o instituciones han sido inactivadas.`,
        });
      }

      if (failMessages.length > 0) {
        addToast({
          variant: "error",
          title: "Restricción detectada",
          message: failMessages.join(". "),
        });
      }
    } catch (e) {
      console.error("Error in bulk remove:", e);
    }
  };

  /**
   * Restores multiple institutions in bulk.
   */
  const bulkRestoreInstitutions = async (ids: string[]) => {
    try {
      await Promise.all(ids.map((id) => institutionService.toggleStatus!(id, true)));
      await refreshInstitutions();

      addToast({
        variant: "success",
        title: "Acción Masiva",
          message: `${ids.length} empresas o instituciones han sido restauradas.`,
      });
    } catch (e) {
      console.error("Error in bulk restore:", e);
      addToast({
        variant: "error",
        title: "Error masivo",
        message: "No se pudieron restaurar todas las empresas o instituciones seleccionadas.",
      });
    }
  };

  return {
    institutions,
    status,
    loadingAction,
    error,
    refreshInstitutions,
    addInstitution,
    editInstitution,
    removeInstitution,
    toggleStatus,
    bulkRemoveInstitutions,
    bulkRestoreInstitutions,
    pagination,
    setPage,
    setLimit,
  };
};
