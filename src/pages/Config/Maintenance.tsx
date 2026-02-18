import { useState, useEffect } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Button from "../../components/ui/button/Button";
import Badge from "../../components/ui/badge/Badge";
import UnifiedDialog from "../../components/ui/dialog/UnifiedDialog";

interface SystemConfig {
  id: string;
  category: string;
  key: string;
  label: string;
  value: string | number | boolean;
  type: "text" | "number" | "boolean" | "select";
  options?: { value: string; label: string }[];
  description: string;
}

const MOCK_CONFIG: SystemConfig[] = [
  {
    id: "recovery_email",
    category: "Recuperación",
    key: "RECOVERY_EMAIL",
    label: "Recuperación por Email",
    value: true,
    type: "boolean",
    description: "Permitir recuperación de contraseña por correo electrónico",
  },
  {
    id: "blocking_days",
    category: "Seguridad",
    key: "BLOCKING_DAYS",
    label: "Días de Bloqueo",
    value: 30,
    type: "number",
    description: "Días que un usuario permanece bloqueado después de exceder intentos",
  },
  {
    id: "attempts_key_block",
    category: "Seguridad",
    key: "ATTEMPTS_KEY_BLOCK",
    label: "Intentos antes de Bloqueo",
    value: 3,
    type: "number",
    description: "Número de intentos fallidos antes de bloquear la cuenta",
  },
  {
    id: "key_expiration",
    category: "Seguridad",
    key: "KEY_EXPIRATION",
    label: "Expiración de Clave (días)",
    value: 90,
    type: "number",
    description: "Días hasta que una clave expire y deba ser cambiada",
  },
  {
    id: "password_min_length",
    category: "Contraseñas",
    key: "PASSWORD_MIN_LENGTH",
    label: "Longitud Mínima",
    value: 12,
    type: "number",
    description: "Número mínimo de caracteres para la contraseña",
  },
  {
    id: "password_uppercase",
    category: "Contraseñas",
    key: "PASSWORD_UPPERCASE",
    label: "Requiere Mayúsculas",
    value: true,
    type: "boolean",
    description: "La contraseña debe contener al menos una mayúscula",
  },
  {
    id: "password_lowercase",
    category: "Contraseñas",
    key: "PASSWORD_LOWERCASE",
    label: "Requiere Minúsculas",
    value: true,
    type: "boolean",
    description: "La contraseña debe contener al menos una minúscula",
  },
  {
    id: "password_numbers",
    category: "Contraseñas",
    key: "PASSWORD_NUMBERS",
    label: "Requiere Números",
    value: true,
    type: "boolean",
    description: "La contraseña debe contener al menos un número",
  },
  {
    id: "password_special",
    category: "Contraseñas",
    key: "PASSWORD_SPECIAL",
    label: "Requiere Caracteres Especiales",
    value: true,
    type: "boolean",
    description: "La contraseña debe contener al menos un carácter especial",
  },
  {
    id: "session_timeout",
    category: "Sesiones",
    key: "SESSION_TIMEOUT",
    label: "Tiempo de Sesión (minutos)",
    value: 60,
    type: "number",
    description: "Tiempo en minutos antes de que la sesión expire por inactividad",
  },
  {
    id: "log_retention",
    category: "Logs",
    key: "LOG_RETENTION",
    label: "Retención de Logs (días)",
    value: 90,
    type: "number",
    description: "Días que se mantienen los registros de actividad",
  },
];

const CATEGORIES = [...new Set(MOCK_CONFIG.map((c) => c.category))];

