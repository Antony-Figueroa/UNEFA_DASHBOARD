/**
 * @file reminder-scheduler.service.ts
 * @description Scheduler de recordatorios inteligentes.
 * 
 * Lee las reglas desde `reminder-config.service.ts` (almacenadas en t_landing_config)
 * y ejecuta los handlers según el tipo de recordatorio.
 * 
 * Sigue el mismo patrón que period-scheduler.service.ts.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { dbManager } from '../lib/db-manager.js';
import { reminderConfigService, ReminderRule, ReminderType } from './reminder-config.service.js';
import { sendEmail } from '../utils/email.utils.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface HandlerResult {
  userId: number;
  title: string;
  message: string;
  dedupId: string;
}

type ReminderHandler = (supabase: SupabaseClient, rule: ReminderRule) => Promise<HandlerResult[]>;

// ---------------------------------------------------------------------------
// Deduplication
// ---------------------------------------------------------------------------

const notifiedToday = new Set<string>();

const dedupKey = (type: ReminderType, userId: number, entityId: string): string =>
  `${type}_${userId}_${entityId}_${new Date().toDateString()}`;

const hasNotified = (key: string): boolean => notifiedToday.has(key);
const markNotified = (key: string): void => { notifiedToday.add(key); };

const cleanOldKeys = (): void => {
  if (notifiedToday.size > 500) {
    const today = new Date().toDateString();
    for (const key of notifiedToday) {
      if (!key.endsWith(today)) notifiedToday.delete(key);
    }
  }
};

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

const notifyUser = async (
  supabase: SupabaseClient,
  userId: number,
  type: ReminderType,
  title: string,
  message: string,
): Promise<boolean> => {
  try {
    const { error } = await supabase.from('t_notifications').insert({
      USER_ID: userId,
      TYPE: 'reminder',
      TITLE: title,
      MESSAGE: message,
      DATA: { reminderType: type },
      READ: false,
    });
    if (error) throw error;
    return true;
  } catch (err) {
    console.error(`[ReminderScheduler] Error notifying user ${userId}:`, err);
    return false;
  }
};

/** Envía el recordatorio como email si la regla lo requiere */
const sendReminderEmail = async (
  supabase: SupabaseClient,
  userId: number,
  title: string,
  message: string,
): Promise<boolean> => {
  try {
    const { data: user, error } = await supabase
      .from('t_users')
      .select('EMAIL, NAME')
      .eq('USER_ID', userId)
      .single();

    if (error || !user?.EMAIL) {
      console.warn(`[ReminderScheduler] No email found for user ${userId}, skipping email.`);
      return false;
    }

    const html = `
      <div style="font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%); padding: 24px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 20px;">SIGP UNEFA</h1>
          <p style="color: rgba(255,255,255,0.75); margin: 6px 0 0; font-size: 13px;">Recordatorio Automático</p>
        </div>
        <div style="padding: 28px; color: #1e293b; line-height: 1.6;">
          <h2 style="color: #1e40af; font-size: 18px; margin: 0 0 12px;">${title}</h2>
          <p style="margin: 0 0 16px; color: #475569;">Hola <strong>${user.NAME}</strong>,</p>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 0 0 16px;">
            <p style="margin: 0; color: #334155; white-space: pre-wrap;">${message}</p>
          </div>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;">
          <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0;">
            SIGP UNEFA — Sistema de Gestión de Personal<br>
            Este es un mensaje automático, por favor no responder.
          </p>
        </div>
      </div>
    `;

    const result = await sendEmail({
      to: user.EMAIL,
      subject: `🔔 ${title} - SIGP UNEFA`,
      html,
      text: `${title}\n\nHola ${user.NAME},\n\n${message}`,
    });

    if (result.success) {
      console.log(`[ReminderScheduler] ✓ Email sent to user ${userId} (${user.EMAIL})`);
    } else {
      console.warn(`[ReminderScheduler] ✗ Email failed to user ${userId} (${user.EMAIL}): ${result.error}`);
    }
    return result.success;
  } catch (err) {
    console.error(`[ReminderScheduler] Error sending email to user ${userId}:`, err);
    return false;
  }
};

const processResults = async (
  supabase: SupabaseClient,
  rule: ReminderRule,
  results: HandlerResult[],
): Promise<number> => {
  let sent = 0;
  for (const r of results) {
    const key = dedupKey(rule.type, r.userId, r.dedupId);
    if (hasNotified(key)) continue;

    // Siempre crear la notificación in-app
    const ok = await notifyUser(supabase, r.userId, rule.type, r.title, r.message);

    // Enviar email si la regla lo requiere (no bloqueante si falla)
    if (rule.sendEmail) {
      await sendReminderEmail(supabase, r.userId, r.title, r.message);
    }

    if (ok) { markNotified(key); sent++; }
  }
  return sent;
};

