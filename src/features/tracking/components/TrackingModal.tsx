/**
 * @file TrackingModal.tsx
 * @description Modal para el registro y edición de seguimientos de estudiantes.
 */

import { useEffect, useState } from 'react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Tracking, CreateTrackingPayload, UpdateTrackingPayload } from '../types';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../../components/ui/modal';
import Button from '../../../components/ui/button/Button';
import AsyncButton from '../../../components/ui/button/AsyncButton';
import InputField from '../../../components/form/input/InputField';
import TextArea from '../../../components/form/input/TextArea';
import CustomSelect from '../../../components/form/CustomSelect';
import { useStudents } from '../../students/hooks/useStudents';
import { useLists } from '../../lists/hooks/useLists';
import { useNavigate } from 'react-router';
import { useUnsavedChanges } from '../../../hooks/useUnsavedChanges';
import UnifiedDialog from '../../../components/ui/dialog/UnifiedDialog';
import { useToast } from '../../../context/toast';

/**
 * Propiedades del componente TrackingModal.
 */
interface TrackingModalProps {
    /** Indica si el modal está visible */
    isOpen: boolean;
    /** Función para cerrar el modal */
    onClose: () => void;
    /** Función para guardar los cambios (creación o actualización) */
    onSave: (payload: CreateTrackingPayload | UpdateTrackingPayload) => void;
    /** Registro de seguimiento a editar (null para creación) */
    tracking: Tracking | null;
    /** Indica si hay una operación de guardado en curso */
    isLoading?: boolean;
}

/**
 * Esquema de validación para el formulario de seguimiento.
 */
const trackingSchema = z.object({
    studentIdNumber: z.string().min(1, { message: 'La cédula es obligatoria.' }),
    studentName: z.string().min(1, { message: 'El nombre es obligatorio.' }),
    reportTitle: z.string().min(1, { message: 'El título del informe es obligatorio.' }),
    transfer: z.string().min(1, { message: 'Seleccione si hubo traslado.' }),
    route: z.string().min(1, { message: 'El recorrido es obligatorio.' }),
    observations: z.string().optional(),
});

/**
 * Tipo de datos inferido del esquema de validación.
 */
type TrackingFormData = z.infer<typeof trackingSchema>;

/**
 * Opciones por defecto para el campo de traslado.
 */
const TRANSFER_OPTIONS = [
    { value: 'false', label: 'No' },
    { value: 'true', label: 'Sí' },
];

/**
 * Componente TrackingModal.
 * 
 * Proporciona un formulario para crear o editar registros de seguimiento.
 * Incluye autocompletado de nombre de estudiante basado en la cédula.
 */
export default function TrackingModal({ isOpen, onClose, onSave, tracking, isLoading = false }: TrackingModalProps) {
    const navigate = useNavigate();
    const { students } = useStudents();
    const { fetchMultipleLists } = useLists();
    const { addToast } = useToast();
    const [isEditing, setIsEditing] = useState(false);
    const [options, setOptions] = useState<Record<string, { value: string; label: string }[]>>({});
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [pendingData, setPendingData] = useState<TrackingFormData | null>(null);

    // Cargar opciones dinámicas desde el servicio de listas
    useEffect(() => {
        const loadOptions = async () => {
            try {
                const data = await fetchMultipleLists(['Traslado']);
                if (data['Traslado']) {
                    setOptions({
                        'Traslado': data['Traslado'].map(v => ({
                            value: v.name.toLowerCase(), // 'true'/'false'
                            label: v.name.charAt(0).toUpperCase() + v.name.slice(1).toLowerCase() // 'Sí'/'No'
                        }))
                    });
                }
            } catch (error) {
                console.error("[TrackingModal] Error al cargar opciones de lista:", error);
            }
        };

        if (isOpen) {
            loadOptions();
        }
    }, [isOpen, fetchMultipleLists]);
    
    const { register, handleSubmit, formState: { errors, isDirty, isValid }, reset, watch, setValue, control } = useForm<TrackingFormData>({
        resolver: zodResolver(trackingSchema),
        mode: "onChange",
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

    // Resetear formulario al abrir/cerrar o cambiar de registro
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

    /**
     * Maneja el envío del formulario.
     * 
     * @param data - Datos del formulario validados.
     */
    const onSubmit: SubmitHandler<TrackingFormData> = (data) => {
        setPendingData(data);
        setShowConfirmDialog(true);
    };

    const handleConfirmSave = async () => {
        if (!pendingData) return;
        const data = pendingData;
        
        try {
            const payload: CreateTrackingPayload | UpdateTrackingPayload = {
                studentIdNumber: data.studentIdNumber,
                studentName: (data.studentName || "").toUpperCase(),
                reportTitle: (data.reportTitle || "").toUpperCase(),
                transfer: data.transfer === 'true',
                route: (data.route || "").toUpperCase(),
                observations: (data.observations || '').toUpperCase(),
            };
            
            if (tracking) {
                (payload as UpdateTrackingPayload).trackingId = tracking.trackingId;
            }
            
            await onSave(payload);
            setIsEditing(false);
            setShowConfirmDialog(false);
            setPendingData(null);
        } catch (error) {
            console.error("[TrackingModal] Error al procesar el envío del formulario:", error);
            addToast({
                variant: "error",
                title: "Error de Validación",
                message: "Por favor, revise los datos ingresados en el formulario."
            });
        }
    };

    /**
     * Navega a la página de registro de visitas para el seguimiento actual.
     */
    const handleVisitRegister = () => {
        if (tracking?.trackingId) {
            navigate(`/visit-registration/${tracking.trackingId}`);
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
                                    <CustomSelect
                                        id="transfer"
                                        disabled={isDisabled}
                                        options={(options['Traslado'] || TRANSFER_OPTIONS).map(opt => ({ value: String(opt.value), label: opt.label }))}
                                        onChange={field.onChange}
                                        value={String(field.value)}
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
                                <AsyncButton type="submit" loading={isLoading} disabled={tracking ? !isDirty || !isValid : !isValid}>
                                    Guardar
                                </AsyncButton>
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

            <UnifiedDialog
                isOpen={showConfirmDialog}
                onClose={() => {
                    setShowConfirmDialog(false);
                    setPendingData(null);
                }}
                onConfirm={handleConfirmSave}
                title={tracking ? "Actualizar Seguimiento" : "Registrar Seguimiento"}
                message={`¿Estás seguro de que deseas ${tracking ? 'actualizar' : 'guardar'} el seguimiento del estudiante?`}
                variant="confirm"
                confirmLabel={tracking ? "Actualizar" : "Guardar"}
                isLoading={isLoading}
            />
        </>
    );
}
