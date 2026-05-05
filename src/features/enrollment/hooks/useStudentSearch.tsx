/**
 * @file useStudentSearch.tsx
 * @description Hook para búsqueda de estudiantes en el proceso de inscripción.
 * Proporciona búsqueda optimizada por CI con manejo completo de estados.
 */

import { useState, useCallback, useEffect, useRef } from "react";
import apiClient from "../../../api/apiClient";

/** Estados posibles de la búsqueda */
export type SearchStatus =
  | "idle"           // Sin búsqueda aún
  | "searching"      // Buscando en progreso
  | "found"          // Estudiante válido encontrado
  | "not_found"      // Estudiante no existe en BD
  | "already_enrolled"   // Ya tiene inscripción activa
  | "already_culminated" // Ya tiene inscripción culminada
  | "no_pre_enrollment"   // No tiene pre-inscripción activa
  | "error";         // Error de red/servidor

/** Datos del estudiante encontrado */
export interface StudentSearchData {
  id: number;
  ci: string;
  name: string;
  surname: string;
  careerId: number | null;
  careerName: string | null;
  regime: string | null;
  semester: string | null;
  section: string | null;
  status: number;
}

/** Datos de pre-inscripción */
export interface PreEnrollmentData {
  active: boolean;
  period: string;
  practiceType: string;
}

/** Datos de inscripción */
export interface EnrollmentData {
  status: "active" | "culminated" | "none";
  enrollmentCode?: string;
}

/** Estado completo de la búsqueda */
export interface StudentSearchResult {
  status: SearchStatus;
  student: StudentSearchData | null;
  preEnrollment: PreEnrollmentData | null;
  enrollment: EnrollmentData | null;
  errorMessage: string | null;
}

/** Respuesta del endpoint */
interface ApiResponse {
  exists: boolean;
  message?: string;
  student?: StudentSearchData;
  preEnrollment?: PreEnrollmentData | null;
  enrollment?: EnrollmentData;
}

/**
 * Hook para buscar estudiantes por CI en el contexto de inscripción.
 * Optimizado para evitar cargar todos los datos cada vez.
 *
 * @param debounceMs - Milisegundos de espera antes de buscar (default: 500)
 * @returns Estado y funciones de búsqueda
 */
