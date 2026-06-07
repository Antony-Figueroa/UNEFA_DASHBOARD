/**
 * @file reminder-config.service.ts
 * @description CRUD de reglas de recordatorios, almacenadas en t_landing_config.
 * 
 * Cada regla representa un recordatorio configurable:
 * - type: el tipo de recordatorio (define la lógica de consulta)
 * - daysThreshold, targetRole, templates: configurables por el admin
 * - active: toggle on/off
 */

import { dbManager } from '../lib/db-manager.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ReminderType = 'pending_evaluation' | 'upcoming_visit' | 'overdue_report' | 'pending_document';

export interface ReminderRule {
  id: string;
  type: ReminderType;
  name: string;
  description: string;
  active: boolean;
  daysThreshold: number | null;
  targetRoleName: 'all' | 'admin' | 'asistente' | 'tutor' | 'estudiante';
  templateTitle: string;
  templateMessage: string;
  sendEmail: boolean;
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Default/Seed rules
// ---------------------------------------------------------------------------

const CONFIG_KEY = 'reminder_rules';

const SEED_RULES: ReminderRule[] = [
  {
    id: 'seed_pending_eval',
    type: 'pending_evaluation',
    name: 'Evaluaciones pendientes',
    description: 'Notifica a tutores sobre evaluaciones sin calificar',
    active: true,
    daysThreshold: null,
    targetRoleName: 'tutor',
    sendEmail: true,
    templateTitle: '📋 Evaluación pendiente',
    templateMessage: 'Tenés {{count}} evaluación(es) sin calificar.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'seed_upcoming_visit',
    type: 'upcoming_visit',
    name: 'Visitas próximas',
    description: 'Recuerda a tutores sobre visitas programadas',
    active: true,
    daysThreshold: 3,
    targetRoleName: 'tutor',
    sendEmail: true,
    templateTitle: '📅 Visita programada',
    templateMessage: 'Tenés una visita con {{student}} para el {{date}}.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'seed_overdue_report',
    type: 'overdue_report',
    name: 'Bitácora vencida',
    description: 'Notifica a estudiantes sin actividad por más de 7 días',
    active: true,
    daysThreshold: 7,
    targetRoleName: 'estudiante',
    sendEmail: true,
    templateTitle: '⚠️ Bitácora pendiente',
    templateMessage: 'No registrás actividades desde {{lastDate}}. Pasó el reporte semanal.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'seed_pending_doc',
    type: 'pending_document',
    name: 'Documentos pendientes',
    description: 'Recuerda a estudiantes sobre documentos rechazados o sin aprobar',
    active: true,
    daysThreshold: null,
    targetRoleName: 'estudiante',
    sendEmail: true,
    templateTitle: '📄 Documentos pendientes',
    templateMessage: 'Tenés {{count}} documento(s) pendiente(s): {{docs}}.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const reminderConfigService = {
  /** Obtiene todas las reglas, sembrando defaults si no existen */
  async getAll(): Promise<ReminderRule[]> {
    try {
      const rules = await dbManager.withRetry(async (supabase) => {
        const { data, error } = await supabase
          .from('t_landing_config')
          .select('config_value')
          .eq('config_key', CONFIG_KEY)
          .maybeSingle();

        if (error) throw error;
        return data?.config_value as ReminderRule[] | null;
      });

      if (!rules || rules.length === 0) {
        await this.seed();
        return SEED_RULES;
      }

      // Mergear seed faltantes (cuando se agregan nuevos presets en el código)
      return mergeSeeds(rules);
    } catch (error) {
      console.error('[ReminderConfig] Error reading rules, using seeds:', error);
      return SEED_RULES;
    }
  },

  /** Guarda el array completo de reglas */
  async saveAll(rules: ReminderRule[]): Promise<ReminderRule[]> {
    await dbManager.withRetry(async (supabase) => {
      const { error } = await supabase
        .from('t_landing_config')
        .upsert({
          config_key: CONFIG_KEY,
          config_value: rules,
          updated_at: new Date().toISOString(),
          updated_by: 'system',
        }, { onConflict: 'config_key' });

      if (error) throw error;
    });

    return rules;
  },

  /** Crea una nueva regla */
  async create(rule: Omit<ReminderRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<ReminderRule[]> {
    const rules = await this.getAll();
    const newRule: ReminderRule = {
      ...rule,
      id: `rule_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    rules.push(newRule);
    return this.saveAll(rules);
  },

  /** Actualiza una regla existente */
  async update(id: string, updates: Partial<ReminderRule>): Promise<ReminderRule[]> {
    const rules = await this.getAll();
    const idx = rules.findIndex(r => r.id === id);
    if (idx === -1) throw new Error(`Rule ${id} not found`);
    rules[idx] = { ...rules[idx], ...updates, id, updatedAt: new Date().toISOString() };
    return this.saveAll(rules);
  },

  /** Elimina una regla */
  async remove(id: string): Promise<ReminderRule[]> {
    const rules = await this.getAll();
    const filtered = rules.filter(r => r.id !== id);
    return this.saveAll(filtered);
  },

  /** Toggle activo/inactivo */
  async toggle(id: string): Promise<ReminderRule[]> {
    const rules = await this.getAll();
    const idx = rules.findIndex(r => r.id === id);
    if (idx === -1) throw new Error(`Rule ${id} not found`);
    rules[idx] = { ...rules[idx], active: !rules[idx].active, updatedAt: new Date().toISOString() };
    return this.saveAll(rules);
  },

  /** Siembra las reglas por defecto */
  async seed(): Promise<void> {
    await this.saveAll(SEED_RULES);
    console.log('[ReminderConfig] ✓ Seed rules saved');
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Mergea reglas del código (seed) con las existentes en DB, sin duplicar */
function mergeSeeds(existing: ReminderRule[]): ReminderRule[] {
  const merged = [...existing];
  const existingIds = new Set(merged.map(r => r.id));

  for (const seed of SEED_RULES) {
    if (!existingIds.has(seed.id)) {
      merged.push(seed);
    }
  }

  return merged;
}
