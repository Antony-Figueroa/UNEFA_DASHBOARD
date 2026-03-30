/**
 * @file InstitutionModal.tsx
 * @description Modal con formulario para crear y editar instituciones.
 */

import { useEffect, useState, useMemo, lazy, Suspense } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Input from "../../../components/form/input/InputField";
import TextArea from "../../../components/form/input/TextArea";
import CustomSelect from "../../../components/form/CustomSelect";
import MultiSelect from "../../../components/form/MultiSelect";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../../components/ui/modal";
import { Institution, CreateInstitutionPayload, UpdateInstitutionPayload, InstitutionalResponsible, CreateInstitutionalResponsiblePayload, UpdateInstitutionalResponsiblePayload } from "../types";
import Button from "../../../components/ui/button/Button";
import AsyncButton from "../../../components/ui/button/AsyncButton";
import { useUnsavedChanges } from "../../../hooks/useUnsavedChanges";
import UnifiedDialog from "../../../components/ui/dialog/UnifiedDialog";
import { useLists } from "../../lists/hooks/useLists";
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
import { getInstitutionByRif } from "../services/institutionsService";
import venezuelaData from "../../../data/venezuela.json";

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
  /** Career options for institution (with priorities for filtering) */
  careerOptions?: { value: string; text: string; internshipPriorities?: string[] }[];
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
  estado: z.string().min(1, "Seleccione un estado"),
  municipio: z.string().min(1, "Seleccione un municipio"),
  parroquia: z.string().min(1, "Seleccione una parroquia"),
  direccion: z.string().min(1, "La dirección es obligatoria").max(300, "La dirección no puede exceder 300 caracteres"),
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
  const [showResponsibleSection, setShowResponsibleSection] = useState(false);
  const [pendingInstitutionId, setPendingInstitutionId] = useState<string | null>(null);
  const [askAddResponsiblesOpen, setAskAddResponsiblesOpen] = useState(false);
  const [newlyAddedResponsibles, setNewlyAddedResponsibles] = useState<InstitutionalResponsible[]>([]);

  // Estado para el modal de nueva carrera
  const [isNewCareerModalOpen, setIsNewCareerModalOpen] = useState(false);
  const { addCareer } = useCareers();

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

  // State for duplicate detection
  const [isCheckingRif, setIsCheckingRif] = useState(false);
  const [existingInstitution, setExistingInstitution] = useState<any | null>(null);
  const [viewOnlyMode, setViewOnlyMode] = useState(false);

  // State for cascaded location selects (Venezuela data)
  const [selectedMunicipio, setSelectedMunicipio] = useState<string>("");
  const [, setSelectedParroquia] = useState<string>("");

  // Filter for Estado Portuguesa
  const portuguesaData = venezuelaData.find((e: any) => e.estado === "Portuguesa");
  
  // Options for Estado (only Portuguesa)
  const ESTADO_OPTIONS = [
    { value: "PORTUGUESA", label: "PORTUGUESA" }
  ];
  
  // Options for Municipio based on selected estado
  const MUNICIPIO_OPTIONS = useMemo(() => {
    if (!portuguesaData?.municipios) return [];
    return portuguesaData.municipios.map((m: any) => ({
      value: m.municipio.toUpperCase(),
      label: m.municipio.toUpperCase()
    }));
  }, [portuguesaData]);
  
  // Options for Parroquia based on selected municipio
  const PARROQUIA_OPTIONS = useMemo(() => {
    if (!portuguesaData?.municipios || !selectedMunicipio) return [];
    const municipio = portuguesaData.municipios.find((m: any) => 
      m.municipio.toUpperCase() === selectedMunicipio
    );
    if (!municipio?.parroquias) return [];
    return municipio.parroquias.map((p: string) => ({
      value: p.toUpperCase(),
      label: p.toUpperCase()
    }));
  }, [portuguesaData, selectedMunicipio]);

  // Handle RIF number input change with formatting
  const handleRifNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const cleaned = cleanRif(input);
    const formatted = formatRifDisplay(cleaned);
    setDisplayRifNumber(formatted);
    setValue("rifNumber", cleaned, { shouldValidate: true, shouldDirty: true });
  };

  // Handle phone number input change with formatting
  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const cleaned = cleanPhone(input);
    const formatted = formatPhoneLocalDisplay(cleaned);
    setDisplayPhoneNumber(formatted);
    setValue("phoneNumber", cleaned, { shouldValidate: true, shouldDirty: true });
  };

  const instSchema = useMemo(() => createInstSchema(existingInstitutions, editingInst || null), [existingInstitutions, editingInst]);

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    setError,
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
      direccion: "",
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
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);
  const [pendingSave, setPendingSave] = useState<CreateInstitutionPayload | UpdateInstitutionPayload | null>(null);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const listNames = [
          "PREFIJO",
          "Rif",
          "Region",
          "Nucleo",
          "Extensión",
          "Tipo de empresa",
          "ESTADOS_VENEZUELA",
          "TIPO DE PRACTICA"
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
  const optionsCodigosArea = options.PREFIJO;
  const optionsTipoPractica = options["TIPO DE PRACTICA"];

  // Opciones de tipo de práctica - usar prop si está disponible, si no usar lista dinámica
  const PRACTICE_TYPE_OPTIONS = useMemo(() => {
    // Si se pasan opciones como prop (de t_internship_type), usarlas
    if (internshipTypeOptions && internshipTypeOptions.length > 0) {
      return internshipTypeOptions.map(opt => ({
        // Usar el ID (opt.id) como value para que el filtrado funcione correctamente
        value: String(opt.id),
        label: opt.label.toUpperCase()
      }));
    }
    
    // Fallback: usar lista dinámica (TIPO DE PRACTICA de t_list)
    const baseOptions = (optionsTipoPractica || []);
    
    return baseOptions.map(opt => {
      const normalizedValue = opt.value.toUpperCase();
      
      // Normalizar valores para el formulario - mantener separados (en mayúsculas igual que en Carrera)
      if (normalizedValue === 'ÚNICA' || normalizedValue === 'UNICA') {
        return { value: '1', label: 'ÚNICA' };
      } else if (normalizedValue === 'HOSPITALARIA') {
        return { value: '2', label: 'HOSPITALARIA' };
      } else if (normalizedValue === 'COMUNITARIA') {
        return { value: '3', label: 'COMUNITARIA' };
      }
      return { value: opt.value, label: opt.label.toUpperCase() };
    }).filter(Boolean) as { value: string; label: string }[];
  }, [internshipTypeOptions, optionsTipoPractica]);

  // Observar el tipo de práctica seleccionado para filtrar carreras
  const selectedInternshipType = watch("internshipTypeId");

  // Opciones de carreras filtradas según el tipo de práctica seleccionado
  // La lógica busca que la carrera TENGA ASOCIADO el tipo de práctica seleccionado
  const CAREER_OPTIONS = useMemo(() => {
    if (!careerOptions || careerOptions.length === 0) {
      return [];
    }

    if (!selectedInternshipType) {
      return [];
    }

    // El selectedInternshipType es el ID del tipo de práctica (1, 2, o 3)
    // Filtrar carreras que tienen este tipo de práctica en su campo internshipTypeIds
    const filtered = careerOptions.filter(career => {
      const typeIds = career.internshipPriorities || [];
      // Comparar usando string - ambos deben ser string para el includes
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

      let parsedEstado = "PORTUGUESA";
      let parsedMunicipio = "";
      let parsedParroquia = "";
      let parsedDireccion = editingInst.fiscalAddress || "";
      let parsedRegion = editingInst.region;
      let parsedNucleo = editingInst.nucleus;
      let parsedExtension = editingInst.extension;
      let parsedTipoEmpresa = editingInst.institutionType;

      if (editingInst.fiscalAddress) {
        const parts = editingInst.fiscalAddress.split(", ");
        if (parts.length >= 8) {
          parsedRegion = parts[0];
          parsedNucleo = parts[1];
          parsedExtension = parts[2];
          parsedTipoEmpresa = parts[3];
          parsedEstado = parts[4];
          parsedMunicipio = parts[5];
          parsedParroquia = parts[6];
          parsedDireccion = parts.slice(7).join(", ");
        } else if (parts.length >= 4) {
          parsedEstado = parts[0];
          parsedMunicipio = parts[1];
          parsedParroquia = parts[2];
          parsedDireccion = parts.slice(3).join(", ");
        }
      }

      // Determinar el tipo de práctica - soporta internshipTypeId, internshipTypeIds, o practiceType
      const internshipTypeId = editingInst.internshipTypeId 
        ? String(editingInst.internshipTypeId) 
        : (editingInst.internshipTypeIds && editingInst.internshipTypeIds.length > 0 
            ? String(editingInst.internshipTypeIds[0]) 
            : (editingInst.practiceType ? String(editingInst.practiceType) : ""));

      reset({
        rifPrefix: rifParts[0] || "",
        rifNumber: rifParts[1] || "",
        name: editingInst.name,
        phonePrefix: phoneP || "",
        phoneNumber: phoneN || "",
        region: parsedRegion?.toUpperCase() || "",
        nucleus: parsedNucleo?.toUpperCase() || "",
        extension: parsedExtension?.toUpperCase() || "",
        institutionType: parsedTipoEmpresa?.toUpperCase() || "",
        estado: parsedEstado?.toUpperCase(),
        municipio: parsedMunicipio?.toUpperCase(),
        parroquia: parsedParroquia?.toUpperCase(),
        direccion: parsedDireccion,
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

        let parsedEstado = "PORTUGUESA";
        let parsedMunicipio = "";
        let parsedParroquia = "";
        let parsedDireccion = editingInst.fiscalAddress || "";
        let parsedRegion = editingInst.region;
        let parsedNucleo = editingInst.nucleus;
        let parsedExtension = editingInst.extension;
        let parsedTipoEmpresa = editingInst.institutionType;

        if (editingInst.fiscalAddress) {
          const parts = editingInst.fiscalAddress.split(", ");
          // Formato completo: Región, Núcleo, Extensión, Tipo, Estado, Municipio, Parroquia, Dirección
          if (parts.length >= 8) {
            parsedRegion = parts[0];
            parsedNucleo = parts[1];
            parsedExtension = parts[2];
            parsedTipoEmpresa = parts[3];
            parsedEstado = parts[4];
            parsedMunicipio = parts[5];
            parsedParroquia = parts[6];
            parsedDireccion = parts.slice(7).join(", ");
          } else if (parts.length >= 4) {
            // Formato anterior/simplificado: Estado, Municipio, Parroquia, Dirección
            parsedEstado = parts[0];
            parsedMunicipio = parts[1];
            parsedParroquia = parts[2];
            parsedDireccion = parts.slice(3).join(", ");
          }
        }

        reset({
          rifPrefix: rifParts[0] || "",
          rifNumber: rifParts[1] || "",
          name: editingInst.name,
          phonePrefix: phoneP || "",
          phoneNumber: phoneN || "",
          region: parsedRegion?.toUpperCase() || "",
          nucleus: parsedNucleo?.toUpperCase() || "",
          extension: parsedExtension?.toUpperCase() || "",
          institutionType: parsedTipoEmpresa?.toUpperCase() || "",
          estado: parsedEstado?.toUpperCase(),
          municipio: parsedMunicipio?.toUpperCase(),
          parroquia: parsedParroquia?.toUpperCase(),
          direccion: parsedDireccion,
          // Soportar ambos: internshipTypeId (singular), internshipTypeIds (array), o practiceType (de tabla principal)
          internshipTypeId: editingInst.internshipTypeId 
            ? String(editingInst.internshipTypeId) 
            : (editingInst.internshipTypeIds && editingInst.internshipTypeIds.length > 0 
                ? String(editingInst.internshipTypeIds[0]) 
                : (editingInst.practiceType ? String(editingInst.practiceType) : "")),
          careerIds: editingInst.careerIds || [],
        });
        const formattedRif = formatRifDisplay(rifParts[1] || "");
        const formattedPhone = formatPhoneLocalDisplay(phoneN || "");
        setDisplayRifNumber(formattedRif);
        setDisplayPhoneNumber(formattedPhone);
        
        if (parsedMunicipio) setSelectedMunicipio(parsedMunicipio.toUpperCase());
        if (parsedParroquia) setSelectedParroquia(parsedParroquia.toUpperCase());

        // Marcar como inicializado después de permitir que los valores se asienten
        setTimeout(() => setIsInitialized(true), 200);
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
          direccion: "",
          internshipTypeId: "",
          careerIds: [],
        });
        setDisplayRifNumber("");
        setDisplayPhoneNumber("");
        setSelectedMunicipio("");
        setSelectedParroquia("");
        setIsInitialized(true);
      }
    } else {
      setIsInitialized(false);
    }
  }, [editingInst, isOpen, reset, optionsTipoPractica, careerOptions, internshipTypeOptions]);

  const onSubmit = (data: InstFormData) => {
    // El formato de guardado ahora incluye todos los metadatos para asegurar compatibilidad en la edición
    const fiscalAddress = `${data.region}, ${data.nucleus}, ${data.extension}, ${data.institutionType}, ${data.estado}, ${data.municipio}, ${data.parroquia}, ${data.direccion}`;

    const commonData = {
      rif: `${data.rifPrefix}-${data.rifNumber}`.toUpperCase(),
      name: data.name.toUpperCase(),
      fiscalAddress: fiscalAddress.toUpperCase(),
      phone: `${data.phonePrefix}-${data.phoneNumber}`,
      region: data.region.toUpperCase(),
      nucleus: data.nucleus.toUpperCase(),
      extension: data.extension.toUpperCase(),
      institutionType: data.institutionType.toUpperCase(),
      internshipTypeId: data.internshipTypeId,
      careerIds: data.careerIds,
      status: editingInst?.status ?? true,
    };
    if (editingInst) {
      setPendingSave({ ...(commonData as any), institutionId: editingInst.institutionId } as UpdateInstitutionPayload);
    } else {
      setPendingSave(commonData as CreateInstitutionPayload);
    }
    setConfirmSaveOpen(true);
  };

  const handleClose = () => {
    setExistingInstitution(null);
    setViewOnlyMode(false);
    onClose();
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

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleClose} onCloseAttempt={handleCloseAttempt} showCloseButton size="5xl" modalId={modalId}>
        <ModalHeader>
          <span className="text-xl font-semibold text-text-primary dark:text-white/90">
            {editingInst ? "Editar Institución" : "Registrar Institución"}
          </span>
          <p className="text-sm text-text-secondary">Complete la información de la institución.</p>
        </ModalHeader>
      <ModalBody className="bg-bg-secondary/30 dark:bg-bg-dark/50">
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {existingInstitution && (
            <div className="mb-4 p-3 bg-warning-50 dark:bg-warning-500/10 border border-warning-200 dark:border-warning-500/20 rounded-lg md:col-span-2">
              <p className="text-sm text-warning-700 dark:text-warning-300">
                Este RIF ya está registrado. Los campos están en modo visualización. 
                Haga clic en "Habilitar Edición" para modificar.
              </p>
            </div>
          )}
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
                      value={displayRifNumber}
                      onChange={handleRifNumberChange}
                      placeholder="12345678-9" 
                      className={`uppercase ${RIF_INPUT_CLASS}`}
                      error={!!errors.rifNumber}
                      hint={errors.rifNumber?.message || (isCheckingRif ? "Verificando..." : " ")}
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
                              const existingData = await getInstitutionByRif(fullRif);
                              if (existingData) {
                                const message = existingData.status 
                                  ? "Este RIF ya está registrado." 
                                  : "RIF registrado (INACTIVO). Contacte a administración para reactivar.";
                                
                                setError("rifNumber", { 
                                  type: "manual", 
                                  message 
                                });
                                setExistingInstitution(existingData);
                                setViewOnlyMode(true);

                                const rifParts = existingData.rif ? existingData.rif.split("-") : ["", ""];
                                const [phoneP, phoneN] = existingData.phone ? existingData.phone.split("-") : ["", ""];

                                 let parsedEstado = "PORTUGUESA";
                                 let parsedMunicipio = "";
                                 let parsedParroquia = "";
                                 let parsedDireccion = existingData.fiscalAddress || "";
                                 let parsedRegion = existingData.region;
                                 let parsedNucleo = existingData.nucleus;
                                 let parsedExtension = existingData.extension;
                                 let parsedTipoEmpresa = existingData.institutionType;

                                 if (existingData.fiscalAddress) {
                                   const parts = existingData.fiscalAddress.split(", ");
                                   if (parts.length >= 8) {
                                     parsedRegion = parts[0];
                                     parsedNucleo = parts[1];
                                     parsedExtension = parts[2];
                                     parsedTipoEmpresa = parts[3];
                                     parsedEstado = parts[4];
                                     parsedMunicipio = parts[5];
                                     parsedParroquia = parts[6];
                                     parsedDireccion = parts.slice(7).join(", ");
                                   } else if (parts.length >= 4) {
                                     parsedEstado = parts[0];
                                     parsedMunicipio = parts[1];
                                     parsedParroquia = parts[2];
                                     parsedDireccion = parts.slice(3).join(", ");
                                   }
                                 }

                                 setValue("rifPrefix", rifParts[0] || "");
                                 const formattedRif = formatRifDisplay(rifParts[1] || "");
                                 setDisplayRifNumber(formattedRif);
                                 setValue("rifNumber", rifParts[1] || "");
                                 setValue("name", existingData.name || "");
                                 setValue("phonePrefix", phoneP || "");
                                 const formattedPhone = formatPhoneLocalDisplay(phoneN || "");
                                 setDisplayPhoneNumber(formattedPhone);
                                 setValue("phoneNumber", phoneN || "");
                                 setValue("region", (parsedRegion || existingData.region || "").toUpperCase());
                                 setValue("nucleus", (parsedNucleo || existingData.nucleus || "").toUpperCase());
                                 setValue("extension", (parsedExtension || existingData.extension || "").toUpperCase());
                                 setValue("institutionType", (parsedTipoEmpresa || existingData.institutionType || "").toUpperCase());
                                 setValue("estado", parsedEstado?.toUpperCase() || "");
                                 setValue("municipio", parsedMunicipio?.toUpperCase() || "");
                                 setValue("parroquia", parsedParroquia?.toUpperCase() || "");
                                 setValue("direccion", parsedDireccion);
                                 
                                 if (parsedMunicipio) setSelectedMunicipio(parsedMunicipio.toUpperCase());
                                 if (parsedParroquia) setSelectedParroquia(parsedParroquia.toUpperCase());
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
                  <Controller
                    name="estado"
                    control={control}
                    render={({ field }) => (
                      <CustomSelect
                        id="estado"
                        options={ESTADO_OPTIONS}
                        onChange={(val) => {
                          field.onChange(val);
                          setSelectedMunicipio("");
                          setSelectedParroquia("");
                          setValue("municipio", "", { shouldValidate: true });
                          setValue("parroquia", "", { shouldValidate: true });
                        }}
                        value={field.value}
                        placeholder="Seleccione Estado"
                        error={!!errors.estado}
                      />
                    )}
                  />
                  {errors.estado && <p className="mt-1 text-xs text-red-500">{errors.estado.message}</p>}
                </div>
                
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Municipio *</label>
                  <Controller
                    name="municipio"
                    control={control}
                    render={({ field }) => (
                      <CustomSelect
                        id="municipio"
                        options={MUNICIPIO_OPTIONS}
                        onChange={(val) => {
                          field.onChange(val);
                          setSelectedMunicipio(val);
                          setSelectedParroquia("");
                          setValue("parroquia", "", { shouldValidate: true });
                        }}
                        value={field.value}
                        placeholder="Seleccione Municipio"
                        error={!!errors.municipio}
                      />
                    )}
                  />
                  {errors.municipio && <p className="mt-1 text-xs text-red-500">{errors.municipio.message}</p>}
                </div>
                
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Parroquia *</label>
                  <Controller
                    name="parroquia"
                    control={control}
                    render={({ field }) => (
                      <CustomSelect
                        id="parroquia"
                        options={PARROQUIA_OPTIONS}
                        onChange={(val) => {
                          field.onChange(val);
                          setSelectedParroquia(val);
                        }}
                        value={field.value}
                        placeholder="Seleccione Parroquia"
                        error={!!errors.parroquia}
                      />
                    )}
                  />
                  {errors.parroquia && <p className="mt-1 text-xs text-red-500">{errors.parroquia.message}</p>}
                </div>
                
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Dirección *</label>
                  <TextArea
                    placeholder="Ingrese la dirección completa (calle, número de casa, sector, etc.)"
                    className="uppercase"
                    {...register("direccion", { onChange: handleUppercaseChange })}
                    error={!!errors.direccion}
                    rows={2}
                  />
                  {errors.direccion && <p className="mt-1 text-xs text-red-500">{errors.direccion.message}</p>}
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
                  hint={errors.phoneNumber?.message || errors.phonePrefix?.message || " "}
                />
              </div>
            </div>
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

          {/* Tipo de Práctica que acepta la institución */}
          <div>
            <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Tipo de Práctica *</label>
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
                  label="Carreras *"
                  options={CAREER_OPTIONS}
                  onChange={field.onChange}
                  value={field.value}
                  placeholder={selectedInternshipType ? "Seleccione las carreras" : "Seleccione primero el tipo de práctica"}
                  disabled={!selectedInternshipType}
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
                            {resp.identificationPrefix}-{resp.identificationNumber} • {resp.email}{resp.cargo && ` • ${resp.cargo}`}
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
                            aria-label="Quitar de esta institución"
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

          {/* Sección para agregar responsables después de crear institución */}
          {showResponsibleSection && (
            <div className="md:col-span-2 mt-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Agregar Responsables Institucionales
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowResponsibleSection(false);
                      onClose();
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    Omitir y cerrar
                  </Button>
                </div>

                {/* Mostrar responsables existentes O los recien agregados durante la creación */}
                {(responsibles.length > 0 || newlyAddedResponsibles.length > 0) ? (
                  <div className="space-y-2 mb-4">
                    {/* Responsables existentes (cuando se edita) */}
                    {responsibles.map((resp) => {
                      // Obtener el cargo de esta institución específica
                      const currentInstitution = resp.institutions?.find(
                        inst => inst.institutionId === editingInst?.institutionId
                      );
                      const institutionCargo = currentInstitution?.cargo || resp.cargo || "";
                      
                      return (
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
                            {institutionCargo && ` • ${institutionCargo}`}
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
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </Button>
                        </div>
                      </div>
                    )})}
                    {/* Responsables recien agregados (durante creación) */}
                    {newlyAddedResponsibles.map((resp) => (
                      <div
                        key={resp.responsibleId}
                        className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {resp.firstName} {resp.lastName}
                            </p>
                            <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full">
                              Nuevo
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {resp.identificationPrefix}-{resp.identificationNumber} • {resp.email}{resp.cargo && ` • ${resp.cargo}`}
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
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500 dark:text-gray-400 mb-4">
                    <p className="text-sm">No hay responsables agregados aún</p>
                  </div>
                )}

                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingResponsible(null);
                      setIsRespModalOpen(true);
                    }}
                    className="border-blue-300 text-blue-700 hover:bg-blue-50"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Agregar Responsable
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {/* Botón oculto para permitir submit con Enter */}
          <button type="submit" className="hidden" />
        </form>
      </ModalBody>
      <ModalFooter>
        {showResponsibleSection ? (
          <Button variant="primary" onClick={() => {
            setShowResponsibleSection(false);
            onClose();
          }}>
            Guardar y Cerrar
          </Button>
        ) : (
          <>
            <Button variant="outline" onClick={handleCloseAttempt} disabled={isLoading}>
              Cancelar
            </Button>
            {existingInstitution ? (
              viewOnlyMode ? (
                <AsyncButton 
                  type="button"
                  onClick={() => {
                    setViewOnlyMode(false);
                  }}
                >
                  Habilitar Edición
                </AsyncButton>
              ) : (
                <AsyncButton onClick={handleSubmit(onSubmit)} loading={isLoading} disabled={!isValid}>
                  Guardar Cambios
                </AsyncButton>
              )
            ) : editingInst ? (
              <AsyncButton onClick={handleSubmit(onSubmit)} loading={isLoading} disabled={!isDirty}>
                Guardar Cambios
              </AsyncButton>
            ) : (
              <AsyncButton onClick={handleSubmit(onSubmit)} loading={isLoading} disabled={!isValid}>
                Registrar Institución
              </AsyncButton>
            )}
          </>
        )}
      </ModalFooter>
    </Modal>

    {confirmSaveOpen && (
      <UnifiedDialog
        isOpen={confirmSaveOpen}
        onClose={() => setConfirmSaveOpen(false)}
        onConfirm={async () => {
          if (pendingSave) {
            const result = await onSave(pendingSave);
            
            // Si es nueva institución y se guardó exitosamente, preguntar si quiere agregar responsables
            if (!editingInst && result && typeof result === 'object' && 'institutionId' in (result as any)) {
              setPendingInstitutionId((result as any).institutionId);
              setConfirmSaveOpen(false);
              // Mostrar pregunta para agregar responsables
              setTimeout(() => {
                setAskAddResponsiblesOpen(true);
              }, 100);
              return;
            }
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
      message={`¿Está seguro que desea quitar a ${responsibleToRemove?.firstName} ${responsibleToRemove?.lastName} de esta institución? Dejará de aparecer en este listado pero sus datos se mantendrán en el sistema.`}
      onConfirm={handleConfirmRemove}
    />

    {/* Dialog para preguntar si desea agregar responsables después de crear institución */}
    {!editingInst && (
      <UnifiedDialog
        isOpen={askAddResponsiblesOpen}
        onClose={() => {
          setAskAddResponsiblesOpen(false);
          setPendingInstitutionId(null);
          onClose();
        }}
        onConfirm={() => {
          setAskAddResponsiblesOpen(false);
          setShowResponsibleSection(true);
        }}
        variant="info"
        title="Agregar Responsables"
        message="¿Desea agregar responsables institucionales ahora? También puede hacerlo más adelante desde la edición de la institución."
        confirmLabel="Sí, agregar responsables"
        cancelLabel="No, cerrar"
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
        <AsyncButton
          onClick={handleSaveNewValue}
          loading={savingNewValue}
          disabled={!newValueInput.trim()}
        >
          Guardar
        </AsyncButton>
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
                return { ...inst, cargo: data.cargo || "" };
              }
              return inst;
            });
            
            const updateData = !editingResponsible.status 
              ? { ...editingResponsible, ...data, institutions: updatedInstitutions, status: true } 
              : { ...editingResponsible, ...data, institutions: updatedInstitutions };
            await onEditResponsible?.(updateData as UpdateInstitutionalResponsiblePayload);
          } else {
            // Usar pendingInstitutionId si es el flujo de creación, sinon usar editingInst
            const institutionId = showResponsibleSection ? pendingInstitutionId : editingInst!.institutionId;
            
            // Agregar el responsable con la nueva estructura de instituciones
            const newResponsible = { 
              ...data, 
              institutions: [{ 
                institutionId: institutionId!, 
                institutionName: editingInst?.name || "",
                cargo: data.cargo || "" 
              }]
            } as CreateInstitutionalResponsiblePayload;
            await onAddResponsible?.(newResponsible);
            
            // Si estamos en el flujo de creación, agregar a la lista local
            if (showResponsibleSection && institutionId) {
              const tempId = `temp-${Date.now()}`;
              const newResp: InstitutionalResponsible = {
                responsibleId: tempId,
                identificationPrefix: data.identificationPrefix || '',
                identificationNumber: data.identificationNumber || '',
                firstName: data.firstName || '',
                lastName: data.lastName || '',
                phone: data.phone || '',
                email: data.email || '',
                institutions: [{ 
                  institutionId: institutionId, 
                  institutionName: editingInst?.name || "",
                  cargo: data.cargo || ""
                }],
                status: true,
                registrationDate: new Date()
              };
              setNewlyAddedResponsibles(prev => [...prev, newResp]);
            }
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
      preselectedInstitutionId={showResponsibleSection ? pendingInstitutionId || undefined : editingInst?.institutionId}
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
        <p className="text-sm text-text-secondary">Responsables anteriores de la institución</p>
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
          internshipOptions={(internshipTypeOptions || [])
            .filter(opt => opt.id)
            .map(opt => ({
              id: opt.id!,
              value: opt.value,
              label: opt.label,
              text: opt.label
            }))}
        />
      )}
    </Suspense>
  </>
);
}
