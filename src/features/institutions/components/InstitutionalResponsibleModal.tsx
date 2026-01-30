/**
 * @file InstitutionalResponsibleModal.tsx
 * @description Modal para crear y editar responsables institucionales.
 */

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Modal, ModalBody, ModalFooter, ModalHeader } from "../../../components/ui/modal";
import Input from "../../../components/form/input/InputField";
import Button from "../../../components/ui/button/Button";
import AsyncButton from "../../../components/ui/button/AsyncButton";
import Select from "../../../components/form/Select";
import CustomSelect from "../../../components/form/CustomSelect";
import { 
  InstitutionalResponsible, 
  CreateInstitutionalResponsiblePayload, 
  UpdateInstitutionalResponsiblePayload 
} from "../types";
import { useUnsavedChanges } from "../../../hooks/useUnsavedChanges";
import UnifiedDialog from "../../../components/ui/dialog/UnifiedDialog";
import { useLists } from "../../lists/hooks/useLists";

const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/;

/**
 * Zod schema for institutional responsible form data.
 */
const respSchema = z.object({
  identificationPrefix: z.string().min(1, "Seleccione un prefijo"),
  identificationNumber: z.string()
    .min(1, "La cédula es obligatoria")
    .regex(/^\d+$/, "Solo se admiten números")
    .min(7, "La cédula debe tener al menos 7 dígitos"),
  firstName: z.string()
    .min(1, "El primer nombre es obligatorio")
    .regex(nameRegex, "Solo se admiten letras"),
  middleName: z.string()
    .regex(nameRegex, "Solo se admiten letras")
    .optional()
    .or(z.literal("")),
  lastName: z.string()
    .min(1, "El primer apellido es obligatorio")
    .regex(nameRegex, "Solo se admiten letras"),
  secondLastName: z.string()
    .regex(nameRegex, "Solo se admiten letras")
    .optional()
    .or(z.literal("")),
  phonePrefix: z.string().min(1, "Seleccione un prefijo"),
  phoneNumber: z.string()
    .min(1, "El número de teléfono es obligatorio")
    .regex(/^\d+$/, "Solo se admiten números")
    .min(7, "El número debe tener al menos 7 dígitos"),
  email: z.string()
    .min(1, "El correo es obligatorio")
    .email("Correo electrónico inválido"),
  institutionId: z.string().min(1, "Seleccione una institución"),
});

/**
 * Type inferred from the responsible form schema.
 */
type RespFormData = z.infer<typeof respSchema>;

/**
 * Props for the InstitutionalResponsibleModal component.
 */
interface InstitutionalResponsibleModalProps {
  /** Whether the modal is visible */
  isOpen: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** Callback fired when the form is submitted successfully */
  onSave: (data: CreateInstitutionalResponsiblePayload | UpdateInstitutionalResponsiblePayload) => void;
  /** The responsible record being edited, or null if creating a new one */
  editingResp?: InstitutionalResponsible | null;
  /** Options for the institution selection dropdown */
  institutionOptions: { value: string; label: string }[];
  /** Whether a background action is in progress */
  isLoading?: boolean;
}

/**
 * Modal component for creating or editing institutional responsible records.
 * Uses react-hook-form for form management and Zod for validation.
 * 
 * @example
 * ```tsx
 * <InstitutionalResponsibleModal
 *   isOpen={isModalOpen}
 *   onClose={() => setModalOpen(false)}
 *   onSave={handleSave}
 *   editingResp={selectedResponsible}
 *   institutionOptions={institutions}
 * />
 * ```
 */
