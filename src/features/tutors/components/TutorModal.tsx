import { useEffect, useState, useMemo, useCallback, useRef, lazy } from "react";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Input from "../../../components/form/input/InputField";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../../components/ui/modal";
import { Tutor, CreateTutorPayload, UpdateTutorPayload } from "../types";
import Button from "../../../components/ui/button/Button";
import AsyncButton from "../../../components/ui/button/AsyncButton";
import CustomSelect from "../../../components/form/CustomSelect";
import MultiSelect from "../../../components/form/MultiSelect";

import { useUnsavedChanges } from "../../../hooks/useUnsavedChanges";
import { useAcademicConfig } from "../../academic-config/hooks/useAcademicConfig";
import UnifiedDialog from "../../../components/ui/dialog/UnifiedDialog";
import { CONFIRM_MESSAGES, SYSTEM_DIALOGS } from "../../../components/ui/dialog/DialogConfig";
import { getCareers } from "../../careers/services/careersService";
import { Career } from "../../careers/types";
import { unwrapData } from "../../../api/crudServiceFactory";
import CareerModal from "../../careers/components/CareerModal";
import InternshipTypeModal from "../../internship-types/components/InternshipTypeModal";
import { getInternshipTypes, mapToOptions } from "../../internship-types/services/internshipTypesService";
import { InternshipTypeOption } from "../../internship-types/types";
import { InternshipType } from "../../internship-types/types";
import { useLists } from "../../lists/hooks/useLists";
import { List } from "../../lists/types";
import * as listsService from "../../lists/services/listsService";
import { isProtectedList, PROTECTED_LIST_MESSAGE } from "../../../constants/systemLists";
import { useToast } from "../../../context/toast";
import { formatCedulaDisplay, formatPhoneLocalDisplay, cleanPhone, CEDULA_MAX_LENGTH, CEDULA_MAX_DIGITS, PHONE_LOCAL_MAX_LENGTH } from "../../../utils/inputFormat";
import PersonFormFields from "../../persons/components/PersonFormFields";
import { getTutorByCi } from "../services/tutorsService";
import { checkAvailability as checkPersonAvailability } from "../../persons/services/personService";
import { lookupCi } from "../../students/services/studentsService";
import { NAME_PATTERN, SAFE_EMAIL_PATTERN, isSafeInput } from "../../../utils/inputValidation";

/**
 * Props for the TutorModal component.
 */
interface TutorModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Function to call when closing the modal */
  onClose: () => void;
  /** Function to call when saving the tutor data */
  onSave: (tutor: CreateTutorPayload | UpdateTutorPayload) => Promise<void> | void;
  /** The tutor object to edit, or null for creating a new one */
  editingTutor?: Tutor | null;
  /** Whether the modal is in a loading state */
  isLoading?: boolean;
  /** List of all tutors for validation purposes */
  tutors?: Tutor[];
  /** Unique ID for modal stack tracking (optional) */
  modalId?: string;
  /** Callback cuando se quiere editar un registro existente (convierte de crear a editar) */
  onEditExisting?: (tutor: Tutor) => void;
  /** Tipo de tutor: "academic" (default) o "methodological" */
  tutorType?: "academic" | "methodological";
}

/**
 * Modal component for creating and editing tutors.
 * 
 * @param props - Component props.
 * @returns The TutorModal component.
 */
