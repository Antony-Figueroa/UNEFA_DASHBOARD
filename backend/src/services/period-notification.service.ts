import { supabase } from '../lib/supabase.js';
import { sendNotificationByRole, sendNotificationToUser, sendNotificationToMultipleUsers } from './sse.service.js';
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
      'Nuevo Período Académico Creado',
      `Se ha creado el período "${period.description}" (${formatDate(period.startDate)} - ${formatDate(period.endDate)}).`
    );

    // Email a todos los usuarios activos
    const users = await getAllActiveUsers();
    sendPeriodNotification(
      users,
      'Nuevo Período Académico',
      `Se ha creado el período "${period.description}" (${formatDate(period.startDate)} - ${formatDate(period.endDate)}).`,
      period.description
    ).catch(err => console.error('[PeriodNotification] Email error:', err));

    return !!result;
  },

  notifyPeriodUpdated: async (period: { description: string; startDate: string; endDate: string; oldDescription?: string; changes?: string[] }): Promise<boolean> => {
    const result = await sendNotificationByRole(
      'all',
      'system',
      'Período Académico Modificado',
      `El período "${period.oldDescription || period.description}" ha sido actualizado.`
    );
    return !!result;
  },

  notifyPeriodDeleted: async (period: { description: string }): Promise<boolean> => {
    const result = await sendNotificationByRole(
      'all',
      'system',
      'Período Académico Eliminado',
      `El período "${period.description}" ha sido eliminado.`
    );
    return !!result;
  },

  notifyPeriodStarted: async (period: { description: string; startDate: string; endDate: string }): Promise<boolean> => {
    // Notificación in-app
    const result = await sendNotificationByRole(
      'all',
      'system',
      'Período Académico Iniciado',
      `El período "${period.description}" ha iniciado formalmente.`
    );

    // Email a todos los usuarios activos
    const users = await getAllActiveUsers();
    sendPeriodNotification(
      users,
      'Período Académico Iniciado',
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
      'Período Académico Finalizado',
      `El período "${period.description}" ha finalizado.`
    );

    // Email a todos los usuarios activos
    const users = await getAllActiveUsers();
    const endedBy = period.manuallyEnded ? ' manualmente' : '';
    sendPeriodNotification(
      users,
      'Período Académico Finalizado',
      `El período "${period.description}" ha finalizado${endedBy}. Revisá tus actividades pendientes.`,
      period.description
    ).catch(err => console.error('[PeriodNotification] Email error:', err));

    return !!result;
  },

  notifyPeriodEndingSoon: async (period: { description: string; endDate: string }, daysRemaining: number): Promise<boolean> => {
    let title = '';
    let message = '';

    if (daysRemaining === 7) {
      title = '7 días para fin de período';
      message = `Queda 1 semana para que finalice el período "${period.description}".`;
    } else if (daysRemaining <= 3 && daysRemaining > 1) {
      title = 'Período por finalizar';
      message = `Quedan solo ${daysRemaining} días para el fin del período "${period.description}".`;
    } else if (daysRemaining === 1) {
      title = '¡Último día!';
      message = `El período "${period.description}" finaliza HOY.`;
    } else {
      title = 'Recordatorio de período';
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

  /**
   * Notifica a los estudiantes de un período que NO han completado la inscripción
   * que la holgura (grace period) de inscripción está por cerrar.
   */
  notifyGracePeriodClosing: async (periodId: number, daysRemaining: number): Promise<boolean> => {
    try {
      // Obtener STUDENTS_ID de prácticas en este período que no hayan completado inscripción
      const { data: practices, error: practicesError } = await supabase
        .from('t_professional_practices')
        .select('STUDENTS_ID')
        .eq('PERIOD_ID', periodId)
        .neq('PRACTICES_STATUS', 2); // No están INSCRITOS

      if (practicesError || !practices || practices.length === 0) return false;

      const studentIds = practices.map(p => p.STUDENTS_ID);

      // Obtener USER_ID de esos estudiantes
      const { data: students, error: studentsError } = await supabase
        .from('t_students')
        .select('USER_ID')
        .in('STUDENTS_ID', studentIds);

      if (studentsError || !students) return false;

      const userIds = students
        .map(s => s.USER_ID)
        .filter((id): id is number => id !== null && id !== undefined);

      if (userIds.length === 0) return false;

      let title = '';
      let message = '';

      if (daysRemaining === 7) {
        title = 'Holgura de inscripción: 1 semana restante';
        message = `Queda 1 semana para que cierre la holgura de inscripción del período. Completá tu inscripción a la brevedad.`;
      } else if (daysRemaining === 3) {
        title = 'Holgura de inscripción por cerrar';
        message = `Quedan solo 3 días para que cierre la holgura de inscripción del período. No esperes más.`;
      } else {
        title = 'Recordatorio de holgura de inscripción';
        message = `Quedan ${daysRemaining} días para que cierre la holgura de inscripción del período.`;
      }

      const result = await sendNotificationToMultipleUsers(userIds, 'reminder', title, message);
      return !!result;
    } catch (err) {
      console.error('[PeriodNotification] Error in notifyGracePeriodClosing:', err);
      return false;
    }
  },

  /**
   * Notifica a tutores y estudiantes que el período de evaluación ha comenzado.
   */
  notifyEvaluationOpened: async (periodId: number): Promise<boolean> => {
    try {
      const title = 'Período de evaluación iniciado';
      const message = 'El período de evaluación de pasantías ha comenzado. Ingresá al sistema para más detalles.';

      // Notificar a tutores
      await sendNotificationByRole('tutor', 'evaluation', title, message);
      // Notificar a estudiantes
      await sendNotificationByRole('student', 'evaluation', title, message);

      return true;
    } catch (err) {
      console.error('[PeriodNotification] Error in notifyEvaluationOpened:', err);
      return false;
    }
  },

  /**
   * Notifica a coordinadores cuando un período se cierra y hay prácticas con evaluaciones pendientes.
   */
  notifyPeriodClosedWithPendingEvaluations: async (
    periodId: number,
    periodName: string,
    pendingCount: number
  ): Promise<boolean> => {
    try {
      const title = 'Período cerrado — evaluaciones pendientes';
      const message = `El período "${periodName}" ha sido cerrado. Quedan ${pendingCount} prácticas con evaluaciones pendientes. Revisá el reporte de evaluaciones pendientes.`;

      // Notificar a coordinadores (role = 'coordinador')
      const result = await sendNotificationByRole('coordinador', 'system', title, message);

      // Email a coordinadores
      const { data: coordinatorUsers, error } = await supabase
        .from('t_users')
        .select('EMAIL, NAME')
        .eq('STATUS', 1)
        .eq('ROLE_ID', 3); // ROLE_ID = 3 es coordinador

      if (!error && coordinatorUsers && coordinatorUsers.length > 0) {
        const recipients = (coordinatorUsers as any[]).map(u => ({ email: u.EMAIL, name: u.NAME }));
        sendPeriodNotification(recipients, title, message, periodName)
          .catch(err => console.error('[PeriodNotification] Email error:', err));
      }

      return !!result;
    } catch (err) {
      console.error('[PeriodNotification] Error in notifyPeriodClosedWithPendingEvaluations:', err);
      return false;
    }
  },

  /**
   * Notifica a estudiantes y tutores del período que la holgura de evaluación está por cerrar.
   */
  notifyEvaluationGraceClosing: async (periodId: number, daysRemaining: number): Promise<boolean> => {
    try {
      // Obtener STUDENTS_ID de prácticas en este período
      const { data: practices, error: practicesError } = await supabase
        .from('t_professional_practices')
        .select('STUDENTS_ID')
        .eq('PERIOD_ID', periodId);

      if (practicesError || !practices || practices.length === 0) return false;

      const studentIds = practices.map(p => p.STUDENTS_ID);

      // Obtener USER_ID de esos estudiantes
      const { data: students, error: studentsError } = await supabase
        .from('t_students')
        .select('USER_ID')
        .in('STUDENTS_ID', studentIds);

      if (studentsError) return false;

      const userIds: number[] = (students || [])
        .map(s => s.USER_ID)
        .filter((id): id is number => id !== null && id !== undefined);

      // Obtener tutores asignados a estas prácticas
      const { data: practiceIds } = await supabase
        .from('t_professional_practices')
        .select('PROFESSIONAL_PRACTICE_ID')
        .eq('PERIOD_ID', periodId);

      if (practiceIds && practiceIds.length > 0) {
        const ppIds = practiceIds.map(p => p.PROFESSIONAL_PRACTICE_ID);
        const { data: tutorLinks } = await supabase
          .from('t_professional_practices_tutor')
          .select('TUTOR_ID')
          .in('PROFESSIONAL_PRACTICE_ID', ppIds);

        if (tutorLinks && tutorLinks.length > 0) {
          const tutorIds = [...new Set(tutorLinks.map(t => t.TUTOR_ID))];
          const { data: tutors } = await supabase
            .from('t_tutors')
            .select('USER_ID')
            .in('TUTOR_ID', tutorIds);

          if (tutors) {
            const tutorUserIds = tutors
              .map(t => t.USER_ID)
              .filter((id): id is number => id !== null && id !== undefined);
            userIds.push(...tutorUserIds);
          }
        }
      }

      if (userIds.length === 0) return false;

      const uniqueIds = [...new Set(userIds)];

      let title = '';
      let message = '';

      if (daysRemaining === 3) {
        title = 'Holgura de evaluación por cerrar';
        message = `Quedan solo 3 días para que cierre la holgura de evaluación del período. Completá las evaluaciones pendientes.`;
      } else {
        title = 'Recordatorio de holgura de evaluación';
        message = `Quedan ${daysRemaining} días para que cierre la holgura de evaluación del período.`;
      }

      const result = await sendNotificationToMultipleUsers(uniqueIds, 'reminder', title, message);
      return !!result;
    } catch (err) {
      console.error('[PeriodNotification] Error in notifyEvaluationGraceClosing:', err);
      return false;
    }
  },
};
