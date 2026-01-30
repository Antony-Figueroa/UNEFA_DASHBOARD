import { useState, useCallback } from "react";
import * as listsService from "../services/listsService";
import { List, ListsDictionary } from "../types";

/**
 * Hook personalizado para gestionar el estado y las operaciones de las listas dinámicas del sistema.
 * Proporciona métodos para obtener listas individuales, múltiples o todas las listas,
 * manejando automáticamente los estados de carga (loading) y error.
 * 
 * @returns Un objeto con el estado de carga, errores y funciones para consultar listas.
 * 
 * @example
 * ```tsx
 * const { fetchMultipleLists, loading, error } = useLists();
 * 
 * useEffect(() => {
 *   const loadData = async () => {
 *     const data = await fetchMultipleLists(['GENDER', 'DOCUMENT_TYPES']);
 *     // ... usar data
 *   };
 *   loadData();
 * }, [fetchMultipleLists]);
 * ```
 */
export const useLists = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Obtiene todas las listas disponibles en el sistema con sus valores anidados.
   * 
   * @returns Una promesa que se resuelve con un array de objetos List.
   * @throws Error si la petición falla.
   */
  const fetchAllLists = useCallback(async (): Promise<List[]> => {
    setLoading(true);
    setError(null);
    try {
      return await listsService.getAllLists();
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Error fetching lists");
      setError(error);
      console.error("[useLists:fetchAllLists]", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Obtiene una lista específica por su nombre/clave única.
   * 
   * @param name - El nombre único de la lista a consultar (ej. 'CAREERS').
   * @returns Una promesa que se resuelve con el objeto List correspondiente.
   * @throws Error si la lista no existe o la petición falla.
   */
  const fetchListByName = useCallback(async (name: string): Promise<List> => {
    setLoading(true);
    setError(null);
    try {
      return await listsService.getListByName(name);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(`Error fetching list ${name}`);
      setError(error);
      console.error(`[useLists:fetchListByName] name=${name}`, error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Obtiene múltiples listas en una sola petición.
   * Útil para cargar diccionarios de datos necesarios en formularios complejos.
   * 
   * @param names - Array de nombres de las listas a consultar.
   * @returns Una promesa que se resuelve con un objeto ListsDictionary (clave: nombre, valor: List).
   * @throws Error si la petición falla.
   */
  const fetchMultipleLists = useCallback(async (names: string[]): Promise<ListsDictionary> => {
    setLoading(true);
    setError(null);
    try {
      return await listsService.getMultipleListsByNames(names);
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Error fetching multiple lists");
      setError(error);
      console.error("[useLists:fetchMultipleLists]", { names, error });
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    fetchAllLists,
    fetchListByName,
    fetchMultipleLists
  };
};