export const useStudentSearch = (debounceMs: number = 500) => {
  const [result, setResult] = useState<StudentSearchResult>({
    status: "idle",
    student: null,
    preEnrollment: null,
    enrollment: null,
    errorMessage: null
  });

  const [isSearching, setIsSearching] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Busca estudiante por CI con debounce.
   * Cancela búsquedas anteriores si se inicia una nueva.
   */
  const searchByCi = useCallback((prefix: string, number: string) => {
    // Limpiar timeout anterior
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Cancelar request anterior si existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Validar mínimo de caracteres
    if (!prefix || number.length < 5) {
      setResult({
        status: "idle",
        student: null,
        preEnrollment: null,
        enrollment: null,
        errorMessage: null
      });
      setIsSearching(false);
      return;
    }

    // Establecer estado de búsqueda
    setIsSearching(true);
    setResult(prev => ({
      ...prev,
      status: "searching",
      errorMessage: null
    }));

    // Configurar debounce
    timeoutRef.current = setTimeout(async () => {
      // Crear nuevo AbortController para esta request
      abortControllerRef.current = new AbortController();
      const ciFull = `${prefix}-${number}`;

      try {
        const response = await apiClient.get("/students/search", {
          params: { ci_prefix: prefix, ci_number: number },
          signal: abortControllerRef.current.signal
        });

        const data: ApiResponse = response.data;

        console.log('[useStudentSearch] Respuesta del servidor:', {
          exists: data.exists,
          enrollmentStatus: data.enrollment?.status,
          enrollmentCode: data.enrollment?.enrollmentCode,
          preEnrollment: data.preEnrollment
        });

        // Procesar respuesta según el resultado
        if (!data.exists) {
          setResult({
            status: "not_found",
            student: null,
            preEnrollment: null,
            enrollment: null,
            errorMessage: data.message || `No se encontró ningún estudiante con CI ${ciFull}`
          });
          setIsSearching(false);
          return;
        }

        const enrollmentStatus = data.enrollment?.status || "none";

        console.log('[useStudentSearch] Estado de inscripción:', enrollmentStatus);

        // IMPORTANTE: Verificar inscripciones PRIMERO, antes de pre-inscripción
        // El orden correcto de prioridad es:
        // 1. active → already_enrolled (ya tiene inscripción activa)
        // 2. culminated → already_culminated (ya culminó)
        // 3. no pre-enrollment → no_pre_enrollment (sin pre-inscripción)
        // 4. found → todo OK

        if (enrollmentStatus === "active") {
          console.log('[useStudentSearch] → Caso: already_enrolled');
          setResult({
            status: "already_enrolled",
            student: data.student || null,
            preEnrollment: data.preEnrollment || null,
            enrollment: data.enrollment || null,
            errorMessage: `El estudiante ya posee una inscripción activa (código: ${data.enrollment?.enrollmentCode || 'N/A'}). No puede proceder.`
          });
          setIsSearching(false);
          return;
        }

        if (enrollmentStatus === "culminated") {
          console.log('[useStudentSearch] → Caso: already_culminated');
          setResult({
            status: "already_culminated",
            student: data.student || null,
            preEnrollment: data.preEnrollment || null,
            enrollment: data.enrollment || null,
            errorMessage: `El estudiante ya tiene una inscripción culminada (código: ${data.enrollment?.enrollmentCode || 'N/A'}). No puede registrar una nueva.`
          });
          setIsSearching(false);
          return;
        }

        if (!data.preEnrollment?.active) {
          console.log('[useStudentSearch] → Caso: no_pre_enrollment (no tiene pre-inscripción activa)');
          setResult({
            status: "no_pre_enrollment",
            student: data.student || null,
            preEnrollment: null,
            enrollment: data.enrollment || null,
            errorMessage: "El estudiante no posee una pre-inscripción activa. Complete la pre-inscripción primero."
          });
          setIsSearching(false);
          return;
        }

        // Todo OK - estudiante válido para inscripción
        console.log('[useStudentSearch] → Caso: found (estudiante válido)');
        setResult({
          status: "found",
          student: data.student || null,
          preEnrollment: data.preEnrollment || null,
          enrollment: data.enrollment || null,
          errorMessage: null
        });
        setIsSearching(false);

      } catch (error: unknown) {
        // Ignorar errores de abort (request cancelada)
        if ((error as any)?.name === "AbortError") {
          return;
        }

        // Error de red o servidor
        const errorMessage = (error as any)?.response?.data?.message
          || "Error al buscar estudiante. Intente de nuevo.";

        setResult({
          status: "error",
          student: null,
          preEnrollment: null,
          enrollment: null,
          errorMessage
        });
        setIsSearching(false);
      }
    }, debounceMs);
  }, [debounceMs]);

  /**
   * Limpia el estado de búsqueda.
   */
  const clearSearch = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setResult({
      status: "idle",
      student: null,
      preEnrollment: null,
      enrollment: null,
      errorMessage: null
    });
    setIsSearching(false);
  }, []);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    /** Estado actual de la búsqueda */
    result,
    /** Indica si hay una búsqueda en progreso */
    isSearching,
    /** Función para buscar por CI (con debounce) */
    searchByCi,
    /** Función para limpiar el estado */
    clearSearch,
    /** Helper: ¿Encontró un estudiante válido? */
    isFound: result.status === "found",
    /** Helper: ¿Hay un error que requiere atención? */
    hasError: ["not_found", "already_enrolled", "already_culminated", "no_pre_enrollment", "error"].includes(result.status),
    /** Helper: ¿Es error de red? */
    isNetworkError: result.status === "error"
  };
};

export default useStudentSearch;