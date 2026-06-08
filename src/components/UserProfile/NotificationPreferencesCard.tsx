import { motion } from "framer-motion";
import { Bell } from "lucide-react";
import { useNotificationPreferences } from "../../features/auth/hooks/useNotificationPreferences";
import Button from "../ui/button/Button";
import { Skeleton } from "../ui/skeleton";

const TYPE_LABELS: Record<string, string> = {
  login: "Inicio de sesión",
  password_change: "Cambio de contraseña",
  security_alert: "Alerta de seguridad",
};

const CHANNEL_LABELS: Record<string, string> = {
  email: "Correo",
  in_app: "En la app",
};

export default function NotificationPreferencesCard() {
  const { prefs, loading, save, isDirty, updatePref } = useNotificationPreferences();

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]">
        <Skeleton height={24} className="w-48 mb-4" />
        <Skeleton height={16} className="w-72 mb-6" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} height={40} className="w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-500/10">
          <Bell className="w-6 h-6 text-brand-600 dark:text-brand-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Notificaciones
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Administrá tus preferencias de notificación
          </p>
        </div>
      </div>

      {prefs.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
          No hay preferencias disponibles
        </p>
      ) : (
        <div className="space-y-2">
          {prefs.map((pref, index) => (
            <div
              key={`${pref.type}-${pref.channel}-${index}`}
              className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            >
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {TYPE_LABELS[pref.type] || pref.type}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {CHANNEL_LABELS[pref.channel] || pref.channel}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={pref.enabled}
                onClick={() => updatePref(index, !pref.enabled)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 ${
                  pref.enabled ? "bg-brand-500" : "bg-gray-200 dark:bg-gray-700"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                    pref.enabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 flex justify-end">
        <Button onClick={save} disabled={!isDirty || loading}>
          Guardar
        </Button>
      </div>
    </motion.div>
  );
}
