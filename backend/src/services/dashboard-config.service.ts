import { dbManager } from '../lib/db-manager.js';
import { cacheManager } from '../lib/cache-manager.js';

const TABLE_NAME = 't_landing_config';
const CACHE_PREFIX = 'dashboard_layout_';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export interface DashboardWidget {
  key: string;
  order: number;
  visible: boolean;
  /** Sobreescribe el tamaño por defecto del widget */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Color de acento personalizado (hex o nombre) */
  color?: string;
}

export interface DashboardLayout {
  roleId: number;
  widgets: DashboardWidget[];
}

const DEFAULT_LAYOUTS: Record<number, DashboardWidget[]> = {
  1: [ // ADMIN — Guía: 12-column grid, 5 filas
    // Fila 1: WelcomeBanner (fuera del DynamicDashboard, 12 cols en Home.tsx)
    // Fila 2: 4 tarjetas métricas (3+3+3+3 = 12 cols)
    { key: 'quick-stats', order: 0, visible: true },
    // Fila 3: Registro estudiantes (8 cols) + Crecimiento mensual (4 cols)
    { key: 'registration-stats', order: 1, visible: true },
    { key: 'growth-metrics', order: 2, visible: true },
    // Fila 4: Inscripciones mensuales (8 cols) + Distribución por carrera (4 cols)
    { key: 'monthly-enrollments', order: 3, visible: true },
    { key: 'career-distribution', order: 4, visible: true },
    // Fila 5: 4 métricas secundarias (3+3+3+3 = 12 cols)
    { key: 'evaluations', order: 5, visible: true },
    { key: 'tutor-distribution', order: 6, visible: true },
    { key: 'institution-distribution', order: 7, visible: true },
    { key: 'geo-coincidence', order: 8, visible: true },
    // Extra: ocultos por defecto
    { key: 'pending-requests', order: 9, visible: false },
  ],
  3: [ // TUTOR
    { key: 'tutor-quick-stats', order: 0, visible: true },
    { key: 'tutor-students-chart', order: 1, visible: true },
    { key: 'tutor-status-distribution', order: 2, visible: true },
    { key: 'tutor-pending-approvals', order: 3, visible: true },
    { key: 'tutor-upcoming-deadlines', order: 4, visible: true },
    { key: 'tutor-student-alerts', order: 5, visible: true },
    { key: 'tutor-grade-averages', order: 6, visible: false },
  ],
  4: [ // ESTUDIANTE
    { key: 'student-progress', order: 0, visible: true },
    { key: 'student-internship-info', order: 1, visible: true },
    { key: 'student-activity-log', order: 2, visible: true },
    { key: 'student-quick-actions', order: 3, visible: true },
    { key: 'student-documents-status', order: 4, visible: false },
  ],
};

const configKey = (roleId: number): string => `dashboard_layout_${roleId}`;

export const getLayoutByRole = async (roleId: number): Promise<DashboardLayout> => {
  const cacheKey = `${CACHE_PREFIX}${roleId}`;
  const cached = cacheManager.get(cacheKey);
  if (cached) return cached as DashboardLayout;

  try {
    const data = await dbManager.withRetry(async (supabase) => {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('config_value')
        .eq('config_key', configKey(roleId))
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      return data;
    }, 'getLayoutByRole');

    const widgets = (data?.config_value as { widgets?: DashboardWidget[] })?.widgets
      ?? DEFAULT_LAYOUTS[roleId]
      ?? [];

    const layout: DashboardLayout = { roleId, widgets };
    cacheManager.set(cacheKey, layout, CACHE_TTL);
    return layout;
  } catch (error) {
    console.error(`[DashboardConfig] Error getting layout for role ${roleId}:`, error);
    return {
      roleId,
      widgets: DEFAULT_LAYOUTS[roleId] ?? [],
    };
  }
};

export const getAllLayouts = async (): Promise<DashboardLayout[]> => {
  // Traer todos los layouts guardados en DB (incluye roles custom)
  try {
    const data = await dbManager.withRetry(async (supabase) => {
      const { data, error } = await supabase
        .from('t_landing_config')
        .select('config_key, config_value')
        .like('config_key', 'dashboard_layout_%');

      if (error) throw error;
      return data || [];
    }, 'getAllLayouts');

    const savedRoleIds = data
      .map((row: any) => parseInt(row.config_key.replace('dashboard_layout_', ''), 10))
      .filter((id: number) => !isNaN(id));

    // Combinar con los default layouts conocidos, sin duplicar
    const allRoleIds = [...new Set([...Object.keys(DEFAULT_LAYOUTS).map(Number), ...savedRoleIds])];

    const results = await Promise.allSettled(
      allRoleIds.map(id => getLayoutByRole(id))
    );

    return results
      .filter((r): r is PromiseFulfilledResult<DashboardLayout> => r.status === 'fulfilled')
      .map(r => r.value);
  } catch (error) {
    console.error('[DashboardConfig] Error getting all layouts, falling back to defaults:', error);
    // Fallback: solo layouts por defecto
    const roleIds = Object.keys(DEFAULT_LAYOUTS).map(Number);
    const results = await Promise.allSettled(
      roleIds.map(id => getLayoutByRole(id))
    );
    return results
      .filter((r): r is PromiseFulfilledResult<DashboardLayout> => r.status === 'fulfilled')
      .map(r => r.value);
  }
};

export const saveLayout = async (roleId: number, widgets: DashboardWidget[], userId: string): Promise<DashboardLayout> => {
  const now = new Date().toISOString();

  await dbManager.withRetry(async (supabase) => {
    const { error } = await supabase
      .from(TABLE_NAME)
      .upsert({
        config_key: configKey(roleId),
        config_value: { widgets },
        updated_at: now,
        updated_by: userId,
      }, { onConflict: 'config_key' });

    if (error) throw error;
  }, 'saveLayout');

  const cacheKey = `${CACHE_PREFIX}${roleId}`;
  cacheManager.delete(cacheKey);

  const layout: DashboardLayout = { roleId, widgets };
  cacheManager.set(cacheKey, layout, CACHE_TTL);
  return layout;
};

export const getAvailableRoleIds = async (): Promise<number[]> => {
  // Roles del sistema + roles custom con layouts guardados
  const systemIds = Object.keys(DEFAULT_LAYOUTS).map(Number);

  try {
    const data = await dbManager.withRetry(async (supabase) => {
      const { data, error } = await supabase
        .from('t_landing_config')
        .select('config_key')
        .like('config_key', 'dashboard_layout_%');

      if (error) throw error;
      return data || [];
    }, 'getAvailableRoleIds');

    const savedIds = data
      .map((row: any) => parseInt(row.config_key.replace('dashboard_layout_', ''), 10))
      .filter((id: number) => !isNaN(id));

    return [...new Set([...systemIds, ...savedIds])].sort((a, b) => a - b);
  } catch {
    return systemIds;
  }
};

export const resetLayout = async (roleId: number): Promise<DashboardLayout> => {
  const cacheKey = `${CACHE_PREFIX}${roleId}`;

  try {
    await dbManager.withRetry(async (supabase) => {
      const { error } = await supabase
        .from(TABLE_NAME)
        .delete()
        .eq('config_key', configKey(roleId));

      if (error) throw error;
    }, 'resetLayout');
  } catch (error) {
    // Si la tabla no existe o el row no existe, no es crítico
    console.warn(`[DashboardConfig] Could not delete layout for role ${roleId}:`, error);
  }

  cacheManager.delete(cacheKey);

  return {
    roleId,
    widgets: DEFAULT_LAYOUTS[roleId] ?? [],
  };
};
