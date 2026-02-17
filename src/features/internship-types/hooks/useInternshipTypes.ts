/**
 * @file useInternshipTypes.ts
 * @description Hook personalizado para orquestar la lógica de negocio del módulo de Tipos de Práctica Profesional.
 * Centraliza las peticiones asíncronas al servicio y gestiona los estados de carga, errores y datos.
 * 
 * @module features/internship-types/hooks
 */

import { useCallback } from "react";
import { 
  InternshipType, 
  CreateInternshipTypePayload, 
  UpdateInternshipTypePayload 
} from "../types";
import { useCrud } from "../../../hooks/useCrud";
import * as internshipTypesService from "../services/internshipTypesService";

const serviceAdapter = {
  getAll: internshipTypesService.getAll,
  create: internshipTypesService.create,
  update: internshipTypesService.update,
  delete: internshipTypesService.remove,
  toggleStatus: internshipTypesService.toggleStatus,
  bulkDelete: internshipTypesService.bulkDelete,
  bulkRestore: internshipTypesService.bulkRestore,
};

/**
 * Hook useInternshipTypes.
 * 
 * Ahora utiliza el hook genérico useCrud para centralizar la gestión de estado,
 * carga, errores y notificaciones, asegurando coherencia en toda la aplicación.
 * 
 * @returns {Object} Estado y funciones para manipular tipos de práctica.
 */
export const useInternshipTypes = () => {
  const {
    data: internshipTypes,
    status,
    loadingAction,
    error,
    refresh: fetchAll,
    createItem: addInternshipType,
    updateItem: editInternshipType,
    deleteItem: removeInternshipType,
    toggleItemStatus: toggleStatus,
    bulkDelete: bulkRemove,
    bulkRestore: bulkRestore,
  } = useCrud<InternshipType, CreateInternshipTypePayload, UpdateInternshipTypePayload>(
    serviceAdapter,
    {
      resourceName: "Tipo de Práctica",
      idField: "id",
    }
  );

  const options = internshipTypesService.mapToOptions(internshipTypes);
  const activeOptions = internshipTypesService.mapToOptions(internshipTypes.filter(t => t.status));
  const isLoading = status === "loading";

  /**
   * Obtiene los tipos de práctica asociados específicamente a una carrera.
   * @param {string | number} careerId - El identificador único de la carrera.
   */
  const fetchByCareer = useCallback(async (careerId: string | number) => {
    if (!careerId) return;
    try {
      // Esta función es específica y no está cubierta por useCrud getAll
      await internshipTypesService.getInternshipTypesByCareer(careerId);
      // Nota: Si necesitamos actualizar el estado global de internshipTypes 
      // con los resultados de esta búsqueda, deberíamos manejarlo con cuidado
      // para no romper la coherencia con useCrud.
    } catch (err) {
      console.error("[useInternshipTypes] Error en fetchByCareer:", err);
    }
  }, []);

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
