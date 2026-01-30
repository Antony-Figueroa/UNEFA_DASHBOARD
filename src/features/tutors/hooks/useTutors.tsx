/**
 * @file useTutors.tsx
 * @description Hook para la gestión de tutores conectada a la API.
 */

import { useState, useEffect, useCallback } from "react";
import { Tutor, CreateTutorPayload, UpdateTutorPayload } from "../types";
import { tutorsService } from "../services/tutorsService";
import { getCareers } from "../../careers/services/careersService";
import { Career } from "../../careers/types";
import { useToast } from "../../../context/toast";
import { ChangeComparison, RecordDetails } from "../../../components/ui/alert/AlertContextualContent";
import { useCrud } from "../../../hooks/useCrud";

const TUTOR_LABELS: Record<string, string> = {
  firstName: "Nombre",
  lastName: "Apellido",
  identificationNumber: "Cédula",
  email: "Correo",
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
    toggleItemStatus: baseToggleStatus
  } = useCrud<Tutor, CreateTutorPayload, UpdateTutorPayload>(tutorsService, {
    resourceName: "Tutor",
    idField: "tutorId",
  });

  const refreshTutors = useCallback(async () => {
    try {
      const careersData = await getCareers();
      setCareers(careersData);
      await refreshTutorsBase();
    } catch (e) {
      console.error("[useTutors] Error loading careers:", e);
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

  const addTutor = async (tutorData: CreateTutorPayload) => {
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
      return;
    }

    const newTutor = await baseAddTutor(tutorData);
    if (newTutor) {
      const careerNames = getCareerNames(newTutor.carreras || []);

      addToast({
        variant: "success",
        title: "Tutor Registrado",
        message: (
          <>
            <p>El tutor <strong>{newTutor.firstName} {newTutor.lastName}</strong> ha sido registrado.</p>
            <RecordDetails
              data={{ ...newTutor, carreras: careerNames } as unknown as Record<string, unknown>}
              labels={TUTOR_LABELS}
              fields={['identificationNumber', 'email', 'phone', 'carreras']}
            />
          </>
        ),
      });
    }
  };

  const editTutor = async (tutorData: UpdateTutorPayload) => {
    const { tutorId } = tutorData;
    const oldTutor = tutors.find(t => t.tutorId === tutorId);
    const updatedTutor = await baseEditTutor(tutorData);

    if (updatedTutor) {
      const oldCareerNames = oldTutor ? getCareerNames(oldTutor.carreras || []) : "";
      const newCareerNames = getCareerNames(updatedTutor.carreras || []);

      addToast({
        variant: "success",
        title: "Tutor Actualizado",
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
    }
  };

  const toggleStatus = async (tutor: Tutor) => {
    const newStatus = !tutor.status;
    const success = await baseToggleStatus(tutor.tutorId, newStatus);
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
      await Promise.all(ids.map(id => tutorsService.toggleStatus(id, false)));
      refreshTutorsBase();
      addToast({
        variant: "warning",
        title: "Acción Masiva",
        message: `${ids.length} tutores han sido inactivados.`,
      });
    } catch (error) {
      console.error("[useTutors] Error in bulk remove:", error);
      addToast({
        variant: "error",
        title: "Error",
        message: "No se pudieron inactivar los tutores.",
      });
    }
  };

  const bulkRestoreTutors = async (ids: string[]) => {
    try {
      await Promise.all(ids.map(id => tutorsService.toggleStatus(id, true)));
      refreshTutorsBase();
      addToast({
        variant: "success",
        title: "Acción Masiva",
        message: `${ids.length} tutores han sido restaurados.`,
      });
    } catch (error) {
      console.error("[useTutors] Error in bulk restore:", error);
      addToast({
        variant: "error",
        title: "Error",
        message: "No se pudieron restaurar los tutores.",
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
