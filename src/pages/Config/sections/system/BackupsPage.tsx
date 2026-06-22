import { useState, useEffect } from "react";
import { useConfirmDialog } from "../../../../hooks/useConfirmDialog";
import PageMeta from "../../../../components/common/PageMeta";
import PageBreadcrumb from "../../../../components/common/PageBreadCrumb";
import ComponentCard from "../../../../components/common/ComponentCard";
import Button from "../../../../components/ui/button/Button";
import UnifiedDialog from "../../../../components/ui/dialog/UnifiedDialog";
import RestoreDialog from "../../../../components/ui/dialog/RestoreDialog";
import { backupService, BackupRecord } from "../../../../features/backup/services/backupService";
import toast from "react-hot-toast";
import ConfigLayout from "../../ConfigLayout";

export default function BackupsPage() {
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [backupFormat, setBackupFormat] = useState<'sql' | 'json'>('sql');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<BackupRecord | null>(null);
  const [backupName, setBackupName] = useState('');
  const { confirmDialog, showConfirm, hideConfirm } = useConfirmDialog();

  const fetchBackups = async () => {
    setLoading(true);
    try {
      const data = await backupService.getBackups();
      setBackups(data);
    } catch (error) {
      console.error('Error fetching backups:', error);
      toast.error('Error al cargar los respaldos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const handleCreateBackup = () => {
    setShowCreateModal(true);
  };

  const confirmCreateBackup = async () => {
    setCreating(true);
    try {
      const backup = await backupService.createBackup({ 
        name: backupName || undefined,
        format: backupFormat 
      });
      setBackups((prev: BackupRecord[]) => [backup, ...prev]);
      toast.success('Respaldo creado exitosamente');
      setShowCreateModal(false);
      setBackupName('');
    } catch (error) {
      console.error('Error creating backup:', error);
      toast.error('Error al crear el respaldo');
    } finally {
      setCreating(false);
    }
  };

  const handleDownload = async (backup: BackupRecord) => {
    try {
      const blob = await backupService.downloadBackup(backup.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = backup.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Descarga iniciada');
    } catch (error) {
      console.error('Error downloading backup:', error);
      toast.error('Error al descargar el respaldo');
    }
  };

  const handleRestore = (backup: BackupRecord) => {
    if (backup.format !== 'sql' && !backup.fileName?.endsWith('.sql')) {
      toast.error('Solo se pueden restaurar respaldos en formato SQL');
      return;
    }
    setSelectedBackup(backup);
    setShowRestoreModal(true);
  };

  const confirmRestore = async () => {
    if (!selectedBackup) return;
    
    setRestoring(true);
    try {
      const result = await backupService.restoreBackup(selectedBackup.id);
      toast.success(result.message);
      setShowRestoreModal(false);
      setSelectedBackup(null);
      fetchBackups();
    } catch (error: any) {
      console.error('Error restoring backup:', error);
      toast.error(error?.response?.data?.message || 'Error al restaurar el respaldo');
    } finally {
      setRestoring(false);
    }
  };

  const handleDelete = (backup: BackupRecord) => {
    showConfirm({
      title: "Eliminar Respaldo",
      message: `¿Está seguro de eliminar el respaldo "${backup.name}"? Esta acción no se puede deshacer.`,
      onConfirm: async () => {
        try {
          await backupService.deleteBackup(backup.id);
          setBackups((prev: BackupRecord[]) => prev.filter((b: BackupRecord) => b.id !== backup.id));
          toast.success('Respaldo eliminado');
        } catch (error) {
          console.error('Error deleting backup:', error);
          toast.error('Error al eliminar el respaldo');
        } finally {
          hideConfirm();
        }
      },
      variant: "error",
    });
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-VE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <ConfigLayout>
      <PageMeta 
        title="Respaldos" 
        description="Gestión de respaldos de la base de datos" 
      />
      <PageBreadcrumb pageTitle="Respaldos" />

      <div className="space-y-6 animate-fadeIn">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary dark:text-text-emphasis">
              Respaldos de Base de Datos
            </h1>
            <p className="mt-1 text-sm text-text-secondary dark:text-text-tertiary">
              Crear, descargar, restaurar y eliminar respaldos
            </p>
          </div>
          <Button onClick={handleCreateBackup} disabled={creating} loading={creating} loadingText="Creando..." startIcon={
            !creating ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            ) : undefined
          }>
            Crear Respaldo
          </Button>
        </div>

        <ComponentCard title="Lista de Respaldos">
          {loading ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              ))}
            </div>
          ) : backups.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No hay respaldos</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Crea tu primer respaldo para proteger tus datos.</p>
            </div>
          ) : (
            <div className="divide-y divide-border-light dark:divide-white/10">
              {backups.map((backup) => (
                <div key={backup.id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-500/10">
                      <svg className="w-6 h-6 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium text-text-primary dark:text-white">
                        {backup.name}
                      </h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-text-tertiary">
                          {formatDate(backup.createdAt)}
                        </span>
                        <span className="text-xs text-text-tertiary">•</span>
                        <span className="text-xs text-text-tertiary">
                          {formatSize(backup.size)}
                        </span>
                        <span className="text-xs text-text-tertiary">•</span>
                        <span className="text-xs text-text-tertiary">
                          {backup.tables?.length || 0} tablas
                        </span>
                        <span className="text-xs text-text-tertiary">•</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          backup.format === 'sql' || backup.fileName?.endsWith('.sql')
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        }`}>
                          {backup.format === 'sql' || backup.fileName?.endsWith('.sql') ? 'SQL' : 'JSON'}
                        </span>
                      </div>
                      {backup.description && (
                        <p className="text-xs text-text-tertiary mt-1">
                          {backup.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {(backup.format === 'sql' || backup.fileName?.endsWith('.sql')) && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-amber-600 border-amber-200 hover:bg-amber-50 hover:border-amber-300 dark:border-amber-700 dark:hover:bg-amber-900/20"
                        onClick={() => handleRestore(backup)}
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Restaurar
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDownload(backup)}
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Descargar
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-error-600 border-error-200 hover:bg-error-50 hover:border-error-300 dark:border-error-700 dark:hover:bg-error-900/20"
                      onClick={() => handleDelete(backup)}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ComponentCard>

        <ComponentCard title="Información">
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-brand-50 dark:bg-brand-500/10">
              <svg className="w-5 h-5 text-brand-600 dark:text-brand-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h4 className="text-sm font-medium text-brand-700 dark:text-brand-300">
                  Acerca de los respaldos
                </h4>
                <ul className="mt-2 text-xs text-brand-600 dark:text-brand-400 space-y-1">
                  <li>• Los respaldos incluyen estructura (CREATE TABLE) y datos (INSERT)</li>
                  <li>• <strong>Formato SQL:</strong> Recomendado para restaurar</li>
                  <li>• <strong>Formato JSON:</strong> Recomendado para análisis</li>
                  <li>• <strong>Restaurar:</strong> Solo administradores con verificación de contraseña</li>
                  <li>• Se recomienda crear respaldos regularmente</li>
                </ul>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-500/10">
              <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h4 className="text-sm font-medium text-amber-700 dark:text-amber-300">
                  Advertencia sobre restauración
                </h4>
                <ul className="mt-2 text-xs text-amber-600 dark:text-amber-400 space-y-1">
                  <li>• <strong>Restaurar eliminará todos los datos actuales</strong></li>
                  <li>• Se creará un backup automático antes de restaurar</li>
                  <li>• Solo use esta opción en caso de emergencia</li>
                  <li>• Alternativa segura: Descargar SQL y ejecutar manualmente en Supabase</li>
                </ul>
              </div>
            </div>
          </div>
        </ComponentCard>
      </div>

      <UnifiedDialog
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Crear Nuevo Respaldo"
        confirmLabel={creating ? "Creando..." : "Crear"}
        onConfirm={confirmCreateBackup}
        variant="info"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-primary dark:text-white mb-1">
              Nombre del respaldo (opcional)
            </label>
            <input
              type="text"
              value={backupName}
              onChange={(e) => setBackupName(e.target.value)}
              placeholder="Ej: respaldo-pre-limpieza"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-text-primary dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary dark:text-white mb-2">
              Formato del respaldo
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="format"
                  value="sql"
                  checked={backupFormat === 'sql'}
                  onChange={() => setBackupFormat('sql')}
                  className="w-4 h-4 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-sm text-text-primary dark:text-white">SQL (.sql)</span>
                <span className="text-xs text-text-tertiary">- Recomendado</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="format"
                  value="json"
                  checked={backupFormat === 'json'}
                  onChange={() => setBackupFormat('json')}
                  className="w-4 h-4 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-sm text-text-primary dark:text-white">JSON (.json)</span>
                <span className="text-xs text-text-tertiary">- Para análisis</span>
              </label>
            </div>
          </div>
        </div>
      </UnifiedDialog>

      <RestoreDialog
        isOpen={showRestoreModal}
        onClose={() => {
          setShowRestoreModal(false);
          setSelectedBackup(null);
        }}
        onConfirm={confirmRestore}
        backup={selectedBackup}
        isLoading={restoring}
      />

      <UnifiedDialog
        isOpen={!!confirmDialog}
        onClose={hideConfirm}
        onConfirm={confirmDialog?.onConfirm || (() => {})}
        title={confirmDialog?.title || ""}
        message={confirmDialog?.message || ""}
        confirmLabel="Confirmar"
        variant={confirmDialog?.variant || "info"}
      />
    </ConfigLayout>
  );
}
