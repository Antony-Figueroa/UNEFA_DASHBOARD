/**
 * @file TrackingModal.tsx
 * @description Modal para el registro y edición de seguimientos de estudiantes.
 * Ahora es exclusivamente un modal de creación/edición. La visualización de
 * detalles se maneja desde TrackingDetailModal.
 */

import { useEffect, useState } from 'react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Tracking, CreateTrackingPayload, UpdateTrackingPayload } from '../types';
import { getTrackingById, TrackingDetailDTO } from '../services/trackingService';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../../components/ui/modal';
import { ModalSectionHeader } from '../../../components/ui/modal/ModalSectionHeader';
import Button from '../../../components/ui/button/Button';
import AsyncButton from '../../../components/ui/button/AsyncButton';
import InputField from '../../../components/form/input/InputField';
import TextArea from '../../../components/form/input/TextArea';
import CustomSelect from '../../../components/form/CustomSelect';
import Badge from '../../../components/ui/badge/Badge';
import { useStudents } from '../../students/hooks/useStudents';
import { useLists } from '../../lists/hooks/useLists';
import { useNavigate } from 'react-router';
import { useUnsavedChanges } from '../../../hooks/useUnsavedChanges';
import UnifiedDialog from '../../../components/ui/dialog/UnifiedDialog';
import { useToast } from '../../../context/toast';
import { isSafeInput } from '../../../utils/inputValidation';
import { visitsService } from '../../visits/services/visitsService';
import { Visit } from '../../visits/types';

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
 * Proporciona un formulario para crear o editar registros de seguimiento.
 * Incluye autocompletado de nombre de estudiante basado en la cédula.
 * 
 * @remarks
 * Este modal NO maneja visualización de detalles — eso es responsabilidad
 * de TrackingDetailModal. Siempre está en modo de creación o edición.
 */
