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

/** Estados posibles de la carga de datos */
export type CrudStatus = "loading" | "success" | "error" | "idle";

/** Interfaz del servicio que consume el hook */
export interface CrudServiceAdapter<TItem, TCreatePayload, TUpdatePayload> {
  getAll: () => Promise<TItem[]>;
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
  } = options;

  const [data, setData] = useState<TItem[]>([]);
  const [status, setStatus] = useState<CrudStatus>("idle");
  const [loadingAction, setLoadingAction] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  const { addToast } = useToast();

  /**
   * Refresca la lista de elementos desde el servidor.
   */
  const refresh = useCallback(async () => {
    setStatus("loading");
    try {
      const result = await service.getAll();
      setData(result);
      setStatus("success");
      setError(null);
    } catch (e) {
      const err = e instanceof Error ? e : new Error(`Error al cargar ${resourceName}s`);
      setError(err);
      setStatus("error");
      addToast({
        variant: "error",
        title: `Error de Carga`,
        message: `No se pudieron cargar los datos de ${resourceName}s. ${err.message}`
      });
    }
  }, [service, resourceName, addToast]);

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
      await refresh();
      
      if (!options?.silent) {
        addToast({
          variant: "success",
          title: `${resourceName} Registrado`,
          message: `El registro de ${resourceName} se ha guardado exitosamente.`
        });
      }
      
      return newItem;
    } catch (e) {
      const err = e instanceof Error ? e : new Error(`Error al crear ${resourceName}`);
      
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
      await refresh();
      
      if (!options?.silent) {
        addToast({
          variant: "success",
          title: `${resourceName} Actualizado`,
          message: `Los cambios en ${resourceName} se han guardado exitosamente.`
        });
      }
      
      return updatedItem;
    } catch (e) {
      const err = e instanceof Error ? e : new Error(`Error al actualizar ${resourceName}`);
      
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
    try {
      await service.delete(id);
      await refresh();
      
      if (!options?.silent) {
        addToast({
          variant: "success",
          title: `${resourceName} Eliminado`,
          message: `El registro de ${resourceName} ha sido eliminado exitosamente.`
        });
      }
      
      return true;
    } catch (e) {
      const err = e instanceof Error ? e : new Error(`Error al eliminar ${resourceName}`);
      
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
    try {
      await service.toggleStatus(id, newStatus);
      await refresh();
      
      if (!options?.silent) {
        addToast({
          variant: "success",
          title: "Estado Actualizado",
          message: `El registro de ${resourceName} ha sido ${newStatus ? 'activado' : 'inactivado'} exitosamente.`
        });
      }
      
      return true;
    } catch (e) {
      const err = e instanceof Error ? e : new Error(`Error al cambiar estado de ${resourceName}`);
      
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
    try {
      await service.bulkDelete(ids);
      await refresh();
      
      if (!options?.silent) {
        addToast({
          variant: "success",
          title: "Eliminación Masiva",
          message: `Se han eliminado ${ids.length} registros de ${resourceName} exitosamente.`
        });
      }
      
      return true;
    } catch (e) {
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
    try {
      await service.bulkRestore(ids);
      await refresh();
      
      if (!options?.silent) {
        addToast({
          variant: "success",
          title: "Restauración Masiva",
          message: `Se han restaurado ${ids.length} registros de ${resourceName} exitosamente.`
        });
      }
      
      return true;
    } catch (e) {
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
    bulkRestore
  };
}
