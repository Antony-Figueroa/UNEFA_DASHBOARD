/**
 * @file useCrud.ts
 * @description Hook genérico para la gestión de operaciones CRUD.
 * Proporciona un estado unificado para carga, errores y acciones, integrando
 * notificaciones automáticas mediante el contexto de Toast.
 * 
 * @module hooks/useCrud
 */

import { useState, useCallback, useEffect } from "react";
import { useToast } from "../context/toast";
import { TOAST_SUCCESS, TOAST_ERROR, TOAST_TITLES } from "../components/ui/dialog/DialogConfig";
import type { GetAllParams, PaginatedResponse } from "../api/crudServiceFactory";

/** Estados posibles de la carga de datos */
export type CrudStatus = "loading" | "success" | "error" | "idle";

/** Estado de paginación */
export interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** Interfaz del servicio que consume el hook */
export interface CrudServiceAdapter<TItem, TCreatePayload, TUpdatePayload> {
  getAll: (params?: GetAllParams) => Promise<TItem[] | PaginatedResponse<TItem>>;
  create: (data: TCreatePayload) => Promise<TItem>;
  update: (data: TUpdatePayload) => Promise<TItem>;
  delete: (id: string | number) => Promise<void>;
  toggleStatus?: (id: string | number, status: boolean) => Promise<void>;
  bulkDelete?: (ids: (string | number)[]) => Promise<void>;
  bulkRestore?: (ids: (string | number)[]) => Promise<void>;
}

/** Opciones de configuración para el hook useCrud */
export interface UseCrudOptions<TItem> {
  /** Nombre del recurso para mensajes de notificación (ej: "Carrera") */
  resourceName: string;
  /** Si se debe cargar automáticamente al montar el hook */
  autoLoad?: boolean;
  /** Función opcional para filtrar los resultados */
  filterFn?: (item: TItem, term: string) => boolean;
  /** Identificador de campo único (por defecto 'id') */
  idField?: keyof TItem;
  /** Si es true, muta el estado local sin re-fetch en create/update/delete/toggle */
  optimistic?: boolean;
  /** Si es true, habilita paginación server-side con limit/offset */
  usePagination?: boolean;
  /** Cantidad de items por página (default: 20, solo si usePagination=true) */
  pageSize?: number;
}

/**
 * Hook para centralizar la lógica CRUD de cualquier recurso.
 * 
 * @param service - Implementación del servicio CRUD.
 * @param options - Configuración del comportamiento del hook.
 */
