/**
 * @file Hook personalizado para la gestión del estado de las carreras.
 */

import { useState, useEffect, useCallback } from "react";
import { Career } from "../types";
import * as careersService from "../services/careersService";
import { useToast } from "../../../context/toast";
import { ChangeComparison, RecordDetails } from "../../../components/ui/alert/AlertContextualContent";

type Status = "loading" | "success" | "error";

const CAREER_LABELS: Record<string, string> = {
  careerCode: "Código",
  careerName: "Nombre de Carrera",
  description: "Descripción",
  modality: "Modalidad",
  faculty: "Facultad",
};

export const useCareers = () => {
  const [careers, setCareers] = useState<Career[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [loadingAction, setLoadingAction] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { addToast } = useToast();

  // Efecto para manejar el timeout de seguridad (30 segundos) en acciones críticas
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    if (loadingAction) {
      timeoutId = setTimeout(() => {
        setLoadingAction(false);
        console.warn("[useCareers] Timeout de 30s alcanzado. Rehabilitando botones.");
      }, 30000);
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [loadingAction]);

  const refreshCareers = useCallback(async () => {
    setStatus("loading");
    // Simulamos un tiempo de carga de 1 segundo para mostrar el spinner
    const startTime = Date.now();
    try {
      const data = await careersService.getCareers();
      const uniqueData = Array.from(
        new Map(data.map((item) => [item.careerId, item])).values()
      );

      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, 1000 - elapsedTime);

      setTimeout(() => {
        setCareers(uniqueData);
        setStatus("success");
      }, remainingTime);
    } catch (e) {
      const err =
        e instanceof Error
          ? e
          : new Error("Error desconocido al cargar carreras");
      setError(err);
      setStatus("error");

      addToast({
        variant: "error",
        title: "Error al cargar carreras",
        message: err.message.includes("404")
          ? "No se pudo encontrar el recurso. Verifique la configuración del servidor."
          : "Hubo un problema de conexión con el servidor.",
      });
    }
  }, [addToast]);

  useEffect(() => {
    refreshCareers();
  }, [refreshCareers]);

  const addCareer = async (
    careerData: Omit<Career, "careerId" | "creationDate">
  ) => {
    setLoadingAction(true);
    try {
      const newCareer = await careersService.createCareer(careerData);
      await refreshCareers();

      addToast({
        variant: "success",
        title: "Carrera Creado",
        message: (
          <>
            <p>La carrera <strong>{careerData.careerName}</strong> ha sido registrada exitosamente.</p>
            <RecordDetails data={careerData as unknown as Record<string, unknown>} labels={CAREER_LABELS} />
          </>
        ),
        onViewDetails: () => console.log("Ver detalles de carrera:", newCareer.careerId),
      });
    } catch (e) {
      const err = e instanceof Error ? e : new Error("Error desconocido al crear");
      addToast({ variant: "error", title: "Error al Crear", message: err.message });
      throw err;
    } finally {
      setLoadingAction(false);
    }
  };

  const editCareer = async (careerData: Career) => {
    setLoadingAction(true);
    try {
      const oldCareer = careers.find(c => c.careerId === careerData.careerId);
      await careersService.updateCareer(careerData);
      await refreshCareers();

      addToast({
        variant: "success",
        title: "Carrera Actualizada",
        message: (
          <>
            <p>Cambios guardados en <strong>{careerData.careerName}</strong>.</p>
            {oldCareer && <ChangeComparison oldData={oldCareer as unknown as Record<string, unknown>} newData={careerData as unknown as Record<string, unknown>} labels={CAREER_LABELS} />}
          </>
        ),
        onUndo: oldCareer ? async () => {
          await careersService.updateCareer(oldCareer);
          await refreshCareers();
        } : undefined
      });
    } catch (e) {
      const err = e instanceof Error ? e : new Error("Error desconocido al actualizar");
      addToast({ variant: "error", title: "Error al Actualizar", message: err.message });
      throw err;
    } finally {
      setLoadingAction(false);
    }
  };

  const removeCareer = async (career: Career) => {
    setLoadingAction(true);
    try {
      await careersService.deleteCareer(career);
      await refreshCareers();
      addToast({
        variant: "warning",
        title: "Carrera Inactivada",
        message: (
          <>
            <p>La carrera <strong>{career.careerName}</strong> ha sido marcada como inactiva.</p>
            <p className="mt-1 text-xs text-gray-500 italic">* Esta acción puede afectar a los estudiantes inscritos.</p>
          </>
        ),
        onUndo: async () => {
          await careersService.toggleCareerStatus(career);
          await refreshCareers();
        }
      });
    } catch (e) {
      const err = e instanceof Error ? e : new Error("Error desconocido al eliminar");
      addToast({ variant: "error", title: "Error al Eliminar", message: err.message });
      throw err;
    } finally {
      setLoadingAction(false);
    }
  };

  const toggleStatus = async (career: Career) => {
    setLoadingAction(true);
    try {
      const newStatus = !career.status;
      await careersService.toggleCareerStatus(career);
      await refreshCareers();
      addToast({
        variant: newStatus ? "success" : "warning",
        title: newStatus ? "Carrera Restaurada" : "Carrera Inactivada",
        message: (
          <>
            <p>La carrera <strong>{career.careerName}</strong> ahora está <strong>{newStatus ? 'activa' : 'inactiva'}</strong>.</p>
            {!newStatus && <p className="mt-1 text-xs text-gray-500 italic">* Los registros asociados seguirán existiendo pero no estarán visibles en búsquedas activas.</p>}
          </>
        ),
        onUndo: async () => {
          await careersService.toggleCareerStatus({ ...career, status: newStatus });
          await refreshCareers();
        }
      });
    } catch (e) {
      const err = e instanceof Error ? e : new Error("Error desconocido al cambiar estado");
      addToast({ variant: "error", title: "Error al Cambiar Estado", message: err.message });
      throw err;
    } finally {
      setLoadingAction(false);
    }
  };

  const bulkRemoveCareers = async (careerIds: string[]) => {
    setLoadingAction(true);
    try {
      const selectedCareers = careers.filter((c) => careerIds.includes(c.careerId));
      await Promise.all(selectedCareers.map((c) => careersService.deleteCareer(c)));
      await refreshCareers();
      addToast({
        variant: "warning",
        title: "Inactivación Masiva",
        message: `${careerIds.length} carreras inactivadas.`
      });
    } catch (e) {
      const err = e instanceof Error ? e : new Error("Error desconocido al eliminar en lote");
      addToast({ variant: "error", title: "Error al Eliminar", message: err.message });
      throw err;
    } finally {
      setLoadingAction(false);
    }
  };

  const bulkRestoreCareers = async (careerIds: string[]) => {
    setLoadingAction(true);
    try {
      const selectedCareers = careers.filter((c) => careerIds.includes(c.careerId));
      await Promise.all(selectedCareers.map((c) => careersService.toggleCareerStatus(c)));
      await refreshCareers();
      addToast({
        variant: "success",
        title: "Restauración Masiva",
        message: (
          <p>Se han restaurado <strong>{careerIds.length}</strong> carreras exitosamente.</p>
        ),
        onUndo: async () => {
          await Promise.all(selectedCareers.map((c) => careersService.deleteCareer(c)));
          await refreshCareers();
        }
      });
    } catch (e) {
      const err = e instanceof Error ? e : new Error("Error desconocido al restaurar masivamente");
      addToast({ variant: "error", title: "Error al Restaurar", message: err.message });
      throw err;
    } finally {
      setLoadingAction(false);
    }
  };

  return {
    careers,
    status,
    loadingAction,
    error,
    refreshCareers,
    addCareer,
    editCareer,
    removeCareer,
    toggleStatus,
    bulkRemoveCareers,
    bulkRestoreCareers,
  };
};
