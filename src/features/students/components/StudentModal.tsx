import { useEffect, useMemo, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { checkAvailability, getStudentByCi } from "../services/studentsService";
import Input from "../../../components/form/input/InputField";
import TextArea from "../../../components/form/input/TextArea";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../../components/ui/modal";
import { 
  CreateStudentPayload,
  UpdateStudentPayload,
  Student 
} from "../types";
import AsyncButton from "../../../components/ui/button/AsyncButton";
import CustomSelect from "../../../components/form/CustomSelect";
import Badge from "../../../components/ui/badge/Badge";
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
import { formatCedulaDisplay, formatPhoneDisplay, formatPhoneLocalDisplay, cleanPhone, CEDULA_MAX_LENGTH, CEDULA_MAX_DIGITS } from "../../../utils/inputFormat";

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
  /** Opciones de carreras para el selector */
  careerOptions: { value: string | number; label: string }[];
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
 *   careerOptions={careers}
 * />
 * ```
 */
export default function StudentModal({
  isOpen,
  onClose,
  onSave,
  editingStudent,
  careerOptions,
  dynamicLists,
  isLoading = false,
  modalId,
  onEditExisting,
}: StudentModalProps) {
  const [isCheckingCi, setIsCheckingCi] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
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

  // Handle identification number input change with formatting
  const handleIdentificationNumberChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    // Solo permitir números
    const digitsOnly = input.replace(/\D/g, '').substring(0, CEDULA_MAX_DIGITS);
    const formatted = formatCedulaDisplay(digitsOnly, false);
    setDisplayIdentificationNumber(formatted);
    setValue("identificationNumber", digitsOnly, { shouldValidate: true });
    
    // Si se cambia la cédula y hay un existingStudent, limpiar el formulario
    if (existingStudent) {
      const currentStoredDigits = existingStudent.identificationNumber?.replace(/\D/g, '') || '';
      // Si el usuario borró al menos 1 carácter o cambió algo
      if (digitsOnly.length < currentStoredDigits.length || digitsOnly !== currentStoredDigits) {
        setExistingStudent(null);
        setViewOnlyMode(false);
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
          careerId: "",
          semester: "",
          section: "",
          regime: "",
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
        const editingId = editingStudent ? (editingStudent as any).studentId : undefined;
        const res = await checkAvailability('ci', fullCi, editingId);
        if (!res.available) {
          const existingStudentData = await getStudentByCi(fullCi);
          if (existingStudentData) {
            setExistingStudent(existingStudentData);
            setViewOnlyMode(true);
            
            // Parse phone number into prefix and local
            let phonePrefix = "";
            let phoneNumber = "";
            if (existingStudentData.phone) {
              const cleanPhone = existingStudentData.phone.replace(/[-\s]/g, '');
              if (cleanPhone.length >= 4) {
                phonePrefix = cleanPhone.substring(0, 4);
                phoneNumber = cleanPhone.substring(4);
              }
            }

            setValue("identificationPrefix", existingStudentData.identificationPrefix || 'V');
            setDisplayIdentificationNumber(formatCedulaDisplay(existingStudentData.identificationNumber || ''));
            setValue("identificationNumber", existingStudentData.identificationNumber || '');
            setValue("firstName", existingStudentData.firstName || "");
            setValue("middleName", existingStudentData.middleName || "");
            setValue("lastName", existingStudentData.lastName || "");
            setValue("secondLastName", existingStudentData.secondLastName || "");
            setValue("sex", existingStudentData.sex || "");
            setValue("birthDate", existingStudentData.birthDate || "");
            setValue("civilStatus", existingStudentData.civilStatus || "");
            setValue("phonePrefix", phonePrefix);
                                setDisplayPhoneNumber(formatPhoneLocalDisplay(phoneNumber));
            setValue("phoneNumber", phoneNumber);
            setValue("email", existingStudentData.email || "");
            setValue("address", existingStudentData.address || "");
            setValue("careerId", existingStudentData.careerId || "");
            setValue("semester", existingStudentData.semester || "");
            setValue("section", existingStudentData.section || "");
            setValue("regime", existingStudentData.regime || "");
            setValue("studentType", existingStudentData.studentType || "");
            setValue("militaryRank", existingStudentData.militaryRank || "");
            setValue("works", existingStudentData.works || "");
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

  const NATIONALITY_OPTIONS = options["Nacionalidad"] || [
    { value: "V", label: "V" },
    { value: "E", label: "E" },
  ];

  const SEX_OPTIONS = options["Sexo"] || [
    { value: "FEMENINO", label: "FEMENINO" },
    { value: "MASCULINO", label: "MASCULINO" },
  ];

  const CIVIL_STATUS_OPTIONS = options["Registro Civil"] || [
    { value: "SOLTERO/A", label: "SOLTERO/A" },
    { value: "CASADO/A", label: "CASADO/A" },
    { value: "DIVORCIADO/A", label: "DIVORCIADO/A" },
    { value: "VIUDO/A", label: "VIUDO/A" },
  ];

  const VENEZUELA_PHONE_PREFIXES = options.PREFIJO || [];

  const REGIME_OPTIONS = options["Regimen/Turno"] || [
    { value: "DIURNO", label: "DIURNO" },
    { value: "NOCTURNO", label: "NOCTURNO" },
  ];

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
      careerId: "",
      semester: "",
      section: "",
      regime: "",
      studentType: "",
      militaryRank: "",
      works: "",
    },
  });

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
  const [targetField, setTargetField] = useState<"civilStatus" | "phonePrefix" | "regime" | "militaryRank">("civilStatus");
  const [newValueInput, setNewValueInput] = useState<string>("");
  const [savingNewValue, setSavingNewValue] = useState(false);

  useEffect(() => {
    const handleSetCareerId = (e: Event) => {
      const id = (e as CustomEvent).detail;
      if (id !== undefined && id !== null) {
        setValue("careerId", String(id), { shouldValidate: true, shouldDirty: true });
      }
    };
    window.addEventListener("students:setCareerId", handleSetCareerId as EventListener);
    return () => {
      window.removeEventListener("students:setCareerId", handleSetCareerId as EventListener);
    };
  }, [setValue]);

  const openAddValueModal = (listName: string, field: "civilStatus" | "phonePrefix" | "regime" | "militaryRank", title: string, preset: string = "") => {
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
        setValue(targetField, selectValue, { shouldValidate: true, shouldDirty: true });
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
      setValue(targetField, mapped.value, { shouldValidate: true, shouldDirty: true });
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
          careerId: String(editingStudent.careerId || ""),
          semester: editingStudent.semester || "",
          section: editingStudent.section || "",
          regime: (editingStudent.regime || "").toUpperCase(),
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
          careerId: "",
          semester: "",
          section: "",
          regime: "",
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
        careerId: String(validatedData.careerId),
        semester: validatedData.semester,
        section: validatedData.section,
        regime: validatedData.regime.toUpperCase() as Student["regime"],
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
            {/* Fila 1 */}
            <div>
              <label htmlFor="identificationPrefix" className="mb-2.5 block text-black dark:text-white font-medium text-sm">Cédula *</label>
              <div className="flex gap-2">
                <div className="w-24">
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
                        disabled={!!editingStudent}
                        error={!!errors.identificationPrefix}
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
                    hint={errors.identificationNumber?.message || (isCheckingCi ? <span className="text-blue-600 animate-pulse">Verificando...</span> : undefined)}
                    disabled={!!editingStudent}
                    maxLength={CEDULA_MAX_LENGTH}
                    autoComplete="off"
                    className="tracking-widest"
                    onBlur={async (e) => {
                      // Only check if not in existing student mode and not already checking
                      if (!existingStudent && !editingStudent) {
                        const val = e.target.value;
                        const digitsOnly = val.replace(/\D/g, '').substring(0, CEDULA_MAX_DIGITS);
                        if (digitsOnly.length >= 6) {
                          setIsCheckingCi(true);
                          const prefix = watch("identificationPrefix") || 'V';
                          const fullCi = `${prefix}-${digitsOnly}`;
                          try {
                            const res = await checkAvailability('ci', fullCi, undefined);
                            if (!res.available) {
                              // Fetch existing student data and populate form
                              const existingStudentData = await getStudentByCi(fullCi);
                              if (existingStudentData) {
                                setExistingStudent(existingStudentData);
                                setViewOnlyMode(true);
                                
                                // Parse phone number into prefix and local
                                let phonePrefix = "";
                                let phoneNumber = "";
                                if (existingStudentData.phone) {
                                  const cleanPhone = existingStudentData.phone.replace(/[-\s]/g, '');
                                  if (cleanPhone.length >= 4) {
                                    phonePrefix = cleanPhone.substring(0, 4);
                                    phoneNumber = cleanPhone.substring(4);
                                  }
                                }

                                setValue("identificationPrefix", existingStudentData.identificationPrefix || 'V');
                                setDisplayIdentificationNumber(formatCedulaDisplay(existingStudentData.identificationNumber || ''));
                                setValue("identificationNumber", existingStudentData.identificationNumber || '');
                                setValue("firstName", existingStudentData.firstName || "");
                                setValue("middleName", existingStudentData.middleName || "");
                                setValue("lastName", existingStudentData.lastName || "");
                                setValue("secondLastName", existingStudentData.secondLastName || "");
                                setValue("sex", existingStudentData.sex || "");
                                setValue("birthDate", existingStudentData.birthDate || "");
                                setValue("civilStatus", existingStudentData.civilStatus || "");
                                setValue("phonePrefix", phonePrefix);
            setDisplayPhoneNumber(formatPhoneLocalDisplay(phoneNumber));
                                setValue("phoneNumber", phoneNumber);
                                setValue("email", existingStudentData.email || "");
                                setValue("address", existingStudentData.address || "");
                                setValue("careerId", existingStudentData.careerId || "");
                                setValue("semester", existingStudentData.semester || "");
                                setValue("section", existingStudentData.section || "");
                                setValue("regime", existingStudentData.regime || "");
                                setValue("studentType", existingStudentData.studentType || "");
                                setValue("militaryRank", existingStudentData.militaryRank || "");
                                setValue("works", existingStudentData.works || "");
                              }
                            }
                          } catch (err) {
                            console.error("Error checking CI availability:", err);
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
            <div>
              <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Primer Nombre *</label>
              <Input
                {...register("firstName")}
                placeholder="Primer nombre"
                error={!!errors.firstName}
                hint={errors.firstName?.message}
                disabled={viewOnlyMode}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s']/g, '').toUpperCase();
                  setValue("firstName", val, { shouldValidate: true, shouldDirty: true });
                }}
              />
            </div>
            <div>
              <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Segundo Nombre</label>
              <Input
                {...register("middleName")}
                placeholder="Segundo nombre"
                error={!!errors.middleName}
                hint={errors.middleName?.message}
                disabled={viewOnlyMode}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s']/g, '').toUpperCase();
                  setValue("middleName", val, { shouldValidate: true, shouldDirty: true });
                }}
              />
            </div>

            {/* Fila 2 */}
            <div>
              <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Primer Apellido *</label>
              <Input
                {...register("lastName")}
                placeholder="Primer apellido"
                error={!!errors.lastName}
                hint={errors.lastName?.message}
                disabled={viewOnlyMode}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s']/g, '').toUpperCase();
                  setValue("lastName", val, { shouldValidate: true, shouldDirty: true });
                }}
              />
            </div>
            <div>
              <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Segundo Apellido</label>
              <Input
                {...register("secondLastName")}
                placeholder="Segundo apellido"
                error={!!errors.secondLastName}
                hint={errors.secondLastName?.message}
                disabled={viewOnlyMode}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s']/g, '').toUpperCase();
                  setValue("secondLastName", val, { shouldValidate: true, shouldDirty: true });
                }}
              />
            </div>
            <div>
              <label htmlFor="sex" className="mb-2.5 block text-black dark:text-white font-medium text-sm">Sexo *</label>
              <Controller
                name="sex"
                control={control}
                render={({ field }) => (
                  <CustomSelect
                    id="sex"
                    options={SEX_OPTIONS.map(opt => ({ value: String(opt.value), label: opt.label }))}
                    placeholder="Seleccione Sexo"
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    value={String(field.value)}
                    disabled={viewOnlyMode}
                    error={!!errors.sex}
                  />
                )}
              />
              {errors.sex && (
                <p className="mt-1 text-xs text-error-500 flex items-center gap-1">
                  <span className="inline-block w-1 h-1 bg-error-500 rounded-full"></span>
                  {errors.sex.message}
                </p>
              )}
            </div>

            {/* Fila 3 */}
            <div>
<label className="mb-2.5 block text-black dark:text-white font-medium text-sm">
                Fecha de Nacimiento * {age !== null && <span className="text-brand-500 ml-1">({age} años)</span>}
              </label>
                <Controller
                control={control}
                name="birthDate"
                render={({ field }) => (
                  <input
                    type="date"
                    id="birthDate"
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    onBlur={field.onBlur}
                    className={`h-11 w-full rounded-lg border bg-transparent px-4 py-2.5 text-sm transition-all ${
                      errors.birthDate 
                        ? 'border-error-500 focus:border-error-500 text-error-500' 
                        : 'border-border-medium focus:border-brand-300 focus:ring-brand-500/10 text-text-primary'
                    } dark:bg-bg-dark dark:text-text-emphasis dark:border-border-dark dark:focus:border-brand-800 ${viewOnlyMode ? 'opacity-50 cursor-not-allowed bg-bg-secondary' : ''}`}
                    max={maxDate ? maxDate.toISOString().split('T')[0] : undefined}
                    disabled={viewOnlyMode}
                  />
                )}
              />
              {errors.birthDate && (
                <p className="mt-1 text-xs text-error-500 flex items-center gap-1">
                  <span className="inline-block w-1 h-1 bg-error-500 rounded-full"></span>
                  {errors.birthDate.message}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="civilStatus" className="mb-2.5 block text-black dark:text-white font-medium text-sm">Estado Civil *</label>
              <Controller
                name="civilStatus"
                control={control}
                render={({ field }) => (
                  <CustomSelect
                    id="civilStatus"
                    options={CIVIL_STATUS_OPTIONS.map(opt => ({ value: String(opt.value), label: opt.label }))}
                    placeholder="Seleccione Estado Civil"
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    value={String(field.value)}
                    onAddNew={() => openAddValueModal("Registro Civil", "civilStatus", "Agregar Estado Civil")}
                    addNewLabel="Agregar Estado Civil"
                    disabled={viewOnlyMode}
                    error={!!errors.civilStatus}
                  />
                )}
              />
              {errors.civilStatus && (
                <p className="mt-1 text-xs text-error-500 flex items-center gap-1">
                  <span className="inline-block w-1 h-1 bg-error-500 rounded-full"></span>
                  {errors.civilStatus.message}
                </p>
              )}
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
                        options={VENEZUELA_PHONE_PREFIXES}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        value={field.value}
                        placeholder="Prefijo"
                    onAddNew={() => openAddValueModal("PREFIJO", "phonePrefix", "Agregar Prefijo Telefónico")}
                    addNewLabel="Agregar Prefijo"
                        error={!!errors.phonePrefix}
                        disabled={viewOnlyMode}
                      />
                    )}
                  />
                </div>
<div className="flex-1">
                  <Input
                    value={displayPhoneNumber}
                    onChange={handlePhoneNumberChange}
                    placeholder="123-4567"
                    error={!!errors.phoneNumber}
                    disabled={viewOnlyMode}
                    maxLength={8}
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

            {/* Fila 4 */}
            <div className="md:col-span-2">
              <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Correo Electrónico *</label>
              <Input
                {...register("email")}
                type="email"
                placeholder="Ingresa correo electrónico"
                error={!!errors.email}
                hint={isCheckingEmail ? "Verificando disponibilidad..." : (errors.email?.message || " ")}
                disabled={viewOnlyMode}
                autoComplete="off"
                onChange={(e) => {
                  setValue("email", e.target.value.toUpperCase(), { shouldValidate: true, shouldDirty: true });
                }}
                onBlur={async (e) => {
                  const value = e.target.value;
                  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                  if (value && emailRegex.test(value)) {
                    setIsCheckingEmail(true);
                    try {
                      const res = await checkAvailability('email', value, editingStudent?.studentId);
                      if (!res.available) {
                        setError("email", { 
                          type: "manual", 
                          message: res.status === 0 
                            ? "Email registrado (INACTIVO). Contacte a administración para reactivar." 
                            : "Este correo electrónico ya está registrado." 
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
                  register("email").onBlur(e);
                }}
              />
            </div>

            {/* Fila 5 Académica */}
            <div>
              <label htmlFor="careerId" className="mb-2.5 block text-black dark:text-white font-medium text-sm">Carrera *</label>
              <Controller
                name="careerId"
                control={control}
                render={({ field }) => (
                  <CustomSelect
                    id="careerId"
                    options={careerOptions.map((opt) => ({ value: String(opt.value), label: opt.label.toUpperCase() }))}
                    placeholder="Seleccione Carrera"
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    value={String(field.value)}
                    disabled={isLoading || (!!editingStudent && editingStudent.isInUse) || viewOnlyMode}
                    onAddNew={() => {
                      const evt = new CustomEvent("students:addCareer");
                      window.dispatchEvent(evt);
                    }}
                    addNewLabel="Agregar Carrera"
                    error={!!errors.careerId}
                  />
                )}
              />
              {errors.careerId && (
                <p className="mt-1 text-xs text-error-500 flex items-center gap-1">
                  <span className="inline-block w-1 h-1 bg-error-500 rounded-full"></span>
                  {errors.careerId.message}
                </p>
              )}
              {editingStudent?.isInUse && (
                <p className="mt-1 text-[11px] text-amber-600 dark:text-amber-400">
                  Campo bloqueado: El estudiante tiene registros de pre-inscripción activos.
                </p>
              )}
            </div>
            <div>
              <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Semestre *</label>
              <Input
                {...register("semester")}
                placeholder="Semestre"
                error={!!errors.semester}
                hint={errors.semester?.message}
                disabled={viewOnlyMode}
                maxLength={2}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').substring(0, 2);
                  setValue("semester", val, { shouldValidate: true, shouldDirty: true });
                }}
              />
            </div>
            <div>
              <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Sección *</label>
              <Input
                {...register("section")}
                placeholder="Sección"
                error={!!errors.section}
                hint={errors.section?.message}
                disabled={viewOnlyMode}
                maxLength={5}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').substring(0, 5);
                  setValue("section", val, { shouldValidate: true, shouldDirty: true });
                }}
              />
            </div>

            {/* Fila 6 Clasificación */}
            <div>
              <label htmlFor="regime" className="mb-2.5 block text-black dark:text-white font-medium text-sm">Régimen *</label>
              <Controller
                name="regime"
                control={control}
                render={({ field }) => (
                  <CustomSelect
                    id="regime"
                    options={REGIME_OPTIONS.map(opt => ({ value: String(opt.value), label: opt.label }))}
                    placeholder="Seleccione Régimen"
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    value={String(field.value)}
                    onAddNew={() => openAddValueModal("Regimen/Turno", "regime", "Agregar Régimen")}
                    addNewLabel="Agregar Régimen"
                    disabled={viewOnlyMode}
                    error={!!errors.regime}
                  />
                )}
              />
              {errors.regime && (
                <p className="mt-1 text-xs text-error-500 flex items-center gap-1">
                  <span className="inline-block w-1 h-1 bg-error-500 rounded-full"></span>
                  {errors.regime.message}
                </p>
              )}
            </div>
            <div>
              <label htmlFor="studentType" className="mb-2.5 block text-black dark:text-white font-medium text-sm">Tipo Estudiante *</label>
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
            {studentType === "MILITAR" && (
              <div>
                <label htmlFor="militaryRank" className="mb-2.5 block text-black dark:text-white font-medium text-sm">Rango Militar *</label>
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
            
            <div className="md:col-span-2 lg:col-span-1">
              <label htmlFor="works" className="mb-2.5 block text-black dark:text-white font-medium text-sm">¿Trabaja? *</label>
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

            <div className="md:col-span-2 lg:col-span-3">
              <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Dirección de Residencia *</label>
              <TextArea
                {...register("address")}
                placeholder="Ingrese dirección de residencia completa"
                error={!!errors.address}
                hint={errors.address?.message}
                autoComplete="off"
                disabled={viewOnlyMode}
                rows={2}
                className="w-full"
                onChange={(e) => {
                  setValue("address", e.target.value.toUpperCase(), { shouldValidate: true, shouldDirty: true });
                }}
              />
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
          <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Nuevo valor</label>
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
