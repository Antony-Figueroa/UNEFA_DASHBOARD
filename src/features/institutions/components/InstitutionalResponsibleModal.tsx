/**
 * @file InstitutionalResponsibleModal.tsx
 * @description Modal para crear y editar responsables institucionales.
 */

import { useEffect, useState, useCallback, useMemo, useRef, lazy, Suspense } from "react";
import { useForm, Controller, FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Modal, ModalBody, ModalFooter, ModalHeader } from "../../../components/ui/modal";
import { Tabs } from "../../../components/ui/tabs/Tabs";
import { useTabs } from "../../../hooks/useTabs";
import { useInstitutions } from "../hooks/useInstitutions";
import { getResponsibleByCi } from "../services/institutionalResponsiblesService";
import { CreateInstitutionalResponsiblePayload, UpdateInstitutionalResponsiblePayload, InstitutionalResponsible, CreateInstitutionPayload } from "../types";
import { useLists } from "../../lists/hooks/useLists";
import { useToast } from "../../../context/toast";
import { formatCedulaDisplay, formatPhoneLocalDisplay, cleanPhone, CEDULA_MAX_DIGITS, CEDULA_MAX_LENGTH } from "../../../utils/inputFormat";
import { useUnsavedChanges } from "../../../hooks/useUnsavedChanges";
import Input from "../../../components/form/input/InputField";
import CustomSelect from "../../../components/form/CustomSelect";
import Button from "../../../components/ui/button/Button";
import AsyncButton from "../../../components/ui/button/AsyncButton";

import UnifiedDialog from "../../../components/ui/dialog/UnifiedDialog";
import { CONFIRM_MESSAGES, SYSTEM_DIALOGS } from "../../../components/ui/dialog/DialogConfig";
import { isProtectedList, PROTECTED_LIST_MESSAGE } from "../../../constants/systemLists";
import { List } from "../../lists/types";
import * as listsService from "../../lists/services/listsService";
import { NAME_PATTERN, SAFE_EMAIL_PATTERN, SAFE_TEXT_PATTERN, isSafeInput } from "../../../utils/inputValidation";
import { checkAvailability as checkPersonAvailability } from "../../persons/services/personService";
import { useAcademicConfig } from "../../academic-config/hooks/useAcademicConfig";
import { lookupCi } from "../../students/services/studentsService";
import { PREFIX_OPTIONS } from "../../persons/types";
import { Search } from "lucide-react";

// Lazy load para evitar dependencia circular con InstitutionModal
const InstitutionModal = lazy(() => import("./InstitutionModal"));

/**
 * Zod schema for institutional responsible form data.
 * Nueva estructura: institutions es un array de objetos con institutionId y cargo
 */
const institutionSchema = z.object({
  institutionId: z.string().min(1, "Empresa o Institución requerida"),
  cargo: z.string()
    .min(1, "El cargo es obligatorio")
    .max(200, "El cargo es demasiado largo")
    .regex(SAFE_TEXT_PATTERN, "Caracteres no permitidos")
    .refine(val => isSafeInput(val), { message: "Caracteres no permitidos" }),
});

