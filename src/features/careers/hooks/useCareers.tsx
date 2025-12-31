/**
 * @file Hook personalizado para la gestión del estado de las carreras.
 */

import { useState, useEffect, useCallback } from "react";
import { Career } from "../types";
import * as careersService from "../services/careersService";

type Status = "loading" | "success" | "error";

interface PageAlert {
  variant: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
}

export const useCareers = () => {
  const [careers, setCareers] = useState<Career[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<Error | null>(null);
  const [pageAlert, setPageAlert] = useState<PageAlert | null>(null);

  const showAlert = (
    variant: PageAlert["variant"],
    title: string,
    message: string
  ) => {
    setPageAlert({ variant, title, message });
    setTimeout(() => setPageAlert(null), 5000);
  };

  const refreshCareers = useCallback(async () => {
    setStatus("loading");
    try {
      const data = await careersService.getCareers();
      const uniqueData = Array.from(
        new Map(data.map((item) => [item.careerId, item])).values()
      );
      setCareers(uniqueData);
      setStatus("success");
    } catch (e) {
      const err =
        e instanceof Error
          ? e
          : new Error("Error desconocido al cargar carreras");
      setError(err);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    refreshCareers();
  }, [refreshCareers]);

  const addCareer = async (
    careerData: Omit<Career, "careerId" | "creationDate">
  ) => {
    try {
      await careersService.createCareer(careerData);
      await refreshCareers();
      showAlert("success", "Éxito", "Carrera creada correctamente.");
    } catch (e) {
      const err =
        e instanceof Error ? e : new Error("Error desconocido al crear");
      showAlert("error", "Error al Crear", err.message);
      throw err;
    }
  };

  const editCareer = async (careerData: Career) => {
    try {
      await careersService.updateCareer(careerData);
      await refreshCareers();
      showAlert("success", "Éxito", "Carrera actualizada correctamente.");
    } catch (e) {
      const err =
        e instanceof Error
          ? e
          : new Error("Error desconocido al actualizar");
      showAlert("error", "Error al Actualizar", err.message);
      throw err;
    }
  };

  const removeCareer = async (career: Career) => {
    try {
      await careersService.deleteCareer(career);
      await refreshCareers();
      showAlert("success", "Éxito", "Carrera eliminada correctamente.");
    } catch (e) {
      const err =
        e instanceof Error
          ? e
          : new Error("Error desconocido al eliminar");
      showAlert("error", "Error al Eliminar", err.message);
      throw err;
    }
  };

  const toggleStatus = async (career: Career) => {
    try {
      await careersService.toggleCareerStatus(career);
      await refreshCareers();
      showAlert("success", "Éxito", "Estado de carrera actualizado.");
    } catch (e) {
      const err =
        e instanceof Error
          ? e
          : new Error("Error desconocido al cambiar estado");
      showAlert("error", "Error al Cambiar Estado", err.message);
      throw err;
    }
  };

  return {
    careers,
    status,
    error,
    pageAlert,
    setPageAlert,
    refreshCareers,
    addCareer,
    editCareer,
    removeCareer,
    toggleStatus,
  };
};

