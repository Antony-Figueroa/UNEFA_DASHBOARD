import { motion } from "framer-motion";
import { Monitor } from "lucide-react";
import { useActiveSessions } from "../../features/auth/hooks/useActiveSessions";
import { Skeleton } from "../ui/skeleton";
import Button from "../ui/button/Button";

export default function ActiveSessionsCard() {
  const { sessions, loading, terminateSession } = useActiveSessions();

  const currentSessionId = sessions.length > 0
    ? sessions.reduce((max, s) => new Date(s.LAST_ACTIVITY) > new Date(max.LAST_ACTIVITY) ? s : max, sessions[0]).ID
    : null;

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("es-VE", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03]"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-500/10">
          <Monitor className="w-6 h-6 text-brand-600 dark:text-brand-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Sesiones Activas
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Dispositivos con sesión iniciada
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="flex items-center gap-3 p-3">
              <Skeleton height={12} width={120} className="rounded" />
              <Skeleton height={12} width={100} className="rounded" />
              <Skeleton height={12} width={80} className="rounded" />
              <Skeleton height={32} width={60} className="rounded" />
            </div>
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
          No hay sesiones activas
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Dispositivo
                </th>
                <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  IP
                </th>
                <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Última actividad
                </th>
                <th className="text-right py-2 px-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Acción
                </th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <tr
                  key={session.ID}
                  className="border-b border-gray-100 dark:border-gray-800 last:border-0"
                >
                  <td className="py-3 px-3 text-gray-800 dark:text-white/90">
                    {session.DEVICE_INFO || "Desconocido"}
                  </td>
                  <td className="py-3 px-3 text-gray-600 dark:text-gray-400">
                    {session.IP_ADDRESS}
                  </td>
                  <td className="py-3 px-3 text-gray-600 dark:text-gray-400">
                    {formatDate(session.LAST_ACTIVITY)}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={session.ID === currentSessionId}
                      onClick={() => terminateSession(session.ID)}
                    >
                      {session.ID === currentSessionId ? "Actual" : "Cerrar"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
}