const respSchema = z.object({
  identificationPrefix: z.string().min(1, "Seleccione un prefijo"),
  identificationNumber: z.string()
    .min(1, "La cédula es obligatoria")
    .regex(/^\d+$/, "Solo se admiten números")
    .min(7, "La cédula debe tener al menos 7 dígitos"),
  firstName: z.string()
    .min(1, "El primer nombre es obligatorio")
    .max(100, "El nombre es demasiado largo")
    .regex(NAME_PATTERN, "Solo letras y espacios")
    .refine(val => isSafeInput(val), { message: "Caracteres no permitidos" }),
  middleName: z.string()
    .max(100, "El nombre es demasiado largo")
    .refine(val => !val || NAME_PATTERN.test(val), { message: "Solo letras y espacios" })
    .refine(val => !val || isSafeInput(val), { message: "Caracteres no permitidos" })
    .optional()
    .or(z.literal("")),
  lastName: z.string()
    .min(1, "El primer apellido es obligatorio")
    .max(100, "El apellido es demasiado largo")
    .regex(NAME_PATTERN, "Solo letras y espacios")
    .refine(val => isSafeInput(val), { message: "Caracteres no permitidos" }),
  secondLastName: z.string()
    .max(100, "El apellido es demasiado largo")
    .refine(val => !val || NAME_PATTERN.test(val), { message: "Solo letras y espacios" })
    .refine(val => !val || isSafeInput(val), { message: "Caracteres no permitidos" })
    .optional()
    .or(z.literal("")),
  phonePrefix: z.string().min(1, "Seleccione un prefijo"),
  phoneNumber: z.string()
    .min(1, "El número de teléfono es obligatorio")
    .regex(/^\d+$/, "Solo se admiten números")
    .min(7, "El número de teléfono debe tener 7 dígitos"),
  email: z.string()
    .min(1, "El correo es obligatorio")
    .email("Correo electrónico inválido")
    .max(255, "El email es demasiado largo")
    .regex(SAFE_EMAIL_PATTERN, "Email con caracteres no permitidos")
    .refine(val => isSafeInput(val), { message: "Caracteres no permitidos" }),
  title: z.string()
    .optional()
    .or(z.literal("")),
  // institutions es obligatorio - debe tener al menos una institución con cargo
  institutions: z.array(institutionSchema).min(1, "Debe agregar al menos una empresa o institución con su cargo"),
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
   /** Unique ID for modal stack tracking (optional) */
   modalId?: string;
   /** Callback to handle editing an existing responsible (duplicate detection flow) */
   onEditExisting?: (existingResponsible: any) => void;
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
   modalId,
   onEditExisting,
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
    const [isLookingUpCi, setIsLookingUpCi] = useState(false);
    const [isCheckingEmail, setIsCheckingEmail] = useState(false);
   const [existingResponsible, setExistingResponsible] = useState<any | null>(null);
   const [existingPerson, setExistingPerson] = useState(false);
   const [viewOnlyMode, setViewOnlyMode] = useState(false);
   // State for API-loaded data flow (SENIAT)
   const [apiDataLoaded, setApiDataLoaded] = useState(false);
   const apiLoadedCiRef = useRef("");
   const { config: academicConfig } = useAcademicConfig();
   const tabsState = useTabs({ defaultTab: "identificacion" });
   useEffect(() => { if (isOpen) tabsState.setActiveTab("identificacion"); }, [isOpen]);

// Check if institutional responsible exists by CI
    const checkInstitutionalResponsibleByCi = async (ci: string) => {
      // Clean CI: remove any non-digits
      const cleanCi = ci.replace(/\D/g, '');
      // Only check if we have exactly 7 or 8 digits
      if (cleanCi.length !== 7 && cleanCi.length !== 8) {
        return;
      }

      setIsCheckingCi(true);
      const prefix = watch("identificationPrefix") || 'V';
      const fullCi = `${prefix}-${cleanCi}`;
      try {
        const result = await getResponsibleByCi(fullCi);
        if (result?.responsible) {
          // Responsable ya existe → precargar datos (form editable)
          setExistingResponsible(result.responsible);
          fillFormWithExistingData(result.responsible);
        } else if (result?.person) {
          // Persona existe (estudiante, tutor, etc.) pero no como responsable → pre-cargar datos
          setExistingResponsible(null);
          setExistingPerson(true);
          setViewOnlyMode(false);
          preFillFromPersonData(result.person);
        } else {
          // CI is available, clear any existing data
          setExistingResponsible(null);
          setExistingPerson(false);
          setViewOnlyMode(false);
        }
      } catch (error) {
        console.error('[InstitutionalResponsibleModal] Error checking CI:', error);
        setExistingResponsible(null);
        setViewOnlyMode(false);
      } finally {
        setIsCheckingCi(false);
      }
    };

  // State for new institution modal
  const [isNewInstitutionModalOpen, setIsNewInstitutionModalOpen] = useState(false);
  const { addInstitution } = useInstitutions();

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    setError,
    clearErrors,
    formState: { errors, isSubmitted, isDirty, isValid, touchedFields },
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
      title: "",
      institutions: [],
    },
  });

  const isFieldValid = useCallback((fieldName: string) =>
    !!(touchedFields as any)[fieldName] && !(errors as any)[fieldName],
    [touchedFields, errors]);

  const handleNameChange = useCallback(
    (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value
        .replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s']/g, "")
        .toUpperCase();
      setValue(field as any, val, { shouldValidate: true, shouldDirty: true });
    },
    [setValue]
  );

  const ciDisabled = !!editingResp?.responsibleId;
  const isFieldDisabled = useCallback((fieldName: string) => {
    if (viewOnlyMode) return true;
    const apiLock = apiDataLoaded && (academicConfig?.lockApiLoadedFields ?? true);
    const nameFields = ["firstName", "middleName", "lastName", "secondLastName"];
    if (apiLock && nameFields.includes(fieldName)) return true;
    return false;
  }, [viewOnlyMode, apiDataLoaded, academicConfig]);

  const TAB_IDS = ['identificacion', 'contacto', 'instituciones'] as const;
  const TAB_FIELDS: Record<string, string[]> = {
    'identificacion': ['identificationPrefix', 'identificationNumber', 'firstName', 'middleName', 'lastName', 'secondLastName'],
    'contacto': ['phonePrefix', 'phoneNumber', 'email', 'title'],
    'instituciones': ['institutions'],
  };
  const errorsByTab = useMemo(() => {
    const keys = Object.keys(errors);
    const counts: Record<string, number> = {};
    for (const tab of TAB_IDS) counts[tab] = keys.filter(k => TAB_FIELDS[tab].includes(k)).length;
    return counts;
  }, [errors]);
  const currentTabIndex = TAB_IDS.indexOf(tabsState.activeTab as typeof TAB_IDS[number]);
  const goPrevTab = () => { if (currentTabIndex > 0) tabsState.setActiveTab(TAB_IDS[currentTabIndex - 1]); };
  const goNextTab = () => { if (currentTabIndex < TAB_IDS.length - 1) tabsState.setActiveTab(TAB_IDS[currentTabIndex + 1]); };
  const onFormError = useCallback((formErrors: FieldErrors<RespFormData>) => {
    const firstTab = TAB_IDS.find(tab => TAB_FIELDS[tab].some(f => (formErrors as Record<string, any>)[f]));
    if (firstTab) tabsState.setActiveTab(firstTab);
  }, []);

  // Fill form fields with existing responsible data
  const fillFormWithExistingData = (responsible: any) => {
    // Format CI for display
    const { identificationPrefix, identificationNumber } = responsible;
    const fullCi = `${identificationPrefix}-${identificationNumber}`;
    setDisplayIdentificationNumber(formatCedulaDisplay(fullCi.replace('-', ''), false));
    
    // Extract phone prefix and number
    let phonePrefix = '0412';
    let phoneNumber = '';
    if (responsible.phone) {
      const cleanPhone = responsible.phone.replace(/\D/g, '');
      if (cleanPhone.length >= 4) {
        phonePrefix = cleanPhone.substring(0, 4);
        phoneNumber = cleanPhone.substring(4);
      } else {
        phoneNumber = cleanPhone;
      }
    }
    setDisplayPhoneNumber(formatPhoneLocalDisplay(phoneNumber));
    
    // Set form values
    setValue("identificationPrefix", identificationPrefix, { shouldValidate: true, shouldDirty: true });
    setValue("identificationNumber", identificationNumber, { shouldValidate: true, shouldDirty: true });
    setValue("firstName", responsible.firstName || '', { shouldValidate: true, shouldDirty: true });
    setValue("middleName", responsible.middleName || '', { shouldValidate: true, shouldDirty: true });
    setValue("lastName", responsible.lastName || '', { shouldValidate: true, shouldDirty: true });
    setValue("secondLastName", responsible.secondLastName || '', { shouldValidate: true, shouldDirty: true });
    setValue("phonePrefix", phonePrefix, { shouldValidate: true, shouldDirty: true });
    setValue("phoneNumber", phoneNumber, { shouldValidate: true, shouldDirty: true });
    setValue("email", responsible.email || '', { shouldValidate: true, shouldDirty: true });
    setValue("title", responsible.title || '', { shouldValidate: true, shouldDirty: true });
    
// Handle institutions - map to form structure
     if (responsible.institutions && Array.isArray(responsible.institutions)) {
       const formInstitutions = responsible.institutions.map((inst: any) => ({
         institutionId: String(inst.institutionId),
         institutionName: inst.institutionName || '',
         cargo: inst.cargo || ''
       }));
       setValue("institutions", formInstitutions, { shouldValidate: true, shouldDirty: true });
     } else {
       setValue("institutions", [], { shouldValidate: true, shouldDirty: true });
     }
   };

  // Pre-fill form fields from existing person data (not yet a responsible)
  const preFillFromPersonData = (person: any) => {
    const { identificationPrefix, identificationNumber } = person;
    const fullCi = `${identificationPrefix}-${identificationNumber}`;
    setDisplayIdentificationNumber(formatCedulaDisplay(fullCi.replace('-', ''), false));

    // Extract phone prefix and number
    let phonePrefix = '0412';
    let phoneNumber = '';
    if (person.phone) {
      const cleanPhone = person.phone.replace(/\D/g, '');
      if (cleanPhone.length >= 4) {
        phonePrefix = cleanPhone.substring(0, 4);
        phoneNumber = cleanPhone.substring(4);
      } else {
        phoneNumber = cleanPhone;
      }
    }
    setDisplayPhoneNumber(formatPhoneLocalDisplay(phoneNumber));

    // Set form values (person-level only, no institutions)
    setValue("identificationPrefix", identificationPrefix, { shouldValidate: true, shouldDirty: true });
    setValue("identificationNumber", identificationNumber, { shouldValidate: true, shouldDirty: true });
    setValue("firstName", person.firstName || '', { shouldValidate: true, shouldDirty: true });
    setValue("middleName", person.middleName || '', { shouldValidate: true, shouldDirty: true });
    setValue("lastName", person.lastName || '', { shouldValidate: true, shouldDirty: true });
    setValue("secondLastName", person.secondLastName || '', { shouldValidate: true, shouldDirty: true });
    setValue("phonePrefix", phonePrefix, { shouldValidate: true, shouldDirty: true });
    setValue("phoneNumber", phoneNumber, { shouldValidate: true, shouldDirty: true });
    setValue("email", person.email || '', { shouldValidate: true, shouldDirty: true });
    setValue("institutions", [], { shouldValidate: true, shouldDirty: true });

    addToast({
      variant: "info",
      title: "Persona existente",
      message: "Esta persona ya está registrada en el sistema. Se han precargado sus datos.",
    });
   };

