/**
 * @file useInternshipTypes.ts
 * @description Hook personalizado para la gestión de Tipos de Pasantía.
 * Centraliza la lógica de carga, creación, actualización y eliminación.
 * 
 * @module features/internship-types/hooks
 */

import { useState, useCallback } from "react";
import { 
  InternshipType, 
  InternshipTypeOption, 
  CreateInternshipTypePayload, 
  UpdateInternshipTypePayload 
} from "../types";
import * as internshipTypesService from "../services/internshipTypesService";

/**
 * Hook que expone el estado y las acciones para Tipos de Pasantía.
 * 
 * @returns {Object} Estado de carga, errores y funciones de manipulación.
 */
export const useInternshipTypes = () => {
  const [internshipTypes, setInternshipTypes] = useState<InternshipType[]>([]);
  const [options, setOptions] = useState<InternshipTypeOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Carga todos los tipos de pasantía disponibles.
   * @async
   */
  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await internshipTypesService.getInternshipTypes();
      setInternshipTypes(data);
      setOptions(internshipTypesService.mapToOptions(data));
    } catch (err) {
      setError("Error al cargar tipos de pasantías");
      console.error("[useInternshipTypes] Error en fetchAll:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Carga los tipos de pasantía filtrados por carrera.
   * @async
   * @param {string | number} careerId - ID de la carrera.
   */
  const fetchByCareer = useCallback(async (careerId: string | number) => {
    if (!careerId) {
      setInternshipTypes([]);
      setOptions([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await internshipTypesService.getInternshipTypesByCareer(careerId);
      setInternshipTypes(data);
      setOptions(internshipTypesService.mapToOptions(data));
    } catch (err) {
      setError(`Error al cargar tipos de prácticas profesionales para la carrera ${careerId}`);
      console.error("[useInternshipTypes] Error en fetchByCareer:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Crea un nuevo tipo de pasantía.
   * @async
   * @param {CreateInternshipTypePayload} data - Datos del nuevo tipo.
   */
  const addInternshipType = async (data: CreateInternshipTypePayload) => {
    setLoadingAction(true);
    try {
      await internshipTypesService.createInternshipType(data);
      await fetchAll();
    } catch (err) {
      setError("Error al crear tipo de pasantía");
      console.error("[useInternshipTypes] Error en addInternshipType:", err);
      throw err;
    } finally {
      setLoadingAction(false);
    }
  };

  /**
   * Actualiza un tipo de pasantía existente.
   * @async
   * @param {number} id - ID del tipo.
   * @param {UpdateInternshipTypePayload} data - Datos a actualizar.
   */
  const editInternshipType = async (id: number, data: UpdateInternshipTypePayload) => {
    setLoadingAction(true);
    try {
      await internshipTypesService.updateInternshipType(id, data);
      await fetchAll();
    } catch (err) {
      setError("Error al actualizar tipo de pasantía");
      console.error("[useInternshipTypes] Error en editInternshipType:", err);
      throw err;
    } finally {
      setLoadingAction(false);
    }
  };

  /**
   * Elimina un tipo de pasantía.
   * @async
   * @param {number} id - ID del tipo.
   */
  const removeInternshipType = async (id: number) => {
    setLoadingAction(true);
    try {
      await internshipTypesService.deleteInternshipType(id);
      await fetchAll();
    } catch (err) {
      setError("Error al eliminar tipo de pasantía");
      console.error("[useInternshipTypes] Error en removeInternshipType:", err);
      throw err;
    } finally {
      setLoadingAction(false);
    }
  };

  /**
   * Cambia el estado de activación de un tipo.
   * @async
   * @param {number} id - ID del tipo.
   */
  const toggleStatus = async (id: number) => {
    setLoadingAction(true);
    try {
      await internshipTypesService.toggleInternshipTypeStatus(id);
      await fetchAll();
    } catch (err) {
      setError("Error al cambiar estado del tipo de pasantía");
      console.error("[useInternshipTypes] Error en toggleStatus:", err);
      throw err;
    } finally {
      setLoadingAction(false);
    }
  };

  /**
   * Realiza la eliminación masiva de varios tipos.
   * @async
   * @param {number[]} ids - Lista de IDs.
   */
  const bulkRemove = async (ids: number[]) => {
    setLoadingAction(true);
    try {
      await internshipTypesService.bulkDeleteInternshipTypes(ids);
      await fetchAll();
    } catch (err) {
      setError("Error en eliminación masiva");
      console.error("[useInternshipTypes] Error en bulkRemove:", err);
      throw err;
    } finally {
      setLoadingAction(false);
    }
  };

  /**
   * Realiza la restauración masiva de varios tipos.
   * @async
   * @param {number[]} ids - Lista de IDs.
   */
  const bulkRestore = async (ids: number[]) => {
    setLoadingAction(true);
    try {
      await internshipTypesService.bulkRestoreInternshipTypes(ids);
      await fetchAll();
    } catch (err) {
      setError("Error en restauración masiva");
      console.error("[useInternshipTypes] Error en bulkRestore:", err);
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
