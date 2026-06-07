/**
 * @file useCareers.tsx
 * @description Hook personalizado para la gestión integral del estado de las carreras.
 * Maneja la carga, filtrado, creación, actualización y eliminación de carreras,
 * incluyendo estados de carga y notificaciones de éxito/error.
 * 
 * @module features/careers/hooks
 */

import { careerService } from "../services/careersService";
import { useCrud } from "../../../hooks/useCrud";
import { Career, CreateCareerPayload, UpdateCareerPayload } from "../types";
import { matchSearch } from "../../../utils/searchNormalizer";

/**
 * Hook que expone la lógica de negocio para el módulo de Carreras.
 * 
 * Ahora utiliza el hook genérico useCrud para centralizar la gestión de estado,
 * carga, errores y notificaciones, reduciendo significativamente el boilerplate.
 * 
 * @returns {Object} Estado y funciones para manipular carreras.
 */
export const useCareers = (options?: { autoLoad?: boolean }) => {
  const {
    data: careers,
    filteredData: filteredCareers,
    status,
    loadingAction,
    error,
    searchTerm,
    setSearchTerm,
    refresh: refreshCareers,
    createItem: addCareer,
    updateItem: editCareer,
    deleteItem: removeCareer,
    toggleItemStatus: toggleCareerStatus,
    bulkDelete: bulkRemoveCareers,
    bulkRestore: bulkRestoreCareers
  } = useCrud<Career, CreateCareerPayload, UpdateCareerPayload>(careerService, {
    resourceName: "Carrera",
    idField: "careerId",
    autoLoad: options?.autoLoad ?? true,
    filterFn: (c, term) => {
      return (
        matchSearch(String(c.careerName), term) ||
        matchSearch(String(c.careerCode), term) ||
        matchSearch(String(c.careerAbbreviation), term)
      );
    }
  });

  return {
    careers,
    filteredCareers,
    status,
    loadingAction,
    error,
    searchTerm,
    setSearchTerm,
    refreshCareers,
    addCareer,
    editCareer,
    removeCareer,
    toggleCareerStatus,
    bulkRemoveCareers,
    bulkRestoreCareers
  };
};
