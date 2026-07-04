import { useState, useCallback } from "react";
import { useAuth } from "../../../context/auth";
import { updateLocale as updateLocaleApi } from "../services/authService";
import { useToast } from "@/context/toast";
import { TOAST } from "@/components/ui/dialog/DialogConfig";

export const useLocale = () => {
  const { addToast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [locale, setLocale] = useState(user?.locale || "es");

  const updateLocale = useCallback(async (newLocale: string) => {
    try {
      setLoading(true);
      const result = await updateLocaleApi(newLocale);
      if (result.success) {
        setLocale(result.locale);
        addToast({ variant: "success", title: "Idioma actualizado", message: "Idioma actualizado" });
      } else {
        addToast({ variant: "error", title: "Error", message: "Error al actualizar idioma" });
      }
    } catch {
      addToast({ variant: "error", title: "Error", message: "Error al actualizar idioma" });
    } finally {
      setLoading(false);
    }
  }, []);

  return { locale, loading, updateLocale };
};
