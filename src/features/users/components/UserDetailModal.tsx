/**
 * @file UserDetailModal.tsx
 * @description Modal de detalle de usuario con tabs de Información, Seguridad e Historial de Login.
 */

import { useState, useEffect, useCallback } from "react";
import UnifiedDialog from "../../../components/ui/dialog/UnifiedDialog";
import { useUserDetail } from "../hooks/useUserDetail";
import { UserDetail, AuthLog, AuthAction } from "../types";
import { EyeIcon, ClockIcon, MailIcon, PhoneIcon, KeyIcon, CalendarIcon, InformationCircleIcon, ExclamationTriangleIcon, RefreshIcon } from "../../../icons/actions";
import { ShieldCheckIcon, UserIcon } from "lucide-react";

const ACTION_LABELS: Record<AuthAction, { label: string; color: string }> = {
  LOGIN_SUCCESS: { label: "Éxito", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  LOGIN_FAILED: { label: "Fallido", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
  LOGOUT: { label: "Cierre", color: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300" },
  ACCOUNT_LOCKED: { label: "Bloqueo", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
  PASSWORD_RESET_REQUESTED: { label: "Solic. Reset", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  PASSWORD_RESET_COMPLETED: { label: "Reset OK", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" },
  CREATE_USER: { label: "Creación", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400" },
  UPDATE_USER: { label: "Actualización", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400" },
  DELETE_USER: { label: "Eliminación", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
  RESET_PASSWORD: { label: "Reset Admin", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400" },
};

const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return "—";
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-VE", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  } catch {
    return dateStr;
  }
};

interface DetailRowProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
}

const DetailRow = ({ label, value, icon }: DetailRowProps) => (
  <div className="flex items-start gap-3 py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
    {icon && <div className="mt-0.5 text-gray-400 dark:text-gray-500 shrink-0">{icon}</div>}
    <div className="min-w-0 flex-1">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</p>
      <div className="mt-0.5 text-sm text-gray-900 dark:text-gray-100 break-words">{value}</div>
    </div>
  </div>
);

interface BadgeProps {
  children: React.ReactNode;
  color?: string;
}

const Badge = ({ children, color = "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300" }: BadgeProps) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
    {children}
  </span>
);

interface Props {
  userId: number | null;
  userName?: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function UserDetailModal({ userId, userName, isOpen, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<"info" | "security" | "history">("info");
  const { user, loading, error, logs, logTotal, logsLoading, logsError, fetchUser, fetchLogs, reset } = useUserDetail();

  useEffect(() => {
    if (isOpen && userId) {
      fetchUser(userId);
    }
    if (!isOpen) {
      reset();
      setActiveTab("info");
    }
  }, [isOpen, userId, fetchUser, reset]);

  const handleTabChange = useCallback((tab: "info" | "security" | "history") => {
    setActiveTab(tab);
    if (tab === "history" && userId && logs.length === 0 && !logsLoading && !logsError) {
      fetchLogs(userId);
    }
  }, [userId, logs.length, logsLoading, logsError, fetchLogs]);

  const renderTabHeader = () => (
    <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4">
      {[
        { id: "info" as const, label: "Información", icon: UserIcon },
        { id: "security" as const, label: "Seguridad", icon: ShieldCheckIcon },
        { id: "history" as const, label: "Historial", icon: ClockIcon },
      ].map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => handleTabChange(id)}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === id
              ? "border-brand-500 text-brand-600 dark:text-brand-400"
              : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          }`}
        >
          <Icon className="w-4 h-4" />
          {label}
        </button>
      ))}
    </div>
  );

  const renderInfoTab = (u: UserDetail) => (
    <div className="space-y-1">
      <DetailRow label="Nombre Completo" icon={<UserIcon className="w-4 h-4" />}
        value={`${u.name}${u.secondName ? " " + u.secondName : ""} ${u.surname}${u.secondSurname ? " " + u.secondSurname : ""}`} />
      <DetailRow label="Cédula" icon={<UserIcon className="w-4 h-4" />} value={u.userCi} />
      <DetailRow label="Correo Electrónico" icon={<MailIcon className="w-4 h-4" />} value={u.email} />
      <DetailRow label="Teléfono" icon={<PhoneIcon className="w-4 h-4" />} value={u.phoneNumber || "—"} />
      <DetailRow label="Estado" icon={<InformationCircleIcon className="w-4 h-4" />}
        value={
          u.status === 1
            ? <Badge color="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Activo</Badge>
            : <Badge color="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">Inactivo</Badge>
        } />
      <DetailRow label="Intentos Fallidos" icon={<ExclamationTriangleIcon className="w-4 h-4" />}
        value={
          (u.failedAttempts ?? 0) > 0
            ? <span className="text-red-600 dark:text-red-400 font-medium">{u.failedAttempts}</span>
            : "0"
        } />
      <DetailRow label="Fecha de Bloqueo" icon={<CalendarIcon className="w-4 h-4" />}
        value={u.lockDate
          ? <span className="text-yellow-600 dark:text-yellow-400">{formatDate(u.lockDate)}</span>
          : "—"
        } />
      <DetailRow label="Fecha de Creación" icon={<CalendarIcon className="w-4 h-4" />}
        value={formatDate(u.creationDate)} />
    </div>
  );

  const renderSecurityTab = (u: UserDetail) => (
    <div className="space-y-1">
      <DetailRow label="Forzar Cambio de Clave" icon={<KeyIcon className="w-4 h-4" />}
        value={
          u.forcePasswordChange
            ? <Badge color="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">Sí</Badge>
            : <Badge color="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">No</Badge>
        } />
      <DetailRow label="Inicios de Sesión" icon={<ClockIcon className="w-4 h-4" />}
        value={(u.loginCount ?? 0).toString()} />
      <DetailRow label="Términos y Condiciones" icon={<ShieldCheckIcon className="w-4 h-4" />}
        value={
          u.termsConditions === "ACEPTADO"
            ? <Badge color="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Aceptado</Badge>
            : <Badge color="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">Pendiente</Badge>
        } />
      <DetailRow label="Clave Temporal" icon={<KeyIcon className="w-4 h-4" />}
        value={
          u.key?.isTemporary
            ? <Badge color="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">Sí</Badge>
            : <Badge color="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">No</Badge>
        } />
      <DetailRow label="Vigencia Desde" icon={<CalendarIcon className="w-4 h-4" />}
        value={formatDate(u.key?.startDate)} />
      <DetailRow label="Vigencia Hasta" icon={<CalendarIcon className="w-4 h-4" />}
        value={formatDate(u.key?.endDate)} />
    </div>
  );

  const renderHistoryTab = () => {
    if (logsLoading) {
      return (
        <div className="py-8 text-center">
          <div className="inline-block w-6 h-6 border-2 border-gray-300 border-t-brand-500 rounded-full animate-spin" />
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Cargando historial...</p>
        </div>
      );
    }

    if (logsError) {
      return (
        <div className="py-8 text-center">
          <ExclamationTriangleIcon className="w-8 h-8 mx-auto text-red-400" />
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">{logsError}</p>
          <button
            onClick={() => userId && fetchLogs(userId)}
            className="mt-3 inline-flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400"
          >
            <RefreshIcon className="w-4 h-4" /> Reintentar
          </button>
        </div>
      );
    }

    if (logs.length === 0) {
      return (
        <div className="py-8 text-center">
          <ClockIcon className="w-8 h-8 mx-auto text-gray-300 dark:text-gray-600" />
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Sin actividad registrada</p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-400">Acción</th>
              <th className="px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-400">IP</th>
              <th className="px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-400">Fecha</th>
              <th className="px-3 py-2 text-left font-medium text-gray-500 dark:text-gray-400">Detalles</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {logs.map((log) => {
              const actionCfg = ACTION_LABELS[log.action as AuthAction] || { label: log.action, color: "bg-gray-100 text-gray-800" };
              return (
                <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-3 py-2.5">
                    <Badge color={actionCfg.color}>{actionCfg.label}</Badge>
                  </td>
                  <td className="px-3 py-2.5 text-gray-600 dark:text-gray-300 font-mono text-xs">{log.ipAddress || "—"}</td>
                  <td className="px-3 py-2.5 text-gray-600 dark:text-gray-300 whitespace-nowrap">{formatDate(log.createdAt)}</td>
                  <td className="px-3 py-2.5 text-gray-500 dark:text-gray-400 max-w-[200px] truncate" title={log.details}>
                    {log.details || "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {logTotal > logs.length && (
          <p className="px-3 py-2 text-xs text-gray-400 dark:text-gray-500">
            Mostrando {logs.length} de {logTotal} registros
          </p>
        )}
      </div>
    );
  };

  const title = user
    ? `Detalle de Usuario - ${user.name} ${user.surname}`
    : userName
      ? `Detalle de Usuario - ${userName}`
      : "Detalle de Usuario";

  return (
    <UnifiedDialog isOpen={isOpen} onClose={onClose} title={title} size="lg">
      {loading && (
        <div className="py-12 text-center">
          <div className="inline-block w-8 h-8 border-2 border-gray-300 border-t-brand-500 rounded-full animate-spin" />
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">Cargando información del usuario...</p>
        </div>
      )}

      {error && (
        <div className="py-8 text-center">
          <ExclamationTriangleIcon className="w-10 h-10 mx-auto text-red-400" />
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
          <button
            onClick={() => userId && fetchUser(userId)}
            className="mt-3 inline-flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400"
          >
            <RefreshIcon className="w-4 h-4" /> Reintentar
          </button>
        </div>
      )}

      {!loading && !error && user && (
        <>
          {renderTabHeader()}
          {activeTab === "info" && renderInfoTab(user)}
          {activeTab === "security" && renderSecurityTab(user)}
          {activeTab === "history" && renderHistoryTab()}
        </>
      )}
    </UnifiedDialog>
  );
}
