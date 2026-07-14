import { Suspense } from 'react';
import { Skeleton } from '../../../components/ui/skeleton';
import {
  WIDGET_REGISTRY,
  WIDGET_SIZE_CLASSES,
  type WidgetSize,
} from '../constants/widgetRegistry';
import type { DashboardWidget } from '../services/dashboardLayoutService';
import type { WidgetDefinition } from '../constants/widgetRegistry';

interface DynamicDashboardProps {
  /** Array de widgets (desde el layout config) */
  widgets: DashboardWidget[];
  /** Datos que se pasan a getProps de cada widget */
  data: any;
  /** Si está cargando la data principal */
  loading?: boolean;
}

/**
 * Skeleton para cuando un widget está cargando
 */
const WidgetSkeleton = ({ size }: { size: WidgetSize }) => {
  const height = size === 'xl' ? 320 : size === 'lg' ? 300 : size === 'md' ? 280 : 260;
  return (
      <div className="flex min-h-[360px] flex-col rounded-2xl border border-border-light bg-white p-5 shadow-sm dark:border-border-dark dark:bg-gray-900">
      <Skeleton height={24} width="50%" className="mb-4" />
      <Skeleton height={height} className="rounded-xl" />
    </div>
  );
};

/**
 * DynamicDashboard
 *
 * Renderiza widgets según la configuración guardada en DB para el rol actual.
 * Soporta: orden, visibilidad, lazy loading, tamaños fijos por widget.
 *
 * @example
 * ```tsx
 * const { widgets } = useDashboardLayout();
 * const { stats, loading } = useDashboardStats();
 *
 * <DynamicDashboard widgets={widgets} data={{ stats, loading }} />
 * ```
 */
export const DynamicDashboard = ({ widgets, data, loading }: DynamicDashboardProps) => {
  if (!widgets || widgets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400 dark:text-gray-500">
        <svg className="w-16 h-16 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <p className="text-sm font-medium">No hay widgets configurados para este dashboard</p>
        <p className="text-xs mt-1">Contacta al administrador para configurar la vista</p>
      </div>
    );
  }

  // Filtramos SOLO widgets visibles y ordenamos
  const visibleWidgets = widgets
    .filter(w => w.visible && WIDGET_REGISTRY[w.key])
    .sort((a, b) => a.order - b.order);

  if (visibleWidgets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-text-tertiary">
        <svg className="w-16 h-16 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h18v18H3V3z" />
        </svg>
        <p className="text-sm font-medium">Todos los widgets están ocultos</p>
        <p className="text-xs mt-1">Puedes mostrar widgets desde la configuración del dashboard</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {visibleWidgets.map((widget, index) => {
        const def: WidgetDefinition | undefined = WIDGET_REGISTRY[widget.key];
        if (!def) return null;

        const WidgetComponent = def.component;
        const widgetProps = def.getProps(data);
        const effectiveSize = widget.size ?? def.size;
        const sizeClass = WIDGET_SIZE_CLASSES[effectiveSize] || WIDGET_SIZE_CLASSES.sm;

        return (
          <div
            key={widget.key}
            className={`${sizeClass} flex`}
            style={widget.color ? { '--widget-accent': widget.color } as React.CSSProperties : undefined}
          >
            <div className="w-full flex flex-col">
              <Suspense fallback={<WidgetSkeleton size={effectiveSize} />}>
                <WidgetComponent {...widgetProps} data-widget-accent={widget.color} />
              </Suspense>
            </div>
          </div>
        );
      })}
    </div>
  );
};
