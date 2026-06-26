/**
 * @file Modal para el registro y edición de visitas de seguimiento.
 * @description Gestiona la validación de campos, fechas del período académico y confirmación de guardado.
 */

import { useEffect, useState, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../../components/ui/modal';
import AsyncButton from '../../../components/ui/button/AsyncButton';
import CustomSelect from '../../../components/form/CustomSelect';
import TextArea from '../../../components/form/input/TextArea';
import FlatpickrDatePicker from '../../../components/form/FlatpickrDatePicker';
import { Visit, CreateVisitPayload, UpdateVisitPayload, LEGACY_VISIT_TYPES, LEGACY_VISIT_CASES, ListOption } from '../types';
import { useUnsavedChanges } from '../../../hooks/useUnsavedChanges';
import { useToast } from '../../../context/toast';
import UnifiedDialog from '../../../components/ui/dialog/UnifiedDialog';
import { CONFIRM_MESSAGES, SYSTEM_DIALOGS } from '../../../components/ui/dialog/DialogConfig';
import Input from '../../../components/form/input/InputField';
import { SAFE_LONG_TEXT_PATTERN, isSafeInput } from '../../../utils/inputValidation';
import { useTutors } from '../../tutors/hooks/useTutors';
import TutorModal from '../../tutors/components/TutorModal';
import { createTutor } from '../../tutors/services/tutorsService';

import { useLists } from '../../lists/hooks/useLists';
import * as listsService from '../../lists/services/listsService';

const visitSchema = z.object({
  tutorId: z.string().min(1, 'El tutor es requerido'),
  visitDate: z.string().min(1, 'La fecha es requerida'),
  visitType: z.string().min(1, 'El tipo de visita es requerido'),
  visitCase: z.string().min(1, 'El caso de seguimiento es requerido'),
  hoursWorked: z.preprocess(
    (val) => (val === '' || val === null || val === undefined) ? 0 : val,
    z.coerce.number().min(0, 'Las horas deben ser positivas').max(24, 'Máximo 24 horas')
  ),
  activitiesPerformed: z.string()
    .min(10, 'Mínimo 10 caracteres')
    .max(2000, "El texto es demasiado largo")
    .refine(val => isSafeInput(val), { message: "Caracteres no permitidos" })
    .refine(val => {
      // Validar mínimo de 2 palabras significativas
      const words = val.trim().split(/\s+/).filter(w => w.length >= 2);
      return words.length >= 2;
    }, { message: "Debe incluir al menos 2 palabras (no contar caracteres sueltos)" }),
  observations: z.string()
    .max(1000, "Las observaciones son demasiado largas")
    .refine(val => isSafeInput(val), { message: "Caracteres no permitidos" })
    .optional(),
  recommendations: z.string()
    .max(1000, "Las recomendaciones son demasiado largas")
    .refine(val => isSafeInput(val), { message: "Caracteres no permitidos" })
    .optional()
}).refine(
  (data) => {
    // Validación: la fecha no puede ser futura
    const visitDateParsed = new Date(data.visitDate);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return visitDateParsed <= today;
  },
  {
    message: 'La fecha de la visita no puede ser futura',
    path: ['visitDate']
  }
).refine(
  (data) => {
    const d = new Date(data.visitDate);
    const hour = d.getHours();
    // Horario razonable: 6:00 a 22:00
    if (hour < 6 || hour >= 22) return false;
    // No domingos
    if (d.getDay() === 0) return false;
    return true;
  },
  {
    message: 'La visita debe ser en horario laboral (lunes a sábado, 6:00 a 22:00)',
    path: ['visitDate']
  }
).refine(
  (data) => {
    // Validación: observaciones requeridas para casos de problemas
    // Esta validación se hace en el onSubmitForm en lugar del schema
    // porque visitCase ahora es dinámico y depende de las listas
    return true; // Siempre pasa aquí, la validación real está en onSubmitForm
  },
  {
    message: 'Placeholder - no se usa',
    path: ['observations']
  }
);

type VisitFormData = z.infer<typeof visitSchema>;

interface VisitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateVisitPayload | UpdateVisitPayload) => Promise<boolean>;
  visit?: Visit | null;
  practiceId: number;
  tutorId: number;
  loading?: boolean;
  mode?: 'edit' | 'view';
  /** Fecha de inicio del período académico */
  periodStartDate?: Date;
  /** Fecha de fin del período académico */
  periodEndDate?: Date;
  /** ID único para tracking en modal stack (opcional) */
  modalId?: string;
  /** Nombre del estudiante para mostrar en el header (opcional) */
  studentName?: string;
  /** Horas acumuladas de prácticas para mostrar como referencia (opcional) */
  hoursAccumulated?: number;
  /** Tutores asignados a la práctica profesional del estudiante (solo estos se muestran en el selector) */
  assignedTutors?: Array<{ tutorId: number; tutorName: string; tutorType: string }>;
  /** Conteo de visitas por tutor filtrado SOLO para esta práctica (no global) */
  tutorVisitCounts?: Array<{ tutorId: number; visitCount: number }>;
  /** Lista de visitas existentes de la práctica para validación preventiva client-side */
  existingVisits?: Visit[];
  /** Permite múltiples visitas el mismo día (config, para validación preventiva) */
  allowMultipleVisitsPerDay?: boolean;
  /** Máximo de visitas por día (config, para validación preventiva) */
  maxVisitsPerDay?: number | null;
}

