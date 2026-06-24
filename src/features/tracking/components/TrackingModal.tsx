/**
 * @file TrackingModal.tsx
 * @description Modal para la edición de seguimientos de estudiantes.
 * La visualización de detalles se maneja desde TrackingDetailModal.
 */

import { useEffect, useState } from 'react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Tracking, UpdateTrackingPayload } from '../types';
import { getTrackingById, TrackingDetailDTO } from '../services/trackingService';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../../components/ui/modal';
import { ModalSectionHeader } from '../../../components/ui/modal/ModalSectionHeader';
import Button from '../../../components/ui/button/Button';
import AsyncButton from '../../../components/ui/button/AsyncButton';
import InputField from '../../../components/form/input/InputField';
import TextArea from '../../../components/form/input/TextArea';
import CustomSelect from '../../../components/form/CustomSelect';
import { useLists } from '../../lists/hooks/useLists';
import { useUnsavedChanges } from '../../../hooks/useUnsavedChanges';
import UnifiedDialog from '../../../components/ui/dialog/UnifiedDialog';
import { CONFIRM_MESSAGES, SYSTEM_DIALOGS } from '../../../components/ui/dialog/DialogConfig';
import { useToast } from '../../../context/toast';
import { isSafeInput } from '../../../utils/inputValidation';


/**
 * Propiedades del componente TrackingModal.
 */
