import { supabase } from '../lib/supabase.js';
import { sendNotificationByRole, sendNotificationToUser } from './sse.service.js';

export type NotificationType = 'pre_enrollment' | 'enrollment' | 'tracking' | 'tracking_visit' | 'user_management' | 'reminder' | 'system' | 'approval';

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-VE', { day: '2-digit', month: 'long', year: 'numeric' });
};

export const periodNotificationService = {
  notifyPeriodCreated: async (period: { description: string; startDate: string; endDate: string; periodStatus: string }): Promise<boolean> => {
    // Usar SSE service para notificación en tiempo real + persistencia en DB
    const result = await sendNotificationByRole(
      'all', // Enviar a todos los usuarios activos
      'system',
      '📅 Nuevo Período Académico Creado',
      `Se ha creado el período "${period.description}" (${formatDate(period.startDate)} - ${formatDate(period.endDate)}).`
    );
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
    const result = await sendNotificationByRole(
      'all',
      'system',
      '🚀 Período Académico Iniciado',
      `El período "${period.description}" ha iniciado formalmente.`
    );
    return !!result;
  },

  notifyPeriodEnded: async (period: { description: string; endDate: string; manuallyEnded?: boolean }): Promise<boolean> => {
    const result = await sendNotificationByRole(
      'all',
      'system',
      '🏁 Período Académico Finalizado',
      `El período "${period.description}" ha finalizado.`
    );
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

    const result = await sendNotificationByRole('all', 'reminder', title, message);
    return !!result;
  },

  // Método genérico para notificaciones a todos los usuarios
  notifyAll: async (type: NotificationType, title: string, message: string): Promise<boolean> => {
    const result = await sendNotificationByRole('all', type, title, message);
    return !!result;
  },
};
