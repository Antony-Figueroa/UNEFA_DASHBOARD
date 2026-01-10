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
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCareers = careers.filter((c) => {
    const matchesSearch = String(c.careerName).toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(c.careerCode).toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

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
    const startTime = Date.now();
    try {
      const data = await careersService.getCareers();
      
      // Verificamos si los datos vienen del fallback estático (IDs empiezan con 'static-')
      const isFallback = data.some(c => String(c.careerId).startsWith('static-'));

      const uniqueData = Array.from(
        new Map(data.map((item) => [item.careerId, item])).values()
      );

      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, 1000 - elapsedTime);

      setTimeout(() => {
        setCareers(uniqueData);
        setStatus("success");
        
        if (isFallback) {
          addToast({
            variant: "warning",
            title: "Modo Offline / Backup",
            message: "No se pudo conectar con el servidor. Mostrando datos de respaldo locales.",
          });
        }
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
        title: "Carrera Creada",
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
      const oldCareer = careers.find(c => String(c.careerId) === String(careerData.careerId));
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

  const removeCareer = async (careerId: string | number) => {
    setLoadingAction(true);
    try {
      const career = careers.find((c) => String(c.careerId) === String(careerId));
      if (!career) throw new Error("Carrera no encontrada");

      await careersService.deleteCareer(careerId);
      await refreshCareers();

      addToast({
        variant: "error",
        title: "Carrera Eliminada",
        message: `La carrera ${career.careerName} ha sido eliminada permanentemente.`,
      });
    } catch (e) {
      const err = e instanceof Error ? e : new Error("Error al eliminar carrera");
      addToast({ variant: "error", title: "Error", message: err.message });
    } finally {
      setLoadingAction(false);
    }
  };

  const toggleStatus = async (careerId: string | number) => {
    setLoadingAction(true);
    try {
      const career = careers.find((c) => String(c.careerId) === String(careerId));
      if (!career) throw new Error("Carrera no encontrada");

      // Alternar entre 1 (activo) y 0 (inactivo) o boolean
      const currentStatus = career.status === true || career.status === 1;
      const newStatus = currentStatus ? 0 : 1;
      
      await careersService.updateCareer({ ...career, status: newStatus });
      await refreshCareers();

      addToast({
        variant: "info",
        title: "Estado Actualizado",
        message: `La carrera ahora está ${!currentStatus ? "Activa" : "Inactiva"}.`,
      });
    } catch (e) {
      const err = e instanceof Error ? e : new Error("Error al cambiar estado");
      addToast({ variant: "error", title: "Error", message: err.message });
    } finally {
      setLoadingAction(false);
    }
  };

  const bulkRemoveCareers = async (careerIds: (string | number)[]) => {
    setLoadingAction(true);
    try {
      const selectedCareers = careers.filter((c) => careerIds.map(id => String(id)).includes(String(c.careerId)));
      await Promise.all(selectedCareers.map((c) => careersService.deleteCareer(c.careerId)));
      await refreshCareers();
      addToast({
        variant: "warning",
        title: "Eliminación Masiva",
        message: `${careerIds.length} carreras eliminadas.`
      });
    } catch (e) {
      const err = e instanceof Error ? e : new Error("Error desconocido al eliminar en lote");
      addToast({ variant: "error", title: "Error al Eliminar", message: err.message });
      throw err;
    } finally {
      setLoadingAction(false);
    }
  };

  const bulkRestoreCareers = async (careerIds: (string | number)[]) => {
    setLoadingAction(true);
    try {
      const selectedCareers = careers.filter((c) => careerIds.map(id => String(id)).includes(String(c.careerId)));
      // Para restaurar, simplemente cambiamos el estado a activo (1)
      await Promise.all(selectedCareers.map((c) => careersService.updateCareer({ ...c, status: 1 })));
      await refreshCareers();
      addToast({
        variant: "success",
        title: "Restauración Masiva",
        message: (
          <p>Se han restaurado <strong>{careerIds.length}</strong> carreras exitosamente.</p>
        ),
        onUndo: async () => {
          await Promise.all(selectedCareers.map((c) => careersService.deleteCareer(c.careerId)));
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
    searchTerm,
    setSearchTerm,
    filteredCareers,
  };
};