export default function TrackingModal({ isOpen, onClose, onSave, tracking, isLoading = false }: TrackingModalProps) {
    const navigate = useNavigate();
    const { students } = useStudents();
    const { fetchMultipleLists } = useLists();
    const { addToast } = useToast();
    const [options, setOptions] = useState<Record<string, { value: string; label: string }[]>>({});
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [pendingData, setPendingData] = useState<TrackingFormData | null>(null);
    const [studentCareer, setStudentCareer] = useState<string>("");
    const [detailData, setDetailData] = useState<TrackingDetailDTO | null>(null);
    const [visits, setVisits] = useState<Visit[]>([]);
    const [visitsLoading, setVisitsLoading] = useState(false);

    // Cargar detalles completos (institución, tutores, etc.) cuando se edita
    useEffect(() => {
        if (isOpen && tracking) {
            const loadDetail = async () => {
                try {
                    const data = await getTrackingById(tracking.trackingId);
                    setDetailData(data);
                } catch (error) {
                    console.error("[TrackingModal] Error al cargar detalles:", error);
                }
            };
            loadDetail();
        } else {
            setDetailData(null);
        }
    }, [isOpen, tracking?.trackingId]);

    // Cargar visitas cuando se edita un seguimiento
    useEffect(() => {
        if (isOpen && tracking?.trackingId) {
            const loadVisits = async () => {
                setVisitsLoading(true);
                try {
                    const response = await visitsService.getVisitsByPractice(Number(tracking.trackingId));
                    setVisits(response.data || []);
                } catch (error) {
                    console.error("[TrackingModal] Error al cargar visitas:", error);
                    setVisits([]);
                } finally {
                    setVisitsLoading(false);
                }
            };
            loadVisits();
        } else {
            setVisits([]);
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
                setStudentCareer(student.career || "");
            } else {
                setStudentCareer("");
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
                setStudentCareer(tracking.careerName || "");
            } else {
                reset({
                    studentIdNumber: '',
                    studentName: '',
                    reportTitle: '',
                    transfer: 'false',
                    route: '',
                    observations: '',
                });
                setStudentCareer("");
            }
        }
    }, [tracking, isOpen, reset]);

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

    /**
     * Formatea una fecha ISO a DD/MM/AAAA HH:mm.
     */
    const formatDateTime = (iso: string): string => {
        try {
            const date = new Date(iso);
            return date.toLocaleDateString("es-VE", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
            });
        } catch {
            return iso;
        }
    };

    /**
     * Obtiene el color del badge según el tipo de visita.
     */
    const getVisitTypeColor = (type: string): "primary" | "success" | "warning" | "info" => {
        const upper = type.toUpperCase();
        if (upper.includes("PRESENCIAL")) return "primary";
        if (upper.includes("VIRTUAL")) return "info";
        if (upper.includes("TELEFONICA")) return "warning";
        return "primary";
    };

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} onCloseAttempt={handleCloseAttempt} showCloseButton size="3xl">
                <ModalHeader className="shrink-0 pt-8 px-6 sm:px-12">
                    {isNew ? 'Nuevo Seguimiento' : 'Editar Seguimiento'}
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
                                    {isNew ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                                            <div className="flex flex-col gap-1">
                                                <label className="text-sm font-medium text-text-primary dark:text-white/90">
                                                    Cédula / ID *
                                                </label>
                                                <InputField
                                                    {...register('studentIdNumber')}
                                                    error={!!errors.studentIdNumber}
                                                    hint={errors.studentIdNumber?.message}
                                                    placeholder="Ej: 12345678"
                                                />
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <label className="text-sm font-medium text-text-primary dark:text-white/90">
                                                    Nombre Completo *
                                                </label>
                                                <InputField
                                                    {...register('studentName')}
                                                    error={!!errors.studentName}
                                                    hint={errors.studentName?.message}
                                                    disabled
                                                    placeholder="Se autocompleta con la cédula"
                                                />
                                            </div>
                                            {studentCareer && (
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-sm font-medium text-text-primary dark:text-white/90">
                                                        Carrera
                                                    </label>
                                                    <p className="text-sm text-text-secondary dark:text-text-tertiary py-2 px-1">
                                                        {studentCareer}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                                            <div>
                                                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">
                                                    Cédula / ID
                                                </label>
                                                <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
                                                    {tracking?.studentIdNumber || "—"}
                                                </p>
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest block mb-1">
                                                    Nombre Completo
                                                </label>
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
                                    )}
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

                            {/* ── Sección: Visitas Realizadas ── */}
                            {tracking && (
                                <div className="space-y-4">
                                    <ModalSectionHeader color="purple-500">
                                        Visitas Realizadas
                                    </ModalSectionHeader>
                                    {visitsLoading ? (
                                        <div className="flex items-center justify-center py-6">
                                            <div className="w-6 h-6 border-2 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
                                            <span className="ml-3 text-sm text-text-secondary">
                                                Cargando visitas...
                                            </span>
                                        </div>
                                    ) : visits.length === 0 ? (
                                        <div className="text-center py-6">
                                            <p className="text-sm font-medium text-text-secondary">
                                                No se registraron visitas para este seguimiento
                                            </p>
                                            <p className="text-xs text-text-tertiary mt-1">
                                                Las visitas aparecerán aquí una vez registradas
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="border-b border-border-light dark:border-white/5">
                                                        <th className="text-left py-2 px-3 text-[10px] font-bold text-text-tertiary uppercase tracking-widest">
                                                            Fecha
                                                        </th>
                                                        <th className="text-left py-2 px-3 text-[10px] font-bold text-text-tertiary uppercase tracking-widest">
                                                            Tipo
                                                        </th>
                                                        <th className="text-left py-2 px-3 text-[10px] font-bold text-text-tertiary uppercase tracking-widest">
                                                            Tutor
                                                        </th>
                                                        <th className="text-center py-2 px-3 text-[10px] font-bold text-text-tertiary uppercase tracking-widest">
                                                            Horas
                                                        </th>
                                                        <th className="text-left py-2 px-3 text-[10px] font-bold text-text-tertiary uppercase tracking-widest">
                                                            Actividades
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border-light dark:divide-white/5">
                                                    {visits.map((visit) => (
                                                        <tr
                                                            key={visit.visitId}
                                                            className="hover:bg-bg-secondary/50 transition-colors"
                                                        >
                                                            <td className="py-2.5 px-3 text-xs font-medium text-text-primary">
                                                                {formatDateTime(visit.visitDate)}
                                                            </td>
                                                            <td className="py-2.5 px-3">
                                                                <Badge color={getVisitTypeColor(visit.visitType)}>
                                                                    {visit.visitType}
                                                                </Badge>
                                                            </td>
                                                            <td className="py-2.5 px-3 text-xs text-text-primary">
                                                                {visit.tutorName}
                                                            </td>
                                                            <td className="py-2.5 px-3 text-xs text-center font-semibold text-text-primary">
                                                                {visit.hoursWorked}h
                                                            </td>
                                                            <td className="py-2.5 px-3 text-xs text-text-secondary max-w-[200px] truncate">
                                                                {visit.activitiesPerformed}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                    <div className="flex justify-end pt-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={handleVisitRegister}
                                            className="w-full sm:w-auto"
                                        >
                                            + Agregar Visita
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </ModalBody>
                    <ModalFooter className="shrink-0 px-6 sm:px-12 py-4 border-t border-border-light dark:border-border-dark">
                        <div className="flex justify-end gap-3 w-full">
                            <Button type="button" variant="outline" onClick={handleCloseAttempt}>
                                Cancelar
                            </Button>
                            <AsyncButton type="submit" loading={isLoading} disabled={!isValid}>
                                {isNew ? 'Guardar Seguimiento' : 'Actualizar Seguimiento'}
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
