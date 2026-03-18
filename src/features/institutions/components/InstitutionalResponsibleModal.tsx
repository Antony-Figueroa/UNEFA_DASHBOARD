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
import CustomSelect from "../../../components/form/CustomSelect";
import { 
  InstitutionalResponsible, 
  CreateInstitutionalResponsiblePayload, 
  UpdateInstitutionalResponsiblePayload 
} from "../types";
import { useUnsavedChanges } from "../../../hooks/useUnsavedChanges";
import UnifiedDialog from "../../../components/ui/dialog/UnifiedDialog";
import { useLists } from "../../lists/hooks/useLists";
import { List } from "../../lists/types";
import * as listsService from "../../lists/services/listsService";
import { isProtectedList, PROTECTED_LIST_MESSAGE } from "../../../constants/systemLists";
import { useToast } from "../../../context/toast";
import { formatCedulaDisplay, formatPhoneDisplay, cleanPhone, CEDULA_MAX_LENGTH, PHONE_MAX_LENGTH, CEDULA_MAX_DIGITS } from "../../../utils/inputFormat";
import { getResponsibleByCi } from "../services/institutionalResponsiblesService";

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
  cargo: z.string().optional(),
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
  onSave: (data: CreateInstitutionalResponsiblePayload | UpdateInstitutionalResponsiblePayload) => Promise<void> | void;
  /** The responsible record being edited, or null if creating a new one */
  editingResp?: InstitutionalResponsible | null;
  /** Options for the institution selection dropdown */
  institutionOptions: { value: string; label: string }[];
  /** Whether a background action is in progress */
  isLoading?: boolean;
  /** Preselected institution ID (used when creating from institution modal) */
  preselectedInstitutionId?: string;
  /** Preselected institution name for display */
  preselectedInstitutionName?: string;
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
  preselectedInstitutionId,
  preselectedInstitutionName,
}: InstitutionalResponsibleModalProps) {
  const [options, setOptions] = useState<Record<string, { value: string; label: string }[]>>({});
  const { fetchMultipleLists } = useLists();
  const { addToast } = useToast();

  // Estado para agregar nuevos valores a las listas
  const [isValueModalOpen, setIsValueModalOpen] = useState(false);
  const [valueModalTitle, setValueModalTitle] = useState<string>("");
  const [targetListName, setTargetListName] = useState<string>("");
  const [targetField, setTargetField] = useState<keyof RespFormData | "">("");
  const [newValueInput, setNewValueInput] = useState<string>("");
  const [savingNewValue, setSavingNewValue] = useState(false);

  // State for display values with formatting
  const [displayIdentificationNumber, setDisplayIdentificationNumber] = useState("");
  const [displayPhoneNumber, setDisplayPhoneNumber] = useState("");

  // State for duplicate detection
  const [isCheckingCi, setIsCheckingCi] = useState(false);
  const [existingResponsible, setExistingResponsible] = useState<any | null>(null);
  const [viewOnlyMode, setViewOnlyMode] = useState(false);

  // Handle identification number input change with formatting
  const handleIdentificationNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    // Solo permitir números
    const digitsOnly = input.replace(/\D/g, '').substring(0, CEDULA_MAX_DIGITS);
    const formatted = formatCedulaDisplay(digitsOnly, false);
    setDisplayIdentificationNumber(formatted);
    setValue("identificationNumber", digitsOnly, { shouldValidate: true, shouldDirty: true });
  };

  // Handle phone number input change with formatting
  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const cleaned = cleanPhone(input);
    const formatted = formatPhoneDisplay(cleaned);
    setDisplayPhoneNumber(formatted);
    setValue("phoneNumber", cleaned, { shouldValidate: true, shouldDirty: true });
  };

  const NATIONALITY_OPTIONS = options["Nacionalidad"] || [
    { value: "V", label: "V" },
    { value: "E", label: "E" },
  ];

  const PHONE_PREFIX_OPTIONS = options["PREFIJO"] || [];

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    setError,
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
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);
  const [pendingSave, setPendingSave] = useState<CreateInstitutionalResponsiblePayload | UpdateInstitutionalResponsiblePayload | null>(null);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const listNames = ["Nacionalidad", "PREFIJO"];
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

  // Funciones para agregar nuevos valores a las listas
  const openAddValueModal = (listName: string, field: keyof RespFormData, title: string) => {
    // Verificar si la lista está protegida
    if (isProtectedList(listName)) {
      addToast({
        variant: "warning",
        title: "Lista Protegida",
        message: PROTECTED_LIST_MESSAGE,
      });
      return;
    }
    setTargetListName(listName);
    setTargetField(field);
    setValueModalTitle(title);
    setNewValueInput("");
    setIsValueModalOpen(true);
  };

  const handleSaveNewValue = async () => {
    const raw = newValueInput.trim();
    if (!raw) return;
    setSavingNewValue(true);
    try {
      let list: List | null = null;
      try {
        list = await listsService.getListByName(targetListName);
      } catch (err: unknown) {
        const status = (err as any)?.response?.status;
        if (status === 404) {
          const allLists = await listsService.getAllLists();
          const normalize = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[_\s]+/g, " ").trim().toUpperCase();
          const targetNorm = normalize(targetListName);
          list = allLists.find(l => normalize(l.name) === targetNorm || normalize(l.name).includes(targetNorm) || targetNorm.includes(normalize(l.name))) || null;
          if (!list) {
            const createdList = await listsService.createList(targetListName);
            list = createdList;
          }
        } else {
          throw err;
        }
      }

      const upper = targetField === "phonePrefix" ? raw.replace(/\D/g, '').substring(0, 4) : raw.toUpperCase();

      // Evitar duplicados
      const existing = (list!.values || []).find((v: { name: any; abbreviation: any; }) => {
        const byName = String(v.name || "").toUpperCase() === upper;
        const byAbbr = String(v.abbreviation || "").toUpperCase() === upper;
        return byName || byAbbr;
      });

      if (existing) {
        const selectValue = (targetListName === "Nacionalidad" && existing.abbreviation)
          ? String(existing.abbreviation).toUpperCase()
          : String(existing.name).toUpperCase();
        setValue(targetField as keyof RespFormData, selectValue, { shouldValidate: true, shouldDirty: true });
        setIsValueModalOpen(false);
        return;
      }

      const abbr = (targetListName === "Nacionalidad") ? upper : undefined;
      const created = await listsService.createValue(list!.id, upper, abbr);
      const mapped = {
        value: (targetListName === "Nacionalidad" && created.abbreviation) ? created.abbreviation.toUpperCase() : upper,
        label: (targetListName === "Nacionalidad" && created.abbreviation) ? created.abbreviation.toUpperCase() : upper
      };

      setOptions(prev => {
        const next = { ...prev };
        const arr = next[targetListName] || [];
        next[targetListName] = [...arr, mapped];
        return next;
      });

      setValue(targetField as keyof RespFormData, mapped.value, { shouldValidate: true, shouldDirty: true });
      setIsValueModalOpen(false);
    } catch (e) {
      console.error("[InstitutionalResponsibleModal] Error creando valor en lista:", e);
    } finally {
      setSavingNewValue(false);
    }
  };

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
          cargo: editingResp.cargo || "",
          institutionId: editingResp.institutionId,
        });
        setDisplayIdentificationNumber(formatCedulaDisplay(editingResp.identificationNumber, false));
        setDisplayPhoneNumber(formatPhoneDisplay(editingResp.phone || ""));
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
          cargo: "",
          institutionId: preselectedInstitutionId || "",
        });
        setDisplayIdentificationNumber("");
        setDisplayPhoneNumber("");
      }
    }
  }, [editingResp, isOpen, reset, preselectedInstitutionId]);

  /**
   * Handles form submission. Formats the data and calls the onSave callback.
   * @param data - The validated form data.
   */
  const onSubmit = (data: RespFormData) => {
    const { phonePrefix, phoneNumber, ...rest } = data;
    const commonData = {
      ...rest,
      identificationPrefix: rest.identificationPrefix.toUpperCase(),
      identificationNumber: rest.identificationNumber.toUpperCase(),
      firstName: rest.firstName.toUpperCase(),
      middleName: (rest.middleName || "").toUpperCase(),
      lastName: rest.lastName.toUpperCase(),
      secondLastName: (rest.secondLastName || "").toUpperCase(),
      phonePrefix: phonePrefix.toUpperCase(),
      phoneNumber: phoneNumber.toUpperCase(),
      phone: `${phonePrefix}${phoneNumber}`,
      email: rest.email.toUpperCase(),
      institutionId: rest.institutionId.toUpperCase(),
      status: editingResp?.status ?? true,
    };
    if (editingResp) {
      setPendingSave({ ...(commonData as any), responsibleId: editingResp.responsibleId } as UpdateInstitutionalResponsiblePayload);
    } else {
      setPendingSave(commonData as CreateInstitutionalResponsiblePayload);
    }
    setConfirmSaveOpen(true);
  };

  const handleClose = () => {
    setExistingResponsible(null);
    setViewOnlyMode(false);
    onClose();
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleClose} onCloseAttempt={handleCloseAttempt} size="5xl" showCloseButton>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full overflow-hidden">
          {existingResponsible && (
            <div className="mb-4 p-3 bg-warning-50 dark:bg-warning-500/10 border border-warning-200 dark:border-warning-500/20 rounded-lg mx-4 mt-4">
              <p className="text-sm text-warning-700 dark:text-warning-300">
                Esta cédula ya está registrada. Los campos están en modo visualización. 
                Haga clic en "Habilitar Edición" para modificar.
              </p>
            </div>
          )}
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
                        onAddNew={() => openAddValueModal("Nacionalidad", "identificationPrefix", "Agregar Nacionalidad")}
                        addNewLabel="Nueva opción"
                      />
                    )}
                  />
                </div>
                <div className="flex-1">
                  <Input 
                    value={displayIdentificationNumber}
                    onChange={handleIdentificationNumberChange}
                    placeholder="V00.000.000" 
                    error={!!errors.identificationNumber}
                    hint={isCheckingCi ? "Verificando..." : (errors.identificationNumber?.message || " ")}
                    className="tracking-widest"
                    maxLength={CEDULA_MAX_LENGTH}
                    disabled={!!editingResp || !!existingResponsible}
                    onBlur={async (e) => {
                      if (!existingResponsible && !editingResp) {
                        const val = e.target.value;
                        const digitsOnly = val.replace(/\D/g, '').substring(0, CEDULA_MAX_DIGITS);
                        if (digitsOnly.length >= 6) {
                          setIsCheckingCi(true);
                          const prefix = watch("identificationPrefix") || 'V';
                          const fullCi = `${prefix}-${digitsOnly}`;
                          try {
                            const existingData = await getResponsibleByCi(fullCi);
                            if (existingData) {
                              const message = existingData.status 
                                ? "Esta cédula ya está registrada." 
                                : "Cédula registrada (INACTIVO). Contacte a administración para reactivar.";
                              
                              setError("identificationNumber", { 
                                type: "manual", 
                                message 
                              });

                              setExistingResponsible(existingData);
                              setViewOnlyMode(true);

                              let pPrefix = "";
                              let pNumber = "";
                              if (existingData.phone) {
                                const cleanPh = existingData.phone.replace(/[-\s]/g, '');
                                if (cleanPh.length >= 4) {
                                  pPrefix = cleanPh.substring(0, 4);
                                  pNumber = cleanPh.substring(4);
                                } else {
                                  pNumber = cleanPh;
                                }
                              }

                              setValue("identificationPrefix", existingData.identificationPrefix || 'V');
                              setDisplayIdentificationNumber(formatCedulaDisplay(existingData.identificationNumber || ''));
                              setValue("identificationNumber", existingData.identificationNumber || '');
                              setValue("firstName", existingData.firstName || "");
                              setValue("middleName", existingData.middleName || "");
                              setValue("lastName", existingData.lastName || "");
                              setValue("secondLastName", existingData.secondLastName || "");
                              setValue("phonePrefix", pPrefix);
                              setDisplayPhoneNumber(formatPhoneDisplay(existingData.phone || ""));
                              setValue("phoneNumber", pNumber);
                              setValue("email", existingData.email || "");
                              setValue("cargo", existingData.cargo || "");
                              setValue("institutionId", existingData.institutionId || "");
                            }
                          } catch (err) {
                            console.error("Error checking CI:", err);
                          } finally {
                            setIsCheckingCi(false);
                          }
                        }
                      }
                      register("identificationNumber").onBlur(e);
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Institución */}
            <div className="lg:col-span-1">
              <label className="mb-2 block text-text-secondary dark:text-white/90 font-bold text-xs uppercase tracking-wider">Institución *</label>
              {preselectedInstitutionId ? (
                <div className="px-4 py-2.5 bg-brand-50 dark:bg-brand-500/10 border border-brand-200 dark:border-brand-500/20 rounded-xl">
                  <p className="text-sm font-semibold text-brand-700 dark:text-brand-400">
                    {preselectedInstitutionName || institutionOptions.find(o => o.value === preselectedInstitutionId)?.label || "Institución seleccionada"}
                  </p>
                </div>
              ) : (
                <Controller
                  name="institutionId"
                  control={control}
                  render={({ field }) => (
                    <CustomSelect
                      id="institutionId"
                      options={institutionOptions.map(opt => ({ value: String(opt.value), label: opt.label }))}
                      onChange={field.onChange}
                      value={String(field.value ?? "")}
                      placeholder="Seleccione una institución"
                    />
                  )}
                />
              )}
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
                      <CustomSelect
                        id="phonePrefix"
                        options={PHONE_PREFIX_OPTIONS.map(opt => ({ value: String(opt.value), label: opt.label }))}
                        onChange={field.onChange}
                        value={String(field.value ?? "")}
                        placeholder="Prefijo"
                        error={!!errors.phonePrefix}
                        onAddNew={() => openAddValueModal("PREFIJO", "phonePrefix", "Agregar Código de Área")}
                        addNewLabel="Nueva opción"
                      />
                    )}
                  />
                </div>