// ---------------------------------------------------------------------------
// Handlers por tipo de recordatorio
// ---------------------------------------------------------------------------

const HANDLERS: Record<ReminderType, ReminderHandler> = {

  // ── Evaluaciones pendientes ─────────────────────────────────────────────
  async pending_evaluation(supabase, _rule) {
    const { data: pendingEvals, error } = await supabase
      .from('t_evaluation')
      .select(`
        EVALUATION_ID,
        PROFESSIONAL_PRACTICE_ID,
        EVALUATOR_TYPE,
        EVALUATOR_NAME,
        t_professional_practices!inner (
          PROFESSIONAL_PRACTICE_ID,
          STUDENTS_ID,
          t_professional_practices_tutor (
            TUTOR_ID,
            TUTOR_TYPE,
            t_tutors!inner (TUTOR_ID, USER_ID)
          ),
          t_students!inner (STUDENTS_ID, NAME, SURNAME)
        )
      `)
      .is('EVALUATION_DATE', null)
      .eq('STATUS', 1);

    if (error || !pendingEvals?.length) {
      if (error) console.error('[ReminderScheduler] pending_evaluation error:', error);
      return [];
    }

    const tutorMap = new Map<number, { userId: number; count: number; students: string[] }>();
    for (const ev of pendingEvals) {
      const p = (ev as any).t_professional_practices;
      const name = `${p.t_students.NAME} ${p.t_students.SURNAME}`;
      const tutor = (p.t_professional_practices_tutor || []).find((t: any) => t.TUTOR_TYPE === 'ACADEMICO');
      if (!tutor?.t_tutors?.USER_ID) continue;

      const info = tutor.t_tutors;
      if (!tutorMap.has(info.TUTOR_ID)) tutorMap.set(info.TUTOR_ID, { userId: info.USER_ID, count: 0, students: [] });
      const e = tutorMap.get(info.TUTOR_ID)!;
      e.count++;
      if (!e.students.includes(name)) e.students.push(name);
    }

    const results: HandlerResult[] = [];
    for (const [, entry] of tutorMap) {
      const detail = entry.students.length <= 3
        ? entry.students.join(', ')
        : `${entry.students.slice(0, 3).join(', ')} y ${entry.students.length - 3} más`;
      results.push({
        userId: entry.userId,
        title: entry.count === 1 ? '📋 Evaluación pendiente' : `📋 ${entry.count} evaluaciones pendientes`,
        message: `Tenés ${entry.count} evaluación(es) sin calificar: ${detail}.`,
        dedupId: `count_${entry.count}`,
      });
    }
    return results;
  },

  // ── Visitas próximas ────────────────────────────────────────────────────
  async upcoming_visit(supabase, _rule) {
    const today = new Date().toISOString().split('T')[0];
    const threeDays = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const { data: visits, error } = await supabase
      .from('t_visit')
      .select(`
        VISIT_ID,
        VISIT_DATE,
        t_professional_practices (
          PROFESSIONAL_PRACTICE_ID,
          t_students (STUDENTS_ID, NAME, SURNAME),
          t_professional_practices_tutor (
            TUTOR_ID, TUTOR_TYPE,
            t_tutors!inner (TUTOR_ID, USER_ID)
          )
        )
      `)
      .gte('VISIT_DATE', today)
      .lte('VISIT_DATE', threeDays);

    if (error || !visits?.length) {
      if (error) console.error('[ReminderScheduler] upcoming_visit error:', error);
      return [];
    }

    const results: HandlerResult[] = [];
    for (const visit of visits) {
      const p = (visit as any).t_professional_practices;
      if (!p) continue;
      const name = `${p.t_students.NAME} ${p.t_students.SURNAME}`;
      const tutor = (p.t_professional_practices_tutor || []).find((t: any) => t.TUTOR_TYPE === 'ACADEMICO');
      if (!tutor?.t_tutors?.USER_ID) continue;

      const date = new Date(visit.VISIT_DATE).toLocaleDateString('es-VE', { day: '2-digit', month: 'long' });
      results.push({
        userId: tutor.t_tutors.USER_ID,
        title: '📅 Visita programada',
        message: `Tenés una visita con ${name} para el ${date}.`,
        dedupId: `visit_${visit.VISIT_ID}`,
      });
    }
    return results;
  },

  // ── Bitácora vencida ────────────────────────────────────────────────────
  async overdue_report(supabase, _rule) {
    const sevenDays = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const { data: practices, error } = await supabase
      .from('t_professional_practices')
      .select(`
        PROFESSIONAL_PRACTICE_ID,
        t_students!inner (STUDENTS_ID, NAME, SURNAME, USER_ID)
      `)
      .eq('STATUS', 1);

    if (error || !practices?.length) {
      if (error) console.error('[ReminderScheduler] overdue_report error:', error);
      return [];
    }

    const results: HandlerResult[] = [];
    for (const pp of practices) {
      const s = (pp as any).t_students;
      if (!s?.USER_ID) continue;

      const { data: lastLog } = await supabase
        .from('t_activity_logs')
        .select('ACTIVITY_DATE')
        .eq('PROFESSIONAL_PRACTICE_ID', pp.PROFESSIONAL_PRACTICE_ID)
        .eq('STATUS', 1)
        .order('ACTIVITY_DATE', { ascending: false })
        .limit(1)
        .maybeSingle();

      const lastDate = lastLog?.ACTIVITY_DATE ? new Date(lastLog.ACTIVITY_DATE) : null;
      if (lastDate && lastDate >= sevenDays) continue;

      results.push({
        userId: s.USER_ID,
        title: '⚠️ Bitácora pendiente',
        message: lastDate
          ? `No registrás actividades desde el ${lastDate.toLocaleDateString('es-VE')}. Pasó el reporte semanal.`
          : 'No has registrado ninguna actividad de pasantía aún. Recordá subir tu bitácora semanal.',
        dedupId: `practice_${pp.PROFESSIONAL_PRACTICE_ID}`,
      });
    }
    return results;
  },

  // ── Documentos pendientes ───────────────────────────────────────────────
  async pending_document(supabase, _rule) {
    const { data: docs, error } = await supabase
      .from('t_student_documents')
      .select(`
        DOCUMENT_ID,
        DOCUMENT_TYPE,
        STATUS,
        STUDENT_ID,
        t_students!inner (STUDENTS_ID, NAME, SURNAME, USER_ID)
      `)
      .in('STATUS', ['pending', 'rejected']);

    if (error || !docs?.length) {
      if (error) console.error('[ReminderScheduler] pending_document error:', error);
      return [];
    }

    const studentMap = new Map<number, { userId: number; pending: string[]; rejected: string[] }>();
    for (const doc of docs) {
      const s = (doc as any).t_students;
      if (!s?.USER_ID) continue;
      if (!studentMap.has(s.STUDENTS_ID)) {
        studentMap.set(s.STUDENTS_ID, { userId: s.USER_ID, pending: [], rejected: [] });
      }
      const e = studentMap.get(s.STUDENTS_ID)!;
      const label = doc.DOCUMENT_TYPE.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      if ((doc as any).STATUS === 'rejected') e.rejected.push(label);
      else e.pending.push(label);
    }

    const results: HandlerResult[] = [];
    for (const [, entry] of studentMap) {
      const total = entry.pending.length + entry.rejected.length;
      let msg = entry.rejected.length > 0
        ? `Tu(s) documento(s) ${entry.rejected.join(', ')} fueron rechazados. Subí una versión corregida.`
        : `Tenés ${entry.pending.length} documento(s) pendiente(s): ${entry.pending.join(', ')}.`;

      results.push({
        userId: entry.userId,
        title: total === 1 ? '📄 Documento pendiente' : `📄 ${total} documentos pendientes`,
        message: msg,
        dedupId: `docs_${total}`,
      });
    }
    return results;
  },
};

