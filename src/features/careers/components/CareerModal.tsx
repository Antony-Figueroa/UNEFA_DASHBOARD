/**
 * @file CareerModal.tsx
 * @description Modal para la creación y edición de Carreras.
 * Implementa validaciones complejas con Zod, manejo de estado de formulario con React Hook Form,
 * y protección contra pérdida de cambios no guardados.
 */

import { useState, useEffect, useMemo, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Input from "../../../components/form/input/InputField";
import CustomSelect from "../../../components/form/CustomSelect";
import MultiSelect from "../../../components/form/MultiSelect";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../../components/ui/modal";
import { Career } from "../types";
import Button from "../../../components/ui/button/Button";

import { useUnsavedChanges } from "../../../hooks/useUnsavedChanges";
import UnifiedDialog from "../../../components/ui/dialog/UnifiedDialog";
import { CONFIRM_MESSAGES, SYSTEM_DIALOGS } from "../../../components/ui/dialog/DialogConfig";
import Badge from "../../../components/ui/badge/Badge";
import { NAME_PATTERN, SAFE_TEXT_PATTERN, isSafeInput } from "../../../utils/inputValidation";

import { InternshipTypeOption } from "../../internship-types/types";
import { getCareerByCode } from "../services/careersService";
import { getListByName } from "../../lists/services/listsService";

/**
 * Propiedades del componente CareerModal.
 */
interface CareerModalProps {
  /** Indica si el modal está visible */
  isOpen: boolean;
  /** Función para cerrar el modal */
  onClose: () => void;
  /** Función que se llama al guardar los datos (crear o editar) */
  onSave: (career: Omit<Career, "careerId" | "creationDate">) => Promise<void> | void;
  /** Objeto de la carrera en edición (null si es creación) */
  editingCareer?: Career | null;
  /** Opciones de tipos de pasantías disponibles */
  internshipOptions: InternshipTypeOption[];
  /** Indica si hay una operación asíncrona en curso */
  isLoading?: boolean;
  /** Indica si la carrera tiene evaluaciones pendientes (restricción de edición) */
  hasPendingEvaluations?: boolean;
  /** Indica si la carrera ya está siendo usada por estudiantes/procesos */
  isInUse?: boolean;
  /** Lista de carreras existentes para validación de duplicados */
  existingCareers?: Career[];
  onAddInternshipType?: () => void;
  lastCreatedInternshipTypeId?: string | number | null;
  onConsumeLastCreatedInternshipType?: () => void;
  /** Callback cuando se quiere editar un registro existente (convierte de crear a editar) */
  onEditExisting?: (career: Career) => void;
}

/**
 * Esquema de validación para el formulario de Carreras.
 * @param existingCareers - Lista de carreras para validar unicidad.
 * @param editingCareerId - ID de la carrera actual (para ignorarla en validación de duplicados).
 */
const createCareerSchema = (existingCareers: Career[], editingCareerId?: string | number) => 
  z.object({
    careerName: z.string()
      .min(1, "El nombre de la carrera es obligatorio")
      .max(100, "El nombre es demasiado largo")
      .regex(NAME_PATTERN, "Solo letras y espacios")
      .refine(val => isSafeInput(val), { message: "Caracteres no permitidos" })
      .transform(val => val.toUpperCase())
      .refine(val => {
        const normalizedVal = val.trim().toUpperCase();
        return !existingCareers.some(c => 
          c.careerName.trim().toUpperCase() === normalizedVal && 
          String(c.careerId) !== String(editingCareerId)
        );
      }, "Ya existe una carrera con este nombre"),
    careerCode: z.string()
      .min(1, "El código es obligatorio")
      .max(8, "El código no puede tener más de 8 números")
      .regex(/^\d+$/, "El código solo permite números")
      .refine(val => {
        const normalizedVal = val.trim();
        return !existingCareers.some(c => 
          String(c.careerCode).trim() === normalizedVal && 
          String(c.careerId) !== String(editingCareerId)
        );
      }, "Ya existe una carrera con este código"),
    minimumGrade: z.string().min(1, "Debe seleccionar una nota mínima"),
    careerAbbreviation: z.string()
      .min(1, "La abreviatura es obligatoria")
      .max(50, "La abreviatura es demasiado larga")
      .regex(SAFE_TEXT_PATTERN, "Caracteres no permitidos")
      .refine(val => isSafeInput(val), { message: "Caracteres no permitidos" })
      .transform(val => val.toUpperCase()),
    careerType: z.enum(['CORTA', 'LARGA'], {
      message: "Debe seleccionar un tipo de carrera"
    }),
    semester: z.string().min(1, "Debe seleccionar un semestre"),
    internshipTypeIds: z.array(z.string()).min(1, "Debe seleccionar al menos un tipo de práctica"),
  });

type CareerFormData = z.infer<ReturnType<typeof createCareerSchema>>;

/**
 * Opciones para la nota mínima (1 a 20).
 */
const gradeOptions = Array.from({ length: 20 }, (_, i) => ({
  value: String(i + 1),
  label: String(i + 1)
}));

/**
 * Opciones para el tipo de carrera.
 */
const careerTypeOptions = [
  { value: 'CORTA', label: 'CORTA' },
  { value: 'LARGA', label: 'LARGA' }
];

/**
 * Componente CareerModal.
 * Maneja el ciclo de vida del formulario de carreras, incluyendo inicialización y limpieza.
 */
export default function CareerModal({
  isOpen,
  onClose,
  onSave,
  editingCareer,
  internshipOptions,
  isLoading = false,
  hasPendingEvaluations = false,
  isInUse = false,
  existingCareers = [],
  onAddInternshipType,
  lastCreatedInternshipTypeId,
  onConsumeLastCreatedInternshipType,
  onEditExisting,
}: CareerModalProps) {
  // Ref para evitar lecturas de estado desactualizadas durante la inicialización del modal
  const isInitializing = useRef(false);

  // Estado para verificar si el código ya existe
  const [isCheckingCode, setIsCheckingCode] = useState(false);
  // Estado para carrera existente (cuando se detecta duplicado)
  const [existingCareer, setExistingCareer] = useState<Career | null>(null);
  // Estado para modo solo lectura (cuando se detecta duplicado)
  const [viewOnlyMode, setViewOnlyMode] = useState(false);
  // Estado para evitar que el efecto自动 establezca默认值 después de limpiar
  const [justCleared, setJustCleared] = useState(false);

  // Estado para opciones de semestre (cargadas dinámicamente desde t_list)
  const [semesterOptions, setSemesterOptions] = useState<{ value: string; label: string }[]>([]);

  // Cargar opciones de semestre desde la base de datos
  useEffect(() => {
    const loadSemesterOptions = async () => {
      try {
        const semesterList = await getListByName('SEMESTRE');
        const options = (semesterList.values || []).map((v: any) => ({
          value: v.name,
          label: v.name
        }));
        setSemesterOptions(options);
      } catch (error) {
        console.error('[CareerModal] Error loading semester options:', error);
      }
    };
    loadSemesterOptions();
  }, []);

  // Manejar cambio en el código de carrera
  const handleCareerCodeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const codeOnly = input.replace(/\D/g, '').substring(0, 8);
    
    // Si el usuario modifica el código, salir del modo viewOnly y limpiar el formulario
    if (existingCareer && viewOnlyMode) {
      const currentStoredCode = String(existingCareer.careerCode || '');
      if (codeOnly !== currentStoredCode) {
        setExistingCareer(null);
        setViewOnlyMode(false);
        setJustCleared(true);
        // Limpiar los campos del formulario
        setValue("careerCode", codeOnly, { shouldValidate: false });
        setValue("careerName", "", { shouldValidate: false });
        setValue("careerAbbreviation", "", { shouldValidate: false });
        setValue("minimumGrade", "", { shouldValidate: false });
        setValue("careerType", "" as any, { shouldValidate: false });
        setValue("internshipTypeIds", [], { shouldValidate: false });
        
        // Resetear el flag después de un tick
        setTimeout(() => setJustCleared(false), 0);
      }
    }
    
    // Verificar en background cuando el código tiene 4-5 dígitos
    if (!existingCareer && !editingCareer && codeOnly.length >= 4 && codeOnly.length <= 5) {
      setIsCheckingCode(true);
      try {
        const existingCareerData = await getCareerByCode(codeOnly);
        if (existingCareerData) {
          setExistingCareer(existingCareerData);
          setViewOnlyMode(true);
          
          // Llenar TODOS los campos EXCEPTO careerCode (el usuario lo está escribiendo)
          // NO usar shouldValidate para que Zod no dispare el error de duplicado
          setValue("careerName", existingCareerData.careerName || "", { shouldDirty: true });
          setValue("minimumGrade", String(Math.floor(existingCareerData.minimumGrade || 0)), { shouldDirty: true });
          setValue("careerAbbreviation", existingCareerData.careerAbbreviation || "", { shouldDirty: true });
          setValue("careerType", existingCareerData.careerType as 'CORTA' | 'LARGA', { shouldDirty: true });
          setValue("internshipTypeIds", (existingCareerData.internshipTypeIds || []).map(String), { shouldDirty: true });
          setValue("semester", existingCareerData.semester || "", { shouldDirty: true });
          
          // Limpiar errores de validación ya que los datos autocompletados
          // pertenecen a la misma carrera existente (no es un duplicado real)
          clearErrors();
        } else {
          setExistingCareer(null);
          setViewOnlyMode(false);
        }
      } catch {
        setExistingCareer(null);
        setViewOnlyMode(false);
      } finally {
        setIsCheckingCode(false);
      }
    } else if (codeOnly.length < 4) {
      setExistingCareer(null);
      setViewOnlyMode(false);
    }
  };

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    getValues,
    clearErrors,
    formState: { errors, isDirty, isValid },
  } = useForm<CareerFormData>({
    resolver: zodResolver(createCareerSchema(existingCareers, editingCareer?.careerId ?? existingCareer?.careerId)),
    mode: "all",
    defaultValues: {
      careerName: "",
      careerCode: "",
      minimumGrade: "",
      careerAbbreviation: "",
      careerType: undefined,
      semester: "",
      internshipTypeIds: [],
    },
  });

  const careerCode = watch("careerCode");
  const minimumGrade = watch("minimumGrade");

  // Efecto para establecer automáticamente la nota mínima en 16 al escribir el código
  useEffect(() => {
    // No establecer默认值 si acabamos de limpiar (justCleared) o si el campo ya tiene valor
    if (justCleared || minimumGrade) {
      return;
    }
    if (!editingCareer && careerCode && careerCode.length > 0) {
      setValue("minimumGrade", "16", { shouldValidate: true });
    }
  }, [careerCode, minimumGrade, setValue, editingCareer, justCleared]);

  const {
    showConfirmation,
    handleCloseAttempt,
    confirmClose,
    cancelClose,
  } = useUnsavedChanges(isDirty, onClose);

  // Estado para la confirmación de guardado
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  const [pendingData, setPendingData] = useState<CareerFormData | null>(null);

  useEffect(() => {
    if (isOpen) {
      isInitializing.current = true;
      // Limpiar estados de duplicado al abrir
      setExistingCareer(null);
      setViewOnlyMode(false);
      
      if (editingCareer) {
        reset({
          careerName: editingCareer.careerName,
          careerCode: String(editingCareer.careerCode),
          minimumGrade: String(Math.floor(editingCareer.minimumGrade)),
          careerAbbreviation: editingCareer.careerAbbreviation,
          careerType: editingCareer.careerType as 'CORTA' | 'LARGA',
          semester: editingCareer.semester || "",
          internshipTypeIds: (editingCareer.internshipTypeIds ?? []).map(String),
        });
      } else {
        reset({
          careerName: "",
          careerCode: "",
          minimumGrade: "",
          careerAbbreviation: "",
          careerType: undefined,
          semester: "",
          internshipTypeIds: [],
        });
      }
      // Pequeño delay para asegurar que el reset se procese antes de permitir otros efectos
      setTimeout(() => {
        isInitializing.current = false;
      }, 50);
    } else {
      reset();
      isInitializing.current = false;
    }
  }, [editingCareer, isOpen, reset]);

  useEffect(() => {
    if (lastCreatedInternshipTypeId && onConsumeLastCreatedInternshipType) {
      const currentIds = getValues("internshipTypeIds") || [];
      const newIdStr = String(lastCreatedInternshipTypeId);
      if (!currentIds.includes(newIdStr)) {
        setValue("internshipTypeIds", [...currentIds, newIdStr], { shouldValidate: true, shouldDirty: true });
      }
      onConsumeLastCreatedInternshipType();
    }
  }, [lastCreatedInternshipTypeId, onConsumeLastCreatedInternshipType, setValue, getValues]);

  const onSubmit = (data: CareerFormData) => {
    setPendingData(data);
    setShowSaveConfirmation(true);
  };

  const handleConfirmSave = async () => {
    if (pendingData) {
      await onSave({
        careerName: pendingData.careerName.toUpperCase(),
        careerCode: pendingData.careerCode.toUpperCase(),
        careerAbbreviation: pendingData.careerAbbreviation.toUpperCase(),
        careerType: pendingData.careerType,
        semester: pendingData.semester,
        internshipTypeIds: pendingData.internshipTypeIds || [],
        minimumGrade: Number(pendingData.minimumGrade),
        status: editingCareer?.status ?? 1,
      } as Omit<Career, "careerId" | "creationDate">);
      setShowSaveConfirmation(false);
    }
  };

  // Cleanup cuando se cierra el modal
  useEffect(() => {
    if (!isOpen) {
      setExistingCareer(null);
      setViewOnlyMode(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    setExistingCareer(null);
    setViewOnlyMode(false);
    onClose();
  };

  // Mapear opciones para que el value sea el ID (necesario para MultiSelect en este modal)
  const mappedInternshipOptions = useMemo(() => 
    internshipOptions.map(opt => ({
      ...opt,
      value: String(opt.id)
    })), 
    [internshipOptions]
  );

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        onCloseAttempt={handleCloseAttempt}
        showCloseButton
      >
        <ModalHeader>
          <div className="max-w-4xl mx-auto w-full">
            <span className="mb-1 font-semibold text-text-primary modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
              {editingCareer ? "Editar Carrera" : "Registrar Carrera"}
            </span>
            <p className="text-sm text-text-secondary dark:text-text-tertiary font-normal">
              {editingCareer ? "Modifica los detalles de la carrera académica." : "Ingresa los detalles de la nueva carrera académica."}
            </p>
          </div>
        </ModalHeader>

      <ModalBody className="bg-bg-secondary/30 dark:bg-bg-dark/50">
        <form id="career-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-4xl mx-auto">
          {isInUse && (
            <div className="rounded-xl border border-warning-200 bg-warning-50 p-4 dark:border-warning-400/20 dark:bg-warning-400/10 animate-fadeIn">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 text-warning-600 dark:text-warning-400">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-5 w-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-warning-800 dark:text-warning-300">Aviso: Carrera en Uso</h3>
                  <div className="mt-1 text-xs text-warning-700 dark:text-warning-400 leading-relaxed">
                    Esta carrera está siendo utilizada por estudiantes o instituciones. Solo se permite editar:
                    <ul className="mt-1 list-disc list-inside space-y-0.5 font-medium">
                      <li>Nombre de la carrera</li>
                      <li>Abreviatura</li>
                      <li>Nota mínima (solo si no hay estudiantes en evaluación)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

           <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
             {existingCareer && viewOnlyMode && (
               <div className="md:col-span-2 flex items-center space-x-3 p-3 bg-warning-50 dark:bg-warning-500/10 border border-warning-200 dark:border-warning-500/20 rounded-lg">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-warning-700 dark:text-warning-400" viewBox="0 0 20 20" fill="currentColor">
                   <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.492-1.646-1.742-2.98l5.58-9.92zM11 13a1 1 0 10-2 0v-3a1 1 0 112 0v3zm-1-8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                 </svg>
                 <span className="text-sm font-medium text-warning-700 dark:text-warning-400">
                   Registro existente - Click en 'Editar Registro' para modificar
                 </span>
               </div>
             )}
             <div className="md:col-span-2">
               <label className="text-sm font-medium text-text-primary dark:text-white/90">Código <span className="text-red-500">*</span></label>
               <Input
                 {...register("careerCode")}
                 type="text"
                 placeholder="Ej: 0501"
                 maxLength={5}
                 error={!!errors.careerCode}
                hint={errors.careerCode?.message}
                 disabled={!!editingCareer}
                 onChange={(e) => {
                   e.target.value = e.target.value.replace(/\D/g, '');
                   register("careerCode").onChange(e);
                   handleCareerCodeChange(e);
                 }}
               />
               {editingCareer && (
                 <p className="mt-1 text-[10px] text-text-tertiary italic">El código no es editable.</p>
               )}
             </div>

            <div className="md:col-span-2">
              <label className="text-sm font-medium text-text-primary dark:text-white/90">Nombre de la Carrera <span className="text-red-500">*</span></label>
              <Input
                {...register("careerName")}
                placeholder="Ej: INGENIERÍA DE SISTEMAS"
                error={!!errors.careerName}
                hint={errors.careerName?.message}
                disabled={viewOnlyMode}
                onChange={(e) => {
                  e.target.value = e.target.value.replace(/[0-9]/g, '').toUpperCase();
                  register("careerName").onChange(e);
                  setValue("careerName", e.target.value, { shouldDirty: true, shouldValidate: true });
                }}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-text-primary dark:text-white/90">Tipo de Carrera <span className="text-red-500">*</span></label>
              <Controller
                name="careerType"
                control={control}
                render={({ field }) => (
                  <CustomSelect
                    options={careerTypeOptions}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="Seleccione tipo"
                    disabled={isInUse || viewOnlyMode}
                    error={!!errors.careerType}
                  />
                )}
              />
              {isInUse && (
                <p className="mt-1 text-[10px] text-text-tertiary italic uppercase font-bold tracking-tighter opacity-70">Bloqueado por uso</p>
              )}
              {errors.careerType && (
                <p className="mt-1 text-xs text-error-500 font-medium">{errors.careerType.message}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-text-primary dark:text-white/90">Semestre <span className="text-red-500">*</span></label>
              <Controller
                name="semester"
                control={control}
                render={({ field }) => (
                  <CustomSelect
                    options={semesterOptions}
                    value={field.value}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="Seleccione semestre"
                    disabled={viewOnlyMode}
                    error={!!errors.semester}
                  />
                )}
              />
              {errors.semester && (
                <p className="mt-1 text-xs text-error-500 font-medium">{errors.semester.message}</p>
              )}
            </div>

            <div>
              <label className="text-sm font-medium text-text-primary dark:text-white/90">Nota mínima <span className="text-red-500">*</span></label>
              <Controller
                name="minimumGrade"
                control={control}
                render={({ field }) => (
                  <CustomSelect
                      options={gradeOptions}
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      placeholder="Seleccione Nota Mínima"
                      disabled={(isInUse && hasPendingEvaluations) || viewOnlyMode}
                      error={!!errors.minimumGrade}
                    />
                  )}
              />
                {isInUse && hasPendingEvaluations && (
                  <p className="mt-1 text-xs text-warning-600 dark:text-warning-400 font-medium italic">
                    Bloqueado: Estudiantes en proceso de evaluación.
                  </p>
                )}
                {errors.minimumGrade && (
                <p className="mt-1 text-xs text-error-500 font-medium">{errors.minimumGrade.message}</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-text-primary dark:text-white/90">Abreviatura <span className="text-red-500">*</span></label>
              <Input
                {...register("careerAbbreviation")}
                type="text"
                placeholder="Ej: TSU-ENF"
                error={!!errors.careerAbbreviation}
                hint={errors.careerAbbreviation?.message}
                disabled={viewOnlyMode}
                onChange={(e) => {
                  e.target.value = e.target.value.replace(/[0-9]/g, '').toUpperCase();
                  register("careerAbbreviation").onChange(e);
                  setValue("careerAbbreviation", e.target.value, { shouldDirty: true, shouldValidate: true });
                }}
              />
            </div>
            <div className="md:col-span-2">
              <Controller
                name="internshipTypeIds"
                control={control}
                render={({ field }) => (
                  <MultiSelect
                    label={<span>Tipos de Prácticas <span className="text-red-500">*</span></span>}
                    options={mappedInternshipOptions}
                    value={field.value}
                    onBlur={field.onBlur}
                    onChange={(selectedIds: string[]) => {
                      // IDs según base de datos: 1 (ÚNICA), 2 (HOSPITALARIA), 3 (COMUNITARIA)
                      const lastSelected = selectedIds[selectedIds.length - 1];
                      const wasSelected = field.value || [];
                      
                      // Caso 1: Se selecciona 'ÚNICA' (ID "1")
                      if (lastSelected === "1") {
                        field.onChange(["1"]);
                        return;
                      }

                      // Caso 2: Se selecciona Hospitalaria (2) o Comunitaria (3)
                      const justSelectedHosp = selectedIds.includes("2") && !wasSelected.includes("2");
                      const justSelectedComu = selectedIds.includes("3") && !wasSelected.includes("3");

                      if (justSelectedHosp || justSelectedComu) {
                        // Se activan ambos y se quita ÚNICA
                        field.onChange(["2", "3"]);
                        return;
                      }

                      // Caso 3: Se deselecciona Hospitalaria (2) o Comunitaria (3)
                      const justDeselectedHosp = wasSelected.includes("2") && !selectedIds.includes("2");
                      const justDeselectedComu = wasSelected.includes("3") && !selectedIds.includes("3");

                      if (justDeselectedHosp || justDeselectedComu) {
                        // Se quitan ambos
                        field.onChange(selectedIds.filter(id => id !== "2" && id !== "3"));
                        return;
                      }

                      // Caso por defecto (deselección de ÚNICA o lista vacía)
                      field.onChange(selectedIds);
                    }}
                    placeholder="Seleccione tipos de prácticas"
                    disabled={hasPendingEvaluations || isInUse || viewOnlyMode}
                    error={!!errors.internshipTypeIds}
                    onAddNew={onAddInternshipType}
                    addNewLabel="Nuevo tipo de práctica"
                  />
                )}
              />
              {isInUse && (
                <p className="mt-1 text-[10px] text-text-tertiary italic uppercase font-bold tracking-tighter opacity-70">Bloqueado por uso</p>
              )}
              {errors.internshipTypeIds && (
                <p className="mt-1 text-xs text-error-500 font-medium">{errors.internshipTypeIds.message}</p>
              )}
            </div>
          </div>
        </form>
      </ModalBody>

      <ModalFooter className="shrink-0 px-6 sm:px-12 py-6 bg-white dark:bg-bg-dark border-t border-border-light dark:border-border-dark">
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 w-full max-w-4xl mx-auto">
          <Button variant="outline" onClick={handleCloseAttempt} disabled={isLoading} className="w-full sm:w-auto min-h-12">
            Cancelar
          </Button>
          {existingCareer ? (
            viewOnlyMode ? (
              <Button 
                type="button"
                className="w-full sm:w-auto min-h-12 bg-warning-500 hover:bg-warning-600 text-white"
                onClick={() => {
                  if (onEditExisting) {
                    onEditExisting(existingCareer);
                  } else {
                    setViewOnlyMode(false);
                  }
                }}
              >
                Habilitar Edición
              </Button>
            ) : (
              <Button type="submit" form="career-form" loading={isLoading} loadingText="Guardando..." className="w-full sm:w-auto min-h-12" disabled={!isValid}>
                Guardar Cambios
              </Button>
            )
          ) : (
            <Button type="submit" form="career-form" loading={isLoading} loadingText="Guardando..." className="w-full sm:w-auto min-h-12" disabled={!isValid || (editingCareer ? !isDirty : false)}>
              {editingCareer ? "Guardar Cambios" : "Guardar Carrera"}
            </Button>
          )}
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
        isOpen={showSaveConfirmation}
        onClose={() => setShowSaveConfirmation(false)}
        onConfirm={handleConfirmSave}
        variant="confirm"
        {...(editingCareer ? CONFIRM_MESSAGES.update('Carrera') : CONFIRM_MESSAGES.create('Carrera'))}
        cancelLabel="Cancelar"
        isLoading={isLoading}
      />
    </>
  );
}
