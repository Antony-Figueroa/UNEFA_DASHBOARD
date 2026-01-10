import { useState, useCallback } from "react";
import { InternshipType, InternshipTypeOption } from "../types";
import { getInternshipTypes, getInternshipTypesByCareer, mapToOptions } from "../services/internshipTypesService";

export const useInternshipTypes = () => {
  const [internshipTypes, setInternshipTypes] = useState<InternshipType[]>([]);
  const [options, setOptions] = useState<InternshipTypeOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
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

  const fetchByCareer = useCallback(async (careerId: string | number) => {
    if (!careerId) {
      setInternshipTypes([]);
      setOptions([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await getInternshipTypesByCareer(careerId);
      setInternshipTypes(data);
      setOptions(mapToOptions(data));
    } catch (err) {
      setError(`Error al cargar tipos de pasantías para la carrera ${careerId}`);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    internshipTypes,
    options,
    isLoading,
    error,
    fetchAll,
    fetchByCareer,
  };
};