export default function MaintenancePage() {
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<SystemConfig[]>([]);
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0]);
  const [hasChanges, setHasChanges] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: "info" | "success" | "error" | "warning";
  } | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setConfig(MOCK_CONFIG);
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const updateConfig = (id: string, value: string | number | boolean) => {
    setConfig((prev) =>
      prev.map((c) => (c.id === id ? { ...c, value } : c))
    );
    setHasChanges(true);
  };

  const handleSave = () => {
    setConfirmDialog({
      isOpen: true,
      title: "Guardar Configuración",
      message: "¿Está seguro de guardar los cambios en la configuración del sistema?",
      onConfirm: () => {
        setHasChanges(false);
        setConfirmDialog(null);
      },
      variant: "info",
    });
  };

  const handleReset = () => {
    setConfirmDialog({
      isOpen: true,
      title: "Restaurar Valores",
      message: "¿Está seguro de restaurar los valores por defecto? Los cambios no guardados se perderán.",
      onConfirm: () => {
        setConfig(MOCK_CONFIG);
        setHasChanges(false);
        setConfirmDialog(null);
      },
      variant: "warning",
    });
  };

  const handleClearLogs = () => {
    setConfirmDialog({
      isOpen: true,
      title: "Limpiar Logs Antiguos",
      message: "¿Está seguro de eliminar los logs con más de 90 días? Esta acción no se puede deshacer.",
      onConfirm: () => {
        setConfirmDialog(null);
      },
      variant: "error",
    });
  };

  const filteredConfig = config.filter((c) => c.category === activeCategory);

  return (
    <>
      <PageMeta title="Mantenimiento" description="Configuración y mantenimiento del sistema" />
      <PageBreadcrumb pageTitle="Mantenimiento" />

      <div className="space-y-6 animate-fadeIn">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary dark:text-text-emphasis">
              Mantenimiento del Sistema
            </h1>
            <p className="mt-1 text-sm text-text-secondary dark:text-text-tertiary">
              Configuración general y mantenimiento del sistema
            </p>
          </div>
          {hasChanges && (
            <div className="flex items-center gap-3">
              <Badge color="warning" variant="light" shape="rounded">
                Cambios sin guardar
              </Badge>
              <Button variant="outline" onClick={handleReset}>
                Descartar
              </Button>
              <Button onClick={handleSave}>
                Guardar
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          <ComponentCard title="Categorías" className="lg:col-span-1">
            <nav className="space-y-1">
              {CATEGORIES.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeCategory === category
                      ? "bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400"
                      : "text-text-secondary dark:text-text-tertiary hover:bg-gray-50 dark:hover:bg-white/5"
                  }`}
                >
                  <svg
                    className={`w-4 h-4 ${
                      activeCategory === category ? "text-brand-500" : "text-text-tertiary"
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    {category === "Seguridad" && (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    )}
                    {category === "Contraseñas" && (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    )}
                    {category === "Recuperación" && (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    )}
                    {category === "Sesiones" && (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    )}
                    {category === "Logs" && (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    )}
                  </svg>
                  {category}
                </button>
              ))}
            </nav>
          </ComponentCard>

          <ComponentCard title={`Configuración de ${activeCategory}`} className="lg:col-span-3">
            {loading ? (
              <div className="space-y-4 animate-pulse">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="p-4 rounded-lg border border-border-light dark:border-white/10">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2"></div>
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredConfig.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-lg border border-border-light dark:border-white/10"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex-1">
                        <label className="text-sm font-medium text-text-primary dark:text-text-emphasis">
                          {item.label}
                        </label>
                        <p className="text-xs text-text-tertiary mt-0.5">{item.description}</p>
                      </div>
                      <div className="w-full sm:w-auto sm:min-w-[200px]">
                        {item.type === "boolean" ? (
                          <button
                            onClick={() => updateConfig(item.id, !item.value)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              item.value ? "bg-brand-500" : "bg-gray-200 dark:bg-gray-700"
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                item.value ? "translate-x-6" : "translate-x-1"
                              }`}
                            />
                          </button>
                        ) : item.type === "number" ? (
                          <input
                            type="number"
                            value={item.value as number}
                            onChange={(e) => updateConfig(item.id, parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-border-light dark:border-white/10 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                          />
                        ) : item.type === "select" ? (
                          <select
                            value={item.value as string}
                            onChange={(e) => updateConfig(item.id, e.target.value)}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-border-light dark:border-white/10 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                          >
                            {item.options?.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={item.value as string}
                            onChange={(e) => updateConfig(item.id, e.target.value)}
                            className="w-full px-3 py-2 text-sm rounded-lg border border-border-light dark:border-white/10 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ComponentCard>
        </div>

        <ComponentCard title="Acciones de Mantenimiento">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="p-4 rounded-lg border border-border-light dark:border-white/10">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-error-50 dark:bg-error-500/10">
                  <svg className="w-5 h-5 text-error-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-text-primary dark:text-text-emphasis">Limpiar Logs</h3>
                  <p className="text-xs text-text-tertiary">Eliminar registros antiguos</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleClearLogs} className="w-full">
                Ejecutar
              </Button>
            </div>

            <div className="p-4 rounded-lg border border-border-light dark:border-white/10">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-brand-50 dark:bg-brand-500/10">
                  <svg className="w-5 h-5 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-text-primary dark:text-text-emphasis">Sincronizar Datos</h3>
                  <p className="text-xs text-text-tertiary">Sincronizar con Supabase</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full">
                Ejecutar
              </Button>
            </div>

            <div className="p-4 rounded-lg border border-border-light dark:border-white/10">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-success-50 dark:bg-success-500/10">
                  <svg className="w-5 h-5 text-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-text-primary dark:text-text-emphasis">Verificar Sistema</h3>
                  <p className="text-xs text-text-tertiary">Health check completo</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="w-full">
                Ejecutar
              </Button>
            </div>
          </div>
        </ComponentCard>
      </div>

      <UnifiedDialog
        isOpen={!!confirmDialog}
        onClose={() => setConfirmDialog(null)}
        onConfirm={confirmDialog?.onConfirm || (() => {})}
        title={confirmDialog?.title || ""}
        message={confirmDialog?.message || ""}
        confirmLabel="Confirmar"
        variant={confirmDialog?.variant || "info"}
      />
    </>
  );
}
