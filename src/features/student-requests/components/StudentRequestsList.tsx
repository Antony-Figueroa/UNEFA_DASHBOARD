import Badge from '../../../components/ui/badge/Badge';
import { STATUS_COLORS, STATUS_LABELS, formatRequestDate } from '../utils/requestUtils';
import type { StudentRequest } from '../types';

interface StudentRequestsListProps {
  requests: StudentRequest[];
  loading: boolean;
  onSelect: (request: StudentRequest) => void;
}

export const StudentRequestsList = ({ requests, loading, onSelect }: StudentRequestsListProps) => {
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse h-20 bg-gray-200 dark:bg-gray-700 rounded" />
        ))}
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-8 text-text-secondary">
        No tienes solicitudes registradas
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <div
          key={request.id}
          className="p-4 border border-border-light dark:border-border-dark rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
          onClick={() => onSelect(request)}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <p className="font-medium">{request.subject}</p>
              <p className="text-sm text-text-secondary">{request.typeName}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge color={STATUS_COLORS[request.status]} size="sm">
                {STATUS_LABELS[request.status]}
              </Badge>
              <span className="text-xs text-text-secondary">
                {formatRequestDate(request.createdAt)}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StudentRequestsList;
