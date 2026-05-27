import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { dashboardLayoutService, type DashboardWidget, type DashboardLayout } from '../services/dashboardLayoutService';
import { useAuth } from '../../../context/AuthContext';

export interface UseDashboardLayoutReturn {
  widgets: DashboardWidget[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook que carga los widgets del dashboard según el rol del usuario actual.
 * Se usa en las páginas Home, TutorDashboard y StudentDashboard
 * para renderizar el DynamicDashboard.
 */
export const useDashboardLayout = (): UseDashboardLayoutReturn => {
  const { user } = useAuth();
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLayout = useCallback(async () => {
    if (!user?.role) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const layout = await dashboardLayoutService.getByRole(user.role);
      setWidgets(layout.widgets ?? []);
    } catch (err: any) {
      // Si es 404 o no hay layout config, usar defaults no es error
      if (err?.response?.status === 404) {
        setWidgets([]);
      } else {
        const message = err?.response?.data?.message || 'Error al cargar configuración del dashboard';
        console.error('[useDashboardLayout] Error:', message);
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }, [user?.role]);

  useEffect(() => {
    fetchLayout();
  }, [fetchLayout]);

  return { widgets, loading, error, refresh: fetchLayout };
};
