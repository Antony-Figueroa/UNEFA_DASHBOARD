import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../../components/ui/modal';
import Button from '../../../components/ui/button/Button';
import AsyncButton from '../../../components/ui/button/AsyncButton';
import Input from '../../../components/form/input/InputField';
import TextArea from '../../../components/form/input/TextArea';
import CustomSelect from '../../../components/form/CustomSelect';
import { ActivityLog, CreateActivityLogPayload, UpdateActivityLogPayload, ACTIVITY_TYPES } from '../types';

interface ActivityLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: CreateActivityLogPayload | UpdateActivityLogPayload) => Promise<boolean>;
  log: ActivityLog | null;
  professionalPracticeId: number;
  studentId: number;
  isLoading?: boolean;
}

const activityLogSchema = z.object({
  activityDate: z.string().min(1, 'La fecha es obligatoria'),
  hoursWorked: z.number().min(0.5, 'Mínimo 0.5 horas').max(24, 'Máximo 24 horas'),
  activityType: z.enum(['DIARIA', 'SEMANAL']),
  activityDescription: z.string().min(10, 'Mínimo 10 caracteres'),
  tasksCompleted: z.string().optional(),
  challenges: z.string().optional(),
  learnings: z.string().optional(),
  weekNumber: z.number().min(1).max(52).optional().nullable(),
});

type ActivityLogFormData = z.infer<typeof activityLogSchema>;

export default function ActivityLogModal({
  isOpen,
  onClose,
  onSave,
  log,
  professionalPracticeId,
  studentId,
  isLoading = false
}: ActivityLogModalProps) {
  const [isEditing, setIsEditing] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isDirty }
  } = useForm<ActivityLogFormData>({
    resolver: zodResolver(activityLogSchema),
    defaultValues: {
      activityDate: '',
      hoursWorked: 1,
      activityType: 'DIARIA',
      activityDescription: '',
      tasksCompleted: '',
      challenges: '',
      learnings: '',
      weekNumber: null
    }
  });

  useEffect(() => {
    if (isOpen) {
      if (log) {
        setIsEditing(true);
        reset({
          activityDate: log.activityDate?.split('T')[0] || '',
          hoursWorked: log.hoursWorked,
          activityType: log.activityType,
          activityDescription: log.activityDescription,
          tasksCompleted: log.tasksCompleted || '',
          challenges: log.challenges || '',
          learnings: log.learnings || '',
          weekNumber: log.weekNumber
        });
      } else {
        setIsEditing(false);
        reset({
          activityDate: new Date().toISOString().split('T')[0],
          hoursWorked: 1,
          activityType: 'DIARIA',
          activityDescription: '',
          tasksCompleted: '',
          challenges: '',
          learnings: '',
          weekNumber: null
        });
      }
    }
  }, [isOpen, log, reset]);

  const onSubmit = async (data: ActivityLogFormData) => {
    if (isEditing && log) {
      const success = await onSave({
        activityDate: data.activityDate,
        hoursWorked: data.hoursWorked,
        activityType: data.activityType,
        activityDescription: data.activityDescription,
        tasksCompleted: data.tasksCompleted,
        challenges: data.challenges,
        learnings: data.learnings,
        weekNumber: data.weekNumber || undefined
      } as UpdateActivityLogPayload);
      if (success) onClose();
    } else {
      const success = await onSave({
        professionalPracticeId,
        studentId,
        activityDate: data.activityDate,
        hoursWorked: data.hoursWorked,
        activityType: data.activityType,
        activityDescription: data.activityDescription,
        tasksCompleted: data.tasksCompleted,
        challenges: data.challenges,
        learnings: data.learnings,
        weekNumber: data.weekNumber || undefined
      } as CreateActivityLogPayload);
      if (success) onClose();
    }
  };

  const handleClose = () => {
    if (isDirty) {
      if (confirm('Hay cambios sin guardar. ¿Desea salir?')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="2xl">
      <ModalHeader>
        {isEditing ? 'Editar Registro de Actividad' : 'Nuevo Registro de Actividad'}
      </ModalHeader>
      
      <form onSubmit={handleSubmit(onSubmit)}>
        <ModalBody>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-black dark:text-white">
                  Fecha de Actividad *
                </label>
                <Input
                  type="date"
                  {...register('activityDate')}
                  error={!!errors.activityDate}
                  hint={errors.activityDate?.message}
                />
              </div>
              
              <div>
                <label className="mb-1.5 block text-sm font-medium text-black dark:text-white">
                  Horas Trabajadas *
                </label>
                <Input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="24"
                  {...register('hoursWorked', { valueAsNumber: true })}
                  error={!!errors.hoursWorked}
                  hint={errors.hoursWorked?.message}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-black dark:text-white">
                  Tipo de Actividad *
                </label>
                <Controller
                  name="activityType"
                  control={control}
                  render={({ field }) => (
                    <CustomSelect
                      options={ACTIVITY_TYPES.map(t => ({ value: t.value, label: t.label }))}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Seleccione tipo"
                      error={!!errors.activityType}
                    />
                  )}
                />
                {errors.activityType && (
                  <p className="mt-1 text-xs text-error-500">{errors.activityType.message}</p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-black dark:text-white">
                  Número de Semana
                </label>
                <Input
                  type="number"
                  min="1"
                  max="52"
                  {...register('weekNumber', { valueAsNumber: true })}
                  error={!!errors.weekNumber}
                  hint={errors.weekNumber?.message}
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-black dark:text-white">
                Descripción de la Actividad *
              </label>
              <TextArea
                {...register('activityDescription')}
                placeholder="Describa las actividades realizadas..."
                rows={3}
                error={!!errors.activityDescription}
                hint={errors.activityDescription?.message}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-black dark:text-white">
                Tareas Completadas
              </label>
              <TextArea
                {...register('tasksCompleted')}
                placeholder="Liste las tareas completadas..."
                rows={2}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-black dark:text-white">
                Desafíos Encontrados
              </label>
              <TextArea
                {...register('challenges')}
                placeholder="Describa los desafíos o dificultades..."
                rows={2}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-black dark:text-white">
                Aprendizajes
              </label>
              <TextArea
                {...register('learnings')}
                placeholder="¿Qué aprendió en esta actividad?"
                rows={2}
              />
            </div>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button variant="outline" onClick={handleClose} type="button">
            Cancelar
          </Button>
          <AsyncButton
            type="submit"
            loading={isLoading}
            disabled={!isDirty && isEditing}
          >
            {isEditing ? 'Guardar Cambios' : 'Guardar Registro'}
          </AsyncButton>
        </ModalFooter>
      </form>
    </Modal>
  );
}
