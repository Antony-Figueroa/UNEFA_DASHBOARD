/**
 * @file TrackingModal.tsx
 * @description Modal para el registro y edición de seguimientos de estudiantes.
 */

import { useEffect, useState } from 'react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Tracking } from '../types';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../../components/ui/modal';
import Button from '../../../components/ui/button/Button';
import InputField from '../../../components/form/input/InputField';
import TextArea from '../../../components/form/input/TextArea';
import Select from '../../../components/form/Select';
import { useStudents } from '../../students/hooks/useStudents';
import { useNavigate } from 'react-router';
import { useUnsavedChanges } from '../../../hooks/useUnsavedChanges';
import UnifiedDialog from '../../../components/ui/dialog/UnifiedDialog';

interface TrackingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (tracking: Omit<Tracking, "trackingId" | "creationDate"> | Tracking) => void;
    tracking: Tracking | null;
    isLoading?: boolean;
}

const trackingSchema = z.object({
    studentIdNumber: z.string().min(1, { message: 'La cédula es obligatoria.' }),
    studentName: z.string().min(1, { message: 'El nombre es obligatorio.' }),
    reportTitle: z.string().min(1, { message: 'El título del informe es obligatorio.' }),
    transfer: z.string().min(1, { message: 'Seleccione si hubo traslado.' }),
    route: z.string().min(1, { message: 'El recorrido es obligatorio.' }),
    observations: z.string().optional(),
});

type TrackingFormData = z.infer<typeof trackingSchema>;

