/**
 * @file InstitutionModal.tsx
 * @description Modal con formulario para crear y editar instituciones.
 */

import { useEffect, useState, useMemo } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Input from "../../../components/form/input/InputField";
import TextArea from "../../../components/form/input/TextArea";
import CustomSelect from "../../../components/form/CustomSelect";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../../components/ui/modal";
import { Institution, CreateInstitutionPayload, UpdateInstitutionPayload } from "../types";
import Button from "../../../components/ui/button/Button";
import AsyncButton from "../../../components/ui/button/AsyncButton";
import { useInternshipTypes } from "../../internship-types/hooks/useInternshipTypes";
import { useUnsavedChanges } from "../../../hooks/useUnsavedChanges";
import UnifiedDialog from "../../../components/ui/dialog/UnifiedDialog";
import { useLists } from "../../lists/hooks/useLists";
import * as enrollmentService from "../../enrollment/services/enrollmentService";

/**
 * Props for the InstitutionModal component.
 */
interface InstitutionModalProps {
  /** Whether the modal is visible */
  isOpen: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** Callback fired when the form is submitted successfully */
  onSave: (inst: CreateInstitutionPayload | UpdateInstitutionPayload) => void;
  /** The institution record being edited, or null if creating a new one */
  editingInst?: Institution | null;
  /** Options for the career selection dropdown */
  careerOptions: { value: string | number; label: string }[];
  /** Whether a background action is in progress */
  isLoading?: boolean;
  /** List of existing institutions for validation (e.g., duplicate RIF) */
  existingInstitutions?: Institution[];
}

/**
 * Base Zod schema for institution form data.
 */
const baseInstSchema = z.object({
  rifPrefix: z.string().min(1, "El prefijo es obligatorio"),
  rifNumber: z.string()
    .min(1, "El número de RIF es obligatorio")
    .regex(/^\d{9}$/, "El RIF debe tener exactamente 9 números"),
  name: z.string().min(1, "El nombre es obligatorio"),
  fiscalAddress: z.string().min(1, "La dirección fiscal es obligatoria"),
  phonePrefix: z.string().min(1, "Seleccione un prefijo"),
  phoneNumber: z.string()
    .min(1, "El número de teléfono es obligatorio")
    .regex(/^\d+$/, "Solo se admiten números")
    .length(7, "El número debe tener exactamente 7 dígitos"),
  practiceType: z.string().min(1, "Seleccione un tipo de práctica"),
  careerId: z.union([z.string(), z.number()]).refine(val => String(val).length > 0, "Seleccione una carrera"),
  region: z.string().min(1, "Seleccione un región"),
  nucleus: z.string().min(1, "Seleccione un núcleo"),
  extension: z.string().min(1, "Seleccione una extensión"),
  institutionType: z.string().min(1, "Seleccione un tipo de institución"),
});

/**
 * Type inferred from the institution form schema.
 */
type InstFormData = z.infer<typeof baseInstSchema>;

/**
 * Creates a Zod schema with refinement for duplicate RIF validation.
 * @param existingInstitutions - List of institutions to check against.
 * @param editingInst - The institution currently being edited (if any).
 */
const createInstSchema = (existingInstitutions: Institution[], editingInst: Institution | null) => 
  baseInstSchema.superRefine((data, ctx) => {
    const fullRif = `${data.rifPrefix}-${data.rifNumber}`.toUpperCase();
    const isDuplicate = existingInstitutions.some(inst => 
      inst.rif.toUpperCase() === fullRif && inst.institutionId !== editingInst?.institutionId
    );

    if (isDuplicate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Ya existe una institución registrada con este RIF",
        path: ["rifNumber"],
      });
    }
  });

/**
 * Modal component for creating or editing institution records.
 * Uses react-hook-form for form management and Zod for validation.
 * 
 * @example
 * ```tsx
 * <InstitutionModal
 *   isOpen={isModalOpen}
 *   onClose={() => setModalOpen(false)}
 *   onSave={handleSave}
 *   editingInst={selectedInstitution}
 *   careerOptions={careers}
 * />
 * ```
 */
