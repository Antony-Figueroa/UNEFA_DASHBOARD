import { supabase } from '../lib/supabase.js';

export type NotificationType = 'pre_enrollment' | 'enrollment' | 'tracking' | 'tracking_visit' | 'user_management' | 'reminder' | 'system' | 'approval';

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-VE', { day: '2-digit', month: 'long', year: 'numeric' });
};

const getActiveUsers = async (): Promise<number[]> => {
  const { data, error } = await supabase
    .from('t_user')
    .select('USER_ID')
    .eq('STATUS', 1);

  if (error || !data || data.length === 0) return [];
  return data.map(u => u.USER_ID);
};

const insertNotifications = async (
  userIds: number[],
  type: NotificationType,
  title: string,
  message: string
): Promise<boolean> => {
  const notifications = userIds.map(USER_ID => ({
    USER_ID,
    TYPE: type,
    TITLE: title,
    MESSAGE: message,
    READ: false,
  }));

  const { error } = await supabase.from('t_notifications').insert(notifications);
  return !error;
};

export const periodNotificationService = {
  notifyPeriodCreated: async (period: { description: string; startDate: string; endDate: string; periodStatus: string }): Promise<boolean> => {
    const userIds = await getActiveUsers();
    if (userIds.length === 0) return false;
    return insertNotifications(
      userIds,
      'system',
      '📅 Nuevo Período Académico Creado',
      `Se ha creado el período "${period.description}" (${formatDate(period.startDate)} - ${formatDate(period.endDate)}).`
    );
  },

  notifyPeriodUpdated: async (period: { description: string; startDate: string; endDate: string; oldDescription?: string; changes?: string[] }): Promise<boolean> => {
    const userIds = await getActiveUsers();
    if (userIds.length === 0) return false;
    return insertNotifications(
      userIds,
      'system',
      '✏️ Período Académico Modificado',
      `El período "${period.oldDescription || period.description}" ha sido actualizado.`
    );
  },

  notifyPeriodDeleted: async (period: { description: string }): Promise<boolean> => {
    const userIds = await getActiveUsers();
    if (userIds.length === 0) return false;
    return insertNotifications(
      userIds,
      'system',
      '🗑️ Período Académico Eliminado',
      `El período "${period.description}" ha sido eliminado.`
    );
  },

  notifyPeriodStarted: async (period: { description: string; startDate: string; endDate: string }): Promise<boolean> => {
    const userIds = await getActiveUsers();
    if (userIds.length === 0) return false;
    return insertNotifications(
      userIds,
      'system',
      '🚀 Período Académico Iniciado',
      `El período "${period.description}" ha iniciado formalmente.`
    );
  },

  notifyPeriodEnded: async (period: { description: string; endDate: string; manuallyEnded?: boolean }): Promise<boolean> => {
    const userIds = await getActiveUsers();
    if (userIds.length === 0) return false;
    return insertNotifications(
      userIds,
      'system',
      '🏁 Período Académico Finalizado',
      `El período "${period.description}" ha finalizado.`
    );
  },

  notifyPeriodEndingSoon: async (period: { description: string; endDate: string }, daysRemaining: number): Promise<boolean> => {
    const userIds = await getActiveUsers();
    if (userIds.length === 0) return false;

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

    return insertNotifications(userIds, 'reminder', title, message);
  },
};
