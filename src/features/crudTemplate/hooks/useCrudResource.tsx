import { useEffect, useState, useCallback } from "react";
import type { CrudPageAlert } from "../types";

export type CrudStatus = "idle" | "loading" | "success" | "error";

export interface CrudService<TItem> {
  list: () => Promise<TItem[]>;
  create: (data: Omit<TItem, "id">) => Promise<TItem>;
  update: (data: TItem) => Promise<TItem>;
  remove: (data: TItem) => Promise<void>;
}

export interface UseCrudResourceOptions<TItem> {
  service: CrudService<TItem>;
  autoLoad?: boolean;
}

export interface UseCrudResourceResult<TItem> {
  items: TItem[];
  status: CrudStatus;
  error: Error | null;
  alert: CrudPageAlert | null;
  setAlert: (alert: CrudPageAlert | null) => void;
  refresh: () => Promise<void>;
  createItem: (data: Omit<TItem, "id">) => Promise<void>;
  updateItem: (data: TItem) => Promise<void>;
  removeItem: (data: TItem) => Promise<void>;
}

export function useCrudResource<TItem extends { id: string }>({
  service,
  autoLoad = true,
}: UseCrudResourceOptions<TItem>): UseCrudResourceResult<TItem> {
  const [items, setItems] = useState<TItem[]>([]);
  const [status, setStatus] = useState<CrudStatus>("idle");
  const [error, setError] = useState<Error | null>(null);
  const [alert, setAlert] = useState<CrudPageAlert | null>(null);

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
      setAlert({
        id: "load-error",
        variant: "error",
        title: "Error al cargar datos",
        message: err.message,
      });
    }
  }, [service]);

  useEffect(() => {
    if (autoLoad) {
      void refresh();
    }
  }, [autoLoad, refresh]);

  const createItem = async (data: Omit<TItem, "id">) => {
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
      setAlert({
        id: "create-error",
        variant: "error",
        title: "Error al crear",
        message: err.message,
      });
      throw err;
    }
  };

  const updateItem = async (data: TItem) => {
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
      setAlert({
        id: "update-error",
        variant: "error",
        title: "Error al actualizar",
        message: err.message,
      });
      throw err;
    }
  };

  const removeItem = async (data: TItem) => {
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
      setAlert({
        id: "delete-error",
        variant: "error",
        title: "Error al eliminar",
        message: err.message,
      });
      throw err;
    }
  };

  return {
    items,
    status,
    error,
    alert,
    setAlert,
    refresh,
    createItem,
    updateItem,
    removeItem,
  };
}
