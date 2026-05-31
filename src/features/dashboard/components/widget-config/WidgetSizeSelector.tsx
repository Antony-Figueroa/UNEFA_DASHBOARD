/**
 * @file WidgetSizeSelector.tsx
 * @description Selector de tamaño para widgets del dashboard.
 * Muestra botones con el ancho proporcional para cada tamaño.
 */

import type { WidgetSize } from '../../constants/widgetRegistry';

interface SizeOption {
  value: WidgetSize;
  label: string;
  desc: string;
  /** Clase de ancho visual para la preview */
  previewWidth: string;
}

const SIZES: SizeOption[] = [
  { value: 'sm', label: '1/3', desc: 'Columna angosta', previewWidth: 'w-[25%]' },
  { value: 'md', label: '1/2', desc: 'Media columna', previewWidth: 'w-[50%]' },
  { value: 'lg', label: '2/3', desc: 'Columna amplia', previewWidth: 'w-[75%]' },
  { value: 'xl', label: 'Full', desc: 'Ancho completo', previewWidth: 'w-full' },
];

interface WidgetSizeSelectorProps {
  value?: WidgetSize;
  onChange: (size: WidgetSize | undefined) => void;
}

const WidgetSizeSelector = ({ value, onChange }: WidgetSizeSelectorProps) => {
  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {SIZES.map((size) => {
        const isActive = (value ?? 'sm') === size.value;
        return (
          <button
            key={size.value}
            onClick={() => onChange(size.value)}
            className={`
              relative flex flex-col items-center gap-1 rounded-lg px-2.5 py-2 text-xs font-medium
              transition-all duration-150 border min-w-[56px]
              ${isActive
                ? 'border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-500/10 dark:text-blue-300 shadow-sm'
                : 'border-border-light bg-white text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:border-gray-500 dark:hover:text-gray-200'
              }
            `}
            title={size.desc}
          >
            {/* Barra visual proporcional */}
            <span className={`h-1.5 rounded-full ${size.previewWidth} ${isActive ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
            <span>{size.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default WidgetSizeSelector;
