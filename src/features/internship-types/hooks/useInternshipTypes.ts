/**
 * @file useInternshipTypes.ts
 * @description Hook personalizado para orquestar la lógica de negocio del módulo de Tipos de Práctica Profesional.
 * Centraliza las peticiones asíncronas al servicio y gestiona los estados de carga, errores y datos.
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
 * Hook useInternshipTypes.
 * 
 * Proporciona una interfaz simplificada para que los componentes interactúen con los datos
 * de tipos de práctica profesional, abstrayendo la complejidad de las peticiones a la API.
 * 
 * @returns {Object} Un objeto con:
 * - `internshipTypes`: Lista completa de tipos de práctica.
 * - `options`: Tipos mapeados para componentes Select.
 * - `activeOptions`: Tipos activos mapeados para componentes Select.
 * - `isLoading`: Estado de carga inicial (GET).
 * - `loadingAction`: Estado de carga para mutaciones (POST, PUT, DELETE).
 * - `error`: Mensaje de error si algo falla.
 * - Funciones para CRUD y acciones masivas.
 */
export const useInternshipTypes = () => {
  const [internshipTypes, setInternshipTypes] = useState<InternshipType[]>([]);
  const [options, setOptions] = useState<InternshipTypeOption[]>([]);
  const [activeOptions, setActiveOptions] = useState<InternshipTypeOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Obtiene todos los tipos de práctica desde el servidor.
   * Actualiza los estados de datos y opciones mapeadas.
   */
  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await internshipTypesService.getInternshipTypes();
      setInternshipTypes(data);
      setOptions(internshipTypesService.mapToOptions(data));
      setActiveOptions(internshipTypesService.mapToOptions(data.filter(t => t.status)));
    } catch (err) {
      setError("Error al cargar tipos de prácticas profesionales");
      console.error("[useInternshipTypes] Error en fetchAll:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Obtiene los tipos de práctica asociados específicamente a una carrera.
   * @param {string | number} careerId - El identificador único de la carrera.
   */
  const fetchByCareer = useCallback(async (careerId: string | number) => {
    if (!careerId) {
      setInternshipTypes([]);
      setOptions([]);
      setActiveOptions([]);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const data = await internshipTypesService.getInternshipTypesByCareer(careerId);
      setInternshipTypes(data);
      setOptions(internshipTypesService.mapToOptions(data));
      setActiveOptions(internshipTypesService.mapToOptions(data.filter(t => t.status)));
    } catch (err) {
      setError(`Error al cargar tipos de prácticas profesionales para la carrera ${careerId}`);
      console.error("[useInternshipTypes] Error en fetchByCareer:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Registra un nuevo tipo de práctica profesional.
   * @param {CreateInternshipTypePayload} data - Los datos del nuevo registro.
   */
  const addInternshipType = async (data: CreateInternshipTypePayload) => {
    setLoadingAction(true);
    try {
      await internshipTypesService.createInternshipType(data);
      await fetchAll();
    } catch (err) {
      setError("Error al crear tipo de práctica profesional");
      console.error("[useInternshipTypes] Error en addInternshipType:", err);
      throw err;
    } finally {
      setLoadingAction(false);
    }
  };

  /**
   * Actualiza la información de un tipo de práctica existente.
   * @param {number} id - ID del registro a modificar.
   * @param {UpdateInternshipTypePayload} data - Nuevos datos.
   */
  const editInternshipType = async (id: number, data: UpdateInternshipTypePayload) => {
    setLoadingAction(true);
    try {
      await internshipTypesService.updateInternshipType(id, data);
      await fetchAll();
    } catch (err) {
      setError("Error al actualizar tipo de práctica profesional");
      console.error("[useInternshipTypes] Error en editInternshipType:", err);
      throw err;
    } finally {
      setLoadingAction(false);
    }
  };

  /**
   * Elimina de forma lógica un tipo de práctica del sistema.
   * @param {number} id - ID del registro.
   */
  const removeInternshipType = async (id: number) => {
    setLoadingAction(true);
    try {
      await internshipTypesService.deleteInternshipType(id);
      await fetchAll();
    } catch (err) {
      setError("Error al eliminar tipo de práctica profesional");
      console.error("[useInternshipTypes] Error en removeInternshipType:", err);
      throw err;
    } finally {
      setLoadingAction(false);
    }
  };

  /**
   * Alterna el estado (Activo/Inactivo) de un tipo de práctica.
   * Útil para restaurar elementos o desactivarlos sin borrarlos permanentemente.
   * @param {number} id - ID del registro.
   */
  const toggleStatus = async (id: number) => {
    setLoadingAction(true);
    try {
      await internshipTypesService.toggleInternshipTypeStatus(id);
      await fetchAll();
    } catch (err) {
      setError("Error al cambiar estado del tipo de práctica profesional");
      console.error("[useInternshipTypes] Error en toggleStatus:", err);
      throw err;
    } finally {
      setLoadingAction(false);
    }
  };

  /**
   * Ejecuta la eliminación masiva para múltiples registros.
   * @param {number[]} ids - Array de identificadores.
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
   * Ejecuta la restauración masiva para múltiples registros inactivos.
   * @param {number[]} ids - Array de identificadores.
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
    activeOptions,
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
