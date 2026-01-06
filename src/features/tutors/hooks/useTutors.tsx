/**
 * @file useTutors.tsx
 * @description Hook para la gestión de tutores en modo demostración.
 * Todas las operaciones son locales y no realizan llamadas a API externas.
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
  const [loadingAction, setLoadingAction] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    if (loadingAction) {
      timeoutId = setTimeout(() => {
        setLoadingAction(false);
        console.warn("[useTutors] Timeout de 30s alcanzado. Rehabilitando botones.");
      }, 30000);
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [loadingAction]);

  const refreshTutors = useCallback(async () => {
    setStatus("loading");
    try {
      const data = await tutorsService.getTutors();
      setTutors(data);
      setStatus("success");
    } catch (e) {
      console.error("Error loading tutors:", e);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    refreshTutors();
  }, [refreshTutors]);

  const addTutor = async (tutorData: Omit<Tutor, "tutorId" | "registrationDate">) => {
    setLoadingAction(true);
    await new Promise(resolve => setTimeout(resolve, 800));

    const newTutor: Tutor = {
      ...tutorData,
      tutorId: Math.random().toString(36).substr(2, 9),
      registrationDate: new Date(),
    };

    setTutors(prev => [newTutor, ...prev]);
    setLoadingAction(false);

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
      ),
      onUndo: () => setTutors(prev => prev.filter(t => t.tutorId !== newTutor.tutorId))
    });
  };

  const editTutor = async (tutorData: Tutor) => {
    setLoadingAction(true);
    await new Promise(resolve => setTimeout(resolve, 800));

    const oldTutor = tutors.find(t => t.tutorId === tutorData.tutorId);

    setTutors(prev => prev.map(t => t.tutorId === tutorData.tutorId ? tutorData : t));
    setLoadingAction(false);

    if (oldTutor) {
      addToast({
        variant: "success",
        title: "Actualización Exitosa",
        message: (
          <>
            <p>Se han guardado los cambios para <strong>{tutorData.firstName} {tutorData.lastName}</strong>.</p>
            <ChangeComparison
              oldData={oldTutor as unknown as Record<string, unknown>}
              newData={tutorData as unknown as Record<string, unknown>}
              labels={TUTOR_LABELS}
            />
          </>
        ),
        onUndo: () => setTutors(prev => prev.map(t => t.tutorId === tutorData.tutorId ? oldTutor : t))
      });
    }
  };

  const toggleStatus = async (tutor: Tutor) => {
    setLoadingAction(true);
    await new Promise(resolve => setTimeout(resolve, 600));

    const isInactivating = tutor.status;
    const oldStatus = tutor.status;

    setTutors(prev => prev.map(t => t.tutorId === tutor.tutorId ? { ...t, status: !t.status } : t));
    setLoadingAction(false);

    addToast({
      variant: isInactivating ? "warning" : "success",
      title: isInactivating ? "Tutor Inactivado" : "Tutor Restaurado",
      message: (
        <>
          <p>
            El tutor <strong>{tutor.firstName} {tutor.lastName}</strong> ahora está
            <span className={`font-bold ${isInactivating ? 'text-warning-600' : 'text-success-600'}`}>
              {isInactivating ? ' INACTIVO' : ' ACTIVO'}
            </span>.
          </p>
        </>
      ),
      onUndo: () => setTutors(prev => prev.map(t => t.tutorId === tutor.tutorId ? { ...t, status: oldStatus } : t))
    });
  };

  const bulkRemoveTutors = async (ids: string[]) => {
    setLoadingAction(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    setTutors(prev => prev.map(t => ids.includes(t.tutorId) ? { ...t, status: false } : t));
    setLoadingAction(false);

    addToast({
      variant: "warning",
      title: "Eliminación Masiva",
      message: (
        <p>Se han inactivado <strong>{ids.length}</strong> tutores correctamente.</p>
      ),
      onUndo: () => setTutors(prev => prev.map(t => ids.includes(t.tutorId) ? { ...t, status: true } : t))
    });
  };

  const bulkRestoreTutors = async (ids: string[]) => {
    setLoadingAction(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    setTutors(prev => prev.map(t => ids.includes(t.tutorId) ? { ...t, status: true } : t));
    setLoadingAction(false);

    addToast({
      variant: "success",
      title: "Restauración Masiva",
      message: (
        <p>Se han restaurado <strong>{ids.length}</strong> tutores exitosamente.</p>
      ),
      onUndo: () => setTutors(prev => prev.map(t => ids.includes(t.tutorId) ? { ...t, status: false } : t))
    });
  };

  return {
    tutors,
    status,
    loadingAction,
    error: null,
    addTutor,
    editTutor,
    toggleStatus,
    bulkRemoveTutors,
    bulkRestoreTutors,
  };
};
