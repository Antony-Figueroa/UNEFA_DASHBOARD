import { useState, useEffect, useMemo, useCallback } from "react";
import {
  getNotificationPrefs,
  saveNotificationPrefs as savePrefsApi,
} from "../services/authService";
import type { NotificationPreference } from "../types";
import { useToast } from "@/context/toast";
import { TOAST } from "@/components/ui/dialog/DialogConfig";

export const useNotificationPreferences = () => {
  const { addToast } = useToast();
  const [prefs, setPrefs] = useState<NotificationPreference[]>([]);
  const [originalPrefs, setOriginalPrefs] = useState<NotificationPreference[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPrefs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getNotificationPrefs();
      setPrefs(data);
      setOriginalPrefs(JSON.parse(JSON.stringify(data)));
    } catch {
      addToast(TOAST.loadError());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrefs();
  }, [fetchPrefs]);

  const isDirty = useMemo(() => {
    if (prefs.length !== originalPrefs.length) return true;
    return prefs.some((p, i) => {
      const o = originalPrefs[i];
      return o && (p.type !== o.type || p.channel !== o.channel || p.enabled !== o.enabled);
    });
  }, [prefs, originalPrefs]);

  const save = async () => {
    try {
      const result = await savePrefsApi(prefs);
      if (result.success) {
        addToast({ variant: "success", title: "Preferencias guardadas", message: "Preferencias guardadas" });
        setOriginalPrefs(JSON.parse(JSON.stringify(prefs)));
      } else {
        addToast({ variant: "error", title: "Error al guardar", message: result.message || "Error al guardar preferencias" });
      }
    } catch {
      addToast({ variant: "error", title: "Error al guardar", message: "Error al guardar preferencias" });
    }
  };

  const updatePref = (index: number, enabled: boolean) => {
    setPrefs(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], enabled };
      return updated;
    });
  };

  return { prefs, loading, save, isDirty, updatePref, refresh: fetchPrefs };
};