export default function TrackingModal({ isOpen, onClose, onSave, tracking, isLoading = false }: TrackingModalProps) {
    const navigate = useNavigate();
    const { students } = useStudents();
    const [isEditing, setIsEditing] = useState(false);
    
    const { register, handleSubmit, formState: { errors, isDirty }, reset, watch, setValue, control } = useForm<TrackingFormData>({
        resolver: zodResolver(trackingSchema),
        defaultValues: {
            studentIdNumber: '',
            studentName: '',
            reportTitle: '',
            transfer: 'false',
            route: '',
            observations: '',
        },
    });

    const {
        showConfirmation,
        handleCloseAttempt,
        confirmClose,
        cancelClose,
    } = useUnsavedChanges(isDirty, onClose);

    const studentIdNumber = watch('studentIdNumber');
    const isNew = !tracking;

    // Autocompletado del nombre basado en la cédula
    useEffect(() => {
        if (studentIdNumber && Array.isArray(students)) {
            const student = students.find(s => s.identificationNumber === studentIdNumber);
            if (student) {
                setValue('studentName', `${student.firstName} ${student.lastName}`);
            }
        }
    }, [studentIdNumber, students, setValue]);

    useEffect(() => {
        if (isOpen) {
            if (tracking) {
                reset({
                    studentIdNumber: tracking.studentIdNumber,
                    studentName: tracking.studentName,
                    reportTitle: tracking.reportTitle,
                    transfer: String(tracking.transfer),
                    route: tracking.route,
                    observations: tracking.observations,
                });
                setIsEditing(false);
            } else {
                reset({
                    studentIdNumber: '',
                    studentName: '',
                    reportTitle: '',
                    transfer: 'false',
                    route: '',
                    observations: '',
                });
                setIsEditing(true);
            }
        }
    }, [tracking, isOpen, reset]);

    const onSubmit: SubmitHandler<TrackingFormData> = (data) => {
        const formattedData: Omit<Tracking, 'trackingId' | 'creationDate'> = {
            studentIdNumber: data.studentIdNumber,
            studentName: data.studentName,
            reportTitle: data.reportTitle,
            transfer: data.transfer === 'true',
            route: data.route,
            observations: data.observations || '',
            status: true,
        };
        
        if (tracking) {
            onSave({ ...tracking, ...formattedData });
        } else {
            onSave(formattedData);
        }
        setIsEditing(false);
    };

    const handleVisitRegister = () => {
        if (tracking?.trackingId) {
            navigate(`/tracking/visits/${tracking.trackingId}`);
        }
    };

    const isDisabled = !isEditing && !!tracking;

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} onCloseAttempt={handleCloseAttempt} showCloseButton>
                <ModalHeader>
                {isNew ? 'Nuevo Seguimiento' : isEditing ? 'Editar Seguimiento' : 'Detalles de Seguimiento'}
            </ModalHeader>
            <form onSubmit={handleSubmit(onSubmit)}>
                <ModalBody>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-text-primary dark:text-white/90">
                                Cédula Estudiante
                            </label>
                            <InputField
                                {...register('studentIdNumber')}
                                error={!!errors.studentIdNumber}
                                hint={errors.studentIdNumber?.message}
                                disabled={isDisabled}
                                placeholder="Ej: 12345678"
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-text-primary dark:text-white/90">
                                Nombre Estudiante
                            </label>
                            <InputField
                                {...register('studentName')}
                                error={!!errors.studentName}
                                hint={errors.studentName?.message}
                                disabled={isDisabled}
                                placeholder="Nombre autocompletado"
                            />
                        </div>
                        <div className="sm:col-span-2 flex flex-col gap-1">
                            <label className="text-sm font-medium text-text-primary dark:text-white/90">
                                Título Informe
                            </label>
                            <TextArea
                                {...register('reportTitle')}
                                error={!!errors.reportTitle}
                                hint={errors.reportTitle?.message}
                                disabled={isDisabled}
                                placeholder="Ingrese el título del informe..."
                                rows={3}
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-text-primary dark:text-white/90">
                                Traslado
                            </label>
                            <Controller
                                name="transfer"
                                control={control}
                                render={({ field }) => (
                                    <Select
                                        disabled={isDisabled}
                                        options={[
                                            { value: 'false', label: 'No' },
                                            { value: 'true', label: 'Sí' },
                                        ]}
                                        onChange={field.onChange}
                                        defaultValue={field.value}
                                    />
                                )}
                            />
                            {errors.transfer && (
                                <p className="text-xs text-error-500">{errors.transfer.message}</p>
                            )}
                        </div>
                        <div className="flex flex-col gap-1">
                            <label className="text-sm font-medium text-text-primary dark:text-white/90">
                                Recorrido
                            </label>
                            <InputField
                                {...register('route')}
                                error={!!errors.route}
                                hint={errors.route?.message}
                                disabled={isDisabled}
                                placeholder="Ej: Ruta 1"
                            />
                        </div>
                        <div className="sm:col-span-2 flex flex-col gap-2">
                            <label className="text-sm font-medium text-text-primary dark:text-white/90">
                                Registro Visitas
                            </label>
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={handleVisitRegister}
                                className="w-full sm:w-auto"
                            >
                                Abrir Registro de Visitas
                            </Button>
                        </div>
                        <div className="sm:col-span-2 flex flex-col gap-1">
                            <label className="text-sm font-medium text-text-primary dark:text-white/90">
                                Observaciones
                            </label>
                            <TextArea
                                {...register('observations')}
                                error={!!errors.observations}
                                hint={errors.observations?.message}
                                disabled={isDisabled}
                                placeholder="Observaciones adicionales..."
                                rows={4}
                            />
                        </div>
                    </div>
                </ModalBody>
                <ModalFooter>
                    <div className="flex justify-end gap-3 w-full">
                        {!isEditing && tracking ? (
                            <Button type="button" onClick={() => setIsEditing(true)}>
                                Editar
                            </Button>
                        ) : (
                            <>
                                <Button type="button" variant="outline" onClick={handleCloseAttempt}>
                                    Cancelar
                                </Button>
                                <Button type="submit" loading={isLoading}>
                                    Guardar
                                </Button>
                            </>
                        )}
                    </div>
                </ModalFooter>
            </form>
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
