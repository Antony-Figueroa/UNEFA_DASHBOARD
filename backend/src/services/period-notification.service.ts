import { supabase } from '../lib/supabase.js';
import { sendNotificationByRole, sendNotificationToUser } from './sse.service.js';
import { sendPeriodNotification } from '../utils/email.utils.js';

export type NotificationType = 'pre_enrollment' | 'enrollment' | 'tracking' | 'tracking_visit' | 'user_management' | 'reminder' | 'system' | 'approval';

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-VE', { day: '2-digit', month: 'long', year: 'numeric' });
};

/**
 * Obtiene los usuarios activos del sistema para notificaciones de período
 */
const getAllActiveUsers = async (): Promise<Array<{ email: string; name: string }>> => {
  try {
    const { data: users, error } = await supabase
      .from('t_users')
      .select('EMAIL, NAME')
      .eq('STATUS', 1);

    if (error || !users) return [];
    return (users as any[]).map(u => ({ email: u.EMAIL, name: u.NAME }));
  } catch (err) {
    console.error('[PeriodNotification] Error fetching users:', err);
    return [];
  }
};

export const periodNotificationService = {
  notifyPeriodCreated: async (period: { description: string; startDate: string; endDate: string; periodStatus: string }): Promise<boolean> => {
    // Notificación in-app
    const result = await sendNotificationByRole(
      'all',
      'system',
      '📅 Nuevo Período Académico Creado',
      `Se ha creado el período "${period.description}" (${formatDate(period.startDate)} - ${formatDate(period.endDate)}).`
    );

    // Email a todos los usuarios activos
    const users = await getAllActiveUsers();
    sendPeriodNotification(
      users,
      '📅 Nuevo Período Académico',
      `Se ha creado el período "${period.description}" (${formatDate(period.startDate)} - ${formatDate(period.endDate)}).`,
      period.description
    ).catch(err => console.error('[PeriodNotification] Email error:', err));

    return !!result;
  },

  notifyPeriodUpdated: async (period: { description: string; startDate: string; endDate: string; oldDescription?: string; changes?: string[] }): Promise<boolean> => {
    const result = await sendNotificationByRole(
      'all',
      'system',
      '✏️ Período Académico Modificado',
      `El período "${period.oldDescription || period.description}" ha sido actualizado.`
    );
    return !!result;
  },

  notifyPeriodDeleted: async (period: { description: string }): Promise<boolean> => {
    const result = await sendNotificationByRole(
      'all',
      'system',
      '🗑️ Período Académico Eliminado',
      `El período "${period.description}" ha sido eliminado.`
    );
    return !!result;
  },

  notifyPeriodStarted: async (period: { description: string; startDate: string; endDate: string }): Promise<boolean> => {
    // Notificación in-app
    const result = await sendNotificationByRole(
      'all',
      'system',
      '🚀 Período Académico Iniciado',
      `El período "${period.description}" ha iniciado formalmente.`
    );

    // Email a todos los usuarios activos
    const users = await getAllActiveUsers();
    sendPeriodNotification(
      users,
      '🚀 Período Académico Iniciado',
      `El período "${period.description}" ha iniciado formalmente. Ingresá al sistema para más detalles.`,
      period.description
    ).catch(err => console.error('[PeriodNotification] Email error:', err));

    return !!result;
  },

  notifyPeriodEnded: async (period: { description: string; endDate: string; manuallyEnded?: boolean }): Promise<boolean> => {
    // Notificación in-app
    const result = await sendNotificationByRole(
      'all',
      'system',
      '🏁 Período Académico Finalizado',
      `El período "${period.description}" ha finalizado.`
    );

    // Email a todos los usuarios activos
    const users = await getAllActiveUsers();
    const endedBy = period.manuallyEnded ? ' manualmente' : '';
    sendPeriodNotification(
      users,
      '🏁 Período Académico Finalizado',
      `El período "${period.description}" ha finalizado${endedBy}. Revisá tus actividades pendientes.`,
      period.description
    ).catch(err => console.error('[PeriodNotification] Email error:', err));

    return !!result;
  },

  notifyPeriodEndingSoon: async (period: { description: string; endDate: string }, daysRemaining: number): Promise<boolean> => {
    let title = '';
    let message = '';

    if (daysRemaining === 7) {
      title = '⏰ 7 días para fin de período';
      message = `Queda 1 semana para que finalice el período "${period.description}".`;
    } else if (daysRemaining <= 3 && daysRemaining > 1) {
      title = '⚠️ Período por finalizar';
      message = `Quedan solo ${daysRemaining} días para el fin del período "${period.description}".`;
    } else if (daysRemaining === 1) {
      title = '🔴 ¡Último día!';
      message = `El período "${period.description}" finaliza HOY.`;
    } else {
      title = '⏰ Recordatorio de período';
      message = `Quedan ${daysRemaining} días para que finalice el período "${period.description}".`;
    }

    // Notificación in-app
    const result = await sendNotificationByRole('all', 'reminder', title, message);

    // Email recordatorio
    const users = await getAllActiveUsers();
    sendPeriodNotification(users, title, message, period.description)
      .catch(err => console.error('[PeriodNotification] Email error:', err));

    return !!result;
  },

  // Método genérico para notificaciones a todos los usuarios
  notifyAll: async (type: NotificationType, title: string, message: string): Promise<boolean> => {
    const result = await sendNotificationByRole('all', type, title, message);
    return !!result;
  },
};
