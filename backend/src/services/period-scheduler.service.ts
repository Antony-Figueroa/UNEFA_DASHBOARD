import { dbManager } from '../lib/db-manager.js';
import { periodNotificationService } from './period-notification.service.js';
import { SupabaseClient } from '@supabase/supabase-js';

interface Period {
  PERIOD_ID: number;
  DESCRIPTION: string;
  START_DATE: string;
  END_DATE: string;
  PERIOD_STATUS: string;
  STATUS: number;
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
        .neq('PERIOD_STATUS', '3')
        .order('END_DATE', { ascending: true });

      if (error) throw error;
      return data as Period[];
    });

    if (!periods || periods.length === 0) return;

    const now = new Date();
    cleanOldNotifications();
    
    let notificationsSent = 0;
    
    for (const period of periods) {
      const endDate = new Date(period.END_DATE);
      const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysRemaining > 7 || daysRemaining < 0) continue;
      
      const notificationKey = `period_${period.PERIOD_ID}_day_${daysRemaining}`;
      if (hasNotifiedToday(notificationKey)) continue;
      
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
