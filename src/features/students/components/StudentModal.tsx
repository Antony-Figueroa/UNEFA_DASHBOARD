import { useEffect, useMemo, useState, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { checkAvailability, getStudentByCi, lookupCi } from "../services/studentsService";
import Input from "../../../components/form/input/InputField";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../../components/ui/modal";
import { 
  CreateStudentPayload,
  UpdateStudentPayload,
  Student 
} from "../types";
import AsyncButton from "../../../components/ui/button/AsyncButton";
import CustomSelect from "../../../components/form/CustomSelect";
import { useUnsavedChanges } from "../../../hooks/useUnsavedChanges";
import { useToast } from "../../../context/toast";
import UnifiedDialog from "../../../components/ui/dialog/UnifiedDialog";
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
  const [pendingSave, setPendingSave] = useState<CreateStudentPayload | UpdateStudentPayload | null>(null);

  // State for display values with formatting
  const [displayIdentificationNumber, setDisplayIdentificationNumber] = useState("");
  const [displayPhoneNumber, setDisplayPhoneNumber] = useState("");
  
  // State for existing record (when duplicate is found)
  const [existingStudent, setExistingStudent] = useState<any | null>(null);
  const [viewOnlyMode, setViewOnlyMode] = useState(false);

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

  // Handle identification number input change with formatting
  const handleIdentificationNumberChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    // Solo permitir números
    const digitsOnly = input.replace(/\D/g, '').substring(0, CEDULA_MAX_DIGITS);
    const formatted = formatCedulaDisplay(digitsOnly, false);
    setDisplayIdentificationNumber(formatted);
    setValue("identificationNumber", digitsOnly, { shouldValidate: true });
    clearErrors("identificationNumber");
    
    // Si se cambia la cédula y hay un existingStudent, limpiar el formulario
    if (existingStudent) {
      const currentStoredDigits = existingStudent.identificationNumber?.replace(/\D/g, '') || '';
      // Si el usuario borró al menos 1 carácter o cambió algo
      if (digitsOnly.length < currentStoredDigits.length || digitsOnly !== currentStoredDigits) {
        setExistingStudent(null);
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

    // Verificar si la cédula existe mientras escribe (7 u 8 dígitos)
    if (!existingStudent && !editingStudent && (digitsOnly.length === 7 || digitsOnly.length === 8)) {
      setIsCheckingCi(true);
      const prefix = watch("identificationPrefix") || 'V';
      const fullCi = `${prefix}-${digitsOnly}`;
      try {
        const result = await getStudentByCi(fullCi);
        if (result?.student) {
          // Estudiante ya existe → modo solo lectura con datos pre-cargados
          const studentData = result.student;
          setExistingStudent(studentData);
          setViewOnlyMode(true);
          
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
          const personData = result.person;
          setValue("identificationPrefix", personData.identificationPrefix || 'V');
          setDisplayIdentificationNumber(formatCedulaDisplay(personData.identificationNumber || ''));
          setValue("identificationNumber", personData.identificationNumber || '');
          setValue("firstName", personData.firstName || "");
          setValue("middleName", personData.middleName || "");
          setValue("lastName", personData.lastName || "");
          setValue("secondLastName", personData.secondLastName || "");
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
        } else {
          // CI no existe en BD → intentar autocompletar desde API externa
          setIsLookingUpCi(true);
          try {
            const externalData = await lookupCi(fullCi);
            if (externalData) {
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
            }
          } catch (extErr) {
            // Si falla la API externa, el usuario llena manualmente — sin drama
            console.warn("[StudentModal] Error en lookup externo:", extErr);
          } finally {
            setIsLookingUpCi(false);
          }
        }
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

  // CI blur handler: check availability when user leaves the CI field
  const handleCiBlur = useCallback(
    async (e: React.FocusEvent<HTMLInputElement>) => {
      if (!existingStudent && !editingStudent) {
        const val = e.target.value;
        const digitsOnly = val.replace(/\D/g, "").substring(0, CEDULA_MAX_DIGITS);
        if (digitsOnly.length >= 6) {
          setIsCheckingCi(true);
          const prefix = watch("identificationPrefix") || "V";
          const fullCi = `${prefix}-${digitsOnly}`;
          try {
            const result = await getStudentByCi(fullCi);
            if (result?.student) {
              // Estudiante ya existe → modo solo lectura con datos pre-cargados
              const studentData = result.student;
              setExistingStudent(studentData);
              setViewOnlyMode(true);

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
            } else {
              // CI no existe en BD → intentar autocompletar desde API externa
              setIsLookingUpCi(true);
              try {
                const externalData = await lookupCi(fullCi);
                if (externalData) {
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
                }
              } catch (extErr) {
                console.warn("[StudentModal] Error en lookup externo:", extErr);
              } finally {
                setIsLookingUpCi(false);
              }
            }
          } catch (err) {
            console.error("Error checking CI availability:", err);
          } finally {
            setIsCheckingCi(false);
          }
        }
      }
    },
    [existingStudent, editingStudent, watch, setValue, setError, clearErrors, addToast],
  );

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

    if (isOpen) {
      loadOptions();
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
      setViewOnlyMode(false);
      
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
          identificationPrefix: (editingStudent.identificationPrefix || "V").toUpperCase(),
          identificationNumber: editingStudent.identificationNumber || "",
          firstName: (editingStudent.firstName || "").toUpperCase(),
          middleName: (editingStudent.middleName || "").toUpperCase(),
          lastName: (editingStudent.lastName || "").toUpperCase(),
          secondLastName: (editingStudent.secondLastName || "").toUpperCase(),
          sex: (editingStudent.sex || "").toUpperCase(),
          birthDate: editingStudent.birthDate || "",
          civilStatus: (editingStudent.civilStatus || "").toUpperCase(),
          phonePrefix: phonePrefix,
          phoneNumber: phoneNumber,
          email: (editingStudent.email || "").toUpperCase(),
          address: (editingStudent.address || "").toUpperCase(),
          studentType: (editingStudent.studentType || "").toUpperCase(),
          militaryRank: (editingStudent.militaryRank || "").toUpperCase(),
          works: (editingStudent.works || "").toUpperCase(),
        });
        setDisplayIdentificationNumber(formatCedulaDisplay(editingStudent.identificationNumber, false));
        setDisplayPhoneNumber(formatPhoneLocalDisplay(phoneNumber));
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
        identificationPrefix: validatedData.identificationPrefix.toUpperCase() as Student["identificationPrefix"],
        identificationNumber: validatedData.identificationNumber,
        firstName: validatedData.firstName.toUpperCase(),
        middleName: validatedData.middleName?.toUpperCase() || "",
        lastName: validatedData.lastName.toUpperCase(),
        secondLastName: validatedData.secondLastName?.toUpperCase() || "",
        sex: validatedData.sex.toUpperCase() as Student["sex"],
        birthDate: validatedData.birthDate,
        civilStatus: validatedData.civilStatus.toUpperCase() as Student["civilStatus"],
        phone: `${validatedData.phonePrefix}${validatedData.phoneNumber}`,
        email: validatedData.email.toUpperCase(),
        address: validatedData.address.toUpperCase(),
        studentType: validatedData.studentType.toUpperCase() as Student["studentType"],
        militaryRank: validatedData.militaryRank.toUpperCase(),
        works: validatedData.works.toUpperCase() as Student["works"],
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
        <form id="student-form" onSubmit={handleSubmit(onSubmit)} className="space-y-8 w-full">
          {existingStudent && viewOnlyMode && (
            <div className="flex items-center space-x-3 p-3 bg-warning-50 dark:bg-warning-500/10 border border-warning-200 dark:border-warning-500/20 rounded-lg mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-warning-700 dark:text-warning-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.492-1.646-1.742-2.98l5.58-9.92zM11 13a1 1 0 10-2 0v-3a1 1 0 112 0v3zm-1-8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium text-warning-700 dark:text-warning-400">
                Registro existente - Click en 'Editar Registro' para modificar
              </span>
            </div>
          )}
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
            editingId={editingStudent?.studentId ?? null}
          />

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
        </form>
      </ModalBody>

      <ModalFooter className="shrink-0 px-6 sm:px-12 py-6 bg-white dark:bg-bg-dark border-t border-border-light dark:border-border-dark">
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 w-full max-w-6xl mx-auto">
          <AsyncButton variant="outline" onClick={handleCloseAttempt} disabled={isLoading} className="w-full sm:w-auto min-h-12">
            Cancelar
          </AsyncButton>
          {existingStudent ? (
            viewOnlyMode ? (
            <AsyncButton 
              type="button"
              className="w-full sm:w-auto min-h-12 bg-warning-500 hover:bg-warning-600 text-white"
              onClick={() => {
                if (onEditExisting) {
                  onEditExisting(existingStudent);
                } else {
                  setViewOnlyMode(false);
                }
              }}
            >
              Editar Registro
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
                }
              }}
            >
              Guardar Cambios
            </AsyncButton>
            )
          ) : editingStudent ? (
            <AsyncButton 
              type="submit" 
              form="student-form" 
              loading={isLoading} 
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
          <AsyncButton variant="outline" onClick={() => setIsValueModalOpen(false)} disabled={savingNewValue} className="w-full sm:w-auto min-h-12">
            Cancelar
          </AsyncButton>
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
        onClose={() => setConfirmSaveOpen(false)}
        onConfirm={async () => {
          if (pendingSave) {
            await onSave(pendingSave);
          }
          setConfirmSaveOpen(false);
        }}
        variant="confirm"
        title={editingStudent ? "Confirmar actualización" : "Confirmar registro"}
        message={editingStudent ? "¿Desea actualizar los datos del estudiante?" : "¿Desea guardar el nuevo estudiante?"}
        confirmLabel={editingStudent ? "Actualizar" : "Guardar"}
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
  </>
);
}
