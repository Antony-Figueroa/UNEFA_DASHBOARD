import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import ComponentCard from '../../components/common/ComponentCard';
import PageMeta from '../../components/common/PageMeta';
import ActivityLogTable from '../../features/activity-logs/components/ActivityLogTable';
import ActivityLogModal from '../../features/activity-logs/components/ActivityLogModal';
import { useActivityLogs } from '../../features/activity-logs/hooks/useActivityLogs';
import { ActivityLog } from '../../features/activity-logs/types';
import Button from '../../components/ui/button/Button';
import { PlusIcon } from '../../icons';

export default function ActivityLogPage() {
  const params = useParams();
  const practiceId = params.practiceId;
  const { logs, loading, fetchLogs, createLog, updateLog, deleteLog, approveLog, stats } = useActivityLogs();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<ActivityLog | null>(null);

  useEffect(() => {
    if (practiceId) {
      fetchLogs({ practiceId: Number(practiceId) });
    }
  }, [practiceId, fetchLogs]);

  const handleOpenCreateModal = () => {
    setEditingLog(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (log: ActivityLog) => {
    setEditingLog(log);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingLog(null);
  };

  const handleSave = async (payload: any) => {
    if (editingLog) {
      return await updateLog(editingLog.activityLogId, payload);
    } else {
      return await createLog({
        ...payload,
        professionalPracticeId: Number(practiceId),
        studentId: 0
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm('¿Está seguro de eliminar este registro?')) {
      await deleteLog(id);
    }
  };

  const handleApprove = async (id: number) => {
    if (confirm('¿Desea aprobar este registro de actividad?')) {
      await approveLog(id);
    }
  };

  return (
    <>
      <PageMeta
        title="Registros de Actividad"
        description="Gestión de registros de actividad de pasantías"
      />

      <PageBreadcrumb pageTitle="Registros de Actividad" />

      <div className="space-y-6">
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <ComponentCard title="Total Horas">
              <p className="text-2xl font-bold text-brand-600">{stats.totalHours}h</p>
            </ComponentCard>
            <ComponentCard title="Total Registros">
              <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">{stats.totalLogs}</p>
            </ComponentCard>
            <ComponentCard title="Aprobados">
              <p className="text-2xl font-bold text-success-600">{stats.approvedLogs}</p>
            </ComponentCard>
            <ComponentCard title="Pendientes">
              <p className="text-2xl font-bold text-warning-600">{stats.pendingLogs}</p>
            </ComponentCard>
          </div>
        )}

        <ComponentCard
          title="Lista de Actividades"
          headerAction={
            <Button
              variant="primary"
              onClick={handleOpenCreateModal}
              className="flex items-center gap-2"
            >
              <PlusIcon className="w-4 h-4" />
              Nuevo Registro
            </Button>
          }
        >
          <ActivityLogTable
            logs={logs}
            loading={loading}
            onEdit={handleOpenEditModal}
            onDelete={handleDelete}
            onApprove={handleApprove}
          />
        </ComponentCard>
      </div>

      <ActivityLogModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        log={editingLog}
        professionalPracticeId={Number(practiceId) || 0}
        studentId={0}
        isLoading={loading}
      />
    </>
  );
}
