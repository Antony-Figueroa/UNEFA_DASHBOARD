import { useEffect, useState, useCallback } from "react";
import { useToast } from "../../../context/toast";

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
  /** Si es true, no muestra notificaciones automáticas (toasts) */
  silent?: boolean;
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
  /** Indica si hay una acción asíncrona (create/update/delete) en curso. */
  loadingAction: boolean;
  /** Recarga la lista de elementos desde el servidor. */
  refresh: (options?: { silent?: boolean }) => Promise<void>;
  /** Crea un nuevo elemento y refresca la lista. */
  createItem: (data: Omit<TItem, "id">, options?: { silent?: boolean }) => Promise<void>;
  /** Actualiza un elemento y refresca la lista. */
  updateItem: (data: TItem, options?: { silent?: boolean }) => Promise<void>;
  /** Elimina un elemento y refresca la lista. */
  removeItem: (data: TItem, options?: { silent?: boolean }) => Promise<void>;
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
  silent: defaultSilent = false,
}: UseCrudResourceOptions<TItem>): UseCrudResourceResult<TItem> {
  const [items, setItems] = useState<TItem[]>([]);
  const [status, setStatus] = useState<CrudStatus>("idle");
  const [error, setError] = useState<Error | null>(null);
  const [loadingAction, setLoadingAction] = useState(false);
  const { addToast } = useToast();

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
  const refresh = useCallback(async (options?: { silent?: boolean }) => {
    const isSilent = options?.silent ?? defaultSilent;
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
      
      if (!isSilent) {
        addToast({
          variant: "error",
          title: "Error de Carga",
          message: err.message,
        });
      }
    }
  }, [service, addToast, defaultSilent]);

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
  const createItem = async (data: Omit<TItem, "id">, options?: { silent?: boolean }) => {
    const isSilent = options?.silent ?? defaultSilent;
    setLoadingAction(true);
    try {
      await service.create(data);
      await refresh({ silent: true }); // Refresco siempre silencioso internamente
      
      if (!isSilent) {
        addToast({
          variant: "success",
          title: "Registro Creado",
          message: "El registro ha sido creado exitosamente.",
        });
      }
    } catch (e) {
      const err =
        e instanceof Error ? e : new Error("Error desconocido al crear");
      console.error("[useCrudResource:createItem]", err);
      
      if (!isSilent) {
        addToast({
          variant: "error",
          title: "Error de Creación",
          message: err.message,
        });
      }
    } finally {
      setLoadingAction(false);
    }
  };

  /**
   * Actualiza un registro existente.
   */
  const updateItem = async (data: TItem, options?: { silent?: boolean }) => {
    const isSilent = options?.silent ?? defaultSilent;
    setLoadingAction(true);
    try {
      await service.update(data);
      await refresh({ silent: true });
      
      if (!isSilent) {
        addToast({
          variant: "success",
          title: "Registro Actualizado",
          message: "Los cambios han sido guardados exitosamente.",
        });
      }
    } catch (e) {
      const err =
        e instanceof Error ? e : new Error("Error desconocido al actualizar");
      console.error("[useCrudResource:updateItem]", err);
      
      if (!isSilent) {
        addToast({
          variant: "error",
          title: "Error de Actualización",
          message: err.message,
        });
      }
    } finally {
      setLoadingAction(false);
    }
  };

  /**
   * Elimina un registro.
   */
  const removeItem = async (data: TItem, options?: { silent?: boolean }) => {
    const isSilent = options?.silent ?? defaultSilent;
    setLoadingAction(true);
    try {
      await service.remove(data);
      await refresh({ silent: true });
      
      if (!isSilent) {
        addToast({
          variant: "warning",
          title: "Registro Eliminado",
          message: "El registro ha sido eliminado exitosamente.",
        });
      }
    } catch (e) {
      const err =
        e instanceof Error ? e : new Error("Error desconocido al eliminar");
      console.error("[useCrudResource:removeItem]", err);
      
      if (!isSilent) {
        addToast({
          variant: "error",
          title: "Error de Eliminación",
          message: err.message,
        });
      }
    } finally {
      setLoadingAction(false);
    }
  };

  return {
    items,
    status,
    error,
    loadingAction,
    refresh,
    createItem,
    updateItem,
    removeItem,
  };
}
