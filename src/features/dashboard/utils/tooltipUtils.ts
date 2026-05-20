/**
 * @file tooltipUtils.ts
 * @description Utility functions for consistent tooltip styling across dashboard charts.
 * Provides standardized tooltip templates that match the RegistrationStatsChart pattern.
 */

/**
 * Extrae el valor de manera segura desde w.globals.series
 * Maneja múltiples formatos de datos de ApexCharts
 */
export function extractValueFromSeries(seriesData: unknown, dataPointIndex: number): number {
  if (!seriesData) return 0;
  
  // Case 1: Simple array [10, 20, 30]
  if (Array.isArray(seriesData)) {
    const value = seriesData[dataPointIndex];
    if (typeof value === 'number') return value;
    if (typeof value === 'object' && value !== null) {
      // Case 2: Array of objects [{x: 'A', y: 10}, ...]
      return (value as any).y ?? 0;
    }
    return 0;
  }
  
  // Case 3: Object with numeric keys {0: 10, 1: 20}
  if (typeof seriesData === 'object') {
    const value = (seriesData as any)[dataPointIndex];
    if (typeof value === 'number') return value;
    if (typeof value === 'object' && value !== null) {
      return value.y ?? 0;
    }
  }
  
  return 0;
}

/**
 * Creates a custom tooltip HTML string for ApexCharts with consistent styling.
 * This follows the pattern used in RegistrationStatsChart for visual consistency.
 * 
 * @param options - Configuration options for the tooltip
 * @returns HTML string for the custom tooltip
 */
interface TooltipOptions {
  /** Main label to display (e.g., date, career name, tutor name) */
  label: string;
  /** Count/value to display */
  count: number;
  /** Unit label for the count (e.g., 'estudiantes', 'registros', 'evaluaciones') */
  unit?: string;
  /** Optional icon emoji to display */
  icon?: string;
  /** Optional list of items to show below the count */
  items?: { name: string; subtitle?: string }[];
  /** Maximum number of items to display in the list */
  maxItems?: number;
}

/**
 * Generates a consistent tooltip HTML string for dashboard charts.
 * Uses the same styling as RegistrationStatsChart for visual consistency.
 */
export const generateTooltipHTML = (options: TooltipOptions): string => {
  const { label, count, unit = '', icon = '📊', items = [], maxItems = 10 } = options;
  
  const countStr = `${count} ${unit}${count !== 1 ? 's' : ''}`;
  
  // Build items list HTML
  let itemsHTML = '';
  if (items.length > 0) {
    const displayItems = items.slice(0, maxItems);
    itemsHTML = displayItems.map((item, i) => {
      const subtitle = item.subtitle ? ` — ${item.subtitle}` : '';
      return `<div style="padding: 3px 8px; font-size: 11px; color: #475569; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; gap: 6px;">
        <span style="color: #94a3b8; font-weight: 600; min-width: 16px;">${i + 1}.</span>
        <span style="font-weight: 500;">${item.name}</span>
        ${subtitle ? `<span style="color: #94a3b8; font-size: 10px;">${subtitle}</span>` : ''}
      </div>`;
    }).join('');
    
    // Add "more" indicator if there are more items
    if (items.length > maxItems) {
      itemsHTML += `<div style="padding: 4px 8px; font-size: 10px; color: #94a3b8; text-align: center; font-style: italic;">+ ${items.length - maxItems} más...</div>`;
    }
  } else {
    itemsHTML = `<div style="padding: 6px 8px; font-size: 11px; color: #94a3b8; text-align: center;">Sin detalles disponibles</div>`;
  }
  
  return `
    <div style="font-family: Outfit, sans-serif; font-size: 11px; font-weight: 600; color: #1f2937; padding: 6px 8px; border-bottom: 1px solid #f1f5f9; background: #f8fafc;">
      ${icon} ${label || 'Sin etiqueta'}
    </div>
    <div style="font-family: Outfit, sans-serif; font-size: 11px; font-weight: 600; color: #054F94; padding: 4px 8px; background: #eff6ff; border-bottom: 1px solid #f1f5f9;">
      ${countStr}
    </div>
    ${itemsHTML}
  `;
};

/**
 * Creates a simple tooltip config for charts with consistent styling.
 * Provides consistent styling without the detailed item breakdown.
 */
export const createSimpleTooltipConfig = (icon: string, unit: string) => ({
  theme: 'light' as const,
  custom: ({ seriesIndex, dataPointIndex, w }: any) => {
    if (dataPointIndex === undefined || dataPointIndex < 0) return '';
    
    // Try multiple sources for the label (more robust)
    let label = '';
    if (w.globals.labels && w.globals.labels[dataPointIndex]) {
      label = w.globals.labels[dataPointIndex];
    } else if (w.globals.categories && w.globals.categories[dataPointIndex]) {
      label = w.globals.categories[dataPointIndex];
    } else if (w.globals.seriesNames && w.globals.seriesNames[seriesIndex]) {
      label = w.globals.seriesNames[seriesIndex];
    }
    
    // Get value safely using helper function
    const seriesData = w.globals.series[seriesIndex];
    const value = extractValueFromSeries(seriesData, dataPointIndex);
    
    return generateTooltipHTML({
      label: label || 'Sin dato',
      count: value,
      unit,
      icon,
    });
  },
  style: { fontSize: '11px', fontFamily: 'Outfit, sans-serif' },
  marker: { show: true },
});

/**
 * Formats a date string for tooltip display in Spanish.
 * @param dateStr - Date string in YYYY-MM-DD format
 * @returns Formatted date in Spanish
 */
export const formatDateForTooltip = (dateStr: string): string => {
  try {
    if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      const parts = dateStr.split('-');
      const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      if (!isNaN(d.getTime())) {
        const formatted = d.toLocaleDateString('es-VE', { 
          weekday: 'long', 
          day: 'numeric', 
          month: 'long', 
          year: 'numeric' 
        });
        return formatted.charAt(0).toUpperCase() + formatted.slice(1);
      }
    }
    return dateStr;
  } catch {
    return dateStr;
  }
};

/**
 * Creates a tooltip config that uses the chart's data directly for better reliability.
 * This approach is more robust than relying on w.globals which can vary by chart type.
 */
export const createDataBasedTooltip = (
  icon: string,
  unit: string,
  getLabel: (dataPointIndex: number) => string
) => ({
  theme: 'light' as const,
  custom: ({ seriesIndex, dataPointIndex, w }: any) => {
    if (dataPointIndex === undefined || dataPointIndex < 0) return '';
    
    // Get value from series - handle both array and object formats
    let value = 0;
    const seriesData = w.globals.series[seriesIndex];
    if (Array.isArray(seriesData)) {
      value = seriesData[dataPointIndex] ?? 0;
    } else if (typeof seriesData === 'object' && seriesData !== null) {
      // Handle y-based data
      const yValue = seriesData[dataPointIndex];
      value = typeof yValue === 'object' ? (yValue.y ?? 0) : (yValue ?? 0);
    }
    
    const label = getLabel(dataPointIndex);
    
    return generateTooltipHTML({
      label,
      count: Number(value) || 0,
      unit,
      icon,
    });
  },
  style: { fontSize: '11px', fontFamily: 'Outfit, sans-serif' },
  marker: { show: true },
});

// Helper type guard for Array check
function ArrayIsArray<T>(arr: unknown): arr is T[] {
  return Array.isArray(arr);
}