/**
 * @file InstitutionModal.tsx
 * @description Modal con formulario para crear y editar instituciones.
 */

import { useEffect, useState, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Input from "../../../components/form/input/InputField";
import CustomSelect from "../../../components/form/CustomSelect";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../../components/ui/modal";
import { Institution, CreateInstitutionPayload, UpdateInstitutionPayload } from "../types";
import Button from "../../../components/ui/button/Button";
import AsyncButton from "../../../components/ui/button/AsyncButton";
import { useUnsavedChanges } from "../../../hooks/useUnsavedChanges";
import UnifiedDialog from "../../../components/ui/dialog/UnifiedDialog";
import { useLists } from "../../lists/hooks/useLists";
import { List } from "../../lists/types";
import * as listsService from "../../lists/services/listsService";

/**
 * Props for the InstitutionModal component.
 */
interface InstitutionModalProps {
  /** Whether the modal is visible */
  isOpen: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** Callback fired when the form is submitted successfully */
  onSave: (inst: CreateInstitutionPayload | UpdateInstitutionPayload) => Promise<void> | void;
  /** The institution record being edited, or null if creating a new one */
  editingInst?: Institution | null;
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
  name: z.string().min(1, "El nombre es obligatorio").max(200, "El nombre no puede exceder 200 caracteres"),
  phonePrefix: z.string().min(1, "Seleccione un prefijo"),
  phoneNumber: z.string()
    .min(1, "El número de teléfono es obligatorio")
    .regex(/^\d+$/, "Solo se admiten números")
    .length(7, "El número debe tener exactamente 7 dígitos"),
  region: z.string().min(1, "Seleccione una región"),
  nucleus: z.string().min(1, "Seleccione un núcleo"),
  extension: z.string().min(1, "Seleccione una extensión"),
  institutionType: z.string().min(1, "Seleccione un tipo de institución"),
  estado: z.string().min(1, "El estado es obligatorio").max(100, "El estado no puede exceder 100 caracteres"),
  municipio: z.string().min(1, "El municipio es obligatorio").max(100, "El municipio no puede exceder 100 caracteres"),
  parroquia: z.string().min(1, "La parroquia es obligatoria").max(100, "La parroquia no puede exceder 100 caracteres"),
  calle: z.string().min(1, "La calle es obligatoria").max(150, "La calle no puede exceder 150 caracteres"),
  avenida: z.string().min(1, "La avenida es obligatoria").max(150, "La avenida no puede exceder 150 caracteres"),
  referencia: z.string().max(200, "La referencia no puede exceder 200 caracteres").optional(),
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
  isLoading = false,
  existingInstitutions = [],
}: InstitutionModalProps) {
  const [options, setOptions] = useState<Record<string, { value: string; label: string }[]>>({});
  const { fetchMultipleLists } = useLists();

  // Estado para agregar nuevos valores a las listas
  const [isValueModalOpen, setIsValueModalOpen] = useState(false);
  const [valueModalTitle, setValueModalTitle] = useState<string>("");
  const [targetListName, setTargetListName] = useState<string>("");
  const [targetField, setTargetField] = useState<string>("");
  const [newValueInput, setNewValueInput] = useState<string>("");
  const [savingNewValue, setSavingNewValue] = useState(false);

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
      phonePrefix: "",
      phoneNumber: "",
      region: "",
      nucleus: "",
      extension: "",
      institutionType: "",
      estado: "",
      municipio: "",
      parroquia: "",
      calle: "",
      avenida: "",
      referencia: "",
    },
  });

  const {
    showConfirmation,
    handleCloseAttempt,
    confirmClose,
    cancelClose,
  } = useUnsavedChanges(isDirty, onClose);
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);
  const [pendingSave, setPendingSave] = useState<CreateInstitutionPayload | UpdateInstitutionPayload | null>(null);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const listNames = [
          "CODIGOS_AREA",
          "Rif",
          "Region",
          "Nucleo",
          "Extensión",
          "Tipo de empresa",
          "ESTADOS_VENEZUELA"
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

  const optionsRif = options.Rif;
  const optionsRegion = options.Region;
  const optionsNucleo = options.Nucleo;
  const optionsExtension = options["Extensión"];
  const optionsTipoEmpresa = options["Tipo de empresa"];
  const optionsCodigosArea = options.CODIGOS_AREA;

  // Funciones para agregar nuevos valores a las listas
  const openAddValueModal = (listName: string, field: keyof InstFormData, title: string) => {
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
        const selectValue = (targetListName === "Rif" && existing.abbreviation)
          ? String(existing.abbreviation).toUpperCase()
          : String(existing.name).toUpperCase();
        setValue(targetField as keyof InstFormData, selectValue, { shouldValidate: true, shouldDirty: true });
        setIsValueModalOpen(false);
        return;
      }

      const abbr = (targetListName === "Rif") ? upper : undefined;
      const created = await listsService.createValue(list!.id, upper, abbr);
      const mapped = {
        value: (targetListName === "Rif" && created.abbreviation) ? created.abbreviation.toUpperCase() : upper,
        label: (targetListName === "Rif" && created.abbreviation) ? created.abbreviation.toUpperCase() : upper
      };

      setOptions(prev => {
        const next = { ...prev };
        const arr = next[targetListName] || [];
        next[targetListName] = [...arr, mapped];
        return next;
      });

      setValue(targetField as keyof InstFormData, mapped.value, { shouldValidate: true, shouldDirty: true });
      setIsValueModalOpen(false);
    } catch (e) {
      console.error("[InstitutionModal] Error creando valor en lista:", e);
    } finally {
      setSavingNewValue(false);
    }
  };

  const VENEZUELA_PHONE_PREFIXES = useMemo(() => {
    const dbPrefixes = optionsCodigosArea || [];
    return dbPrefixes.sort((a, b) => a.label.localeCompare(b.label));
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
        const rifParts = editingInst.rif ? editingInst.rif.split("-") : ["", ""];
        const [phoneP, phoneN] = editingInst.phone ? editingInst.phone.split("-") : ["", ""];

        // Parsear dirección fiscal
        const addressParts = editingInst.fiscalAddress ? editingInst.fiscalAddress.split(", ") : [];
        const getPart = (index: number) => addressParts[index] || "";

        reset({
          rifPrefix: rifParts[0] || "",
          rifNumber: rifParts[1] || "",
          name: editingInst.name,
          phonePrefix: phoneP || "",
          phoneNumber: phoneN || "",
          region: editingInst.region,
          nucleus: editingInst.nucleus,
          extension: editingInst.extension,
          institutionType: editingInst.institutionType,
          estado: getPart(0),
          municipio: getPart(1),
          parroquia: getPart(2),
          calle: getPart(3),
          avenida: getPart(4),
          referencia: getPart(5),
        });
      } else {
        reset({
          rifPrefix: "",
          rifNumber: "",
          name: "",
          phonePrefix: "",
          phoneNumber: "",
          region: "",
          nucleus: "",
          extension: "",
          institutionType: "",
          estado: "",
          municipio: "",
          parroquia: "",
          calle: "",
          avenida: "",
          referencia: "",
        });
      }
    }
  }, [editingInst, isOpen, reset]);

  const onSubmit = (data: InstFormData) => {
    // Construir dirección fiscal desde los campos
    const addressParts = [
      data.estado,
      data.municipio,
      data.parroquia,
      data.calle,
      data.avenida,
      data.referencia,
    ].filter(Boolean);
    const fiscalAddress = addressParts.join(", ");

    const commonData = {
      rif: `${data.rifPrefix}-${data.rifNumber}`.toUpperCase(),
      name: data.name.toUpperCase(),
      fiscalAddress: fiscalAddress.toUpperCase(),
      phone: `${data.phonePrefix}-${data.phoneNumber}`,
      region: data.region.toUpperCase(),
      nucleus: data.nucleus.toUpperCase(),
      extension: data.extension.toUpperCase(),
      institutionType: data.institutionType.toUpperCase(),
      status: editingInst?.status ?? true,
    };
    if (editingInst) {
      setPendingSave({ ...(commonData as any), institutionId: editingInst.institutionId } as UpdateInstitutionPayload);
    } else {
      setPendingSave(commonData as CreateInstitutionPayload);
    }
    setConfirmSaveOpen(true);
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
          <span className="text-xl font-semibold text-text-primary dark:text-white/90">
            {editingInst ? "Editar Institución" : "Registrar Institución"}
          </span>
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
                       onAddNew={() => openAddValueModal("Rif", "rifPrefix", "Agregar Prefijo RIF")}
                       addNewLabel="Nueva opción"
                     />
                   )}
                 />
               </div>
                <div className="flex-1">
                  <Input 
                    placeholder="123456789" 
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
          
          {/* Sección de Dirección Fiscal */}
          <div className="md:col-span-2">
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Dirección Fiscal
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Estado *</label>
                  <Input
                    placeholder="Ej: Portuguesa"
                    className="uppercase"
                    {...register("estado", { onChange: handleUppercaseChange })}
                    error={!!errors.estado}
                  />
                  {errors.estado && <p className="mt-1 text-xs text-red-500">{errors.estado.message}</p>}
                </div>
                
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Municipio *</label>
                  <Input
                    placeholder="Ej: Guanare"
                    className="uppercase"
                    {...register("municipio", { onChange: handleUppercaseChange })}
                    error={!!errors.municipio}
                  />
                  {errors.municipio && <p className="mt-1 text-xs text-red-500">{errors.municipio.message}</p>}
                </div>
                
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Parroquia *</label>
                  <Input
                    placeholder="Ej: San José de la Montaña"
                    className="uppercase"
                    {...register("parroquia", { onChange: handleUppercaseChange })}
                    error={!!errors.parroquia}
                  />
                  {errors.parroquia && <p className="mt-1 text-xs text-red-500">{errors.parroquia.message}</p>}
                </div>
                
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Calle *</label>
                  <Input
                    placeholder="Ej: Calle 5"
                    className="uppercase"
                    {...register("calle", { onChange: handleUppercaseChange })}
                    error={!!errors.calle}
                  />
                  {errors.calle && <p className="mt-1 text-xs text-red-500">{errors.calle.message}</p>}
                </div>
                
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Avenida *</label>
                  <Input
                    placeholder="Ej: Av. Libertador"
                    className="uppercase"
                    {...register("avenida", { onChange: handleUppercaseChange })}
                    error={!!errors.avenida}
                  />
                  {errors.avenida && <p className="mt-1 text-xs text-red-500">{errors.avenida.message}</p>}
                </div>
                
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Referencia</label>
                  <Input
                    placeholder="Ej: Frente al banco"
                    className="uppercase"
                    {...register("referencia", { onChange: handleUppercaseChange })}
                  />
                </div>
              </div>
            </div>
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
                      onAddNew={() => openAddValueModal("CODIGOS_AREA", "phonePrefix", "Agregar Código de Área")}
                      addNewLabel="Nueva opción"
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
                  onAddNew={() => openAddValueModal("Region", "region", "Agregar Región")}
                  addNewLabel="Nueva opción"
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
                  onAddNew={() => openAddValueModal("Nucleo", "nucleus", "Agregar Núcleo")}
                  addNewLabel="Nueva opción"
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
                  onAddNew={() => openAddValueModal("Extensión", "extension", "Agregar Extensión")}
                  addNewLabel="Nueva opción"
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
                  onAddNew={() => openAddValueModal("Tipo de empresa", "institutionType", "Agregar Tipo de Empresa")}
                  addNewLabel="Nueva opción"
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
        title={editingInst ? "Confirmar actualización" : "Confirmar registro"}
        message={editingInst ? "¿Desea actualizar los datos de la institución?" : "¿Desea guardar la nueva institución?"}
        confirmLabel={editingInst ? "Actualizar" : "Guardar"}
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