<div className="flex-1">
                  <Input 
                    value={displayPhoneNumber}
                    onChange={handlePhoneNumberChange}
                    placeholder="000-0000" 
                    error={!!errors.phoneNumber} 
                    maxLength={PHONE_MAX_LENGTH}
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

            {/* Cargo */}
            <div className="md:col-span-2 lg:col-span-2">
              <label className="mb-2 block text-text-secondary dark:text-white/90 font-bold text-xs uppercase tracking-wider">Cargo</label>
              <Input 
                placeholder="Ej: Gerente de RRHH, Director, etc." 
                className="uppercase"
                {...register("cargo", {
                  onChange: (e) => {
                    e.target.value = e.target.value.toUpperCase();
                  }
                })} 
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
          {existingResponsible ? (
            viewOnlyMode ? (
              <AsyncButton 
                type="button"
                className="min-h-12 px-8 rounded-xl font-bold"
                onClick={() => {
                  setViewOnlyMode(false);
                }}
              >
                Habilitar Edición
              </AsyncButton>
            ) : (
              <AsyncButton 
                type="submit" 
                className="min-h-12 px-8 rounded-xl font-bold"
                loading={isLoading}
                disabled={!isValid}
              >
                Guardar Cambios
              </AsyncButton>
            )
          ) : editingResp ? (
            <AsyncButton 
              variant="primary" 
              type="submit" 
              className="min-h-12 px-8 rounded-xl font-bold"
              loading={isLoading}
              disabled={!isDirty}
            >
              Actualizar
            </AsyncButton>
          ) : (
            <AsyncButton 
              variant="primary" 
              type="submit" 
              className="min-h-12 px-8 rounded-xl font-bold"
              loading={isLoading}
              disabled={!isValid}
            >
              Guardar
            </AsyncButton>
          )}
        </ModalFooter>
      </form>
    </Modal>

    {confirmSaveOpen && (
      <UnifiedDialog
        isOpen={confirmSaveOpen}
        onClose={() => setConfirmSaveOpen(false)}
        onConfirm={async () => {
          if (pendingSave) {
            await onSave(pendingSave);
          }
          setConfirmSaveOpen(false);
        }}
        variant="confirm"
        title={editingResp ? "Confirmar actualización" : "Confirmar registro"}
        message={editingResp ? "¿Desea actualizar los datos del responsable?" : "¿Desea guardar el nuevo responsable?"}
        confirmLabel={editingResp ? "Actualizar" : "Guardar"}
        isLoading={isLoading}
      />
    )}

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

    {/* Modal para agregar nueva opción a la lista */}
    <Modal
      isOpen={isValueModalOpen}
      onClose={() => setIsValueModalOpen(false)}
      size="md"
    >
      <ModalHeader>{valueModalTitle}</ModalHeader>
      <ModalBody>
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Nuevo valor
          </label>
          <Input
            value={newValueInput}
            onChange={(e) => setNewValueInput(e.target.value)}
            placeholder="Ingrese el nuevo valor"
            onKeyDown={(e) => {
              if (e.key === "Enter" && newValueInput.trim() && !savingNewValue) {
                handleSaveNewValue();
              }
            }}
            autoFocus
          />
          <p className="text-xs text-gray-500">
            Presione Enter o haga clic en Guardar para agregar el valor.
          </p>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button
          variant="outline"
          onClick={() => setIsValueModalOpen(false)}
          disabled={savingNewValue}
        >
          Cancelar
        </Button>
        <AsyncButton
          onClick={handleSaveNewValue}
          loading={savingNewValue}
          disabled={!newValueInput.trim()}
        >
          Guardar
        </AsyncButton>
      </ModalFooter>
    </Modal>
  </>
);
}
