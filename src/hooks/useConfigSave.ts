import { useState, useCallback } from "react";
import toast from "react-hot-toast";

interface UseConfigSaveOptions {
  onSuccess?: () => void;
  successMessage?: string;
}

/**
 * Hook que encapsula el patrón de guardado con tracking de cambios.
 * Elimina el boilerplate de saving/hasChanges/toast repetido en todas las configs.
 *
 * @param options.onSuccess Callback adicional después de guardar exitosamente
 * @param options.successMessage Mensaje de éxito personalizado
 * @returns { saving, hasChanges, setHasChanges, save }
 */
export function useConfigSave(options?: UseConfigSaveOptions) {
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const save = useCallback(
    async (fn: () => Promise<any>) => {
      setSaving(true);
      try {
        await fn();
        setHasChanges(false);
        toast.success(options?.successMessage || "Guardado exitosamente");
        options?.onSuccess?.();
      } catch (err: any) {
        const msg = err?.response?.data?.message || "Error al guardar";
        toast.error(msg);
        throw err;
      } finally {
        setSaving(false);
      }
    },
    [options]
  );

  return { saving, setSaving, hasChanges, setHasChanges, save };
}

export type UseConfigSaveReturn = ReturnType<typeof useConfigSave>;
