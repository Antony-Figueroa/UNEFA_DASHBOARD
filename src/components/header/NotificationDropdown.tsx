import { useState } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { Link } from "react-router";
import { useNotifications } from "../../features/notifications/hooks/useNotifications";
import { notificationTypeIcons } from "../../features/notifications/types";
import { formatDistanceToNow } from "../../utils/date";

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const { 
    notifications, 
    unreadCount, 
    loading, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    fetchMore 
  } = useNotifications({ autoConnect: true });

  function toggleDropdown() {
    setIsOpen(!isOpen);
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
        className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-80 md:w-87.5 lg:w-90.25 max-h-[80vh] flex flex-col rounded-2xl border border-border-light bg-white p-3 shadow-theme-md dark:border-border-dark dark:bg-bg-dark transition-colors duration-300 z-50"
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-border-light dark:border-border-dark">
          <h5 className="text-base font-semibold text-text-emphasis dark:text-text-emphasis flex items-center gap-2">
            Notificaciones
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-medium bg-warning-500 text-white rounded-full">
                {unreadCount}
              </span>
            )}
          </h5>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-brand-500 hover:text-brand-600 transition-colors"
              >
                Marcar todo leído
              </button>
            )}
            <button
              onClick={toggleDropdown}
              className="transition-all duration-200 text-text-secondary dark:text-text-tertiary hover:text-text-emphasis dark:hover:text-text-emphasis"
            >
              <svg
                className="fill-current"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z"
                  fill="currentColor"
                />
              </svg>
            </button>
          </div>
        </div>
        
        <ul className="flex flex-col h-auto overflow-y-auto custom-scrollbar max-h-80">
          {loading && notifications.length === 0 ? (
            <li className="p-4 text-center text-text-secondary">
              <div className="animate-pulse flex flex-col items-center gap-2">
                <div className="h-2 w-20 bg-gray-200 rounded"></div>
                <div className="h-2 w-16 bg-gray-200 rounded"></div>
              </div>
            </li>
          ) : notifications.length === 0 ? (
            <li className="p-4 text-center text-text-secondary">
              <div className="flex flex-col items-center gap-2">
                <svg className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <p>No hay notificaciones</p>
              </div>
            </li>
          ) : (
            notifications.slice(0, 10).map((notification) => (
              <li key={notification.NOTIFICATION_ID}>
                <DropdownItem
                  onItemClick={() => handleClick(notification.NOTIFICATION_ID)}
                  className={`flex gap-3 rounded-lg border-b border-border-light p-3 px-4.5 py-3 hover:bg-brand-500 hover:text-white group dark:border-border-dark dark:hover:bg-brand-500 dark:hover:text-white ${
                    !notification.READ ? 'bg-brand-50 dark:bg-brand-900/20' : ''
                  }`}
                >
                  <span className="relative block w-9 h-9 rounded-full z-1 max-w-9 flex-shrink-0">
                    <div className="w-full h-full rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-lg">
                      {notificationTypeIcons[notification.TYPE] || '📢'}
                    </div>
                    {!notification.READ && (
                      <span className="absolute bottom-0 right-0 z-10 h-2.5 w-2.5 rounded-full bg-brand-500 border-2 border-white dark:border-bg-dark"></span>
                    )}
                  </span>

                  <span className="block flex-1 min-w-0">
                    <span className="mb-1.5 block text-sm text-text-secondary group-hover:text-white dark:text-text-tertiary dark:group-hover:text-white">
                      <span className="font-medium text-text-emphasis group-hover:text-white dark:text-text-emphasis dark:group-hover:text-white">
                        {notification.TITLE}
                      </span>
                    </span>
                    <span className="block text-xs text-text-secondary group-hover:text-white dark:text-text-tertiary dark:group-hover:text-white line-clamp-2">
                      {notification.MESSAGE}
                    </span>
                    <span className="flex items-center gap-2 text-xs text-text-tertiary group-hover:text-white mt-1">
                      {formatDistanceToNow(notification.CREATED_AT, { addSuffix: true })}
                    </span>
                  </span>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notification.NOTIFICATION_ID);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-error-500 hover:text-white rounded"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </DropdownItem>
              </li>
            ))
          )}
          
          {notifications.length > 10 && (
            <li className="p-2 text-center">
              <button
                onClick={() => fetchMore()}
                className="text-sm text-brand-500 hover:text-brand-600"
              >
                Ver más notificaciones
              </button>
            </li>
          )}
        </ul>
        
        <Link
          to="/"
          onClick={closeDropdown}
          className="block px-4 py-2 mt-3 text-sm font-medium text-center rounded-lg text-text-primary bg-bg-main border border-border-light hover:bg-brand-500 hover:text-white dark:border-border-dark dark:bg-bg-dark dark:text-text-tertiary dark:hover:bg-brand-500 dark:hover:text-white transition-colors"
        >
          Ver Todas las Notificaciones
        </Link>
      </Dropdown>
    </div>
  );
}
