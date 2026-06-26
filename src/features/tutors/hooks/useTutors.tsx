/**
 * @file useTutors.tsx
 * @description Hook para la gestión de tutores conectada a la API.
 */

import { useState, useEffect, useCallback } from "react";
import { Tutor, CreateTutorPayload, UpdateTutorPayload } from "../types";
import { tutorsService } from "../services/tutorsService";
import { getCareers } from "../../careers/services/careersService";
import { unwrapData } from "../../../api/crudServiceFactory";
import { Career } from "../../careers/types";
import { useToast } from "../../../context/toast";
import { ChangeComparison, RecordDetails } from "../../../components/ui/alert/AlertContextualContent";
import { useCrud } from "../../../hooks/useCrud";

const TUTOR_LABELS: Record<string, string> = {
  firstName: "Nombre",
  lastName: "Apellido",
  identificationNumber: "Cédula",
  email: "Correo Electrónico",
  phone: "Teléfono",
  sex: "Sexo",
  profession: "Profesión",
  condition: "Condición",
  dedication: "Dedicación",
  category: "Categoría",
  practiceTypes: "Tipos de práctica",
  carreras: "Carreras que atiende",
};

/**
 * Hook para la gestión de tutores conectada a la API.
 * Utiliza useCrud para la lógica base y extiende con lógica específica de tutores.
 */
