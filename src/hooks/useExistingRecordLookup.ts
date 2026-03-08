/**
 * @file useExistingRecordLookup.ts
 * @description Hook genérico para búsqueda y autocompletado de registros existentes.
 * Implementa el patrón de lookup por primary key con modo solo lectura y edición.
 * 
 * @module hooks/useExistingRecordLookup
 */

import { useState, useCallback, useRef } from "react";

/**
 * Configuración para el hook de lookup.
 * @template T - Tipo de datos del registro
 */
export interface UseExistingRecordLookupOptions<T> {
  /** Nombre del recurso para mensajes (ej: "Estudiante", "Tutor") */
  resourceName: string;
  /** Función para buscar registro por el identificador único */
  lookupByKey: (keyValue: string) => Promise<T | null>;
  /** Duración del debounce para la búsqueda (ms) */
  debounceMs?: number;
  /** Longitud mínima del valor para iniciar búsqueda */
  minLength?: number;
}

/**
 * Estado de retorno del hook.
 * @template T - Tipo de datos del registro
 */
export interface UseExistingRecordLookupReturn<T> {
  /** Registro existente encontrado (null si no existe o no se ha buscado) */
  existingRecord: T | null;
  /** Indica si se está buscando un registro */
  isLoading: boolean;
  /** Indica si el modo es solo lectura */
  isViewOnlyMode: boolean;
  /** Error en la búsqueda (si existe) */
  error: string | null;
  /** Función para iniciar la búsqueda por primary key */
  searchRecord: (keyValue: string) => Promise<void>;
  /** Función para habilitar el modo edición */
  enableEditMode: () => void;
  /** Función para limpiar el registro existente y reiniciar */
  clearRecord: () => void;
  /** Función para establecer manualmente un registro existente */
  setExistingRecord: (record: T | null) => void;
}

/**
 * Hook genérico para búsqueda y autocompletado de registros existentes.
 * 
 * Funcionamiento:
 * 1. El usuario ingresa el primary key (cédula, RIF, código, etc.)
 * 2. Al perder el foco o presionar enter, se ejecuta la búsqueda
 * 3. Si existe, se autocompleta el formulario y se bloquean los campos
 * 4. Se muestra botón para habilitar edición si el usuario desea modificar
 * 
 * @param options - Configuración del hook
 * @returns Objeto con estado y funciones de control
 * 
 * @example
 * ```tsx
 * const { 
 *   existingRecord, 
 *   isLoading, 
 *   isViewOnlyMode, 
 *   searchRecord, 
 *   enableEditMode, 
 *   clearRecord 
 * } = useExistingRecordLookup<Student>({
 *   resourceName: "Estudiante",
 *   lookupByKey: getStudentByCi,
 * });
 * ```
 */
export function useExistingRecordLookup<T>({
  resourceName,
  lookupByKey,
  debounceMs = 300,
  minLength = 5,
}: UseExistingRecordLookupOptions<T>): UseExistingRecordLookupReturn<T> {
  const [existingRecord, setExistingRecord] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isViewOnlyMode, setIsViewOnlyMode] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Limpia el timer de debounce al desmontar el componente.
   */
  const cleanup = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  }, []);

  /**
   * Busca un registro por su clave primaria.
   * Implementa debounce para evitar múltiples llamadas consecutivas.
   * 
   * @param keyValue - Valor del primary key a buscar
   * @returns Promise<void>
   */
  const searchRecord = useCallback(async (keyValue: string): Promise<void> => {
    const normalizedValue = String(keyValue).trim();
    
    if (normalizedValue.length < minLength) {
      return;
    }

    cleanup();

    debounceTimerRef.current = setTimeout(async () => {
      setIsLoading(true);
      setError(null);

      try {
        const record = await lookupByKey(normalizedValue);
        
        if (record) {
          setExistingRecord(record);
          setIsViewOnlyMode(true);
        } else {
          setExistingRecord(null);
          setIsViewOnlyMode(false);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Error al buscar registro";
        setError(errorMessage);
        console.error(`[useExistingRecordLookup] Error buscando ${resourceName}:`, err);
      } finally {
        setIsLoading(false);
      }
    }, debounceMs);
  }, [lookupByKey, resourceName, minLength, debounceMs, cleanup]);

  /**
   * Habilita el modo edición, permitiendo modificar los campos del formulario.
   */
  const enableEditMode = useCallback(() => {
    setIsViewOnlyMode(false);
  }, []);

  /**
   * Limpia el registro existente y reinicia el estado.
   */
  const clearRecord = useCallback(() => {
    setExistingRecord(null);
    setIsViewOnlyMode(false);
    setError(null);
    cleanup();
  }, [cleanup]);

  return {
    existingRecord,
    isLoading,
    isViewOnlyMode,
    error,
    searchRecord,
    enableEditMode,
    clearRecord,
    setExistingRecord,
  };
}

export default useExistingRecordLookup;
