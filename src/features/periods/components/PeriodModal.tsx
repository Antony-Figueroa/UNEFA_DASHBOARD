/**
 * @file Modal para la creación y edición de periodos académicos.
 * @description Este componente presenta un formulario dentro de un modal, utilizando
 * `react-flatpickr` para una selección de fechas estilizada y consistente.
 */

import { useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTheme } from '../../../context/ThemeContext';
import { Periodo } from '../types';
import { Modal } from '../../../components/ui/modal';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/flatpickr.min.css';
import { CalendarIcon } from '../../../icons/actions';

interface PeriodModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (periodo: Omit<Periodo, "periodId" | "creationDate"> | Periodo) => void;
    periodo: Periodo | null;
    isSaving: boolean;
    existingPeriods: Periodo[];
}

// Esquema de validación con Zod
const periodSchema = z.object({
    anio: z.string().min(1, { message: 'El año es obligatorio.' }),
    periodoTipo: z.enum(['I', 'II'], { errorMap: () => ({ message: 'Seleccione el periodo.' }) }),
    startDate: z.date({ // Usamos errorMap para mayor compatibilidad
        errorMap: (issue, ctx) => {
            if (issue.code === 'invalid_type' && issue.received === 'undefined') {
                return { message: 'La fecha de inicio es obligatoria.' };
            }
            return { message: 'Formato de fecha de inicio no válido.' };
        },
    }),
    endDate: z.date({ // Usamos errorMap para mayor compatibilidad
        errorMap: (issue, ctx) => {
            if (issue.code === 'invalid_type' && issue.received === 'undefined') {
                return { message: 'La fecha de fin es obligatoria.' };
            }
            return { message: 'Formato de fecha de fin no válido.' };
        },
    }),
}).superRefine((data, ctx) => {
    if (data.endDate <= data.startDate) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "La fecha de fin debe ser posterior a la de inicio.",
            path: ["endDate"]
        });
        return;
    }
    // Validación de 16 semanas (16 semanas * 7 días * 24 horas * 60 min * 60 seg * 1000 ms)
    const minDuration = 16 * 7 * 24 * 60 * 60 * 1000;
    if (data.endDate.getTime() - data.startDate.getTime() < minDuration) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "El periodo debe tener una duración mínima de 16 semanas.",
            path: ["endDate"]
        });
    }
});

// Extrae el tipo del esquema para usarlo en el formulario
type PeriodFormData = z.infer<typeof periodSchema>;

