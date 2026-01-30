/**
 * @file Modal para la creación y edición de períodos académicos.
 * @description Este componente presenta un formulario dentro de un modal, utilizando
 * `react-flatpickr` para una selección de fechas estilizada y consistente.
 */

import { useEffect, useMemo } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Periodo, CreatePeriodPayload, UpdatePeriodPayload } from '../types';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../../components/ui/modal';
import FlatpickrDatePicker from '../../../components/form/FlatpickrDatePicker';
import Button from '../../../components/ui/button/Button';
import AsyncButton from '../../../components/ui/button/AsyncButton';
import { getPeriodSchema, PeriodFormData, getLapsoValue } from '../utils/periodValidations';
import { useUnsavedChanges } from '../../../hooks/useUnsavedChanges';
import UnifiedDialog from '../../../components/ui/dialog/UnifiedDialog';

/**
 * Propiedades del componente PeriodModal.
 */
interface PeriodModalProps {
    /** Indica si el modal está visible */
    isOpen: boolean;
    /** Función para cerrar el modal */
    onClose: () => void;
    /** Función para guardar los cambios (creación o actualización) */
    onSave: (payload: CreatePeriodPayload | UpdatePeriodPayload) => void;
    /** Periodo a editar (null para creación) */
    periodo: Periodo | null;
    /** Indica si hay una operación de guardado en curso */
    isLoading?: boolean;
    /** Lista de periodos existentes para validaciones de solapamiento y secuencia */
    existingPeriods: Periodo[];
}

/**
 * Componente modal para la creación y edición de periodos académicos.
 * 
 * Utiliza react-hook-form con validación Zod para asegurar la integridad de los datos.
 * Incluye lógica para autocompletar el siguiente periodo lógico y prevenir solapamientos.
 * 
 * @param props - Propiedades del componente.
 */
