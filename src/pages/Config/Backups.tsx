import { useState, useEffect } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Button from "../../components/ui/button/Button";
import UnifiedDialog from "../../components/ui/dialog/UnifiedDialog";
import { backupService, BackupRecord } from "../../features/backup/services/backupService";
import toast from "react-hot-toast";

export default function BackupsPage() {
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [backupFormat, setBackupFormat] = useState<'sql' | 'json'>('sql');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [backupName, setBackupName] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: "info" | "success" | "error" | "warning";
  } | null>(null);

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

  const handleDelete = (backup: BackupRecord) => {
    setConfirmDialog({
      isOpen: true,
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
          setConfirmDialog(null);
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
    <>
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
              Crear, descargar y eliminar respaldos de la base de datos
            </p>
          </div>
          <Button onClick={handleCreateBackup} disabled={creating}>
            {creating ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creando...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Crear Respaldo
              </>
            )}
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
                  <li>• Los respaldos incluyen 51 tablas del sistema</li>
                  <li>• <strong>Formato SQL:</strong> Archivo .sql con INSERT statements (recomendado para restaurar)</li>
                  <li>• <strong>Formato JSON:</strong> Archivo .json estructurado (recomendado para análisis)</li>
                  <li>• Solo administradores pueden crear y eliminar respaldos</li>
                  <li>• Se recomienda crear respaldos regularmente</li>
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
                <span className="text-xs text-text-tertiary">- Recomendado para restaurar</span>
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
