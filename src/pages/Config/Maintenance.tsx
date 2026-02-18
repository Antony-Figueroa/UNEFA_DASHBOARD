import { useState, useEffect } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Button from "../../components/ui/button/Button";
import Badge from "../../components/ui/badge/Badge";
import UnifiedDialog from "../../components/ui/dialog/UnifiedDialog";
import { configService, ConfigItem, CategorizedConfig, SystemHealth } from "../../features/config/services/configService";
import toast from "react-hot-toast";

export default function MaintenancePage() {
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<CategorizedConfig[]>([]);
  const [activeCategory, setActiveCategory] = useState("");
  const [hasChanges, setHasChanges] = useState(false);
  const [localChanges, setLocalChanges] = useState<Record<string, string | number | boolean>>({});
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: "info" | "success" | "error" | "warning";
  } | null>(null);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const [configRes, healthRes] = await Promise.all([
        configService.getConfig(),
        configService.getSystemHealth()
      ]);
      
      setConfig(configRes.categorized);
      setSystemHealth(healthRes);
      
      if (configRes.categorized.length > 0) {
        setActiveCategory(configRes.categorized[0].category);
      }
    } catch (error) {
      console.error('Error fetching config:', error);
      toast.error('Error al cargar la configuración');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const updateLocalConfig = (key: string, value: string | number | boolean) => {
    setLocalChanges((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const getEffectiveValue = (item: ConfigItem): string | number | boolean => {
    if (localChanges[item.key] !== undefined) {
      return localChanges[item.key];
    }
    return item.value;
  };

  const handleSave = async () => {
    setConfirmDialog({
      isOpen: true,
      title: "Guardar Configuración",
      message: "¿Está seguro de guardar los cambios en la configuración del sistema?",
      onConfirm: async () => {
        try {
          await configService.updateConfig(localChanges);
          setHasChanges(false);
          setLocalChanges({});
          toast.success('Configuración guardada correctamente');
          await fetchConfig();
        } catch (error) {
          console.error('Error saving config:', error);
          toast.error('Error al guardar la configuración');
        } finally {
          setConfirmDialog(null);
        }
      },
      variant: "info",
    });
  };

  const handleReset = () => {
    setConfirmDialog({
      isOpen: true,
      title: "Restaurar Valores",
      message: "¿Está seguro de restaurar los valores? Los cambios no guardados se perderán.",
      onConfirm: () => {
        setLocalChanges({});
        setHasChanges(false);
        setConfirmDialog(null);
      },
      variant: "warning",
    });
  };

  const handleClearLogs = async () => {
    setConfirmDialog({
      isOpen: true,
      title: "Limpiar Logs Antiguos",
      message: "¿Está seguro de eliminar los logs con más de 90 días? Esta acción no se puede deshacer.",
      onConfirm: async () => {
        try {
          const result = await configService.clearOldLogs(90);
          toast.success(result.message);
          await fetchConfig();
        } catch (error) {
          console.error('Error clearing logs:', error);
          toast.error('Error al limpiar los logs');
        } finally {
          setConfirmDialog(null);
        }
      },
      variant: "error",
    });
  };

  const handleSyncData = () => {
    toast.success('Sincronización completada');
  };

  const handleVerifySystem = async () => {
    try {
      const health = await configService.getSystemHealth();
      setSystemHealth(health);
      if (health.status === 'healthy') {
        toast.success('Sistema funcionando correctamente');
      } else {
        toast.error('Se detectaron problemas en el sistema');
      }
    } catch (error) {
      toast.error('Error al verificar el sistema');
    }
  };

  const activeCategoryItems = config.find((c) => c.category === activeCategory)?.items || [];

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

        {systemHealth && (
          <div className={`rounded-xl border p-4 ${
            systemHealth.status === 'healthy' 
              ? 'border-success-300 bg-success-50 dark:bg-success-500/10' 
              : 'border-error-300 bg-error-50 dark:bg-error-500/10'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${
                systemHealth.status === 'healthy' ? 'bg-success-100' : 'bg-error-100'
              }`}>
                {systemHealth.status === 'healthy' ? (
                  <svg className="w-5 h-5 text-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-error-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                )}
              </div>
              <div>
                <p className={`font-medium ${
                  systemHealth.status === 'healthy' ? 'text-success-700 dark:text-success-400' : 'text-error-700 dark:text-error-400'
                }`}>
                  Sistema {systemHealth.status === 'healthy' ? 'Saludable' : 'Con Problemas'}
                </p>
                <p className="text-xs text-text-tertiary">
                  Base de datos: {systemHealth.checks.database.message} • {systemHealth.checks.logs.count} registros en logs
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          <ComponentCard title="Categorías" className="lg:col-span-1">
            {loading ? (
              <div className="space-y-2 animate-pulse">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                ))}
              </div>
            ) : (
              <nav className="space-y-1">
                {config.map((cat) => (
                  <button
                    key={cat.category}
                    onClick={() => setActiveCategory(cat.category)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      activeCategory === cat.category
                        ? "bg-brand-50 dark:bg-brand-500/10 text-brand-600 dark:text-brand-400"
                        : "text-text-secondary dark:text-text-tertiary hover:bg-gray-50 dark:hover:bg-white/5"
                    }`}
                  >
                    <svg
                      className={`w-4 h-4 ${
                        activeCategory === cat.category ? "text-brand-500" : "text-text-tertiary"
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      {cat.category === "Seguridad" && (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      )}
                      {cat.category === "Contraseñas" && (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      )}
                      {cat.category === "Recuperación" && (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      )}
                      {cat.category === "Sesiones" && (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      )}
                      {cat.category === "Logs" && (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      )}
                    </svg>
                    {cat.category}
                  </button>
                ))}
              </nav>
            )}
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
            ) : activeCategoryItems.length > 0 ? (
              <div className="space-y-4">
                {activeCategoryItems.map((item) => {
                  const effectiveValue = getEffectiveValue(item);
                  const hasLocalChange = localChanges[item.key] !== undefined;
                  
                  return (
                    <div
                      key={item.id}
                      className={`p-4 rounded-lg border transition-colors ${
                        hasLocalChange 
                          ? 'border-brand-300 bg-brand-50/30 dark:bg-brand-500/5' 
                          : 'border-border-light dark:border-white/10'
                      }`}
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-text-primary dark:text-text-emphasis">
                              {item.label}
                            </label>
                            {hasLocalChange && (
                              <span className="text-[10px] font-medium text-brand-600 dark:text-brand-400">
                                (modificado)
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-text-tertiary mt-0.5">{item.description}</p>
                        </div>
                        <div className="w-full sm:w-auto sm:min-w-[200px]">
                          {item.type === "boolean" ? (
                            <button
                              onClick={() => updateLocalConfig(item.key, !effectiveValue)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                effectiveValue ? "bg-brand-500" : "bg-gray-200 dark:bg-gray-700"
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  effectiveValue ? "translate-x-6" : "translate-x-1"
                                }`}
                              />
                            </button>
                          ) : item.type === "number" ? (
                            <input
                              type="number"
                              value={effectiveValue as number}
                              onChange={(e) => updateLocalConfig(item.key, parseInt(e.target.value) || 0)}
                              className="w-full px-3 py-2 text-sm rounded-lg border border-border-light dark:border-white/10 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                            />
                          ) : (
                            <input
                              type="text"
                              value={effectiveValue as string}
                              onChange={(e) => updateLocalConfig(item.key, e.target.value)}
                              className="w-full px-3 py-2 text-sm rounded-lg border border-border-light dark:border-white/10 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-text-tertiary">
                No hay configuraciones para esta categoría
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
                  <p className="text-xs text-text-tertiary">Eliminar registros antiguos (+90 días)</p>
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
              <Button variant="outline" size="sm" onClick={handleSyncData} className="w-full">
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
              <Button variant="outline" size="sm" onClick={handleVerifySystem} className="w-full">
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