// Handle identification number input change with formatting
   const handleIdentificationNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
     const input = e.target.value;
     // Solo permitir números
     const digitsOnly = input.replace(/\D/g, '').substring(0, CEDULA_MAX_DIGITS);
     const formatted = formatCedulaDisplay(digitsOnly, false);
     setDisplayIdentificationNumber(formatted);
     setValue("identificationNumber", digitsOnly, { shouldValidate: true, shouldDirty: true });
     clearErrors("identificationNumber");
     
      // Si se cambia la cédula tras una carga de API externa, limpiar el formulario
      if (apiDataLoaded) {
        const prefix = watch("identificationPrefix") || "V";
        const currentCi = `${prefix}-${digitsOnly}`;
        if (currentCi !== apiLoadedCiRef.current) {
          setApiDataLoaded(false);
          apiLoadedCiRef.current = "";
          clearErrors("identificationNumber");
           reset({
             identificationPrefix: "",
             identificationNumber: "",
             firstName: "",
             middleName: "",
             lastName: "",
             secondLastName: "",
             phonePrefix: "",
             phoneNumber: "",
             email: "",
             title: "",
             institutions: []
           });
          setDisplayPhoneNumber("");
        }
      }

      // Si se cambia la cédula y hay un existingResponsible o existingPerson, limpiar el formulario
      if (existingResponsible || existingPerson) {
       const currentStoredDigits = existingResponsible
         ? existingResponsible.identificationNumber?.replace(/\D/g, '') || ''
         : '';
       // Si el usuario borró al menos 1 carácter o cambió algo
       if (digitsOnly.length < currentStoredDigits.length || digitsOnly !== currentStoredDigits || !existingResponsible) {
         setExistingResponsible(null);
         setExistingPerson(false);
         setViewOnlyMode(false);
         clearErrors("identificationNumber");
         // Resetear los campos del formulario
          reset({
            identificationPrefix: "",
            identificationNumber: "",
            firstName: "",
            middleName: "",
            lastName: "",
            secondLastName: "",
            phonePrefix: "",
            phoneNumber: "",
            email: "",
            title: "",
            institutions: []
          });
         setDisplayPhoneNumber("");
       }
     }
     
