import { useState } from "react";
import { useNavigate } from "react-router";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import toast from 'react-hot-toast';
import { useNotifications } from "../../features/notifications/hooks/useNotifications";
import { notificationTypeIcons } from "../../features/notifications/types";
import { formatDistanceToNow, formatDateTime } from "../../utils/date";

// Mapa de colores para tipos de notificación - semántica académica
const notificationTypeStyles: Record<string, { bg: string; text: string; label: string }> = {
  pre_enrollment: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', label: 'Pre-inscripción' },
  enrollment: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', label: 'Inscripción' },
  tracking: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400', label: 'Pasantía' },
  tracking_visit: { bg: 'bg-violet-100 dark:bg-violet-900/30', text: 'text-violet-700 dark:text-violet-400', label: 'Visita' },
  user_management: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400', label: 'Usuario' },
  reminder: { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', label: 'Recordatorio' },
  system: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-400', label: 'Sistema' },
  approval: { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', label: 'Aprobación' },
};

// Función para obtener el estilo según tipo
const getTypeStyle = (type: string) => {
  return notificationTypeStyles[type] || notificationTypeStyles.system;
};

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { 
    notifications, 
    unreadCount, 
    loading, 
    markAsRead, 
    markAllAsRead, 
    fetchMore,
    refreshNotifications
  } = useNotifications({ autoConnect: true });

  function toggleDropdown() {
    setIsOpen(!isOpen);
    // Refresh notifications when opening
    if (!isOpen) {
      refreshNotifications();
    }
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  const handleClick = (notificationId: number) => {
    markAsRead(notificationId);
  };

  const handleMarkAllRead = () => {
    markAllAsRead();
  };

  return (
    <div className="relative">
      <button
        className="relative flex items-center justify-center transition-all duration-200 rounded-full text-text-secondary bg-bg-main border border-border-light dropdown-toggle hover:text-text-emphasis h-9 w-9 hover:bg-bg-secondary dark:border-border-dark dark:bg-bg-dark dark:text-text-tertiary dark:hover:bg-white/5 dark:hover:text-text-emphasis shrink-0"
        onClick={toggleDropdown}
        aria-label="Notificaciones"
      >
        <span
          className={`absolute right-0 top-0.5 z-10 h-2 w-2 rounded-full bg-warning-500 ${unreadCount === 0 ? "hidden" : "flex"
            }`}
        >
          <span className="absolute inline-flex w-full h-full rounded-full opacity-75 bg-warning-500 animate-ping"></span>
        </span>
        <svg
          className="fill-current"
          width="16"
          height="16"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
            fill="currentColor"
          />
        </svg>
      </button>
      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute right-0 mt-2 w-96 h-[480px] flex flex-col rounded-2xl border border-border-light bg-white dark:border-border-dark dark:bg-bg-dark shadow-lg dark:shadow-xl transition-colors duration-300 z-50"
      >
        <div className="flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-bg-secondary/50 dark:bg-white/5 border-b border-border-light dark:border-border-dark">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <h5 className="text-sm font-semibold text-text-emphasis dark:text-text-emphasis">
              Notificaciones
            </h5>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-medium bg-brand-500 text-white rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-brand-500 hover:text-brand-600 font-medium px-2 py-1 rounded hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
              >
                Todo leído
              </button>
            )}
            <button
              onClick={toggleDropdown}
              className="p-1.5 rounded-lg text-text-secondary hover:text-text-emphasis hover:bg-bg-secondary dark:text-text-tertiary dark:hover:text-text-emphasis dark:hover:bg-white/5 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Lista de notificaciones */}
        <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0" style={{ maxHeight: 'calc(480px - 120px)' }}>
          {loading && notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-text-secondary">
              <div className="w-8 h-8 border-2 border-brand-200 border-t-brand-500 rounded-full animate-spin mb-3"></div>
              <p className="text-sm">Cargando notificaciones...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-text-secondary">
              <div className="w-14 h-14 rounded-full bg-bg-secondary dark:bg-white/5 flex items-center justify-center mb-3">
                <svg className="w-7 h-7 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-text-secondary">Sin notificaciones</p>
              <p className="text-xs text-text-tertiary mt-1">Las notificaciones aparecerán aquí</p>
            </div>
          ) : (
            <ul className="divide-y divide-border-light dark:divide-border-dark">
              {notifications.slice(0, 10).map((notification, index) => {
                const typeStyle = getTypeStyle(notification.TYPE);
                const key = notification.NOTIFICATION_ID ?? `notif-${index}`;
                return (
                  <li 
                    key={key} 
                    className={`group relative hover:bg-bg-secondary/50 dark:hover:bg-white/5 transition-colors cursor-pointer ${!notification.READ ? 'bg-brand-50/50 dark:bg-brand-900/10' : ''}`}
                    onClick={() => handleClick(notification.NOTIFICATION_ID)}
                  >
                    <div className="flex gap-3 p-4">
                      {/* Icono de tipo */}
                      <div className={`relative flex-shrink-0 w-10 h-10 rounded-xl ${typeStyle.bg} flex items-center justify-center`}>
                        <span className={`text-lg ${typeStyle.text}`}>
                          {notificationTypeIcons[notification.TYPE] || '📢'}
                        </span>
                        {!notification.READ && (
                          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-brand-500 rounded-full border-2 border-white dark:border-bg-dark"></span>
                        )}
                      </div>

                      {/* Contenido */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span 
                            className="text-sm font-semibold text-text-emphasis dark:text-text-emphasis truncate cursor-pointer hover:text-brand-500 dark:hover:text-brand-400 transition-colors"
                            title={notification.TITLE}
                          >
                            {notification.TITLE}
                          </span>
                          {/* Badge de tipo */}
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium ${typeStyle.bg} ${typeStyle.text} flex-shrink-0`}>
                            {typeStyle.label}
                          </span>
                        </div>
                        
                        {/* Mensaje */}
                        <p 
                          className="text-xs text-text-secondary dark:text-text-tertiary line-clamp-2 mb-1.5"
                        >
                          {notification.MESSAGE}
                        </p>

                        <div className="flex items-center gap-2 text-[10px] text-text-tertiary">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{formatDateTime(notification.CREATED_AT)}</span>
                        </div>
                      </div>

                      {/* Botón marcar como leído (visible en hover) */}
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification.NOTIFICATION_ID);
                        }}
                        className={`opacity-0 group-hover:opacity-100 absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all ${
                          notification.READ 
                            ? 'text-text-tertiary hover:bg-bg-secondary dark:hover:bg-white/5' 
                            : 'text-brand-500 hover:bg-brand-500 hover:text-white'
                        }`}
                        aria-label="Marcar como leído"
                      >
                        {notification.READ ? (
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        
        {/* Footer */}
        <div className="flex-shrink-0 p-3 border-t border-border-light dark:border-border-dark bg-bg-secondary/30 dark:bg-white/5">
          <button
            onClick={() => {
              closeDropdown();
              navigate('/notifications');
            }}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-sm font-medium text-text-secondary hover:text-brand-500 dark:text-text-tertiary dark:hover:text-brand-400 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            Ver todas las notificaciones
          </button>
        </div>
        </div>
      </Dropdown>
    </div>
  );
}
