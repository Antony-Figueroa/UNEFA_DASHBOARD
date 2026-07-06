import { useState } from "react";
import { useConfirmDialog } from "@/hooks/useConfirmDialog";
import PageMeta from "@/components/common/PageMeta";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Button from "@/components/ui/button/Button";
import UnifiedDialog from "@/components/ui/dialog/UnifiedDialog";
import { BulkImportModal } from "@/features/bulk-import/components/BulkImportModal";
import { useSystemHealth } from "@/features/config/hooks/useSystemHealth";
import ConfigLayout from "@/pages/Config/ConfigLayout";

export default function MaintenancePage() {
  const { health, checkHealth, clearOldLogs, syncData } = useSystemHealth();
  const [executing, setExecuting] = useState<string | null>(null);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const { confirmDialog, showConfirm, hideConfirm } = useConfirmDialog();

  const handleClearLogs = () => {
    showConfirm({
      title: "Limpiar Logs Antiguos",
      message: "¿Estás seguro de eliminar los logs con más de 90 días? Esta acción no se puede deshacer.",
      onConfirm: async () => {
        setExecuting('clear-logs');
        try {
          await clearOldLogs(90);
        } finally {
          setExecuting(null);
          hideConfirm();
        }
      },
      variant: "error",
    });
  };

  const handleSyncData = () => {
    showConfirm({
      title: "Sincronizar Datos",
      message: "¿Estás seguro de sincronizar los datos con Supabase? Esto verificará la integridad de las tablas principales.",
      onConfirm: async () => {
        setExecuting('sync');
        try {
          await syncData();
        } finally {
          setExecuting(null);
          hideConfirm();
        }
      },
      variant: "info",
    });
  };

  const handleVerifySystem = async () => {
    setExecuting('verify');
    await checkHealth();
    setExecuting(null);
  };

  const actions = [
    {
      id: 'clear-logs',
      title: 'Limpiar Logs',
      description: 'Eliminar registros antiguos (+90 días)',
      icon: (
        <svg className="w-5 h-5 text-error-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      ),
      iconBg: 'bg-error-50 dark:bg-error-500/10',
      variant: 'error' as const,
      onClick: handleClearLogs,
    },
    {
      id: 'sync',
      title: 'Sincronizar Datos',
      description: 'Sincronizar y verificar integridad con Supabase',
      icon: (
        <svg className="w-5 h-5 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      ),
      iconBg: 'bg-brand-50 dark:bg-brand-500/10',
      variant: 'primary' as const,
      onClick: handleSyncData,
    },
    {
      id: 'bulk-import',
      title: 'Importación Masiva',
      description: 'Importar estudiantes o inscripciones desde Excel',
      icon: (
        <svg className="w-5 h-5 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
      ),
      iconBg: 'bg-brand-50 dark:bg-brand-500/10',
      variant: 'primary' as const,
      onClick: () => setIsBulkImportOpen(true),
    },
    {
      id: 'verify',
      title: 'Verificar Sistema',
      description: 'Verificación completa del sistema',
      icon: (
        <svg className="w-5 h-5 text-success-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      iconBg: 'bg-success-50 dark:bg-success-500/10',
      variant: 'primary' as const,
      onClick: handleVerifySystem,
    },
  ];

  return (
    <ConfigLayout>
      <PageMeta title="Mantenimiento" description="Acciones de mantenimiento del sistema" />
      <PageBreadcrumb pageTitle="Mantenimiento" />

      <div className="space-y-6 animate-fadeIn">
        <div>
          <h1 className="text-2xl font-bold text-text-primary dark:text-text-emphasis">
            Mantenimiento del Sistema
          </h1>
          <p className="mt-1 text-sm text-text-secondary dark:text-text-tertiary">
            Acciones de limpieza, sincronización y verificación del sistema
          </p>
        </div>

        {/* Health Status Banner */}
        {health && (
          <div className={`rounded-xl border p-4 ${
            health.status === 'healthy'
              ? 'border-success-300 bg-success-50 dark:bg-success-500/10'
              : 'border-error-300 bg-error-50 dark:bg-error-500/10'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${
                health.status === 'healthy' ? 'bg-success-100' : 'bg-error-100'
              }`}>
                {health.status === 'healthy' ? (
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
                  health.status === 'healthy' ? 'text-success-700 dark:text-success-400' : 'text-error-700 dark:text-error-400'
                }`}>
                  Sistema {health.status === 'healthy' ? 'Saludable' : 'Con Problemas'}
                </p>
                <p className="text-xs text-text-tertiary">
                  Base de datos: {health.checks.database.message} • {health.checks.logs.count} registros en logs
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Cards */}
        <ComponentCard title="Acciones de Mantenimiento">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {actions.map((action) => (
              <div
                key={action.id}
                className="p-5 rounded-xl border border-border-light dark:border-white/10 hover:border-brand-200 dark:hover:border-brand-800 transition-colors"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${action.iconBg}`}>
                    {action.icon}
                  </div>
                  <div>
                    <h3 className="font-medium text-text-primary dark:text-text-emphasis">
                      {action.title}
                    </h3>
                    <p className="text-xs text-text-tertiary">{action.description}</p>
                  </div>
                </div>
                <Button
                  variant={action.variant === 'error' ? 'outline' : 'primary'}
                  size="sm"
                  onClick={action.onClick}
                  disabled={executing === action.id}
                  className="w-full"
                >
                  {executing === action.id ? 'Ejecutando...' : 'Ejecutar'}
                </Button>
              </div>
            ))}
          </div>
        </ComponentCard>

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

      <BulkImportModal
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
      />
    </ConfigLayout>
  );
}
