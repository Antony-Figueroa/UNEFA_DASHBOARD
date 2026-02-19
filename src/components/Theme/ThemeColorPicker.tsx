import { useTheme } from "../../context/theme";
import { BRAND_COLORS, BrandColorKey } from "../../theme/brandColors";
import { Check } from "lucide-react";

interface ThemeColorPickerProps {
  className?: string;
}

export default function ThemeColorPicker({ className = "" }: ThemeColorPickerProps) {
  const { brandColor, setBrandColor } = useTheme();

  const handleColorSelect = (colorKey: BrandColorKey) => {
    if (colorKey !== brandColor) {
      setBrandColor(colorKey);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <h3 className="text-sm font-semibold text-text-primary dark:text-white mb-1">
          Color del Tema
        </h3>
        <p className="text-xs text-text-secondary dark:text-text-tertiary">
          Personaliza el color principal del sistema
        </p>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
        {BRAND_COLORS.map((color) => {
          const isSelected = brandColor === color.key;
          
          return (
            <button
              key={color.key}
              type="button"
              onClick={() => handleColorSelect(color.key)}
              className={`
                relative group flex flex-col items-center justify-center
                w-12 h-12 rounded-xl transition-all duration-200
                hover:scale-110 hover:shadow-lg
                ${isSelected 
                  ? "ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-900 scale-105 shadow-md" 
                  : "hover:ring-1 hover:ring-gray-300 dark:hover:ring-gray-600"
                }
              `}
              style={{ 
                backgroundColor: color.primary
              }}
              title={color.name}
            >
              {isSelected && (
                <Check className="w-5 h-5 text-white drop-shadow-md" />
              )}
              <span className="sr-only">{color.name}</span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-3 pt-2">
        <span className="text-xs text-text-secondary dark:text-text-tertiary">
          Color seleccionado:
        </span>
        <span 
          className="px-3 py-1 rounded-full text-xs font-medium text-white"
          style={{ backgroundColor: BRAND_COLORS.find(c => c.key === brandColor)?.primary }}
        >
          {BRAND_COLORS.find(c => c.key === brandColor)?.name}
        </span>
      </div>
    </div>
  );
}
