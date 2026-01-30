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

/**
 * Hook que expone la lógica de negocio para el módulo de Carreras.
 * 
 * Ahora utiliza el hook genérico useCrud para centralizar la gestión de estado,
 * carga, errores y notificaciones, reduciendo significativamente el boilerplate.
 * 
 * @returns {Object} Estado y funciones para manipular carreras.
 */
export const useCareers = () => {
  const {
    data: careers,
    status,
    loadingAction,
    error,
    searchTerm,
    setSearchTerm,
    refresh: refreshCareers,
    createItem: addCareer,
    updateItem: editCareer,
    deleteItem: removeCareer,
    toggleItemStatus: toggleCareerStatus
  } = useCrud<Career, CreateCareerPayload, UpdateCareerPayload>(careerService, {
    resourceName: "Carrera",
    idField: "careerId",
    filterFn: (c, term) => {
      const lowerTerm = term.toLowerCase();
      return (
        String(c.careerName).toLowerCase().includes(lowerTerm) ||
        String(c.careerCode).toLowerCase().includes(lowerTerm) ||
        String(c.careerAbbreviation).toLowerCase().includes(lowerTerm)
      );
    }
  });

  /**
   * Lista de carreras filtradas por el término de búsqueda actual.
   * Proviene de la lógica centralizada de useCrud.
   */
  const filteredCareers = careers.filter((c) => {
    const term = searchTerm.toLowerCase();
    return (
      String(c.careerName).toLowerCase().includes(term) ||
      String(c.careerCode).toLowerCase().includes(term) ||
      String(c.careerAbbreviation).toLowerCase().includes(term)
    );
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
    toggleCareerStatus
  };
};
