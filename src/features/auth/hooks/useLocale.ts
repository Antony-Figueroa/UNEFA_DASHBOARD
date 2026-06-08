import { useState, useCallback } from "react";
import { useAuth } from "../../../context/auth";
import { updateLocale as updateLocaleApi } from "../services/authService";
import toast from "react-hot-toast";

export const useLocale = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [locale, setLocale] = useState(user?.locale || "es");

  const updateLocale = useCallback(async (newLocale: string) => {
    try {
      setLoading(true);
      const result = await updateLocaleApi(newLocale);
      if (result.success) {
        setLocale(result.locale);
        toast.success("Idioma actualizado");
      } else {
        toast.error("Error al actualizar idioma");
      }
    } catch {
      toast.error("Error al actualizar idioma");
    } finally {
      setLoading(false);
    }
  }, []);

  return { locale, loading, updateLocale };
};
