import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import apiClient from '../../../api/apiClient';
import type { Notification } from '../../notifications/types';

interface TutorNotificationsWidgetProps {
  unreadCount: number;
  loading: boolean;
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return 'ahora';
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `hace ${days} día${days !== 1 ? 's' : ''}`;
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: 'numeric', month: 'short',
  });
}

const TutorNotificationsWidget = ({ unreadCount, loading: parentLoading }: TutorNotificationsWidgetProps) => {
  const [items, setItems] = useState<Notification[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setFetching(true);
    apiClient
      .get('/notifications?limit=5&unread=true')
      .then((res) => {
        if (!cancelled) {
          setItems(res.data?.data ?? []);
        }
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setFetching(false);
      });
    return () => { cancelled = true; };
  }, []);

  const isLoading = parentLoading || fetching;

  return (
    <div className="rounded-2xl border border-border-light bg-white p-5 shadow-sm dark:border-border-dark dark:bg-gray-900">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Notificaciones
        </h3>
        {unreadCount > 0 && (
          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-500/20 dark:text-red-400">
            {unreadCount} sin leer
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700" />
              <div className="flex-1 space-y-1">
                <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-6 text-gray-400 dark:text-gray-500">
          <Bell className="h-8 w-8" />
          <p className="text-sm">No hay notificaciones</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((n) => (
            <div
              key={n.NOTIFICATION_ID}
              className="flex items-start gap-3 rounded-lg border border-gray-100 px-3 py-2 dark:border-gray-800"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {n.TITLE}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {n.MESSAGE}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                  {formatRelativeTime(n.CREATED_AT)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TutorNotificationsWidget;
