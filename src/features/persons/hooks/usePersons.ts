/**
 * @file usePersons.ts
 * @description Hook personalizado para la gestión de la superentidad Persona.
 * Provee operaciones CRUD para t_persons con manejo de estados de carga y errores.
 */

import { useState, useCallback } from "react";
import * as personService from "../services/personService";
import { Persona, CreatePersonaPayload, UpdatePersonaPayload } from "../types";

/**
 * Hook usePersons.
 * Maneja el estado y operaciones CRUD para la superentidad Persona.
 */
export const usePersons = () => {
  const [persons, setPersons] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Obtiene el listado paginado de personas.
   */
  const fetchPersons = useCallback(async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: number;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const result = await personService.getPersons(params);
      setPersons(result.data);
      return result;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error al obtener personas";
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Busca personas globalmente.
   */
  const searchPersons = useCallback(async (query: string): Promise<Persona[]> => {
    try {
      return await personService.searchPersons(query);
    } catch (err: unknown) {
      console.error("[usePersons] Error en búsqueda:", err);
      return [];
    }
  }, []);

  /**
   * Obtiene una persona por ID y la agrega al estado si no existe.
   */
  const fetchPersonById = useCallback(async (personId: number): Promise<Persona | null> => {
    try {
      const person = await personService.getPersonById(personId);
      if (person) {
        setPersons((prev) => {
          const exists = prev.some((p) => p.personId === person.personId);
          return exists ? prev : [...prev, person];
        });
      }
      return person;
    } catch (err: unknown) {
      console.error("[usePersons] Error al obtener persona:", err);
      return null;
    }
  }, []);

  /**
   * Crea una nueva persona.
   */
  const addPerson = useCallback(async (data: CreatePersonaPayload): Promise<Persona | null> => {
    try {
      const newPerson = await personService.createPerson(data);
      setPersons((prev) => [...prev, newPerson]);
      return newPerson;
    } catch (err: unknown) {
      console.error("[usePersons] Error al crear persona:", err);
      throw err;
    }
  }, []);

  /**
   * Actualiza una persona existente.
   */
  const editPerson = useCallback(async (personId: number, data: UpdatePersonaPayload): Promise<Persona | null> => {
    try {
      const updated = await personService.updatePerson(personId, data);
      setPersons((prev) => prev.map((p) => (p.personId === personId ? updated : p)));
      return updated;
    } catch (err: unknown) {
      console.error("[usePersons] Error al actualizar persona:", err);
      throw err;
    }
  }, []);

  /**
   * Busca una persona por cédula.
   */
  const fetchPersonByCi = useCallback(async (ci: string): Promise<Persona | null> => {
    try {
      return await personService.getPersonByCi(ci);
    } catch (err: unknown) {
      console.error("[usePersons] Error al buscar por CI:", err);
      return null;
    }
  }, []);

  return {
    persons,
    loading,
    error,
    fetchPersons,
    searchPersons,
    fetchPersonById,
    fetchPersonByCi,
    addPerson,
    editPerson,
  };
};
