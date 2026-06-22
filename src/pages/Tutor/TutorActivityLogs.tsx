import { useState, useEffect, useCallback } from 'react';
import PageMeta from '../../components/common/PageMeta';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import ComponentCard from '../../components/common/ComponentCard';
import Input from '../../components/form/input/InputField';
import CustomSelect from '../../components/form/CustomSelect';
import ActivityLogTable from '../../features/activity-logs/components/ActivityLogTable';
import ActivityLogModal from '../../features/activity-logs/components/ActivityLogModal';
import UnifiedDialog from '../../components/ui/dialog/UnifiedDialog';
import tutorService from '../../features/tutor/services/tutorService';
import activityLogsService from '../../features/activity-logs/services/activityLogsService';
import type { ActivityLog } from '../../features/activity-logs/types';
import { matchSearch } from '../../utils/searchNormalizer';
import toast from 'react-hot-toast';

export default function TutorActivityLogs() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewDialog, setViewDialog] = useState<{ isOpen: boolean; log: ActivityLog | null }>({
    isOpen: false, log: null
  });

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await tutorService.getActivityLogs({ limit: 200 });
      if (res.success) {
        setLogs(res.data);
      }
    } catch {
      toast.error('Error al cargar registros de actividad');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const handleApprove = async (log: ActivityLog) => {
    try {
      const res = await activityLogsService.approve(log.activityLogId);
      if (res.success) {
        toast.success('Registro aprobado exitosamente');
        fetchLogs();
      }
    } catch {
      toast.error('Error al aprobar el registro');
    }
  };

  const filteredLogs = logs.filter(log => {
    if (searchTerm && !matchSearch(log.activityDescription, searchTerm) && !matchSearch(log.studentName || '', searchTerm)) return false;
    if (typeFilter && log.activityType !== typeFilter) return false;
    if (statusFilter === 'approved' && !log.supervisorApproved) return false;
    if (statusFilter === 'pending' && log.supervisorApproved) return false;
    return true;
  });

  return (
    <>
      <PageMeta title="Bitácora de Actividades" description="Registros de actividad de tus estudiantes" />
      <PageBreadcrumb pageTitle="Bitácora de Actividades" />

      <ComponentCard title="Historial de Actividades">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center mb-6">
          <div className="w-full sm:w-64">
            <Input
              placeholder="Buscar estudiante o actividad..."
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
            onChange={(val) => setTypeFilter(val as string)}
            className="w-full sm:w-40"
          />
          <CustomSelect
            options={[
              { value: '', label: 'Todos los estados' },
              { value: 'approved', label: 'Aprobados' },
              { value: 'pending', label: 'Pendientes' }
            ]}
            value={statusFilter}
            onChange={(val) => setStatusFilter(val as string)}
            className="w-full sm:w-40"
          />
        </div>

        <ActivityLogTable
          data={filteredLogs}
          loading={loading}
          onView={(log) => setViewDialog({ isOpen: true, log })}
          onApprove={handleApprove}
          showStudent={true}
        />
      </ComponentCard>

      <UnifiedDialog
        isOpen={viewDialog.isOpen}
        onClose={() => setViewDialog({ isOpen: false, log: null })}
        title="Detalle de Actividad"
        message={
          viewDialog.log ? (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold uppercase text-text-tertiary">Estudiante</p>
                  <p className="text-sm font-medium">{viewDialog.log.studentName || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-text-tertiary">Fecha</p>
                  <p className="text-sm font-medium">{new Date(viewDialog.log.activityDate).toLocaleDateString('es-VE')}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-text-tertiary">Semana</p>
                  <p className="text-sm font-medium">{viewDialog.log.weekNumber || '-'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-text-tertiary">Horas</p>
                  <p className="text-sm font-medium">{viewDialog.log.hoursWorked}h</p>
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
                  <p className="text-xs font-bold uppercase text-text-tertiary mb-1">Comentarios</p>
                  <p className="text-sm text-text-secondary">{viewDialog.log.supervisorComments}</p>
                </div>
              )}
            </div>
          ) : null
        }
        confirmLabel="Cerrar"
        variant="info"
        onConfirm={() => setViewDialog({ isOpen: false, log: null })}
      />
    </>
  );
}
