import Badge from '../../../components/ui/badge/Badge';
import Button from '../../../components/ui/button/Button';
import { STATUS_COLORS, STATUS_LABELS, formatRequestDate } from '../utils/requestUtils';
import type { AdminRequest, RequestStatus } from '../types';
import { toTitleCase } from '../../../utils/textFormat';

interface AdminRequestsTableProps {
  requests: AdminRequest[];
  loading: boolean;
  onAttend: (request: AdminRequest) => void;
}

export const AdminRequestsTable = ({ requests, loading, onAttend }: AdminRequestsTableProps) => {
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse h-24 bg-gray-200 dark:bg-gray-700 rounded" />
        ))}
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-8 text-text-secondary">
        No hay solicitudes con este filtro
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-gray-800/50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
              Estudiante
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
              Tipo
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
              Asunto
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
              Fecha
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
              Estado
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-light dark:divide-border-dark">
          {requests.map((request) => (
            <tr key={request.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
              <td className="px-4 py-4">
                <div>
                  <p className="font-medium">{toTitleCase(request.studentName)}</p>
                  <p className="text-sm text-text-secondary">{request.studentCi}</p>
                </div>
              </td>
              <td className="px-4 py-4 text-text-secondary">
                {request.isReassignment && (
                  <span className="inline-flex items-center gap-1 text-yellow-600 text-xs mr-1">
                    ↔
                  </span>
                )}
                {toTitleCase(request.typeName)}
              </td>
              <td className="px-4 py-4">
                <p className="max-w-xs truncate">{toTitleCase(request.subject)}</p>
              </td>
              <td className="px-4 py-4 text-text-secondary text-sm">
                {formatRequestDate(request.createdAt)}
              </td>
              <td className="px-4 py-4">
                <Badge color={STATUS_COLORS[request.status as RequestStatus] || 'light'} size="sm">
                  {STATUS_LABELS[request.status as RequestStatus] || request.status}
                </Badge>
              </td>
              <td className="px-4 py-4">
                <Button size="sm" variant="outline" onClick={() => onAttend(request)}>
                  Atender
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminRequestsTable;
