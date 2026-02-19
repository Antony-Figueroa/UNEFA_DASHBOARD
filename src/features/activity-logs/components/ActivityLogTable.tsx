import Badge from '../../../components/ui/badge/Badge';
import type { BadgeColor } from '../../../components/ui/badge/Badge';
import { ActivityLog } from '../types';

interface ActivityLogTableProps {
  logs: ActivityLog[];
  loading?: boolean;
  onEdit?: (log: ActivityLog) => void;
  onDelete?: (id: number) => void;
  onApprove?: (id: number) => void;
}

export default function ActivityLogTable({ 
  logs, 
  loading = false, 
  onEdit, 
  onDelete, 
  onApprove 
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

  if (logs.length === 0) {
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
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">
              Fecha
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">
              Estudiante
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">
              Tipo
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">
              Horas
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">
              Descripción
            </th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">
              Estado
            </th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {logs.map((log) => {
            const typeBadge = getTypeBadge(log.activityType);
            
            return (
              <tr 
                key={log.activityLogId}
                className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                  {formatDate(log.activityDate)}
                </td>
                <td className="px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      {log.studentName || 'Sin nombre'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {log.studentCi || ''}
                    </p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge color={typeBadge.color}>
                    {typeBadge.label}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                  {log.hoursWorked}h
                </td>
                <td className="px-4 py-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-xs">
                    {log.activityDescription}
                  </p>
                </td>
                <td className="px-4 py-3">
                  {log.supervisorApproved ? (
                    <Badge color="success">Aprobado</Badge>
                  ) : (
                    <Badge color="warning">Pendiente</Badge>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-2">
                    {onEdit && !log.supervisorApproved && (
                      <button
                        onClick={() => onEdit(log)}
                        className="text-brand-600 hover:text-brand-800 dark:text-brand-400 dark:hover:text-brand-300 text-sm font-medium"
                      >
                        Editar
                      </button>
                    )}
                    {onApprove && !log.supervisorApproved && (
                      <button
                        onClick={() => onApprove(log.activityLogId)}
                        className="text-success-600 hover:text-success-800 dark:text-success-400 dark:hover:text-success-300 text-sm font-medium"
                      >
                        Aprobar
                      </button>
                    )}
                    {onDelete && !log.supervisorApproved && (
                      <button
                        onClick={() => onDelete(log.activityLogId)}
                        className="text-error-600 hover:text-error-800 dark:text-error-400 dark:hover:text-error-300 text-sm font-medium"
                      >
                        Eliminar
                      </button>
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