export default function VisitModal({
  isOpen,
  onClose,
  onSubmit,
  visit,
  practiceId,
  tutorId,
  loading = false,
  mode = 'edit',
  periodStartDate,
  periodEndDate,
  modalId,
  studentName,
  hoursAccumulated,
  assignedTutors,
  tutorVisitCounts: practiceTutorVisitCounts,
  existingVisits,
  allowMultipleVisitsPerDay,
  maxVisitsPerDay
}: VisitModalProps) {
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);
  const [pendingData, setPendingData] = useState<VisitFormData | null>(null);
  const [displayHours, setDisplayHours] = useState('');
  const formatHoursDisplay = (hours: number): string => {
    if (hours <= 0) return '';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return m === 0 ? `${h}h` : `${h}h ${m}m`;
  };
  const { addToast } = useToast();

  const isEditing = !!visit && mode === 'edit';

  // Calcular fechas válidas para la fecha de visita
  // La fecha máxima SIEMPRE es "hoy" (no se permiten fechas futuras)
  const today = new Date();
  
  // Formatear hoy en formato local YYYY-MM-DDTHH:mm para el input datetime-local
  const formatLocalDateTime = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };
  
  const minDateLocal = periodStartDate ? formatLocalDateTime(periodStartDate) : '2020-01-01T00:00';
  
  // La fecha máxima para Zod (fin del día de hoy)
  const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
  
  // La fecha mínima es el inicio del período académico o una fecha muy antigua
  const minDate = periodStartDate || new Date('2020-01-01');
  
  // La fecha máxima es el menor valor entre el fin del período y hoy
  // (para asegurar que NUNCA sea una fecha futura y respete el cierre del periodo)
  let maxDate = todayEnd;
  if (periodEndDate) {
    const periodEndNormalized = new Date(periodEndDate.getFullYear(), periodEndDate.getMonth(), periodEndDate.getDate(), 23, 59, 59);
    if (periodEndNormalized < maxDate) {
      maxDate = periodEndNormalized;
    }
  }
  // El HTML input también debe usar el mismo criterio: min(hoy, periodEndDate)
  const maxHtmlDate = periodEndDate && periodEndDate < today ? periodEndDate : today;
  const maxDateLocal = formatLocalDateTime(maxHtmlDate);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors, isDirty, isValid }
  } = useForm({
    resolver: zodResolver(visitSchema) as any,
    mode: 'all',
    defaultValues: {
      tutorId: '',
      visitDate: '',
      visitType: '' as any,
      visitCase: '' as any,
      hoursWorked: 0,
      activitiesPerformed: '',
      observations: '',
      recommendations: ''
    }
  });

  const { showConfirmation, handleCloseAttempt, confirmClose, cancelClose } = useUnsavedChanges(isDirty, onClose);

  // Estados para el selector de tutor
  const { tutors, refreshTutors } = useTutors();
  const [tutorOptions, setTutorOptions] = useState<{ value: string; label: string }[]>([]);
  const [isTutorModalOpen, setIsTutorModalOpen] = useState(false);

  // Estados para listas dinámicas (combos configurables)
  const { fetchMultipleLists, loading: loadingLists } = useLists();
  const [visitTypeOptions, setVisitTypeOptions] = useState<ListOption[]>([]);
  const [visitCaseOptions, setVisitCaseOptions] = useState<ListOption[]>([]);
  // Mapa para resolver etiquetas de tipo de tutor desde t_list (abbreviation → name)
  const [tutorTypeLabelMap, setTutorTypeLabelMap] = useState<Record<string, string>>({});

  // Estados para modal de agregar nuevo valor a lista
  const [isAddValueModalOpen, setIsAddValueModalOpen] = useState(false);
  const [addValueListType, setAddValueListType] = useState<'VISIT_TYPE' | 'VISIT_CASE' | null>(null);
  const [newValueName, setNewValueName] = useState('');
  const [newValueAbbreviation, setNewValueAbbreviation] = useState('');
  const [isAddingValue, setIsAddingValue] = useState(false);

  // Cleanup cuando se cierra el modal
  useEffect(() => {
    if (!isOpen) {
      setConfirmSaveOpen(false);
      setPendingData(null);
      setDisplayHours('');
      setIsAddValueModalOpen(false);
      setNewValueName('');
      setNewValueAbbreviation('');
    }
  }, [isOpen]);

  // Cargar listas dinámicas (combos configurables) desde t_list
  const loadLists = async () => {
    try {
      const lists = await fetchMultipleLists(['VISIT_TYPE', 'VISIT_CASE', 'TUTOR_TYPE']);

      // Procesar tipos de visita
      const visitTypes = lists.VISIT_TYPE || [];
      if (visitTypes.length > 0) {
        setVisitTypeOptions(
          visitTypes
            .filter(v => v.status) // Solo activos
            .map(v => ({ value: v.id, label: v.name }))
            .sort((a, b) => a.label.localeCompare(b.label))
        );
      } else {
        // Fallback a legacy si no hay listas configuradas
        setVisitTypeOptions(LEGACY_VISIT_TYPES);
      }

      // Procesar casos de seguimiento
      const visitCases = lists.VISIT_CASE || [];
      if (visitCases.length > 0) {
        setVisitCaseOptions(
          visitCases
            .filter(v => v.status) // Solo activos
            .map(v => ({ value: v.id, label: v.name }))
            .sort((a, b) => a.label.localeCompare(b.label))
        );
      } else {
        // Fallback a legacy si no hay listas configuradas
        setVisitCaseOptions(LEGACY_VISIT_CASES);
      }

      // Construir mapa de tipos de tutor desde t_list (100% data-driven)
      // La clave es el abbreviation (ej: 'ACADEMICO') que matchea con TUTOR_TYPE en la BD
      // El valor es el name (ej: 'Académico') para mostrar al usuario
      const tutorTypes = lists.TUTOR_TYPE || [];
      const labelMap: Record<string, string> = {};
      tutorTypes
        .filter(v => v.status)
        .forEach(v => {
          if (v.abbreviation) {
            labelMap[v.abbreviation] = v.name;
          }
        });
      setTutorTypeLabelMap(labelMap);
    } catch (err) {
      console.error('[VisitModal] Error loading dynamic lists:', err);
      // En caso de error, usar opciones legacy
      setVisitTypeOptions(LEGACY_VISIT_TYPES);
      setVisitCaseOptions(LEGACY_VISIT_CASES);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadLists();
    }
  }, [isOpen, fetchMultipleLists]);

  // Estado para alternar entre tutores asignados y todos los tutores (suplente)
  const [showAllTutors, setShowAllTutors] = useState(false);

  // Construir opciones de tutores para el selector
  // Por defecto solo los asignados; si se activa suplente, muestra todos
  useEffect(() => {
    const assignedIds = new Set((assignedTutors || []).map(a => String(a.tutorId)));
    const tutorTypeMap = new Map<string, string>();
    (assignedTutors || []).forEach(a => tutorTypeMap.set(String(a.tutorId), a.tutorType));

    const hasAssignedTutors = (assignedTutors || []).length > 0;
    const options = (showAllTutors || !hasAssignedTutors ? tutors : tutors.filter(t => assignedIds.has(String(t.tutorId))))
      .map(t => {
        const isAssigned = assignedIds.has(String(t.tutorId));
        const visitCount = practiceTutorVisitCounts?.find(tc => String(tc.tutorId) === String(t.tutorId))?.visitCount || 0;
        const countLabel = visitCount > 0 ? ` (${visitCount} visita${visitCount !== 1 ? 's' : ''})` : '';
        const tutorType = tutorTypeMap.get(String(t.tutorId));
        const typeLabel = tutorType ? (tutorTypeLabelMap[tutorType] || tutorType) : '';
        return {
          value: String(t.tutorId),
          label: `${t.firstName} ${t.lastName} [${typeLabel}]${isAssigned ? '' : countLabel}`
        };
      });
    setTutorOptions(options);
  }, [tutors, practiceTutorVisitCounts, assignedTutors, tutorTypeLabelMap, showAllTutors]);

  // Toggle: cuando ninguno de los tutores asignados puede ir, se activa modo suplente
  const handleToggleSuplente = () => {
    setShowAllTutors(prev => !prev);
    setValue('tutorId', '', { shouldValidate: true });
  };

  // Callback cuando se guarda un nuevo tutor desde TutorModal
  const handleTutorCreated = async (tutorData: any) => {
    try {
      const newTutor = await createTutor(tutorData);
      if (newTutor) {
        await refreshTutors();
        setValue('tutorId', String(newTutor.tutorId));
        setIsTutorModalOpen(false);
        addToast({
          variant: 'success',
          title: 'Tutor registrado',
          message: `${newTutor.firstName} ${newTutor.lastName} ha sido agregado exitosamente`
        });
      }
    } catch (error: any) {
      addToast({
        variant: 'error',
        title: 'Error al crear tutor',
        message: error.response?.data?.message || 'No se pudo crear el tutor'
      });
    }
  };

  // Abrir modal para agregar nuevo valor a lista
  const handleAddNewVisitType = () => {
    setAddValueListType('VISIT_TYPE');
    setNewValueName('');
    setNewValueAbbreviation('');
    setIsAddValueModalOpen(true);
  };

  const handleAddNewVisitCase = () => {
    setAddValueListType('VISIT_CASE');
    setNewValueName('');
    setNewValueAbbreviation('');
    setIsAddValueModalOpen(true);
  };

  // Guardar nuevo valor en la lista
  const handleSaveNewValue = async () => {
    if (!addValueListType || !newValueName.trim()) {
      addToast({
        variant: 'error',
        title: 'Nombre requerido',
        message: 'Debe ingresar un nombre para el nuevo valor'
      });
      return;
    }

    setIsAddingValue(true);
    try {
      const listName = addValueListType;
      // Obtener la lista para saber su ID
      const list = await listsService.getListByName(listName);

      // Crear el nuevo valor
      await listsService.createValue(
        String(list.id),
        newValueName.trim(),
        newValueAbbreviation.trim() || undefined
      );

      // Recargar las listas
      await loadLists();

      addToast({
        variant: 'success',
        title: 'Valor agregado',
        message: `"${newValueName.trim()}" ha sido agregado a ${addValueListType === 'VISIT_TYPE' ? 'tipos de visita' : 'casos de seguimiento'}`
      });

      setIsAddValueModalOpen(false);
      setNewValueName('');
      setNewValueAbbreviation('');
    } catch (err: any) {
      console.error('[VisitModal] Error adding new value:', err);
      addToast({
        variant: 'error',
        title: 'Error al agregar',
        message: err.response?.data?.message || 'No se pudo agregar el nuevo valor'
      });
    } finally {
      setIsAddingValue(false);
    }
  };

  // Reset form when modal opens (for new visits) or when visit changes (for editing)
  useEffect(() => {
    if (!isOpen) return;

    if (visit) {
      // Editing existing visit - populate all fields
      reset({
        tutorId: String(visit.tutorId),
        visitDate: visit.visitDate.slice(0, 16),
        visitType: visit.visitType as any,
        visitCase: (visit.visitCase || 'SEGUIMIENTO_REGULAR') as any,
        hoursWorked: visit.hoursWorked,
        activitiesPerformed: visit.activitiesPerformed,
        observations: visit.observations || '',
        recommendations: visit.recommendations || ''
      });
      setDisplayHours(visit.hoursWorked > 0 ? String(visit.hoursWorked) : '');
    } else {
      // New visit - clear all fields
      reset({
        tutorId: '',
        visitDate: '',
        visitType: '' as any,
        visitCase: '' as any,
        hoursWorked: 0,
        activitiesPerformed: '',
        observations: '',
        recommendations: ''
      });
      setDisplayHours('');
    }
  }, [visit, reset, isOpen]);

  const validateDateRange = (dateStr: string): { valid: boolean; message?: string } => {
    const visitDateParsed = new Date(dateStr);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    // 1. Validar que la fecha no sea futura
    if (visitDateParsed > today) {
      return { 
        valid: false, 
        message: 'La fecha no puede ser futura' 
      };
    }
    
    // 2. Validar rango del período académico
    if (periodStartDate || periodEndDate) {
      if (periodStartDate && visitDateParsed < periodStartDate) {
        return { 
          valid: false, 
          message: `La fecha no puede ser anterior al inicio del período (${periodStartDate.toLocaleDateString('es-VE')})` 
        };
      }
      
      // Usar todayEnd como máximo si no hay período definido
      const maxAllowedDate = periodEndDate ? new Date(periodEndDate.getFullYear(), periodEndDate.getMonth(), periodEndDate.getDate(), 23, 59, 59) : todayEnd;
      if (visitDateParsed > maxAllowedDate) {
        return { 
          valid: false, 
          message: `La fecha no puede ser posterior a ${maxAllowedDate.toLocaleDateString('es-VE')}` 
        };
      }
    }
    return { valid: true };
  };

  const onSubmitForm = (data: VisitFormData) => {
    // Validar rango de fechas
    const dateValidation = validateDateRange(data.visitDate);
    if (!dateValidation.valid) {
      addToast({
        variant: 'error',
        title: 'Fecha inválida',
        message: dateValidation.message || 'Error en la fecha'
      });
      return;
    }

    // Validar observaciones requeridas para casos de problemas
    const selectedCase = visitCaseOptions.find(c => c.value === data.visitCase);
    const caseLabel = selectedCase?.label?.toUpperCase() || '';

    if (caseLabel.includes('PROBLEMA')) {
      const obs = (data.observations || '').trim();
      if (obs.length < 5) {
        addToast({
          variant: 'error',
          title: 'Observaciones requeridas',
          message: 'Las observaciones son obligatorias para casos de "Seguimiento a Problemas"'
        });
        return;
      }
      // Verificar que tenga al menos 1 palabra significativa
      const words = obs.split(/\s+/).filter(w => w.length >= 2);
      if (words.length < 1) {
        addToast({
          variant: 'error',
          title: 'Observaciones inválidas',
          message: 'Las observaciones deben contener al menos 1 palabra significativa'
        });
        return;
      }
    }

    // Validación preventiva client-side (backend es el guardia real)
    if (!isEditing && existingVisits?.length) {
      const sameDayVisits = existingVisits.filter(v => {
        const vDate = new Date(v.visitDate).toDateString();
        return vDate === new Date(data.visitDate).toDateString();
      });

      if (sameDayVisits.length > 0 && allowMultipleVisitsPerDay === false) {
        addToast({ variant: 'warning', title: 'Visita duplicada', message: 'Ya existe una visita en esta fecha.' });
        return;
      }

      if (sameDayVisits.length > 0 && maxVisitsPerDay && sameDayVisits.length >= maxVisitsPerDay) {
        addToast({ variant: 'warning', title: 'Límite alcanzado', message: `Máximo ${maxVisitsPerDay} visitas por día.` });
        return;
      }

      const newStart = new Date(data.visitDate).getTime();
      const newEnd = newStart + data.hoursWorked * 3600000;
      const hasOverlap = sameDayVisits.some(v => {
        const vStart = new Date(v.visitDate).getTime();
        const vEnd = vStart + (v.hoursWorked || 0) * 3600000;
        return newStart < vEnd && newEnd > vStart;
      });
      if (hasOverlap) {
        addToast({ variant: 'warning', title: 'Solapamiento', message: 'La visita se solapa con otra existente.' });
        return;
      }
    }

    setPendingData(data);
    setConfirmSaveOpen(true);
  };

  const handleConfirmSave = async () => {
    if (!pendingData) return;

    const tutorIdFromForm = parseInt(pendingData.tutorId);

    const payload: CreateVisitPayload | UpdateVisitPayload = isEditing
      ? {
          practiceId, // Necesario para validar duplicados en backend
          visitDate: new Date(pendingData.visitDate).toISOString(),
          visitType: pendingData.visitType,
          visitCase: pendingData.visitCase,
          hoursWorked: pendingData.hoursWorked,
          activitiesPerformed: pendingData.activitiesPerformed,
          observations: pendingData.observations || '',
          recommendations: pendingData.recommendations || ''
        }
      : {
          practiceId,
          tutorId: tutorIdFromForm,
          visitDate: new Date(pendingData.visitDate).toISOString(),
          visitType: pendingData.visitType,
          visitCase: pendingData.visitCase,
          hoursWorked: pendingData.hoursWorked,
          activitiesPerformed: pendingData.activitiesPerformed,
          observations: pendingData.observations || '',
          recommendations: pendingData.recommendations || ''
        };

    setConfirmSaveOpen(false);
    
    const success = await onSubmit(payload);
    if (success) {
      addToast({
        variant: 'success',
        title: isEditing ? 'Visita actualizada' : 'Visita registrada',
        message: isEditing 
          ? 'Los cambios se han guardado exitosamente' 
          : 'La visita de seguimiento ha sido registrada'
      });
      onClose();
    }
    // NOTA: el mensaje de error real lo muestra useVisits (toast.error) desde el hook
  };

  const handleClose = () => {
    handleCloseAttempt();
  };

  return (
    <>
      <Modal 
        isOpen={isOpen} 
        onClose={handleClose} 
        onCloseAttempt={handleCloseAttempt}
        showCloseButton 
        size="3xl"
        modalId={modalId}
      >
        <ModalHeader className="shrink-0 pt-8 px-6 sm:px-12">
          <div className="w-full">
            <span className="text-xl font-bold text-text-primary dark:text-white/90">
              {isEditing ? 'Editar Visita de Seguimiento' : 'Registrar Nueva Visita'}
            </span>
            <p className="mt-1 text-sm text-text-secondary dark:text-text-tertiary font-normal">
              {studentName 
                ? `Estudiante: ${studentName}`
                : (isEditing 
                  ? 'Modifica los detalles de la visita de seguimiento' 
                  : 'Completa la información de la visita de seguimiento')
              }
            </p>
          </div>
        </ModalHeader>

        <ModalBody className="bg-bg-secondary/30 dark:bg-bg-dark/50">
          <form id="visit-form" onSubmit={handleSubmit(onSubmitForm as any)} className="space-y-6 w-full">
            {/* Fila 0: Selector de Tutor (primero) */}
            <div className="grid grid-cols-1 gap-x-6 gap-y-5">
              <div>
                <label className="text-sm font-medium text-text-primary dark:text-white/90">
                  Tutor que realizó la Visita <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Controller
                      name="tutorId"
                      control={control}
                      render={({ field }) => (
                        <CustomSelect
                          id="tutorId"
                          options={tutorOptions}
                          onChange={(value) => field.onChange(value)}
                          onBlur={field.onBlur}
                          value={field.value}
                          placeholder="Seleccione un tutor"
                          error={!!errors.tutorId}
                          onAddNew={() => setIsTutorModalOpen(true)}
                          addNewLabel="Agregar nuevo tutor"
                          searchable
                          searchPlaceholder="Buscar tutor..."
                          className="w-full"
                        />
                      )}
                    />
                    {errors.tutorId && (
                      <p className="mt-1 text-xs text-error-500 flex items-center gap-1">
                        <span className="inline-block w-1 h-1 bg-error-500 rounded-full"></span>
                        {errors.tutorId.message}
                      </p>
                    )}
                    {assignedTutors && assignedTutors.length > 0 && (
                      <button
                        type="button"
                        onClick={handleToggleSuplente}
                        className="mt-1.5 text-xs text-brand-600 hover:text-brand-700 dark:text-brand-400 underline underline-offset-2"
                      >
                        {showAllTutors
                          ? '← Volver a tutores asignados'
                          : '¿Ninguno disponible? Seleccionar suplente →'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Fila 1: Fecha, Tipo y Caso */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
              <div>
                <label htmlFor="visitDate" className="text-sm font-medium text-text-primary dark:text-white/90">
                  Fecha y Hora de la Visita <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  id="visitDate"
                  {...register('visitDate')}
                  min={minDateLocal}
                  max={maxDateLocal}
                  className={`w-full rounded-lg border bg-white dark:bg-dark px-4 py-2.5 text-sm text-black dark:text-white
                    ${errors.visitDate
                      ? 'border-error-500 focus:border-error-500 focus:ring-1 focus:ring-error-500'
                      : 'border-stroke dark:border-stroke-dark focus:border-brand-500 focus:ring-1 focus:ring-brand-500'
                    }`}
                />
                {errors.visitDate && (
                  <p className="mt-1 text-xs text-error-500 flex items-center gap-1">
                    <span className="inline-block w-1 h-1 bg-error-500 rounded-full"></span>
                    {errors.visitDate.message}
                  </p>
                )}
                {periodStartDate && periodEndDate && (
                  <p className="mt-1.5 text-xs text-text-tertiary">
                    Período válido: {periodStartDate.toLocaleDateString('es-VE')} - {periodEndDate.toLocaleDateString('es-VE')}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="visitType" className="text-sm font-medium text-text-primary dark:text-white/90">
                  Tipo de Visita <span className="text-red-500">*</span>
                </label>
                <Controller
                  name="visitType"
                  control={control}
                  render={({ field }) => (
                    <CustomSelect
                      id="visitType"
                      options={visitTypeOptions}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      value={field.value}
                      placeholder="Seleccionar tipo"
                      error={!!errors.visitType}
                      onAddNew={handleAddNewVisitType}
                      addNewLabel="Agregar nuevo tipo de visita"
                      searchable
                      searchPlaceholder="Buscar tipo..."
                    />
                  )}
                />
                {errors.visitType && (
                  <p className="mt-1 text-xs text-error-500 flex items-center gap-1">
                    <span className="inline-block w-1 h-1 bg-error-500 rounded-full"></span>
                    {String(errors.visitType.message || '')}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="visitCase" className="text-sm font-medium text-text-primary dark:text-white/90">
                  Caso de Seguimiento <span className="text-red-500">*</span>
                </label>
                <Controller
                  name="visitCase"
                  control={control}
                  render={({ field }) => (
                    <CustomSelect
                      id="visitCase"
                      options={visitCaseOptions}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      value={field.value}
                      placeholder="Seleccionar caso"
                      error={!!errors.visitCase}
                      onAddNew={handleAddNewVisitCase}
                      addNewLabel="Agregar nuevo caso"
                      searchable
                      searchPlaceholder="Buscar caso..."
                    />
                  )}
                />
                {errors.visitCase && (
                  <p className="mt-1 text-xs text-error-500 flex items-center gap-1">
                    <span className="inline-block w-1 h-1 bg-error-500 rounded-full"></span>
                    {String(errors.visitCase.message || '')}
                  </p>
                )}
              </div>
            </div>

            {/* Horas trabajadas */}
            <div className="max-w-xs">
              <label htmlFor="hoursWorked" className="text-sm font-medium text-text-primary dark:text-white/90">
                Horas Trabajadas
              </label>
              <div className="relative">
                <Input
                  id="hoursWorked"
                  type="text"
                  inputMode="decimal"
                   maxLength={4}
                  value={displayHours}
                  placeholder="0.0"
                  error={!!errors.hoursWorked}
                  hint={errors.hoursWorked?.message === 'expected number, received NaN'
                    ? 'Ingrese un número válido'
                    : errors.hoursWorked?.message}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Solo permitir números y punto/coma decimal
                    const cleaned = value.replace(/[^0-9.,]/g, '');
                    // Reemplazar coma por punto para consistencia
                    const normalized = cleaned.replace(',', '.');
                    // Limitar a un solo punto decimal
                    const parts = normalized.split('.');
                    const finalValue = parts.length > 2
                      ? `${parts[0]}.${parts.slice(1).join('')}`
                      : normalized;
                    // Limitar a máximo 2 decimales
                    const limited = finalValue.includes('.')
                      ? finalValue.replace(/(\.\d{2})\d*/, '$1')
                      : finalValue;

                    // No permitir más de 24
                    const numValue = limited === '' ? 0 : parseFloat(limited);
                    if (numValue > 24) {
                      setDisplayHours('24');
                      setValue('hoursWorked', 24, { shouldValidate: true, shouldDirty: true });
                      return;
                    }

                    setDisplayHours(limited);
                    setValue('hoursWorked', numValue, { shouldValidate: true, shouldDirty: true });
                  }}
                  onBlur={() => {
                    // Formatear al perder el foco
                    const num = parseFloat(displayHours);
                    if (!isNaN(num) && num > 0) {
                      const clamped = Math.min(num, 24);
                      setDisplayHours(clamped.toFixed(1));
                      setValue('hoursWorked', clamped, { shouldValidate: true });
                    }
                  }}
                  className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                {(() => {
                  const num = parseFloat(displayHours);
                  if (isNaN(num) || num <= 0) return null;
                  const formatted = formatHoursDisplay(num);
                  if (!formatted) return null;
                  return (
                    <div className="mt-1.5 text-xs text-text-secondary dark:text-white/60">
                      {num.toFixed(1)} → {formatted}
                    </div>
                  );
                })()}
                {typeof hoursAccumulated === 'number' && hoursAccumulated > 0 && (
                  <div className="mt-1.5 flex items-center gap-1.5 px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20">
                    <svg className="w-3.5 h-3.5 text-blue-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-[11px] text-blue-700 dark:text-blue-300">
                      Acumuladas: <span className="font-semibold">{hoursAccumulated.toFixed(1)} hrs</span>
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Actividades realizadas */}
            <div>
              <label htmlFor="activitiesPerformed" className="text-sm font-medium text-text-primary dark:text-white/90">
                Actividades Realizadas <span className="text-red-500">*</span>
              </label>
              <TextArea
                id="activitiesPerformed"
                {...register('activitiesPerformed')}
                placeholder="Describa las actividades realizadas por el estudiante durante la visita..."
                error={!!errors.activitiesPerformed}
                rows={3}
                className="w-full"
              />
              {errors.activitiesPerformed && (
                <p className="mt-1 text-xs text-error-500 flex items-center gap-1">
                  <span className="inline-block w-1 h-1 bg-error-500 rounded-full"></span>
                  {errors.activitiesPerformed.message}
                </p>
              )}
            </div>

            {/* Observaciones y Recomendaciones en fila */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
              <div>
                <label htmlFor="observations" className="text-sm font-medium text-text-primary dark:text-white/90">
                  Observaciones
                </label>
                <TextArea
                  id="observations"
                  {...register('observations')}
                  placeholder="Observaciones generales sobre el desempeño del estudiante..."
                  rows={3}
                  className="w-full"
                />
              </div>

              <div>
                <label htmlFor="recommendations" className="text-sm font-medium text-text-primary dark:text-white/90">
                  Recomendaciones
                </label>
                <TextArea
                  id="recommendations"
                  {...register('recommendations')}
                  placeholder="Recomendaciones para mejorar el desempeño del estudiante..."
                  rows={3}
                  className="w-full"
                />
              </div>
            </div>
          </form>
        </ModalBody>

        <ModalFooter className="shrink-0 px-6 sm:px-12 py-6 bg-white dark:bg-bg-dark border-t border-border-light dark:border-border-dark">
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 w-full max-w-4xl mx-auto">
            <AsyncButton 
              variant="outline" 
              onClick={handleCloseAttempt} 
              disabled={loading}
              className="w-full sm:w-auto min-h-12"
            >
              Cancelar
            </AsyncButton>
            <AsyncButton 
              type="submit" 
              form="visit-form"
              loading={loading}
              disabled={!isValid}
              className="w-full sm:w-auto min-h-12"
            >
              {isEditing ? 'Guardar Cambios' : 'Guardar Visita'}
            </AsyncButton>
          </div>
        </ModalFooter>
      </Modal>

      {/* Dialog de confirmación para guardar */}
      <UnifiedDialog
        isOpen={confirmSaveOpen}
        onClose={() => setConfirmSaveOpen(false)}
        title={isEditing ? CONFIRM_MESSAGES.update('Visita').title : CONFIRM_MESSAGES.create('Visita').title}
        message={
          <div className="space-y-2">
            <p className="text-sm text-text-secondary">
              {isEditing 
                ? CONFIRM_MESSAGES.update('Visita').message
                : CONFIRM_MESSAGES.create('Visita').message}
            </p>
            {pendingData && (
              <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm space-y-1">
                <p><strong>Fecha:</strong> {new Date(pendingData.visitDate).toLocaleString('es-VE')}</p>
                <p><strong>Tipo:</strong> {visitTypeOptions.find(t => t.value === pendingData.visitType)?.label || pendingData.visitType}</p>
                <p><strong>Caso:</strong> {visitCaseOptions.find(c => c.value === pendingData.visitCase)?.label || pendingData.visitCase}</p>
                <p><strong>Horas:</strong> {pendingData.hoursWorked}</p>
              </div>
            )}
          </div>
        }
        confirmLabel={isEditing ? CONFIRM_MESSAGES.update('Visita').confirmLabel : CONFIRM_MESSAGES.create('Visita').confirmLabel}
        variant="confirm"
        onConfirm={handleConfirmSave}
      />

      {/* Dialog de confirmación para cerrar sin guardar */}
      <UnifiedDialog
        isOpen={showConfirmation}
        onClose={cancelClose}
        variant="warning"
        {...SYSTEM_DIALOGS.closeWithoutSaving}
        onConfirm={confirmClose}
      />

      {/* Modal para agregar nuevo tutor (usando TutorModal existente) */}
      <TutorModal
        isOpen={isTutorModalOpen}
        onClose={() => setIsTutorModalOpen(false)}
        onSave={handleTutorCreated}
        isLoading={false}
        modalId={`${modalId}-tutor`}
      />

      {/* Modal para agregar nuevo valor a lista (VISIT_TYPE o VISIT_CASE) */}
      <UnifiedDialog
        isOpen={isAddValueModalOpen}
        onClose={() => setIsAddValueModalOpen(false)}
        title={
          addValueListType === 'VISIT_TYPE'
            ? 'Agregar Tipo de Visita'
            : 'Agregar Caso de Seguimiento'
        }
        message={
          <div className="space-y-4">
            <p className="text-sm text-text-secondary dark:text-text-tertiary">
              Ingrese el nombre y opcionalmente una abreviación para el nuevo valor.
            </p>
            <div className="space-y-3">
              <div>
                <label htmlFor="newValueName" className="mb-1.5 block text-sm font-medium text-text-primary dark:text-text-emphasis">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  id="newValueName"
                  type="text"
                  value={newValueName}
                  onChange={(e) => setNewValueName(e.target.value)}
                  placeholder={addValueListType === 'VISIT_TYPE' ? 'Ej: Presencial' : 'Ej: Seguimiento Regular'}
                  className="w-full rounded-lg border border-border-medium bg-white dark:bg-bg-dark px-4 py-2.5 text-sm text-text-primary dark:text-text-emphasis placeholder:text-text-tertiary focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-border-dark"
                  autoFocus
                />
              </div>
              <div>
                <label htmlFor="newValueAbbreviation" className="mb-1.5 block text-sm font-medium text-text-primary dark:text-text-emphasis">
                  Abreviación (opcional)
                </label>
                <input
                  id="newValueAbbreviation"
                  type="text"
                  value={newValueAbbreviation}
                  onChange={(e) => setNewValueAbbreviation(e.target.value)}
                  placeholder="Ej: PR"
                  className="w-full rounded-lg border border-border-medium bg-white dark:bg-bg-dark px-4 py-2.5 text-sm text-text-primary dark:text-text-emphasis placeholder:text-text-tertiary focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-border-dark"
                />
              </div>
            </div>
          </div>
        }
        confirmLabel="Agregar"
        cancelLabel="Cancelar"
        variant="confirm"
        onConfirm={handleSaveNewValue}
        isLoading={isAddingValue}
      />
    </>
  );
}
