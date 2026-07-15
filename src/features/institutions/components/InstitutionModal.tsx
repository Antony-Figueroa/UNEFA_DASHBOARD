/**
 * @file InstitutionModal.tsx
 * @description Modal con formulario para crear y editar instituciones.
 */

import { useEffect, useState, useMemo, useCallback, lazy, Suspense } from "react";
import { useForm, Controller, FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Input from "../../../components/form/input/InputField";
import CustomSelect from "../../../components/form/CustomSelect";
import MultiSelect from "../../../components/form/MultiSelect";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../../components/ui/modal";
import { Tabs } from "../../../components/ui/tabs/Tabs";
import { useTabs } from "../../../hooks/useTabs";
import { Institution, CreateInstitutionPayload, UpdateInstitutionPayload, InstitutionalResponsible, CreateInstitutionalResponsiblePayload, UpdateInstitutionalResponsiblePayload } from "../types";
import Button from "../../../components/ui/button/Button";

import { useUnsavedChanges } from "../../../hooks/useUnsavedChanges";
import UnifiedDialog from "../../../components/ui/dialog/UnifiedDialog";
import { CONFIRM_MESSAGES, SYSTEM_DIALOGS } from "../../../components/ui/dialog/DialogConfig";
import { useLists } from "../../lists/hooks/useLists";
import { getInternshipTypes } from "../../internship-types/services/internshipTypesService";
import { List } from "../../lists/types";
import * as listsService from "../../lists/services/listsService";
import { isProtectedList, PROTECTED_LIST_MESSAGE } from "../../../constants/systemLists";
import InstitutionalResponsibleModal from "./InstitutionalResponsibleModal";
import InstitutionalResponsibleSelectModal from "./InstitutionalResponsibleSelectModal";
import { Search, UserPlus, PlusCircle, ChevronDown, Trash2 } from "lucide-react";
import { Dropdown } from "../../../components/ui/dropdown/Dropdown";
import { DropdownItem } from "../../../components/ui/dropdown/DropdownItem";
import { useToast } from "../../../context/toast";
import { cleanCedula, cleanPhone, cleanRif, formatRifDisplay, RIF_MAX_LENGTH, RIF_INPUT_CLASS, PHONE_LOCAL_MAX_LENGTH, formatPhoneLocalDisplay, PHONE_INPUT_CLASS } from "../../../utils/inputFormat";
import { getInstitutionByRif, checkRifExists } from "../services/institutionsService";
import { SAFE_TEXT_PATTERN, isSafeInput } from "../../../utils/inputValidation";
import GeographicAddressFields from "../../address/components/GeographicAddressFields";
import type { GeographicAddressValue } from "../../address/components/GeographicAddressFields";
import type { GeoOptionsItem } from "../../address/types";
import { addressService } from "../../address/services/addressService";

// Lazy load para evitar dependencia circular con CareerModal
const CareerModal = lazy(() => import("../../careers/components/CareerModal"));
import { useCareers } from "../../careers/hooks/useCareers";
import { CreateCareerPayload } from "../../careers/types";

/**
 * Props for the InstitutionModal component.
 */
interface InstitutionModalProps {
  /** Whether the modal is visible */
  isOpen: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** Callback fired when the form is submitted successfully. Can return institution data for new institutions */
  onSave: (inst: CreateInstitutionPayload | UpdateInstitutionPayload) => Promise<{ institutionId: string; name: string } | undefined> | void;
  /** The institution record being edited, or null if creating a new one */
  editingInst?: Institution | null;
  /** Whether a background action is in progress */
  isLoading?: boolean;
  /** List of existing institutions for validation (e.g., duplicate RIF) */
  existingInstitutions?: Institution[];
  /** List of responsibles for this institution */
  responsibles?: InstitutionalResponsible[];
  /** List of inactive responsibles (history) for this institution */
  responsibleHistory?: InstitutionalResponsible[];
  /** Callback to add a responsible */
  onAddResponsible?: (data: CreateInstitutionalResponsiblePayload) => Promise<void>;
  /** Callback to edit a responsible */
  onEditResponsible?: (data: UpdateInstitutionalResponsiblePayload) => Promise<void>;
  /** Institution options for responsible modal */
  institutionOptions?: { value: string; label: string }[];
  /** Career options for institution (with type IDs for filtering) */
  careerOptions?: { value: string; text: string; internshipTypeIds?: string[] }[];
  /** Options for internship types (from t_internship_type table) - debe incluir id para filtrado */
  internshipTypeOptions?: { value: string; label: string; id?: number }[];
  /** Callback when a new career is created from this modal */
  onCareerCreated?: () => void;
  /** Unique ID for modal stack tracking (optional) */
  modalId?: string;
}

/**
 * Base Zod schema for institution form data.
 */
const baseInstSchema = z.object({
  rifPrefix: z.string().min(1, "El prefijo es obligatorio"),
  rifNumber: z.string()
    .min(1, "El número de RIF es obligatorio")
    .regex(/^\d{9}$/, "El RIF debe tener exactamente 9 números"),
  name: z.string()
    .min(1, "El nombre es obligatorio")
    .max(200, "El nombre no puede exceder 200 caracteres")
    .regex(SAFE_TEXT_PATTERN, "Caracteres no permitidos")
    .refine(val => isSafeInput(val), { message: "Caracteres no permitidos" }),
  phonePrefix: z.string().min(1, "Seleccione un prefijo"),
  phoneNumber: z.string()
    .min(1, "El número de teléfono es obligatorio")
    .regex(/^\d+$/, "Solo se admiten números")
    .length(7, "El número debe tener exactamente 7 dígitos"),
  institutionType: z.string().min(1, "Seleccione un tipo de empresa o institución"),
  internshipTypeId: z.string().min(1, "Seleccione el tipo de práctica"),
  careerIds: z.array(z.string()).min(1, "Seleccione al menos una carrera"),
});

/**
 * Type inferred from the institution form schema.
 */
type InstFormData = z.infer<typeof baseInstSchema>;

/**
 * Creates a Zod schema with refinement for duplicate RIF validation.
 * @param existingInstitutions - List of institutions to check against.
 * @param editingInst - The institution currently being edited (if any).
 * @param rifDuplicateStatus - Status of RIF duplicate confirmation (null/confirmed/rejected)
 */
const createInstSchema = (existingInstitutions: Institution[], editingInst: Institution | null, rifDuplicateStatus: 'confirmed' | 'rejected' | null) => 
  baseInstSchema.superRefine((data, ctx) => {
    // Si el usuario ya confirmó que es parte de la misma organización, NO validar duplicado
    if (rifDuplicateStatus === 'confirmed') {
      return;
    }
    
    const fullRif = `${data.rifPrefix}-${data.rifNumber}`.toUpperCase();
    const isDuplicate = existingInstitutions.some(inst => 
      inst.rif.toUpperCase() === fullRif && inst.institutionId !== editingInst?.institutionId
    );

    if (isDuplicate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Ya existe una empresa o institución registrada con este RIF",
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
  responsibles = [],
  responsibleHistory = [],
  onAddResponsible,
  onEditResponsible,
  institutionOptions = [],
  careerOptions = [],
  internshipTypeOptions = [],
  onCareerCreated,
  modalId,
}: InstitutionModalProps) {
  const [options, setOptions] = useState<Record<string, { value: string; label: string }[]>>({});
  const { fetchMultipleLists } = useLists();
  const { addToast } = useToast();

  // Estado para agregar nuevos valores a las listas
  const [isValueModalOpen, setIsValueModalOpen] = useState(false);
  const [valueModalTitle, setValueModalTitle] = useState<string>("");
  const [targetListName, setTargetListName] = useState<string>("");
  const [targetField, setTargetField] = useState<string>("");
  const [newValueInput, setNewValueInput] = useState<string>("");
  const [savingNewValue, setSavingNewValue] = useState(false);

  // Estado para el modal de responsables
  const [isRespModalOpen, setIsRespModalOpen] = useState(false);
  const [isDecisionOpen, setIsDecisionOpen] = useState(false);
  const [isSelectModalOpen, setIsSelectModalOpen] = useState(false);
  const [isConfirmRemoveOpen, setIsConfirmRemoveOpen] = useState(false);
  const [responsibleToRemove, setResponsibleToRemove] = useState<InstitutionalResponsible | null>(null);
  const [editingResponsible, setEditingResponsible] = useState<InstitutionalResponsible | null>(null);
  const [responsibleLoading, setResponsibleLoading] = useState(false);

  // Estado para el modal de historial de responsables
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Estado para el flujo de agregar responsables después de crear institución
  const [newlyAddedResponsibles, setNewlyAddedResponsibles] = useState<InstitutionalResponsible[]>([]);

  // Resetear estados cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      // Resetear todo los estados relacionados con el flujo de responsables
      setNewlyAddedResponsibles([]);
      setRifDuplicateStatus(null);
      setSavedFormData(null);
      loadOptions();
      loadGeoOptions();
    }
    }, [isOpen]);

  const loadGeoOptions = async () => {
    try {
      const response = await addressService.getGeoOptions();
      setGeoOptions(response.data);
    } catch (error) {
      console.error("Error loading geo options:", error);
    }
  };

  // Estado para el modal de nueva carrera
  const [isNewCareerModalOpen, setIsNewCareerModalOpen] = useState(false);
  const { addCareer } = useCareers();

  // Estado para el modal de RIF duplicado (misma organización)
  const [isRifDuplicateModalOpen, setIsRifDuplicateModalOpen] = useState(false);
  const [rifDuplicateInstitutions, setRifDuplicateInstitutions] = useState<{ INSTITUTION_ID: number; INSTITUTION_NAME: string; RIF: string }[]>([]);
  // rifDuplicateStatus: null = no ha respondido, 'confirmed' = sí es parte, 'rejected' = no es parte
  const [rifDuplicateStatus, setRifDuplicateStatus] = useState<'confirmed' | 'rejected' | null>(null);
  
  // Guardar TODOS los valores del formulario cuando se abre el modal de confirmación
  const [savedFormData, setSavedFormData] = useState<InstFormData | null>(null);
  const [savedDisplayRifNumber, setSavedDisplayRifNumber] = useState<string>("");
  const [savedDisplayPhoneNumber, setSavedDisplayPhoneNumber] = useState<string>("");

  // Fallback: fetch internship types from API when internshipTypeOptions prop is empty
  const [fallbackTypes, setFallbackTypes] = useState<{ id: number; name: string }[]>([]);

  // Determinar si los campos deben estar deshabilitados (todos menos RIF)
  const isFormDisabled = rifDuplicateStatus === 'rejected' || isLoading;

  // Handle responsible removal confirmation
  const handleConfirmRemove = async () => {
    if (responsibleToRemove && onEditResponsible) {
      try {
        // Filtrar las instituciones para quitar la actual
        const currentInstId = editingInst?.institutionId || "";
        const filteredInstitutions = (responsibleToRemove.institutions || [])
          .filter(inst => inst.institutionId !== currentInstId);
        
        await onEditResponsible({
          responsibleId: responsibleToRemove.responsibleId,
          institutions: filteredInstitutions,
          status: true
        });
        setIsConfirmRemoveOpen(false);
        setResponsibleToRemove(null);
        addToast({
          variant: "success",
          title: "Desvinculado",
          message: "Responsable desvinculado exitosamente"
        });
      } catch (error) {
        console.error("Error unlinking responsible:", error);
        addToast({
          variant: "error",
          title: "Error",
          message: "No se pudo desvincular al responsable"
        });
      }
    }
  };

  // State for display values with formatting
  const [displayRifNumber, setDisplayRifNumber] = useState("");
  const [displayPhoneNumber, setDisplayPhoneNumber] = useState("");

  // State for tabs in the form
  const tabsState = useTabs({ defaultTab: 'identificacion' });
  useEffect(() => { if (isOpen) tabsState.setActiveTab('identificacion'); }, [isOpen]);

  // Fetch internship types from API when prop is empty (fallback for name→ID mapping)
  useEffect(() => {
    if (isOpen && (!internshipTypeOptions || internshipTypeOptions.length === 0) && fallbackTypes.length === 0) {
      getInternshipTypes()
        .then(types => setFallbackTypes(types.map(t => ({ id: t.id, name: t.name }))))
        .catch(() => {});
    }
  }, [isOpen, internshipTypeOptions, fallbackTypes.length]);

  // State for duplicate detection
  const [isCheckingRif, setIsCheckingRif] = useState(false);
  const [existingInstitution, setExistingInstitution] = useState<any | null>(null);
  const [viewOnlyMode, setViewOnlyMode] = useState(false);

  // State for inline address capture
  const [inlineAddress, setInlineAddress] = useState<GeographicAddressValue>({
    parroquiaId: null, streetAddress: '', reference: '', addressTypeId: 3, isPrimary: true,
  });

  // State for structured address management
  const [geoOptions, setGeoOptions] = useState<GeoOptionsItem[]>([]);

  // Handle RIF number input change with formatting and auto-verify
  const handleRifNumberChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const cleaned = cleanRif(input);
    const formatted = formatRifDisplay(cleaned);
    setDisplayRifNumber(formatted);
    setValue("rifNumber", cleaned, { shouldValidate: true, shouldDirty: true });
    
    // Si el usuario cambia el RIF (lo borra o modifica), resetear todo el estado de confirmación
    if (rifDuplicateStatus && cleaned.length < 9) {
      setRifDuplicateStatus(null);
      clearErrors("rifNumber");
      setSavedFormData(null); // Limpiar datos guardados
    }
    
    // Auto-verificar cuando complete los 9 dígitos
    if (cleaned.length === 9 && !existingInstitution && !editingInst) {
      setIsCheckingRif(true);
      const prefix = watch("rifPrefix") || 'J';
      const fullRif = `${prefix}-${cleaned}`;
      try {
        const rifCheck = await checkRifExists(fullRif);
        
        if (rifCheck && rifCheck.exists) {
          // Si ya confirmó antes y el RIF es el mismo, no hacer nada
          if (rifDuplicateStatus === 'confirmed') {
            setIsCheckingRif(false);
            return;
          }
          // Si ya rechazó antes, mostrar error
          if (rifDuplicateStatus === 'rejected') {
            setError("rifNumber", {
              type: "manual",
                                      message: "Ya existe una empresa o institución registrada con este RIF"
                                    });
            setIsCheckingRif(false);
            return;
          }
          // Primera vez: mostrar modal de confirmación
          // GUARDAR valores del RIF directamente de watch()
          const currentRifValue = watch("rifNumber");
          setSavedFormData(watch());
          setSavedDisplayRifNumber(currentRifValue); // Guardar el valor sin formato
          setSavedDisplayPhoneNumber(displayPhoneNumber);
          setRifDuplicateInstitutions(rifCheck.institutions);
          setIsRifDuplicateModalOpen(true);
          setIsCheckingRif(false);
          return;
        }
        
        // Si no existe y había confirmación previa, resetear
        if (rifDuplicateStatus === 'confirmed') {
          setRifDuplicateStatus(null);
        }
      } catch (err) {
        console.error("Error checking RIF:", err);
      } finally {
        setIsCheckingRif(false);
      }
    }
  };

  // Handle phone number input change with formatting
  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const cleaned = cleanPhone(input);
    const formatted = formatPhoneLocalDisplay(cleaned);
    setDisplayPhoneNumber(formatted);
    setValue("phoneNumber", formatted, { shouldValidate: true, shouldDirty: true });
  };

  const instSchema = useMemo(() => createInstSchema(existingInstitutions, editingInst || null, rifDuplicateStatus), [existingInstitutions, editingInst, rifDuplicateStatus]);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    setError,
    clearErrors,
    formState: { errors, isDirty, isValid, touchedFields },
  } = useForm<InstFormData>({
    resolver: zodResolver(instSchema),
    mode: "onChange",
    defaultValues: {
      rifPrefix: "G",
      rifNumber: "",
      name: "",
      phonePrefix: "",
      phoneNumber: "",
      institutionType: "",
      internshipTypeId: "",
      careerIds: [],
    },
  });

  const {
    showConfirmation,
    handleCloseAttempt,
    confirmClose,
    cancelClose,
  } = useUnsavedChanges(isDirty, onClose);

  const TAB_IDS = ['identificacion', 'contacto', 'configuracion'] as const;
  const TAB_FIELDS: Record<string, string[]> = {
    'identificacion': ['rifPrefix', 'rifNumber', 'name', 'institutionType'],
    'contacto': ['phonePrefix', 'phoneNumber'],
    'configuracion': ['internshipTypeId', 'careerIds'],
  };
  const isFieldValid = useCallback((fieldName: string) =>
    !!(touchedFields as any)[fieldName] && !(errors as any)[fieldName],
    [touchedFields, errors]);
  const errorsByTab = useMemo(() => {
    const keys = Object.keys(errors);
    const counts: Record<string, number> = {};
    for (const tab of TAB_IDS) counts[tab] = keys.filter(k => TAB_FIELDS[tab].includes(k)).length;
    return counts;
  }, [errors]);
  const onFormError = useCallback((formErrors: FieldErrors<InstFormData>) => {
    const firstTab = TAB_IDS.find(tab => TAB_FIELDS[tab].some(f => (formErrors as Record<string, any>)[f]));
    if (firstTab) {
      tabsState.setActiveTab(firstTab);
      requestAnimationFrame(() => {
        const firstErrorEl = document.querySelector<HTMLElement>('[aria-invalid="true"]');
        firstErrorEl?.focus();
      });
    }
  }, []);

  const loadOptions = async () => {
    try {
      const listNames = [
        "PREFIJO",
        "Rif",
        "Tipo de empresa",
        "TIPO DE PRACTICA"
      ];
      const data = await fetchMultipleLists(listNames);
      const mappedOptions: Record<string, { value: string; label: string }[]> = {};
      
      Object.entries(data).forEach(([key, values]) => {
        mappedOptions[key] = values.map(v => {
          // Para Rif y Nacionalidad usamos la abreviación (siempre mayúsculas)
          const useAbbr = ["Rif", "Nacionalidad"].includes(key) && v.abbreviation;
          const displayValue = useAbbr ? v.abbreviation : v.name;
          
          return {
            value: useAbbr ? displayValue.toUpperCase() : displayValue,
            label: useAbbr ? displayValue.toUpperCase() : displayValue
          };
        });
      });
      
      setOptions(mappedOptions);
    } catch (error) {
      console.error("Error loading list options:", error);
    }
  };

  const optionsRif = options.Rif;
  const optionsTipoEmpresa = options["Tipo de empresa"];
  const optionsCodigosArea = options.PREFIJO;
  const optionsTipoPractica = options["TIPO DE PRACTICA"];

  // Opciones de tipo de práctica - usar prop si está disponible, si no usar lista dinámica
  const PRACTICE_TYPE_OPTIONS = useMemo(() => {
    // Si se pasan opciones como prop (de t_internship_type), usarlas
    if (internshipTypeOptions && internshipTypeOptions.length > 0) {
      return internshipTypeOptions.map(opt => ({
        // Usar el ID (opt.id) como value para que el filtrado funcione correctamente
        value: String(opt.id),
        label: opt.label
      }));
    }
    
    // Fallback: usar lista dinámica (TIPO DE PRACTICA de t_list) + lookup dinámico desde la API
    const baseOptions = (optionsTipoPractica || []);
    
    return baseOptions.map(opt => {
      const normalizedValue = opt.value.toUpperCase();
      // Lookup dinámico: encontrar el tipo por nombre desde los datos fetcheados
      const match = fallbackTypes.find(t => t.name.toUpperCase() === normalizedValue);
      if (match) {
        return { value: String(match.id), label: match.name.toUpperCase() };
      }
      // Si no se encuentra en la API, pasar el valor crudo (el backend lo resolverá)
      return { value: opt.value, label: opt.label.toUpperCase() };
    }).filter(Boolean) as { value: string; label: string }[];
  }, [internshipTypeOptions, optionsTipoPractica, fallbackTypes]);

  // Opciones para CareerModal (usa prop + fallback, no solo la prop)
  const careerInternshipOptions = useMemo(() => {
    // Si hay opciones como prop, usarlas
    if (internshipTypeOptions && internshipTypeOptions.length > 0) {
      return internshipTypeOptions
        .filter(opt => opt.id)
        .map(opt => ({
          id: opt.id!,
          value: opt.value,
          label: opt.label,
          text: opt.label
        }));
    }
    // Fallback: usar los tipos fetcheados desde la API
    return fallbackTypes.map(t => ({
      id: t.id,
      value: String(t.id),
      label: t.name,
      text: t.name
    }));
  }, [internshipTypeOptions, fallbackTypes]);

  // Observar el tipo de práctica seleccionado para filtrar carreras
  const selectedInternshipType = watch("internshipTypeId");

  // Opciones de carreras filtradas según el tipo de práctica seleccionado
  // La lógica busca que la carrera TENGA ASOCIADO el tipo de práctica seleccionado
  const CAREER_OPTIONS = useMemo(() => {
    if (!careerOptions || careerOptions.length === 0) {
      return [];
    }

    if (!selectedInternshipType) {
      // Si no hay tipo de práctica seleccionado, mostrar todas las carreras
      return careerOptions;
    }

    // El selectedInternshipType es el ID del tipo de práctica (1, 2, o 3)
    // Filtrar carreras que tienen este tipo de práctica en su campo internshipTypeIds
    const filtered = careerOptions.filter(career => {
      const typeIds = career.internshipTypeIds || [];
      // Comparar usando string - ambos deben ser string para el includes
      console.log('Filtering careers:');
      console.log('  selectedInternshipType:', selectedInternshipType);
      console.log('  career.careerName:', career.text);
      console.log('  career.internshipTypeIds:', typeIds);
      console.log('  Includes result:', typeIds.includes(String(selectedInternshipType)));
      return typeIds.includes(String(selectedInternshipType));
    });
    
    return filtered;
  }, [careerOptions, selectedInternshipType]);

  // Flag to avoid clearing careers during initial load
  const [isInitialized, setIsInitialized] = useState(false);

  // Effect que escucha cambios en editingInst para actualizar el formulario cuando llegan datos frescos
  useEffect(() => {
    if (!isOpen || !editingInst) return;
    
    // Verificar si tenemos datos frescos (con internshipTypeIds o internshipTypeId)
    const hasFreshData = (editingInst.internshipTypeIds && editingInst.internshipTypeIds.length > 0) || editingInst.internshipTypeId;
    
    // Solo actualizar si ya estaba inicializado Y tenemos datos frescos
    if (isInitialized && hasFreshData) {
      // Los datos cambiaron, necesitamos重新设置表单
      const rifParts = editingInst.rif ? editingInst.rif.split("-") : ["", ""];
      const [phoneP, phoneN] = editingInst.phone ? editingInst.phone.split("-") : ["", ""];

      const internshipTypeId =
        editingInst.internshipTypeId
          ? String(editingInst.internshipTypeId)
          : editingInst.internshipTypeIds && editingInst.internshipTypeIds.length > 0
          ? String(editingInst.internshipTypeIds[0])
          : editingInst.practiceType
          ? String(editingInst.practiceType)
          : "";

      reset({
        rifPrefix: rifParts[0] || "",
        rifNumber: rifParts[1] || "",
        name: editingInst.name,
        phonePrefix: phoneP || "",
        phoneNumber: phoneN || "",
        institutionType: editingInst.institutionType?.toUpperCase() || "",
        internshipTypeId: internshipTypeId,
        careerIds: editingInst.careerIds || [],
      });
    }
  }, [editingInst, isOpen, isInitialized]);

  // Effect para limpiar careerIds cuando cambie el tipo de práctica, PERO SOLO después de la inicialización
  useEffect(() => {
    if (isInitialized && selectedInternshipType && CAREER_OPTIONS.length > 0) {
      const currentCareerIds = watch("careerIds") || [];
      const validCareerIds = currentCareerIds.filter(id => 
        CAREER_OPTIONS.some(c => c.value === id)
      );
      
      if (validCareerIds.length !== currentCareerIds.length) {
        setValue("careerIds", validCareerIds, { shouldValidate: true, shouldDirty: true });
      }
    }
  }, [selectedInternshipType, CAREER_OPTIONS, setValue, watch, isInitialized]);

  // Funciones para agregar nuevos valores a las listas
  const openAddValueModal = (listName: string, field: keyof InstFormData, title: string) => {
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

  const INSTITUTION_TYPE_OPTIONS = useMemo(() => {
    return (optionsTipoEmpresa || []).sort((a, b) => a.label.localeCompare(b.label));
  }, [optionsTipoEmpresa]);

  useEffect(() => {
    if (isOpen) {
      if (editingInst) {
        const rifParts = editingInst.rif ? editingInst.rif.split("-") : ["", ""];
      const [phoneP, phoneN] = editingInst.phone ? editingInst.phone.split("-") : ["", ""];

      const internshipTypeId =
        editingInst.internshipTypeId
          ? String(editingInst.internshipTypeId)
          : editingInst.internshipTypeIds && editingInst.internshipTypeIds.length > 0
          ? String(editingInst.internshipTypeIds[0])
          : editingInst.practiceType
          ? String(editingInst.practiceType)
          : "";

      reset({
        rifPrefix: rifParts[0] || "",
        rifNumber: rifParts[1] || "",
        name: editingInst.name,
        phonePrefix: phoneP || "",
        phoneNumber: phoneN || "",
        institutionType: editingInst.institutionType?.toUpperCase() || "",
        internshipTypeId: internshipTypeId,
        careerIds: editingInst.careerIds || [],
      });
        const formattedRif = formatRifDisplay(rifParts[1] || "");
        const formattedPhone = formatPhoneLocalDisplay(phoneN || "");
        setDisplayRifNumber(formattedRif);
        setDisplayPhoneNumber(formattedPhone);
        
        // Marcar como inicializado después de permitir que los valores se asienten
        setTimeout(() => setIsInitialized(true), 200);
      } else {
        // NUEVA INSTITUCIÓN: siempre hacer reset
        // Limpiar estados de RIF duplicado
        setRifDuplicateStatus(null);
        setSavedFormData(null);
        
        reset({
          rifPrefix: "G",
          rifNumber: "",
          name: "",
          phonePrefix: "",
          phoneNumber: "",
          institutionType: "",
          internshipTypeId: "",
          careerIds: [],
        });
        setDisplayRifNumber("");
        setDisplayPhoneNumber("");
        setIsInitialized(true);
      }
    } else {
      setIsInitialized(false);
    }
  }, [editingInst, isOpen, reset, optionsTipoPractica, careerOptions, internshipTypeOptions]);

  const onSubmit = async (data: InstFormData) => {
    const commonData = {
      rif: `${data.rifPrefix}-${data.rifNumber}`.toUpperCase(),
      name: data.name.toUpperCase(),
      phone: `${data.phonePrefix}-${data.phoneNumber}`,
      institutionType: data.institutionType.toUpperCase(),
      internshipTypeId: data.internshipTypeId,
      careerIds: data.careerIds,
      status: editingInst?.status ?? true,
      fiscalAddress: inlineAddress.streetAddress ? `${inlineAddress.streetAddress}${inlineAddress.reference ? ` - ${inlineAddress.reference}` : ''}` : editingInst?.fiscalAddress || '',
    };
    
    try {
      if (editingInst) {
        await onSave({ ...(commonData as any), institutionId: editingInst.institutionId } as UpdateInstitutionPayload);
      } else {
        await onSave(commonData as CreateInstitutionPayload);
      }
    } catch (saveError) {
      console.error("[InstitutionModal] Error al guardar:", saveError);
      // NO cerrar el modal ni limpiar el formulario - el usuario debe poder reintentar
      addToast({
        variant: "error",
        title: "Error al guardar",
        message: "No se pudo guardar la empresa o institución. Por favor verifique los datos e intente de nuevo."
      });
    }
  };

  const handleFormSubmit = handleSubmit(onSubmit, onFormError);

  const handleClose = () => {
    setExistingInstitution(null);
    setViewOnlyMode(false);
    setRifDuplicateStatus(null); // Resetear estado de RIF duplicado al cerrar
    setSavedFormData(null); // Limpiar datos guardados
    onClose();
  };

  /**
   * Helper to convert input value to uppercase.
   */
  const handleUppercaseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const start = e.target.selectionStart;
    const end = e.target.selectionEnd;
    e.target.value = e.target.value.toUpperCase();
    e.target.setSelectionRange(start, end);
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleClose} onCloseAttempt={handleCloseAttempt} showCloseButton size="5xl" modalId={modalId}>
        <ModalHeader>
          <span className="text-xl font-semibold text-text-primary dark:text-white/90">
            {editingInst ? "Editar Empresa o Institución" : "Registrar Empresa o Institución"}
          </span>
          <p className="text-sm text-text-secondary">Complete la información de la empresa o institución.</p>
        </ModalHeader>
      <ModalBody className="bg-bg-secondary/30 dark:bg-bg-dark/50 relative">
        {isLoading && editingInst && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-bg-secondary/60 dark:bg-bg-dark/60 rounded-lg backdrop-blur-[1px]">
            <div className="flex flex-col items-center gap-3">
              <svg className="animate-spin h-8 w-8 text-brand-500" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-sm text-text-secondary font-medium">Cargando datos de la empresa o institución...</span>
            </div>
          </div>
        )}
        <form onSubmit={handleFormSubmit} className={`grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 ${isLoading && editingInst ? 'opacity-50 pointer-events-none' : ''}`}>
          {existingInstitution && (
            <div className="mb-4 p-3 bg-warning-50 dark:bg-warning-500/10 border border-warning-200 dark:border-warning-500/20 rounded-lg md:col-span-2">
              <p className="text-sm text-warning-700 dark:text-warning-300">
                Este RIF ya está registrado. Los campos están en modo visualización. 
                Haga clic en "Habilitar Edición" para modificar.
              </p>
            </div>
          )}
          
          <Tabs
            options={[
              { 
                id: 'identificacion', 
                label: 'Identificación', 
                errorCount: errorsByTab['identificacion'],
              },
              { 
                id: 'contacto', 
                label: 'Contacto y Dirección', 
                errorCount: errorsByTab['contacto'],
              },
              { 
                id: 'configuracion', 
                label: 'Configuración', 
                errorCount: errorsByTab['configuracion'],
              },
            ]}
            {...tabsState.tabProps}
            variant="modal"
            className="mb-6 md:col-span-2"
            onTabChange={tabsState.setActiveTab}
          />

          <div hidden={tabsState.activeTab !== 'identificacion'} role="tabpanel" className="contents">
          <div>
            <label className="text-sm font-medium text-text-primary dark:text-white/90">RIF <span className="text-red-500">*</span></label>
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
                      value={displayRifNumber}
                      onChange={handleRifNumberChange}
                      placeholder="12345678-9" 
                      className={`uppercase ${RIF_INPUT_CLASS}`}
                       error={!!errors.rifNumber}
                       success={isFieldValid('rifNumber')}
                       hint={errors.rifNumber?.message || (isCheckingRif ? "Verificando..." : (rifDuplicateStatus === 'confirmed' ? "RIF ya existe, se generará código interno único" : " "))}
                      disabled={!!editingInst || !!existingInstitution}
                      maxLength={RIF_MAX_LENGTH}
                      onBlur={async (e) => {
                        if (!existingInstitution && !editingInst) {
                          const value = e.target.value;
                          const cleaned = cleanRif(value);
                          if (cleaned.length >= 9) {
                            setIsCheckingRif(true);
                            const prefix = watch("rifPrefix") || 'J';
                            const fullRif = `${prefix}-${cleaned}`;
                            try {
                              // Usar checkRifExists para obtener más información
                              const rifCheck = await checkRifExists(fullRif);
                              
                               if (rifCheck && rifCheck.exists) {
                                 // Si ya confirmó antes (sí es parte), continuar normalmente
                                 if (rifDuplicateStatus === 'confirmed') {
                                   setIsCheckingRif(false);
                                   return;
                                 }
                                 // Si ya rechazó antes (no es parte), mostrar error
                                 if (rifDuplicateStatus === 'rejected') {
                                   setError("rifNumber", {
                                     type: "manual",
                                     message: "Ya existe una institución registrada con este RIF"
                                   });
                                   setIsCheckingRif(false);
                                   return;
                                 }
                                 // Primera vez: mostrar modal de confirmación
                                 setRifDuplicateInstitutions(rifCheck.institutions);
                                 setIsRifDuplicateModalOpen(true);
                                 setIsCheckingRif(false);
                                 return;
                               }
                               
                               // Si no existe, continuar normalmente (no hay institución con este RIF)
                               // Y resetear el estado de confirmación
                               if (rifDuplicateStatus) {
                                 setRifDuplicateStatus(null);
                                 clearErrors("rifNumber");
                               }
                            } catch (err) {
                              console.error("Error checking RIF:", err);
                            } finally {
                              setIsCheckingRif(false);
                            }
                          }
                        }
                        register("rifNumber").onBlur(e);
                      }}
                    />
                  </div>
               </div>
          </div>
          <div>
            <label className="text-sm font-medium text-text-primary dark:text-white/90">Nombre <span className="text-red-500">*</span></label>
            <Input 
                    placeholder="Nombre de la empresa o institución"
              className="uppercase"
              {...register("name", {
                onChange: handleUppercaseChange
              })} 
               error={!!errors.name} 
               success={isFieldValid('name')}
               hint={errors.name?.message}
               disabled={isFormDisabled || !!editingInst}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-text-primary dark:text-white/90">Tipo de Empresa o Institución <span className="text-red-500">*</span></label>
            <Controller
              name="institutionType"
              control={control}
              render={({ field }) => (
                <CustomSelect
                  id="institutionType"
                  options={INSTITUTION_TYPE_OPTIONS}
                  onChange={field.onChange}
                  value={String(field.value ?? "")}
                  placeholder="Seleccione el tipo"
                  error={!!errors.institutionType}
                  disabled={isFormDisabled}
                  onAddNew={() => openAddValueModal("Tipo de empresa", "institutionType", "Agregar Tipo de Empresa")}
                  addNewLabel="Nueva opción"
                />
              )}
            />
            {errors.institutionType && (
              <p className="mt-1 text-xs text-red-500">{errors.institutionType.message}</p>
            )}
          </div>
          </div>
          
          <div hidden={tabsState.activeTab !== 'contacto'} role="tabpanel" className="contents">
          <div>
            <label className="text-sm font-medium text-text-primary dark:text-white/90">Teléfono <span className="text-red-500">*</span></label>
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
                      disabled={isFormDisabled}
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
                  className={PHONE_INPUT_CLASS}
                  maxLength={PHONE_LOCAL_MAX_LENGTH}
                   error={!!errors.phoneNumber || !!errors.phonePrefix} 
                   success={isFieldValid('phoneNumber')}
                   disabled={isFormDisabled}
                />
              </div>
            </div>
            {errors.phoneNumber && (
              <p className="mt-1 text-xs text-error-500 flex items-center gap-1">
                <span className="inline-block w-1 h-1 bg-error-500 rounded-full"></span>
                {errors.phoneNumber.message}
              </p>
            )}
          </div>

          {/* Dirección Fiscal */}
          <div className="md:col-span-2">
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
              <h3 className="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Dirección Fiscal</h3>
              <GeographicAddressFields
                geoOptions={geoOptions}
                value={inlineAddress}
                onChange={setInlineAddress}
                showReference
              />
            </div>
          </div>
          </div>

          <div hidden={tabsState.activeTab !== 'configuracion'} role="tabpanel" className="contents">

          {/* Tipo de Práctica que acepta la institución */}
          <div>
            <label className="text-sm font-medium text-text-primary dark:text-white/90">Tipo de Práctica <span className="text-red-500">*</span></label>
            <Controller
              name="internshipTypeId"
              control={control}
              render={({ field }) => (
                <CustomSelect
                  id="internshipTypeId"
                  options={PRACTICE_TYPE_OPTIONS}
                  onChange={field.onChange}
                  value={String(field.value ?? "")}
                  placeholder="Seleccione el tipo"
                  error={!!errors.internshipTypeId}
                  disabled={isFormDisabled}
                />
              )}
            />
            {errors.internshipTypeId && (
              <p className="mt-1 text-xs text-red-500">{errors.internshipTypeId.message}</p>
            )}
          </div>

          {/* Carreras que atiende la institución */}
          <div>
            <Controller
              name="careerIds"
              control={control}
              render={({ field }) => (
                <MultiSelect
                  label={<span>Carreras <span className="text-red-500">*</span></span>}
                  options={CAREER_OPTIONS}
                  onChange={field.onChange}
                  value={field.value}
                  placeholder={selectedInternshipType ? "Seleccione las carreras" : "Seleccione primero el tipo de práctica"}
                  disabled={!selectedInternshipType || isFormDisabled}
                  onAddNew={() => setIsNewCareerModalOpen(true)}
                  addNewLabel="Crear nueva carrera"
                />
              )}
            />
            {errors.careerIds && (
              <p className="mt-1 text-xs text-red-500">{errors.careerIds.message}</p>
            )}
          </div>

          {/* Sección de Responsables Institucionales */}
          {editingInst && (
            <div className="md:col-span-2">
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Responsables Institucionales
                  </h3>
                  <div className="flex items-center gap-2">
                    {responsibleHistory && responsibleHistory.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsHistoryModalOpen(true)}
                        className="text-gray-600 hover:text-gray-800 dark:text-gray-400"
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Historial ({responsibleHistory.length})
                      </Button>
                    )}
                    <div className="relative">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsDecisionOpen(!isDecisionOpen)}
                        className="dropdown-toggle"
                        endIcon={<ChevronDown className="w-4 h-4 ml-1 opacity-50" />}
                      >
                        <PlusCircle className="w-4 h-4 mr-1" />
                        Agregar
                      </Button>
                      
                      <Dropdown 
                        isOpen={isDecisionOpen} 
                        onClose={() => setIsDecisionOpen(false)}
                        align="right"
                        className="w-56"
                      >
                        <DropdownItem
                          onClick={() => {
                            setIsDecisionOpen(false);
                            setIsSelectModalOpen(true);
                          }}
                          icon={<Search className="w-4 h-4" />}
                        >
                          Buscar Existente
                        </DropdownItem>
                        <DropdownItem
                          onClick={() => {
                            setIsDecisionOpen(false);
                            setIsRespModalOpen(true);
                          }}
                          icon={<UserPlus className="w-4 h-4" />}
                        >
                          Registrar Nuevo
                        </DropdownItem>
                      </Dropdown>
                    </div>
                  </div>
                </div>

                {responsibles.length > 0 ? (
                  <div className="space-y-2">
                    {responsibles.map((resp) => (
                      <div
                        key={resp.responsibleId}
                        className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {resp.firstName} {resp.lastName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {resp.identificationPrefix}-{resp.identificationNumber} • {resp.email}
                            {(() => {
                              const currentInst = resp.institutions?.find(i => 
                                String(i.institutionId) === String(editingInst?.institutionId)
                              );
                              const cargoDisplay = currentInst?.cargo || resp.cargo;
                              return cargoDisplay ? ` • ${cargoDisplay}` : '';
                            })()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingResponsible(resp);
                              setIsRespModalOpen(true);
                            }}
                            className="text-blue-600 hover:text-blue-700"
                            aria-label="Editar Responsable"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setResponsibleToRemove(resp);
                              setIsConfirmRemoveOpen(true);
                            }}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                            aria-label="Quitar de esta empresa o institución"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                    <svg className="w-8 h-8 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className="text-sm">No hay responsables registrados</p>
                    <p className="text-xs mt-1">Agregue un responsable haciendo clic en el botón</p>
                  </div>
                )}
              </div>
            </div>
          )}

          </div>

          {/* Botón oculto para permitir submit con Enter */}
          <button type="submit" className="hidden" />

        </form>
      </ModalBody>
      <ModalFooter className="sticky-footer">
        <>
          <Button variant="outline" onClick={handleCloseAttempt} disabled={isLoading}>
            Cancelar
          </Button>
          {existingInstitution ? (
            viewOnlyMode ? (
              <Button 
                type="button"
                onClick={() => {
                  setViewOnlyMode(false);
                }}
              >
                Habilitar Edición
              </Button>
            ) : (
              <Button onClick={handleFormSubmit} loading={isLoading} loadingText="Guardando..." disabled={!isValid}>
                Guardar Cambios
              </Button>
            )
          ) : editingInst ? (
            <Button onClick={handleFormSubmit} loading={isLoading} loadingText="Guardando..." disabled={!isDirty}>
              Guardar Cambios
            </Button>
          ) : (
            <Button onClick={handleFormSubmit} loading={isLoading} loadingText="Guardando..." disabled={!isValid}>
              Guardar Empresa
            </Button>
          )}
        </>
      </ModalFooter>
    </Modal>



    {/* Modal para seleccionar responsable existente */}
    <InstitutionalResponsibleSelectModal
      isOpen={isSelectModalOpen}
      onClose={() => setIsSelectModalOpen(false)}
      currentInstitutionId={editingInst?.institutionId}
      onSelect={async (resp) => {
        if (onEditResponsible) {
          try {
            // Agregar la institución actual al array de instituciones del responsable
            const newInstitution = {
              institutionId: editingInst?.institutionId || "",
              institutionName: editingInst?.name || "",
              cargo: ""
            };
            const currentInstitutions = resp.institutions || [];
            await onEditResponsible({
              responsibleId: resp.responsibleId,
              institutions: [...currentInstitutions, newInstitution],
              status: true 
            });
            setIsSelectModalOpen(false);
          } catch (error) {
            console.error("Error linking existing responsible:", error);
            addToast({
              variant: "error",
              title: "Error",
              message: "No se pudo vincular el responsable"
            });
          }
        }
      }}
    />

    {/* Diálogo de confirmación para desvincular responsable */}
    <UnifiedDialog
      isOpen={isConfirmRemoveOpen}
      onClose={() => setIsConfirmRemoveOpen(false)}
      variant="error"
      title="Desvincular Responsable"
      confirmLabel="Desvincular"
      message={`¿Estás seguro de que deseas quitar a ${responsibleToRemove?.firstName} ${responsibleToRemove?.lastName} de esta empresa o institución? Dejará de aparecer en este listado pero sus datos se mantendrán en el sistema.`}
      onConfirm={handleConfirmRemove}
    />

    <UnifiedDialog
      isOpen={showConfirmation}
      onClose={cancelClose}
      onConfirm={confirmClose}
      variant="warning"
      {...SYSTEM_DIALOGS.closeWithoutSaving}
    />

    {/* Modal de confirmación de RIF duplicado */}
    <UnifiedDialog
      isOpen={isRifDuplicateModalOpen}
      onClose={() => {
        // Solo cerrar el modal, no hacer nada más
        setIsRifDuplicateModalOpen(false);
      }}
      onConfirm={async () => {
        // Usuario confirma que es parte de la misma organización
        // Los valores ya están guardados en savedFormData cuando se abrió el modal
        
        // FORZAR que los valores se mantengan inmediatamente
        if (savedFormData) {
          setValue("rifPrefix", savedFormData.rifPrefix);
          setValue("rifNumber", savedFormData.rifNumber);
          // Formatear el valor para display
          setDisplayRifNumber(formatRifDisplay(savedFormData.rifNumber));
          setDisplayPhoneNumber(savedDisplayPhoneNumber);
        }
        
        setRifDuplicateStatus('confirmed');
        setIsRifDuplicateModalOpen(false);
        
        // Limpiar cualquier error manual anterior
        clearErrors("rifNumber");
      }}
      variant="warning"
      title="RIF ya existe"
      message={
        <div className="text-left">
          <p className="mb-3">¿Esta empresa o institución es parte de la misma organización que las siguientes?</p>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 max-h-40 overflow-y-auto">
            {rifDuplicateInstitutions.map((inst) => (
              <div key={inst.INSTITUTION_ID} className="text-sm py-1 border-b border-gray-200 dark:border-gray-700 last:border-0">
                <span className="font-medium">{inst.INSTITUTION_NAME}</span>
                <span className="text-gray-500 ml-2">- RIF: {inst.RIF}</span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-sm text-gray-600">
            Si confirma, se generará un código interno único para esta empresa o institución.
          </p>
        </div>
      }
      confirmLabel="Sí, es parte de la organización"
      cancelLabel="No, es un error"
    />

    {/* Modal para agregar nueva opción a la lista */}
    <Modal
      isOpen={isValueModalOpen}
      onClose={() => setIsValueModalOpen(false)}
      size="md"
      modalId={`${modalId}-value`}
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
        <Button
          onClick={handleSaveNewValue}
          loading={savingNewValue}
          loadingText="Guardando..."
          disabled={!newValueInput.trim()}
        >
          Guardar
        </Button>
      </ModalFooter>
    </Modal>

    {/* Modal de Responsables Institucionales */}
    <InstitutionalResponsibleModal
      isOpen={isRespModalOpen}
      onClose={() => {
        setIsRespModalOpen(false);
        setEditingResponsible(null);
      }}
      onSave={async (data) => {
        try {
          setResponsibleLoading(true);
          if (editingResponsible) {
            // Si el responsable estaba inactivo, reactívalo al editar
            // Actualizar el cargo en la institución actual
            const currentInstId = editingInst?.institutionId || "";
            const updatedInstitutions = (editingResponsible.institutions || []).map(inst => {
              if (inst.institutionId === currentInstId) {
                const instCargo = data.institutions?.find(i => i.institutionId === currentInstId)?.cargo || "";
                return { ...inst, cargo: instCargo };
              }
              return inst;
            });
            
            const updateData = !editingResponsible.status 
              ? { ...editingResponsible, ...data, institutions: updatedInstitutions, status: true } 
              : { ...editingResponsible, ...data, institutions: updatedInstitutions };
            await onEditResponsible?.(updateData as UpdateInstitutionalResponsiblePayload);
          } else {
            const institutionId = editingInst!.institutionId;
            
            const newResponsible = { 
              ...data, 
              institutions: [{ 
                institutionId: institutionId, 
                institutionName: editingInst?.name || "",
                cargo: data.institutions?.[0]?.cargo || "" 
              }]
            } as CreateInstitutionalResponsiblePayload;
            await onAddResponsible?.(newResponsible);
          }
          setIsRespModalOpen(false);
          setEditingResponsible(null);
        } catch (error) {
          console.error("Error saving responsible:", error);
        } finally {
          setResponsibleLoading(false);
        }
      }}
      editingResp={editingResponsible}
      institutionOptions={institutionOptions}
      isLoading={responsibleLoading}
      preselectedInstitutionId={editingInst?.institutionId}
      preselectedInstitutionName={editingInst?.name}
    />

    {/* Modal de Historial de Responsables */}
    <Modal
      isOpen={isHistoryModalOpen}
      onClose={() => setIsHistoryModalOpen(false)}
      size="lg"
      modalId={`${modalId}-history`}
    >
      <ModalHeader>
        <span className="text-xl font-semibold text-text-primary dark:text-white/90">
          Historial de Responsables
        </span>
        <p className="text-sm text-text-secondary">Responsables anteriores de la empresa o institución</p>
      </ModalHeader>
      <ModalBody>
        {responsibleHistory && responsibleHistory.length > 0 ? (
          <div className="space-y-3">
            {responsibleHistory.map((resp) => (
              <div
                key={resp.responsibleId}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {resp.firstName} {resp.lastName}
                    </p>
                    <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full">
                      Inactivo
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {resp.identificationPrefix}-{resp.identificationNumber} • {resp.email}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Registrado: {resp.registrationDate ? new Date(resp.registrationDate).toLocaleDateString('es-VE') : 'N/A'}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingResponsible(resp);
                    setIsHistoryModalOpen(false);
                    setIsRespModalOpen(true);
                  }}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Reactivar
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p>No hay responsables en el historial</p>
          </div>
        )}
      </ModalBody>
      <ModalFooter>
        <Button variant="outline" onClick={() => setIsHistoryModalOpen(false)}>
          Cerrar
        </Button>
      </ModalFooter>
    </Modal>

    {/* Modal para crear nueva carrera */}
    <Suspense fallback={null}>
      {isNewCareerModalOpen && (
        <CareerModal
          isOpen={isNewCareerModalOpen}
          onClose={() => setIsNewCareerModalOpen(false)}
          onSave={async (payload) => {
            try {
              await addCareer(payload as CreateCareerPayload);
              setIsNewCareerModalOpen(false);
              addToast({
                variant: "success",
                title: "Carrera creada",
                message: "La carrera ha sido creada exitosamente"
              });
              // Llamar callback para recargar opciones en el componente padre
              onCareerCreated?.();
            } catch (error) {
              console.error("[InstitutionModal] Error creating career:", error);
              addToast({
                variant: "error",
                title: "Error",
                message: "No se pudo crear la carrera"
              });
            }
          }}
          isLoading={false}
          internshipOptions={careerInternshipOptions}
        />
      )}
    </Suspense>
  </>
);
}