export function useCrud<TItem, TCreatePayload, TUpdatePayload>(
  service: CrudServiceAdapter<TItem, TCreatePayload, TUpdatePayload>,
  options: UseCrudOptions<TItem>
) {
  const { 
    resourceName, 
    autoLoad = true, 
    filterFn,
    optimistic = false,
    usePagination: enablePagination = false,
    pageSize = 20,
  } = options;

  const idKey = options.idField || 'id' as keyof TItem;

  const [data, setData] = useState<TItem[]>([]);
  const [status, setStatus] = useState<CrudStatus>("idle");
  const [loadingAction, setLoadingAction] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    limit: pageSize,
    total: 0,
    totalPages: 0,
  });
  
  const { addToast } = useToast();

  /**
   * Refresca la lista de elementos desde el servidor.
   * Si usePagination=true, envía limit/offset; de lo contrario mantiene comportamiento anterior.
   */
  const refresh = useCallback(async () => {
    setStatus("loading");
    try {
      const result = await service.getAll(
        enablePagination 
          ? { limit: pagination.limit, offset: pagination.limit * (pagination.page - 1) }
          : undefined
      );
      
      // Normalize status field to boolean if it exists in items
      const normalizeData = (items: TItem[]): TItem[] => {
        return items.map(item => {
          if ((item as any).status !== undefined) {
            return { ...item, status: Boolean((item as any).status) };
          }
          return item;
        });
      };

      if (enablePagination && result && typeof result === 'object' && 'total' in result && 'data' in result) {
        const paginated = result as PaginatedResponse<TItem>;
        setData(normalizeData(paginated.data));
        setPagination(prev => ({
          ...prev,
          total: paginated.total,
          totalPages: Math.ceil(paginated.total / prev.limit) || 1,
        }));
      } else {
        setData(normalizeData(result as TItem[]));
      }
      
      setStatus("success");
      setError(null);
    } catch (e) {
      const err = e instanceof Error ? e : new Error(`Error al cargar ${resourceName}s`);
      setError(err);
      setStatus("error");
      // Silenciar 403 — son errores de permisos, no de carga
      const axiosError = e as { response?: { status?: number } };
      if (axiosError.response?.status !== 403) {
        addToast({
          variant: "error",
          title: `Error de Carga`,
          message: `${TOAST_ERROR.load(resourceName)}. ${err.message}`
        });
      }
    }
  }, [service, resourceName, addToast, enablePagination, pagination.limit, pagination.page]);

  useEffect(() => {
    if (autoLoad) {
      refresh();
    }
  }, [autoLoad, refresh]);

  /**
   * Crea un nuevo registro.
   * @param payload - Datos del nuevo registro.
   * @param options - Opciones adicionales (ej: suprimir notificación).
   * @returns El elemento creado o undefined en caso de error.
   */
  const createItem = async (
    payload: TCreatePayload, 
    options?: { silent?: boolean }
  ): Promise<TItem | undefined> => {
    setLoadingAction(true);
    try {
      const newItem = await service.create(payload);
      
      if (optimistic && newItem) {
        const normalizedNewItem = (newItem as any).status !== undefined 
          ? { ...newItem, status: Boolean((newItem as any).status) } 
          : newItem;
        setData(prev => [...prev, normalizedNewItem]);
      } else {
        await refresh();
      }
      
      if (!options?.silent) {
        addToast({
          variant: "success",
          title: TOAST_TITLES.created(resourceName),
          message: TOAST_SUCCESS.created(resourceName),
        });
      }
      
      return newItem;
    } catch (e) {
      const err = e instanceof Error ? e : new Error(TOAST_ERROR.create(resourceName));
      
      if (!options?.silent) {
        addToast({ 
          variant: "error", 
          title: `Error al Crear`, 
          message: err.message 
        });
      }
      
      throw err;
    } finally {
      setLoadingAction(false);
    }
  };

  /**
   * Actualiza un registro existente.
   * @param payload - Datos actualizados.
   * @param options - Opciones adicionales.
   * @returns El elemento actualizado o undefined en caso de error.
   */
  const updateItem = async (
    payload: TUpdatePayload, 
    options?: { silent?: boolean }
  ): Promise<TItem | undefined> => {
    setLoadingAction(true);
    try {
      const updatedItem = await service.update(payload);
      
      if (optimistic && updatedItem) {
        const normalizedUpdatedItem = (updatedItem as any).status !== undefined 
          ? { ...updatedItem, status: Boolean((updatedItem as any).status) } 
          : updatedItem;
        setData(prev => prev.map(item => 
          (item as any)[idKey] === (normalizedUpdatedItem as any)[idKey] ? normalizedUpdatedItem : item
        ));
      } else {
        await refresh();
      }
      
      if (!options?.silent) {
        addToast({
          variant: "success",
          title: TOAST_TITLES.updated(resourceName),
          message: TOAST_SUCCESS.updated(resourceName),
        });
      }
      
      return updatedItem;
    } catch (e) {
      const err = e instanceof Error ? e : new Error(TOAST_ERROR.update(resourceName));
      
      if (!options?.silent) {
        addToast({ 
          variant: "error", 
          title: `Error al Actualizar`, 
          message: err.message 
        });
      }
      
      throw err;
    } finally {
      setLoadingAction(false);
    }
  };

  /**
   * Elimina (o inactiva) un registro.
   * @param id - Identificador del registro.
   * @param options - Opciones adicionales.
   * @returns true si se eliminó correctamente.
   */
  const deleteItem = async (
    id: string | number, 
    options?: { silent?: boolean }
  ): Promise<boolean> => {
    setLoadingAction(true);
    let previousData: TItem[] = [];
    if (optimistic) {
      previousData = [...data];
      setData(prev => prev.filter(item => (item as any)[idKey] !== id));
    }
    
    try {
      await service.delete(id);
      
      if (!optimistic) {
        await refresh();
      }
      
      if (!options?.silent) {
        addToast({
          variant: "success",
          title: TOAST_TITLES.deleted(resourceName),
          message: TOAST_SUCCESS.deleted(resourceName),
        });
      }
      
      return true;
    } catch (e) {
      // Revertir cambio optimista
      if (optimistic) {
        setData(previousData);
      }
      
      const err = e instanceof Error ? e : new Error(TOAST_ERROR.delete(resourceName));
      
      if (!options?.silent) {
        addToast({ 
          variant: "error", 
          title: `Error al Eliminar`, 
          message: err.message 
        });
      }
      
      throw err;
    } finally {
      setLoadingAction(false);
    }
  };

  /**
   * Cambia el estado (activo/inactivo) de un registro.
   * @param id - Identificador del registro.
   * @param newStatus - Nuevo estado.
   * @param options - Opciones adicionales.
   * @returns true si se actualizó el estado.
   */
  const toggleItemStatus = async (
    id: string | number, 
    newStatus: boolean, 
    options?: { silent?: boolean }
  ): Promise<boolean> => {
    if (!service.toggleStatus) return false;
    
    setLoadingAction(true);
    let previousData: TItem[] = [];
    if (optimistic) {
      previousData = [...data];
      setData(prev => prev.map(item => 
        (item as any)[idKey] === id ? { ...item, status: newStatus } as TItem : item
      ));
    }
    
    try {
      await service.toggleStatus(id, newStatus);
      
      if (!optimistic) {
        await refresh();
      }
      
      if (!options?.silent) {
        addToast({
          variant: "success",
          title: "Estado Actualizado",
          message: TOAST_SUCCESS.statusChanged(resourceName, newStatus),
        });
      }
      
      return true;
    } catch (e) {
      // Revertir cambio optimista
      if (optimistic) {
        setData(previousData);
      }
      
      const err = e instanceof Error ? e : new Error(TOAST_ERROR.update(resourceName));
      
      if (!options?.silent) {
        addToast({ 
          variant: "error", 
          title: "Error de Estado", 
          message: err.message 
        });
      }
      
      throw err;
    } finally {
      setLoadingAction(false);
    }
  };

  /**
   * Realiza la eliminación masiva de registros.
   * @param ids - Arreglo de identificadores.
   * @param options - Opciones adicionales.
   */
  const bulkDelete = async (
    ids: (string | number)[], 
    options?: { silent?: boolean }
  ): Promise<boolean> => {
    if (!service.bulkDelete) return false;
    setLoadingAction(true);
    let previousData: TItem[] = [];
    if (optimistic) {
      previousData = [...data];
      const idSet = new Set(ids.map(String));
      setData(prev => prev.filter(item => !idSet.has(String((item as any)[idKey]))));
    }
    
    try {
      await service.bulkDelete(ids);
      
      if (!optimistic) {
        await refresh();
      }
      
      if (!options?.silent) {
        addToast({
          variant: "success",
          title: "Eliminación Masiva",
          message: `Se han eliminado ${ids.length} registros de ${resourceName} exitosamente.`
        });
      }
      
      return true;
    } catch (e) {
      if (optimistic) setData(previousData);
      const err = e instanceof Error ? e : new Error(`Error en eliminación masiva de ${resourceName}`);
      
      if (!options?.silent) {
        addToast({ 
          variant: "error", 
          title: "Error Masivo", 
          message: err.message 
        });
      }
      
      throw err;
    } finally {
      setLoadingAction(false);
    }
  };

  /**
   * Realiza la restauración masiva de registros.
   * @param ids - Arreglo de identificadores.
   * @param options - Opciones adicionales.
   */
  const bulkRestore = async (
    ids: (string | number)[], 
    options?: { silent?: boolean }
  ): Promise<boolean> => {
    if (!service.bulkRestore) return false;
    setLoadingAction(true);
    let previousData: TItem[] = [];
    if (optimistic) {
      previousData = [...data];
      // Toggle status for matching items (optimistic — status becomes true)
      setData(prev => prev.map(item => 
        ids.includes((item as any)[idKey]) ? { ...item, status: true } as TItem : item
      ));
    }
    
    try {
      await service.bulkRestore(ids);
      
      if (!optimistic) {
        await refresh();
      }
      
      if (!options?.silent) {
        addToast({
          variant: "success",
          title: "Restauración Masiva",
          message: `Se han restaurado ${ids.length} registros de ${resourceName} exitosamente.`
        });
      }
      
      return true;
    } catch (e) {
      if (optimistic) setData(previousData);
      const err = e instanceof Error ? e : new Error(`Error en restauración masiva de ${resourceName}`);
      
      if (!options?.silent) {
        addToast({ 
          variant: "error", 
          title: "Error de Restauración", 
          message: err.message 
        });
      }
      
      throw err;
    } finally {
      setLoadingAction(false);
    }
  };

  /** Navega a una página específica (solo si usePagination=true) */
  const setPage = useCallback((page: number) => {
    if (!enablePagination) return;
    setPagination(prev => ({ ...prev, page: Math.max(1, Math.min(page, prev.totalPages || 1)) }));
  }, [enablePagination]);

  /** Cambia el tamaño de página (solo si usePagination=true) */
  const setLimit = useCallback((limit: number) => {
    if (!enablePagination) return;
    setPagination(prev => ({ ...prev, limit, page: 1 }));
  }, [enablePagination]);

  /** Lista filtrada según el término de búsqueda y la función proporcionada */
  const filteredData = searchTerm && filterFn 
    ? data.filter(item => filterFn(item, searchTerm))
    : data;

  return {
    data,
    filteredData,
    status,
    loadingAction,
    error,
    searchTerm,
    setSearchTerm,
    refresh,
    createItem,
    updateItem,
    deleteItem,
    toggleItemStatus,
    bulkDelete,
    bulkRestore,
    pagination: enablePagination ? pagination : undefined,
    setPage: enablePagination ? setPage : undefined,
    setLimit: enablePagination ? setLimit : undefined,
  };
}
