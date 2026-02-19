import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Modal } from '../../../components/ui/modal';
import Button from '../../../components/ui/button/Button';
import CustomSelect from '../../../components/form/CustomSelect';
import { Visit, CreateVisitPayload, UpdateVisitPayload, VISIT_TYPES } from '../types';

const visitSchema = z.object({
  visitDate: z.string().min(1, 'La fecha es requerida'),
  visitType: z.enum(['PRESENCIAL', 'VIRTUAL', 'TELEFONICA']),
  hoursWorked: z.number().min(0, 'Las horas deben ser positivas').max(24, 'Máximo 24 horas'),
  activitiesPerformed: z.string().min(10, 'Mínimo 10 caracteres'),
  observations: z.string().optional(),
  recommendations: z.string().optional()
});

type VisitFormData = z.infer<typeof visitSchema>;

interface VisitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateVisitPayload | UpdateVisitPayload) => Promise<boolean>;
  visit?: Visit | null;
  practiceId: number;
  tutorId: number;
  loading?: boolean;
}

export default function VisitModal({
  isOpen,
  onClose,
  onSubmit,
  visit,
  practiceId,
  tutorId,
  loading = false
}: VisitModalProps) {
  const isEditing = !!visit;

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<VisitFormData>({
    resolver: zodResolver(visitSchema),
    defaultValues: {
      visitDate: new Date().toISOString().slice(0, 16),
      visitType: 'PRESENCIAL',
      hoursWorked: 0,
      activitiesPerformed: '',
      observations: '',
      recommendations: ''
    }
  });

  useEffect(() => {
    if (visit) {
      reset({
        visitDate: visit.visitDate.slice(0, 16),
        visitType: visit.visitType,
        hoursWorked: visit.hoursWorked,
        activitiesPerformed: visit.activitiesPerformed,
        observations: visit.observations,
        recommendations: visit.recommendations
      });
    } else {
      reset({
        visitDate: new Date().toISOString().slice(0, 16),
        visitType: 'PRESENCIAL',
        hoursWorked: 0,
        activitiesPerformed: '',
        observations: '',
        recommendations: ''
      });
    }
  }, [visit, reset]);

  const handleFormSubmit = async (data: VisitFormData) => {
    const payload: CreateVisitPayload | UpdateVisitPayload = isEditing
      ? {
          visitDate: new Date(data.visitDate).toISOString(),
          visitType: data.visitType,
          hoursWorked: data.hoursWorked,
          activitiesPerformed: data.activitiesPerformed,
          observations: data.observations || '',
          recommendations: data.recommendations || ''
        }
      : {
          practiceId,
          tutorId,
          visitDate: new Date(data.visitDate).toISOString(),
          visitType: data.visitType,
          hoursWorked: data.hoursWorked,
          activitiesPerformed: data.activitiesPerformed,
          observations: data.observations || '',
          recommendations: data.recommendations || ''
        };

    const success = await onSubmit(payload);
    if (success) {
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} showCloseButton size="3xl">
      <div className="p-6">
        <div className="mb-6">
          <h3 className="text-xl font-bold text-text-primary dark:text-text-emphasis">
            {isEditing ? 'Editar Visita' : 'Registrar Nueva Visita'}
          </h3>
          <p className="text-sm text-text-secondary dark:text-text-tertiary mt-1">
            {isEditing 
              ? 'Modifica los detalles de la visita de seguimiento'
              : 'Complete la información de la visita de seguimiento'}
          </p>
        </div>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-text-primary dark:text-white">
                Fecha y Hora de la Visita *
              </label>
              <input
                type="datetime-local"
                {...register('visitDate')}
                className="w-full px-4 py-3 rounded-lg border border-border-light dark:border-white/10 bg-white dark:bg-gray-800 text-text-primary dark:text-text-emphasis focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
              {errors.visitDate && (
                <p className="text-xs text-error-500">{errors.visitDate.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-text-primary dark:text-white">
                Tipo de Visita *
              </label>
              <Controller
                name="visitType"
                control={control}
                render={({ field }) => (
                  <CustomSelect
                    options={VISIT_TYPES.map(t => ({ value: t.value, label: t.label }))}
                    value={field.value}
                    onChange={(val) => field.onChange(val)}
                    placeholder="Seleccionar tipo"
                  />
                )}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-text-primary dark:text-white">
              Horas Trabajadas *
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              max="24"
              {...register('hoursWorked', { valueAsNumber: true })}
              className="w-full px-4 py-3 rounded-lg border border-border-light dark:border-white/10 bg-white dark:bg-gray-800 text-text-primary dark:text-text-emphasis focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
            {errors.hoursWorked && (
              <p className="text-xs text-error-500">{errors.hoursWorked.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-text-primary dark:text-white">
              Actividades Realizadas *
            </label>
            <textarea
              {...register('activitiesPerformed')}
              rows={3}
              className="w-full px-4 py-3 rounded-lg border border-border-light dark:border-white/10 bg-white dark:bg-gray-800 text-text-primary dark:text-text-emphasis focus:outline-none focus:ring-2 focus:ring-brand-500/20 resize-none"
              placeholder="Describa las actividades realizadas por el estudiante durante la visita..."
            />
            {errors.activitiesPerformed && (
              <p className="text-xs text-error-500">{errors.activitiesPerformed.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-text-primary dark:text-white">
              Observaciones
            </label>
            <textarea
              {...register('observations')}
              rows={3}
              className="w-full px-4 py-3 rounded-lg border border-border-light dark:border-white/10 bg-white dark:bg-gray-800 text-text-primary dark:text-text-emphasis focus:outline-none focus:ring-2 focus:ring-brand-500/20 resize-none"
              placeholder="Observaciones generales sobre el desempeño del estudiante..."
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-text-primary dark:text-white">
              Recomendaciones
            </label>
            <textarea
              {...register('recommendations')}
              rows={3}
              className="w-full px-4 py-3 rounded-lg border border-border-light dark:border-white/10 bg-white dark:bg-gray-800 text-text-primary dark:text-text-emphasis focus:outline-none focus:ring-2 focus:ring-brand-500/20 resize-none"
              placeholder="Recomendaciones para mejorar el desempeño del estudiante..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-border-light dark:border-white/10">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting || loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || loading}
            >
              {isSubmitting || loading 
                ? 'Guardando...' 
                : isEditing ? 'Actualizar Visita' : 'Registrar Visita'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