// Trigger CI check ONLY when we have exactly 7 or 8 digits (not before)
     if (!existingResponsible && !existingPerson && !editingResp && (digitsOnly.length === 7 || digitsOnly.length === 8)) {
       checkInstitutionalResponsibleByCi(digitsOnly);
     }
   };

  // CI blur handler: check availability when user leaves the CI field
  const handleCiBlur = useCallback(
    async (e: React.FocusEvent<HTMLInputElement>) => {
      if (!existingResponsible && !existingPerson && !editingResp) {
        const val = e.target.value;
        const digitsOnly = val.replace(/\D/g, '').substring(0, CEDULA_MAX_DIGITS);
        if (digitsOnly.length >= 6) {
          setIsCheckingCi(true);
          const prefix = watch("identificationPrefix") || 'V';
          const fullCi = `${prefix}-${digitsOnly}`;
          try {
            const result = await getResponsibleByCi(fullCi);
            if (result?.responsible) {
              setExistingResponsible(result.responsible);
              fillFormWithExistingData(result.responsible);
            } else if (result?.person) {
              setExistingResponsible(null);
              setExistingPerson(true);
              setViewOnlyMode(false);
              preFillFromPersonData(result.person);
            } else {
              setExistingResponsible(null);
              setExistingPerson(false);
              setViewOnlyMode(false);
            }
          } catch (err) {
            console.error("[InstitutionalResponsibleModal] Error checking CI on blur:", err);
          } finally {
            setIsCheckingCi(false);
          }
        }
      }
    },
    [existingResponsible, existingPerson, editingResp, watch, setValue, setError, clearErrors]
  );

  // Handle CI lookup via external API (SENIAT / CNE)
  const handleCiLookup = useCallback(async () => {
    if (existingResponsible || existingPerson || editingResp || isLookingUpCi) return;

    const rawCi = watch("identificationNumber") || "";
    const digitsOnly = rawCi.replace(/\D/g, "").substring(0, CEDULA_MAX_DIGITS);
    if (digitsOnly.length < 7) {
      addToast({
        variant: "warning",
        title: "Cédula incompleta",
        message: "Ingrese al menos 7 dígitos de la cédula para buscar.",
      });
      return;
    }

    const prefix = watch("identificationPrefix") || "V";
    const fullCi = `${prefix}-${digitsOnly}`;

    setIsLookingUpCi(true);
    try {
      const externalData = await lookupCi(fullCi);
      if (externalData) {
        setApiDataLoaded(true);
        apiLoadedCiRef.current = fullCi;
        setValue("firstName", externalData.primerNombre?.toUpperCase() || "");
        setValue("middleName", externalData.segundoNombre?.toUpperCase() || "");
        setValue("lastName", externalData.primerApellido?.toUpperCase() || "");
        setValue("secondLastName", externalData.segundoApellido?.toUpperCase() || "");
        if (externalData.nacionalidad) {
          setValue("identificationPrefix", externalData.nacionalidad.toUpperCase());
        }
        addToast({
          variant: "success",
          title: "Datos cargados",
          message: "Nombre y apellidos cargados automáticamente desde la cédula.",
        });
      } else {
        addToast({
          variant: "warning",
          title: "Sin resultados",
          message: "No se encontraron datos para esta cédula en el SENIAT.",
        });
      }
    } catch (extErr) {
      console.warn("[InstitutionalResponsibleModal] Error en lookup externo:", extErr);
      addToast({
        variant: "error",
        title: "Error de consulta",
        message: "No se pudo consultar el SENIAT. Verifique su conexión o llene los datos manualmente.",
      });
    } finally {
      setIsLookingUpCi(false);
    }
  }, [existingResponsible, existingPerson, editingResp, isLookingUpCi, watch, setValue, addToast]);

  // Handle phone number input change with formatting
  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const cleaned = cleanPhone(input).substring(0, 7);
    const formatted = formatPhoneLocalDisplay(cleaned);
    setDisplayPhoneNumber(formatted);
    setValue("phoneNumber", cleaned, { shouldValidate: true, shouldDirty: true });
  };

  // Email blur handler: check email availability (cross-entity)
  const handleEmailBlur = useCallback(
    async (e: React.FocusEvent<HTMLInputElement>) => {
      const value = e.target.value;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (value && emailRegex.test(value)) {
        setIsCheckingEmail(true);
        try {
          const res = await checkPersonAvailability(
            "email",
            value,
            editingResp?.personId ? Number(editingResp.personId) : undefined,
          );
          if (!res.available) {
            setError("email", {
              type: "manual",
              message:
                res.status === 0
                  ? "Email registrado (INACTIVO). Contacte a administración para reactivar."
                  : "Este correo electrónico ya está registrado.",
            });
          } else {
            clearErrors("email");
          }
        } catch (err) {
          console.error("Error checking email availability:", err);
        } finally {
          setIsCheckingEmail(false);
        }
      }
    },
    [editingResp, setError, clearErrors],
  );

  const {
    showConfirmation,
    handleCloseAttempt,
    confirmClose,
    cancelClose,
  } = useUnsavedChanges(isDirty, onClose);
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);
  const [confirmSaving, setConfirmSaving] = useState(false);
  const [pendingSave, setPendingSave] = useState<CreateInstitutionalResponsiblePayload | UpdateInstitutionalResponsiblePayload | null>(null);

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const listNames = ["Nacionalidad", "PREFIJO", "Título"];
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
      
      // Limpiar estados cuando se abre el modal para nuevo registro
      if (!editingResp) {
        setExistingResponsible(null);
        setExistingPerson(false);
        setViewOnlyMode(false);
        setDisplayIdentificationNumber("");
        setDisplayPhoneNumber("");
        // Resetear formulario
        reset({
          identificationPrefix: "",
          identificationNumber: "",
          firstName: "",
          middleName: "",
          lastName: "",
          secondLastName: "",
          phonePrefix: "",
          phoneNumber: "",
          email: "",
          title: "",
          institutions: []
        });
      }
    }
  }, [isOpen, fetchMultipleLists]);

  const TITULO_OPTIONS = useMemo(() => 
    (options["Título"] || []).map(opt => ({ value: String(opt.value), label: opt.label })),
  [options]);

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
          // Limpiar el teléfono de caracteres no numéricos (como guiones)
          const cleanPhone = editingResp.phone.replace(/\D/g, '');
          if (cleanPhone.length >= 4) {
            pPrefix = cleanPhone.substring(0, 4);
            pNumber = cleanPhone.substring(4);
          } else {
            pNumber = cleanPhone;
          }
        }

        // Map institutions array to form structure - incluir institutionName para 显示
        const formInstitutions = (editingResp.institutions || []).map(inst => ({
          institutionId: inst.institutionId,
          institutionName: inst.institutionName || "",
          cargo: inst.cargo || ""
        }));
        
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
          title: editingResp.title || "",
          institutions: formInstitutions,
        });
        setDisplayIdentificationNumber(formatCedulaDisplay(editingResp.identificationNumber, false));
        setDisplayPhoneNumber(formatPhoneLocalDisplay(pNumber || ""));
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
          title: "",
          institutions: preselectedInstitutionId ? [{ institutionId: preselectedInstitutionId, cargo: "" }] : [],
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
    const { phonePrefix, phoneNumber, institutions, ...rest } = data;
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
      phone: `${phonePrefix}-${phoneNumber}`,
      email: rest.email.toUpperCase(),
      title: rest.title || null,
      institutions: institutions, // Array de objetos { institutionId, cargo }
      status: editingResp?.status ?? true,
    };
    if (editingResp) {
      setPendingSave({ ...(commonData as any), responsibleId: editingResp.responsibleId } as UpdateInstitutionalResponsiblePayload);
    } else {
      setPendingSave(commonData as CreateInstitutionalResponsiblePayload);
    }
    setConfirmSaveOpen(true);
  };

  const handleFormSubmit = handleSubmit(onSubmit, onFormError);

   const handleClose = () => {
     setExistingResponsible(null);
     setExistingPerson(false);
     setViewOnlyMode(false);
     onClose();
   };