// ---------------------------------------------------------------------------
// Scheduler
// ---------------------------------------------------------------------------

export const runReminderScheduler = async (): Promise<void> => {
  try {
    cleanOldKeys();

    // Leer reglas desde la config
    const rules = await reminderConfigService.getAll();
    const activeRules = rules.filter(r => r.active);

    if (activeRules.length === 0) return;

    let totalSent = 0;

    for (const rule of activeRules) {
      const handler = HANDLERS[rule.type];
      if (!handler) {
        console.warn(`[ReminderScheduler] No handler for type: ${rule.type}`);
        continue;
      }

      try {
        const results = await dbManager.withRetry(async (supabase) => {
          return await handler(supabase, rule);
        });

        const sent = await dbManager.withRetry(async (supabase) => {
          return await processResults(supabase, rule, results);
        });

        totalSent += sent;
      } catch (err) {
        console.error(`[ReminderScheduler] Error in rule "${rule.name}":`, err);
      }
    }

    if (totalSent > 0) {
      console.log(`[ReminderScheduler] ✓ ${totalSent} recordatorio(s) enviado(s)`);
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    console.error('[ReminderScheduler] Error:', error);
  }
};

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

let schedulerInterval: ReturnType<typeof setInterval> | null = null;
const SCHEDULER_INTERVAL_HOURS = 6;

export const startReminderScheduler = (): void => {
  if (schedulerInterval) return;

  setTimeout(() => runReminderScheduler(), 5000);

  schedulerInterval = setInterval(
    () => runReminderScheduler(),
    SCHEDULER_INTERVAL_HOURS * 60 * 60 * 1000,
  );

  console.log(`[ReminderScheduler] Started (every ${SCHEDULER_INTERVAL_HOURS}h)`);
};

export const stopReminderScheduler = (): void => {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
  }
};
