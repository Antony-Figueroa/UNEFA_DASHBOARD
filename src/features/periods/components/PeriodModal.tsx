/**
 * @file Modal para la creación y edición de períodos académicos.
 * @description Este componente presenta un formulario dentro de un modal, utilizando
 * `react-flatpickr` para una selección de fechas estilizada y consistente.
 */

import { useEffect, useMemo } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Periodo } from '../types';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../../components/ui/modal';
import FlatpickrDatePicker from '../../../components/form/FlatpickrDatePicker';
import Button from '../../../components/ui/button/Button';
import { getPeriodSchema, PeriodFormData, getLapsoValue } from '../utils/periodValidations';
import { useUnsavedChanges } from '../../../hooks/useUnsavedChanges';
import UnifiedDialog from '../../../components/ui/dialog/UnifiedDialog';

interface PeriodModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (periodo: Omit<Periodo, "periodId" | "creationDate"> | Periodo) => void;
    periodo: Periodo | null;
    isLoading?: boolean;
    existingPeriods: Periodo[];
}

export default function PeriodModal({ isOpen, onClose, onSave, periodo, isLoading = false, existingPeriods }: PeriodModalProps) {
    const { register, handleSubmit, formState: { errors, isDirty }, control, reset, watch, setValue } = useForm<PeriodFormData>({
        resolver: zodResolver(getPeriodSchema(existingPeriods, periodo?.periodId || undefined, !!periodo)),
        mode: 'onChange',
        defaultValues: {
            year: '',
            periodoTipo: '1',
        },
    });

    const {
        showConfirmation,
        handleCloseAttempt,
        confirmClose,
        cancelClose,
    } = useUnsavedChanges(isDirty, onClose);
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

    // Obtener valores actuales para reactividad
    const yearValue = watch('year');

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
        let newDescription = `${data.periodoTipo}-${data.year}`;
        let startDateToUse = data.startDate;

        if (periodo && isInCurso) {
            newDescription = periodo.description;
            startDateToUse = periodo.startDate;
        }

        const periodoData = {
            ...(periodo && { periodId: periodo.periodId }),
            code: newDescription,
            description: newDescription,
            startDate: startDateToUse,
            endDate: data.endDate,
            periodStatus: periodo?.periodStatus || 1,
            status: periodo?.status ?? true
        };

        onSave(periodoData);
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
                            <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Lapso Académico *</label>
                            <div className={`flex flex-row items-center rounded-lg border ${errors.year || errors.periodoTipo ? 'border-red-500' : 'border-border-light dark:border-border-dark'} bg-white dark:bg-bg-dark overflow-hidden`}>
                                <div className="relative w-20 sm:w-28 bg-bg-secondary/10 dark:bg-white/5 border-r border-border-light dark:border-border-dark">
                                    <select
                                        {...register('periodoTipo')}
                                        disabled={isCulminado || isInCurso}
                                        className="w-full appearance-none bg-transparent py-2.5 pl-4 pr-10 text-sm text-text-primary outline-none dark:text-white font-medium"
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
                                        disabled={isCulminado || isInCurso}
                                        className="w-full appearance-none bg-transparent py-2.5 pl-4 pr-10 text-sm text-text-primary outline-none dark:text-white"
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
                    <Button type="submit" form="period-form" loading={isLoading} className="w-full sm:w-auto min-h-12">
                        {periodo ? 'Actualizar Registro' : 'Guardar Período'}
                    </Button>
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