// Handle clicking the "Editar Registro" button to edit existing responsible
    const handleEditExisting = () => {
      // Salir del modo viewOnly para permitir edición
      setViewOnlyMode(false);
      setExistingResponsible(null);
      setExistingPerson(false);
    };

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleClose} onCloseAttempt={handleCloseAttempt} size="5xl" showCloseButton modalId={modalId}>
        <ModalHeader className="border-b border-border-light dark:border-white/5 pb-4">
          <div className="max-w-5xl mx-auto w-full px-4 pt-2">
            <span className="text-xl font-bold text-text-primary dark:text-white">
              {editingResp ? "Editar Responsable" : "Nuevo Responsable"}
            </span>
          </div>
        </ModalHeader>

         <ModalBody className="bg-bg-secondary/30 dark:bg-bg-dark/50">
           <form onSubmit={handleFormSubmit} className="max-w-5xl mx-auto py-6">
              {existingResponsible && (
                <div className="mb-4 flex items-center space-x-3 p-3 bg-info-50 dark:bg-info-500/10 border border-info-200 dark:border-info-500/20 rounded-lg">
                  <svg className="h-5 w-5 text-info-700 dark:text-info-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
                  </svg>
                  <span className="text-sm font-medium text-info-700 dark:text-info-400">
                    Persona ya registrada — datos precargados. Podés modificarlos antes de guardar.
                  </span>
                </div>
              )}

            <Tabs
              options={[
                { id: 'identificacion', label: 'Identificación', errorCount: errorsByTab['identificacion'] },
                { id: 'contacto', label: 'Contacto', errorCount: errorsByTab['contacto'] },
                { id: 'instituciones', label: 'Instituciones y Cargo', errorCount: errorsByTab['instituciones'] },
              ]}
              {...tabsState.tabProps}
              variant="modal"
              className="mb-6"
            />

            {/* ======================== Identificación ======================== */}
            <div hidden={tabsState.activeTab !== 'identificacion'} role="tabpanel">
              {existingPerson && (
                <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-3 dark:border-yellow-600 dark:bg-yellow-900/20 mb-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      <strong>Persona existente:</strong>{' '}
                      {existingPerson.firstName} {existingPerson.lastName} —{' '}
                      {existingPerson.identificationPrefix}-{existingPerson.identificationNumber}
                    </p>
                    {onEditExisting && (
                      <button type="button" onClick={onEditExisting} className="text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400">
                        Editar esta persona
                      </button>
                    )}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Cédula de Identidad (col-span-2) */}
                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Cédula de Identidad <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <Controller
                        name="identificationPrefix"
                        control={control}
                        render={({ field }) => (
                          <CustomSelect
                            id="identificationPrefix"
                            options={(options["Nacionalidad"] || PREFIX_OPTIONS).map(o => ({ value: String(o.value), label: o.label }))}
                            placeholder="V"
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            value={String(field.value || "V")}
                            disabled={ciDisabled}
                            error={!!errors.identificationPrefix}
                          />
                        )}
                      />
                      {errors.identificationPrefix && (
                        <p className="mt-1 text-xs text-red-500">{errors.identificationPrefix.message as string}</p>
                      )}
                    </div>
                    <div className="md:col-span-3 relative">
                      <Input
                        value={displayIdentificationNumber}
                        onChange={handleIdentificationNumberChange}
                        onBlur={handleCiBlur}
                        placeholder="V-12.345.678"
                        disabled={ciDisabled}
                        maxLength={CEDULA_MAX_LENGTH}
                        autoComplete="off"
                        className="tracking-widest"
                        error={!!errors.identificationNumber}
                        success={isFieldValid('identificationNumber')}
                        hint={
                          errors.identificationNumber?.message as string
                          || (isCheckingCi ? "Verificando disponibilidad..."
                          : isLookingUpCi ? "Consultando SENIAT..."
                          : undefined)
                        }
                      />
                      {!ciDisabled && (
                        <button
                          type="button"
                          onClick={handleCiLookup}
                          disabled={isLookingUpCi}
                          title="Buscar datos en SENIAT / CNE"
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-brand-600 dark:text-gray-500 dark:hover:text-brand-400 transition-colors disabled:opacity-50"
                        >
                          <Search className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Nombres */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Primer Nombre <span className="text-red-500">*</span>
                  </label>
                  <Input
                    {...register("firstName")}
                    onChange={handleNameChange("firstName")}
                    placeholder="Primer nombre"
                    disabled={isFieldDisabled("firstName")}
                    error={!!errors.firstName}
                    success={isFieldValid('firstName')}
                    hint={errors.firstName?.message as string}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Segundo Nombre
                  </label>
                  <Input
                    {...register("middleName")}
                    onChange={handleNameChange("middleName")}
                    placeholder="Segundo nombre (opcional)"
                    disabled={isFieldDisabled("middleName")}
                    error={!!errors.middleName}
                    success={isFieldValid('middleName')}
                    hint={errors.middleName?.message as string}
                  />
                </div>

                {/* Apellidos */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Primer Apellido <span className="text-red-500">*</span>
                  </label>
                  <Input
                    {...register("lastName")}
                    onChange={handleNameChange("lastName")}
                    placeholder="Primer apellido"
                    disabled={isFieldDisabled("lastName")}
                    error={!!errors.lastName}
                    success={isFieldValid('lastName')}
                    hint={errors.lastName?.message as string}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Segundo Apellido
                  </label>
                  <Input
                    {...register("secondLastName")}
                    onChange={handleNameChange("secondLastName")}
                    placeholder="Segundo apellido (opcional)"
                    disabled={isFieldDisabled("secondLastName")}
                    error={!!errors.secondLastName}
                    success={isFieldValid('secondLastName')}
                    hint={errors.secondLastName?.message as string}
                  />
                </div>
              </div>
            </div>

            {/* ======================== Contacto ======================== */}
            <div hidden={tabsState.activeTab !== 'contacto'} role="tabpanel">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Teléfono */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Teléfono <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <Controller
                        name="phonePrefix"
                        control={control}
                        render={({ field }) => (
                          <CustomSelect
                            id="phonePrefix"
                            options={(options["PREFIJO"] || []).map(o => ({ value: String(o.value), label: o.label }))}
                            placeholder="0412"
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            value={String(field.value ?? "")}
                            disabled={viewOnlyMode}
                            error={!!errors.phonePrefix}
                            onAddNew={() => openAddValueModal("PREFIJO", "phonePrefix", "Agregar Prefijo Telefónico")}
                            addNewLabel="Nueva opción"
                          />
                        )}
                      />
                      {errors.phonePrefix && (
                        <p className="mt-1 text-xs text-red-500">{errors.phonePrefix.message as string}</p>
                      )}
                    </div>
                    <div className="col-span-3">
                      <Input
                        value={displayPhoneNumber ?? watch("phoneNumber") ?? ""}
                        onChange={handlePhoneNumberChange}
                        placeholder="123-4567"
                        disabled={viewOnlyMode}
                        maxLength={8}
                        error={!!errors.phoneNumber}
                        success={isFieldValid('phoneNumber')}
                        hint={errors.phoneNumber?.message as string}
                      />
                    </div>
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Correo Electrónico <span className="text-red-500">*</span>
                  </label>
                  <Input
                    {...register("email")}
                    type="email"
                    placeholder="correo@ejemplo.com"
                    disabled={viewOnlyMode}
                    autoComplete="off"
                    error={!!errors.email}
                    success={isFieldValid('email')}
                    hint={
                      isCheckingEmail
                        ? "Verificando disponibilidad..."
                        : (errors.email?.message as string)
                    }
                    onChange={(e) => {
                      const upper = e.target.value.toUpperCase();
                      setValue("email", upper, { shouldValidate: true, shouldDirty: true });
                    }}
                    onBlur={(e) => {
                      register("email").onBlur(e);
                      handleEmailBlur?.(e);
                    }}
                  />
                </div>

                {/* Título (col-span-2) */}
                <div className="md:col-span-2">
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                    Título / Cargo Académico
                  </label>
                  <Controller
                    name="title"
                    control={control}
                    render={({ field }) => (
                      <CustomSelect
                        id="title"
                        options={TITULO_OPTIONS}
                        placeholder="Seleccione Título"
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        value={String(field.value || "")}
                        disabled={viewOnlyMode}
                        error={!!errors.title}
                        onAddNew={() => openAddValueModal("Título", "title", "Agregar Título")}
                        addNewLabel="Nueva opción"
                      />
                    )}
                  />
                  {errors.title && (
                    <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* ======================== Instituciones ======================== */}
            <div hidden={tabsState.activeTab !== "instituciones"} role="tabpanel">
               <label className="mb-2 block text-text-secondary dark:text-white/90 font-bold text-xs uppercase tracking-wider">Empresas o Instituciones *</label>
              {preselectedInstitutionId ? (
                <div className="space-y-2">
                  <div className="px-4 py-2.5 bg-brand-50 dark:bg-brand-500/10 border border-brand-200 dark:border-brand-500/20 rounded-lg flex items-center justify-between">
                    <p className="text-sm font-semibold text-brand-700 dark:text-brand-400">
                      {preselectedInstitutionName || institutionOptions.find(o => o.value === preselectedInstitutionId)?.label || "Empresa o Institución seleccionada"}
                    </p>
                  </div>
                      <Controller
                    name="institutions"
                    control={control}
                    render={({ field }) => {
                      const { value, onChange } = field;
                      const inst = (value || []).find((i: any) => String(i.institutionId) === String(preselectedInstitutionId));
                      const currentCargo = inst?.cargo || "";
                      return (
                        <Input
                          placeholder="Cargo en esta empresa (ej: Gerente, Supervisor)"
                          className="uppercase"
                          value={currentCargo}
                          
                          onChange={(e) => {
                            const newValue = (value || []).map((i: any) => 
                              String(i.institutionId) === String(preselectedInstitutionId)
                                ? { ...i, cargo: e.target.value.toUpperCase() }
                                : i
                            );
                            onChange(newValue);
                          }}
                        />
                      );
                    }}
                  />
                </div>
              ) : (
                <Controller
                  name="institutions"
                  control={control}
                  render={({ field: { value, onChange } }) => {
                    const selectedInstitutions = value || [];
                    
                    const handleAddInstitution = (institutionId: string) => {
                      const institutionName = institutionOptions.find(o => o.value === institutionId)?.label || "";
                      onChange([...selectedInstitutions, { institutionId, institutionName, cargo: "" }]);
                    };
                    
                    const handleRemoveInstitution = (institutionId: string) => {
                      onChange(selectedInstitutions.filter((i: any) => i.institutionId !== institutionId));
                    };
                    
                    const handleCargoChange = (institutionId: string, cargo: string) => {
                      onChange(selectedInstitutions.map((i: any) => 
                        i.institutionId === institutionId 
                          ? { ...i, cargo: cargo.toUpperCase() }
                          : i
                      ));
                    };

                    return (
                      <div className="space-y-2">
                        <CustomSelect
                          id="add-institution"
                          options={institutionOptions
                            .filter(opt => !selectedInstitutions.some((s: any) => s.institutionId === opt.value))
                            .map(opt => ({ value: String(opt.value), label: opt.label }))
                          }
onChange={(val) => {
                              if (val) handleAddInstitution(val);
                            }}
                          placeholder="Agregar empresa o institución..."
                          
                          onAddNew={() => setIsNewInstitutionModalOpen(true)}
                          addNewLabel="Crear nueva empresa o institución"
                        />
                        
                        {selectedInstitutions.length > 0 && (
                          <div className="space-y-2 mt-2">
                            {selectedInstitutions.map((inst: any) => (
                              <div key={inst.institutionId} className="flex items-center gap-2 p-2 rounded-lg border bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate text-gray-700 dark:text-gray-300">
                                    {inst.institutionName || institutionOptions.find(o => o.value === inst.institutionId)?.label || "Empresa o Institución"}
                                  </p>
                                </div>
                                <input
                                  type="text"
                                  placeholder="Cargo"
                                  className="w-32 px-2 py-1 text-xs uppercase border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600"
                                  value={inst.cargo || ""}
                                  onChange={(e) => handleCargoChange(inst.institutionId, e.target.value)}
                                />
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveInstitution(inst.institutionId)}
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  }}
                />
              )}
              {errors.institutions && (
                <p className="mt-1 text-[11px] font-medium text-red-500">
                  {errors.institutions.message as string}
                </p>
              )}
            </div>

          {/* Navegación entre tabs */}
          <div className="flex items-center justify-between pt-4 mt-6 border-t border-border-light dark:border-border-dark">
            <Button variant="outline" size="sm" onClick={goPrevTab} disabled={currentTabIndex === 0}>
              ← Anterior
            </Button>
            {currentTabIndex < TAB_IDS.length - 1 ? (
              <Button size="sm" onClick={goNextTab}>
                Siguiente →
              </Button>
            ) : (
              <span className="text-xs text-text-tertiary">Última sección</span>
            )}
          </div>
          </form>
        </ModalBody>

        <ModalFooter className="shrink-0 px-6 sm:px-12 py-6 bg-white dark:bg-bg-dark border-t border-border-light dark:border-border-dark">
           <div className="flex flex-col sm:flex-row items-center justify-end gap-3 w-full max-w-6xl mx-auto">
             <Button 
               variant="outline" 
               onClick={handleCloseAttempt} 
               type="button" 
               className="w-full sm:w-auto min-h-12 px-8 rounded-xl font-bold"
               disabled={isLoading}
             >
               Cancelar
             </Button>
             {editingResp ? (
                <AsyncButton 
                  variant="primary" 
                  type="button"
                  className="w-full sm:w-auto min-h-12 px-8 rounded-xl font-bold"
                  loading={isLoading}
                  disabled={!isValid && !isDirty}  // Habilitar si el formulario es válido O si hay cambios
                  onClick={() => {
                    const form = document.querySelector('form');
                    if (form) {
                      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
                    }
                  }}
                >
                  Guardar Cambios
                </AsyncButton>
) : (
                <AsyncButton 
                  variant="primary" 
                  type="button"
                  className="w-full sm:w-auto min-h-12 px-8 rounded-xl font-bold"
                  loading={isLoading}
                  disabled={!isValid}
                    onClick={() => {
                    handleFormSubmit().catch(err => {
                      console.error("[InstitutionalResponsibleModal] Error en validación:", err);
                    });
                  }}
                >
                  Guardar Responsable
                </AsyncButton>
              )}
           </div>
        </ModalFooter>
      </Modal>

    {confirmSaveOpen && (
      <UnifiedDialog
        isOpen={confirmSaveOpen}
        onClose={() => !confirmSaving && setConfirmSaveOpen(false)}
        onConfirm={async () => {
          if (confirmSaving) return;
          setConfirmSaving(true);
          try {
            if (pendingSave) {
              await onSave(pendingSave);
              addToast({
                variant: "success",
                title: editingResp ? "Actualizado" : "Guardado",
                message: editingResp ? "Responsable actualizado exitosamente" : "Responsable guardado exitosamente"
              });
            }
          } catch (error: any) {
            console.error("[InstitutionalResponsibleModal] Error guardando:", error);
            const errorMessage = error?.response?.data?.message || error?.message || "No se pudo guardar el responsable";
            addToast({
              variant: "error",
              title: "Error",
              message: errorMessage
            });
            return;
          } finally {
            setConfirmSaving(false);
            setConfirmSaveOpen(false);
          }
        }}
        variant="confirm"
        {...(editingResp ? CONFIRM_MESSAGES.update('Responsable institucional') : CONFIRM_MESSAGES.create('Responsable institucional'))}
        isLoading={confirmSaving}
      />
    )}

    <UnifiedDialog
      isOpen={showConfirmation}
      onClose={cancelClose}
      onConfirm={confirmClose}
      variant="warning"
      {...SYSTEM_DIALOGS.closeWithoutSaving}
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

    {/* Modal para crear nueva institución */}
    <Suspense fallback={null}>
      {isNewInstitutionModalOpen && (
        <InstitutionModal
          isOpen={isNewInstitutionModalOpen}
          onClose={() => setIsNewInstitutionModalOpen(false)}
          onSave={async (payload) => {
            try {
              const result = await addInstitution(payload as CreateInstitutionPayload);
              if (result) {
                setIsNewInstitutionModalOpen(false);
                
                // Obtener las instituciones actuales del form
                const currentInstitutions = watch("institutions") || [];
                const newInstitutionId = result.institutionId;
                const newInstitutionName = result.name;
                
                // Agregar la nueva institución si no existe (usando el patrón existente)
                if (!currentInstitutions.some((i: any) => String(i.institutionId) === String(newInstitutionId))) {
                  const updatedInstitutions = [
                    ...currentInstitutions,
                    { institutionId: newInstitutionId, institutionName: newInstitutionName, cargo: "" } as any
                  ];
                  setValue("institutions", updatedInstitutions);
                }
                
                addToast({
                  variant: "success",
                title: "Empresa o Institución creada",
                message: `La empresa o institución "${result.name}" ha sido creada y asignada`
                });
              }
              return result;
            } catch (error) {
              console.error("[InstitutionalResponsibleModal] Error creating institution:", error);
              addToast({
                variant: "error",
                title: "Error",
                message: "No se pudo crear la empresa o institución"
              });
            }
          }}
          isLoading={false}
          careerOptions={[]}
          internshipTypeOptions={[]}
          modalId="responsible-new-institution"
        />
      )}
    </Suspense>
  </>
);
}
