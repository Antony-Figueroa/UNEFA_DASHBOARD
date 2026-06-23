import { formatRequestDate } from '../utils/requestUtils';
import type { StudentRequest, RequestStatus } from '../types';
import { CheckCircle, Clock, AlertCircle, XCircle } from 'lucide-react';

interface TimelineNode {
  status: RequestStatus;
  date: string | null;
  label: string;
  icon: React.ReactNode;
  color: string;
}

const nodeConfig: Record<RequestStatus, { label: string; icon: React.ReactNode; color: string }> = {
  pending: {
    label: 'Creada',
    icon: <Clock className="w-4 h-4" />,
    color: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30',
  },
  in_review: {
    label: 'En Revisión',
    icon: <AlertCircle className="w-4 h-4" />,
    color: 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30',
  },
  approved: {
    label: 'Aprobada',
    icon: <CheckCircle className="w-4 h-4" />,
    color: 'text-green-500 bg-green-100 dark:bg-green-900/30',
  },
  rejected: {
    label: 'Rechazada',
    icon: <XCircle className="w-4 h-4" />,
    color: 'text-red-500 bg-red-100 dark:bg-red-900/30',
  },
};

interface RequestTimelineProps {
  request: Pick<StudentRequest, 'status' | 'createdAt' | 'processedAt'>;
}

/** Vertical stepper that shows the timeline of a request's state changes. */
export default function RequestTimeline({ request }: RequestTimelineProps) {
  const nodes: TimelineNode[] = [
    {
      status: 'pending',
      date: request.createdAt,
      ...nodeConfig.pending,
    },
    {
      status: 'in_review',
      date: null, // only shown if the request has progressed past pending
      ...nodeConfig.in_review,
    },
    ...(request.status === 'approved'
      ? [{ status: 'approved' as const, date: request.processedAt, ...nodeConfig.approved }]
      : request.status === 'rejected'
        ? [{ status: 'rejected' as const, date: request.processedAt, ...nodeConfig.rejected }]
        : []),
  ];

  // Determine which states are "completed"
  const statusOrder: RequestStatus[] = ['pending', 'in_review', 'approved', 'rejected'];
  const currentIdx = statusOrder.indexOf(request.status);

  return (
    <div className="flex items-start gap-0">
      {nodes.map((node, i) => {
        const isReached = statusOrder.indexOf(node.status) <= currentIdx;
        const isLast = i === nodes.length - 1;

        return (
          <div key={node.status} className={`flex items-start ${isLast ? '' : 'flex-1'}`}>
            <div className="flex flex-col items-center">
              <div className={`p-1.5 rounded-full ${isReached ? node.color : 'text-gray-300 bg-gray-100 dark:bg-gray-800'}`}>
                {isReached ? node.icon : <div className="w-4 h-4" />}
              </div>
              {!isLast && (
                <div className={`w-0.5 h-8 ${isReached ? 'bg-brand-300 dark:bg-brand-700' : 'bg-gray-200 dark:bg-gray-700'}`} />
              )}
            </div>
            <div className="ml-2 pb-6">
              <p className={`text-xs font-medium ${isReached ? 'text-text-primary' : 'text-text-tertiary'}`}>
                {node.label}
              </p>
              {node.date && isReached && (
                <p className="text-[10px] text-text-tertiary">{formatRequestDate(node.date)}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
