/**
 * @file WidgetColorPicker.tsx
 * @description Selector de color de acento para widgets.
 * Paleta basada en los colores del sistema con variantes accesibles.
 */

import { useState, useRef, useEffect } from 'react';
import { FiCheck, FiX } from 'react-icons/fi';

const PRESET_COLORS = [
  // Azules
  { value: '#054F94', label: 'Azul institucional', category: 'neutros' },
  { value: '#2563EB', label: 'Azul primario', category: 'neutros' },
  { value: '#0284C7', label: 'Celeste', category: 'neutros' },
  // Verdes
  { value: '#059669', label: 'Esmeralda', category: 'positivos' },
  { value: '#16A34A', label: 'Verde', category: 'positivos' },
  { value: '#65A30D', label: 'Lima', category: 'positivos' },
  // Rojos / Naranjas
  { value: '#DC2626', label: 'Rojo', category: 'alertas' },
  { value: '#EA580C', label: 'Naranja', category: 'alertas' },
  { value: '#D97706', label: 'Ámbar', category: 'alertas' },
  // Púrpuras / Rosas
  { value: '#7C3AED', label: 'Violeta', category: 'neutros' },
  { value: '#9333EA', label: 'Púrpura', category: 'neutros' },
  { value: '#DB2777', label: 'Rosa', category: 'neutros' },
  // Grises
  { value: '#6B7280', label: 'Gris', category: 'neutros' },
  { value: '#4B5563', label: 'Gris oscuro', category: 'neutros' },
];

interface WidgetColorPickerProps {
  value?: string;
  onChange: (color: string | undefined) => void;
}

const WidgetColorPicker = ({ value, onChange }: WidgetColorPickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedColor = value ?? '#054F94';

  return (
    <div ref={ref} className="relative">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium
                     border border-border-light bg-white hover:bg-gray-50
                     dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700
                     transition-colors"
        >
          <span
            className="inline-block size-4 rounded-full border border-white/20 shadow-sm"
            style={{ backgroundColor: selectedColor }}
          />
          <span className="text-gray-600 dark:text-gray-300">Color</span>
          {value && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onChange(undefined);
              }}
              className="ml-1 p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
              title="Restablecer color por defecto"
            >
              <FiX className="size-3 text-gray-400" />
            </button>
          )}
        </button>
      </div>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1 z-50 w-[220px] rounded-xl border border-border-light bg-white p-3 shadow-lg dark:border-gray-700 dark:bg-gray-800">
          <div className="grid grid-cols-7 gap-1.5">
            {PRESET_COLORS.map((c) => {
              const isSelected = value === c.value;
              return (
                <button
                  key={c.value}
                  onClick={() => {
                    onChange(c.value);
                    setIsOpen(false);
                  }}
                  className={`
                    relative flex items-center justify-center size-7 rounded-lg
                    transition-all duration-150 hover:scale-110 hover:shadow-md
                    ${isSelected ? 'ring-2 ring-offset-1 ring-blue-500 dark:ring-offset-gray-800' : ''}
                  `}
                  style={{ backgroundColor: c.value }}
                  title={c.label}
                >
                  {isSelected && (
                    <FiCheck className="size-4 text-white drop-shadow" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default WidgetColorPicker;
