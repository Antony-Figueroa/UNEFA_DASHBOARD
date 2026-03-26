import { supabase } from '../lib/supabase.js';

/**
 * Tipos de notificaciones del sistema
 * Valores permitidos por el constraint chk_notification_type en BD:
 * 'pre_enrollment', 'enrollment', 'tracking', 'tracking_visit', 
 * 'user_management', 'reminder', 'system', 'approval'
 */
export type NotificationType = 'pre_enrollment' | 'enrollment' | 'tracking' | 'tracking_visit' | 'user_management' | 'reminder' | 'system' | 'approval';

/**
 * Servicio de notificaciones para períodos académicos
 * Maneja la creación de notificaciones cuando ocurre un evento relacionado con períodos
 */
export const periodNotificationService = {
  /**
   * Notifica a todos los usuarios activos sobre un nuevo período académico
   */
  notifyPeriodCreated: async (period: {
    description: string;
    startDate: string;
    endDate: string;
    periodStatus: string;
  }): Promise<boolean> => {
    try {
      // Obtener todos los usuarios activos
      const { data: users, error: usersError } = await supabase
        .from('t_user')
        .select('USER_ID')
        .eq('STATUS', 1);

      console.log('[PeriodNotifications] Usuarios activos encontrados:', users?.length || 0);
      if (usersError) {
        console.error('[PeriodNotifications] Error consultando usuarios:', usersError);
      }

      if (usersError || !users || users.length === 0) {
        console.warn('[PeriodNotifications] No hay usuarios activos para notificar');
        return false;
      }

      const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('es-VE', { day: '2-digit', month: 'long', year: 'numeric' });
      };

        const notifications = users.map(user => ({
        USER_ID: user.USER_ID,
        TYPE: 'system' as const,
        TITLE: '📅 Nuevo Período Académico Creado',
        MESSAGE: `Se ha creado el período "${period.description}" que startará el ${formatDate(period.startDate)} y finalizará el ${formatDate(period.endDate)}.`,
        READ: false,
      }));

      console.log('[PeriodNotifications] Insertando notificaciones:', notifications.length);

      const { error } = await supabase.from('t_notifications').insert(notifications);

      if (error) {
        console.error('[PeriodNotifications] Error insertando notificaciones:', error);
        throw error;
      }

      console.log(`[PeriodNotifications] Notificación de período creado enviada a ${users.length} usuarios`);
      return true;
    } catch (error) {
      console.error('[PeriodNotifications] Error creando notificación de período creado:', error);
      return false;
    }
  },

  /**
   * Notifica a todos los usuarios cuando un período se edita
   */
  notifyPeriodUpdated: async (period: {
    description: string;
    startDate: string;
    endDate: string;
    oldDescription?: string;
    changes?: string[];
  }): Promise<boolean> => {
    try {
      const { data: users, error: usersError } = await supabase
        .from('t_user')
        .select('USER_ID')
        .eq('STATUS', 1);

      if (usersError || !users || users.length === 0) {
        return false;
      }

      const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('es-VE', { day: '2-digit', month: 'long', year: 'numeric' });
      };

      const changesText = period.changes?.length 
        ? `\nCambios realizados: ${period.changes.join(', ')}` 
        : '';

      const notifications = users.map(user => ({
        USER_ID: user.USER_ID,
        TYPE: 'reminder' as const,
        TITLE: '📅 Período Académico Actualizado',
        MESSAGE: `El período "${period.oldDescription || period.description}" ha sido modificado.\nNueva fecha: ${formatDate(period.startDate)} - ${formatDate(period.endDate)}${changesText}`,
        READ: false,
      }));

      const { error } = await supabase.from('t_notifications').insert(notifications);

      if (error) throw error;

      console.log(`[PeriodNotifications] Notificación de período actualizado enviada a ${users.length} usuarios`);
      return true;
    } catch (error) {
      console.error('[PeriodNotifications] Error creando notificación de período actualizado:', error);
      return false;
    }
  },

  /**
   * Notifica a todos los usuarios cuando un período se elimina (soft delete)
   */
  notifyPeriodDeleted: async (period: { description: string }): Promise<boolean> => {
    try {
      const { data: users, error: usersError } = await supabase
        .from('t_user')
        .select('USER_ID')
        .eq('STATUS', 1);

      if (usersError || !users || users.length === 0) {
        return false;
      }

      const notifications = users.map(user => ({
        USER_ID: user.USER_ID,
        TYPE: 'system' as const,
        TITLE: '📅 Período Académico Eliminado',
        MESSAGE: `El período "${period.description}" ha sido eliminado del sistema.`,
        READ: false,
      }));

      const { error } = await supabase.from('t_notifications').insert(notifications);

      if (error) throw error;

      console.log(`[PeriodNotifications] Notificación de período eliminado enviada a ${users.length} usuarios`);
      return true;
    } catch (error) {
      console.error('[PeriodNotifications] Error creando notificación de período eliminado:', error);
      return false;
    }
  },

  /**
   * Notifica cuando un período cambia a estado "En Curso" (PERIOD_STATUS = 2)
   */
  notifyPeriodStarted: async (period: {
    description: string;
    startDate: string;
    endDate: string;
  }): Promise<boolean> => {
    try {
      const { data: users, error: usersError } = await supabase
        .from('t_user')
        .select('USER_ID')
        .eq('STATUS', 1);

      if (usersError || !users || users.length === 0) {
        return false;
      }

      const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('es-VE', { day: '2-digit', month: 'long', year: 'numeric' });
      };

      const endDate = new Date(period.endDate);
      const daysRemaining = Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

      const notifications = users.map(user => ({
        USER_ID: user.USER_ID,
        TYPE: 'system' as const,
        TITLE: '🚀 Período Académico en Curso',
        MESSAGE: `¡El período "${period.description}" ha comenzado!\n📅 Del ${formatDate(period.startDate)} al ${formatDate(period.endDate)}\n⏱️ Duración: ${daysRemaining} días`,
        READ: false,
      }));

      const { error } = await supabase.from('t_notifications').insert(notifications);

      if (error) throw error;

      console.log(`[PeriodNotifications] Notificación de período iniciado enviada a ${users.length} usuarios`);
      return true;
    } catch (error) {
      console.error('[PeriodNotifications] Error creando notificación de período iniciado:', error);
      return false;
    }
  },

  /**
   * Notifica cuando un período finaliza (manualmente o por tiempo)
   */
  notifyPeriodEnded: async (period: {
    description: string;
    endDate: string;
    manuallyEnded?: boolean;
  }): Promise<boolean> => {
    try {
      const { data: users, error: usersError } = await supabase
        .from('t_user')
        .select('USER_ID')
        .eq('STATUS', 1);

      if (usersError || !users || users.length === 0) {
        return false;
      }

      const reason = period.manuallyEnded 
        ? 'finalizado manualmente por un administrador' 
        : 'ha llegado a su fecha de finalización';

      const notifications = users.map(user => ({
        USER_ID: user.USER_ID,
        TYPE: 'reminder' as const,
        TITLE: '📅 Período Académico Finalizado',
        MESSAGE: `El período "${period.description}" ha ${reason}.\nGracias por su participación durante este período.`,
        READ: false,
      }));

      const { error } = await supabase.from('t_notifications').insert(notifications);

      if (error) throw error;

      console.log(`[PeriodNotifications] Notificación de período finalizado enviada a ${users.length} usuarios`);
      return true;
    } catch (error) {
      console.error('[PeriodNotifications] Error creando notificación de período finalizado:', error);
      return false;
    }
  },

  /**
   * Notifica cuando falta X días para que termine el período
   * @param daysRemaining Días restantes
   */
  notifyPeriodEndingSoon: async (period: {
    description: string;
    endDate: string;
  }, daysRemaining: number): Promise<boolean> => {
    try {
      const { data: users, error: usersError } = await supabase
        .from('t_user')
        .select('USER_ID')
        .eq('STATUS', 1);

      if (usersError || !users || users.length === 0) {
        return false;
      }

      const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('es-VE', { day: '2-digit', month: 'long', year: 'numeric' });
      };

      let urgencyMessage = '';
      let notificationType: 'INFO' | 'WARNING' | 'ERROR' = 'INFO';

      if (daysRemaining === 7) {
        urgencyMessage = '⌛ Queda 1 semana para que finalice el período académico.';
        notificationType = 'WARNING';
      } else if (daysRemaining <= 3) {
        urgencyMessage = '⚠️ Quedan solo 3 días para el fin del período.';
        notificationType = 'WARNING';
      } else if (daysRemaining === 1) {
        urgencyMessage = '🔴 ULTIMO DÍA! El período académico finaliza hoy.';
        notificationType = 'ERROR';
      } else {
        urgencyMessage = `⏰ Quedan ${daysRemaining} días para que finalice el período.`;
      }

      const notifications = users.map(user => ({
        USER_ID: user.USER_ID,
        TYPE: notificationType,
        TITLE: '📅 Recordatorio: Período Académico',
        MESSAGE: `${urgencyMessage}\nPeríodo: ${period.description}\nFecha final: ${formatDate(period.endDate)}\n\nAsegúrate de completar todas las actividades pendientes.`,
        READ: false,
      }));

      const { error } = await supabase.from('t_notifications').insert(notifications);

      if (error) throw error;

      console.log(`[PeriodNotifications] Notificación de recordatorio (${daysRemaining} días) enviada a ${users.length} usuarios`);
      return true;
    } catch (error) {
      console.error('[PeriodNotifications] Error creando notificación de recordatorio:', error);
      return false;
    }
  },
};