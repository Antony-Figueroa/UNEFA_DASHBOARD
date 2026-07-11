import { useState, useEffect } from "react";
import { useConfirmDialog } from "../../../../hooks/useConfirmDialog";
import PageMeta from "../../../../components/common/PageMeta";
import PageBreadcrumb from "../../../../components/common/PageBreadCrumb";
import ComponentCard from "../../../../components/common/ComponentCard";
import Button from "../../../../components/ui/button/Button";
import Badge from "../../../../components/ui/badge/Badge";
import { SkeletonLoader } from "../../../../components/ui/skeleton";
import UnifiedDialog from "../../../../components/ui/dialog/UnifiedDialog";
import { useSystemConfig } from "../../../../features/config/hooks/useSystemConfig";
import type { ConfigItem } from "../../../../features/config/types";


// ponytail: lookup table > icon lib import for 7 entries
const CATEGORY_ICONS: Record<string, string> = {
  Seguridad: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
  Contraseñas: "M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z",
  Recuperación: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
  Sesiones: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
  Logs: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  "Validación de Periodos": "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  Evaluación: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01",
};

export default function ParametersPage() {
  const { config, loading, fetchConfig, updateConfig } = useSystemConfig();
  const [activeCategory, setActiveCategory] = useState("");
  const [hasChanges, setHasChanges] = useState(false);
  const [localChanges, setLocalChanges] = useState<Record<string, string | number | boolean>>({});
  const { confirmDialog, showConfirm, hideConfirm } = useConfirmDialog();

  // ponytail: init activeCategory on first load, hook handles fetch on mount
  useEffect(() => {
    if (config.length > 0) {
      setActiveCategory((prev) => prev || config[0].category);
    }
  }, [config]);

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
    showConfirm({
      title: "Guardar Configuración",
      message: "¿Estás seguro de guardar los cambios en la configuración del sistema?",
      onConfirm: async () => {
        const success = await updateConfig(localChanges);
        if (success) {
          setHasChanges(false);
          setLocalChanges({});
        }
        hideConfirm();
      },
      variant: "info",
    });
  };

  const handleReset = () => {
    showConfirm({
      title: "Restaurar Valores",
      message: "¿Estás seguro de restaurar los valores? Los cambios no guardados se perderán.",
      onConfirm: () => {
        setLocalChanges({});
        setHasChanges(false);
        hideConfirm();
      },
      variant: "warning",
    });
  };

  const activeCategoryItems = config.find((c) => c.category === activeCategory)?.items || [];

  return (
    <>
      <PageMeta title="Parámetros del Sistema" description="Configuración general del sistema" />
      <PageBreadcrumb pageTitle="Parámetros del Sistema" />

      <div className="space-y-6 animate-fadeIn">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary dark:text-text-emphasis">
              Parámetros del Sistema
            </h1>
            <p className="mt-1 text-sm text-text-secondary dark:text-text-tertiary">
              Configuración general de seguridad, contraseñas, sesiones y logs
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
            <SkeletonLoader isLoading={loading} skeleton={
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                ))}
              </div>
            } id="categories-skeleton">
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={CATEGORY_ICONS[cat.category] || "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"} />
                    </svg>
                    {cat.category}
                  </button>
                ))}
              </nav>
            </SkeletonLoader>
          </ComponentCard>

          <ComponentCard title={`Configuración de ${activeCategory}`} className="lg:col-span-3">
            <SkeletonLoader isLoading={loading} skeleton={
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="p-4 rounded-lg border border-border-light dark:border-white/10">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2"></div>
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </div>
                ))}
              </div>
            } id="config-panel-skeleton">
              {activeCategoryItems.length > 0 ? (
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
                              onChange={(e) => updateLocalConfig(item.key, parseFloat(e.target.value) || 0)}
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
            </SkeletonLoader>
          </ComponentCard>
        </div>
      </div>

      <UnifiedDialog
        isOpen={!!confirmDialog}
        onClose={hideConfirm}
        onConfirm={confirmDialog?.onConfirm || (() => {})}
        title={confirmDialog?.title || ""}
        message={confirmDialog?.message || ""}
        confirmLabel="Confirmar"
        variant={confirmDialog?.variant || "info"}
      />
    </>
  );
}
