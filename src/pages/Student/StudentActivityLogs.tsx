import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import PageMeta from '../../components/common/PageMeta';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import ComponentCard from '../../components/common/ComponentCard';
import Button from '../../components/ui/button/Button';
import Badge from '../../components/ui/badge/Badge';
import { AngleLeftIcon } from '../../icons';
import { PlusCircleIcon } from '../../icons/actions';
import { useActivityLogs } from '../../features/activity-logs/hooks/useActivityLogs';
import ActivityLogModal from '../../features/activity-logs/components/ActivityLogModal';
import type { ActivityLog, CreateActivityLogPayload, UpdateActivityLogPayload } from '../../features/activity-logs/types';

export default function StudentActivityLogs() {
  const { practiceId } = useParams();
  const navigate = useNavigate();
  
  const {
    logs,
    stats,
    loading,
    fetchLogs,
    fetchStats,
    createLog,
    updateLog
  } = useActivityLogs();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);

  useEffect(() => {
    if (practiceId) {
      const id = parseInt(practiceId);
      fetchLogs({ practiceId: id });
      fetchStats(id);
    }
  }, [practiceId]);

  const handleOpenModal = (log?: ActivityLog) => {
    setSelectedLog(log || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedLog(null);
  };

  const handleSubmit = async (data: CreateActivityLogPayload | UpdateActivityLogPayload): Promise<boolean> => {
    if (selectedLog) {
      return await updateLog(selectedLog.activityLogId, data as UpdateActivityLogPayload);
    }
    return await createLog(data as CreateActivityLogPayload);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-VE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTypeBadge = (type: string) => {
    return type === 'DIARIA' 
      ? { color: 'info' as const, label: 'Diaria' }
      : { color: 'warning' as const, label: 'Semanal' };
  };

  return (
    <>
      <PageMeta 
        title="Bitacora de Actividades | UNEFA" 
        description="Registro de actividades de pasantia" 
      />

      <PageBreadcrumb pageTitle="Bitacora de Actividades" />

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/student')}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <AngleLeftIcon className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-text-primary dark:text-white">
                Bitacora de Actividades
              </h1>
              <p className="text-text-secondary dark:text-text-tertiary">
                Registra tus actividades diarias y semanales
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2"
          >
            <PlusCircleIcon className="h-5 w-5" />
            Nuevo Registro
          </Button>
        </div>

        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-border-light dark:border-border-dark">
              <p className="text-sm text-text-secondary">Total Horas</p>
              <p className="text-2xl font-bold text-brand-600">{stats.totalHours}h</p>
            </div>
            <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-border-light dark:border-border-dark">
              <p className="text-sm text-text-secondary">Registros</p>
              <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">{stats.totalLogs}</p>
            </div>
            <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-border-light dark:border-border-dark">
              <p className="text-sm text-text-secondary">Aprobados</p>
              <p className="text-2xl font-bold text-success-600">{stats.approvedLogs}</p>
            </div>
            <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-border-light dark:border-border-dark">
              <p className="text-sm text-text-secondary">Pendientes</p>
              <p className="text-2xl font-bold text-warning-600">{stats.pendingLogs}</p>
            </div>
          </div>
        )}

        <ComponentCard title="Lista de Actividades">
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse h-20 bg-gray-200 dark:bg-gray-700 rounded-lg" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-text-secondary">
              <p>No hay registros de actividad</p>
              <p className="text-sm mt-1">Crea tu primer registro de actividad</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => {
                const typeBadge = getTypeBadge(log.activityType);
                return (
                  <div
                    key={log.activityLogId}
                    className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                  >
                    <div className={`p-3 rounded-lg ${log.supervisorApproved ? 'bg-success-100 dark:bg-success-900/30' : 'bg-warning-100 dark:bg-warning-900/30'}`}>
                      <span className="text-lg font-bold">{log.hoursWorked}h</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge color={typeBadge.color} size="sm">{typeBadge.label}</Badge>
                        {log.weekNumber && (
                          <span className="text-xs text-text-secondary">Semana {log.weekNumber}</span>
                        )}
                      </div>
                      <p className="font-medium truncate mt-1">{log.activityDescription}</p>
                      <p className="text-xs text-text-secondary">{formatDate(log.activityDate)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge color={log.supervisorApproved ? 'success' : 'warning'}>
                        {log.supervisorApproved ? 'Aprobado' : 'Pendiente'}
                      </Badge>
                      {!log.supervisorApproved && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenModal(log)}
                        >
                          Editar
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ComponentCard>
      </div>

      <ActivityLogModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSubmit}
        log={selectedLog}
        professionalPracticeId={Number(practiceId) || 0}
        studentId={0}
        isLoading={loading}
      />
    </>
  );
}