export default function TutorModal({
  isOpen,
  onClose,
  onSave,
  editingTutor,
  isLoading = false,
  tutors = [],
  modalId,
  onEditExisting,
  tutorType = "academic",
}: TutorModalProps) {
  const [careers, setCareers] = useState<Career[]>([]);
  const [careersLoading, setCareersLoading] = useState(false);
  const { fetchMultipleLists } = useLists();
  const { addToast } = useToast();
  const [options, setOptions] = useState<Record<string, { value: string; label: string }[]>>({});
  const [confirmSaveOpen, setConfirmSaveOpen] = useState(false);
  const [pendingSave, setPendingSave] = useState<CreateTutorPayload | UpdateTutorPayload | null>(null);

   // State for display values with formatting
   const [displayIdentificationNumber, setDisplayIdentificationNumber] = useState("");
   const [displayPhoneNumber, setDisplayPhoneNumber] = useState("");
 
    // State for duplicate detection
    const [isCheckingCi, setIsCheckingCi] = useState(false);
    const [isLookingUpCi, setIsLookingUpCi] = useState(false);
    const [isCheckingEmail, setIsCheckingEmail] = useState(false);
    const [existingTutor, setExistingTutor] = useState<any | null>(null);
    const [existingPerson, setExistingPerson] = useState(false);
    const [viewOnlyMode, setViewOnlyMode] = useState(false);
   
   // State for API-loaded data flow (SENIAT)
   const [apiDataLoaded, setApiDataLoaded] = useState(false);
   const apiLoadedCiRef = useRef("");

    // State for career modal
    const [isCareerModalOpen, setIsCareerModalOpen] = useState(false);
   const [editingCareer, setEditingCareer] = useState<Career | null>(null);
   const [internshipOptions, setInternshipOptions] = useState<InternshipTypeOption[]>([]);
   
   // State for internship type modal (triggered from CareerModal)
   const [isInternshipTypeModalOpen, setIsInternshipTypeModalOpen] = useState(false);
   const [editingInternshipType, setEditingInternshipType] = useState<InternshipType | null>(null);
    const [existingInternshipTypes, setExistingInternshipTypes] = useState<InternshipType[]>([]);

  const { config: academicConfig } = useAcademicConfig();

  const tutorSchema = useMemo(() => z.object({
    identificationPrefix: z.string().min(1, "Seleccione el tipo"),
    identificationNumber: z.string()
      .min(6, "La cédula debe tener al menos 6 dígitos")
      .max(CEDULA_MAX_DIGITS, `La cédula no puede exceder los ${CEDULA_MAX_DIGITS} dígitos`)
      .regex(/^\d+$/, "Solo se admiten números"),
    firstName: z.string()
      .min(1, "El primer nombre es obligatorio")
      .max(100, "El nombre es demasiado largo")
      .regex(NAME_PATTERN, "Solo letras y espacios")
      .refine(val => isSafeInput(val), { message: "Caracteres no permitidos" })
      .transform(val => val.toUpperCase()),
    middleName: z.string()
      .max(100, "El nombre es demasiado largo")
      .refine(val => !val || NAME_PATTERN.test(val), { message: "Solo letras y espacios" })
      .refine(val => !val || isSafeInput(val), { message: "Caracteres no permitidos" })
      .transform(val => val ? val.toUpperCase() : "")
      .optional()
      .or(z.literal("")),
    lastName: z.string()
      .min(1, "El primer apellido es obligatorio")
      .max(100, "El apellido es demasiado largo")
      .regex(NAME_PATTERN, "Solo letras y espacios")
      .refine(val => isSafeInput(val), { message: "Caracteres no permitidos" })
      .transform(val => val.toUpperCase()),
    secondLastName: z.string()
      .max(100, "El apellido es demasiado largo")
      .refine(val => !val || NAME_PATTERN.test(val), { message: "Solo letras y espacios" })
      .refine(val => !val || isSafeInput(val), { message: "Caracteres no permitidos" })
      .transform(val => val ? val.toUpperCase() : "")
      .optional()
      .or(z.literal("")),
    sex: z.string().min(1, "Seleccione el sexo"),
    birthDate: z.string()
      .min(1, "La fecha de nacimiento es obligatoria")
      .refine((date) => {
        if (!date) return false;
        const birth = new Date(date.includes('T') ? date : `${date}T12:00:00`);
        if (isNaN(birth.getTime())) return false;
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
          age--;
        }
        return age >= 16;
      }, "El tutor debe tener al menos 16 años"),
    address: z.string(),
    civilStatus: z.string().min(1, "Seleccione el estado civil"),
    phoneAreaCode: z.string().min(1, "El código de área es obligatorio"),
    phoneNumber: z.string()
      .min(1, "El número de teléfono es obligatorio")
      .length(7, "El número de teléfono debe tener exactamente 7 dígitos")
      .regex(/^\d+$/, "Solo se admiten números"),
    email: z.string()
      .min(1, "El correo es obligatorio")
      .email("Formato de correo electrónico inválido")
      .max(255, "El email es demasiado largo")
      .regex(SAFE_EMAIL_PATTERN, "Email con caracteres no permitidos")
      .refine(val => isSafeInput(val), { message: "Caracteres no permitidos" })
      .transform(val => val.toUpperCase()),
    condition: z.string()
      .min(1, "La condición es obligatoria")
      .max(100, "El texto es demasiado largo")
      .refine(val => isSafeInput(val), { message: "Caracteres no permitidos" })
      .transform(val => val.toUpperCase()),
    dedication: z.string()
      .min(1, "La dedicación es obligatoria")
      .max(100, "El texto es demasiado largo")
      .refine(val => isSafeInput(val), { message: "Caracteres no permitidos" })
      .transform(val => val.toUpperCase()),
    category: z.string()
      .min(1, "La categoría es obligatoria")
      .max(100, "El texto es demasiado largo")
      .refine(val => isSafeInput(val), { message: "Caracteres no permitidos" })
      .transform(val => val.toUpperCase()),
    profession: z.string()
      .min(1, "El título es obligatorio")
      .max(200, "El texto es demasiado largo")
      .refine(val => isSafeInput(val), { message: "Caracteres no permitidos" })
      .transform(val => val.toUpperCase()),
    titulo: z.string()
      .min(1, "El grado de instrucción es obligatorio")
      .max(200, "El texto es demasiado largo")
      .refine(val => isSafeInput(val), { message: "Caracteres no permitidos" })
      .transform(val => val.toUpperCase()),
    carreras: z.array(z.string()).min(1, "Debe seleccionar al menos una carrera"),
  }).superRefine((data, ctx) => {
    // Validar duplicidad de cédula
    const currentId = editingTutor?.tutorId ?? existingTutor?.tutorId;
    // Validar duplicidad de cédula
    const isIdDuplicate = tutors.some(
      t => t.tutorId !== currentId && 
           t.identificationNumber === data.identificationNumber && 
           t.identificationPrefix === data.identificationPrefix
    );

    if (isIdDuplicate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Esta cédula ya se encuentra registrada",
        path: ["identificationNumber"],
      });
    }

    // Validar duplicidad de correo
    const isEmailDuplicate = tutors.some(
      t => t.tutorId !== currentId && 
           t.email.toLowerCase() === data.email.toLowerCase()
    );

    if (isEmailDuplicate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Este correo electrónico ya está en uso",
        path: ["email"],
      });
    }
  }), [tutors, editingTutor, existingTutor]);

  type TutorFormData = z.infer<typeof tutorSchema>;

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
  } = useForm<TutorFormData>({
    resolver: zodResolver(tutorSchema),
    mode: "onChange",
    defaultValues: {
      identificationPrefix: "V",
      identificationNumber: "",
      firstName: "",
      middleName: "",
      lastName: "",
      secondLastName: "",
      sex: "",
      birthDate: "",
      address: "",
      civilStatus: "",
      phoneAreaCode: "",
      phoneNumber: "",
      email: "",
      condition: "",
      dedication: "",
      category: "",
      profession: "",
      titulo: "",
      carreras: [],
    },
  });

  const {
    showConfirmation,
    handleCloseAttempt,
    confirmClose,
    cancelClose,
  } = useUnsavedChanges(isDirty, onClose);

  // Handle identification number input change with formatting
  const handleIdentificationNumberChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
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
          sex: "",
          birthDate: "",
          address: "",
          civilStatus: "",
          phoneAreaCode: "",
          phoneNumber: "",
          email: "",
          condition: "",
          dedication: "",
          category: "",
          profession: "",
          titulo: "",
          carreras: [],
        });
        setDisplayPhoneNumber("");
      }
    }

    // Si se cambia la cédula y hay un existingTutor o existingPerson, limpiar el formulario
    if (existingTutor || existingPerson) {
      const currentStoredDigits = existingTutor
        ? existingTutor.identificationNumber?.replace(/\D/g, '') || ''
        : '';
      // Si el usuario borró al menos 1 carácter o cambió algo
      if (digitsOnly.length < currentStoredDigits.length || digitsOnly !== currentStoredDigits || !existingTutor) {
        setExistingTutor(null);
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
          address: "",
          civilStatus: "",
          phoneAreaCode: "",
          phoneNumber: "",
          email: "",
          condition: "",
          dedication: "",
          category: "",
          profession: "",
          titulo: "",
          carreras: [],
        });
        setDisplayPhoneNumber("");
      }
    }
    
    // Verificar si la cédula existe mientras escribe (7 u 8 dígitos)
    if (!existingTutor && !existingPerson && !editingTutor && (digitsOnly.length === 7 || digitsOnly.length === 8)) {
      setIsCheckingCi(true);
      const prefix = watch("identificationPrefix") || 'V';
      const fullCi = `${prefix}-${digitsOnly}`;
      try {
        const result = await getTutorByCi(fullCi);
        if (result?.tutor) {
          const tutorData = result.tutor;
          setExistingTutor(tutorData);
          setExistingPerson(false);
          setViewOnlyMode(true);

          const areaCode = tutorData.phone ? tutorData.phone.substring(0, 4) : "";
          const phoneNumber = tutorData.phone ? tutorData.phone.substring(4) : "";

          setValue("identificationPrefix", tutorData.identificationPrefix || 'V');
          setDisplayIdentificationNumber(formatCedulaDisplay(tutorData.identificationNumber || ''));
          setValue("identificationNumber", tutorData.identificationNumber || '');
          setValue("firstName", tutorData.firstName || "");
          setValue("middleName", tutorData.middleName || "");
          setValue("lastName", tutorData.lastName || "");
          setValue("secondLastName", tutorData.secondLastName || "");
          setValue("sex", tutorData.sex || "");
          setValue("birthDate", tutorData.birthDate || "");
          setValue("civilStatus", tutorData.civilStatus || "");
          setValue("phoneAreaCode", areaCode);
          setDisplayPhoneNumber(formatPhoneLocalDisplay(phoneNumber));
          setValue("phoneNumber", phoneNumber);
          setValue("email", tutorData.email || "");
          setValue("condition", tutorData.condition || "");
          setValue("dedication", tutorData.dedication || "");
          setValue("category", tutorData.category || "");
          setValue("profession", tutorData.profession || "");
          setValue("titulo", tutorData.titulo || "");
          setValue("carreras", tutorData.carreras || []);
        } else if (result?.person) {
          // Persona existe (estudiante, usuario, etc.) pero no como tutor → pre-cargar datos
          setExistingTutor(null);
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
          setValue("email", personData.email || "");

          const areaCode = personData.phone ? personData.phone.substring(0, 4) : "";
          const phoneNumber = personData.phone ? personData.phone.substring(4) : "";
          setValue("phoneAreaCode", areaCode);
          setDisplayPhoneNumber(formatPhoneLocalDisplay(phoneNumber));
          setValue("phoneNumber", phoneNumber);

          addToast({
            variant: "info",
            title: "Persona existente",
            message: "Esta persona ya está registrada en el sistema. Se han precargado sus datos.",
          });
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
    const cleaned = cleanPhone(input).substring(0, 7);
    const formatted = formatPhoneLocalDisplay(cleaned);
    setDisplayPhoneNumber(formatted);
    setValue("phoneNumber", cleaned, { shouldValidate: true, shouldDirty: true });
  };

  // Handler onBlur para verificar CI existente al salir del campo
  const handleCiBlur = useCallback(
    async (e: React.FocusEvent<HTMLInputElement>) => {
      if (!existingTutor && !existingPerson && !editingTutor) {
        const val = e.target.value;
        const digitsOnly = val.replace(/\D/g, '').substring(0, CEDULA_MAX_DIGITS);
        if (digitsOnly.length >= 6) {
          setIsCheckingCi(true);
          const prefix = watch("identificationPrefix") || 'V';
          const fullCi = `${prefix}-${digitsOnly}`;
          try {
            const result = await getTutorByCi(fullCi);
            if (result?.tutor) {
              const tutorData = result.tutor;
              setExistingTutor(tutorData);
              setExistingPerson(false);
              setViewOnlyMode(true);

              const areaCode = tutorData.phone ? tutorData.phone.substring(0, 4) : "";
              const phoneNumber = tutorData.phone ? tutorData.phone.substring(4) : "";

              setValue("identificationPrefix", tutorData.identificationPrefix || 'V');
              setDisplayIdentificationNumber(formatCedulaDisplay(tutorData.identificationNumber || ''));
              setValue("identificationNumber", tutorData.identificationNumber || '');
              setValue("firstName", tutorData.firstName || "");
              setValue("middleName", tutorData.middleName || "");
              setValue("lastName", tutorData.lastName || "");
              setValue("secondLastName", tutorData.secondLastName || "");
              setValue("sex", tutorData.sex || "");
              setValue("birthDate", tutorData.birthDate || "");
              setValue("civilStatus", tutorData.civilStatus || "");
              setValue("phoneAreaCode", areaCode);
              setDisplayPhoneNumber(formatPhoneLocalDisplay(phoneNumber));
              setValue("phoneNumber", phoneNumber);
              setValue("email", tutorData.email || "");
              setValue("condition", tutorData.condition || "");
              setValue("dedication", tutorData.dedication || "");
              setValue("category", tutorData.category || "");
              setValue("profession", tutorData.profession || "");
              setValue("titulo", tutorData.titulo || "");
              setValue("carreras", tutorData.carreras || []);
            } else if (result?.person) {
              // Persona existe (estudiante, usuario, etc.) pero no como tutor → pre-cargar datos
              setExistingTutor(null);
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
              setValue("email", personData.email || "");

              const areaCode = personData.phone ? personData.phone.substring(0, 4) : "";
              const phoneNumber = personData.phone ? personData.phone.substring(4) : "";
              setValue("phoneAreaCode", areaCode);
              setDisplayPhoneNumber(formatPhoneLocalDisplay(phoneNumber));
              setValue("phoneNumber", phoneNumber);

              addToast({
                variant: "info",
                title: "Persona existente",
                message: "Esta persona ya está registrada en el sistema. Se han precargado sus datos.",
              });
            }
          } catch (err) {
            console.error("Error checking CI:", err);
          } finally {
            setIsCheckingCi(false);
          }
        }
      }
    },
    [existingTutor, existingPerson, editingTutor, watch, setValue, setError, clearErrors]
  );

  // Handle CI lookup via external API (SENIAT / CNE)
  const handleCiLookup = useCallback(async () => {
    if (existingTutor || existingPerson || editingTutor || isLookingUpCi) return;

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
      console.warn("[TutorModal] Error en lookup externo:", extErr);
      addToast({
        variant: "error",
        title: "Error de consulta",
        message: "No se pudo consultar el SENIAT. Verifique su conexión o llene los datos manualmente.",
      });
    } finally {
      setIsLookingUpCi(false);
    }
  }, [existingTutor, existingPerson, editingTutor, isLookingUpCi, watch, setValue, addToast]);

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
            editingTutor?.personId ? Number(editingTutor.personId) : undefined,
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
    [editingTutor, setError, clearErrors],
  );

  // Factory de handler para campos de nombre (uppercase)
  const handleNameChange = useCallback(
    (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value.toUpperCase();
      setValue(field as any, val, { shouldValidate: true, shouldDirty: true });
    },
    [setValue]
  );

  const birthDate = watch("birthDate");

  // Calcular edad basada en birthDate
  const age = useMemo(() => {
    if (!birthDate || birthDate.trim() === "") return null;
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

  // Estado para agregar nuevos valores a las listas
  const [isValueModalOpen, setIsValueModalOpen] = useState(false);
  const [valueModalTitle, setValueModalTitle] = useState<string>("");
  const [targetListName, setTargetListName] = useState<string>("");
  const [targetField, setTargetField] = useState<keyof TutorFormData | "">("");
  const [newValueInput, setNewValueInput] = useState<string>("");
  const [savingNewValue, setSavingNewValue] = useState(false);

  // Fallbacks for when t_list data is not available
  const CONDITION_OPTIONS = options["Condición"] || [
    { value: "ORDINARIO", label: "ORDINARIO" },
    { value: "CONTRATADO", label: "CONTRATADO" },
  ];

  const DEDICATION_OPTIONS = options["Dedicación"] || [
    { value: "TIEMPO COMPLETO", label: "TIEMPO COMPLETO" },
    { value: "MEDIO TIEMPO", label: "MEDIO TIEMPO" },
    { value: "TIEMPO CONVENCIONAL", label: "TIEMPO CONVENCIONAL" },
    { value: "DEDICACIÓN EXCLUSIVA", label: "DEDICACIÓN EXCLUSIVA" },
  ];

  const CATEGORY_OPTIONS = options["Categoría"] || [
    { value: "INSTRUCTOR", label: "INSTRUCTOR" },
    { value: "ASISTENTE", label: "ASISTENTE" },
    { value: "AGREGADO", label: "AGREGADO" },
    { value: "ASOCIADO", label: "ASOCIADO" },
    { value: "TITULAR", label: "TITULAR" },
  ];

  const TITULO_OPTIONS = options["Título"] || [];

  const GRADO_INSTRUCCION_OPTIONS = options["GRADO DE INSTRUCCIÓN"] || [];

  useEffect(() => {
    const loadOptions = async () => {
      try {
        const listNames = [
          "Nacionalidad",
          "Sexo",
          "PREFIJO",
          "Registro Civil",
          "Condición",
          "Dedicación",
          "Categoría",
          "Título",
          "GRADO DE INSTRUCCIÓN",
          "Tipo de Practica"
        ];
        const data = await fetchMultipleLists(listNames);
        const mappedOptions: Record<string, { value: string; label: string }[]> = {};
        
        Object.entries(data).forEach(([key, values]) => {
          mappedOptions[key] = values.map(v => ({
            // Para Nacionalidad usamos la abreviación (V, E) como valor y etiqueta
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
  const openAddValueModal = (listName: string, field: keyof TutorFormData, title: string) => {
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
      
      const upper = targetField === "phoneAreaCode" ? raw.replace(/\D/g, '').substring(0, 4) : raw.toUpperCase();
      
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
        setValue(targetField as keyof TutorFormData, selectValue, { shouldValidate: true, shouldDirty: true });
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

      setValue(targetField as keyof TutorFormData, mapped.value, { shouldValidate: true, shouldDirty: true });
      setIsValueModalOpen(false);
    } catch (e) {
      console.error("[TutorModal] Error creando valor en lista:", e);
    } finally {
      setSavingNewValue(false);
    }
  };

  useEffect(() => {
    const fetchCareers = async () => {
      setCareersLoading(true);
      try {
        const data = await getCareers();
        setCareers(unwrapData(data).filter(c => c.status));
      } catch (error) {
        console.error("Error fetching careers:", error);
      } finally {
        setCareersLoading(false);
      }
    };
    const fetchInternshipTypes = async () => {
      try {
        const types = await getInternshipTypes();
        setInternshipOptions(mapToOptions(types));
        setExistingInternshipTypes(types);
      } catch (error) {
        console.error("Error fetching internship types:", error);
      }
    };
    if (isOpen) {
      fetchCareers();
      fetchInternshipTypes();
    }
  }, [isOpen]);

  const careerOptions = useMemo(() => {
    return careers.map(c => ({
      value: String(c.careerId),
      text: `${c.careerCode} - ${c.careerName}`
    }));
  }, [careers]);

  useEffect(() => {
    if (isOpen) {
      // Limpiar estados de duplicado cuando se abre el modal
      setExistingTutor(null);
      setExistingPerson(false);
      setViewOnlyMode(false);
      
      if (editingTutor) {
        const areaCode = editingTutor.phone.substring(0, 4);
        const number = editingTutor.phone.substring(4);
        reset({
          identificationPrefix: editingTutor.identificationPrefix,
          identificationNumber: editingTutor.identificationNumber,
          firstName: editingTutor.firstName,
          middleName: editingTutor.middleName || "",
          lastName: editingTutor.lastName,
          secondLastName: editingTutor.secondLastName || "",
          sex: editingTutor.sex,
          birthDate: editingTutor.birthDate || "",
          address: editingTutor.address || "",
          civilStatus: editingTutor.civilStatus || "",
          phoneAreaCode: areaCode,
          phoneNumber: number,
          email: editingTutor.email,
          condition: editingTutor.condition,
          dedication: editingTutor.dedication,
          category: editingTutor.category,
          profession: editingTutor.profession,
          titulo: editingTutor.titulo || "",
          carreras: editingTutor.carreras || [],
        });
        setDisplayIdentificationNumber(formatCedulaDisplay(editingTutor.identificationNumber, false));
        
        // Formatear teléfono
        const cleanPh = cleanPhone(editingTutor.phone);
        const numberOnly = cleanPh.length >= 4 ? cleanPh.substring(4) : cleanPh;
        setDisplayPhoneNumber(formatPhoneLocalDisplay(numberOnly));
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
          address: "",
          civilStatus: "",
          phoneAreaCode: "",
          phoneNumber: "",
          email: "",
          condition: "",
          dedication: "",
          category: "",
          profession: "",
          titulo: "",
          carreras: [],
        });
        setDisplayIdentificationNumber("");
        setDisplayPhoneNumber("");
      }
    }
  }, [isOpen, editingTutor, reset]);

  // Cleanup adicional cuando se cierra el modal
  useEffect(() => {
    if (!isOpen) {
      // Cuando el modal se cierra, asegurar limpieza
      setExistingTutor(null);
      setViewOnlyMode(false);
    }
  }, [isOpen]);

  const onSubmit: SubmitHandler<TutorFormData> = (data) => {
    try {
      const payload = {
        identificationPrefix: data.identificationPrefix as "V" | "E",
        identificationNumber: data.identificationNumber,
        firstName: (data.firstName || "").toUpperCase(),
        middleName: (data.middleName || "").toUpperCase(),
        lastName: (data.lastName || "").toUpperCase(),
        secondLastName: (data.secondLastName || "").toUpperCase(),
        sex: data.sex as "FEMENINO" | "MASCULINO",
        birthDate: data.birthDate || undefined,
        address: data.address || undefined,
        civilStatus: data.civilStatus || undefined,
        phone: `${data.phoneAreaCode}${data.phoneNumber}`,
        email: (data.email || "").toUpperCase(),
        condition: (data.condition || "").toUpperCase(),
        dedication: (data.dedication || "").toUpperCase(),
        category: (data.category || "").toUpperCase(),
        profession: (data.profession || "").toUpperCase(),
        titulo: data.titulo ? data.titulo.toUpperCase() : "",
        carreras: Array.isArray(data.carreras) ? data.carreras.map((c) => String(c).toUpperCase()) : data.carreras,
      } as CreateTutorPayload;
      setPendingSave(payload);
      setConfirmSaveOpen(true);
    } catch (error) {
      console.error("[TutorModal] Error al procesar el envío del formulario:", error);
    }
  };

  const isInUse = editingTutor?.isInUse;

  const handleClose = () => {
    setExistingTutor(null);
    setViewOnlyMode(false);
    onClose();
  };

  return (
    <>
      <Modal 
        isOpen={isOpen} 
        onClose={handleClose} 
        onCloseAttempt={handleCloseAttempt} 
        showCloseButton 
        size="4xl"
        modalId={modalId}
      >
        <ModalHeader>
          <span className="text-xl font-semibold text-text-primary dark:text-white/90">
            {editingTutor || existingTutor ? "Editar" : "Registrar"} Tutor {tutorType === "methodological" ? "Metodológico" : "Académico"}
          </span>
          <p className="text-sm text-text-secondary">Complete la información del tutor {tutorType === "methodological" ? "metodológico" : "académico"}.</p>
          {isInUse && (
            <div className="mt-2 text-xs font-medium text-warning-700 dark:text-warning-400 bg-warning-50 dark:bg-warning-900/20 p-2.5 rounded-md border border-warning-200 dark:border-warning-800/50 flex items-start gap-2">
              <span className="mt-0.5">⚠️</span>
              <span>Nota: Algunos campos están restringidos porque el tutor tiene registros asociados en el sistema.</span>
            </div>
          )}
        </ModalHeader>

      <ModalBody className="bg-bg-secondary/30 dark:bg-bg-dark/50">
        <form id="tutor-form" onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-4xl mx-auto py-2">
          {existingTutor && viewOnlyMode && (
            <div className="flex items-center space-x-3 p-3 bg-warning-50 dark:bg-warning-500/10 border border-warning-200 dark:border-warning-500/20 rounded-lg mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-warning-700 dark:text-warning-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.492-1.646-1.742-2.98l5.58-9.92zM11 13a1 1 0 10-2 0v-3a1 1 0 112 0v3zm-1-8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium text-warning-700 dark:text-warning-400">
                Registro existente - Click en 'Editar Registro' para modificar
              </span>
            </div>
          )}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Columna Izquierda: PersonFormFields + Campos Tutor */}
            <div className="lg:col-span-3 space-y-6">
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
                onCiLookup={handleCiLookup}
                isLookingUpCi={isLookingUpCi}
                onBlurEmail={handleEmailBlur}
                isCheckingEmail={isCheckingEmail}
                displayPhoneNumber={displayPhoneNumber}
                onPhoneNumberChange={handlePhoneNumberChange}
                createNameHandler={handleNameChange}
                onAddValue={(listName, field, title) => openAddValueModal(listName, field as any, title)}
                viewOnlyMode={viewOnlyMode}
                fieldLockOnApiLoad={apiDataLoaded && (academicConfig?.lockApiLoadedFields ?? true)}
                editingId={editingTutor?.tutorId ?? existingTutor?.tutorId ?? null}
                phonePrefixFieldName="phoneAreaCode"
                age={age}
                maxDate={maxDate ? maxDate.toISOString().split("T")[0] : undefined}
              />

              {/* Sub-grid: Campos específicos del tutor */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Condición */}
                <div>
                  <label className="text-sm font-medium text-text-primary dark:text-white/90">Condición *</label>
                  <Controller
                    name="condition"
                    control={control}
                    render={({ field }) => (
                      <CustomSelect
                        id="condition"
                        options={CONDITION_OPTIONS.map(opt => ({ value: String(opt.value), label: opt.label }))}
                        placeholder="Seleccione Condición"
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        value={String(field.value)}
                        disabled={viewOnlyMode}
                        error={!!errors.condition}
                        onAddNew={() => openAddValueModal("Condición", "condition", "Agregar Condición")}
                        addNewLabel="Nueva opción"
                      />
                    )}
                  />
                  {errors.condition && (
                    <p className="mt-1 text-xs text-red-500">{errors.condition.message}</p>
                  )}
                </div>

                {/* Dedicación */}
                <div>
                  <label className="text-sm font-medium text-text-primary dark:text-white/90">Dedicación *</label>
                  <Controller
                    name="dedication"
                    control={control}
                    render={({ field }) => (
                      <CustomSelect
                        id="dedication"
                        options={DEDICATION_OPTIONS.map(opt => ({ value: String(opt.value), label: opt.label }))}
                        placeholder="Seleccione Dedicación"
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        value={String(field.value)}
                        disabled={viewOnlyMode}
                        error={!!errors.dedication}
                        onAddNew={() => openAddValueModal("Dedicación", "dedication", "Agregar Dedicación")}
                        addNewLabel="Nueva opción"
                      />
                    )}
                  />
                  {errors.dedication && (
                    <p className="mt-1 text-xs text-red-500">{errors.dedication.message}</p>
                  )}
                </div>

                {/* Categoría */}
                <div>
                  <label className="text-sm font-medium text-text-primary dark:text-white/90">Categoría *</label>
                  <Controller
                    name="category"
                    control={control}
                    render={({ field }) => (
                      <CustomSelect
                        id="category"
                        options={CATEGORY_OPTIONS.map(opt => ({ value: String(opt.value), label: opt.label }))}
                        placeholder="Seleccione Categoría"
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        value={String(field.value)}
                        disabled={viewOnlyMode}
                        error={!!errors.category}
                        onAddNew={() => openAddValueModal("Categoría", "category", "Agregar Categoría")}
                        addNewLabel="Nueva opción"
                      />
                    )}
                  />
                  {errors.category && (
                    <p className="mt-1 text-xs text-red-500">{errors.category.message}</p>
                  )}
                </div>

                {/* Título */}
                <div>
                  <label className="text-sm font-medium text-text-primary dark:text-white/90">Título *</label>
                  <Controller
                    name="profession"
                    control={control}
                    render={({ field }) => (
                      <CustomSelect
                        id="profession"
                        options={TITULO_OPTIONS.map(opt => ({ value: String(opt.value), label: opt.label }))}
                        placeholder="Seleccione Título"
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        value={String(field.value)}
                        disabled={viewOnlyMode}
                        error={!!errors.profession}
                        onAddNew={() => openAddValueModal("Título", "profession", "Agregar Título")}
                        addNewLabel="Nueva opción"
                      />
                    )}
                  />
                  {errors.profession && (
                    <p className="mt-1 text-xs text-red-500">{errors.profession.message}</p>
                  )}
                </div>

                {/* Grado de instrucción */}
                <div>
                  <label className="text-sm font-medium text-text-primary dark:text-white/90">Grado de instrucción *</label>
                  <Controller
                    name="titulo"
                    control={control}
                    render={({ field }) => (
                      <CustomSelect
                        id="titulo"
                        options={GRADO_INSTRUCCION_OPTIONS.map(opt => ({ value: String(opt.value), label: opt.label }))}
                        placeholder="Seleccione Grado de Instrcción"
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        value={String(field.value)}
                        disabled={viewOnlyMode}
                        error={!!errors.titulo}
                        onAddNew={() => openAddValueModal("GRADO DE INSTRUCCIÓN", "titulo", "Agregar Grado de Instrcción")}
                        addNewLabel="Nueva opción"
                      />
                    )}
                  />
                  {errors.titulo && (
                    <p className="mt-1 text-xs text-red-500">{errors.titulo.message}</p>
                  )}
                </div>
              </div>

              {/* Carreras que Atiende - full width abajo */}
              <Controller
                name="carreras"
                control={control}
                render={({ field }) => (
                  <MultiSelect
                    {...field}
                    label="Carreras que Atiende *"
                    placeholder={careersLoading ? "Cargando carreras..." : (isInUse ? "Carreras asignadas (no editable)" : "Seleccione las carreras...")}
                    options={careerOptions}
                    disabled={careersLoading || isInUse || viewOnlyMode}
                    onAddNew={() => {
                      setIsCareerModalOpen(true);
                    }}
                    addNewLabel="Crear nueva carrera"
                  />
                )}
              />
            </div> {/* Cierra Columna Izquierda */}
           </div>
        </form>
      </ModalBody>

      <ModalFooter className="shrink-0 px-6 sm:px-12 py-6 bg-white dark:bg-bg-dark border-t border-border-light dark:border-border-dark">
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 w-full max-w-6xl mx-auto">
          <Button variant="outline" onClick={handleCloseAttempt} disabled={isLoading} className="w-full sm:w-auto min-h-12">
            Cancelar
          </Button>
          {existingTutor ? (
            viewOnlyMode ? (
              <AsyncButton 
                type="button"
                className="w-full sm:w-auto min-h-12 bg-warning-500 hover:bg-warning-600 text-white"
                onClick={() => {
                  if (onEditExisting) {
                    onEditExisting(existingTutor);
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
                form="tutor-form" 
                loading={isLoading} 
                disabled={!isValid}
                className="w-full sm:w-auto min-h-12"
              >
                Guardar Cambios
              </AsyncButton>
            )
          ) : editingTutor ? (
            <AsyncButton 
              type="submit" 
              form="tutor-form" 
              loading={isLoading} 
              disabled={!isDirty}
              className="w-full sm:w-auto min-h-12"
            >
              Actualizar Registro
            </AsyncButton>
          ) : (
            <AsyncButton 
              type="submit" 
              form="tutor-form" 
              loading={isLoading} 
              disabled={!isValid}
              className="w-full sm:w-auto min-h-12"
            >
              Guardar Tutor
            </AsyncButton>
          )}
        </div>
      </ModalFooter>
    </Modal>

    {confirmSaveOpen && (
      <UnifiedDialog
        isOpen={confirmSaveOpen}
        onClose={() => setConfirmSaveOpen(false)}
        onConfirm={() => {
          if (pendingSave) {
            onSave(pendingSave);
          }
          setConfirmSaveOpen(false);
        }}
        variant="confirm"
        {...(editingTutor || existingTutor ? CONFIRM_MESSAGES.update('Tutor') : CONFIRM_MESSAGES.create('Tutor'))}
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

    {/* Modal para crear nueva carrera */}
    <CareerModal
      isOpen={isCareerModalOpen}
      onClose={() => {
        setIsCareerModalOpen(false);
        setEditingCareer(null);
      }}
      onSave={async () => {
        // Recargar carreras después de crear una nueva
        const allCareers = await getCareers();
        setCareers(unwrapData(allCareers).filter(c => c.status));
        setIsCareerModalOpen(false);
        setEditingCareer(null);
      }}
      editingCareer={editingCareer}
      internshipOptions={internshipOptions}
      isLoading={false}
      hasPendingEvaluations={false}
      isInUse={false}
      existingCareers={careers}
      onAddInternshipType={() => {
        // Open the internship type modal
        setIsInternshipTypeModalOpen(true);
        setEditingInternshipType(null);
      }}
    />
    
    {/* Modal para crear nuevo tipo de práctica (desde CareerModal) */}
    <InternshipTypeModal
      isOpen={isInternshipTypeModalOpen}
      onClose={() => {
        setIsInternshipTypeModalOpen(false);
        setEditingInternshipType(null);
      }}
      onSave={async () => {
        // Recargar tipos de práctica después de crear uno nuevo
        const types = await getInternshipTypes();
        setInternshipOptions(mapToOptions(types));
        setExistingInternshipTypes(types);
        setIsInternshipTypeModalOpen(false);
        setEditingInternshipType(null);
      }}
      editingItem={editingInternshipType}
      existingTypes={existingInternshipTypes}
    />
  </>
  );
}
