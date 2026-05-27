import { dbManager } from '../lib/db-manager.js';
import { cacheManager } from '../lib/cache-manager.js';

const TABLE_NAME = 't_landing_config';
const CACHE_PREFIX = 'dashboard_layout_';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export interface DashboardWidget {
  key: string;
  order: number;
  visible: boolean;
}

export interface DashboardLayout {
  roleId: number;
  widgets: DashboardWidget[];
}

const DEFAULT_LAYOUTS: Record<number, DashboardWidget[]> = {
  1: [ // ADMIN
    { key: 'quick-stats', order: 0, visible: true },
    { key: 'registration-stats', order: 1, visible: true },
    { key: 'growth-metrics', order: 2, visible: true },
    { key: 'career-distribution', order: 3, visible: true },
    { key: 'evaluations', order: 4, visible: true },
    { key: 'tutor-distribution', order: 5, visible: true },
    { key: 'institution-distribution', order: 6, visible: true },
    { key: 'monthly-enrollments', order: 7, visible: true },
    { key: 'pending-requests', order: 8, visible: false },
  ],
  3: [ // TUTOR
    { key: 'tutor-quick-stats', order: 0, visible: true },
    { key: 'tutor-students-chart', order: 1, visible: true },
    { key: 'tutor-status-distribution', order: 2, visible: true },
    { key: 'tutor-grade-averages', order: 3, visible: false },
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
  const roleIds = Object.keys(DEFAULT_LAYOUTS).map(Number);
  const results = await Promise.allSettled(
    roleIds.map(id => getLayoutByRole(id))
  );

  return results
    .filter((r): r is PromiseFulfilledResult<DashboardLayout> => r.status === 'fulfilled')
    .map(r => r.value);
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

export const getAvailableRoleIds = (): number[] => {
  return Object.keys(DEFAULT_LAYOUTS).map(Number);
};
