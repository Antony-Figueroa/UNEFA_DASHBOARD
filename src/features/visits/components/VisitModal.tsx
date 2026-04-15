/**
 * @file Modal para el registro y edición de visitas de seguimiento.
 * @description Gestiona la validación de campos, fechas del período académico y confirmación de guardado.
 */

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../../components/ui/modal';
import AsyncButton from '../../../components/ui/button/AsyncButton';
import CustomSelect from '../../../components/form/CustomSelect';
import TextArea from '../../../components/form/input/TextArea';
import FlatpickrDatePicker from '../../../components/form/FlatpickrDatePicker';
import { Visit, CreateVisitPayload, UpdateVisitPayload, VISIT_TYPES, VISIT_CASES } from '../types';
import { useUnsavedChanges } from '../../../hooks/useUnsavedChanges';
import { useToast } from '../../../context/toast';
import UnifiedDialog from '../../../components/ui/dialog/UnifiedDialog';
import Input from '../../../components/form/input/InputField';
import { SAFE_LONG_TEXT_PATTERN, isSafeInput } from '../../../utils/inputValidation';

const visitSchema = z.object({
  visitDate: z.string().min(1, 'La fecha es requerida'),
  visitType: z.enum(['PRESENCIAL', 'VIRTUAL', 'TELEFONICA']),
  visitCase: z.enum(['VISITA_INICIAL', 'SEGUIMIENTO_REGULAR', 'REVISION_BITACORAS', 'EVALUACION_PARCIAL', 'SEGUIMIENTO_PROBLEMAS', 'CAMBIO_EMPRESA', 'CAMBIO_TUTOR', 'SUSPENSION', 'REANUDACION', 'EVALUACION_FINAL', 'CERTIFICACION']),
  hoursWorked: z.coerce.number().min(0, 'Las horas deben ser positivas').max(24, 'Máximo 24 horas'),
  activitiesPerformed: z.string()
    .min(10, 'Mínimo 10 caracteres')
    .max(2000, "El texto es demasiado largo")
    .refine(val => isSafeInput(val), { message: "Caracteres no permitidos" }),
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
    today.setHours(23, 59, 59, 999); // Fin del día de hoy
    return visitDateParsed <= today;
  },
  {
    message: 'La fecha de la visita no puede ser futura',
    path: ['visitDate']
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
  modalId
}: VisitModalProps) {
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);
  const [pendingData, setPendingData] = useState<VisitFormData | null>(null);
  const [displayHours, setDisplayHours] = useState('');
  const { addToast } = useToast();

  const isEditing = !!visit && mode === 'edit';

  // Calcular fechas válidas para la fecha de visita
  // La fecha máxima SIEMPRE es "hoy" (no se permiten fechas futuras)
  const now = new Date();
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  
  // La fecha mínima es el inicio del período académico o una fecha muy antigua
  const minDate = periodStartDate || new Date('2020-01-01');
  
  // La fecha máxima es el menor valor entre el fin del período y hoy
  // (para asegurar que NUNCA sea una fecha futura)
  let maxDate = todayEnd;
  if (periodEndDate) {
    const periodEndNormalized = new Date(periodEndDate.getFullYear(), periodEndDate.getMonth(), periodEndDate.getDate(), 23, 59, 59);
    if (periodEndNormalized < maxDate) {
      maxDate = periodEndNormalized;
    }
  }

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
      visitDate: new Date().toISOString().slice(0, 16),
      visitType: 'PRESENCIAL',
      visitCase: 'SEGUIMIENTO_REGULAR',
      hoursWorked: 0,
      activitiesPerformed: '',
      observations: '',
      recommendations: ''
    }
  });

  const { showConfirmation, handleCloseAttempt, confirmClose, cancelClose } = useUnsavedChanges(isDirty, onClose);

  // Cleanup cuando se cierra el modal
  useEffect(() => {
    if (!isOpen) {
      setConfirmSaveOpen(false);
      setPendingData(null);
      setDisplayHours('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (visit) {
      reset({
        visitDate: visit.visitDate.slice(0, 16),
        visitType: visit.visitType,
        visitCase: visit.visitCase || 'SEGUIMIENTO_REGULAR',
        hoursWorked: visit.hoursWorked,
        activitiesPerformed: visit.activitiesPerformed,
        observations: visit.observations || '',
        recommendations: visit.recommendations || ''
      });
      setDisplayHours(visit.hoursWorked > 0 ? String(visit.hoursWorked) : '');
    } else {
      reset({
        visitDate: new Date().toISOString().slice(0, 16),
        visitType: 'PRESENCIAL',
        visitCase: 'SEGUIMIENTO_REGULAR',
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

    setPendingData(data);
    setConfirmSaveOpen(true);
  };

  const handleConfirmSave = async () => {
    if (!pendingData) return;

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
          tutorId,
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
    } else {
      addToast({
        variant: 'error',
        title: 'Error',
        message: 'No se pudo guardar la visita. Intente de nuevo.'
      });
    }
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
        <ModalHeader>
          <div className="w-full">
            <span className="mb-1 font-semibold text-text-primary modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
              {isEditing ? 'Editar Visita de Seguimiento' : 'Registrar Nueva Visita'}
            </span>
            <p className="text-sm text-text-secondary dark:text-text-tertiary font-normal">
              {isEditing 
                ? 'Modifica los detalles de la visita de seguimiento' 
                : 'Completa la información de la visita de seguimiento'}
            </p>
          </div>
        </ModalHeader>

        <ModalBody className="bg-bg-secondary/30 dark:bg-bg-dark/50">
          <form id="visit-form" onSubmit={handleSubmit(onSubmitForm as any)} className="space-y-6 w-full">
            {/* Fila 1: Fecha, Tipo y Caso */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-5">
              <div>
                <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">
                  Fecha y Hora de la Visita *
                </label>
                <Controller
                  name="visitDate"
                  control={control}
                  render={({ field }) => (
                    <FlatpickrDatePicker
                      value={field.value}
                      onChange={(dateStr) => {
                        field.onChange(dateStr);
                      }}
                      onBlur={field.onBlur}
                      error={!!errors.visitDate}
                      placeholder="Seleccione fecha y hora"
                      options={{
                        enableTime: true,
                        dateFormat: 'Y-m-d H:i',
                        time_24hr: true,
                        minDate: periodStartDate ? periodStartDate.toISOString() : undefined,
                        maxDate: maxDate.toISOString()
                      }}
                    />
                  )}
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
                <label htmlFor="visitType" className="mb-2.5 block text-black dark:text-white font-medium text-sm">
                  Tipo de Visita *
                </label>
                <Controller
                  name="visitType"
                  control={control}
                  render={({ field }) => (
                    <CustomSelect
                      id="visitType"
                      options={VISIT_TYPES.map(t => ({ value: t.value, label: t.label }))}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      value={field.value}
                      placeholder="Seleccionar tipo"
                      error={!!errors.visitType}
                    />
                  )}
                />
                {errors.visitType && (
                  <p className="mt-1 text-xs text-error-500 flex items-center gap-1">
                    <span className="inline-block w-1 h-1 bg-error-500 rounded-full"></span>
                    {errors.visitType.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="visitCase" className="mb-2.5 block text-black dark:text-white font-medium text-sm">
                  Caso de Seguimiento *
                </label>
                <Controller
                  name="visitCase"
                  control={control}
                  render={({ field }) => (
                    <CustomSelect
                      id="visitCase"
                      options={VISIT_CASES.map(c => ({ value: c.value, label: c.label }))}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      value={field.value}
                      placeholder="Seleccionar caso"
                      error={!!errors.visitCase}
                    />
                  )}
                />
                {errors.visitCase && (
                  <p className="mt-1 text-xs text-error-500 flex items-center gap-1">
                    <span className="inline-block w-1 h-1 bg-error-500 rounded-full"></span>
                    {errors.visitCase.message}
                  </p>
                )}
              </div>
            </div>

            {/* Horas trabajadas */}
            <div className="max-w-xs">
              <label htmlFor="hoursWorked" className="mb-2.5 block text-black dark:text-white font-medium text-sm">
                Horas Trabajadas *
              </label>
              <Input
                id="hoursWorked"
                type="text"
                inputMode="decimal"
                maxLength={2}
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
                  
                  setDisplayHours(limited);
                  
                  // Actualizar el valor en el formulario
                  const numValue = limited === '' ? 0 : parseFloat(limited);
                  setValue('hoursWorked', numValue, { shouldValidate: true, shouldDirty: true });
                }}
                onBlur={() => {
                  // Formatear al perder el foco
                  const num = parseFloat(displayHours);
                  if (!isNaN(num) && num > 0) {
                    setDisplayHours(num.toFixed(1));
                    setValue('hoursWorked', num, { shouldValidate: true });
                  }
                }}
                className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>

            {/* Actividades realizadas */}
            <div>
              <label htmlFor="activitiesPerformed" className="mb-2.5 block text-black dark:text-white font-medium text-sm">
                Actividades Realizadas *
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
                <label htmlFor="observations" className="mb-2.5 block text-black dark:text-white font-medium text-sm">
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
                <label htmlFor="recommendations" className="mb-2.5 block text-black dark:text-white font-medium text-sm">
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
              {isEditing ? 'Actualizar Visita' : 'Registrar Visita'}
            </AsyncButton>
          </div>
        </ModalFooter>
      </Modal>

      {/* Dialog de confirmación para guardar */}
      <UnifiedDialog
        isOpen={confirmSaveOpen}
        onClose={() => setConfirmSaveOpen(false)}
        title={isEditing ? '¿Actualizar Visita?' : '¿Registrar Visita?'}
        message={
          <div className="space-y-2">
            <p className="text-sm text-text-secondary">
              {isEditing 
                ? '¿Estás seguro de que deseas actualizar esta visita de seguimiento?' 
                : '¿Estás seguro de que deseas registrar esta nueva visita de seguimiento?'}
            </p>
            {pendingData && (
              <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm space-y-1">
                <p><strong>Fecha:</strong> {new Date(pendingData.visitDate).toLocaleString('es-VE')}</p>
                <p><strong>Tipo:</strong> {VISIT_TYPES.find(t => t.value === pendingData.visitType)?.label}</p>
                <p><strong>Horas:</strong> {pendingData.hoursWorked}</p>
              </div>
            )}
          </div>
        }
        confirmLabel={isEditing ? 'Sí, actualizar' : 'Sí, registrar'}
        variant="confirm"
        onConfirm={handleConfirmSave}
      />

      {/* Dialog de confirmación para cerrar sin guardar */}
      <UnifiedDialog
        isOpen={showConfirmation}
        onClose={cancelClose}
        title="¿Cerrar sin guardar?"
        message="Tienes cambios sin guardar. ¿Estás seguro de que deseas cerrar sin guardar los cambios?"
        confirmLabel="Sí, cerrar"
        cancelLabel="Continuar editando"
        variant="warning"
        onConfirm={confirmClose}
      />
    </>
  );
}
