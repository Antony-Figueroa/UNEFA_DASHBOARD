/**
 * @file Modal para la creación y edición de períodos académicos.
 * @description Este componente presenta un formulario dentro de un modal, utilizando
 * `react-flatpickr` para una selección de fechas estilizada y consistente.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Periodo, CreatePeriodPayload, UpdatePeriodPayload, PeriodTypeDate } from '../types';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../../components/ui/modal';
import FlatpickrDatePicker from '../../../components/form/FlatpickrDatePicker';
import Button from '../../../components/ui/button/Button';
import AsyncButton from '../../../components/ui/button/AsyncButton';
import { getPeriodSchema, PeriodFormData, getLapsoValue } from '../utils/periodValidations';
import { useUnsavedChanges } from '../../../hooks/useUnsavedChanges';
import UnifiedDialog from '../../../components/ui/dialog/UnifiedDialog';
import { SYSTEM_DIALOGS } from '../../../components/ui/dialog/DialogConfig';
import apiClient from '../../../api/apiClient';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';


/**
 * Propiedades del componente PeriodModal.
 */
interface PeriodModalProps {
    /** Indica si el modal está visible */
    isOpen: boolean;
    /** Función para cerrar el modal */
    onClose: () => void;
    /** Función para guardar los cambios (creación o actualización) */
    onSave: (payload: CreatePeriodPayload | UpdatePeriodPayload) => Promise<void> | void;
    /** Periodo a editar (null para creación) */
    periodo: Periodo | null;
    /** Indica si hay una operación de guardado en curso */
    isLoading?: boolean;
    /** Lista de periodos existentes para validaciones de solapamiento y secuencia */
    existingPeriods: Periodo[];
    /** Función para guardar fechas personalizadas por tipo de pasantía */
    onSaveTypeDates?: (periodId: number, typeDates: Omit<PeriodTypeDate, 'id' | 'createdAt' | 'updatedAt'>[]) => Promise<void>;
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
    existingPeriods,
    onSaveTypeDates
}: PeriodModalProps) {
    const { register, handleSubmit, formState: { errors, isDirty, isValid }, control, reset, watch, setValue } = useForm<PeriodFormData>({
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

    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [pendingData, setPendingData] = useState<PeriodFormData | null>(null);

    const {
        showConfirmation,
        handleCloseAttempt,
        confirmClose,
        cancelClose,
    } = useUnsavedChanges(isDirty, onClose);

    const isCulminado = periodo?.periodStatus === 3;
    const isInCurso = periodo?.periodStatus === 2;

    // Calcular duración en semanas para mostrar información
    const durationWeeks = useMemo(() => {
        if (!startDateValue || !watch('endDate')) return null;
        const start = new Date(startDateValue).getTime();
        const end = new Date(watch('endDate')!).getTime();
        const diffWeeks = (end - start) / (7 * 24 * 60 * 60 * 1000);
        return Math.round(diffWeeks * 10) / 10;
    }, [startDateValue, watch('endDate')]);

    // Ref para evitar que los efectos de sincronización interfieran con la inicialización
    const isInitializing = useRef(false);

    // --- Type Dates Accordion State ---
    const [accordionOpen, setAccordionOpen] = useState(false);
    const [internshipTypes, setInternshipTypes] = useState<Array<{ id: number; name: string }>>([]);
    const [typeDatesState, setTypeDatesState] = useState<Record<number, { startDate: string | null; endDate: string | null }>>({});
    const [coverageWarnings, setCoverageWarnings] = useState<string[]>([]);
    const [editingTypeDates, setEditingTypeDates] = useState(false);

    // Flatpickr onChange altInput returns d/m/Y. Convert to Y-m-d for storage so value sync setDate(Y-m-d) works.
    const toYmd = (str: string): string => {
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
            const [d, m, y] = str.split('/');
            return `${y}-${m}-${d}`;
        }
        return str;
    };

    // Fetch internship types and initialize type dates
    useEffect(() => {
        if (!isOpen) {
            setInternshipTypes([]);
            setTypeDatesState({});
            setCoverageWarnings([]);
            setAccordionOpen(false);
            setEditingTypeDates(false);
            return;
        }

        const fetchTypes = async () => {
            try {
                const response = await apiClient.get<Array<{ INTERNSHIP_TYPE_ID?: number; id?: number; NAME?: string; name?: string }>>('/internship-types');
                const types = response.data.map(dto => ({
                    id: dto.INTERNSHIP_TYPE_ID ?? dto.id ?? 0,
                    name: dto.NAME ?? dto.name ?? '',
                })).filter(t => t.id > 0);
                setInternshipTypes(types);

                // Initialize type dates from existing periodo data
                const initial: Record<number, { startDate: string | null; endDate: string | null }> = {};
                if (periodo?.typeDates && periodo.typeDates.length > 0) {
                    for (const td of periodo.typeDates) {
                        initial[td.internshipTypeId] = {
                            startDate: td.startDate ?? null,
                            endDate: td.endDate ?? null,
                        };
                    }
                }
                setTypeDatesState(initial);

                // Determine coverage warnings: types NOT in initial (no custom dates)
                const coveredTypeIds = new Set(types.filter(t => initial[t.id] !== undefined).map(t => t.id));
                const uncovered = types.filter(t => !coveredTypeIds.has(t.id));
                setCoverageWarnings(uncovered.map(t => t.name));
            } catch (error) {
                console.error('[PeriodModal] Error al cargar tipos de pasantía:', error);
            }
        };

        fetchTypes();
    }, [isOpen, periodo]);

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
        
        let calculatedMinDate: Date | undefined;

        if (existingPeriods.length === 0) {
            // Primer período del sistema — permitir fecha retroactiva para carga inicial
            calculatedMinDate = undefined;
        } else if (otherPeriods.length === 0) {
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
        if (calculatedMinDate !== undefined) {
            if (!periodo && calculatedMinDate < today) {
                calculatedMinDate = today;
            }

            // RESTRICCIÓN CRÍTICA: La fecha mínima no puede ser inferior al inicio del año seleccionado
            // EXCEPCIÓN: Si estamos editando un periodo que ya empieza antes de ese año, permitimos su fecha original
            if (minYearDate && calculatedMinDate < minYearDate) {
                if (periodo && periodo.startDate < minYearDate) {
                    // Si la fecha del periodo es aún menor que calculatedMinDate, usamos la del periodo
                    return periodo.startDate < calculatedMinDate ? periodo.startDate : calculatedMinDate;
                }
                return minYearDate;
            }

            // Si estamos editando, asegurarnos de que la fecha mínima no sea mayor a la fecha actual del periodo
            if (periodo && periodo.startDate < calculatedMinDate) {
                return periodo.startDate;
            }
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
        const calculatedMinDate = new Date(startDateValue.getTime() + minDuration);
        calculatedMinDate.setHours(0, 0, 0, 0);

        // Si estamos editando, permitir la fecha de fin actual si es menor a la mínima de 16 semanas
        if (periodo && periodo.endDate < calculatedMinDate) {
            return periodo.endDate;
        }

        return calculatedMinDate;
    }, [startDateValue, periodo]);

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
     * No debe ejecutarse durante la inicialización para evitar sobrescribir los valores sugeridos.
     * Solo se ejecuta cuando se está creando un nuevo período (no editando).
     */
    useEffect(() => {
        // Solo ejecutar si hay un año seleccionado Y es un NUEVO período (periodo es null/undefined)
        // Y no estamos en inicialización
        if (!isOpen || periodo !== null || !yearValue || isInitializing.current) return;

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
    }, [yearValue, isOpen, periodo, minNewPeriodStartDate, setValue]); // Removed watch to avoid unnecessary re-runs

    /**
     * Efecto para limpiar el formulario cuando el modal se cierra.
     * Esto asegura que la próxima vez que se abra no haya residuos del estado anterior.
     */
    useEffect(() => {
        if (!isOpen) {
            reset({
                year: '',
                periodoTipo: '1',
                startDate: undefined,
                endDate: undefined,
            });
        }
    }, [isOpen, reset]);

    /**
     * Efecto para inicializar o resetear el formulario cuando el modal se abre.
     * Solo se ejecuta cuando isOpen es true Y hay un periodo definido (modo edición).
     */
    useEffect(() => {
        // Solo ejecutar cuando el modal está abierto Y hay un periodo para editar
        if (!isOpen) return;
        
        // Si no hay periodo, no hacer nada (esperar a que el usuario seleccione año)
        // El autocompletado para nuevo periodo se maneja en el useEffect de más abajo
        if (!periodo) return;
        
        isInitializing.current = true;
        
        // Dividir el lapse existing (ej: "1-2025") en año y tipo
        const [tipo, year] = periodo.description.split('-');
        const inicio = periodo.startDate; 
        const fin = periodo.endDate;     
        
        reset({
            year: year,
            periodoTipo: tipo as '1' | '2',
            startDate: !isNaN(inicio.getTime()) ? inicio : undefined,
            endDate: !isNaN(fin.getTime()) ? fin : undefined,
        });
        
        // Finalizar inicialización después de un breve delay
        setTimeout(() => {
            isInitializing.current = false;
        }, 100);
    }, [isOpen, periodo]); // Solo depender de isOpen y periodo, no de reset
    
    /**
     * Efecto separado para autocompletar cuando se crea un NUEVO período.
     * Se ejecuta cuando no hay periodo (creación) y el usuario selecciona un año.
     */
    useEffect(() => {
        // Solo para nuevo periodo (periodo es null/undefined) y cuando el modal está abierto
        if (!isOpen || periodo) return;
        
        isInitializing.current = true;
        
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
            dayAfterLastEnd.setHours(0, 0, 0, 0); 
            autoStartDate = dayAfterLastEnd;

            if (autoStartDate.getFullYear() < parseInt(nextYear)) {
                autoStartDate = new Date(parseInt(nextYear), 0, 1);
            }
        }

        const initialValues = {
            year: nextYear,
            periodoTipo: nextPeriodoTipo,
            startDate: autoStartDate,
            endDate: autoStartDate ? new Date(autoStartDate.getTime() + (16 * 7 * 24 * 60 * 60 * 1000)) : undefined,
        };

        reset(initialValues);

        if (initialValues.startDate) {
            setValue('startDate', initialValues.startDate, { shouldValidate: true });
        }
        if (initialValues.endDate) {
            setValue('endDate', initialValues.endDate, { shouldValidate: true });
        }
        
        // Finalizar inicialización después de un breve delay
        setTimeout(() => {
            isInitializing.current = false;
        }, 100);
    }, [isOpen, existingPeriods, reset, setValue]);

    /**
     * Maneja el envío del formulario, valida las fechas y llama a la función onSave.
     */
    const onSubmit: SubmitHandler<PeriodFormData> = (data) => {
        setPendingData(data);
        setShowConfirmDialog(true);
    };

    const handleConfirmSave = async () => {
        if (!pendingData) return;
        const data = pendingData;
        
        try {
            let newDescription = `${data.periodoTipo}-${data.year}`;
            let startDateToUse = data.startDate;

            if (periodo && isInCurso) {
                newDescription = periodo.description;
                startDateToUse = periodo.startDate;
            }

            if (periodo) {
                // --- Validate type dates within parent period range ---
                const typeNameMap = new Map(internshipTypes.map(t => [t.id, t.name]));
                const typeDatesEntries = Object.entries(typeDatesState);
                for (const [typeIdStr, dates] of typeDatesEntries) {
                    const typeName = typeNameMap.get(parseInt(typeIdStr)) || `Tipo #${typeIdStr}`;
                    
                    // Parse Y-m-d strings to local-noon dates for consistent comparison
                    const parseYmd = (str: string): Date => {
                        const [y, m, d] = str.split('-').map(Number);
                        return new Date(y, m - 1, d, 12, 0, 0);
                    };

                    if (dates.startDate) {
                        const start = parseYmd(dates.startDate);
                        if (start.getTime() < periodo.startDate.getTime()) {
                            throw new Error(`${typeName}: la fecha de inicio es anterior al inicio del periodo`);
                        }
                    }
                    if (dates.endDate) {
                        const end = parseYmd(dates.endDate);
                        if (end.getTime() > periodo.endDate.getTime()) {
                            throw new Error(`${typeName}: la fecha de fin es posterior al fin del periodo`);
                        }
                    }
                    if (dates.startDate && dates.endDate) {
                        const start = parseYmd(dates.startDate);
                        const end = parseYmd(dates.endDate);
                        if (start.getTime() > end.getTime()) {
                            throw new Error(`${typeName}: la fecha de inicio no puede ser posterior a la fecha de fin`);
                        }
                    }
                }

                const updatePayload: UpdatePeriodPayload = {
                    periodId: periodo.periodId,
                    code: newDescription,
                    description: newDescription,
                    startDate: startDateToUse,
                    endDate: data.endDate,
                    periodStatus: periodo.periodStatus,
                    status: periodo.status,
                };
                await onSave(updatePayload);
                
                // Save type dates after period update
                if (onSaveTypeDates && typeDatesEntries.length > 0) {
                    await onSaveTypeDates(
                        parseInt(periodo.periodId),
                        typeDatesEntries.map(([typeId, dates]) => ({
                            periodId: parseInt(periodo.periodId),
                            internshipTypeId: parseInt(typeId),
                            startDate: dates.startDate,
                            endDate: dates.endDate,
                        }))
                    );
                }
            } else {
                const createPayload: CreatePeriodPayload = {
                    code: newDescription,
                    description: newDescription,
                    startDate: startDateToUse,
                    endDate: data.endDate,
                    periodStatus: 1, // Pendiente por defecto
                    status: true,
                };
                await onSave(createPayload);
                
                // Type dates for new periods are handled after creation (periodId known)
                // The parent should call onSaveTypeDates after the period is created
            }
        } catch (error) {
            console.error("[PeriodModal] Error al procesar el envío del formulario:", error);
        }
        setShowConfirmDialog(false);
        setPendingData(null);
    };

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} onCloseAttempt={handleCloseAttempt} showCloseButton>
                <ModalHeader className="shrink-0 pt-8 px-6 sm:px-12">
                <div className="max-w-3xl mx-auto w-full">
                    <span className="text-xl font-bold text-text-primary dark:text-white/90">
                        {periodo ? 'Editar Período' : 'Registrar Período'}
                    </span>
                    <p className="mt-1 text-sm text-text-secondary dark:text-text-tertiary font-normal">
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
                                <label className="text-sm font-medium text-text-primary dark:text-white/90">Fecha de Inicio *</label>
                                <div className="relative">
                                    <Controller
                                        control={control}
                                        name="startDate"
                                        render={({ field }) => (
                                            <FlatpickrDatePicker
                                                disabled={isCulminado || isInCurso}
                                                value={field.value ?? ''}
                                                onChange={(dateStr) => {
                                                    // Parsear fecha desde formato dd/mm/yyyy
                                                    const parseDate = (str: string): Date | null => {
                                                        if (!str) return null;
                                                        const parts = str.split('/');
                                                        if (parts.length !== 3) return null;
                                                        const day = parseInt(parts[0], 10);
                                                        const month = parseInt(parts[1], 10) - 1;
                                                        const year = parseInt(parts[2], 10);
                                                        if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
                                                        // Crear fecha en hora local del mediodía para evitar problemas de timezone
                                                        return new Date(year, month, day, 12, 0, 0);
                                                    };
                                                    const date = parseDate(dateStr);
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
                                <label className="text-sm font-medium text-text-primary dark:text-white/90">Fecha de Fin *</label>
                                <div className="relative">
                                    <Controller
                                        control={control}
                                        name="endDate"
                                        render={({ field }) => (
                                            <FlatpickrDatePicker
                                                disabled={isCulminado}
                                                value={field.value ?? ''}
                                                onChange={(dateStr) => {
                                                    // Parsear fecha desde formato dd/mm/yyyy
                                                    const parseDate = (str: string): Date | null => {
                                                        if (!str) return null;
                                                        const parts = str.split('/');
                                                        if (parts.length !== 3) return null;
                                                        const day = parseInt(parts[0], 10);
                                                        const month = parseInt(parts[1], 10) - 1;
                                                        const year = parseInt(parts[2], 10);
                                                        if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
                                                        // Crear fecha en hora local del mediodía para evitar problemas de timezone
                                                        return new Date(year, month, day, 12, 0, 0);
                                                    };
                                                    field.onChange(parseDate(dateStr));
                                                }}
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
                                {durationWeeks !== null && (
                                    <p className={`mt-1 text-xs font-medium ${durationWeeks >= 16 ? 'text-green-600' : 'text-orange-500'}`}>
                                        {durationWeeks < 16 
                                            ? `⚠️ Faltan ${(16 - durationWeeks).toFixed(1)} semanas para completar el mínimo`
                                            : `Duración: ${durationWeeks} semanas`
                                        }
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Accordion: Fechas por tipo */}
                    {internshipTypes.length > 0 && (
                        <div className="mt-6 border border-border-light dark:border-border-dark rounded-lg overflow-hidden">
                            <button
                                type="button"
                                onClick={() => setAccordionOpen(!accordionOpen)}
                                className="w-full flex items-center justify-between px-4 py-3 bg-bg-secondary/30 dark:bg-white/5 hover:bg-bg-secondary/50 dark:hover:bg-white/10 transition-colors text-left"
                            >
                                <span className="text-sm font-medium text-text-primary dark:text-white/90">
                                    Fechas por tipo
                                </span>
                                {accordionOpen ? (
                                    <ChevronUp className="w-4 h-4 text-text-secondary" />
                                ) : (
                                    <ChevronDown className="w-4 h-4 text-text-secondary" />
                                )}
                            </button>
                            <AnimatePresence initial={false}>
                                {accordionOpen && (
                                    <motion.div
                                        key="type-dates-accordion"
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="px-4 pb-4 pt-2 space-y-4">
                                            {internshipTypes.map((type) => {
                                                const td = typeDatesState[type.id];
                                                return (
                                                    <div key={type.id} className="p-3 rounded-lg bg-bg-secondary/20 dark:bg-white/5 border border-border-light dark:border-border-dark">
                                                        <p className="text-xs font-semibold text-text-primary dark:text-white/90 uppercase tracking-wider mb-2">
                                                            {type.name}
                                                        </p>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                            <div>
                                                                <label className="text-[11px] font-medium text-text-tertiary mb-1 block">
                                                                    Fecha de Inicio
                                                                </label>
                                                                <FlatpickrDatePicker
                                                                    value={td?.startDate ?? ''}
                                                                    onChange={(dateStr) => {
                                                                        setTypeDatesState(prev => ({
                                                                            ...prev,
                                                                            [type.id]: {
                                                                                ...prev[type.id],
                                                                                startDate: toYmd(dateStr) || null,
                                                                                endDate: prev[type.id]?.endDate ?? null,
                                                                            },
                                                                        }));
                                                                    }}
                                                                    options={{
                                                                        minDate: periodo?.startDate ? new Date(periodo.startDate.getTime() - 86400000) : undefined,
                                                                        maxDate: periodo?.endDate ? new Date(periodo.endDate.getTime() + 86400000) : undefined,
                                                                    }}
                                                                    placeholder="dd/mm/aaaa"
                                                                />
                                                             </div>
                                                             <div>
                                                                 <label className="text-[11px] font-medium text-text-tertiary mb-1 block">
                                                                     Fecha de Fin
                                                                 </label>
                                                                <FlatpickrDatePicker
                                                                    value={td?.endDate ?? ''}
                                                                    onChange={(dateStr) => {
                                                                        setTypeDatesState(prev => ({
                                                                            ...prev,
                                                                            [type.id]: {
                                                                                ...prev[type.id],
                                                                                startDate: prev[type.id]?.startDate ?? null,
                                                                                endDate: toYmd(dateStr) || null,
                                                                            },
                                                                        }));
                                                                    }}
                                                                     options={{
                                                                        minDate: periodo?.startDate ? new Date(periodo.startDate.getTime() - 86400000) : undefined,
                                                                        maxDate: periodo?.endDate ? new Date(periodo.endDate.getTime() + 86400000) : undefined,
                                                                    }}
                                                                    placeholder="dd/mm/aaaa"
                                                                 />
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}

                                            {/* Coverage warning */}
                                            {coverageWarnings.length > 0 && (
                                                <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                                                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                                                    <div>
                                                        <p className="text-xs font-medium text-amber-700 dark:text-amber-300">
                                                            Tipos sin fechas personalizadas
                                                        </p>
                                                        <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">
                                                            {coverageWarnings.join(', ')} — se usarán las fechas del periodo padre.
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}

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
                        disabled={!isValid || (periodo ? !isDirty : false)}
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
            {...SYSTEM_DIALOGS.closeWithoutSaving}
        />

        <UnifiedDialog
            isOpen={showConfirmDialog}
            onClose={() => {
                setShowConfirmDialog(false);
                setPendingData(null);
            }}
            onConfirm={handleConfirmSave}
            title={periodo ? "Actualizar Período" : "Registrar Período"}
            message={`¿Estás seguro de que deseas ${periodo ? 'actualizar' : 'registrar'} este período académico?`}
            variant="confirm"
            confirmLabel={periodo ? "Actualizar" : "Registrar"}
            isLoading={isLoading}
        />
    </>
);
}
