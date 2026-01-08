/**
 * @file Modal para la creación y edición de períodos académicos.
 * @description Este componente presenta un formulario dentro de un modal, utilizando
 * `react-flatpickr` para una selección de fechas estilizada y consistente.
 */

import { useEffect, useMemo } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Periodo } from '../types';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../../components/ui/modal';
import FlatpickrDatePicker from '../../../components/form/FlatpickrDatePicker';
import Button from '../../../components/ui/button/Button';

interface PeriodModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (periodo: Omit<Periodo, "periodId" | "creationDate"> | Periodo) => void;
    periodo: Periodo | null;
    isLoading?: boolean;
    existingPeriods: Periodo[];
}

// Esquema de validación con Zod
const periodSchema = z.object({
    year: z.string().min(1, { message: 'El año es obligatorio.' }),
    periodoTipo: z.enum(['I', 'II']),
    startDate: z.date({
        message: 'La fecha de inicio es obligatoria.',
    }),
    endDate: z.date({
        message: 'La fecha de fin es obligatoria.',
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
    const maxDuration = minDuration + (24 * 60 * 60 * 1000 - 1); // Permitir hasta el final del último día
    const duration = data.endDate.getTime() - data.startDate.getTime();

    if (duration < minDuration || duration > maxDuration) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "El período debe tener una duración exacta de 16 semanas.",
            path: ["endDate"]
        });
    }
    const yearNum = parseInt(data.year);
    if (!isNaN(yearNum) && data.startDate.getFullYear() !== yearNum) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "La fecha de inicio debe corresponder al año seleccionado.",
            path: ["startDate"]
        });
    }
});

// Extrae el tipo del esquema para usarlo en el formulario
type PeriodFormData = z.infer<typeof periodSchema>;