export default function InstitutionModal({
  isOpen,
  onClose,
  onSave,
  editingInst,
  careerOptions,
  isLoading = false,
  existingInstitutions = [],
}: InstitutionModalProps) {
  const [options, setOptions] = useState<Record<string, { value: string; label: string }[]>>({});
  const [hasProfessionalPractices, setHasProfessionalPractices] = useState(false);
  const { fetchMultipleLists } = useLists();

  const instSchema = useMemo(() => createInstSchema(existingInstitutions, editingInst || null), [existingInstitutions, editingInst]);

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors, isDirty, isValid },
  } = useForm<InstFormData>({
    resolver: zodResolver(instSchema),
    mode: "onChange",
    defaultValues: {
      rifPrefix: "",
      rifNumber: "",
      name: "",
      fiscalAddress: "",
      phonePrefix: "",
      phoneNumber: "",
      practiceType: "",
      careerId: "",
      region: "",
      nucleus: "",
      extension: "",
      institutionType: "",
    },
  });

  const {
    showConfirmation,
    handleCloseAttempt,
    confirmClose,
    cancelClose,
  } = useUnsavedChanges(isDirty, onClose);

  const { options: practiceOptions, fetchByCareer, isLoading: isLoadingPractices } = useInternshipTypes();
  const watchedCareerId = useWatch({ control, name: "careerId" });

  useEffect(() => {
    const loadPracticeTypes = async () => {
      if (watchedCareerId) {
        await fetchByCareer(String(watchedCareerId));
      }
    };
    loadPracticeTypes();
  }, [watchedCareerId, fetchByCareer]);

  // Efecto para auto-seleccionar el tipo de práctica cuando las opciones cambian
  useEffect(() => {
    if (practiceOptions.length === 1 && !editingInst) {
      setValue("practiceType", practiceOptions[0].value);
    }
  }, [practiceOptions, setValue, editingInst]);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const listNames = [
          "CODIGOS_AREA",
          "Rif",
          "Region",
          "Nucleo",
          "Extensión",
          "Tipo de empresa"
        ];
        const data = await fetchMultipleLists(listNames);
        const mappedOptions: Record<string, { value: string; label: string }[]> = {};
        
        Object.entries(data).forEach(([key, values]) => {
          mappedOptions[key] = values.map(v => {
            // Para Rif y Nacionalidad usamos la abreviación si existe
            const useAbbr = ["Rif", "Nacionalidad"].includes(key) && v.abbreviation;
            const displayValue = useAbbr ? v.abbreviation : v.name;
            
            return {
              value: displayValue.toUpperCase(),
              label: displayValue.toUpperCase()
            };
          });
        });
        
        setOptions(mappedOptions);
      } catch (error) {
        console.error("Error loading list options:", error);
      }
    };

    if (isOpen) {
      loadOptions();
    }
  }, [isOpen, fetchMultipleLists]);

  // Verificar si la institución tiene prácticas profesionales (inscripciones)
  useEffect(() => {
    const checkPractices = async () => {
      if (editingInst?.institutionId) {
        try {
          const enrollments = await enrollmentService.getEnrollments();
          const hasPractices = enrollments.some(e => e.institutionId === editingInst.institutionId);
          setHasProfessionalPractices(hasPractices);
        } catch (error) {
          console.error("Error checking professional practices:", error);
          setHasProfessionalPractices(false);
        }
      } else {
        setHasProfessionalPractices(false);
      }
    };

    if (isOpen) {
      checkPractices();
    }
  }, [isOpen, editingInst]);

  const optionsRif = options.Rif;
  const optionsRegion = options.Region;
  const optionsNucleo = options.Nucleo;
  const optionsExtension = options["Extensión"];
  const optionsTipoEmpresa = options["Tipo de empresa"];
  const optionsCodigosArea = options.CODIGOS_AREA;

  const VENEZUELA_PHONE_PREFIXES = useMemo(() => {
    const dbPrefixes = optionsCodigosArea || [];
    if (dbPrefixes.length > 0) return dbPrefixes.sort((a, b) => a.label.localeCompare(b.label));
    
    // Fallback si no hay datos en la BD
    return [
      { value: "0412", label: "0412" },
      { value: "0414", label: "0414" },
      { value: "0424", label: "0424" },
      { value: "0416", label: "0416" },
      { value: "0426", label: "0426" },
      { value: "0212", label: "0212" },
    ];
  }, [optionsCodigosArea]);

  const RIF_PREFIXES = useMemo(() => {
    const priority: { [key: string]: number } = { 'J': 1, 'G': 2 };
    
    return (optionsRif || []).sort((a, b) => {
      const aVal = a.label.toUpperCase();
      const bVal = b.label.toUpperCase();

      const aPriority = priority[aVal] || 3;
      const bPriority = priority[bVal] || 3;

      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }

      return aVal.localeCompare(bVal);
    });
  }, [optionsRif]);

  const REGION_OPTIONS = useMemo(() => {
    return (optionsRegion || []).sort((a, b) => a.label.localeCompare(b.label));
  }, [optionsRegion]);

  const NUCLEUS_OPTIONS = useMemo(() => {
    return (optionsNucleo || []).sort((a, b) => a.label.localeCompare(b.label));
  }, [optionsNucleo]);

  const EXTENSION_OPTIONS = useMemo(() => {
    return (optionsExtension || []).sort((a, b) => a.label.localeCompare(b.label));
  }, [optionsExtension]);

  const INSTITUTION_TYPE_OPTIONS = useMemo(() => {
    return (optionsTipoEmpresa || []).sort((a, b) => a.label.localeCompare(b.label));
  }, [optionsTipoEmpresa]);

  useEffect(() => {
    if (isOpen) {
      if (editingInst) {
        const [rifP, rifN] = editingInst.rif ? editingInst.rif.split("-") : ["", ""];
        const [phoneP, phoneN] = editingInst.phone ? editingInst.phone.split("-") : ["", ""];

        reset({
          rifPrefix: rifP || "",
          rifNumber: rifN || "",
          name: editingInst.name,
          fiscalAddress: editingInst.fiscalAddress,
          phonePrefix: phoneP || "",
          phoneNumber: phoneN || "",
          practiceType: editingInst.practiceType,
          careerId: editingInst.careerId,
          region: editingInst.region,
          nucleus: editingInst.nucleus,
          extension: editingInst.extension,
          institutionType: editingInst.institutionType,
        });
      } else {
        reset({
          rifPrefix: "",
          rifNumber: "",
          name: "",
          fiscalAddress: "",
          phonePrefix: "",
          phoneNumber: "",
          practiceType: "",
          careerId: "",
          region: "",
          nucleus: "",
          extension: "",
          institutionType: "",
        });
      }
    }
  }, [editingInst, isOpen, reset]);

  /**
   * Handles form submission. Formats the data and calls the onSave callback.
   * @param data - The validated form data.
   */
  const onSubmit = (data: InstFormData) => {
    if (!window.confirm("¿Guardar la información de la institución?")) return;
    const commonData = {
      rif: `${data.rifPrefix}-${data.rifNumber}`.toUpperCase(),
      name: data.name.toUpperCase(),
      fiscalAddress: data.fiscalAddress.toUpperCase(),
      phone: `${data.phonePrefix}-${data.phoneNumber}`,
      practiceType: data.practiceType.toUpperCase(),
      careerId: String(data.careerId),
      region: data.region.toUpperCase(),
      nucleus: data.nucleus.toUpperCase(),
      extension: data.extension.toUpperCase(),
      institutionType: data.institutionType.toUpperCase(),
      status: editingInst?.status ?? true,
    };

    if (editingInst) {
      onSave({
        ...commonData,
        institutionId: editingInst.institutionId,
      } as UpdateInstitutionPayload);
    } else {
      onSave(commonData as CreateInstitutionPayload);
    }
  };

  /**
   * Helper to convert input value to uppercase.
   */
  const handleUppercaseChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const start = e.target.selectionStart;
    const end = e.target.selectionEnd;
    e.target.value = e.target.value.toUpperCase();
    e.target.setSelectionRange(start, end);
  };

  /**
   * Helper to restrict input to numeric characters only.
   */
  const handleNumbersOnlyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const start = e.target.selectionStart;
    const end = e.target.selectionEnd;
    const originalValue = e.target.value;
    const newValue = originalValue.replace(/\D/g, "");
    e.target.value = newValue;
    
    // Adjust selection if characters were removed
    if (originalValue !== newValue && start !== null && end !== null) {
      const diff = originalValue.length - newValue.length;
      e.target.setSelectionRange(start - diff, end - diff);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} onCloseAttempt={handleCloseAttempt} showCloseButton size="5xl">
        <ModalHeader>
          <h5 className="text-xl font-semibold text-text-primary dark:text-white/90">
            {editingInst ? "Editar Institución" : "Registrar Institución"}
          </h5>
          <p className="text-sm text-text-secondary">Complete la información de la institución.</p>
        </ModalHeader>
      <ModalBody className="bg-bg-secondary/30 dark:bg-bg-dark/50">
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">RIF *</label>
            <div className="flex gap-2">
              <div className="w-32">
                <Controller
                  name="rifPrefix"
                  control={control}
                  render={({ field }) => (
                     <CustomSelect
                       id="rifPrefix"
                       options={RIF_PREFIXES.map(opt => ({ value: String(opt.value), label: opt.label }))}
                       onChange={field.onChange}
                       value={String(field.value ?? "")}
                       placeholder="Prefijo"
                       disabled={!!editingInst}
                     />
                   )}
                 />
               </div>
               <div className="flex-1">
                 <Input 
                   placeholder="12345678" 
                   className="uppercase"
                   {...register("rifNumber", {
                     onChange: handleNumbersOnlyChange
                   })} 
                   error={!!errors.rifNumber} 
                   disabled={!!editingInst}
                 />
               </div>
             </div>
            {errors.rifNumber && (
              <p className="mt-1 text-xs text-red-500">
                {errors.rifNumber.message}
              </p>
            )}
          </div>
          <div>
            <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Nombre *</label>
            <Input 
              placeholder="Nombre de la institución" 
              className="uppercase"
              {...register("name", {
                onChange: handleUppercaseChange
              })} 
              error={!!errors.name} 
              hint={errors.name?.message} 
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Dirección Fiscal *</label>
            <TextArea 
              placeholder="Dirección completa" 
              className="uppercase"
              {...register("fiscalAddress", {
                onChange: handleUppercaseChange
              })} 
              error={!!errors.fiscalAddress} 
              hint={errors.fiscalAddress?.message} 
              rows={2}
            />
          </div>
          <div>
            <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Teléfono *</label>
            <div className="flex gap-2">
              <div className="w-32">
                <Controller
                  name="phonePrefix"
                  control={control}
                  render={({ field }) => (
                    <CustomSelect
                      id="phonePrefix"
                      options={VENEZUELA_PHONE_PREFIXES.map(opt => ({ value: String(opt.value), label: opt.label }))}
                      onChange={field.onChange}
                      value={String(field.value ?? "")}
                      placeholder="Prefijo"
                      error={!!errors.phonePrefix}
                    />
                  )}
                />
              </div>
              <div className="flex-1">
                <Input 
                  placeholder="1234567" 
                  maxLength={7}
                  {...register("phoneNumber", {
                    onChange: handleNumbersOnlyChange
                  })} 
                  error={!!errors.phoneNumber} 
                />
              </div>
            </div>
            {(errors.phonePrefix || errors.phoneNumber) && (
              <p className="mt-1 text-xs text-red-500">
                {errors.phonePrefix?.message || errors.phoneNumber?.message}
              </p>
            )}
          </div>

          <div>
            <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Carrera *</label>
            <Controller
              name="careerId"
              control={control}
              render={({ field }) => (
                <CustomSelect
                  id="careerId"
                  options={careerOptions.map(opt => ({ value: String(opt.value), label: opt.label }))}
                  onChange={field.onChange}
                  value={String(field.value ?? "")}
                  disabled={isLoading || hasProfessionalPractices}
                  placeholder="Seleccione carrera"
                />
              )}
            />
            {errors.careerId && (
              <p className="mt-1 text-xs text-red-500">{errors.careerId.message}</p>
            )}
            {hasProfessionalPractices && (
              <p className="mt-1 text-[10px] text-amber-600 dark:text-amber-400">
                Campo bloqueado: La institución tiene prácticas registradas.
              </p>
            )}
          </div>

          <div>
            <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Tipo Práctica *</label>
            <Controller
              name="practiceType"
              control={control}
              render={({ field }) => (
                <CustomSelect
                  id="practiceType"
                  options={practiceOptions.map(opt => ({ value: String(opt.value), label: opt.label }))}
                  onChange={field.onChange}
                  value={String(field.value ?? "")}
                  disabled={hasProfessionalPractices}
                  placeholder="Seleccione tipo"
                />
              )}
            />
            {errors.practiceType && (
              <p className="mt-1 text-xs text-red-500">{errors.practiceType.message}</p>
            )}
            {hasProfessionalPractices && (
              <p className="mt-1 text-[10px] text-amber-600 dark:text-amber-400">
                Campo bloqueado: La institución tiene prácticas registradas.
              </p>
            )}
          </div>

          <div>
            <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Región *</label>
            <Controller
              name="region"
              control={control}
              render={({ field }) => (
                <CustomSelect
                  id="region"
                  options={REGION_OPTIONS.map(opt => ({ value: String(opt.value), label: opt.label }))}
                  onChange={field.onChange}
                  value={String(field.value ?? "")}
                  placeholder="Seleccione región"
                />
              )}
            />
            {errors.region && (
              <p className="mt-1 text-xs text-red-500">{errors.region.message}</p>
            )}
          </div>

          <div>
            <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Núcleo *</label>
            <Controller
              name="nucleus"
              control={control}
              render={({ field }) => (
                <CustomSelect
                  id="nucleus"
                  options={NUCLEUS_OPTIONS.map(opt => ({ value: String(opt.value), label: opt.label }))}
                  onChange={field.onChange}
                  value={String(field.value ?? "")}
                  placeholder="Seleccione núcleo"
                />
              )}
            />
            {errors.nucleus && (
              <p className="mt-1 text-xs text-red-500">{errors.nucleus.message}</p>
            )}
          </div>

          <div>
            <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Extensión *</label>
            <Controller
              name="extension"
              control={control}
              render={({ field }) => (
                <CustomSelect
                  id="extension"
                  options={EXTENSION_OPTIONS.map(opt => ({ value: String(opt.value), label: opt.label }))}
                  onChange={field.onChange}
                  value={String(field.value ?? "")}
                  placeholder="Seleccione extensión"
                />
              )}
            />
            {errors.extension && (
              <p className="mt-1 text-xs text-red-500">{errors.extension.message}</p>
            )}
          </div>

          <div>
            <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Tipo Institución *</label>
            <Controller
              name="institutionType"
              control={control}
              render={({ field }) => (
                <CustomSelect
                  id="institutionType"
                  options={INSTITUTION_TYPE_OPTIONS.map(opt => ({ value: String(opt.value), label: opt.label }))}
                  onChange={field.onChange}
                  value={String(field.value ?? "")}
                  placeholder="Seleccione tipo"
                />
              )}
            />
            {errors.institutionType && (
              <p className="mt-1 text-xs text-red-500">{errors.institutionType.message}</p>
            )}
          </div>
          
          {/* Botón oculto para permitir submit con Enter */}
          <button type="submit" className="hidden" />
        </form>
      </ModalBody>
      <ModalFooter>
        <Button variant="outline" onClick={handleCloseAttempt} disabled={isLoading}>
          Cancelar
        </Button>
        <AsyncButton onClick={handleSubmit(onSubmit)} loading={isLoading} disabled={!isValid || (editingInst ? !isDirty : false)}>
          {editingInst ? "Guardar Cambios" : "Registrar Institución"}
        </AsyncButton>
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
