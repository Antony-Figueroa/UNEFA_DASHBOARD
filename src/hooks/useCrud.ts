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
        message: err.message
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
   * @returns El elemento creado o undefined en caso de error.
   */
  const createItem = async (payload: TCreatePayload): Promise<TItem | undefined> => {
    setLoadingAction(true);
    try {
      const newItem = await service.create(payload);
      await refresh();
      addToast({
        variant: "success",
        title: `${resourceName} Creado`,
        message: `El registro se ha guardado exitosamente.`
      });
      return newItem;
    } catch (e) {
      const err = e instanceof Error ? e : new Error(`Error al crear ${resourceName}`);
      addToast({ variant: "error", title: "Error", message: err.message });
      throw err;
    } finally {
      setLoadingAction(false);
    }
  };

  /**
   * Actualiza un registro existente.
   * @returns El elemento actualizado o undefined en caso de error.
   */
  const updateItem = async (payload: TUpdatePayload): Promise<TItem | undefined> => {
    setLoadingAction(true);
    try {
      const updatedItem = await service.update(payload);
      await refresh();
      addToast({
        variant: "success",
        title: `${resourceName} Actualizado`,
        message: `Los cambios se han guardado exitosamente.`
      });
      return updatedItem;
    } catch (e) {
      const err = e instanceof Error ? e : new Error(`Error al actualizar ${resourceName}`);
      addToast({ variant: "error", title: "Error", message: err.message });
      throw err;
    } finally {
      setLoadingAction(false);
    }
  };

  /**
   * Elimina (o inactiva) un registro.
   * @returns true si se eliminó correctamente, false o lanza error de lo contrario.
   */
  const deleteItem = async (id: string | number): Promise<boolean> => {
    setLoadingAction(true);
    try {
      await service.delete(id);
      await refresh();
      addToast({
        variant: "success",
        title: `${resourceName} Eliminado`,
        message: `El registro ha sido eliminado correctamente.`
      });
      return true;
    } catch (e) {
      const err = e instanceof Error ? e : new Error(`Error al eliminar ${resourceName}`);
      addToast({ variant: "error", title: "Error", message: err.message });
      throw err;
    } finally {
      setLoadingAction(false);
    }
  };

  /**
   * Cambia el estado (activo/inactivo) de un registro si el servicio lo soporta.
   * @returns true si se actualizó el estado, false de lo contrario.
   */
  const toggleItemStatus = async (id: string | number, newStatus: boolean): Promise<boolean> => {
    if (!service.toggleStatus) return false;
    
    setLoadingAction(true);
    try {
      await service.toggleStatus(id, newStatus);
      await refresh();
      addToast({
        variant: "success",
        title: "Estado Actualizado",
        message: `El registro ha sido ${newStatus ? 'activado' : 'inactivado'} exitosamente.`
      });
      return true;
    } catch (e) {
      const err = e instanceof Error ? e : new Error(`Error al cambiar estado de ${resourceName}`);
      addToast({ variant: "error", title: "Error", message: err.message });
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
    toggleItemStatus
  };
}
