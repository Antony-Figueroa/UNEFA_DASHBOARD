/**
 * Scheduler de notificaciones para períodos académicos
 * Se ejecuta periódicamente para enviar recordatorios automáticos
 */
import { dbManager } from '../lib/db-manager.js';
import { periodNotificationService } from './period-notification.service.js';

const SCHEDULER_INTERVAL_HOURS = 1; // Ejecutar cada hora

interface Period {
  PERIOD_ID: number;
  DESCRIPTION: string;
  START_DATE: string;
  END_DATE: string;
  PERIOD_STATUS: string;
  STATUS: number;
}

/**
 * Ejecuta el scheduler de notificaciones de períodos
 */
export const runPeriodNotificationScheduler = async () => {
  console.log('[PeriodScheduler] Ejecutando verificador de períodos...');
  
  try {
    const periods = await dbManager.withRetry(async (supabase) => {
      // Obtener solo períodos activos (STATUS = 1) y no finalizados (PERIOD_STATUS != 3)
      const { data, error } = await supabase
        .from('t_internships_period')
        .select('*')
        .eq('STATUS', 1)
        .neq('PERIOD_STATUS', '3') // No es "Finalizado"
        .order('END_DATE', { ascending: true });

      if (error) throw error;
      return data as Period[];
    });

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Obtener el último día que ya se notificó (para evitar duplicados)
    const lastNotificationDate = getLastNotificationDate();
    
    for (const period of periods) {
      const endDate = new Date(period.END_DATE);
      const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      // Solo notificar si el período está por terminar en 7 días o menos
      if (daysRemaining > 7) {
        continue;
      }
      
      // Evitar notificaciones duplicadas el mismo día
      const notificationKey = `period_${period.PERIOD_ID}_day_${daysRemaining}`;
      if (hasNotifiedToday(notificationKey)) {
        console.log(`[PeriodScheduler] Ya se notificó para período ${period.DESCRIPTION} (${daysRemaining} días)`);
        continue;
      }
      
      // Enviar notificación según los días restantes
      if (daysRemaining === 7) {
        console.log(`[PeriodScheduler] Enviando notificación: 7 días restantes para "${period.DESCRIPTION}"`);
        await periodNotificationService.notifyPeriodEndingSoon(
          { description: period.DESCRIPTION, endDate: period.END_DATE }, 
          7
        );
        markAsNotified(notificationKey);
      } else if (daysRemaining === 6) {
        console.log(`[PeriodScheduler] Enviando notificación: 6 días restantes para "${period.DESCRIPTION}"`);
        await periodNotificationService.notifyPeriodEndingSoon(
          { description: period.DESCRIPTION, endDate: period.END_DATE }, 
          6
        );
        markAsNotified(notificationKey);
      } else if (daysRemaining === 5) {
        console.log(`[PeriodScheduler] Enviando notificación: 5 días restantes para "${period.DESCRIPTION}"`);
        await periodNotificationService.notifyPeriodEndingSoon(
          { description: period.DESCRIPTION, endDate: period.END_DATE }, 
          5
        );
        markAsNotified(notificationKey);
      } else if (daysRemaining === 4) {
        console.log(`[PeriodScheduler] Enviando notificación: 4 días restantes para "${period.DESCRIPTION}"`);
        await periodNotificationService.notifyPeriodEndingSoon(
          { description: period.DESCRIPTION, endDate: period.END_DATE }, 
          4
        );
        markAsNotified(notificationKey);
      } else if (daysRemaining === 3) {
        console.log(`[PeriodScheduler] Enviando notificación: 3 días restantes para "${period.DESCRIPTION}"`);
        await periodNotificationService.notifyPeriodEndingSoon(
          { description: period.DESCRIPTION, endDate: period.END_DATE }, 
          3
        );
        markAsNotified(notificationKey);
      } else if (daysRemaining === 2) {
        console.log(`[PeriodScheduler] Enviando notificación: 2 días restantes para "${period.DESCRIPTION}"`);
        await periodNotificationService.notifyPeriodEndingSoon(
          { description: period.DESCRIPTION, endDate: period.END_DATE }, 
          2
        );
        markAsNotified(notificationKey);
      } else if (daysRemaining === 1) {
        console.log(`[PeriodScheduler] Enviando notificación: 1 día restante para "${period.DESCRIPTION}"`);
        await periodNotificationService.notifyPeriodEndingSoon(
          { description: period.DESCRIPTION, endDate: period.END_DATE }, 
          1
        );
        markAsNotified(notificationKey);
      } else if (daysRemaining <= 0) {
        // El período ha terminado - notificar fin
        console.log(`[PeriodScheduler] Período "${period.DESCRIPTION}" ha terminado, notificando...`);
        
        // Actualizar estado a "Finalizado" automáticamente
        await dbManager.withRetry(async (supabase) => {
          await supabase
            .from('t_internships_period')
            .update({ PERIOD_STATUS: '3' }) // 3 = Finalizado
            .eq('PERIOD_ID', period.PERIOD_ID);
        });
        
        await periodNotificationService.notifyPeriodEnded({
          description: period.DESCRIPTION,
          endDate: period.END_DATE,
          manuallyEnded: false,
        });
        markAsNotified(notificationKey);
      }
    }
    
    console.log('[PeriodScheduler] Verificación completada');
  } catch (error) {
    console.error('[PeriodScheduler] Error en el scheduler:', error);
  }
};

// Almacenamiento en memoria para evitar notificaciones duplicadas (se limpia al reiniciar el servidor)
// En producción, esto debería guardarse en la base de datos
const notificationHistory = new Map<string, string>();

function getLastNotificationDate(): string {
  const today = new Date().toISOString().split('T')[0];
  return today;
}

function hasNotifiedToday(key: string): boolean {
  const today = new Date().toISOString().split('T')[0];
  const lastNotification = notificationHistory.get(key);
  return lastNotification === today;
}

function markAsNotified(key: string): void {
  const today = new Date().toISOString().split('T')[0];
  notificationHistory.set(key, today);
}

// Iniciar el scheduler cuando se cargue el módulo
let schedulerInterval: NodeJS.Timeout | null = null;

export const startPeriodScheduler = () => {
  if (schedulerInterval) {
    console.log('[PeriodScheduler] Scheduler ya está corriendo');
    return;
  }
  
  console.log(`[PeriodScheduler] Iniciando scheduler (cada ${SCHEDULER_INTERVAL_HOURS} hora(s))...`);
  
  // Ejecutar inmediatamente al iniciar
  setTimeout(runPeriodNotificationScheduler, 5000); // 5 segundos de delay inicial
  
  // Luego ejecutar periódicamente
  schedulerInterval = setInterval(
    runPeriodNotificationScheduler,
    SCHEDULER_INTERVAL_HOURS * 60 * 60 * 1000
  );
};

export const stopPeriodScheduler = () => {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log('[PeriodScheduler] Scheduler detenido');
  }
};