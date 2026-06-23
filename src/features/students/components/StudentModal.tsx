import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useForm, Controller, FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { checkAvailability, getStudentByCi, lookupCi } from "../services/studentsService";
import Input from "../../../components/form/input/InputField";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../../components/ui/modal";
import { Tabs } from "../../../components/ui/tabs/Tabs";
import { useTabs } from "../../../hooks/useTabs";
import { 
  CreateStudentPayload,
  UpdateStudentPayload,
  Student 
} from "../types";
import Button from "../../../components/ui/button/Button";
import AsyncButton from "../../../components/ui/button/AsyncButton";
import CustomSelect from "../../../components/form/CustomSelect";
import { useUnsavedChanges } from "../../../hooks/useUnsavedChanges";
import { useToast } from "../../../context/toast";
import UnifiedDialog from "../../../components/ui/dialog/UnifiedDialog";
import { SYSTEM_DIALOGS } from "../../../components/ui/dialog/DialogConfig";
import { useLists } from "../../lists/hooks/useLists";
import { List, ListValue } from "../../lists/types";
import * as listsService from "../../lists/services/listsService";
import { isProtectedList, PROTECTED_LIST_MESSAGE } from "../../../constants/systemLists";
import { 
  studentSchema, 
  StudentFormInput,
  StudentFormOutput
} from "../constants/validation";
import { formatCedulaDisplay, formatPhoneLocalDisplay, CEDULA_MAX_LENGTH, CEDULA_MAX_DIGITS } from "../../../utils/inputFormat";
import PersonFormFields from "../../persons/components/PersonFormFields";
import { useAcademicConfig } from "../../academic-config/hooks/useAcademicConfig";
import AddressList from "../../address/components/AddressList";
import GeographicAddressFields from "../../address/components/GeographicAddressFields";
import { addressService } from "../../address/services/addressService";
import type { GeoOptionsItem } from "../../address/types";
import type { GeographicAddressValue } from "../../address/components/GeographicAddressFields";

/**
 * Propiedades del componente StudentModal.
 */
interface StudentModalProps {
  /** Indica si el modal está abierto */
  isOpen: boolean;
  /** Función para cerrar el modal */
  onClose: () => void;
  /** Función para guardar los datos del estudiante (creación o actualización) */
  onSave: (student: CreateStudentPayload | UpdateStudentPayload) => Promise<void> | void;
  /** Estudiante en edición (null si es creación) */
  editingStudent?: Student | null;
  /** Listas dinámicas cargadas previamente (opcional) */
  dynamicLists?: Record<string, ListValue[]>;
  /** Indica si hay una operación de guardado en curso */
  isLoading?: boolean;
  /** ID único para tracking en modal stack (opcional) */
  modalId?: string;
  /** Callback cuando se quiere editar un registro existente (convierte de crear a editar) */
  onEditExisting?: (student: Student) => void;
}

/**
 * Modal para el registro y edición de estudiantes.
 * Gestiona la validación de campos, carga de catálogos y verificación de disponibilidad de C.I./Email.
 * 
 * @example
 * ```tsx
 * <StudentModal 
 *   isOpen={isOpen} 
 *   onClose={() => setIsOpen(false)} 
 *   onSave={handleSave} 
 * />
 * ```
 */
