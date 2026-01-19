import { useState, useCallback } from "react";
import { InternshipType, InternshipTypeOption } from "../types";
import { 
  getInternshipTypes, 
  getInternshipTypesByCareer, 
  mapToOptions,
  createInternshipType,
  updateInternshipType,
  deleteInternshipType,
  toggleInternshipTypeStatus,
  bulkDeleteInternshipTypes,
  bulkRestoreInternshipTypes
} from "../services/internshipTypesService";

export const useInternshipTypes = () => {
  const [internshipTypes, setInternshipTypes] = useState<InternshipType[]>([]);
  const [options, setOptions] = useState<InternshipTypeOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getInternshipTypes();
      setInternshipTypes(data);
      setOptions(mapToOptions(data));
    } catch (err) {
      setError("Error al cargar tipos de pasantías");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchByCareer = useCallback(async (careerId: string | number): Promise<InternshipType[]> => {
    if (!careerId) {
      setInternshipTypes([]);
      setOptions([]);
      return [];
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await getInternshipTypesByCareer(careerId);
      setInternshipTypes(data);
      setOptions(mapToOptions(data));
      return data;
    } catch (err) {
      setError(`Error al cargar tipos de prácticas profesionales para la carrera ${careerId}`);
      console.error(err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addInternshipType = async (data: Omit<InternshipType, "INTERNSHIP_TYPE_ID" | "CREATION_DATE">) => {
    setLoadingAction(true);
    try {
      await createInternshipType(data);
      await fetchAll();
    } catch (err) {
      setError("Error al crear tipo de pasantía");
      throw err;
    } finally {
      setLoadingAction(false);
    }
  };

  const editInternshipType = async (id: number, data: Partial<InternshipType>) => {
    setLoadingAction(true);
    try {
      await updateInternshipType(id, data);
      await fetchAll();
    } catch (err) {
      setError("Error al actualizar tipo de pasantía");
      throw err;
    } finally {
      setLoadingAction(false);
    }
  };

  const removeInternshipType = async (id: number) => {
    setLoadingAction(true);
    try {
      await deleteInternshipType(id);
      await fetchAll();
    } catch (err) {
      setError("Error al eliminar tipo de pasantía");
      throw err;
    } finally {
      setLoadingAction(false);
    }
  };

  const toggleStatus = async (id: number) => {
    setLoadingAction(true);
    try {
      await toggleInternshipTypeStatus(id);
      await fetchAll();
    } catch (err) {
      setError("Error al cambiar estado del tipo de pasantía");
      throw err;
    } finally {
      setLoadingAction(false);
    }
  };

  const bulkRemove = async (ids: number[]) => {
    setLoadingAction(true);
    try {
      await bulkDeleteInternshipTypes(ids);
      await fetchAll();
    } catch (err) {
      setError("Error en eliminación masiva");
      throw err;
    } finally {
      setLoadingAction(false);
    }
  };

  const bulkRestore = async (ids: number[]) => {
    setLoadingAction(true);
    try {
      await bulkRestoreInternshipTypes(ids);
      await fetchAll();
    } catch (err) {
      setError("Error en restauración masiva");
      throw err;
    } finally {
      setLoadingAction(false);
    }
  };

  return {
    internshipTypes,
    options,
    isLoading,
    loadingAction,
    error,
    fetchAll,
    fetchByCareer,
    addInternshipType,
    editInternshipType,
    removeInternshipType,
    toggleStatus,
    bulkRemove,
    bulkRestore,
  };
};