export default function InstitutionalResponsibleModal({
  isOpen,
  onClose,
  onSave,
  editingResp,
  institutionOptions,
  isLoading = false,
}: InstitutionalResponsibleModalProps) {
  const [options, setOptions] = useState<Record<string, { value: string; label: string }[]>>({});
  const { fetchMultipleLists } = useLists();

  const NATIONALITY_OPTIONS = options["Nacionalidad"] || [
    { value: "V", label: "V" },
    { value: "E", label: "E" },
  ];

  const PHONE_PREFIX_OPTIONS = options["CODIGOS_AREA"] || [
    { value: "0412", label: "0412" },
    { value: "0414", label: "0414" },
    { value: "0424", label: "0424" },
    { value: "0416", label: "0416" },
    { value: "0426", label: "0426" },
    { value: "0212", label: "0212" },
  ];

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitted, isDirty, isValid },
  } = useForm<RespFormData>({
    resolver: zodResolver(respSchema),
    mode: "onChange",
    defaultValues: {
      identificationPrefix: "V",
      identificationNumber: "",
      firstName: "",
      middleName: "",
      lastName: "",
      secondLastName: "",
      phonePrefix: "",
      phoneNumber: "",
      email: "",
      institutionId: "",
    },
  });

  const {
    showConfirmation,
    handleCloseAttempt,
    confirmClose,
    cancelClose,
  } = useUnsavedChanges(isDirty, onClose);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const listNames = ["Nacionalidad", "CODIGOS_AREA"];
        const data = await fetchMultipleLists(listNames);
        const mappedOptions: Record<string, { value: string; label: string }[]> = {};
        
        Object.entries(data).forEach(([key, values]) => {
          mappedOptions[key] = values.map(v => ({
            // Para Nacionalidad usamos la abreviación (V, E)
            value: (key === "Nacionalidad" && v.abbreviation) ? v.abbreviation.toUpperCase() : v.name.toUpperCase(),
            label: (key === "Nacionalidad" && v.abbreviation) ? v.abbreviation.toUpperCase() : v.name.toUpperCase()
          }));
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

  useEffect(() => {
    if (isOpen) {
      if (editingResp) {
        let pPrefix = "0412";
        let pNumber = "";
        
        if (editingResp.phone) {
          if (editingResp.phone.startsWith("0")) {
            pPrefix = editingResp.phone.substring(0, 4);
            pNumber = editingResp.phone.substring(4);
          } else {
            pNumber = editingResp.phone;
          }
        }

        reset({
          identificationPrefix: editingResp.identificationPrefix,
          identificationNumber: editingResp.identificationNumber,
          firstName: editingResp.firstName,
          middleName: editingResp.middleName || "",
          lastName: editingResp.lastName,
          secondLastName: editingResp.secondLastName || "",
          phonePrefix: pPrefix,
          phoneNumber: pNumber,
          email: editingResp.email,
          institutionId: editingResp.institutionId,
        });
      } else {
        reset({
          identificationPrefix: "V",
          identificationNumber: "",
          firstName: "",
          middleName: "",
          lastName: "",
          secondLastName: "",
          phonePrefix: "",
          phoneNumber: "",
          email: "",
          institutionId: "",
        });
      }
    }
  }, [editingResp, isOpen, reset]);

  /**
   * Handles form submission. Formats the data and calls the onSave callback.
   * @param data - The validated form data.
   */
  const onSubmit = (data: RespFormData) => {
    const { phonePrefix, phoneNumber, ...rest } = data;
    const commonData = {
      ...rest,
      phone: `${phonePrefix}${phoneNumber}`,
      status: editingResp?.status ?? true,
    };

    if (editingResp) {
      onSave({
        ...commonData,
        responsibleId: editingResp.responsibleId,
      } as UpdateInstitutionalResponsiblePayload);
    } else {
      onSave(commonData as CreateInstitutionalResponsiblePayload);
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} onCloseAttempt={handleCloseAttempt} size="5xl" showCloseButton>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full overflow-hidden">
          <ModalHeader>
            {editingResp ? "Editar Responsable" : "Nuevo Responsable"}
          </ModalHeader>

        <ModalBody>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">
            {/* Cédula */}
            <div>
              <label className="mb-2 block text-text-secondary dark:text-white/90 font-bold text-xs uppercase tracking-wider">Cédula *</label>
              <div className="flex gap-2">
                <div className="w-24 shrink-0">
                  <Controller
                    name="identificationPrefix"
                    control={control}
                    render={({ field }) => (
                      <CustomSelect
                        id="identificationPrefix"
                        options={NATIONALITY_OPTIONS}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        value={field.value}
                        placeholder="Tipo"
                        disabled={!!editingResp}
                        error={!!errors.identificationPrefix}
                      />
                    )}
                  />
                </div>
                <div className="flex-1">
                  <Input 
                    placeholder="Ej: 12345678" 
                    {...register("identificationNumber")} 
                    error={!!errors.identificationNumber} 
                  />
                </div>
              </div>
              {isSubmitted && errors.identificationNumber && (
                <p className="mt-1 text-[11px] font-medium text-red-500">{errors.identificationNumber.message}</p>
              )}
            </div>

            {/* Institución */}
            <div className="lg:col-span-1">
              <label className="mb-2 block text-text-secondary dark:text-white/90 font-bold text-xs uppercase tracking-wider">Institución *</label>
              <Controller
                name="institutionId"
                control={control}
                render={({ field }) => (
                  <Select
                    options={institutionOptions}
                    onChange={field.onChange}
                    defaultValue={field.value}
                    placeholder="Seleccione una institución"
                  />
                )}
              />
              {isSubmitted && errors.institutionId && (
                <p className="mt-1 text-[11px] font-medium text-red-500">{errors.institutionId.message}</p>
              )}
            </div>

            {/* Primer Nombre */}
            <div>
              <label className="mb-2 block text-text-secondary dark:text-white/90 font-bold text-xs uppercase tracking-wider">Primer Nombre *</label>
              <Input 
                placeholder="Ingrese el primer nombre" 
                {...register("firstName")} 
                error={!!errors.firstName} 
                hint={isSubmitted ? errors.firstName?.message : undefined} 
              />
            </div>

            {/* Segundo Nombre */}
            <div>
              <label className="mb-2 block text-text-secondary dark:text-white/90 font-bold text-xs uppercase tracking-wider">Segundo Nombre</label>
              <Input 
                placeholder="Ingrese el segundo nombre" 
                {...register("middleName")} 
                error={!!errors.middleName} 
                hint={isSubmitted ? errors.middleName?.message : undefined} 
              />
            </div>

            {/* Primer Apellido */}
            <div>
              <label className="mb-2 block text-text-secondary dark:text-white/90 font-bold text-xs uppercase tracking-wider">Primer Apellido *</label>
              <Input 
                placeholder="Ingrese el primer apellido" 
                {...register("lastName")} 
                error={!!errors.lastName} 
                hint={isSubmitted ? errors.lastName?.message : undefined} 
              />
            </div>

            {/* Segundo Apellido */}
            <div>
              <label className="mb-2 block text-text-secondary dark:text-white/90 font-bold text-xs uppercase tracking-wider">Segundo Apellido</label>
              <Input 
                placeholder="Ingrese el segundo apellido" 
                {...register("secondLastName")} 
                error={!!errors.secondLastName} 
                hint={isSubmitted ? errors.secondLastName?.message : undefined} 
              />
            </div>

            {/* Teléfono */}
            <div>
              <label className="mb-2 block text-text-secondary dark:text-white/90 font-bold text-xs uppercase tracking-wider">Teléfono *</label>
              <div className="flex gap-2">
                <div className="w-28 shrink-0">
                  <Controller
                    name="phonePrefix"
                    control={control}
                    render={({ field }) => (
                      <Select
                        options={PHONE_PREFIX_OPTIONS}
                        onChange={field.onChange}
                        value={field.value}
                        placeholder="Prefijo"
                        error={!!errors.phonePrefix}
                      />
                    )}
                  />
                </div>
                <div className="flex-1">
                  <Input 
                    placeholder="Ej: 1234567" 
                    {...register("phoneNumber")} 
                    error={!!errors.phoneNumber} 
                  />
                </div>
              </div>
              {isSubmitted && (errors.phonePrefix || errors.phoneNumber) && (
                <p className="mt-1 text-[11px] font-medium text-red-500">
                  {errors.phonePrefix?.message || errors.phoneNumber?.message}
                </p>
              )}
            </div>

            {/* Correo Electrónico */}
            <div className="md:col-span-2 lg:col-span-2">
              <label className="mb-2 block text-text-secondary dark:text-white/90 font-bold text-xs uppercase tracking-wider">Correo Electrónico *</label>
              <Input 
                placeholder="Ingrese el correo electrónico" 
                {...register("email")} 
                error={!!errors.email} 
                hint={isSubmitted ? errors.email?.message : undefined} 
              />
            </div>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button 
            variant="outline" 
            onClick={handleCloseAttempt} 
            type="button" 
            className="min-h-12 px-8 rounded-xl font-bold"
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <AsyncButton 
            variant="primary" 
            type="submit" 
            className="min-h-12 px-8 rounded-xl font-bold"
            loading={isLoading}
            disabled={!isValid}
          >
            {editingResp ? "Actualizar" : "Guardar"}
          </AsyncButton>
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