export default function StudentModal({
  isOpen,
  onClose,
  onSave,
  editingStudent,
  dynamicLists,
  isLoading = false,
  modalId,
  onEditExisting,
}: StudentModalProps) {
  const [isCheckingCi, setIsCheckingCi] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [isLookingUpCi, setIsLookingUpCi] = useState(false);
  const { fetchMultipleLists } = useLists();
  const { addToast } = useToast();
const [options, setOptions] = useState<Record<string, { value: string; label: string }[]>>({});
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);
  const [confirmSaving, setConfirmSaving] = useState(false);
  const [pendingSave, setPendingSave] = useState<CreateStudentPayload | UpdateStudentPayload | null>(null);

  // State for display values with formatting
  const [displayIdentificationNumber, setDisplayIdentificationNumber] = useState("");
  const [displayPhoneNumber, setDisplayPhoneNumber] = useState("");
  
  // State for tabs in the form
  const tabsState = useTabs({ defaultTab: 'datos-personales' });
  useEffect(() => { if (isOpen) tabsState.setActiveTab('datos-personales'); }, [isOpen]);

  // State for existing record (when duplicate is found)
  const [existingStudent, setExistingStudent] = useState<any | null>(null);
  const [existingPerson, setExistingPerson] = useState(false);
  const [viewOnlyMode, setViewOnlyMode] = useState(false);
  // State for API-loaded data flow (SENIAT)
  const [apiDataLoaded, setApiDataLoaded] = useState(false);
  const apiLoadedCiRef = useRef("");
  const { config: academicConfig } = useAcademicConfig();
  const [geoOptions, setGeoOptions] = useState<GeoOptionsItem[]>([]);
  const [inlineAddress, setInlineAddress] = useState<GeographicAddressValue>({
    parroquiaId: null, streetAddress: '', reference: '', addressTypeId: 3, isPrimary: true,
  });

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    setError,
    clearErrors,
    formState: { errors, isDirty, isValid },
  } = useForm<StudentFormInput>({
    resolver: zodResolver(studentSchema),
    mode: "all",
    defaultValues: editingStudent ? { ...editingStudent } : {
      identificationPrefix: "V",
      identificationNumber: "",
      firstName: "",
      middleName: "",
      lastName: "",
      secondLastName: "",
      sex: "",
      birthDate: "",
      civilStatus: "",
      phonePrefix: "",
      phoneNumber: "",
      email: "",
      address: "",
      studentType: "",
      militaryRank: "",
      works: "",
    },
  });

  const TAB_IDS = ['datos-personales', 'academico'] as const;
  const TAB_FIELDS: Record<string, string[]> = {
    'datos-personales': ['identificationPrefix', 'identificationNumber', 'firstName', 'middleName', 'lastName', 'secondLastName', 'sex', 'birthDate', 'civilStatus', 'phonePrefix', 'phoneNumber', 'email', 'address'],
    'academico': ['studentType', 'militaryRank', 'works'],
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
  const scrollToErrorTab = useCallback(() => {
    const firstTab = TAB_IDS.find(tab => TAB_FIELDS[tab].some(f => (errors as Record<string, any>)[f]));
    if (firstTab) tabsState.setActiveTab(firstTab);
  }, [errors]);

  // Handle identification number input change with formatting
  const handleIdentificationNumberChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    // Solo permitir números
    const digitsOnly = input.replace(/\D/g, '').substring(0, CEDULA_MAX_DIGITS);
    const formatted = formatCedulaDisplay(digitsOnly, false);
    setDisplayIdentificationNumber(formatted);
    setValue("identificationNumber", digitsOnly, { shouldValidate: true });
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
          sex: "",
          birthDate: "",
          civilStatus: "",
          phonePrefix: "",
          phoneNumber: "",
          email: "",
          address: "",
          studentType: "",
          militaryRank: "",
          works: "",
        });
        setDisplayPhoneNumber("");
      }
    }

    // Si se cambia la cédula y hay un existingStudent o existingPerson, limpiar el formulario
    if (existingStudent || existingPerson) {
      const currentStoredDigits = existingStudent
        ? existingStudent.identificationNumber?.replace(/\D/g, '') || ''
        : '';
      // Si el usuario borró al menos 1 carácter o cambió algo
      if (digitsOnly.length < currentStoredDigits.length || digitsOnly !== currentStoredDigits || !existingStudent) {
        setExistingStudent(null);
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
          sex: "",
          birthDate: "",
          civilStatus: "",
          phonePrefix: "",
          phoneNumber: "",
          email: "",
          address: "",
          studentType: "",
          militaryRank: "",
          works: "",
        });
        setDisplayPhoneNumber("");
      }
    }

    // Verificar si la cédula existe en BD local mientras escribe (7 u 8 dígitos)
    // NOTA: lookupCi (API externa) SOLO se llama en onBlur (handleCiBlur)
    // para evitar múltiples consultas en cada keystroke y violaciones de reflow
    if (!existingStudent && !existingPerson && !editingStudent && (digitsOnly.length === 7 || digitsOnly.length === 8)) {
      setIsCheckingCi(true);
      const prefix = watch("identificationPrefix") || 'V';
      const fullCi = `${prefix}-${digitsOnly}`;
      try {
        const result = await getStudentByCi(fullCi);
        if (result?.student) {
          // Estudiante ya existe → modo solo lectura con datos pre-cargados
          const studentData = result.student;
          setExistingStudent(studentData);
          setExistingPerson(false);
          // Parse phone number into prefix and local
          let phonePrefix = "";
          let phoneNumber = "";
          if (studentData.phone) {
            const cleanPhone = studentData.phone.replace(/[-\s]/g, '');
            if (cleanPhone.length >= 4) {
              phonePrefix = cleanPhone.substring(0, 4);
              phoneNumber = cleanPhone.substring(4);
            }
          }

          setValue("identificationPrefix", studentData.identificationPrefix || 'V');
          setDisplayIdentificationNumber(formatCedulaDisplay(studentData.identificationNumber || ''));
          setValue("identificationNumber", studentData.identificationNumber || '');
          setValue("firstName", studentData.firstName || "");
          setValue("middleName", studentData.middleName || "");
          setValue("lastName", studentData.lastName || "");
          setValue("secondLastName", studentData.secondLastName || "");
          setValue("sex", studentData.sex || "");
          setValue("birthDate", studentData.birthDate || "");
          setValue("civilStatus", studentData.civilStatus || "");
          setValue("phonePrefix", phonePrefix);
          setDisplayPhoneNumber(formatPhoneLocalDisplay(phoneNumber));
          setValue("phoneNumber", phoneNumber);
          setValue("email", studentData.email || "");
          setValue("address", studentData.address || "");
          setValue("studentType", studentData.studentType || "");
          setValue("militaryRank", studentData.militaryRank || "");
          setValue("works", studentData.works || "");
        } else if (result?.person) {
          // Persona existe (tutor, usuario, etc.) pero no como estudiante → pre-cargar datos
          setExistingStudent(null);
          setExistingPerson(true);
          setViewOnlyMode(false);

          const personData = result.person;
          setValue("identificationPrefix", personData.identificationPrefix || 'V');
          setDisplayIdentificationNumber(formatCedulaDisplay(personData.identificationNumber || ''));
          setValue("identificationNumber", personData.identificationNumber || '');
          setValue("firstName", personData.firstName || "");
          setValue("middleName", personData.middleName || "");
          setValue("lastName", personData.lastName || "");
          setValue("secondLastName", personData.secondLastName || "");
          setValue("sex", personData.gender || "");
          setValue("birthDate", personData.birthDate || "");
          setValue("civilStatus", personData.maritalStatus || "");
          setValue("address", personData.address || "");
          setValue("email", personData.email || "");

          let phonePrefix = "";
          let phoneNumber = "";
          if (personData.phone) {
            const cleanPhone = personData.phone.replace(/[-\s]/g, '');
            if (cleanPhone.length >= 4) {
              phonePrefix = cleanPhone.substring(0, 4);
              phoneNumber = cleanPhone.substring(4);
            }
          }
          setValue("phonePrefix", phonePrefix);
          setDisplayPhoneNumber(formatPhoneLocalDisplay(phoneNumber));
          setValue("phoneNumber", phoneNumber);

          addToast({
            variant: "info",
            title: "Persona existente",
            message: "Esta persona ya está registrada en el sistema. Se han precargado sus datos.",
          });
        }
        // Si no existe en BD local, NO llamamos lookupCi aquí.
        // El lookup externo se hace SOLO en onBlur (handleCiBlur) para evitar
        // consultas duplicadas y reducir reflows en cada keystroke.
      } catch (err) {
        console.error("Error checking CI:", err);
      } finally {
        setIsCheckingCi(false);
      }
    }
  };

  // Handle phone number input change with formatting
  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const digitsOnly = input.replace(/\D/g, '').substring(0, 7);
    const formatted = digitsOnly.length <= 3 ? digitsOnly : `${digitsOnly.slice(0, 3)}-${digitsOnly.slice(3, 7)}`;
    setDisplayPhoneNumber(formatted);
    setValue("phoneNumber", digitsOnly, { shouldValidate: true, shouldDirty: true });
  };

  // Handler factory for name fields: toUpperCase + character filtering
  const createNameHandler = useCallback(
    (field: string) =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value
          .replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s']/g, "")
          .toUpperCase();
        setValue(field as any, val, { shouldValidate: true, shouldDirty: true });
      },
    [setValue],
  );

  // CI blur handler: solo verifica disponibilidad en BD local (NO llama a API externa)
  const handleCiBlur = useCallback(
    async (e: React.FocusEvent<HTMLInputElement>) => {
      if (!existingStudent && !existingPerson && !editingStudent) {
        const val = e.target.value;
        const digitsOnly = val.replace(/\D/g, "").substring(0, CEDULA_MAX_DIGITS);
        if (digitsOnly.length >= 6) {
          setIsCheckingCi(true);
          const prefix = watch("identificationPrefix") || "V";
          const fullCi = `${prefix}-${digitsOnly}`;
          try {
            const result = await getStudentByCi(fullCi);
            if (result?.student) {
              // Estudiante ya existe → precargar datos (form editable)
              const studentData = result.student;
              setExistingStudent(studentData);
              setExistingPerson(false);

              // Parse phone
              let phonePrefix = "";
              let phoneNumber = "";
              if (studentData.phone) {
                const cleanPhone = studentData.phone.replace(/[-\s]/g, "");
                if (cleanPhone.length >= 4) {
                  phonePrefix = cleanPhone.substring(0, 4);
                  phoneNumber = cleanPhone.substring(4);
                }
              }

              // Pre-fill ALL form fields (person + student-specific)
              setValue("identificationPrefix", studentData.identificationPrefix || "V");
              setDisplayIdentificationNumber(
                formatCedulaDisplay(studentData.identificationNumber || ""),
              );
              setValue("identificationNumber", studentData.identificationNumber || "");
              setValue("firstName", studentData.firstName || "");
              setValue("middleName", studentData.middleName || "");
              setValue("lastName", studentData.lastName || "");
              setValue("secondLastName", studentData.secondLastName || "");
              setValue("sex", studentData.sex || "");
              setValue("birthDate", studentData.birthDate || "");
              setValue("civilStatus", studentData.civilStatus || "");
              setValue("phonePrefix", phonePrefix);
              setDisplayPhoneNumber(formatPhoneLocalDisplay(phoneNumber));
              setValue("phoneNumber", phoneNumber);
              setValue("email", studentData.email || "");
              setValue("address", studentData.address || "");
              setValue("studentType", studentData.studentType || "");
              setValue("militaryRank", studentData.militaryRank || "");
              setValue("works", studentData.works || "");
            } else if (result?.person) {
              // Persona existe (tutor, usuario, etc.) pero no como estudiante → pre-cargar datos
              setExistingStudent(null);
              setExistingPerson(true);
              setViewOnlyMode(false);

              const personData = result.person;
              setValue("identificationPrefix", personData.identificationPrefix || "V");
              setDisplayIdentificationNumber(
                formatCedulaDisplay(personData.identificationNumber || ""),
              );
              setValue("identificationNumber", personData.identificationNumber || "");
              setValue("firstName", personData.firstName || "");
              setValue("middleName", personData.middleName || "");
              setValue("lastName", personData.lastName || "");
              setValue("secondLastName", personData.secondLastName || "");
              setValue("sex", personData.gender || "");
              setValue("birthDate", personData.birthDate || "");
              setValue("civilStatus", personData.maritalStatus || "");
              setValue("address", personData.address || "");
              setValue("email", personData.email || "");

              let phonePrefix = "";
              let phoneNumber = "";
              if (personData.phone) {
                const cleanPhone = personData.phone.replace(/[-\s]/g, "");
                if (cleanPhone.length >= 4) {
                  phonePrefix = cleanPhone.substring(0, 4);
                  phoneNumber = cleanPhone.substring(4);
                }
              }
              setValue("phonePrefix", phonePrefix);
              setDisplayPhoneNumber(formatPhoneLocalDisplay(phoneNumber));
              setValue("phoneNumber", phoneNumber);

              addToast({
                variant: "info",
                title: "Persona existente",
                message: "Esta persona ya está registrada en el sistema. Se han precargado sus datos.",
              });
            }
            // Si no existe en BD local, NO llamamos lookupCi aquí.
            // El usuario debe pulsar el botón 🔍 Buscar SENIAT para consultar la API externa.
          } catch (err) {
            console.error("Error al verificar CI en base de datos:", err);
          } finally {
            setIsCheckingCi(false);
          }
        }
      }
    },
    [existingStudent, existingPerson, editingStudent, setValue, watch],
  );

  // Handler para el botón Buscar en SENIAT — consulta API externa SOLO cuando el usuario lo pulsa
  const handleCiLookup = useCallback(async () => {
    if (existingStudent || existingPerson || editingStudent || isLookingUpCi) return;

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
        setValue("firstName", externalData.primerNombre || "");
        setValue("middleName", externalData.segundoNombre || "");
        setValue("lastName", externalData.primerApellido || "");
        setValue("secondLastName", externalData.segundoApellido || "");
        if (externalData.nacionalidad) {
          setValue("identificationPrefix", externalData.nacionalidad);
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
      console.warn("[StudentModal] Error en lookup externo:", extErr);
      addToast({
        variant: "error",
        title: "Error de consulta",
        message: "No se pudo consultar el SENIAT. Verifique su conexión o llene los datos manualmente.",
      });
    } finally {
      setIsLookingUpCi(false);
    }
  }, [existingStudent, existingPerson, editingStudent, isLookingUpCi, watch, setValue, addToast]);

  // Email blur handler: check email availability
  const handleEmailBlur = useCallback(
    async (e: React.FocusEvent<HTMLInputElement>) => {
      const value = e.target.value;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (value && emailRegex.test(value)) {
        setIsCheckingEmail(true);
        try {
          const res = await checkAvailability(
            "email",
            value,
            editingStudent?.personId,
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
    [editingStudent, setError, clearErrors],
  );

  useEffect(() => {
    const loadOptions = async () => {
      const listNames = [
        "Nacionalidad",
        "Sexo",
        "PREFIJO",
        "Registro Civil",
        "Regimen/Turno",
        "Tipo de estudiante",
        "Rango Militar",
        "Trabajo"
      ];

      try {
        let finalData: Record<string, ListValue[]> = {};
        
        // Determinar qué listas necesitamos pedir basándonos en lo que recibimos por prop
        if (dynamicLists && Object.keys(dynamicLists).length > 0) {
          finalData = { ...dynamicLists };
          
          // Verificamos si alguna de las listas esenciales NO está en dynamicLists
          const missing = listNames.filter(name => !dynamicLists[name] || dynamicLists[name].length === 0);
          
          if (missing.length > 0) {
            const extraData = await fetchMultipleLists(missing);
            finalData = { ...finalData, ...extraData };
          }
        } else {
          // Si no hay dynamicLists por prop, las pedimos todas
          finalData = await fetchMultipleLists(listNames);
        }

        // Mapear los datos a formato de opciones
        const mappedOptions: Record<string, { value: string; label: string }[]> = {};
        Object.entries(finalData).forEach(([key, values]) => {
          if (!values) return;
          mappedOptions[key] = values.map(v => {
            const useAbbreviation = (key === "Nacionalidad" || key === "PREFIJO") && v.abbreviation;
            const value = useAbbreviation ? v.abbreviation.toUpperCase() : v.name.toUpperCase();
            return { value, label: value };
          });
        });
        
        setOptions(mappedOptions);
      } catch (error) {
        console.error("Error loading list options for StudentModal:", error);
      }
    };

    const loadGeoOptions = async () => {
      try {
        const response = await addressService.getGeoOptions();
        setGeoOptions(response.data);
      } catch (error) {
        console.error("Error loading geo options:", error);
      }
    };

    if (isOpen) {
      loadOptions();
      loadGeoOptions();
    }
  }, [isOpen, fetchMultipleLists, dynamicLists]);

  const STUDENT_TYPE_OPTIONS = options["Tipo de estudiante"] || [
    { value: "CIVIL", label: "CIVIL" },
    { value: "MILITAR", label: "MILITAR" },
  ];

  const MILITARY_RANKS = options["Rango Militar"] || [];

  const WORKS_OPTIONS = options["Trabajo"] || [
    { value: "SI", label: "SI" },
    { value: "NO", label: "NO" },
  ];

  const {
    showConfirmation,
    handleCloseAttempt,
    confirmClose,
    cancelClose,
  } = useUnsavedChanges(isDirty, onClose);

  const studentType = watch("studentType");
  const birthDate = watch("birthDate");

  // Calcular edad basada en birthDate
  const age = useMemo(() => {
    if (!birthDate || birthDate.trim() === "") return null;
    // Usar T12:00:00 para evitar problemas de zona horaria con strings YYYY-MM-DD
    const birth = new Date(birthDate.includes('T') ? birthDate : `${birthDate}T12:00:00`);
    if (isNaN(birth.getTime())) return null;
    
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }, [birthDate]);

  // Restricción de fecha: 16 años atrás desde hoy
  const maxDate = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 16);
    return d;
  }, []);

  useEffect(() => {
    const isMilitary = studentType === "MILITAR";
    const currentRank = watch("militaryRank");

    if (studentType === "CIVIL") {
      setValue("militaryRank", "NO APLICA", { shouldValidate: true });
    } else if (isMilitary && (currentRank === "NO APLICA" || !currentRank)) {
      setValue("militaryRank", "", { shouldValidate: true });
    }
  }, [studentType, setValue, watch]);

  const [isValueModalOpen, setIsValueModalOpen] = useState(false);
  const [valueModalTitle, setValueModalTitle] = useState<string>("");
  const [targetListName, setTargetListName] = useState<string>("");
  const [targetField, setTargetField] = useState<string>("civilStatus");
  const [newValueInput, setNewValueInput] = useState<string>("");
  const [savingNewValue, setSavingNewValue] = useState(false);

  const openAddValueModal = (listName: string, field: string, title: string, preset: string = "") => {
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
    setNewValueInput(preset);
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
      
      // Evitar duplicados: si ya existe un valor con el mismo nombre/abreviación, seleccionarlo y salir
      const existing = (list!.values || []).find((v: { name: any; abbreviation: any; }) => {
        const byName = String(v.name || "").toUpperCase() === upper;
        const byAbbr = String(v.abbreviation || "").toUpperCase() === upper;
        return byName || byAbbr;
      });
      if (existing) {
        const selectValue = (targetListName === "Nacionalidad" && existing.abbreviation) 
          ? String(existing.abbreviation).toUpperCase() 
          : String(existing.name).toUpperCase();
        setValue(targetField as any, selectValue, { shouldValidate: true, shouldDirty: true });
        setIsValueModalOpen(false);
        return;
      }

      const abbr = (targetListName === "Nacionalidad") ? upper : undefined;
      const created = await listsService.createValue(list!.id, upper, abbr);
      const mapped = { value: (targetListName === "Nacionalidad" && created.abbreviation) ? created.abbreviation.toUpperCase() : upper, label: (targetListName === "Nacionalidad" && created.abbreviation) ? created.abbreviation.toUpperCase() : upper };
      setOptions(prev => {
        const next = { ...prev };
        const arr = next[targetListName] || [];
        next[targetListName] = [...arr, mapped];
        return next;
      });
      setValue(targetField as any, mapped.value, { shouldValidate: true, shouldDirty: true });
      setIsValueModalOpen(false);
    } catch (e) {
      console.error("[StudentModal] Error creando valor en lista:", e);
    } finally {
      setSavingNewValue(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      // Limpiar estados de duplicado cuando se abre el modal
      setExistingStudent(null);
      setExistingPerson(false);
      setViewOnlyMode(false);
      // Resetear dirección inline
      setInlineAddress({ parroquiaId: null, streetAddress: '', reference: '', addressTypeId: 3, isPrimary: true });
      
      if (editingStudent) {
        // Separar prefijo y número de teléfono (ej: 04121234567)
        let phonePrefix = "";
        let phoneNumber = "";
        
        if (editingStudent.phone) {
          const cleanPhone = editingStudent.phone.replace(/[-\s]/g, '');
          if (cleanPhone.length >= 4) {
            phonePrefix = cleanPhone.substring(0, 4);
            phoneNumber = cleanPhone.substring(4);
          } else {
            phoneNumber = cleanPhone;
          }
        }
        
        reset({
          identificationPrefix: editingStudent.identificationPrefix || "V",
          identificationNumber: editingStudent.identificationNumber || "",
          firstName: editingStudent.firstName || "",
          middleName: editingStudent.middleName || "",
          lastName: editingStudent.lastName || "",
          secondLastName: editingStudent.secondLastName || "",
          sex: editingStudent.sex || "",
          birthDate: editingStudent.birthDate || "",
          civilStatus: editingStudent.civilStatus || "",
          phonePrefix: phonePrefix,
          phoneNumber: phoneNumber,
          email: editingStudent.email || "",
          address: editingStudent.address || "",
          studentType: editingStudent.studentType || "",
          militaryRank: editingStudent.militaryRank || "",
          works: editingStudent.works || "",
        });
        setDisplayIdentificationNumber(formatCedulaDisplay(editingStudent.identificationNumber, false));
        setDisplayPhoneNumber(formatPhoneLocalDisplay(phoneNumber));

        // Cargar dirección principal del estudiante
        if (editingStudent.personId) {
          addressService.getPersonAddresses(editingStudent.personId).then(res => {
            const addrs = res.data as any[];
            if (addrs && addrs.length > 0) {
              const primary = addrs[0]; // ordenado por is_primary DESC
              const addr = primary.address;
              if (addr) {
                setInlineAddress({
                  parroquiaId: addr.parroquia?.parroquia_id ?? null,
                  streetAddress: addr.street_address ?? '',
                  reference: addr.reference ?? '',
                  addressTypeId: primary.address_type?.address_type_id ?? 3,
                  isPrimary: true,
                });
              }
            }
          }).catch(() => {});
        }
      } else {
        reset({
          identificationPrefix: "V",
          identificationNumber: "",
          firstName: "",
          middleName: "",
          lastName: "",
          secondLastName: "",
          sex: "",
          birthDate: "",
          civilStatus: "",
          phonePrefix: "",
          phoneNumber: "",
          email: "",
          address: "",
          studentType: "",
          militaryRank: "",
          works: "",
        });
        setDisplayIdentificationNumber("");
        setDisplayPhoneNumber("");
      }
    }
  }, [isOpen, editingStudent, reset]);

  // Cleanup adicional cuando se cierra el modal
  useEffect(() => {
    if (!isOpen) {
      // Cuando el modal se cierra, asegurar limpieza
      setExistingStudent(null);
      setExistingPerson(false);
      setViewOnlyMode(false);
    }
  }, [isOpen]);

  const onSubmit = async (data: StudentFormInput) => {
    // Prevenir envío si hay conflicto de CI detectado
    if (errors.identificationNumber?.type === "manual") {
      addToast({
        variant: "error",
        title: "Cédula no disponible",
        message: errors.identificationNumber.message as string,
      });
      return;
    }
    try {
      const validatedData = data as StudentFormOutput;
      const studentData: CreateStudentPayload = {
        identificationPrefix: validatedData.identificationPrefix as Student["identificationPrefix"],
        identificationNumber: validatedData.identificationNumber,
        firstName: validatedData.firstName,
        middleName: validatedData.middleName || "",
        lastName: validatedData.lastName,
        secondLastName: validatedData.secondLastName || "",
        sex: validatedData.sex as Student["sex"],
        birthDate: validatedData.birthDate,
        civilStatus: validatedData.civilStatus as Student["civilStatus"],
        phone: `${validatedData.phonePrefix}${validatedData.phoneNumber}`,
        email: validatedData.email,
        address: validatedData.address || "",
        studentType: validatedData.studentType as Student["studentType"],
        militaryRank: validatedData.militaryRank,
        works: validatedData.works as Student["works"],
      };
      if (editingStudent) {
        setPendingSave({ ...(studentData as any), studentId: editingStudent.studentId } as UpdateStudentPayload);
      } else {
        setPendingSave(studentData);
      }
      setConfirmSaveOpen(true);
    } catch (error) {
      console.error("[StudentModal] Error en validación:", error);
      addToast({
        variant: "error",
        title: "Error de Formulario",
        message: "Por favor, revise los campos marcados en rojo.",
      });
    }
  };

  const handleClose = () => {
    setExistingStudent(null);
    setViewOnlyMode(false);
    onClose();
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleClose} onCloseAttempt={handleCloseAttempt} showCloseButton size="5xl" modalId={modalId}>
        <ModalHeader>
          <div className="w-full">
            <span className="mb-1 font-semibold text-text-primary modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
              {editingStudent ? "Editar Estudiante" : "Registrar Estudiante"}
            </span>
            <p className="text-sm text-text-secondary dark:text-text-tertiary font-normal">
              {editingStudent ? "Modifica los detalles del estudiante." : "Ingresa los detalles del nuevo estudiante."}
            </p>
          </div>
        </ModalHeader>

      <ModalBody className="bg-bg-secondary/30 dark:bg-bg-dark/50">
        <form id="student-form" onSubmit={handleSubmit(onSubmit, scrollToErrorTab)} className="space-y-8 w-full">
          {existingStudent && (
            <div className="flex items-center space-x-3 p-3 bg-info-50 dark:bg-info-500/10 border border-info-200 dark:border-info-500/20 rounded-lg mb-4">
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
              { id: 'datos-personales', label: 'Datos Personales', errorCount: errorsByTab['datos-personales'] },
              { id: 'academico', label: 'Académico', errorCount: errorsByTab['academico'] },
            ]}
            {...tabsState.tabProps}
            variant="modal"
            className="mb-6"
          />

          <div hidden={tabsState.activeTab !== 'datos-personales'} role="tabpanel">
          {/* ============================================================ */}
          {/* Campos compartidos de Persona (usando PersonFormFields) */}
          {/* ============================================================ */}
          <PersonFormFields
            control={control}
            register={register}
            errors={errors}
            setValue={setValue}
            watch={watch}
            options={options}
            displayIdentificationNumber={displayIdentificationNumber}
            onIdentificationNumberChange={handleIdentificationNumberChange}
            onBlurCi={handleCiBlur}
            onCiLookup={handleCiLookup}
            isCheckingCi={isCheckingCi}
            isLookingUpCi={isLookingUpCi}
            displayPhoneNumber={displayPhoneNumber}
            onPhoneNumberChange={handlePhoneNumberChange}
            createNameHandler={createNameHandler}
            onAddValue={openAddValueModal}
            age={age}
            maxDate={maxDate ? maxDate.toISOString().split("T")[0] : undefined}
            onBlurEmail={handleEmailBlur}
            isCheckingEmail={isCheckingEmail}
            viewOnlyMode={viewOnlyMode}
            fieldLockOnApiLoad={apiDataLoaded && (academicConfig?.lockApiLoadedFields ?? true)}
            editingId={editingStudent?.studentId ?? existingStudent?.studentId ?? null}
          />
          
          {/* Sección de Dirección */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
            <h3 className="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Dirección de Residencia</h3>
            <GeographicAddressFields
              geoOptions={geoOptions}
              value={inlineAddress}
              onChange={setInlineAddress}
              showReference
            />
          </div>
          </div>
          
          <div hidden={tabsState.activeTab !== 'academico'} role="tabpanel">
          {/* ============================================================ */}
          {/* Campos específicos de Estudiante */}
          {/* ============================================================ */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
            {/* Tipo Estudiante */}
            <div>
              <label htmlFor="studentType" className="text-sm font-medium text-text-primary dark:text-white/90">
                Tipo Estudiante <span className="text-red-500">*</span>
              </label>
              <Controller
                name="studentType"
                control={control}
                render={({ field }) => (
                  <CustomSelect
                    id="studentType"
                    options={STUDENT_TYPE_OPTIONS.map(opt => ({ value: String(opt.value), label: opt.label }))}
                    placeholder="Seleccione campo"
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    value={String(field.value)}
                    disabled={viewOnlyMode}
                    error={!!errors.studentType}
                  />
                )}
              />
              {errors.studentType && (
                <p className="mt-1 text-xs text-error-500 flex items-center gap-1">
                  <span className="inline-block w-1 h-1 bg-error-500 rounded-full"></span>
                  {errors.studentType.message}
                </p>
              )}
            </div>

            {/* Rango Militar (solo si es MILITAR) */}
            {studentType === "MILITAR" && (
              <div>
                <label htmlFor="militaryRank" className="text-sm font-medium text-text-primary dark:text-white/90">
                  Rango Militar <span className="text-red-500">*</span>
                </label>
                <Controller
                  name="militaryRank"
                  control={control}
                  render={({ field }) => {
                    const currentOptions = MILITARY_RANKS.filter(opt => opt.value !== "NO APLICA");
                    return (
                      <CustomSelect
                        id="militaryRank"
                        options={currentOptions.map(opt => ({ value: String(opt.value), label: opt.label }))}
                        placeholder="Seleccione Rango"
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        value={String(field.value)}
                        onAddNew={() => openAddValueModal("Rango Militar", "militaryRank", "Agregar Rango Militar")}
                        addNewLabel="Agregar Rango Militar"
                        disabled={viewOnlyMode}
                        error={!!errors.militaryRank}
                      />
                    );
                  }}
                />
                {errors.militaryRank && (
                  <p className="mt-1 text-xs text-error-500 flex items-center gap-1">
                    <span className="inline-block w-1 h-1 bg-error-500 rounded-full"></span>
                    {errors.militaryRank.message}
                  </p>
                )}
              </div>
            )}

            {/* ¿Trabaja? */}
            <div>
              <label htmlFor="works" className="text-sm font-medium text-text-primary dark:text-white/90">
                ¿Trabaja? <span className="text-red-500">*</span>
              </label>
              <Controller
                name="works"
                control={control}
                render={({ field }) => (
                  <CustomSelect
                    id="works"
                    options={WORKS_OPTIONS.map(opt => ({ value: String(opt.value), label: opt.label }))}
                    placeholder="Seleccione"
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    value={String(field.value)}
                    disabled={viewOnlyMode}
                    error={!!errors.works}
                  />
                )}
              />
              {errors.works && (
                <p className="mt-1 text-xs text-error-500 flex items-center gap-1">
                  <span className="inline-block w-1 h-1 bg-error-500 rounded-full"></span>
                  {errors.works.message}
                </p>
              )}
            </div>
          </div>

          {/* Direcciones Estructuradas */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
            <AddressList
              entityType="person"
              entityId={editingStudent?.personId ? Number(editingStudent.personId) : existingStudent?.personId ? Number(existingStudent.personId) : null}
              geoOptions={geoOptions}
            />
          </div>
          </div>

          {/* Navegación entre tabs */}
          <div className="flex items-center justify-between pt-4 mt-6 border-t border-border-light dark:border-border-dark">
            <Button
              variant="outline"
              size="sm"
              onClick={goPrevTab}
              disabled={currentTabIndex === 0}
            >
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
          <Button variant="outline" onClick={handleCloseAttempt} disabled={isLoading} className="w-full sm:w-auto min-h-12">
            Cancelar
          </Button>
          {existingStudent ? (
            <AsyncButton 
              type="submit" 
              form="student-form" 
              loading={isLoading} 
              disabled={!isValid}
              className="w-full sm:w-auto min-h-12 shadow-none"
              onClick={async () => {
                if (!isValid) {
                  console.log("[StudentModal] Form is invalid. Errors:", errors);
                  await handleSubmit(() => {})();
                  addToast({
                    variant: "error",
                    title: "Error de Validación",
                    message: "Por favor, complete todos los campos obligatorios correctamente.",
                  });
                  scrollToErrorTab();
                }
              }}
            >
              Guardar Cambios
            </AsyncButton>
          ) : editingStudent ? (
            <AsyncButton 
              type="submit" 
              form="student-form" 
              loading={isLoading} 
              disabled={!isDirty && !(inlineAddress.parroquiaId && inlineAddress.streetAddress)}
              className="w-full sm:w-auto min-h-12 shadow-none"
              onClick={async () => {
                if (!isValid) {
                  console.log("[StudentModal] Form is invalid. Errors:", errors);
                  await handleSubmit(() => {})();
                  addToast({
                    variant: "error",
                    title: "Error de Validación",
                    message: "Por favor, complete todos los campos obligatorios correctamente.",
                  });
                  scrollToErrorTab();
                }
              }}
            >
              Actualizar Registro
            </AsyncButton>
          ) : (
            <AsyncButton 
              type="submit" 
              form="student-form" 
              loading={isLoading} 
              disabled={!isValid}
              className="w-full sm:w-auto min-h-12 shadow-none"
              onClick={async () => {
                if (!isValid) {
                  console.log("[StudentModal] Form is invalid. Errors:", errors);
                  await handleSubmit(() => {})();
                  addToast({
                    variant: "error",
                    title: "Error de Validación",
                    message: "Por favor, complete todos los campos obligatorios correctamente.",
                  });
                  scrollToErrorTab();
                }
              }}
            >
              Guardar Estudiante
            </AsyncButton>
          )}
        </div>
      </ModalFooter>
    </Modal>

    <Modal isOpen={isValueModalOpen} onClose={() => setIsValueModalOpen(false)} modalId={`${modalId}-value`}>
      <ModalHeader>
        <div className="w-full">
          <span className="mb-1 font-semibold text-text-primary modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
            {valueModalTitle || "Agregar nuevo valor"}
          </span>
          <p className="text-sm text-text-secondary dark:text-text-tertiary font-normal">
            Este valor se guardará en la lista: {targetListName}.
          </p>
        </div>
      </ModalHeader>
      <ModalBody>
        <div className="space-y-4">
          <label className="text-sm font-medium text-text-primary dark:text-white/90">Nuevo valor</label>
          <Input
            value={newValueInput}
            onChange={(e) => {
              const v = e.target.value;
              if (targetField === "phonePrefix") {
                const digits = v.replace(/\D/g, "").slice(0, 4);
                setNewValueInput(digits);
              } else {
                const up = v.toUpperCase();
                const sanitized = up.replace(/[^A-ZÁÉÍÓÚÑ\s\-]/g, "");
                setNewValueInput(sanitized);
              }
            }}
            placeholder="Ingrese el nuevo valor"
            autoComplete="off"
            maxLength={targetField === "phonePrefix" ? 4 : 40}
          />
          {targetField === "phonePrefix" && (
            <p className="text-xs text-text-tertiary">Solo dígitos (3-4). Ej: 0412, 0212</p>
          )}
        </div>
      </ModalBody>
      <ModalFooter className="shrink-0 px-6 sm:px-12 py-6 bg-white dark:bg-bg-dark border-t border-border-light dark:border-border-dark">
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 w-full">
          <Button variant="outline" onClick={() => setIsValueModalOpen(false)} disabled={savingNewValue} className="w-full sm:w-auto min-h-12">
            Cancelar
          </Button>
          <AsyncButton 
            onClick={handleSaveNewValue} 
            loading={savingNewValue} 
            className="w-full sm:w-auto min-h-12"
            disabled={
              savingNewValue || (
                targetField === "phonePrefix" 
                  ? !(newValueInput && /^\d{3,4}$/.test(newValueInput))
                  : !(newValueInput && newValueInput.trim().length > 0)
              )
            }
          >
            Guardar
          </AsyncButton>
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
            }
            // Crear dirección estructurada (edición o creación)
            if (inlineAddress.parroquiaId && inlineAddress.streetAddress) {
              try {
                let targetPersonId: number | null = null;

                if (editingStudent?.personId) {
                  targetPersonId = Number(editingStudent.personId);
                } else if (
                  pendingSave &&
                  'identificationPrefix' in pendingSave &&
                  'identificationNumber' in pendingSave
                ) {
                  // Estudiante recién creado — obtener personId consultando por CI
                  const ci = `${pendingSave.identificationPrefix}-${pendingSave.identificationNumber}`;
                  const result = await getStudentByCi(ci);
                  if (result?.student?.personId) {
                    targetPersonId = Number(result.student.personId);
                  }
                }

                if (targetPersonId) {
                  await addressService.createAddress({
                    entityType: 'person',
                    entityId: targetPersonId,
                    addressTypeId: inlineAddress.addressTypeId || 3,
                    parroquiaId: inlineAddress.parroquiaId,
                    streetAddress: inlineAddress.streetAddress,
                    reference: inlineAddress.reference,
                    isPrimary: inlineAddress.isPrimary,
                  });
                }
              } catch (addrErr) {
                console.error('[StudentModal] Error creating address:', addrErr);
              }
            }
          } finally {
            setConfirmSaving(false);
            setConfirmSaveOpen(false);
          }
        }}
        isLoading={confirmSaving}
        variant="confirm"
        title={editingStudent ? "Confirmar actualización" : "Confirmar registro"}
        message={editingStudent ? "¿Desea actualizar los datos del estudiante?" : "¿Desea guardar el nuevo estudiante?"}
        confirmLabel={editingStudent ? "Actualizar" : "Guardar"}
      />
    )}

    <UnifiedDialog
      isOpen={showConfirmation}
      onClose={cancelClose}
      onConfirm={confirmClose}
      variant="warning"
      {...SYSTEM_DIALOGS.closeWithoutSaving}
    />
  </>
);
}
