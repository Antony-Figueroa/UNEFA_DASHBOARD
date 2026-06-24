import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import PageMeta from '../../components/common/PageMeta';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import ComponentCard from '../../components/common/ComponentCard';
import Button from '../../components/ui/button/Button';
import Badge from '../../components/ui/badge/Badge';
import InputField from '../../components/form/input/InputField';
import CustomSelect from '../../components/form/CustomSelect';
import UnifiedDialog from '../../components/ui/dialog/UnifiedDialog';
import { AngleLeftIcon } from '../../icons';
import { PlusCircleIcon } from '../../icons/actions';
import { useActivityLogs } from '../../features/activity-logs/hooks/useActivityLogs';
import ActivityLogModal from '../../features/activity-logs/components/ActivityLogModal';
import ActivityLogTable from '../../features/activity-logs/components/ActivityLogTable';
import { ActivityLog, CreateActivityLogPayload, UpdateActivityLogPayload } from '../../features/activity-logs/types';
import { matchSearch } from '../../utils/searchNormalizer';

interface PracticeInfo {
  practiceId: number;
  studentName: string;
  studentCi: string;
  studentId: number;
  institutionName: string;
}

export default function ActivityLogPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const {
    logs,
    stats,
    loading,
    fetchLogs,
    fetchStats,
    createLog,
    updateLog,
    deleteLog,
    approveLog
  } = useActivityLogs();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
  const [practiceInfo, setPracticeInfo] = useState<PracticeInfo | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; log: ActivityLog | null }>({
    isOpen: false,
    log: null
  });
  const [viewDialog, setViewDialog] = useState<{ isOpen: boolean; log: ActivityLog | null }>({
    isOpen: false,
    log: null
  });
  const [approveDialog, setApproveDialog] = useState<{ isOpen: boolean; log: ActivityLog | null }>({
    isOpen: false,
    log: null
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    if (id) {
      const practiceId = parseInt(id);
      fetchLogs({ practiceId });
      fetchStats(practiceId);
    }
  }, [id]);

  useEffect(() => {
    if (logs.length > 0 && !practiceInfo) {
      const firstLog = logs[0];
      setPracticeInfo({
        practiceId: firstLog.professionalPracticeId,
        studentName: firstLog.studentName || 'Estudiante',
        studentCi: firstLog.studentCi || '',
        studentId: firstLog.studentId,
        institutionName: 'Institución'
      });
    }
  }, [logs]);

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

  const handleDelete = async () => {
    if (deleteDialog.log) {
      const success = await deleteLog(deleteDialog.log.activityLogId);
      if (success) {
        setDeleteDialog({ isOpen: false, log: null });
      }
    }
  };

  const handleApprove = async () => {
    if (approveDialog.log) {
      const success = await approveLog(approveDialog.log.activityLogId);
      if (success) {
        setApproveDialog({ isOpen: false, log: null });
      }
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-VE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const filteredLogs = logs.filter(log => {
    if (searchTerm && !matchSearch(log.activityDescription, searchTerm)) {
      return false;
    }
    if (typeFilter && log.activityType !== typeFilter) {
      return false;
    }
    if (statusFilter === 'approved' && !log.supervisorApproved) {
      return false;
    }
    if (statusFilter === 'pending' && log.supervisorApproved) {
      return false;
    }
    return true;
  });

  return (
    <>
      <PageMeta
        title="Registro de Actividades"
        description="Registro de actividades diarias y semanales de estudiantes"
      />
      <PageBreadcrumb pageTitle="Registro de Actividades" />

      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Button 
          variant="outline" 
          onClick={() => navigate('/tracking')}
          className="flex items-center gap-2"
        >
          <AngleLeftIcon className="w-5 h-5" />
          Volver al Seguimiento
        </Button>

        {practiceInfo && (
          <Button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2"
            startIcon={<PlusCircleIcon className="h-5 w-5" />}
          >
            Nueva Actividad
          </Button>
        )}
      </div>

      {practiceInfo && (
        <ComponentCard title="Información del Estudiante" className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-brand-50 dark:bg-brand-500/10 border border-brand-200 dark:border-brand-500/20">
              <p className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 mb-1">Estudiante</p>
              <p className="text-lg font-semibold text-text-primary dark:text-text-emphasis">{practiceInfo.studentName}</p>
              <p className="text-sm text-text-secondary">{practiceInfo.studentCi}</p>
            </div>
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
              <p className="text-xs font-bold uppercase tracking-wider text-text-tertiary mb-1">Institución</p>
              <p className="text-lg font-semibold text-text-primary dark:text-text-emphasis">{practiceInfo.institutionName}</p>
            </div>
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
              <p className="text-xs font-bold uppercase tracking-wider text-text-tertiary mb-1">Horas Totales</p>
              <p className="text-lg font-semibold text-text-primary dark:text-text-emphasis">{stats?.totalHours || 0} hrs</p>
            </div>
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
              <p className="text-xs font-bold uppercase tracking-wider text-text-tertiary mb-1">Registros</p>
              <p className="text-lg font-semibold text-text-primary dark:text-text-emphasis">{stats?.totalLogs || 0}</p>
            </div>
          </div>
        </ComponentCard>
      )}

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <ComponentCard title="Horas Totales">
            <div className="text-center py-2">
              <p className="text-3xl font-bold text-brand-500">{stats.totalHours.toFixed(1)}</p>
              <p className="text-sm text-text-secondary">Horas acumuladas</p>
            </div>
          </ComponentCard>
          <ComponentCard title="Aprobados">
            <div className="text-center py-2">
              <p className="text-3xl font-bold text-success-500">{stats.approvedLogs}</p>
              <p className="text-sm text-text-secondary">Registros aprobados</p>
            </div>
          </ComponentCard>
          <ComponentCard title="Pendientes">
            <div className="text-center py-2">
              <p className="text-3xl font-bold text-warning-500">{stats.pendingLogs}</p>
              <p className="text-sm text-text-secondary">Por aprobar</p>
            </div>
          </ComponentCard>
        </div>
      )}

      <ComponentCard title="Historial de Actividades">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div className="w-full">
            <InputField
              type="text"
              placeholder="Buscar actividad..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <CustomSelect
            options={[
              { value: '', label: 'Todos los tipos' },
              { value: 'DIARIA', label: 'Diaria' },
              { value: 'SEMANAL', label: 'Semanal' }
            ]}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e as string)}
            className="w-full"
          />
          <CustomSelect
            options={[
              { value: '', label: 'Todos los estados' },
              { value: 'approved', label: 'Aprobado' },
              { value: 'pending', label: 'Pendiente' }
            ]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e as string)}
            className="w-full"
          />
        </div>

        <ActivityLogTable
          data={filteredLogs}
          loading={loading}
          onEdit={handleOpenModal}
          onDelete={(log) => setDeleteDialog({ isOpen: true, log })}
          onView={(log) => setViewDialog({ isOpen: true, log })}
          onApprove={(log) => setApproveDialog({ isOpen: true, log })}
          showStudent={false}
        />
      </ComponentCard>

      {practiceInfo && (
        <ActivityLogModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSubmit}
          log={selectedLog}
          professionalPracticeId={practiceInfo.practiceId}
          studentId={practiceInfo.studentId}
          isLoading={loading}
        />
      )}

      <UnifiedDialog
        isOpen={viewDialog.isOpen}
        onClose={() => setViewDialog({ isOpen: false, log: null })}
        title="Detalle de Actividad"
        message={
          viewDialog.log ? (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold uppercase text-text-tertiary">Fecha</p>
                  <p className="text-sm font-medium">{formatDate(viewDialog.log.activityDate)}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-text-tertiary">Semana</p>
                  <p className="text-sm font-medium">{viewDialog.log.weekNumber || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-text-tertiary">Horas</p>
                  <p className="text-sm font-medium">{viewDialog.log.hoursWorked} horas</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-text-tertiary">Tipo</p>
                  <Badge color={viewDialog.log.activityType === 'DIARIA' ? 'primary' : 'info'} variant="light">
                    {viewDialog.log.activityType === 'DIARIA' ? 'Diaria' : 'Semanal'}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-xs font-bold uppercase text-text-tertiary mb-1">Descripción</p>
                <p className="text-sm text-text-secondary">{viewDialog.log.activityDescription}</p>
              </div>
              {viewDialog.log.tasksCompleted && (
                <div>
                  <p className="text-xs font-bold uppercase text-text-tertiary mb-1">Tareas Completadas</p>
                  <p className="text-sm text-text-secondary">{viewDialog.log.tasksCompleted}</p>
                </div>
              )}
              {viewDialog.log.challenges && (
                <div>
                  <p className="text-xs font-bold uppercase text-text-tertiary mb-1">Desafíos</p>
                  <p className="text-sm text-text-secondary">{viewDialog.log.challenges}</p>
                </div>
              )}
              {viewDialog.log.learnings && (
                <div>
                  <p className="text-xs font-bold uppercase text-text-tertiary mb-1">Aprendizajes</p>
                  <p className="text-sm text-text-secondary">{viewDialog.log.learnings}</p>
                </div>
              )}
              {viewDialog.log.supervisorComments && (
                <div>
                  <p className="text-xs font-bold uppercase text-text-tertiary mb-1">Comentarios del Supervisor</p>
                  <p className="text-sm text-text-secondary">{viewDialog.log.supervisorComments}</p>
                </div>
              )}
              <div>
                <p className="text-xs font-bold uppercase text-text-tertiary mb-1">Estado</p>
                {viewDialog.log.supervisorApproved ? (
                  <Badge color="success" variant="light">Aprobado</Badge>
                ) : (
                  <Badge color="warning" variant="light">Pendiente de Aprobación</Badge>
                )}
              </div>
            </div>
          ) : null
        }
        confirmLabel="Cerrar"
        variant="info"
        onConfirm={() => setViewDialog({ isOpen: false, log: null })}
      />

      <UnifiedDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, log: null })}
        title="Eliminar Registro"
        message="¿Estás seguro de que deseas eliminar este registro de actividad? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        variant="error"
        onConfirm={handleDelete}
      />

      <UnifiedDialog
        isOpen={approveDialog.isOpen}
        onClose={() => setApproveDialog({ isOpen: false, log: null })}
        title="Aprobar Registro"
        message={`¿Desea aprobar el registro de actividad del ${approveDialog.log ? formatDate(approveDialog.log.activityDate) : ''}?`}
        confirmLabel="Aprobar"
        variant="success"
        onConfirm={handleApprove}
      />
    </>
  );
}