export const useTutors = () => {
  const [careers, setCareers] = useState<Career[]>([]);
  const { addToast } = useToast();

  const {
    data: tutors,
    status,
    loadingAction,
    error,
    refresh: refreshTutorsBase,
    createItem: baseAddTutor,
    updateItem: baseEditTutor,
    toggleItemStatus: baseToggleStatus,
    bulkDelete: baseBulkDelete,
    bulkRestore: baseBulkRestore
  } = useCrud<Tutor, CreateTutorPayload, UpdateTutorPayload>(tutorsService, {
    resourceName: "Tutor",
    idField: "tutorId",
  });

  const refreshTutors = useCallback(async () => {
    try {
      const careersData = await getCareers();
      setCareers(unwrapData(careersData));
    } catch (e) {
      console.error('[useTutors] Error loading careers:', e);
    }
    try {
      await refreshTutorsBase();
    } catch (e) {
      console.error('[useTutors] Error loading tutors:', e);
    }
  }, [refreshTutorsBase]);

  const getCareerNames = useCallback((careerIds: (string | number)[]) => {
    return careerIds
      .map(id => {
        const career = careers.find(c => String(c.careerId) === String(id));
        return career ? career.careerName : `ID: ${id}`;
      })
      .join(", ");
  }, [careers]);

  useEffect(() => {
    refreshTutors();
  }, [refreshTutors]);

  const addTutor = async (tutorData: CreateTutorPayload, tutorType?: string): Promise<Tutor | null> => {
    // Si el payload tiene tutorId, es una actualización (ej: CI cargó tutor existente)
    const tutorId = (tutorData as any).tutorId;
    if (tutorId) {
      const updated = await baseEditTutor(tutorData as UpdateTutorPayload, { silent: true });
      if (updated) {
        const careerNames = getCareerNames(updated.carreras || []);
        const typeLabel = tutorType ? `Tutor ${tutorType}` : 'Tutor';
        addToast({
          variant: "success",
          title: `${typeLabel} Actualizado`,
          message: (
            <>
              <p>El {typeLabel.toLowerCase()} <strong>{updated.firstName} {updated.lastName}</strong> ha sido actualizado exitosamente.</p>
              <RecordDetails
                data={{ ...updated, carreras: careerNames } as unknown as Record<string, unknown>}
                labels={TUTOR_LABELS}
                fields={['identificationNumber', 'email', 'phone', 'carreras']}
              />
            </>
          ),
        });
        return updated;
      }
      return null;
    }

    // Validar duplicidad de cédula localmente antes de intentar crear
    const isDuplicate = tutors.some(
      t => t.identificationNumber === tutorData.identificationNumber && 
           t.identificationPrefix === tutorData.identificationPrefix
    );

    if (isDuplicate) {
      addToast({
        variant: "error",
        title: "Cédula Duplicada",
        message: `Ya existe un tutor registrado con la cédula ${tutorData.identificationPrefix}-${tutorData.identificationNumber}.`,
      });
      return null;
    }

    const newTutor = await baseAddTutor(tutorData, { silent: true });
    if (newTutor) {
      const careerNames = getCareerNames(newTutor.carreras || []);
      const typeLabel = tutorType ? `Tutor ${tutorType}` : 'Tutor';

      addToast({
        variant: "success",
        title: `${typeLabel} Registrado`,
        message: (
          <>
            <p>El {typeLabel.toLowerCase()} <strong>{newTutor.firstName} {newTutor.lastName}</strong> ha sido registrado exitosamente.</p>
            <RecordDetails
              data={{ ...newTutor, carreras: careerNames } as unknown as Record<string, unknown>}
              labels={TUTOR_LABELS}
              fields={['identificationNumber', 'email', 'phone', 'carreras']}
            />
          </>
        ),
      });
      return newTutor;
    }
    return null;
  };

  const editTutor = async (tutorData: UpdateTutorPayload, tutorType?: string): Promise<Tutor | null> => {
    const { tutorId } = tutorData;
    const oldTutor = tutors.find(t => t.tutorId === tutorId);
    const updatedTutor = await baseEditTutor(tutorData, { silent: true });

    if (updatedTutor) {
      const oldCareerNames = oldTutor ? getCareerNames(oldTutor.carreras || []) : "";
      const newCareerNames = getCareerNames(updatedTutor.carreras || []);
      const typeLabel = tutorType ? `Tutor ${tutorType}` : 'Tutor';

      addToast({
        variant: "success",
        title: `${typeLabel} Actualizado`,
        message: (
          <>
            <p>Los datos de <strong>{updatedTutor.firstName} {updatedTutor.lastName}</strong> han sido actualizados.</p>
            {oldTutor && <ChangeComparison 
              oldData={{ ...oldTutor, carreras: oldCareerNames } as unknown as Record<string, unknown>} 
              newData={{ ...updatedTutor, carreras: newCareerNames } as unknown as Record<string, unknown>} 
              labels={TUTOR_LABELS} 
            />}
          </>
        ),
      });
      return updatedTutor;
    }
    return null;
  };

  const toggleStatus = async (tutor: Tutor) => {
    const newStatus = !tutor.status;
    const success = await baseToggleStatus(tutor.tutorId, newStatus, { silent: true });
    if (success) {
      addToast({
        variant: newStatus ? "success" : "warning",
        title: newStatus ? "Tutor Restaurado" : "Tutor Inactivado",
        message: `El tutor ${tutor.firstName} ${tutor.lastName} ahora está ${newStatus ? 'activo' : 'inactivo'}.`,
      });
    }
  };

  const bulkRemoveTutors = async (ids: string[]) => {
    try {
      await baseBulkDelete(ids, { silent: true });
      addToast({
        variant: "warning",
        title: "Acción Masiva",
        message: `${ids.length} tutores han sido inactivados exitosamente.`,
      });
    } catch (error) {
      console.error("[useTutors] Error in bulk remove:", error);
      addToast({
        variant: "error",
        title: "Error Masivo",
        message: "No se pudieron inactivar los tutores seleccionados.",
      });
    }
  };

  const bulkRestoreTutors = async (ids: string[]) => {
    try {
      await baseBulkRestore(ids, { silent: true });
      addToast({
        variant: "success",
        title: "Acción Masiva",
        message: `${ids.length} tutores han sido restaurados exitosamente.`,
      });
    } catch (error) {
      console.error("[useTutors] Error in bulk restore:", error);
      addToast({
        variant: "error",
        title: "Error Masivo",
        message: "No se pudieron restaurar los tutores seleccionados.",
      });
    }
  };

  return {
    tutors,
    careers,
    status,
    error,
    loadingAction,
    addTutor,
    editTutor,
    toggleStatus,
    bulkRemoveTutors,
    bulkRestoreTutors,
    refreshTutors,
  };
};
