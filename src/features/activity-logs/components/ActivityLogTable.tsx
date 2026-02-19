import Badge from '../../../components/ui/badge/Badge';
import type { BadgeColor } from '../../../components/ui/badge/Badge';
import Button from '../../../components/ui/button/Button';
import { ActivityLog } from '../types';
import { EditIcon, TrashIcon, EyeIcon, CheckCircleIcon } from '../../../icons/actions';

interface ActivityLogTableProps {
  data: ActivityLog[];
  loading?: boolean;
  onEdit?: (log: ActivityLog) => void;
  onDelete?: (log: ActivityLog) => void;
  onView?: (log: ActivityLog) => void;
  onApprove?: (log: ActivityLog) => void;
  showStudent?: boolean;
}

export default function ActivityLogTable({ 
  data, 
  loading = false, 
  onEdit, 
  onDelete, 
  onView,
  onApprove,
  showStudent = false
}: ActivityLogTableProps) {
  
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-VE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getTypeBadge = (type: string): { color: BadgeColor; label: string } => {
    return type === 'DIARIA' 
      ? { color: 'info', label: 'Diaria' }
      : { color: 'warning', label: 'Semanal' };
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">
          No hay registros de actividad
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            {showStudent && (
              <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Estudiante</th>
            )}
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Fecha</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Semana</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Tipo</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Horas</th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Estado</th>
            <th className="text-right py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {data.map((log) => {
            const typeBadge = getTypeBadge(log.activityType);
            return (
              <tr key={log.activityLogId} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                {showStudent && (
                  <td className="py-3 px-4">
                    <div className="font-medium">{log.studentName || 'Estudiante'}</div>
                    <div className="text-xs text-gray-500">{log.studentCi}</div>
                  </td>
                )}
                <td className="py-3 px-4">{formatDate(log.activityDate)}</td>
                <td className="py-3 px-4">{log.weekNumber || '-'}</td>
                <td className="py-3 px-4">
                  <Badge color={typeBadge.color} variant="light">{typeBadge.label}</Badge>
                </td>
                <td className="py-3 px-4 font-semibold text-brand-500">{log.hoursWorked}h</td>
                <td className="py-3 px-4">
                  {log.supervisorApproved ? (
                    <Badge color="success" variant="light">Aprobado</Badge>
                  ) : (
                    <Badge color="warning" variant="light">Pendiente</Badge>
                  )}
                </td>
                <td className="py-3 px-4">
                  <div className="flex justify-end gap-2">
                    {onView && (
                      <Button size="sm" variant="outline" onClick={() => onView(log)}>
                        <EyeIcon className="w-4 h-4" />
                      </Button>
                    )}
                    {!log.supervisorApproved && onApprove && (
                      <Button size="sm" variant="outline" onClick={() => onApprove(log)} className="text-green-600">
                        <CheckCircleIcon className="w-4 h-4" />
                      </Button>
                    )}
                    {onEdit && (
                      <Button size="sm" variant="outline" onClick={() => onEdit(log)}>
                        <EditIcon className="w-4 h-4" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button size="sm" variant="outline" onClick={() => onDelete(log)} className="text-red-600">
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
