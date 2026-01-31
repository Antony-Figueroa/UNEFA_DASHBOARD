/**
 * @file CareerModal.tsx
 * @description Modal para la creación y edición de Carreras.
 * Implementa validaciones complejas con Zod, manejo de estado de formulario con React Hook Form,
 * y protección contra pérdida de cambios no guardados.
 */

import { useEffect, useMemo, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Input from "../../../components/form/input/InputField";
import CustomSelect from "../../../components/form/CustomSelect";
import MultiSelect from "../../../components/form/MultiSelect";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../../components/ui/modal";
import { Career } from "../types";
import Button from "../../../components/ui/button/Button";
import AsyncButton from "../../../components/ui/button/AsyncButton";
import { useUnsavedChanges } from "../../../hooks/useUnsavedChanges";
import UnifiedDialog from "../../../components/ui/dialog/UnifiedDialog";

import { InternshipTypeOption } from "../../internship-types/types";

/**
 * Propiedades del componente CareerModal.
 */
interface CareerModalProps {
  /** Indica si el modal está visible */
  isOpen: boolean;
  /** Función para cerrar el modal */
  onClose: () => void;
  /** Función que se llama al guardar los datos (crear o editar) */
  onSave: (career: Omit<Career, "careerId" | "creationDate">) => void;
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
      .regex(/^[A-ZÁÉÍÓÚÑ\s]+$/, "El nombre solo permite letras y acentos (sin números)")
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
      .regex(/^[A-ZÁÉÍÓÚÑ\W\s]+$/, "La abreviatura no permite números")
      .transform(val => val.toUpperCase()),
    careerType: z.enum(['CORTA', 'LARGA'], {
      message: "Debe seleccionar un tipo de carrera"
    }),
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
}: CareerModalProps) {
  // Ref para evitar lecturas de estado desactualizadas durante la inicialización del modal
  const isInitializing = useRef(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty, isValid },
  } = useForm<CareerFormData>({
    resolver: zodResolver(createCareerSchema(existingCareers, editingCareer?.careerId)),
    mode: "all",
    defaultValues: {
      careerName: "",
      careerCode: "",
      minimumGrade: "",
      careerAbbreviation: "",
      careerType: undefined,
      internshipTypeIds: [],
    },
  });

  const careerCode = watch("careerCode");
  const minimumGrade = watch("minimumGrade");

  // Efecto para establecer automáticamente la nota mínima en 16 al escribir el código
  useEffect(() => {
    if (!editingCareer && careerCode && careerCode.length > 0 && !minimumGrade && !isInitializing.current) {
      setValue("minimumGrade", "16", { shouldValidate: true });
    }
  }, [careerCode, minimumGrade, setValue, editingCareer]);

  const {
    showConfirmation,
    handleCloseAttempt,
    confirmClose,
    cancelClose,
  } = useUnsavedChanges(isDirty, onClose);

  useEffect(() => {
    if (isOpen) {
      isInitializing.current = true;
      if (editingCareer) {
        reset({
          careerName: editingCareer.careerName,
          careerCode: String(editingCareer.careerCode),
          minimumGrade: String(Math.floor(editingCareer.minimumGrade)),
          careerAbbreviation: editingCareer.careerAbbreviation,
          careerType: editingCareer.careerType as 'CORTA' | 'LARGA',
          internshipTypeIds: (editingCareer.internshipTypeIds ?? []).map(String),
        });
      } else {
        reset({
          careerName: "",
          careerCode: "",
          minimumGrade: "",
          careerAbbreviation: "",
          careerType: undefined,
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

  const onSubmit = (data: CareerFormData) => {
    onSave({
      careerName: data.careerName.toUpperCase(),
      careerCode: data.careerCode,
      careerAbbreviation: data.careerAbbreviation.toUpperCase(),
      careerType: data.careerType,
      internshipTypeIds: data.internshipTypeIds || [],
      minimumGrade: Number(data.minimumGrade),
      status: editingCareer?.status ?? 1,
    } as Omit<Career, "careerId" | "creationDate">);
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
        onClose={handleCloseAttempt}
        onCloseAttempt={handleCloseAttempt}
        showCloseButton
      >
        <ModalHeader>
          <div className="max-w-4xl mx-auto w-full">
            <h5 className="mb-1 font-semibold text-text-primary modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
              {editingCareer ? "Editar Carrera" : "Registrar Carrera"}
            </h5>
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
            <div className="md:col-span-2">
              <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Nombre de la Carrera *</label>
              <Input
                {...register("careerName")}
                placeholder="Ej: INGENIERÍA DE SISTEMAS"
                error={!!errors.careerName}
                hint={errors.careerName?.message}
                onChange={(e) => {
                  e.target.value = e.target.value.replace(/[0-9]/g, '').toUpperCase();
                  register("careerName").onChange(e);
                }}
              />
            </div>

            <div>
              <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Código *</label>
              <Input
                {...register("careerCode")}
                type="text"
                placeholder="Ej: 0501"
                maxLength={8}
                error={!!errors.careerCode}
                hint={errors.careerCode?.message}
                disabled={!!editingCareer}
                onChange={(e) => {
                  e.target.value = e.target.value.replace(/\D/g, '');
                  register("careerCode").onChange(e);
                }}
              />
              {editingCareer && (
                <p className="mt-1 text-[10px] text-text-tertiary italic">El código no es editable.</p>
              )}
            </div>

            <div>
              <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Tipo de Carrera *</label>
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
                    disabled={isInUse}
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
              <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Nota mínima *</label>
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
                      disabled={isInUse && hasPendingEvaluations}
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
              <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Abreviatura *</label>
              <Input
                {...register("careerAbbreviation")}
                type="text"
                placeholder="Ej: TSU-ENF"
                error={!!errors.careerAbbreviation}
                hint={errors.careerAbbreviation?.message}
                onChange={(e) => {
                  e.target.value = e.target.value.replace(/[0-9]/g, '').toUpperCase();
                  register("careerAbbreviation").onChange(e);
                }}
              />
            </div>
            <div className="md:col-span-2">
              <Controller
                name="internshipTypeIds"
                control={control}
                render={({ field }) => (
                  <MultiSelect
                    label="Tipos de Prácticas *"
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
                    placeholder="Seleccione los tipos"
                    disabled={isInUse}
                    error={!!errors.internshipTypeIds}
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
          <AsyncButton type="submit" form="career-form" loading={isLoading} className="w-full sm:w-auto min-h-12" disabled={!isValid || (editingCareer ? !isDirty : false)}>
            {editingCareer ? "Actualizar Registro" : "Guardar Carrera"}
          </AsyncButton>
        </div>
      </ModalFooter>
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