export default function PeriodModal({ isOpen, onClose, onSave, periodo, isSaving, existingPeriods }: PeriodModalProps) {
    const { colorMode } = useTheme();
    const { register, handleSubmit, formState: { errors }, control, reset, watch, setError, setValue } = useForm<PeriodFormData>({
        resolver: zodResolver(periodSchema),
        defaultValues: {
            anio: '',
            periodoTipo: 'I',
        },
    });
    const startDateValue = watch('startDate');

    const isCulminado = periodo?.periodStatus === 3;
    const isInCurso = periodo?.periodStatus === 2;

    /**
     * Calcula los rangos de fechas de los periodos existentes para deshabilitarlos en el calendario.
     */
    const disabledDateRanges = useMemo(() => {
        return existingPeriods
            .filter(p => p.periodId !== periodo?.periodId) // Excluye el periodo actual si se está editando
            .map(p => ({
                from: p.startDate,
                to: p.endDate,
            }));
    }, [existingPeriods, periodo]);

    /**
     * Calcula la fecha mínima de inicio para un nuevo periodo.
     */
    const minNewPeriodStartDate = useMemo(() => {
        if (periodo || existingPeriods.length === 0) return 'today';
        const getLapsoValue = (l: string) => parseInt(l.split('-')[0]) + (l.endsWith('I') ? 0 : 0.5);
        const lastPeriod = [...existingPeriods].sort((a, b) => getLapsoValue(b.description) - getLapsoValue(a.description))[0];
        const dayAfter = new Date(lastPeriod.endDate);
        dayAfter.setDate(dayAfter.getDate() + 1);
        return dayAfter;
    }, [existingPeriods, periodo]);

    /**
     * Calcula la fecha mínima de fin permitida (16 semanas después de la fecha de inicio).
     */
    const minEndDate = useMemo(() => {
        if (!startDateValue) return undefined;
        const minDuration = 16 * 7 * 24 * 60 * 60 * 1000;
        return new Date(startDateValue.getTime() + minDuration);
    }, [startDateValue]);

    /**
     * Genera las opciones para el selector de AÑO.
     * Se memoiza con `useMemo` para evitar que se recalcule en cada render.
     */
    const yearOptions = useMemo(() => {
        const currentYear = new Date().getFullYear();
        const options: string[] = [];
        for (let i = 0; i <= 5; i++) {
            options.push(`${currentYear + i}`);
        }
        return options;
    }, []);

    /**
     * Efecto para inicializar o resetear el formulario cuando el modal se abre.
     */
    useEffect(() => {
        if (isOpen) {
            if (periodo) {
                // Dividir el lapso existente (ej: "2025-I") en año y tipo
                const [anio, tipo] = periodo.description.split('-');
                const inicio = periodo.startDate; // Ya es un objeto Date gracias al servicio
                const fin = periodo.endDate;     // Ya es un objeto Date gracias al servicio
                reset({
                    anio: anio,
                    periodoTipo: tipo as 'I' | 'II',
                    startDate: !isNaN(inicio.getTime()) ? inicio : undefined,
                    endDate: !isNaN(fin.getTime()) ? fin : undefined,
                });
            } else {
                // --- Autocompletado para un nuevo periodo ---
                const getLapsoValue = (l: string) => parseInt(l.split('-')[0]) + (l.endsWith('I') ? 0 : 0.5);

                let nextAnio = new Date().getFullYear().toString();
                let nextPeriodoTipo: 'I' | 'II' = 'I';
                let autoStartDate: Date | undefined = undefined;

                if (existingPeriods.length > 0) {
                    const lastPeriod = [...existingPeriods].sort((a, b) => getLapsoValue(b.description) - getLapsoValue(a.description))[0];
                    const [lastAnio, lastTipo] = lastPeriod.description.split('-');

                    if (lastTipo === 'I') {
                        nextAnio = lastAnio;
                        nextPeriodoTipo = 'II';
                    } else {
                        nextAnio = (parseInt(lastAnio) + 1).toString();
                        nextPeriodoTipo = 'I';
                    }

                    const dayAfterLastEnd = new Date(lastPeriod.endDate);
                    dayAfterLastEnd.setDate(dayAfterLastEnd.getDate() + 1);
                    autoStartDate = dayAfterLastEnd;
                }

                reset({
                    anio: nextAnio,
                    periodoTipo: nextPeriodoTipo,
                    startDate: autoStartDate,
                    endDate: autoStartDate ? new Date(autoStartDate.getTime() + (16 * 7 * 24 * 60 * 60 * 1000)) : undefined,
                });
            }
        }
    }, [periodo, isOpen, reset, existingPeriods]);

    /**
     * Maneja el envío del formulario, valida las fechas y llama a la función onSave.
     */
    const onSubmit = (data: PeriodFormData) => {
        const newDescription = `${data.anio}-${data.periodoTipo}`;

        // --- Validación de Solapamiento de Fechas ---
        const { startDate: newStart, endDate: newEnd } = data;
        const hasOverlap = existingPeriods.some(p => {
            // Excluir el periodo actual si estamos editando
            if (periodo && p.periodId === periodo.periodId) {
                return false;
            }
            // Un solapamiento ocurre si un periodo empieza antes de que el otro termine,
            // y termina después de que el otro empieza.
            return (newStart < p.endDate) && (newEnd > p.startDate);
        });

        if (hasOverlap) {
            setError("startDate", {
                type: "manual",
                message: "El rango de fechas se solapa con un periodo existente."
            });
            return;
        }

        // --- Validación 2: Secuencialidad ---
        // Solo validamos secuencia si estamos creando o si el lapso cambió al editar
        if (!periodo || periodo.description !== newDescription) {
            // Función auxiliar para convertir lapso a valor numérico comparable (ej: 2025-I -> 2025.0, 2025-II -> 2025.5)
            const getLapsoValue = (l: string) => {
                const [y, t] = l.split('-');
                return parseInt(y) + (t === 'I' ? 0 : 0.5);
            };

            if (existingPeriods.length > 0) {
                // Encontrar el último periodo registrado
                const sortedPeriods = [...existingPeriods].sort((a, b) => getLapsoValue(b.description) - getLapsoValue(a.description));
                const lastPeriod = sortedPeriods[0];
                const lastValue = getLapsoValue(lastPeriod.description);
                const newValue = getLapsoValue(newDescription);

                // El nuevo valor debe ser exactamente 0.5 mayor que el último (siguiente semestre)
                // Nota: 0.5 representa el paso de I a II o de II al I del siguiente año.
                if (newValue <= lastValue) {
                    setError("periodoTipo", { message: `El lapso debe ser posterior a ${lastPeriod.description}.` });
                    return;
                }

                // Si se requiere estrictamente el INMEDIATO siguiente (sin huecos):
                if (newValue !== lastValue + 0.5) {
                    // Calculamos cuál debería ser el siguiente para el mensaje de error
                    const nextYear = lastPeriod.description.endsWith('I') ? lastPeriod.description.split('-')[0] : parseInt(lastPeriod.description.split('-')[0]) + 1;
                    const nextType = lastPeriod.description.endsWith('I') ? 'II' : 'I';
                    setError("periodoTipo", { message: `El orden debe ser secuencial. El siguiente lapso debería ser ${nextYear}-${nextType}.` });
                    return;
                }
            }
        }

        const periodoData = {
            description: newDescription,
            startDate: data.startDate,
            endDate: data.endDate,
            periodStatus: periodo?.periodStatus || 1, // 1 = Pendiente por defecto
            status: true // Activo por defecto
        };

        if (periodo && 'periodId' in periodo) {
            onSave({ ...periodo, ...periodoData });
        } else {
            onSave(periodoData);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} className={`max-w-xl p-6 ${colorMode === 'dark' ? 'dark' : ''}`}>
            <style>{`
                .flatpickr-calendar.dark {
                    background-color: #24303F;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                    border: 1px solid #3d4d60;
                }
                .flatpickr-calendar.dark .flatpickr-month {
                    color: #fff;
                    fill: #fff;
                }
                .flatpickr-calendar.dark .flatpickr-current-month .flatpickr-monthDropdown-months .flatpickr-monthDropdown-month {
                    background-color: #24303F;
                    color: #fff;
                }
                .flatpickr-calendar.dark .flatpickr-weekdays {
                    background: transparent;
                }
                .flatpickr-calendar.dark span.flatpickr-weekday {
                    color: #fff;
                }
                .flatpickr-calendar.dark .flatpickr-day {
                    color: #fff;
                }
                .flatpickr-calendar.dark .flatpickr-day:hover, 
                .flatpickr-calendar.dark .flatpickr-day.prevMonthDay:hover, 
                .flatpickr-calendar.dark .flatpickr-day.nextMonthDay:hover, 
                .flatpickr-calendar.dark .flatpickr-day:focus {
                    background-color: #3d4d60;
                    border-color: #3d4d60;
                }
                .flatpickr-calendar.dark .flatpickr-day.selected, 
                .flatpickr-calendar.dark .flatpickr-day.startRange, 
                .flatpickr-calendar.dark .flatpickr-day.endRange, 
                .flatpickr-calendar.dark .flatpickr-day.selected.inRange, 
                .flatpickr-calendar.dark .flatpickr-day.startRange.inRange, 
                .flatpickr-calendar.dark .flatpickr-day.endRange.inRange, 
                .flatpickr-calendar.dark .flatpickr-day.selected:focus, 
                .flatpickr-calendar.dark .flatpickr-day.startRange:focus, 
                .flatpickr-calendar.dark .flatpickr-day.endRange:focus, 
                .flatpickr-calendar.dark .flatpickr-day.selected:hover, 
                .flatpickr-calendar.dark .flatpickr-day.startRange:hover, 
                .flatpickr-calendar.dark .flatpickr-day.endRange:hover, 
                .flatpickr-calendar.dark .flatpickr-day.selected.prevMonthDay, 
                .flatpickr-calendar.dark .flatpickr-day.startRange.prevMonthDay, 
                .flatpickr-calendar.dark .flatpickr-day.endRange.prevMonthDay, 
                .flatpickr-calendar.dark .flatpickr-day.selected.nextMonthDay, 
                .flatpickr-calendar.dark .flatpickr-day.startRange.nextMonthDay, 
                .flatpickr-calendar.dark .flatpickr-day.endRange.nextMonthDay {
                    background-color: #3C50E0;
                    border-color: #3C50E0;
                    color: #fff;
                }
                .flatpickr-calendar.dark .numInputWrapper span.arrowUp:after {
                    border-bottom-color: #fff;
                }
                .flatpickr-calendar.dark .numInputWrapper span.arrowDown:after {
                    border-top-color: #fff;
                }
                .flatpickr-calendar.dark .numInputWrapper input {
                    color: #fff;
                }
            `}</style>
            <div className="flex flex-col px-2 overflow-y-auto custom-scrollbar">
                <div>
                    <h5 className="mb-2 font-semibold text-gray-800 modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
                        {periodo ? 'Editar Periodo' : 'Crear Nuevo Periodo'}
                    </h5>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Ingresa los detalles del periodo académico.
                    </p>
                </div>
                <form id="period-form" onSubmit={handleSubmit(onSubmit)} className="mt-8">
                    <div className="rounded-2xl border border-gray-200 bg-white shadow-default dark:border-gray-800 dark:bg-white/[0.03]">
                        <div className="border-b border-gray-200 py-4 px-6.5 dark:border-gray-800">
                            <h3 className="font-medium text-black dark:text-white">
                                Detalles del Periodo
                            </h3>
                        </div>
                        <div className="p-6.5">
                            <div className="space-y-4.5">
                                <div>
                                    <label className="mb-2.5 block text-black dark:text-white">Lapso Académico</label>
                                    {/* Contenedor visual unificado para los dos inputs */}
                                    <div className={`flex items-center rounded border ${errors.anio || errors.periodoTipo ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'} bg-white dark:bg-gray-800`}>
                                        {/* Input de Año */}
                                        <select
                                            disabled={isCulminado || isInCurso}
                                            {...register('anio')}
                                            className="w-full appearance-none bg-transparent py-3 px-5 text-black outline-none dark:text-white border-r border-gray-300 dark:border-gray-700"
                                        >
                                            <option value="" disabled className="bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">Año</option>
                                            {yearOptions.map(option => (
                                                <option key={option} value={option} className="bg-white dark:bg-gray-800 text-black dark:text-white">{option}</option>
                                            ))}
                                        </select>

                                        {/* Input de Periodo (I / II) */}
                                        <select
                                            disabled={isCulminado || isInCurso}
                                            {...register('periodoTipo')}
                                            className="w-24 appearance-none bg-transparent py-3 px-5 text-black outline-none dark:text-white text-center font-medium"
                                        >
                                            <option value="I" className="bg-white dark:bg-gray-800 text-black dark:text-white font-medium">I</option>
                                            <option value="II" className="bg-white dark:bg-gray-800 text-black dark:text-white font-medium">II</option>
                                        </select>
                                    </div>
                                    {(errors.anio || errors.periodoTipo) && <p className="mt-1 text-sm text-red-500">{errors.anio?.message || errors.periodoTipo?.message}</p>}
                                </div>

                                <div>
                                    <label className="mb-2.5 block text-black dark:text-white">Fecha de Inicio</label>
                                    <div className="relative">
                                        <Controller
                                            control={control}
                                            name="startDate"
                                            render={({ field }) => (
                                                <Flatpickr
                                                    disabled={isCulminado || isInCurso}
                                                    value={field.value ?? ''}
                                                    onChange={(dates) => {
                                                        const date = dates[0];
                                                        field.onChange(date);
                                                        if (date) {
                                                            const minDuration = 16 * 7 * 24 * 60 * 60 * 1000;
                                                            setValue('endDate', new Date(date.getTime() + minDuration), { shouldValidate: true });
                                                        }
                                                    }}
                                                    options={{
                                                        dateFormat: 'Y-m-d',
                                                        minDate: minNewPeriodStartDate,
                                                        disable: disabledDateRanges,
                                                        onOpen: (_, __, instance) => {
                                                            if (colorMode === 'dark') instance.calendarContainer.classList.add('dark');
                                                        },
                                                    }}
                                                    className={`w-full rounded border ${errors.startDate ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'} bg-white py-3 px-5 text-black font-medium outline-none transition focus:border-brand-500 active:border-brand-500 dark:bg-gray-800 dark:text-white dark:focus:border-brand-500`}
                                                    placeholder="Selecciona una fecha"
                                                />
                                            )}
                                        />
                                        <span className="absolute top-1/2 right-4 -translate-y-1/2 pointer-events-none">
                                            <CalendarIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                                        </span>
                                    </div>
                                    {errors.startDate && <p className="mt-1 text-sm text-red-500">{errors.startDate.message}</p>}
                                </div>

                                <div>
                                    <div className="mb-2.5 flex items-center gap-2">
                                        <label className="block text-black dark:text-white">Fecha de Fin</label>
                                        <div className="group relative">
                                            <svg className="w-4 h-4 text-gray-500 dark:text-gray-400 cursor-help" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                            <div className="absolute bottom-full left-1/2 mb-2 w-max -translate-x-1/2 rounded bg-black px-2 py-1 text-xs text-white opacity-0 transition-opacity duration-300 pointer-events-none group-hover:opacity-100 dark:bg-white dark:text-black z-50 shadow-sm">
                                                Mínimo 16 semanas
                                                <div className="absolute top-full left-1/2 -mt-1 -ml-1 border-4 border-transparent border-t-black dark:border-t-white"></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <Controller
                                            control={control}
                                            name="endDate"
                                            render={({ field }) => (
                                                <Flatpickr
                                                    disabled={isCulminado}
                                                    value={field.value ?? ''}
                                                    onChange={(dates) => field.onChange(dates[0])}
                                                    options={{
                                                        dateFormat: 'Y-m-d',
                                                        minDate: minEndDate,
                                                        onOpen: (_, __, instance) => {
                                                            if (colorMode === 'dark') instance.calendarContainer.classList.add('dark');
                                                        },
                                                    }}
                                                    className={`w-full rounded border ${errors.endDate ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'} bg-white py-3 px-5 text-black font-medium outline-none transition focus:border-brand-500 active:border-brand-500 dark:bg-gray-800 dark:text-white dark:focus:border-brand-500`}
                                                    placeholder="Selecciona una fecha"
                                                />
                                            )}
                                        />
                                        <span className="absolute top-1/2 right-4 -translate-y-1/2 pointer-events-none">
                                            <CalendarIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                                        </span>
                                    </div>
                                    {errors.endDate && <p className="mt-1 text-sm text-red-500">{errors.endDate.message}</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
                <div className="flex justify-end gap-4.5 mt-6">
                    <button
                        className="flex justify-center rounded border border-stroke py-2 px-6 font-medium text-black hover:shadow-1 dark:border-strokedark dark:text-white"
                        type="button"
                        onClick={onClose}
                    >
                        Cancelar
                    </button>
                    <button
                        className="flex justify-center items-center rounded-lg bg-brand-500 px-6 py-2.5 font-medium text-white hover:bg-brand-600 disabled:bg-brand-400 disabled:cursor-not-allowed"
                        type="submit"
                        form="period-form"
                        disabled={isSaving || isCulminado}
                    >
                        {isSaving && (
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none"
                                viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        )}
                        {isSaving ? 'Guardando...' : 'Guardar'}
                    </button>
                </div>
            </div>
        </Modal>
    );
}