/**
 * @file useRecordAutocomplete.ts
 * @description Hook especializado para autocompletado de registros en formularios.
 * Versión simplificada del hook para uso directo en componentes.
 * 
 * @module hooks/useRecordAutocomplete
 */

import { useState, useCallback, useRef } from "react";

/**
 * Opciones de configuración para el hook de autocompletado.
 */
export interface UseRecordAutocompleteOptions<T> {
  /** Nombre del recurso para mensajes */
  resourceName: string;
  /** Función asíncrona que busca el registro por su clave primaria */
  lookupFn: (key: string) => Promise<T | null>;
  /** Longitud mínima para iniciar la búsqueda */
  minKeyLength?: number;
  /** Ms de debounce */
  debounceMs?: number;
}

/**
 * Resultado del hook de autocompletado.
 */
export interface UseRecordAutocompleteReturn<T> {
  /** Registro encontrado */
  record: T | null;
  /** Flag de búsqueda activa */
  isSearching: boolean;
  /** Modo solo lectura */
  isReadOnly: boolean;
  /** Error de búsqueda */
  searchError: string | null;
  /** Función para ejecutar búsqueda */
  search: (key: string) => Promise<void>;
  /** Habilitar modo edición */
  enableEdit: () => void;
  /** Limpiar/Resetear */
  reset: () => void;
}

/**
 * Hook especializado para autocompletar registros en formularios.
 * 
 * @param options - Configuración del hook
 * @returns Métodos y estado para autocomplete
 * 
 * @example
 * ```tsx
 * const { record, isSearching, isReadOnly, search, enableEdit, reset } = 
 *   useRecordAutocomplete<Institution>({
 *     resourceName: 'Institución',
 *     lookupFn: getInstitutionByRif,
 *     minKeyLength: 10,
 *   });
 * ```
 */
export function useRecordAutocomplete<T>({
  resourceName,
  lookupFn,
  minKeyLength = 5,
  debounceMs = 400,
}: UseRecordAutocompleteOptions<T>): UseRecordAutocompleteReturn<T> {
  const [record, setRecord] = useState<T | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(true);
  const [searchError, setSearchError] = useState<string | null>(null);
  
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reset = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setRecord(null);
    setIsReadOnly(true);
    setSearchError(null);
  }, []);

  const search = useCallback(async (key: string) => {
    const normalized = String(key).trim().replace(/[-\s]/g, '');
    
    if (normalized.length < minKeyLength) return;
    
    if (timerRef.current) clearTimeout(timerRef.current);
    
    timerRef.current = setTimeout(async () => {
      setIsSearching(true);
      setSearchError(null);
      
      try {
        const result = await lookupFn(normalized);
        
        if (result) {
          setRecord(result);
          setIsReadOnly(true);
        } else {
          setRecord(null);
          setIsReadOnly(false);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error en búsqueda';
        setSearchError(msg);
        console.error(`[Autocomplete] Error buscando ${resourceName}:`, err);
      } finally {
        setIsSearching(false);
      }
    }, debounceMs);
  }, [lookupFn, resourceName, minKeyLength, debounceMs]);

  const enableEdit = useCallback(() => {
    setIsReadOnly(false);
  }, []);

  return {
    record,
    isSearching,
    isReadOnly,
    searchError,
    search,
    enableEdit,
    reset,
  };
}

export default useRecordAutocomplete;
