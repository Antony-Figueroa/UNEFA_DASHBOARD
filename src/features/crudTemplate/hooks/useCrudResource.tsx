import { useEffect, useState, useCallback } from "react";
import type { CrudPageAlert } from "../types";

/**
 * Estados posibles del recurso CRUD.
 */
export type CrudStatus = "idle" | "loading" | "success" | "error";

/**
 * Interfaz genérica para el servicio de datos CRUD.
 * 
 * @template TItem - Tipo de la entidad gestionada.
 */
export interface CrudService<TItem> {
  /** Obtiene la lista de elementos. */
  list: () => Promise<TItem[]>;
  /** Crea un nuevo elemento. */
  create: (data: Omit<TItem, "id">) => Promise<TItem>;
  /** Actualiza un elemento existente. */
  update: (data: TItem) => Promise<TItem>;
  /** Elimina un elemento. */
  remove: (data: TItem) => Promise<void>;
}

/**
 * Opciones para el hook useCrudResource.
 */
export interface UseCrudResourceOptions<TItem> {
  /** Servicio que implementa la lógica de persistencia. */
  service: CrudService<TItem>;
  /** Si debe cargar los datos automáticamente al montar el componente. */
  autoLoad?: boolean;
}

/**
 * Resultado devuelto por el hook useCrudResource.
 */
export interface UseCrudResourceResult<TItem> {
  /** Lista de elementos cargados. */
  items: TItem[];
  /** Estado actual del recurso. */
  status: CrudStatus;
  /** Error si la última operación falló. */
  error: Error | null;
  /** Alerta actual para mostrar en la UI. */
  alert: CrudPageAlert | null;
  /** Indica si hay una acción asíncrona (create/update/delete) en curso. */
  loadingAction: boolean;
  /** Función para actualizar o limpiar la alerta. */
  setAlert: (alert: CrudPageAlert | null) => void;
  /** Recarga la lista de elementos desde el servidor. */
  refresh: () => Promise<void>;
  /** Crea un nuevo elemento y refresca la lista. */
  createItem: (data: Omit<TItem, "id">) => Promise<void>;
  /** Actualiza un elemento y refresca la lista. */
  updateItem: (data: TItem) => Promise<void>;
  /** Elimina un elemento y refresca la lista. */
  removeItem: (data: TItem) => Promise<void>;
}

/**
 * Hook de bajo nivel para gestionar la lógica de estado de un recurso CRUD genérico.
 * Proporciona manejo automático de estados de carga, errores y refresco de datos.
 * 
 * @template TItem - Tipo de la entidad (debe tener propiedad `id`).
 * @param options - Configuración del servicio y comportamiento inicial.
 * @returns Estado y funciones de gestión del recurso.
 * 
 * @example
 * ```tsx
 * const { items, createItem, status } = useCrudResource({ 
 *   service: myUserService,
 *   autoLoad: true 
 * });
 * ```
 */
export function useCrudResource<TItem extends { id: string }>({
  service,
  autoLoad = true,
}: UseCrudResourceOptions<TItem>): UseCrudResourceResult<TItem> {
  const [items, setItems] = useState<TItem[]>([]);
  const [status, setStatus] = useState<CrudStatus>("idle");
  const [error, setError] = useState<Error | null>(null);
  const [alert, setAlert] = useState<CrudPageAlert | null>(null);
  const [loadingAction, setLoadingAction] = useState(false);

  /**
   * Efecto para manejar el timeout de seguridad (30 segundos) en acciones críticas.
   * Evita que la interfaz se quede bloqueada indefinidamente si una petición falla sin respuesta.
   */
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    if (loadingAction) {
      timeoutId = setTimeout(() => {
        setLoadingAction(false);
        console.warn("[useCrudResource] Timeout de 30s alcanzado. Rehabilitando botones.");
      }, 30000);
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [loadingAction]);

  /**
   * Refresca la lista de elementos consultando al servicio.
   */
  const refresh = useCallback(async () => {
    setStatus("loading");
    try {
      const data = await service.list();
      setItems(data);
      setStatus("success");
      setError(null);
    } catch (e) {
      const err =
        e instanceof Error ? e : new Error("Error desconocido al cargar datos");
      setError(err);
      setStatus("error");
      console.error("[useCrudResource:refresh]", err);
      setAlert({
        id: "load-error",
        variant: "error",
        title: "Error al cargar datos",
        message: err.message,
      });
    }
  }, [service]);

  /**
   * Carga inicial de datos.
   */
  useEffect(() => {
    if (autoLoad) {
      void refresh();
    }
  }, [autoLoad, refresh]);

  /**
   * Crea un nuevo registro.
   */
  const createItem = async (data: Omit<TItem, "id">) => {
    setLoadingAction(true);
    try {
      await service.create(data);
      await refresh();
      setAlert({
        id: "create-success",
        variant: "success",
        title: "Éxito",
        message: "Registro creado correctamente.",
      });
    } catch (e) {
      const err =
        e instanceof Error ? e : new Error("Error desconocido al crear");
      console.error("[useCrudResource:createItem]", err);
      setAlert({
        id: "create-error",
        variant: "error",
        title: "Error al crear",
        message: err.message,
      });
    } finally {
      setLoadingAction(false);
    }
  };

  /**
   * Actualiza un registro existente.
   */
  const updateItem = async (data: TItem) => {
    setLoadingAction(true);
    try {
      await service.update(data);
      await refresh();
      setAlert({
        id: "update-success",
        variant: "success",
        title: "Éxito",
        message: "Registro actualizado correctamente.",
      });
    } catch (e) {
      const err =
        e instanceof Error ? e : new Error("Error desconocido al actualizar");
      console.error("[useCrudResource:updateItem]", err);
      setAlert({
        id: "update-error",
        variant: "error",
        title: "Error al actualizar",
        message: err.message,
      });
    } finally {
      setLoadingAction(false);
    }
  };

  /**
   * Elimina un registro.
   */
  const removeItem = async (data: TItem) => {
    setLoadingAction(true);
    try {
      await service.remove(data);
      await refresh();
      setAlert({
        id: "delete-success",
        variant: "success",
        title: "Éxito",
        message: "Registro eliminado correctamente.",
      });
    } catch (e) {
      const err =
        e instanceof Error ? e : new Error("Error desconocido al eliminar");
      console.error("[useCrudResource:removeItem]", err);
      setAlert({
        id: "delete-error",
        variant: "error",
        title: "Error al eliminar",
        message: err.message,
      });
    } finally {
      setLoadingAction(false);
    }
  };

  return {
    items,
    status,
    error,
    alert,
    loadingAction,
    setAlert,
    refresh,
    createItem,
    updateItem,
    removeItem,
  };
}
