import { dbManager } from '../lib/db-manager.js';
import { periodNotificationService } from './period-notification.service.js';
import { SupabaseClient } from '@supabase/supabase-js';
import { PERIOD_STATUS } from '../constants/practice-status.constants.js';

interface Period {
  PERIOD_ID: number;
  DESCRIPTION: string;
  START_DATE: string;
  END_DATE: string;
  PERIOD_STATUS: string;
  STATUS: number;
  ENROLLMENT_GRACE_DAYS: number;
  EVALUATION_GRACE_DAYS: number;
}

// Control de notificaciones por día
const notifiedToday = new Set<string>();

const hasNotifiedToday = (key: string): boolean => {
  return notifiedToday.has(key);
};

const markNotifiedToday = (key: string): void => {
  notifiedToday.add(key);
};

const cleanOldNotifications = (): void => {
  const today = new Date().toDateString();
  if (notifiedToday.size > 100) {
    notifiedToday.clear();
  }
};

export const runPeriodNotificationScheduler = async () => {
  try {
    const periods = await dbManager.withRetry(async (supabase) => {
      const { data, error } = await supabase
        .from('t_internships_period')
        .select('*')
        .eq('STATUS', 1)
        .neq('PERIOD_STATUS', PERIOD_STATUS.CULMINADO)
        .order('END_DATE', { ascending: true });

      if (error) throw error;
      return data as Period[];
    });

    if (!periods || periods.length === 0) return;

    const now = new Date();
    cleanOldNotifications();
    
    let notificationsSent = 0;
    
    for (const period of periods) {
      const enrollmentDays = period.ENROLLMENT_GRACE_DAYS ?? 21;
      const evaluationDays = period.EVALUATION_GRACE_DAYS ?? 10;

      const startDate = new Date(period.START_DATE);
      const endDate = new Date(period.END_DATE);
      const graceEndDate = new Date(startDate);
      graceEndDate.setDate(graceEndDate.getDate() + enrollmentDays);
      const evaluationGraceEndDate = new Date(endDate);
      evaluationGraceEndDate.setDate(evaluationGraceEndDate.getDate() + evaluationDays);

      // --- Notificaciones de fin de período (existente) ---
      const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysRemaining >= 0 && daysRemaining <= 7) {
        const notificationKey = `period_${period.PERIOD_ID}_day_${daysRemaining}`;
        if (!hasNotifiedToday(notificationKey)) {
          try {
            await periodNotificationService.notifyPeriodEndingSoon({
              description: period.DESCRIPTION,
              endDate: period.END_DATE,
            }, daysRemaining);
            markNotifiedToday(notificationKey);
            notificationsSent++;
          } catch (err) {
            // Silenciar errores de notificación
          }
        }
      }

      // --- Notificaciones de holgura de inscripción ---
      const graceDaysRemaining = Math.ceil((graceEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      const graceNotificationDays = [7, 3];
      
      if (graceNotificationDays.includes(graceDaysRemaining)) {
        const graceKey = `grace_${period.PERIOD_ID}_day_${graceDaysRemaining}`;
        if (!hasNotifiedToday(graceKey)) {
          try {
            await periodNotificationService.notifyGracePeriodClosing(period.PERIOD_ID, graceDaysRemaining);
            markNotifiedToday(graceKey);
            notificationsSent++;
          } catch (err) {
            // Silenciar errores de notificación
          }
        }
      }

      // --- Notificaciones de holgura de evaluación ---
      const evalGraceDaysRemaining = Math.ceil((evaluationGraceEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (evalGraceDaysRemaining === 3) {
        const evalGraceKey = `eval_grace_${period.PERIOD_ID}_day_${evalGraceDaysRemaining}`;
        if (!hasNotifiedToday(evalGraceKey)) {
          try {
            await periodNotificationService.notifyEvaluationGraceClosing(period.PERIOD_ID, evalGraceDaysRemaining);
            markNotifiedToday(evalGraceKey);
            notificationsSent++;
          } catch (err) {
            // Silenciar errores de notificación
          }
        }
      }
    }
    
    if (notificationsSent > 0) {
      console.log(`[Scheduler] ✓ ${notificationsSent} notificación(es) enviada(s)`);
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    console.error('[Scheduler] Error:', message);
  }
};

let schedulerInterval: ReturnType<typeof setInterval> | null = null;
const SCHEDULER_INTERVAL_HOURS = 1;

export const startPeriodScheduler = (): void => {
  if (schedulerInterval) return;
  
  // Ejecutar inmediatamente
  runPeriodNotificationScheduler();
  
  // Ejecutar periódicamente
  schedulerInterval = setInterval(
    () => runPeriodNotificationScheduler(),
    SCHEDULER_INTERVAL_HOURS * 60 * 60 * 1000
  );
};

export const stopPeriodScheduler = (): void => {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
  }
};
