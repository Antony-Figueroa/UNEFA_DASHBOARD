import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import apiClient from "../../../api/apiClient";
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

import CustomSelect from "../../../components/form/CustomSelect";
import { useUnsavedChanges } from "../../../hooks/useUnsavedChanges";
import { useToast } from "../../../context/toast";
import UnifiedDialog from "../../../components/ui/dialog/UnifiedDialog";
import { MODAL_CONFIG, SYSTEM_DIALOGS } from "../../../components/ui/dialog/DialogConfig";
import { useLists } from "../../lists/hooks/useLists";
import { List, ListValue } from "../../lists/types";
import * as listsService from "../../lists/services/listsService";
import { isProtectedList, PROTECTED_LIST_MESSAGE } from "../../../constants/systemLists";
import { 
  studentSchema, 
  StudentFormInput,
  StudentFormOutput
} from "../constants/validation";
import { formatCedulaDisplay, formatPhoneLocalDisplay, CEDULA_MAX_LENGTH, CEDULA_MAX_DIGITS, PASSPORT_MAX_LENGTH } from "../../../utils/inputFormat";
import { Search } from "lucide-react";
import { PREFIX_OPTIONS } from "../../persons/types";
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
  const tabsState = useTabs({ defaultTab: 'identificacion' });
  useEffect(() => { if (isOpen) tabsState.setActiveTab('identificacion'); }, [isOpen]);

  // State for existing record (when duplicate is found)
  const [existingStudent, setExistingStudent] = useState<any | null>(null);
  const [existingPerson, setExistingPerson] = useState<any>(false);
  const [viewOnlyMode, setViewOnlyMode] = useState(false);
  // State for API-loaded data flow (SENIAT)
  const [apiDataLoaded, setApiDataLoaded] = useState(false);
  const apiLoadedCiRef = useRef("");
  const { config: academicConfig } = useAcademicConfig();
  const [geoOptions, setGeoOptions] = useState<GeoOptionsItem[]>([]);
  const [inlineAddress, setInlineAddress] = useState<GeographicAddressValue>({
    parroquiaId: null, streetAddress: '', reference: '', addressTypeId: 3, isPrimary: true,
  });
  const [addressRefreshKey, setAddressRefreshKey] = useState(0);

  const loadPrimaryAddress = useCallback(async (personId: number | string) => {
    try {
      const res = await addressService.getPersonAddresses(personId);
      const addrs = res.data as any[];
      if (addrs && addrs.length > 0) {
        // Buscar la dirección primaria (isPrimary), sino la primera con address_type_id 3, sino la primera
        const primary = addrs.find(a => a.is_primary)
          ?? addrs.find(a => a.address_type?.address_type_id === 3)
          ?? addrs[0];
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
    } catch { /* silent */ }
  }, []);

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

  const ciDisabled = !!editingStudent?.studentId;
  const currentPrefix = watch("identificationPrefix") || "V";
  const isPassport = currentPrefix === "P";
  const isFieldDisabled = useCallback((fieldName: string) => {
    if (viewOnlyMode) return true;
    return false;
  }, [viewOnlyMode]);
  const isFieldValid = useCallback((fieldName: string) =>
    !!(touchedFields as any)[fieldName] && !(errors as any)[fieldName],
    [touchedFields, errors]);

  const TAB_IDS = ['identificacion', 'perfil-contacto', 'residencia', 'datos-academicos'] as const;
  const TAB_FIELDS: Record<string, string[]> = {
    'identificacion': ['identificationPrefix', 'identificationNumber', 'firstName', 'middleName', 'lastName', 'secondLastName'],
    'perfil-contacto': ['sex', 'birthDate', 'civilStatus', 'phonePrefix', 'phoneNumber', 'email'],
    'residencia': [],
    'datos-academicos': ['studentType', 'militaryRank', 'works'],
  };
  const errorsByTab = useMemo(() => {
    const keys = Object.keys(errors);
    const counts: Record<string, number> = {};
    for (const tab of TAB_IDS) counts[tab] = keys.filter(k => TAB_FIELDS[tab].includes(k)).length;
    return counts;
  }, [errors]);
  const scrollToFirstError = useCallback(() => {
    const firstTab = TAB_IDS.find(tab => TAB_FIELDS[tab].some(f => (errors as Record<string, any>)[f]));
    if (firstTab) {
      tabsState.setActiveTab(firstTab);
      // Esperar a que el tab se renderice y enfocar el primer campo con error
      requestAnimationFrame(() => {
        const firstErrorEl = document.querySelector<HTMLElement>('[aria-invalid="true"]');
        firstErrorEl?.focus();
      });
    }
  }, [errors]);

  // Handle identification number input change with formatting
  const handleIdentificationNumberChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const prefix = watch("identificationPrefix") || "V";
    const isPassport = prefix === "P";
    
    let cleanedValue = "";
    if (isPassport) {
      // Pasaporte: alfanumérico, mayúsculas, máx PASSPORT_MAX_LENGTH
      const cleaned = input.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, PASSPORT_MAX_LENGTH);
      const formatted = formatCedulaDisplay(cleaned, false);
      setDisplayIdentificationNumber(formatted);
      setValue("identificationNumber", cleaned, { shouldValidate: true });
      cleanedValue = cleaned;
    } else {
      // Cédula: solo dígitos, máx CEDULA_MAX_DIGITS
      const digitsOnly = input.replace(/\D/g, '').substring(0, CEDULA_MAX_DIGITS);
      const formatted = formatCedulaDisplay(digitsOnly, false);
      setDisplayIdentificationNumber(formatted);
      setValue("identificationNumber", digitsOnly, { shouldValidate: true });
      cleanedValue = digitsOnly;
    }
    clearErrors("identificationNumber");
    
    // Si se cambia la cédula tras una carga de API externa, limpiar el formulario
    if (apiDataLoaded) {
      const currentCi = `${prefix}-${cleanedValue}`;
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
      const currentStoredValue = existingStudent
        ? existingStudent.identificationNumber || ''
        : '';
      // Si el usuario borró al menos 1 carácter o cambió algo
      if (cleanedValue.length < currentStoredValue.length || cleanedValue !== currentStoredValue || !existingStudent) {
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

    // Verificar si la cédula existe en BD local mientras escribe (7 u 8 dígitos para CID, similar para pasaporte)
    if (!existingStudent && !existingPerson && !editingStudent && (cleanedValue.length === 7 || cleanedValue.length === 8)) {
      setIsCheckingCi(true);
      const fullCi = `${prefix}-${cleanedValue}`;
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
          loadPrimaryAddress(editingStudent.personId);
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
      // Si existe como estudiante O se está editando → modo UPDATE con studentId
      const targetStudentId = existingStudent?.studentId || editingStudent?.studentId;
      if (targetStudentId) {
        setPendingSave({ ...(studentData as any), studentId: targetStudentId } as UpdateStudentPayload);
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
              {MODAL_CONFIG.titleByMode(!!editingStudent, 'Estudiante')}
            </span>
            <p className="text-sm text-text-secondary dark:text-text-tertiary font-normal">
              {MODAL_CONFIG.descriptionByMode(!!editingStudent, 'estudiante')}
            </p>
          </div>
        </ModalHeader>

      <ModalBody className="bg-bg-secondary/30 dark:bg-bg-dark/50">
        <form id="student-form" onSubmit={handleSubmit(onSubmit, scrollToFirstError)} className="space-y-8 w-full">
{existingStudent && (
            <div className="flex items-center space-x-3 p-3 bg-warning-50 dark:bg-warning-500/10 border border-warning-200 dark:border-warning-500/20 rounded-lg mb-4">
              <svg className="h-5 w-5 text-warning-700 dark:text-warning-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.492-1.646-1.742-2.98l5.58-9.92zM11 13a1 1 0 10-2 0v-3a1 1 0 112 0v3zm-1-8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium text-warning-700 dark:text-warning-400">
                Ya existe como estudiante — datos cargados. Guardar actualizará el registro.
              </span>
            </div>
          )}
          
          <Tabs
            options={[
              { id: 'identificacion', label: 'Identificación', errorCount: errorsByTab['identificacion'] },
              { id: 'perfil-contacto', label: 'Perfil y Contacto', errorCount: errorsByTab['perfil-contacto'] },
              { id: 'residencia', label: 'Residencia', errorCount: errorsByTab['residencia'] },
              { id: 'datos-academicos', label: 'Datos Académicos', errorCount: errorsByTab['datos-academicos'] },
            ]}
            {...tabsState.tabProps}
            variant="modal"
            className="mb-6"
            onTabChange={tabsState.setActiveTab}
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
                  <button
                    type="button"
                    onClick={() => setExistingPerson(false)}
                    className="text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400"
                  >
                    Continuar editando
                  </button>
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
                          success={isFieldValid('identificationPrefix')}
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
                      placeholder={isPassport ? "ABC123456" : "V-12.345.678"}
                      disabled={ciDisabled}
                      maxLength={isPassport ? PASSPORT_MAX_LENGTH : CEDULA_MAX_LENGTH}
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
                    {!ciDisabled && !isPassport && (
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
                  onChange={createNameHandler("firstName")}
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
                  onChange={createNameHandler("middleName")}
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
                  onChange={createNameHandler("lastName")}
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
                  onChange={createNameHandler("secondLastName")}
                  placeholder="Segundo apellido (opcional)"
                  disabled={isFieldDisabled("secondLastName")}
                  error={!!errors.secondLastName}
                  success={isFieldValid('secondLastName')}
                  hint={errors.secondLastName?.message as string}
                />
              </div>
            </div>
          </div>

          {/* ======================== Perfil y Contacto ======================== */}
          <div hidden={tabsState.activeTab !== 'perfil-contacto'} role="tabpanel">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Fecha de Nacimiento */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Fecha de Nacimiento{' '}
                  {age !== null && age !== undefined && (
                    <span className="text-brand-500 ml-1">({age} años)</span>
                  )}
                  <span className="text-red-500">*</span>
                </label>
                <Controller
                  name="birthDate"
                  control={control}
                  render={({ field }) => {
                    const valid = isFieldValid('birthDate');
                    return (
                      <input
                        type="date"
                        id="birthDate"
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value)}
                        onBlur={field.onBlur}
                        className={`h-11 w-full rounded-lg border bg-transparent px-4 py-2.5 text-sm transition-all ${
                          errors.birthDate
                            ? "border-error-500 focus:border-error-500 text-error-500"
                            : valid
                              ? "border-success-500 focus:border-success-300 focus:ring-success-500/20 text-text-primary"
                              : "border-border-medium focus:border-brand-300 focus:ring-brand-500/10 text-text-primary"
                        } dark:bg-bg-dark dark:text-text-emphasis dark:border-border-dark dark:focus:border-brand-800 ${
                          viewOnlyMode ? "cursor-not-allowed bg-bg-secondary opacity-50" : ""
                        }`}
                        max={maxDate ? maxDate.toISOString().split("T")[0] : undefined}
                        disabled={viewOnlyMode}
                      />
                    );
                  }}
                />
                {errors.birthDate && (
                  <p className="mt-1 text-xs text-red-500">{errors.birthDate.message as string}</p>
                )}
              </div>

              {/* Sexo */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Sexo <span className="text-red-500">*</span>
                </label>
                <Controller
                  name="sex"
                  control={control}
                  render={({ field }) => (
                    <CustomSelect
                      id="sex"
                      options={(options["Sexo"] || []).map(o => ({ value: String(o.value), label: o.label }))}
                      placeholder="Seleccionar"
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      value={String(field.value || "")}
                      disabled={viewOnlyMode}
                      error={!!errors.sex}
                      success={isFieldValid('sex')}
                    />
                  )}
                />
                {errors.sex && (
                  <p className="mt-1 text-xs text-red-500">{errors.sex.message as string}</p>
                )}
              </div>

              {/* Estado Civil */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                  Estado Civil <span className="text-red-500">*</span>
                </label>
                <Controller
                  name="civilStatus"
                  control={control}
                  render={({ field }) => (
                    <CustomSelect
                      id="civilStatus"
                      options={(options["Registro Civil"] || []).map(o => ({ value: String(o.value), label: o.label }))}
                      placeholder="Seleccionar"
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      value={String(field.value || "")}
                      disabled={viewOnlyMode}
                      error={!!errors.civilStatus}
                      success={isFieldValid('civilStatus')}
                      onAddNew={openAddValueModal ? () => openAddValueModal("Registro Civil", "civilStatus", "Agregar Estado Civil") : undefined}
                      addNewLabel="Agregar Estado Civil"
                    />
                  )}
                />
                {errors.civilStatus && (
                  <p className="mt-1 text-xs text-red-500">{errors.civilStatus.message as string}</p>
                )}
              </div>

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
                          success={isFieldValid('phonePrefix')}
                          onAddNew={openAddValueModal ? () => openAddValueModal("PREFIJO", "phonePrefix", "Agregar Prefijo Telefónico") : undefined}
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

              {/* Email (col-span-2) */}
              <div className="md:col-span-2">
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
            </div>
          </div>

          {/* ======================== Residencia ======================== */}
          <div hidden={tabsState.activeTab !== 'residencia'} role="tabpanel">
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
              <h3 className="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Dirección de Residencia</h3>
              <GeographicAddressFields
                geoOptions={geoOptions}
                value={inlineAddress}
                onChange={setInlineAddress}
                showReference
              />
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 mt-6">
              <AddressList
                key={addressRefreshKey}
                entityType="person"
                entityId={editingStudent?.personId ? Number(editingStudent.personId) : existingStudent?.personId ? Number(existingStudent.personId) : null}
                geoOptions={geoOptions}
                onAddressesChange={() => {
                  if (editingStudent?.personId) loadPrimaryAddress(editingStudent.personId);
                }}
              />
            </div>
          </div>

          {/* ======================== Datos Académicos ======================== */}
          <div hidden={tabsState.activeTab !== 'datos-academicos'} role="tabpanel">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      success={isFieldValid('studentType')}
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
                      success={isFieldValid('works')}
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

              {/* Rango Militar (solo si es MILITAR) */}
              {studentType === "MILITAR" && (
                <div className="md:col-span-2">
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
                          success={isFieldValid('militaryRank')}
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
            </div>
          </div>

        </form>
      </ModalBody>

      <ModalFooter className="shrink-0 px-6 sm:px-12 py-6 bg-white dark:bg-bg-dark border-t border-border-light dark:border-border-dark sticky-footer">
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 w-full max-w-6xl mx-auto">
          <Button variant="outline" onClick={handleCloseAttempt} disabled={isLoading} className="w-full sm:w-auto min-h-12">
            Cancelar
          </Button>
          {existingStudent ? (
            <Button 
              type="submit" 
              form="student-form" 
              loading={isLoading} 
              loadingText="Guardando..."
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
                  scrollToFirstError();
                }
              }}
            >
              Guardar Cambios
            </Button>
          ) : editingStudent ? (
            <Button 
              type="submit" 
              form="student-form" 
              loading={isLoading} 
              loadingText="Guardando..."
              disabled={!isDirty}
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
                  scrollToFirstError();
                }
              }}
            >
              Guardar Cambios
            </Button>
          ) : (
            <Button 
              type="submit" 
              form="student-form" 
              loading={isLoading} 
              loadingText="Guardando..."
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
                  scrollToFirstError();
                }
              }}
            >
              Guardar Estudiante
            </Button>
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
          <Button 
            onClick={handleSaveNewValue} 
            loading={savingNewValue} 
            loadingText="Guardando..."
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
          </Button>
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
            // Guardar dirección inline: UPSERT en vez de siempre crear
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
                  const existingRes = await addressService.getPersonAddresses(targetPersonId);
                  const existingAddrs = existingRes.data as any[];
                  const existingPrimary = existingAddrs?.find(a => a.is_primary)
                    ?? existingAddrs?.find(a => a.address_type?.address_type_id === 3)
                    ?? existingAddrs?.[0];

                  if (existingPrimary) {
                    // Ya tiene dirección — ver si cambió algo
                    const addr = existingPrimary.address;
                    const sameParroquia = addr?.parroquia?.parroquia_id === inlineAddress.parroquiaId;
                    const sameStreet = addr?.street_address === inlineAddress.streetAddress;
                    if (!sameParroquia || !sameStreet) {
                      // Actualizar dirección existente (t_address)
                      await apiClient.put(`/address/${existingPrimary.person_address_id}`, {
                        parroquia_id: inlineAddress.parroquiaId,
                        street_address: inlineAddress.streetAddress,
                        reference: inlineAddress.reference || '',
                        address_type_id: inlineAddress.addressTypeId || 3,
                        entity_type: 'person',
                        entity_id: targetPersonId,
                      });
                      addToast({
                        variant: "success",
                        title: "Dirección actualizada",
                        message: "La dirección de residencia se actualizó correctamente.",
                      });
                    }
                    // Si es igual → skip, no duplicar
                  } else {
                    // No tiene dirección — crear nueva
                    await addressService.createAddress({
                      entityType: 'person',
                      entityId: targetPersonId,
                      addressTypeId: inlineAddress.addressTypeId || 3,
                      parroquiaId: inlineAddress.parroquiaId,
                      streetAddress: inlineAddress.streetAddress,
                      reference: inlineAddress.reference,
                      isPrimary: inlineAddress.isPrimary,
                    });
                    addToast({
                      variant: "success",
                      title: "Dirección guardada",
                      message: "La dirección de residencia se registró correctamente.",
                    });
                  }
                  // Refrescar AddressList y recargar GeographicAddressFields
                  setAddressRefreshKey(k => k + 1);
                  loadPrimaryAddress(targetPersonId);
                }
              } catch (addrErr) {
                console.error('[StudentModal] Error saving address:', addrErr);
                addToast({
                  variant: "error",
                  title: "Error al guardar dirección",
                  message: "No se pudo guardar la dirección de residencia.",
                });
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
        message={editingStudent ? "¿Desea actualizar los datos del estudiante?" : "¿Desea registrar el nuevo estudiante?"}
        confirmLabel={MODAL_CONFIG.confirmLabel(!!editingStudent)}
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
