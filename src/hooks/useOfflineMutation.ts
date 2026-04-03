import { useCallback } from 'react';
import { useOffline } from '../context/OfflineContext';
import type { PendingMutation } from '../lib/offline/types';
import toast from 'react-hot-toast';

export interface UseOfflineMutationOptions<TData, TVariables> {
  onSuccess?: (data: TData) => void;
  onError?: (error: Error) => void;
  onOffline?: (variables: TVariables) => void;
  resourceName?: string;
}

export function useOfflineMutation<TData = unknown, TVariables = unknown>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: UseOfflineMutationOptions<TData, TVariables> = {}
) {
  const { isOnline, queueMutation, pendingCount } = useOffline();
  const { onSuccess, onError, onOffline, resourceName = 'Registro' } = options;

  const mutateAsync = useCallback(async (variables: TVariables): Promise<TData | null> => {
    if (!isOnline) {
      const mutationId = await queueMutation({
        type: 'create',
        endpoint: '/api/unknown',
        method: 'POST',
        payload: variables,
        maxRetries: 3,
      });

      toast.success(
        `${resourceName} guardado offline. Se sincronizará cuando haya conexión.`,
        { duration: 4000 }
      );

      onOffline?.(variables);
      return null;
    }

    try {
      const data = await mutationFn(variables);
      toast.success(`${resourceName} guardado exitosamente.`);
      onSuccess?.(data);
      return data;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Error desconocido');
      toast.error(`Error al guardar: ${err.message}`);
      onError?.(err);
      throw err;
    }
  }, [isOnline, queueMutation, onSuccess, onError, onOffline, resourceName]);

  const mutate = useCallback((variables: TVariables) => {
    mutateAsync(variables).catch(() => {});
  }, [mutateAsync]);

  return {
    mutateAsync,
    mutate,
    isOnline,
    pendingMutations: pendingCount,
  };
}

export function useOfflineUpdate<TData = unknown, TVariables = unknown>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: UseOfflineMutationOptions<TData, TVariables> = {}
) {
  const { isOnline, queueMutation, pendingCount } = useOffline();
  const { onSuccess, onError, resourceName = 'Registro' } = options;

  const mutateAsync = useCallback(async (variables: TVariables): Promise<TData | null> => {
    if (!isOnline) {
      await queueMutation({
        type: 'update',
        endpoint: '/api/unknown',
        method: 'PUT',
        payload: variables,
        maxRetries: 3,
      });

      toast.success(`${resourceName} actualizado offline.`);
      return null;
    }

    try {
      const data = await mutationFn(variables);
      toast.success(`${resourceName} actualizado.`);
      onSuccess?.(data);
      return data;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Error desconocido');
      toast.error(`Error: ${err.message}`);
      onError?.(err);
      throw err;
    }
  }, [isOnline, queueMutation, onSuccess, onError, resourceName]);

  return {
    mutateAsync,
    isOnline,
    pendingMutations: pendingCount,
  };
}

export function useOfflineDelete(
  deleteFn: (id: string | number) => Promise<void>,
  options: { onSuccess?: () => void; onError?: (error: Error) => void; resourceName?: string } = {}
) {
  const { isOnline, queueMutation, pendingCount } = useOffline();
  const { onSuccess, onError, resourceName = 'Registro' } = options;

  const mutateAsync = useCallback(async (id: string | number): Promise<boolean> => {
    if (!isOnline) {
      await queueMutation({
        type: 'delete',
        endpoint: `/api/unknown/${id}`,
        method: 'DELETE',
        payload: { id },
        maxRetries: 3,
      });

      toast.success(`${resourceName} eliminado offline.`);
      onSuccess?.();
      return true;
    }

    try {
      await deleteFn(id);
      toast.success(`${resourceName} eliminado.`);
      onSuccess?.();
      return true;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Error desconocido');
      toast.error(`Error: ${err.message}`);
      onError?.(err);
      throw error;
    }
  }, [isOnline, queueMutation, onSuccess, onError, resourceName]);

  return {
    mutateAsync,
    isOnline,
    pendingMutations: pendingCount,
  };
}
