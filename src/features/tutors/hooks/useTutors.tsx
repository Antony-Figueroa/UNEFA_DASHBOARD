/**
 * @file useTutors.tsx
 * @description Hook para la gestión de tutores conectada a la API.
 */

import { useState, useEffect, useCallback } from "react";
import { Tutor } from "../types";
import * as tutorsService from "../services/tutorsService";
import { useToast } from "../../../context/toast";
import { ChangeComparison, RecordDetails } from "../../../components/ui/alert/AlertContextualContent";

type Status = "loading" | "success" | "error";

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
};

export const useTutors = () => {
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<Error | null>(null);
  const [loadingAction, setLoadingAction] = useState(false);
  const { addToast } = useToast();

  const refreshTutors = useCallback(async () => {
    setStatus("loading");
    try {
      const data = await tutorsService.getTutors();
      setTutors(data);
      setStatus("success");
      setError(null);
    } catch (e) {
      console.error("Error loading tutors:", e);
      setStatus("error");
      const err = e instanceof Error ? e : new Error("Error al cargar tutores");
      setError(err);
      addToast({
        variant: "error",
        title: "Error de conexión",
        message: "No se pudo conectar con la base de datos o el servidor. Por favor, verifique su conexión.",
      });
    }
  }, [addToast]);

  useEffect(() => {
    refreshTutors();
  }, [refreshTutors]);

  const addTutor = async (tutorData: Omit<Tutor, "tutorId" | "registrationDate">) => {
    setLoadingAction(true);
    try {
      const newTutor = await tutorsService.createTutor(tutorData);
      setTutors(prev => [newTutor, ...prev]);

      addToast({
        variant: "success",
        title: "Tutor Registrado",
        message: (
          <>
            <p>El tutor <strong>{newTutor.firstName} {newTutor.lastName}</strong> ha sido registrado correctamente.</p>
            <RecordDetails
              data={newTutor as unknown as Record<string, unknown>}
              labels={TUTOR_LABELS}
              fields={['identificationNumber', 'profession', 'condition']}
            />
          </>
        )
      });
    } catch (e) {
      console.error("Error adding tutor:", e);
      addToast({
        variant: "error",
        title: "Error al registrar",
        message: "No se pudo registrar el tutor. Intente de nuevo.",
      });
    } finally {
      setLoadingAction(false);
    }
  };

  const editTutor = async (tutorData: Tutor) => {
    setLoadingAction(true);
    try {
      const updatedTutor = await tutorsService.updateTutor(tutorData.tutorId, tutorData);
      const oldTutor = tutors.find(t => t.tutorId === tutorData.tutorId);

      setTutors(prev => prev.map(t => t.tutorId === tutorData.tutorId ? updatedTutor : t));

      addToast({
        variant: "success",
        title: "Actualización Exitosa",
        message: (
          <>
            <p>Se han guardado los cambios para <strong>{updatedTutor.firstName} {updatedTutor.lastName}</strong>.</p>
            {oldTutor && (
              <ChangeComparison
                oldData={oldTutor as unknown as Record<string, unknown>}
                newData={updatedTutor as unknown as Record<string, unknown>}
                labels={TUTOR_LABELS}
              />
            )}
          </>
        )
      });
    } catch (e) {
      console.error("Error editing tutor:", e);
      addToast({
        variant: "error",
        title: "Error al actualizar",
        message: "No se pudo actualizar el tutor. Intente de nuevo.",
      });
    } finally {
      setLoadingAction(false);
    }
  };

  const toggleStatus = async (tutor: Tutor) => {
    setLoadingAction(true);
    try {
      const newStatus = !tutor.status;
      const updatedTutor = await tutorsService.toggleTutorStatus(tutor.tutorId, newStatus);
      
      setTutors(prev => prev.map(t => t.tutorId === tutor.tutorId ? updatedTutor : t));

      addToast({
        variant: newStatus ? "success" : "warning",
        title: newStatus ? "Tutor Restaurado" : "Tutor Inactivado",
        message: (
          <>
            <p>
              El tutor <strong>{tutor.firstName} {tutor.lastName}</strong> ahora está
              <span className={`font-bold ${!newStatus ? 'text-warning-600' : 'text-success-600'}`}>
                {newStatus ? ' ACTIVO' : ' INACTIVO'}
              </span>.
            </p>
          </>
        )
      });
    } catch (e) {
      console.error("Error toggling tutor status:", e);
      addToast({
        variant: "error",
        title: "Error de estado",
        message: "No se pudo cambiar el estado del tutor.",
      });
    } finally {
      setLoadingAction(false);
    }
  };

  const bulkRemoveTutors = async (ids: string[]) => {
    setLoadingAction(true);
    try {
      await Promise.all(ids.map(id => tutorsService.toggleTutorStatus(id, false)));
      setTutors(prev => prev.map(t => ids.includes(t.tutorId) ? { ...t, status: false } : t));
      
      addToast({
        variant: "warning",
        title: "Eliminación Masiva",
        message: (
          <p>Se han inactivado <strong>{ids.length}</strong> tutores correctamente.</p>
        )
      });
    } catch (e) {
      console.error("Error in bulk remove tutors:", e);
      addToast({
        variant: "error",
        title: "Error masivo",
        message: "No se pudieron inactivar todos los tutores seleccionados.",
      });
    } finally {
      setLoadingAction(false);
    }
  };

  const bulkRestoreTutors = async (ids: string[]) => {
    setLoadingAction(true);
    try {
      await Promise.all(ids.map(id => tutorsService.toggleTutorStatus(id, true)));
      setTutors(prev => prev.map(t => ids.includes(t.tutorId) ? { ...t, status: true } : t));

      addToast({
        variant: "success",
        title: "Restauración Masiva",
        message: (
          <p>Se han restaurado <strong>{ids.length}</strong> tutores exitosamente.</p>
        )
      });
    } catch (e) {
      console.error("Error in bulk restore tutors:", e);
      addToast({
        variant: "error",
        title: "Error masivo",
        message: "No se pudieron restaurar todos los tutores seleccionados.",
      });
    } finally {
      setLoadingAction(false);
    }
  };

  return {
    tutors,
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