export default function PeriodModal({ 
    isOpen, 
    onClose, 
    onSave, 
    periodo, 
    isLoading = false, 
    existingPeriods 
}: PeriodModalProps) {
    const { register, handleSubmit, formState: { errors, isDirty }, control, reset, watch, setValue } = useForm<PeriodFormData>({
        resolver: zodResolver(getPeriodSchema(existingPeriods, periodo?.periodId || undefined, !!periodo)),
        mode: 'onChange',
        defaultValues: {
            year: '',
            periodoTipo: '1',
        },
    });

    // Obtener valores actuales para reactividad al inicio para evitar ReferenceError en useMemo
    const yearValue = watch('year');
    const startDateValue = watch('startDate');

    const {
        showConfirmation,
        handleCloseAttempt,
        confirmClose,
        cancelClose,
    } = useUnsavedChanges(isDirty, onClose);

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
     * Debe ser el día después del último periodo O hoy, lo que sea posterior.
     * ADEMÁS, debe estar dentro del año seleccionado en el selector.
     */
    const minNewPeriodStartDate = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 1. Obtener el primer día del año seleccionado
        let minYearDate: Date | undefined = undefined;
        if (yearValue) {
            minYearDate = new Date(parseInt(yearValue), 0, 1);
            minYearDate.setHours(0, 0, 0, 0);
        }

        // Si el periodo está en curso o culminado, el campo ya está deshabilitado
        // Si es pendiente, permitimos cambiar la fecha pero respetando el orden cronológico
        
        // Encontrar el periodo anterior al actual
        const otherPeriods = existingPeriods.filter(p => p.periodId !== periodo?.periodId);
        
        let calculatedMinDate: Date;

        if (otherPeriods.length === 0) {
            calculatedMinDate = today;
        } else {
            // Ordenar por lapso para encontrar el anterior al actual
            const sortedOthers = [...otherPeriods].sort((a, b) => getLapsoValue(b.description) - getLapsoValue(a.description));
            
            let previousPeriod;
            if (periodo) {
                const currentVal = getLapsoValue(periodo.description);
                previousPeriod = sortedOthers.find(p => getLapsoValue(p.description) < currentVal);
            } else {
                previousPeriod = sortedOthers[0];
            }

            if (!previousPeriod) {
                calculatedMinDate = today;
            } else {
                const dayAfter = new Date(previousPeriod.endDate);
                dayAfter.setDate(dayAfter.getDate() + 1);
                dayAfter.setHours(0, 0, 0, 0);
                calculatedMinDate = dayAfter;
            }
        }

        // Para nuevos periodos, no permitir fechas pasadas respecto a hoy
        if (!periodo && calculatedMinDate < today) {
            calculatedMinDate = today;
        }

        // RESTRICCIÓN CRÍTICA: La fecha mínima no puede ser inferior al inicio del año seleccionado
        if (minYearDate && calculatedMinDate < minYearDate) {
            return minYearDate;
        }

        return calculatedMinDate;
    }, [existingPeriods, periodo, yearValue]);

    /**
     * Calcula la fecha máxima de inicio permitida (fin del año seleccionado).
     */
    const maxStartDate = useMemo(() => {
        if (!yearValue) return undefined;
        return new Date(parseInt(yearValue), 11, 31);
    }, [yearValue]);

    /**
     * Calcula la fecha mínima de fin permitida (16 semanas después de la fecha de inicio).
     */
    const minEndDate = useMemo(() => {
        if (!startDateValue) return undefined;
        // 16 semanas * 7 días * 24 horas * 60 min * 60 seg * 1000 ms
        const minDuration = 16 * 7 * 24 * 60 * 60 * 1000;
        const minDate = new Date(startDateValue.getTime() + minDuration);
        minDate.setHours(0, 0, 0, 0);
        return minDate;
    }, [startDateValue]);

    /**
     * Calcula la fecha máxima de fin permitida (fin del año siguiente al seleccionado).
     */
    const maxEndDate = useMemo(() => {
        if (!yearValue) return undefined;
        return new Date(parseInt(yearValue) + 1, 11, 31);
    }, [yearValue]);

    /**
     * Genera las opciones para el selector de AÑO.
     * Se memoiza con `useMemo` para evitar que se recalcule en cada render.
     */
    const yearOptions = useMemo(() => {
        const currentYear = new Date().getFullYear();
        const optionsSet = new Set<string>();

        // Años desde el actual + 5
        for (let i = 0; i <= 5; i++) {
            optionsSet.add(`${currentYear + i}`);
        }

        // Asegurar que el año del periodo que se está editando esté presente
        if (periodo) {
            const [, year] = periodo.description.split('-');
            if (year) optionsSet.add(year);
        }

        // Asegurar que los años de los periodos existentes estén presentes
        existingPeriods.forEach(p => {
            const [, year] = p.description.split('-');
            if (year) optionsSet.add(year);
        });

        return Array.from(optionsSet).sort((a, b) => parseInt(a) - parseInt(b));
    }, [periodo, existingPeriods]);

    /**
     * Efecto para sincronizar el año del calendario cuando cambia el selector de año.
     */
    useEffect(() => {
        if (!isOpen || periodo || !yearValue) return;

        const selectedYearNum = parseInt(yearValue);
        if (isNaN(selectedYearNum)) return;

        const currentStartDate = watch('startDate');
        
        // Si no hay fecha o el año de la fecha actual no coincide con el seleccionado
        if (!currentStartDate || currentStartDate.getFullYear() !== selectedYearNum) {
            // Crear una nueva fecha para el 1 de enero del año seleccionado (o la fecha mínima disponible)
            const newDate = new Date(selectedYearNum, 0, 1);
            
            // Si la fecha mínima disponible es mayor al 1 de enero, usar la mínima
            if (minNewPeriodStartDate instanceof Date && newDate < minNewPeriodStartDate) {
                // Solo si el año coincide, si no, forzamos el 1 de enero de ese año
                if (minNewPeriodStartDate.getFullYear() === selectedYearNum) {
                    setValue('startDate', minNewPeriodStartDate, { shouldValidate: true });
                } else {
                    setValue('startDate', newDate, { shouldValidate: true });
                }
            } else {
                setValue('startDate', newDate, { shouldValidate: true });
            }
        }
    }, [yearValue, isOpen, periodo, minNewPeriodStartDate, setValue, watch]);

    /**
     * Efecto para inicializar o resetear el formulario cuando el modal se abre.
     */
    useEffect(() => {
        if (isOpen) {
            if (periodo) {
                // Dividir el lapso existente (ej: "1-2025") en año y tipo
                const [tipo, year] = periodo.description.split('-');
                const inicio = periodo.startDate; // Ya es un objeto Date gracias al servicio
                const fin = periodo.endDate;     // Ya es un objeto Date gracias al servicio
                reset({
                    year: year,
                    periodoTipo: tipo as '1' | '2',
                    startDate: !isNaN(inicio.getTime()) ? inicio : undefined,
                    endDate: !isNaN(fin.getTime()) ? fin : undefined,
                });
            } else {
                // --- Autocompletado para un nuevo periodo ---
                let nextYear = new Date().getFullYear().toString();
                let nextPeriodoTipo: '1' | '2' = '1';
                let autoStartDate: Date | undefined = undefined;

                if (existingPeriods.length > 0) {
                    const lastPeriod = [...existingPeriods].sort((a, b) => getLapsoValue(b.description) - getLapsoValue(a.description))[0];
                    const [lastTipo, lastYearStr] = lastPeriod.description.split('-');
                    const lastYearNum = parseInt(lastYearStr);

                    if (!isNaN(lastYearNum)) {
                        if (lastTipo === '1') {
                            nextYear = lastYearStr;
                            nextPeriodoTipo = '2';
                        } else {
                            nextYear = (lastYearNum + 1).toString();
                            nextPeriodoTipo = '1';
                        }
                    }

                    const dayAfterLastEnd = new Date(lastPeriod.endDate);
                    dayAfterLastEnd.setDate(dayAfterLastEnd.getDate() + 1);
                    dayAfterLastEnd.setHours(0, 0, 0, 0); // Normalizar a medianoche
                    autoStartDate = dayAfterLastEnd;
                }

                const initialValues = {
                    year: nextYear,
                    periodoTipo: nextPeriodoTipo,
                    startDate: autoStartDate,
                    endDate: autoStartDate ? new Date(autoStartDate.getTime() + (16 * 7 * 24 * 60 * 60 * 1000)) : undefined,
                };

                reset(initialValues);

                // Forzar la actualización de los campos en el estado de react-hook-form
                // Esto asegura que useMemo y otros observadores vean los valores inmediatamente
                if (initialValues.startDate) {
                    setValue('startDate', initialValues.startDate, { shouldValidate: true });
                }
                if (initialValues.endDate) {
                    setValue('endDate', initialValues.endDate, { shouldValidate: true });
                }
            }
        }
    }, [periodo, isOpen, reset, existingPeriods, setValue]);

   /**
    * Maneja el envío del formulario, valida las fechas y llama a la función onSave.
    */
   const onSubmit: SubmitHandler<PeriodFormData> = (data) => {
        try {
            let newDescription = `${data.periodoTipo}-${data.year}`;
            let startDateToUse = data.startDate;

            if (periodo && isInCurso) {
                newDescription = periodo.description;
                startDateToUse = periodo.startDate;
            }

            if (periodo) {
                const updatePayload: UpdatePeriodPayload = {
                    periodId: periodo.periodId,
                    code: newDescription,
                    description: newDescription,
                    startDate: startDateToUse,
                    endDate: data.endDate,
                    periodStatus: periodo.periodStatus,
                    status: periodo.status
                };
                onSave(updatePayload);
            } else {
                const createPayload: CreatePeriodPayload = {
                    code: newDescription,
                    description: newDescription,
                    startDate: startDateToUse,
                    endDate: data.endDate,
                    periodStatus: 1, // Pendiente por defecto
                    status: true
                };
                onSave(createPayload);
            }
        } catch (error) {
            console.error("[PeriodModal] Error al procesar el envío del formulario:", error);
        }
    };

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} onCloseAttempt={handleCloseAttempt} showCloseButton>
                <ModalHeader>
                <div className="max-w-3xl mx-auto w-full">
                    <h5 className="mb-1 font-semibold text-text-primary modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
                        {periodo ? 'Editar Período' : 'Registrar Período'}
                    </h5>
                    <p className="text-sm text-text-secondary dark:text-text-tertiary font-normal">
                        {periodo ? 'Modifica los detalles del período académico.' : 'Ingresa los detalles del nuevo período académico.'}
                    </p>
                </div>
            </ModalHeader>

            <ModalBody className="bg-bg-secondary/30 dark:bg-bg-dark/50">
                <form id="period-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-3xl mx-auto">
                    <div className="grid grid-cols-1 gap-y-5">
                        <div>
                            <div className="flex items-center gap-2 mb-2.5">
                                <label className="block text-black dark:text-white font-medium text-sm">Lapso Académico *</label>
                                {!periodo && existingPeriods.length > 0 && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800 uppercase tracking-wider">
                                        Auto
                                    </span>
                                )}
                            </div>
                            <div className={`flex flex-row items-center rounded-lg border ${errors.year || errors.periodoTipo ? 'border-red-500' : 'border-border-light dark:border-border-dark'} bg-white dark:bg-bg-dark overflow-hidden`}>
                                <div className="relative w-20 sm:w-28 bg-bg-secondary/10 dark:bg-white/5 border-r border-border-light dark:border-border-dark">
                                    <select
                                        {...register('periodoTipo')}
                                        disabled={!!periodo || (!periodo && existingPeriods.length > 0)}
                                        className="w-full appearance-none bg-transparent py-2.5 pl-4 pr-10 text-sm text-text-primary outline-none dark:text-white font-medium disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        <option value="1" className="bg-white dark:bg-bg-dark text-black dark:text-white font-medium">1</option>
                                        <option value="2" className="bg-white dark:bg-bg-dark text-black dark:text-white font-medium">2</option>
                                    </select>
                                    <span className="absolute top-1/2 right-3 -translate-y-1/2 pointer-events-none text-text-secondary dark:text-text-tertiary">
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </span>
                                </div>

                                <div className="relative flex-1">
                                    <select
                                        {...register('year')}
                                        disabled={!!periodo || (!periodo && existingPeriods.length > 0)}
                                        className="w-full appearance-none bg-transparent py-2.5 pl-4 pr-10 text-sm text-text-primary outline-none dark:text-white disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        <option value="" disabled className="bg-white dark:bg-bg-dark text-text-secondary dark:text-text-tertiary">Seleccione Año</option>
                                        {yearOptions.map(option => (
                                            <option key={option} value={option} className="bg-white dark:bg-bg-dark text-black dark:text-white">{option}</option>
                                        ))}
                                    </select>
                                    <span className="absolute top-1/2 right-3 -translate-y-1/2 pointer-events-none text-text-secondary dark:text-text-tertiary">
                                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </span>
                                </div>
                            </div>
                            {(errors.year || errors.periodoTipo) && <p className="mt-1 text-xs text-red-500">{errors.year?.message || errors.periodoTipo?.message}</p>}
                            <p className="mt-1.5 text-[11px] text-text-tertiary dark:text-gray-400 italic">
                                Ejemplo: 1-2025 (Primer semestre), 2-2025 (Segundo semestre).
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Fecha de Inicio *</label>
                                <div className="relative">
                                    <Controller
                                        control={control}
                                        name="startDate"
                                        render={({ field }) => (
                                            <FlatpickrDatePicker
                                                disabled={isCulminado || isInCurso}
                                                value={field.value ?? ''}
                                                onChange={(dateStr) => {
                                                    const date = dateStr ? new Date(dateStr + 'T00:00:00') : null;
                                                    field.onChange(date);
                                                    if (date) {
                                                        const minDuration = 16 * 7 * 24 * 60 * 60 * 1000;
                                                        const nextMinEndDate = new Date(date.getTime() + minDuration);
                                                        
                                                        // Si no hay fecha de fin o la actual es menor a la nueva mínima de 16 semanas
                                                        const currentEndDate = watch('endDate');
                                                        if (!currentEndDate || currentEndDate < nextMinEndDate) {
                                                            setValue('endDate', nextMinEndDate, { shouldValidate: true });
                                                        }
                                                    }
                                                }}
                                                options={{
                                                    minDate: minNewPeriodStartDate,
                                                    maxDate: maxStartDate,
                                                    disable: disabledDateRanges,
                                                }}
                                                error={!!errors.startDate}
                                                placeholder="Selecciona fecha"
                                            />
                                        )}
                                    />
                                </div>
                                {errors.startDate && <p className="mt-1 text-xs text-red-500">{errors.startDate.message}</p>}
                                <p className="mt-1 text-[10px] text-text-tertiary">Formato: DD/MM/AAAA. Ej: 15/01/2026</p>
                            </div>

                            <div>
                                <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Fecha de Fin *</label>
                                <div className="relative">
                                    <Controller
                                        control={control}
                                        name="endDate"
                                        render={({ field }) => (
                                            <FlatpickrDatePicker
                                                disabled={isCulminado}
                                                value={field.value ?? ''}
                                                onChange={(dateStr) => field.onChange(dateStr ? new Date(dateStr + 'T00:00:00') : null)}
                                                options={{
                                                    minDate: minEndDate,
                                                    maxDate: maxEndDate,
                                                    disable: disabledDateRanges,
                                                }}
                                                error={!!errors.endDate}
                                                placeholder="Selecciona fecha"
                                            />
                                        )}
                                    />
                                </div>
                                {errors.endDate && <p className="mt-1 text-xs text-red-500">{errors.endDate.message}</p>}
                                <p className="mt-1 text-[10px] text-text-tertiary">Duración mín: 16 semanas.</p>
                            </div>
                        </div>
                    </div>
                </form>
            </ModalBody>

            <ModalFooter className="shrink-0 px-6 sm:px-12 py-6 bg-white dark:bg-bg-dark border-t border-border-light dark:border-border-dark">
                <div className="flex flex-col sm:flex-row items-center justify-end gap-3 w-full max-w-4xl mx-auto">
                    <Button variant="outline" onClick={handleCloseAttempt} disabled={isLoading} className="w-full sm:w-auto min-h-12">
                        Cancelar
                    </Button>
                    <AsyncButton 
                        onClick={handleSubmit(onSubmit)} 
                        loading={isLoading} 
                        className="w-full sm:w-auto min-h-12" 
                    >
                        {periodo ? 'Actualizar Registro' : 'Guardar Período'}
                    </AsyncButton>
                </div>
            </ModalFooter>
        </Modal>

        <UnifiedDialog
            isOpen={showConfirmation}
            onClose={cancelClose}
            onConfirm={confirmClose}
            variant="warning"
            title="Cambios no guardados"
            message="¿Estás seguro de que deseas cerrar? Los cambios no guardados se perderán."
            confirmLabel="Cerrar sin guardar"
            cancelLabel="Continuar editando"
        />
    </>
);
}