export default function PeriodModal({ isOpen, onClose, onSave, periodo, isLoading = false, existingPeriods }: PeriodModalProps) {
    const { register, handleSubmit, formState: { errors }, control, reset, watch, setError, setValue } = useForm<PeriodFormData>({
        resolver: zodResolver(periodSchema),
        defaultValues: {
            year: '',
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
                const [year, tipo] = periodo.description.split('-');
                const inicio = periodo.startDate; // Ya es un objeto Date gracias al servicio
                const fin = periodo.endDate;     // Ya es un objeto Date gracias al servicio
                reset({
                    year: year,
                    periodoTipo: tipo as 'I' | 'II',
                    startDate: !isNaN(inicio.getTime()) ? inicio : undefined,
                    endDate: !isNaN(fin.getTime()) ? fin : undefined,
                });
            } else {
                // --- Autocompletado para un nuevo periodo ---
                const getLapsoValue = (l: string) => parseInt(l.split('-')[0]) + (l.endsWith('I') ? 0 : 0.5);

                let nextYear = new Date().getFullYear().toString();
                let nextPeriodoTipo: 'I' | 'II' = 'I';
                let autoStartDate: Date | undefined = undefined;

                if (existingPeriods.length > 0) {
                    const lastPeriod = [...existingPeriods].sort((a, b) => getLapsoValue(b.description) - getLapsoValue(a.description))[0];
                    const [lastYear, lastTipo] = lastPeriod.description.split('-');

                    if (lastTipo === 'I') {
                        nextYear = lastYear;
                        nextPeriodoTipo = 'II';
                    } else {
                        nextYear = (parseInt(lastYear) + 1).toString();
                        nextPeriodoTipo = 'I';
                    }

                    const dayAfterLastEnd = new Date(lastPeriod.endDate);
                    dayAfterLastEnd.setDate(dayAfterLastEnd.getDate() + 1);
                    autoStartDate = dayAfterLastEnd;
                }

                reset({
                    year: nextYear,
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
    const onSubmit: SubmitHandler<PeriodFormData> = (data) => {
        let newDescription = `${data.year}-${data.periodoTipo}`;
        let startDateToUse = data.startDate;

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

        if (periodo && isInCurso) {
            newDescription = periodo.description;
            startDateToUse = periodo.startDate;
        }

        const periodoData = {
            description: newDescription,
            startDate: startDateToUse,
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
        <Modal isOpen={isOpen} onClose={onClose} showCloseButton>
            <ModalHeader>
                <div className="max-w-3xl mx-auto w-full">
                    <h5 className="mb-1 font-semibold text-gray-800 modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
                        {periodo ? 'Editar Período' : 'Registrar Período'}
                    </h5>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-normal">
                        {periodo ? 'Modifica los detalles del período académico.' : 'Ingresa los detalles del nuevo período académico.'}
                    </p>
                </div>
            </ModalHeader>

            <ModalBody className="bg-gray-50/30 dark:bg-gray-900/50">
                <form id="period-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-3xl mx-auto">
                    <div className="grid grid-cols-1 gap-y-5">
                        <div>
                            <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Lapso Académico *</label>
                            <div className={`flex items-center rounded-lg border ${errors.year || errors.periodoTipo ? 'border-red-500' : 'border-gray-300 dark:border-gray-700'} bg-white dark:bg-gray-800`}>
                                <div className="relative w-full border-r border-gray-300 dark:border-gray-700">
                                    <select
                                        disabled={isCulminado || isInCurso}
                                        {...register('year')}
                                        className="w-full appearance-none bg-transparent py-2.5 pl-4 pr-10 text-sm text-gray-800 outline-none dark:text-white"
                                    >
                                        <option value="" disabled className="bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">Seleccione Año</option>
                                        {yearOptions.map(option => (
                                            <option key={option} value={option} className="bg-white dark:bg-gray-800 text-black dark:text-white">{option}</option>
                                        ))}
                                    </select>
                                    <span className="absolute top-1/2 right-3 -translate-y-1/2 pointer-events-none text-gray-500 dark:text-gray-400">
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </span>
                                </div>

                                <div className="relative w-28">
                                    <select
                                        disabled={isCulminado || isInCurso}
                                        {...register('periodoTipo')}
                                        className="w-full appearance-none bg-transparent py-2.5 pl-4 pr-10 text-sm text-gray-800 outline-none dark:text-white text-center font-medium"
                                    >
                                        <option value="I" className="bg-white dark:bg-gray-800 text-black dark:text-white font-medium">I</option>
                                        <option value="II" className="bg-white dark:bg-gray-800 text-black dark:text-white font-medium">II</option>
                                    </select>
                                    <span className="absolute top-1/2 right-3 -translate-y-1/2 pointer-events-none text-gray-500 dark:text-gray-400">
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </span>
                                </div>
                            </div>
                            {(errors.year || errors.periodoTipo) && <p className="mt-1 text-xs text-red-500">{errors.year?.message || errors.periodoTipo?.message}</p>}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Fecha de Inicio *</label>
                                <Controller
                                    control={control}
                                    name="startDate"
                                    render={({ field }) => (
                                        <FlatpickrDatePicker
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
                                                minDate: minNewPeriodStartDate,
                                                disable: disabledDateRanges,
                                            }}
                                            error={!!errors.startDate}
                                            placeholder="Selecciona fecha"
                                        />
                                    )}
                                />
                                {errors.startDate && <p className="mt-1 text-xs text-red-500">{errors.startDate.message}</p>}
                            </div>

                            <div>
                                <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Fecha de Fin *</label>
                                <Controller
                                    control={control}
                                    name="endDate"
                                    render={({ field }) => (
                                        <FlatpickrDatePicker
                                            disabled={isCulminado}
                                            value={field.value ?? ''}
                                            onChange={(dates) => field.onChange(dates[0])}
                                            options={{
                                                minDate: minEndDate,
                                                disable: disabledDateRanges,
                                            }}
                                            error={!!errors.endDate}
                                            placeholder="Selecciona fecha"
                                        />
                                    )}
                                />
                                {errors.endDate && <p className="mt-1 text-xs text-red-500">{errors.endDate.message}</p>}
                            </div>
                        </div>
                    </div>
                </form>
            </ModalBody>

            <ModalFooter className="shrink-0 px-6 sm:px-12 py-6 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
                <div className="flex flex-col sm:flex-row items-center justify-end gap-3 w-full max-w-4xl mx-auto">
                    <Button variant="outline" onClick={onClose} disabled={isLoading} className="w-full sm:w-auto min-h-12">
                        Cancelar
                    </Button>
                    <Button type="submit" form="period-form" loading={isLoading} className="w-full sm:w-auto min-h-12">
                        {periodo ? 'Actualizar Registro' : 'Guardar Período'}
                    </Button>
                </div>
            </ModalFooter>
        </Modal>
    );
}
