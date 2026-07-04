/**
 * @file NotificationsPage.tsx
 * @description Página principal para la gestión de Notificaciones.
 * Muestra todas las notificaciones del usuario con filtros, paginación y acciones.
 */

import { useState, useCallback, useEffect } from "react";
import { usePageTitle } from "../../hooks/usePageTitle";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import Button from "../../components/ui/button/Button";
import { Pagination } from "../../components/ui/table";
import { useNotifications } from "../../features/notifications/hooks/useNotifications";
import { notificationTypeIcons } from "../../features/notifications/types";
import { formatDateTime } from "../../utils/date";
import { useToast } from "../../context/toast";
import { TOAST } from "../../components/ui/dialog/DialogConfig";

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

const getTypeStyle = (type: string) => {
  return notificationTypeStyles[type] || notificationTypeStyles.system;
};

// Opciones de filtro por tipo
const typeFilters = [
  { value: 'all', label: 'Todos los tipos' },
  { value: 'system', label: 'Sistema' },
  { value: 'pre_enrollment', label: 'Pre-inscripción' },
  { value: 'enrollment', label: 'Inscripción' },
  { value: 'tracking', label: 'Pasantía' },
  { value: 'tracking_visit', label: 'Visita' },
  { value: 'user_management', label: 'Usuario' },
  { value: 'reminder', label: 'Recordatorio' },
  { value: 'approval', label: 'Aprobación' },
];

// Opciones de filtro por estado
const statusFilters = [
  { value: 'all', label: 'Todas' },
  { value: 'unread', label: 'No leídas' },
  { value: 'read', label: 'Leídas' },
];