interface TrackingModalProps {
    /** Indica si el modal está visible */
    isOpen: boolean;
    /** Función para cerrar el modal */
    onClose: () => void;
    /** Función para guardar los cambios */
    onSave: (payload: UpdateTrackingPayload) => void;
    /** Registro de seguimiento a editar */
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
    observations: z.string()
        .max(1000, "Las observaciones son demasiado largas")
        .refine(val => isSafeInput(val), { message: "Caracteres no permitidos" })
        .optional(),
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
 * Proporciona un formulario para editar registros de seguimiento existentes.
 * 
 * @remarks
 * Este modal NO maneja visualización de detalles — eso es responsabilidad
 * de TrackingDetailModal.
 */
export default function TrackingModal({ isOpen, onClose, onSave, tracking, isLoading = false }: TrackingModalProps) {
    const { addToast } = useToast();
    const { fetchMultipleLists } = useLists();
    const [options, setOptions] = useState<Record<string, { value: string; label: string }[]>>({});
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [pendingData, setPendingData] = useState<TrackingFormData | null>(null);
    const [studentCareer, setStudentCareer] = useState<string>("");
    const [detailData, setDetailData] = useState<TrackingDetailDTO | null>(null);

    // Cargar detalles completos (institución, tutores, etc.) cuando se edita
    useEffect(() => {
        if (isOpen && tracking) {
            const loadDetail = async () => {
                try {
                    const data = await getTrackingById(tracking.trackingId);
                    setDetailData(data);
                } catch (error) {
                    console.error("[TrackingModal] Error al cargar detalles:", error);
                    addToast({ variant: "error", title: "Error", message: "No se pudieron cargar los detalles del seguimiento." });
                }
            };
            loadDetail();
        } else {
            setDetailData(null);
        }
    }, [isOpen, tracking?.trackingId]);

    // Cargar opciones dinámicas desde el servicio de listas
    useEffect(() => {
        const loadOptions = async () => {
            try {
                const data = await fetchMultipleLists(['Traslado']);
                if (data['Traslado']) {
                    setOptions({
                        'Traslado': data['Traslado'].map(v => ({
                            value: v.name.toLowerCase(),
                            label: v.name.charAt(0).toUpperCase() + v.name.slice(1).toLowerCase()
                        }))
                    });
                }
            } catch (error) {
                console.error("[TrackingModal] Error al cargar opciones de lista:", error);
                addToast({ variant: "error", title: "Error", message: "No se pudieron cargar las opciones del formulario." });
            }
        };

        if (isOpen) {
            loadOptions();
        }
    }, [isOpen, fetchMultipleLists]);
    
    const { register, handleSubmit, formState: { errors, isDirty, isValid }, reset, control, trigger } = useForm<TrackingFormData>({
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

    // Resetear formulario al abrir/cerrar o cambiar de registro
    useEffect(() => {
        if (isOpen && tracking) {
            reset({
                studentIdNumber: tracking.studentIdNumber,
                studentName: tracking.studentName,
                reportTitle: tracking.reportTitle,
                transfer: String(tracking.transfer),
                route: tracking.route,
                observations: tracking.observations || '',
            });
            setStudentCareer(tracking.careerName || "");
            
            // Forzar validación para que isValid se actualice
            trigger();
        }
    }, [tracking, isOpen, reset, trigger]);

    /**
     * Maneja el envío del formulario.
     */
    const onSubmit: SubmitHandler<TrackingFormData> = (data) => {
        setPendingData(data);
        setShowConfirmDialog(true);
    };

    const handleConfirmSave = async () => {
        if (!pendingData) return;
        const data = pendingData;
        
        try {
            const payload: UpdateTrackingPayload = {
                trackingId: tracking!.trackingId,
                studentIdNumber: data.studentIdNumber,
                studentName: data.studentName || "",
                reportTitle: data.reportTitle || "",
                transfer: data.transfer === 'true',
                route: data.route || "",
                observations: data.observations || '',
            };
            
            await onSave(payload);
            setShowConfirmDialog(false);
            setPendingData(null);
        } catch (error) {
            console.error("[TrackingModal] Error al procesar el envío del formulario:", error);
            addToast({ variant: "error", title: "Error", message: "No se pudo guardar el seguimiento." });
        }
    };

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} onCloseAttempt={handleCloseAttempt} showCloseButton size="3xl">
                <ModalHeader className="shrink-0 pt-8 px-6 sm:px-12">
                    Editar Seguimiento
                </ModalHeader>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <ModalBody>
                        <div className="space-y-8">
                            {/* ── Sección: Datos del Estudiante ── */}
                            <div className="space-y-3">
                                <ModalSectionHeader color="blue-500">
                                    Datos del Estudiante
                                </ModalSectionHeader>
                                <div className="rounded-xl bg-bg-secondary/50 dark:bg-white/3 p-5">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                                        <div>
                                            <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">
                                                Cédula / ID
                                            </label>
                                            <input type="hidden" {...register('studentIdNumber')} />
                                            <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
                                                {tracking?.studentIdNumber || "—"}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">
                                                Nombre Completo
                                            </label>
                                            <input type="hidden" {...register('studentName')} />
                                            <p className="text-sm font-semibold text-text-primary dark:text-white/90">
                                                {tracking?.studentName || "—"}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">
                                                Carrera
                                            </label>
                                            <p className="text-sm font-semibold text-text-primary dark:text-white/90">
                                                {detailData?.careerName || studentCareer || "—"}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">
                                                Institución
                                            </label>
                                            <p className="text-sm font-semibold text-text-primary dark:text-white/90">
                                                {detailData?.institutionName || "—"}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ── Sección: Datos del Seguimiento ── */}
                            <div className="space-y-4">
                                <ModalSectionHeader color="brand-500">
                                    Datos del Seguimiento
                                </ModalSectionHeader>
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div className="sm:col-span-2 flex flex-col gap-1">
                                        <label className="text-sm font-medium text-text-primary dark:text-white/90">
                                            Título del Informe *
                                        </label>
                                        <TextArea
                                            {...register('reportTitle')}
                                            error={!!errors.reportTitle}
                                            hint={errors.reportTitle?.message}
                                            placeholder="Ingrese el título del informe..."
                                            rows={3}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-sm font-medium text-text-primary dark:text-white/90">
                                            Traslado *
                                        </label>
                                        <Controller
                                            name="transfer"
                                            control={control}
                                            render={({ field }) => (
                                                <CustomSelect
                                                    id="transfer"
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
                                            Recorrido *
                                        </label>
                                        <InputField
                                            {...register('route')}
                                            error={!!errors.route}
                                            hint={errors.route?.message}
                                            placeholder="Ej: Ruta 1"
                                        />
                                    </div>
                                    <div className="sm:col-span-2 flex flex-col gap-1">
                                        <label className="text-sm font-medium text-text-primary dark:text-white/90">
                                            Observaciones
                                        </label>
                                        <TextArea
                                            {...register('observations')}
                                            error={!!errors.observations}
                                            hint={errors.observations?.message}
                                            placeholder="Observaciones adicionales..."
                                            rows={4}
                                        />
                                    </div>
                                </div>
                            </div>

                        </div>
                    </ModalBody>
                    <ModalFooter className="shrink-0 px-6 sm:px-12 py-4 border-t border-border-light dark:border-border-dark">
                        <div className="flex justify-end gap-3 w-full">
                            <Button type="button" variant="outline" onClick={handleCloseAttempt}>
                                Cancelar
                            </Button>
                            <AsyncButton type="submit" loading={isLoading} disabled={!isValid || !isDirty}>
                                Guardar Cambios
                            </AsyncButton>
                        </div>
                    </ModalFooter>
                </form>
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
                variant="confirm"
                {...CONFIRM_MESSAGES.update('Seguimiento del estudiante')}
                isLoading={isLoading}
            />
        </>
    );
}
