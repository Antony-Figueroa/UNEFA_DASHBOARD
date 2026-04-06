import { forwardRef, useEffect, useRef } from 'react';
import flatpickr from 'flatpickr';
import { Spanish } from 'flatpickr/dist/l10n/es.js';
import 'flatpickr/dist/flatpickr.min.css';
import { cn } from '../../utils/cn';
import Label from './Label';

/**
 * Propiedades para el componente FlatpickrDatePicker.
 */
interface FlatpickrDatePickerProps {
  id?: string;
  label?: string;
  defaultValue?: string | Date | null;
  value?: string | Date | null;
  onChange?: (dateStr: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  onBlur?: () => void;
  error?: boolean;
  options?: any;
}

/**
 * Componente de selección de fecha usando Flatpickr para mantener la estética,
 * pero configurado para comportarse como un input nativo.
 */
const FlatpickrDatePicker = forwardRef<HTMLInputElement, FlatpickrDatePickerProps>(
  ({ id, label, defaultValue, value, onChange, placeholder = "dd/mm/yyyy", className, disabled, onBlur, error, options }, ref) => {
    const inputRef = useRef<HTMLInputElement | null>(null);
    const fpInstance = useRef<any>(null);
    const optionsRef = useRef(options);
    const isInteractingWithCalendar = useRef(false);

    // Actualizar el ref de opciones cuando cambien
    // Gestionar el evento mouseup globalmente una sola vez
    useEffect(() => {
      const handleGlobalMouseUp = () => {
        if (isInteractingWithCalendar.current) {
          setTimeout(() => {
            isInteractingWithCalendar.current = false;
          }, 150);
        }
      };

      window.addEventListener('mouseup', handleGlobalMouseUp);
      return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
    }, []);

    useEffect(() => {
      optionsRef.current = options;
    }, [options]);

    // Función para formatear la entrada manual
    const handleInput = (e: React.FormEvent<HTMLInputElement>) => {
      const input = e.currentTarget;
      let val = input.value.replace(/\D/g, ''); // Solo números
      
      if (val.length > 8) val = val.slice(0, 8);
      
      let formatted = '';
      if (val.length > 0) {
        formatted = val.slice(0, 2);
        if (val.length > 2) {
          formatted += '/' + val.slice(2, 4);
          if (val.length > 4) {
            formatted += '/' + val.slice(4, 8);
          }
        }
      }
      
      input.value = formatted;
      
      // Si la fecha está completa (8 dígitos = ddmmyyyy), actualizar el calendario inmediatamente
      if (val.length === 8) {
        const day = val.slice(0, 2);
        const month = val.slice(2, 4);
        const year = val.slice(4, 8);
        const completeDate = `${day}/${month}/${year}`;
        
        // Validar que sea una fecha válida (validar día y mes)
        const nDay = parseInt(day, 10);
        const nMonth = parseInt(month, 10);
        
        if (nDay >= 1 && nDay <= 31 && nMonth >= 1 && nMonth <= 12 && parseInt(year, 10) >= 1900) {
          // Verificar que la fecha sea real (no 31 de febrero etc)
          const testDate = new Date(parseInt(year, 10), nMonth - 1, nDay);
          if (testDate.getMonth() === nMonth - 1 && testDate.getDate() === nDay) {
            // Sincronizar con flatpickr - FORZAR actualización sin limpiar el input
            if (fpInstance.current) {
              fpInstance.current.setDate(completeDate, false, 'd/m/Y'); // false = no dispara onChange
            }
            // Notificar el cambio al componente padre
            onChange?.(completeDate);
          }
        }
      }
    };

    // Función para completar la fecha al perder el foco
    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      const input = e.currentTarget;
      
      // Si estamos interactuando con el calendario, no procesamos el blur aún
      if (isInteractingWithCalendar.current) {
        return;
      }

      // Pequeño delay para permitir que el foco se asiente en el nuevo elemento
      setTimeout(() => {
        if (isInteractingWithCalendar.current) return;

        const activeElement = document.activeElement;
        const isClickInsideCalendar = 
          activeElement?.closest('.flatpickr-calendar') || 
          activeElement?.classList.contains('flatpickr-monthDropdown-months') ||
          activeElement?.classList.contains('cur-year') ||
          activeElement?.classList.contains('flatpickr-next-month') ||
          activeElement?.classList.contains('flatpickr-prev-month');

        if (isClickInsideCalendar) {
          return;
        }

        const val = input.value;
        // Si el input no está vacío y no está completo (dd/mm/yyyy)
        if (val && val.length > 0) {
          const parts = val.split('/');
          let day = parts[0] || '';
          let month = parts[1] || '';
          let year = parts[2] || '';

          // Obtener límites de las opciones desde el ref
          const currentOptions = optionsRef.current;
          const minDate = currentOptions?.minDate ? new Date(currentOptions.minDate) : new Date('1900-01-01');
          const maxDate = currentOptions?.maxDate ? new Date(currentOptions.maxDate) : new Date('2100-12-31');
          
          const minYear = minDate.getFullYear();
          const maxYear = maxDate.getFullYear();

          // 1. Completar el año si está incompleto o ausente
          if (year.length === 0) {
            year = String(minYear);
          } else if (year.length < 4) {
            if (year.length <= 2) {
              const proposedYear = parseInt('20' + year.padStart(2, '0'));
              if (proposedYear >= minYear && proposedYear <= maxYear) {
                year = String(proposedYear);
              } else {
                year = String(minYear);
              }
            } else {
              year = year.padEnd(4, '0');
            }
          }

          // 2. Completar mes y día si faltan
          if (month.length === 0) {
            month = String(minDate.getMonth() + 1).padStart(2, '0');
          } else if (month.length < 2) {
            month = month.padStart(2, '0');
          }

          if (day.length === 0) {
            day = String(minDate.getDate()).padStart(2, '0');
          } else if (day.length < 2) {
            day = day.padStart(2, '0');
          }

          // 3. Validar valores numéricos básicos (mes 1-12, día 1-31)
          let nDay = Math.max(1, Math.min(31, parseInt(day) || 1));
          let nMonth = Math.max(1, Math.min(12, parseInt(month) || 1));
          let nYear = parseInt(year);

          // 4. Crear objeto fecha para validación final de rango
          let finalDate = new Date(nYear, nMonth - 1, nDay);
          
          if (finalDate.getMonth() !== nMonth - 1) {
            finalDate = new Date(nYear, nMonth, 0); // Último día del mes anterior
          }

          // 5. Aplicar restricciones de minDate y maxDate
          if (finalDate < minDate) finalDate = new Date(minDate);
          if (finalDate > maxDate) finalDate = new Date(maxDate);

          // 6. Formatear resultado final
          const fDay = String(finalDate.getDate()).padStart(2, '0');
          const fMonth = String(finalDate.getMonth() + 1).padStart(2, '0');
          const fYear = String(finalDate.getFullYear());

          const completedDate = `${fDay}/${fMonth}/${fYear}`;
          input.value = completedDate;

          // Sincronizar con la instancia de Flatpickr y disparar onChange
          if (fpInstance.current) {
            fpInstance.current.setDate(completedDate, true, 'd/m/Y');
          }

          // Disparar evento de input para compatibilidad adicional
          const event = new Event('input', { bubbles: true });
          input.dispatchEvent(event);
        }
        
        onBlur?.();
      }, 100);
    };

    // Función para validar la tecla presionada y procesar Enter
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Permitir números, controles, y /
      const isNumber = /[0-9]/.test(e.key);
      const isControl = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'].includes(e.key);
      const isSlash = e.key === '/';
      
      if (!isNumber && !isControl && !isSlash) {
        e.preventDefault();
        return;
      }
      
      // Al presionar Enter, procesar la fecha como si fuera blur
      if (e.key === 'Enter') {
        const input = e.currentTarget;
        const val = input.value;
        
        // Si la fecha está completa (dd/mm/yyyy), procesarla
        if (val && val.length === 10) {
          const parts = val.split('/');
          if (parts.length === 3 && parts[0].length === 2 && parts[1].length === 2 && parts[2].length === 4) {
            const day = parseInt(parts[0]);
            const month = parseInt(parts[1]);
            const year = parseInt(parts[2]);
            
            if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900 && year <= 2100) {
              const dateObj = new Date(year, month - 1, day);
              
              // Actualizar flatpickr
              if (fpInstance.current) {
                fpInstance.current.setDate(dateObj, true, 'd/m/Y');
              }
              
              // Notificar cambio
              onChange?.(val);
            }
          }
        }
      }
    };

    useEffect(() => {
      if (inputRef.current) {
        // Limpiar instancia previa si existe
        if (fpInstance.current) {
          fpInstance.current.destroy();
        }

        // Extraer minDate y maxDate reales de las opciones
        const realMinDate = options?.minDate ? new Date(options.minDate) : undefined;
        const realMaxDate = options?.maxDate ? new Date(options.maxDate) : undefined;

        // Determinar fecha inicial para la vista (si no hay valor)
        const initialDefaultDate = value || defaultValue || options?.defaultDate || realMaxDate || realMinDate || undefined;

        // Función para deshabilitar años en el dropdown que están fuera del rango real
        const updateYearOptions = (instance: any) => {
          const yearSelect = instance.currentYearElement;
          if (yearSelect && yearSelect.tagName === 'SELECT') {
            Array.from(yearSelect.options).forEach((option: any) => {
              const year = parseInt(option.value);
              const isOutOfRange = (realMinDate && year < realMinDate.getFullYear()) || 
                                  (realMaxDate && year > realMaxDate.getFullYear());
              if (isOutOfRange) {
                option.disabled = true;
                option.style.opacity = '0.5';
                option.style.cursor = 'not-allowed';
              } else {
                option.disabled = false;
                option.style.opacity = '1';
                option.style.cursor = 'pointer';
              }
            });
          }
        };

        // Función para ocultar flechas si no se puede avanzar/retroceder más allá del rango real
        const updateArrows = (instance: any) => {
          if (!realMinDate && !realMaxDate) return;

          const currentMonth = instance.currentMonth;
          const currentYear = instance.currentYear;
          const container = instance.calendarContainer;

          if (!container) return;

          if (realMinDate) {
            const minMonth = realMinDate.getMonth();
            const minYear = realMinDate.getFullYear();
            
            if (currentYear < minYear || (currentYear === minYear && currentMonth <= minMonth)) {
              container.classList.add('hide-prev-arrow');
            } else {
              container.classList.remove('hide-prev-arrow');
            }
          }

          if (realMaxDate) {
            const maxMonth = realMaxDate.getMonth();
            const maxYear = realMaxDate.getFullYear();
            
            if (currentYear > maxYear || (currentYear === maxYear && currentMonth >= maxMonth)) {
              container.classList.add('hide-next-arrow');
            } else {
              container.classList.remove('hide-next-arrow');
            }
          }
        };

        fpInstance.current = flatpickr(inputRef.current, {
          locale: Spanish,
          dateFormat: 'Y-m-d',
          altInput: true,
          altFormat: 'd/m/Y',
          allowInput: true,
          monthSelectorType: 'dropdown',
          yearSelectorType: 'dropdown',
          defaultDate: initialDefaultDate,
          disableMobile: true,
          animate: true,
          // Renderizar el calendario en el body para evitar problemas de overflow en el modal
          static: false,
          // Asegurar que el calendario aparezca por encima del modal
          appendTo: document.body,
          altInputClass: cn(
            'h-11 w-full rounded-lg border bg-transparent px-4 py-2.5 text-sm shadow-theme-xs transition-all',
            'placeholder:text-text-tertiary focus:outline-none focus:ring-3',
            error 
              ? 'border-error-500 focus:border-error-500 focus:ring-error-500/10' 
              : 'text-text-primary border-border-medium focus:border-brand-300 focus:ring-brand-500/10',
            'dark:bg-bg-dark dark:text-text-emphasis dark:border-border-dark dark:focus:border-brand-800',
            disabled && 'opacity-50 cursor-not-allowed bg-bg-secondary dark:bg-white/5'
          ),
          ...options,
          // Usar minDate y maxDate reales de las opciones para limitar el calendario
          minDate: options?.minDate || realMinDate,
          maxDate: options?.maxDate || realMaxDate,
          // Deshabilitar días fuera del rango real
          disable: [
            (date) => {
              const d = new Date(date);
              d.setHours(0, 0, 0, 0);
              
              const minD = realMinDate ? new Date(realMinDate.getFullYear(), realMinDate.getMonth(), realMinDate.getDate()) : null;
              const maxD = realMaxDate ? new Date(realMaxDate.getFullYear(), realMaxDate.getMonth(), realMaxDate.getDate()) : null;
              
              const isBefore = minD ? d < minD : false;
              const isAfter = maxD ? d > maxD : false;
              
              // Combinar con otras funciones de deshabilitado si existen en options.disable
              let extraDisable = false;
              if (options?.disable) {
                if (Array.isArray(options.disable)) {
                  extraDisable = options.disable.some((d: any) => {
                    if (typeof d === 'function') return d(date);
                    if (d instanceof Date) return d.toDateString() === date.toDateString();
                    if (typeof d === 'object' && d.from && d.to) {
                      return date >= new Date(d.from) && date <= new Date(d.to);
                    }
                    return false;
                  });
                } else if (typeof options.disable === 'function') {
                  extraDisable = options.disable(date);
                }
              }
              
              return isBefore || isAfter || extraDisable;
            }
          ],
          onReady: (_selectedDates, _dateStr, instance) => {
            const altInput = instance.altInput;
            if (altInput) {
              altInput.addEventListener('input', (e: any) => handleInput(e));
              altInput.addEventListener('keydown', (e: any) => handleKeyDown(e));
              altInput.addEventListener('blur', (e: any) => handleBlur(e));
              altInput.placeholder = placeholder;
              altInput.setAttribute('autocomplete', 'bday');
              altInput.setAttribute('name', 'bday');
              altInput.setAttribute('inputmode', 'numeric');
            }

            // Asegurar que el calendario tenga z-index alto para estar por encima del modal
            instance.calendarContainer.style.setProperty('z-index', '10050', 'important');

            // Posicionar la vista del calendario en el rango permitido (ej. maxDate) sin seleccionar
            if (!value && !defaultValue) {
              const jumpTarget = realMaxDate || realMinDate || new Date();
              instance.jumpToDate(jumpTarget);
            }

            // Evitar que clics en el calendario cierren otros componentes o el mismo
            instance.calendarContainer.addEventListener('mousedown', (_e: MouseEvent) => {
              isInteractingWithCalendar.current = true;
              // No detenemos la propagación aquí para permitir que Flatpickr maneje sus propios clics
            });

            // Configurar elementos que no deben disparar el cierre por foco
            const monthSelect = instance.monthNav.querySelector('.flatpickr-monthDropdown-months');
            const yearInput = instance.currentYearElement;
            const nextArrow = instance.nextMonthNav;
            const prevArrow = instance.prevMonthNav;
            
            if (instance.config) {
              instance.config.ignoredFocusElements = [
                ...(instance.config.ignoredFocusElements || []),
                monthSelect as HTMLElement,
                yearInput as HTMLElement,
                nextArrow as HTMLElement,
                prevArrow as HTMLElement,
                instance.calendarContainer as HTMLElement,
                instance.innerContainer as HTMLElement
              ].filter((el: any): el is HTMLElement => el !== null && el !== undefined);
            }
  
            updateYearOptions(instance);
            updateArrows(instance);
          },
          onClose: () => {
            isInteractingWithCalendar.current = false;
          },
          onOpen: (_selectedDates, _dateStr, instance) => {
            updateYearOptions(instance);
            updateArrows(instance);
          },
          onMonthChange: (_selectedDates, _dateStr, instance) => {
            setTimeout(() => {
              updateYearOptions(instance);
              updateArrows(instance);
            }, 0);
          },
          onYearChange: (_selectedDates, _dateStr, instance) => {
            setTimeout(() => {
              updateYearOptions(instance);
              updateArrows(instance);
            }, 0);
          },
          onChange: (_selectedDates, dateStr) => {
            onChange?.(dateStr);
          }
        });
      }

      return () => {
        if (fpInstance.current) {
          fpInstance.current.destroy();
          fpInstance.current = null;
        }
      };
    }, [defaultValue, value, onChange, placeholder, disabled, error, options]);

    // Actualizar valor cuando cambie
    useEffect(() => {
      if (fpInstance.current && value !== undefined) {
        const currentDate = fpInstance.current.selectedDates[0];
        const newDate = value ? (value instanceof Date ? value : new Date(value)) : null;
        
        if (newDate?.getTime() !== currentDate?.getTime()) {
          fpInstance.current.setDate(value || '', false);
        }
      }
    }, [value]);

    // Actualizar estado deshabilitado
    useEffect(() => {
      if (fpInstance.current) {
        const altInput = fpInstance.current.altInput;
        if (altInput) {
          altInput.disabled = !!disabled;
        }
        fpInstance.current._input.disabled = !!disabled;
      }
    }, [disabled]);

    // Actualizar opciones (minDate, maxDate, etc.)
    useEffect(() => {
      if (fpInstance.current && options) {
        fpInstance.current.set(options);
      }
    }, [options]);

    return (
      <div className={cn('w-full', className)}>
        {label && <Label htmlFor={id}>{label}</Label>}
        <div className="relative">
          <input
            id={id}
            ref={(node) => {
              inputRef.current = node;
              if (typeof ref === 'function') ref(node);
              else if (ref) ref.current = node;
            }}
            type="text"
            disabled={disabled}
            onBlur={onBlur}
            placeholder={placeholder}
            className={cn(
              'h-11 w-full rounded-lg border bg-transparent px-4 py-2.5 text-sm shadow-theme-xs transition-all',
              'placeholder:text-text-tertiary focus:outline-none focus:ring-3',
              error 
                ? 'border-error-500 focus:border-error-500 focus:ring-error-500/10' 
                : 'text-text-primary border-border-medium focus:border-brand-300 focus:ring-brand-500/10',
              'dark:bg-bg-dark dark:text-text-emphasis dark:border-border-dark dark:focus:border-brand-800',
              disabled && 'opacity-50 cursor-not-allowed bg-bg-secondary dark:bg-white/5',
              'hidden' // Ocultar el input original porque Flatpickr crea uno nuevo con altInput
            )}
          />
        </div>
      </div>
    );
  }
);

FlatpickrDatePicker.displayName = 'FlatpickrDatePicker';

export default FlatpickrDatePicker;