// Componente Card reutilizable
const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-2xl border border-border-light bg-white dark:bg-bg-dark transition-all duration-300 shadow-theme-md ${className}`}>
    {children}
  </div>
);

const CardHeader = ({ children }: { children: React.ReactNode }) => (
  <div className="px-6 py-5 border-b border-border-light dark:border-border-dark">
    {children}
  </div>
);

const CardBody = ({ children }: { children: React.ReactNode }) => (
  <div className="p-4 sm:p-6">
    {children}
  </div>
);

export default function NotificationsPage() {
  const { addToast } = useToast();
  const { setPageTitle } = usePageTitle();
  
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  const { 
    notifications, 
    unreadCount, 
    loading, 
    markAsRead, 
    markAllAsRead, 
    refreshNotifications 
  } = useNotifications({ autoConnect: false });
  
  // Filtrar notificaciones
  const filteredNotifications = notifications.filter(n => {
    const typeMatch = typeFilter === 'all' || n.TYPE === typeFilter;
    const statusMatch = statusFilter === 'all' || 
      (statusFilter === 'unread' && !n.READ) ||
      (statusFilter === 'read' && n.READ);
    return typeMatch && statusMatch;
  });
  
  // Paginación
  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedNotifications = filteredNotifications.slice(startIndex, startIndex + itemsPerPage);
  
  // Resetear página cuando cambian los filtros
  const handleTypeFilterChange = useCallback((value: string) => {
    setTypeFilter(value);
    setCurrentPage(1);
  }, []);
  
  const handleStatusFilterChange = useCallback((value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  }, []);
  
  const handleMarkAsRead = useCallback((id: number) => {
    markAsRead(id);
  }, [markAsRead]);
  
  const handleMarkAllAsRead = useCallback(() => {
    markAllAsRead();
    addToast({ variant: "success", title: "Notificaciones leídas", message: "Todas las notificaciones se marcaron como leídas." });
  }, [markAllAsRead]);

  return (
    <>
      <PageBreadcrumb pageTitle="Notificaciones" />
      
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Header con estadísticas y acciones */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <svg className="w-6 h-6 text-brand-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <h2 className="text-lg font-semibold text-text-emphasis dark:text-text-emphasis">
                    Notificaciones
                  </h2>
                </div>
                {unreadCount > 0 && (
                  <span className="px-2.5 py-1 text-xs font-medium bg-brand-500 text-white rounded-full shrink-0">
                    {unreadCount} sin leer
                  </span>
                )}
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshNotifications}
                  disabled={loading}
                >
                  <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Actualizar
                </Button>
                {unreadCount > 0 && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleMarkAllAsRead}
                    disabled={loading}
                  >
                    <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Marcar todo leído
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>
        
        {/* Filtros */}
        <Card>
          <CardBody>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="sm:col-span-1 lg:col-span-1">
                <label className="block text-xs font-medium text-text-secondary dark:text-text-tertiary mb-1.5">
                  Tipo de notificación
                </label>
                <select
                  value={typeFilter}
                  onChange={(e) => handleTypeFilterChange(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-border-light dark:border-border-dark rounded-lg bg-bg-main dark:bg-bg-dark text-text-emphasis dark:text-text-emphasis focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {typeFilters.map(filter => (
                    <option key={filter.value} value={filter.value}>
                      {filter.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="sm:col-span-1 lg:col-span-1">
                <label className="block text-xs font-medium text-text-secondary dark:text-text-tertiary mb-1.5">
                  Estado
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => handleStatusFilterChange(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-border-light dark:border-border-dark rounded-lg bg-bg-main dark:bg-bg-dark text-text-emphasis dark:text-text-emphasis focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {statusFilters.map(filter => (
                    <option key={filter.value} value={filter.value}>
                      {filter.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="sm:col-span-2 lg:col-span-2 flex items-end justify-end lg:justify-start">
                <span className="text-sm text-text-tertiary">
                  {filteredNotifications.length} resultado{filteredNotifications.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </CardBody>
        </Card>
        
        {/* Lista de notificaciones */}
        <Card>
          {loading && notifications.length === 0 ? (
            <CardBody>
              <div className="flex flex-col items-center justify-center py-16 text-text-secondary">
                <div className="w-10 h-10 border-3 border-brand-200 border-t-brand-500 rounded-full animate-spin mb-4"></div>
                <p className="text-sm">Cargando notificaciones...</p>
              </div>
            </CardBody>
          ) : filteredNotifications.length === 0 ? (
            <CardBody>
              <div className="flex flex-col items-center justify-center py-16 text-text-secondary">
                <div className="w-16 h-16 rounded-full bg-bg-secondary dark:bg-white/5 flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-text-secondary">No hay notificaciones</p>
                <p className="text-xs text-text-tertiary mt-1">
                  {typeFilter !== 'all' || statusFilter !== 'all' 
                    ? 'Intenta con otros filtros' 
                    : 'Las notificaciones aparecerán aquí'}
                </p>
              </div>
            </CardBody>
          ) : (
            <div className="divide-y divide-border-light dark:divide-border-dark">
              {paginatedNotifications.map((notification) => {
                const typeStyle = getTypeStyle(notification.TYPE);
                return (
                  <div
                    key={notification.NOTIFICATION_ID}
                    className={`group relative p-4 hover:bg-bg-secondary/50 dark:hover:bg-white/5 transition-colors ${
                      !notification.READ ? 'bg-brand-50/30 dark:bg-brand-900/10' : ''
                    }`}
                  >
                    <div className="flex gap-3 sm:gap-4">
                      {/* Icono de tipo */}
                      <div className={`relative flex-shrink-0 w-10 sm:w-12 h-10 sm:h-12 rounded-xl ${typeStyle.bg} flex items-center justify-center`}>
                        <span className="text-lg sm:text-xl">
                          {notificationTypeIcons[notification.TYPE] || '📢'}
                        </span>
                        {!notification.READ && (
                          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-brand-500 rounded-full border-2 border-white dark:border-bg-dark"></span>
                        )}
                      </div>
                      
                      {/* Contenido */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 flex-wrap min-w-0">
                            <span 
                              className="text-sm font-semibold text-text-emphasis dark:text-text-emphasis truncate cursor-pointer hover:text-brand-500 dark:hover:text-brand-400 transition-colors"
                              title={notification.TITLE}
                            >
                              {notification.TITLE}
                            </span>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium ${typeStyle.bg} ${typeStyle.text} shrink-0`}>
                              {typeStyle.label}
                            </span>
                            {notification.READ && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 shrink-0">
                                Leída
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* Mensaje - al hacer hover muestra un toast con info completa */}
                        <p 
                          className="text-sm text-text-secondary dark:text-text-tertiary mb-2 line-clamp-2 cursor-pointer hover:text-brand-500 dark:hover:text-brand-400 transition-colors"
                          onMouseEnter={() => {
                            addToast({ variant: "info", title: notification.TITLE, message: notification.MESSAGE });
                          }}
                        >
                          {notification.MESSAGE}
                        </p>
                        
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-tertiary">
                          <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {formatDateTime(notification.CREATED_AT)}
                          </span>
                          {notification.READ_AT && (
                            <span className="flex items-center gap-1">
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                              Leída {formatDateTime(notification.READ_AT)}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Acciones - solo visible en hover en desktop, siempre visible en mobile */}
                      <div className="flex sm:hidden flex-shrink-0 items-center gap-1 mt-2 sm:mt-0">
                        {!notification.READ && (
                          <button
                            onClick={() => handleMarkAsRead(notification.NOTIFICATION_ID)}
                            className="p-2 rounded-lg text-text-secondary hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
                            title="Marcar como leída"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {/* Acciones en desktop (solo hover) */}
                    <div className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 flex-col sm:flex-row items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!notification.READ && (
                        <button
                          onClick={() => handleMarkAsRead(notification.NOTIFICATION_ID)}
                          className="p-2 rounded-lg text-text-secondary hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
                          title="Marcar como leída"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            )}
            
            {/* Paginación dentro del Card */}
            {filteredNotifications.length > 0 && (
              <div className="border-t border-border-light dark:border-border-dark -mx-4 px-4 sm:-mx-6 sm:px-6 pb-4">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredNotifications.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                  onItemsPerPageChange={(newLimit) => {
                    setItemsPerPage(newLimit);
                    setCurrentPage(1);
                  }}
                  itemsPerPageOptions={[5, 10, 25, 50]}
                />
              </div>
            )}
        </Card>
      </div>
    </>
  );
}