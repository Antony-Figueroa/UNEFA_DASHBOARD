import { useEffect, useState, useMemo, useCallback, useRef, lazy } from "react";
import { useForm, Controller, SubmitHandler, FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Input from "../../../components/form/input/InputField";
import Label from "../../../components/form/Label";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../../components/ui/modal";
import { Tabs } from "../../../components/ui/tabs/Tabs";
import { useTabs } from "../../../hooks/useTabs";
import { Tutor, CreateTutorPayload, UpdateTutorPayload } from "../types";
import Button from "../../../components/ui/button/Button";

import CustomSelect from "../../../components/form/CustomSelect";
import MultiSelect from "../../../components/form/MultiSelect";

import { useUnsavedChanges } from "../../../hooks/useUnsavedChanges";
import { useAcademicConfig } from "../../academic-config/hooks/useAcademicConfig";
import UnifiedDialog from "../../../components/ui/dialog/UnifiedDialog";
import { CONFIRM_MESSAGES, MODAL_CONFIG, SYSTEM_DIALOGS } from "../../../components/ui/dialog/DialogConfig";
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
import { formatCedulaDisplay, formatPhoneLocalDisplay, cleanPhone, CEDULA_MAX_LENGTH, CEDULA_MAX_DIGITS, PASSPORT_MAX_LENGTH, PHONE_LOCAL_MAX_LENGTH } from "../../../utils/inputFormat";
import { getTutorByCi } from "../services/tutorsService";
import { checkAvailability as checkPersonAvailability } from "../../persons/services/personService";
import { lookupCi } from "../../students/services/studentsService";
import { NAME_PATTERN, SAFE_EMAIL_PATTERN, isSafeInput } from "../../../utils/inputValidation";
import { PREFIX_OPTIONS } from "../../persons/types";
import { Search } from "lucide-react";
// import { addressService } from "../../address/services/addressService";
// import type { GeoOptionsItem } from "../../address/types";
// import GeographicAddressFields from "../../address/components/GeographicAddressFields";
// import type { GeographicAddressValue } from "../../address/components/GeographicAddressFields";

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
  const [confirmSaving, setConfirmSaving] = useState(false);
  const [pendingSave, setPendingSave] = useState<CreateTutorPayload | UpdateTutorPayload | null>(null);
  const submittingRef = useRef(false);

   // State for display values with formatting
   const [displayIdentificationNumber, setDisplayIdentificationNumber] = useState("");
   const [displayPhoneNumber, setDisplayPhoneNumber] = useState("");
 
    // State for duplicate detection
    const [isCheckingCi, setIsCheckingCi] = useState(false);
    const [isLookingUpCi, setIsLookingUpCi] = useState(false);
    const [isCheckingEmail, setIsCheckingEmail] = useState(false);
    const tabsState = useTabs({ defaultTab: 'identificacion' });
    useEffect(() => { if (isOpen) tabsState.setActiveTab('identificacion'); }, [isOpen]);

    const TAB_IDS = ['identificacion', 'perfil-contacto', 'laboral', 'asignaciones'] as const;
    const TAB_FIELDS: Record<string, string[]> = {
      'identificacion': ['identificationPrefix', 'identificationNumber', 'firstName', 'middleName', 'lastName', 'secondLastName'],
      'perfil-contacto': ['birthDate', 'sex', 'civilStatus', 'phoneAreaCode', 'phoneNumber', 'email'],
      'laboral': ['condition', 'dedication', 'category', 'profession', 'titulo'],
      'asignaciones': ['carreras'],
    };

    const [existingTutor, setExistingTutor] = useState<any | null>(null);
    const [existingPerson, setExistingPerson] = useState<Record<string, any> | null>(null);
    const [viewOnlyMode, setViewOnlyMode] = useState(false);
    const [ciLoadedFromApi, setCiLoadedFromApi] = useState(false);
    // ponytail: currentPersonId no es necesario sin AddressList

    // State for career modal
    const [isCareerModalOpen, setIsCareerModalOpen] = useState(false);
   const [editingCareer, setEditingCareer] = useState<Career | null>(null);
   const [internshipOptions, setInternshipOptions] = useState<InternshipTypeOption[]>([]);
   
   // State for internship type modal (triggered from CareerModal)
   const [isInternshipTypeModalOpen, setIsInternshipTypeModalOpen] = useState(false);
   const [editingInternshipType, setEditingInternshipType] = useState<InternshipType | null>(null);
    const [existingInternshipTypes, setExistingInternshipTypes] = useState<InternshipType[]>([]);

  const { config: academicConfig } = useAcademicConfig();
  // address: no usado por ahora — comentado
  // const [geoOptions, setGeoOptions] = useState<GeoOptionsItem[]>([]);
  // const [inlineAddress, setInlineAddress] = useState<GeographicAddressValue>({
  //   parroquiaId: null, streetAddress: '', reference: '', addressTypeId: 3, isPrimary: true,
  // });
  // const initialAddressRef = useRef(inlineAddress);
  // const hasAddressChanged = useMemo(() => {
  //   const i = initialAddressRef.current;
  //   return i.parroquiaId !== inlineAddress.parroquiaId
  //     || i.streetAddress !== inlineAddress.streetAddress
  //     || i.reference !== inlineAddress.reference;
  // }, [inlineAddress]);

  const tutorSchema = useMemo(() => z.object({
    identificationPrefix: z.string().min(1, "Seleccione el tipo"),
    identificationNumber: z.string()
      .min(1, "La identificación es obligatoria"),
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
    // Validación condicional de identificación
    const num = data.identificationNumber || "";
    if (data.identificationPrefix === "P") {
      if (!/^[A-Za-z0-9]+$/.test(num)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Solo se admiten letras y números",
          path: ["identificationNumber"],
        });
      }
    } else {
      if (!/^\d+$/.test(num)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Solo se admiten números",
          path: ["identificationNumber"],
        });
      }
      if (num.length < 6) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "La cédula debe tener al menos 6 dígitos",
          path: ["identificationNumber"],
        });
      }
      if (num.length > CEDULA_MAX_DIGITS) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `La cédula no puede exceder los ${CEDULA_MAX_DIGITS} dígitos`,
          path: ["identificationNumber"],
        });
      }
    }

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
    formState: { errors, isDirty, isValid, touchedFields },
  } = useForm<TutorFormData>({
    resolver: zodResolver(tutorSchema),
    mode: "onTouched",
    defaultValues: {
      identificationPrefix: "V",
      identificationNumber: "",
      firstName: "",
      middleName: "",
      lastName: "",
      secondLastName: "",
      sex: "",
      birthDate: "",
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

  const formValues = watch();
  const allRequiredFilled = useMemo(() => {
    const v = formValues;
    return !!(
      v.identificationPrefix &&
      v.identificationNumber?.length >= 6 &&
      v.firstName &&
      v.lastName &&
      v.sex &&
      v.birthDate &&
      v.civilStatus &&
      v.phoneAreaCode &&
      v.phoneNumber?.length === 7 &&
      v.email &&
      v.condition &&
      v.dedication &&
      v.category &&
      v.profession &&
      v.titulo &&
      v.carreras?.length > 0
    );
  }, [formValues]);

  const ciDisabled = !!editingTutor?.tutorId;
  const currentPrefix = watch("identificationPrefix") || "V";
  const isPassport = currentPrefix === "P";
  const isFieldValid = useCallback((fieldName: string) =>
    !!(touchedFields as any)[fieldName] && !(errors as any)[fieldName],
    [touchedFields, errors]);
  const isFieldDisabled = useCallback((fieldName: string) => {
    if (viewOnlyMode) return true;
    return false;
  }, [viewOnlyMode]);

  const {
    showConfirmation,
    handleCloseAttempt,
    confirmClose,
    cancelClose,
  } = useUnsavedChanges(isDirty, onClose);

  // -- Tab state derived from form errors --
  const errorsByTab = useMemo(() => {
    const keys = Object.keys(errors);
    const counts: Record<string, number> = {};
    for (const tab of TAB_IDS) {
      counts[tab] = keys.filter(k => TAB_FIELDS[tab].includes(k)).length;
    }
    return counts;
  }, [errors]);
  // Handle identification number input change with formatting
  const handleIdentificationNumberChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    let cleanedValue = "";
    const prefix = watch("identificationPrefix") || "V";
    const isPassport = prefix === "P";
    
    if (isPassport) {
      cleanedValue = input.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, PASSPORT_MAX_LENGTH);
      const formatted = formatCedulaDisplay(cleanedValue, false);
      setDisplayIdentificationNumber(formatted);
      setValue("identificationNumber", cleanedValue, { shouldValidate: true, shouldDirty: true });
    } else {
      cleanedValue = input.replace(/\D/g, '').substring(0, CEDULA_MAX_DIGITS);
      const formatted = formatCedulaDisplay(cleanedValue, false);
      setDisplayIdentificationNumber(formatted);
      setValue("identificationNumber", cleanedValue, { shouldValidate: true, shouldDirty: true });
    }
    clearErrors("identificationNumber");
    
    // Si se cambia la cédula y hay un existingTutor o existingPerson, limpiar el formulario
    if (existingTutor || existingPerson) {
      const currentStoredValue = existingTutor
        ? existingTutor.identificationNumber || ''
        : '';
      // Si el usuario borró al menos 1 carácter o cambió algo
      if (cleanedValue.length < currentStoredValue.length || cleanedValue !== currentStoredValue || !existingTutor) {
        setExistingTutor(null);
        setExistingPerson(null);
        setCiLoadedFromApi(false);
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
    if (!existingTutor && !existingPerson && !editingTutor && (cleanedValue.length === 7 || cleanedValue.length === 8)) {
      setIsCheckingCi(true);
      const fullCi = `${prefix}-${cleanedValue}`;
      try {
        const result = await getTutorByCi(fullCi);
        if (result?.tutor) {
          const tutorData = result.tutor;
          setExistingTutor(tutorData);
          setExistingPerson(null);

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
          // Persona existe (estudiante, usuario, etc.) pero no como tutor -> pre-cargar datos
          const personData = result.person;
          setExistingTutor(null);
          setExistingPerson(personData);
          setViewOnlyMode(false);

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
              setExistingPerson(null);

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
              // Persona existe (estudiante, usuario, etc.) pero no como tutor -> pre-cargar datos
              const personData = result.person;
              setExistingTutor(null);
              setExistingPerson(personData);
              setViewOnlyMode(false);
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
        setCiLoadedFromApi(true);
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
      // Si el valor no ha cambiado y estamos en modo edición, no es necesario revalidar
      if (editingTutor && value === editingTutor.email) {
        clearErrors("email");
        return;
      }
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

  // Factory de handler para campos de nombre (uppercase + regex)
  const handleNameChange = useCallback(
    (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value
        .replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s']/g, "")
        .toUpperCase();
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

  const PROFESSION_OPTIONS = options["Profesión"] || [
    { value: "INGENIERO/A EN SISTEMAS", label: "INGENIERO/A EN SISTEMAS" },
    { value: "INGENIERO/A CIVIL", label: "INGENIERO/A CIVIL" },
    { value: "INGENIERO/A INDUSTRIAL", label: "INGENIERO/A INDUSTRIAL" },
    { value: "INGENIERO/A ELÉCTRICO", label: "INGENIERO/A ELÉCTRICO" },
    { value: "CONTADOR/A PÚBLICO", label: "CONTADOR/A PÚBLICO" },
    { value: "LICENCIADO/A EN ADMINISTRACIÓN", label: "LICENCIADO/A EN ADMINISTRACIÓN" },
    { value: "LICENCIADO/A EN EDUCACIÓN", label: "LICENCIADO/A EN EDUCACIÓN" },
    { value: "ABOGADO/A", label: "ABOGADO/A" },
    { value: "MÉDICO/A", label: "MÉDICO/A" },
    { value: "T.S.U.", label: "T.S.U." },
  ];

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
          "Profesión",
          "Título",
          "GRADO DE INSTRUCCIÓN",
          "Tipo de Practica"
        ];
        const data = await fetchMultipleLists(listNames);
        const mappedOptions: Record<string, { value: string; label: string }[]> = {};
        
        Object.entries(data).forEach(([key, values]) => {
          mappedOptions[key] = values.map(v => ({
            // Para Nacionalidad usamos la abreviación (V, E, P) como valor y etiqueta
            value: (key === "Nacionalidad" && v.abbreviation) ? v.abbreviation.toUpperCase() : v.name,
            label: (key === "Nacionalidad" && v.abbreviation) ? v.abbreviation.toUpperCase() : v.name
          }));
        });
        
        setOptions(mappedOptions);
      } catch (error) {
        console.error("Error loading list options:", error);
      }
    };

    // const loadGeoOptions = async () => {
    //   try {
    //     const response = await addressService.getGeoOptions();
    //     setGeoOptions(response.data);
    //   } catch (error) {
    //     console.error("Error loading geo options:", error);
    //   }
    // };

    if (isOpen) {
      loadOptions();
      // loadGeoOptions();
    }
  }, [isOpen, fetchMultipleLists]);

  // Funciones para agregar nuevos valores a las listas
  const openAddValueModal = (listName: string, field: string, title: string) => {
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
    setTargetField(field as keyof TutorFormData | "");
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
      setExistingPerson(null);
      setViewOnlyMode(false);
      // address: no usado
      // const emptyAddress = { parroquiaId: null, streetAddress: '', reference: '', addressTypeId: 3, isPrimary: true };
      // setInlineAddress(emptyAddress);
      // initialAddressRef.current = emptyAddress;
      
      if (editingTutor) {
        const areaCode = editingTutor.phone ? editingTutor.phone.substring(0, 4) : "";
        const number = editingTutor.phone ? editingTutor.phone.substring(4) : "";
        reset({
          identificationPrefix: editingTutor.identificationPrefix,
          identificationNumber: editingTutor.identificationNumber,
          firstName: editingTutor.firstName,
          middleName: editingTutor.middleName || "",
          lastName: editingTutor.lastName,
          secondLastName: editingTutor.secondLastName || "",
          sex: editingTutor.sex,
          birthDate: editingTutor.birthDate || "",
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
        const cleanPh = editingTutor.phone ? cleanPhone(editingTutor.phone) : "";
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
    // ref lock: evita doble submit por click rapido / latencia
    if (submittingRef.current) return;
    submittingRef.current = true;
    try {
      const basePayload = {
        identificationPrefix: data.identificationPrefix as "V" | "E",
        identificationNumber: data.identificationNumber,
        firstName: (data.firstName || "").toUpperCase(),
        middleName: (data.middleName || "").toUpperCase(),
        lastName: (data.lastName || "").toUpperCase(),
        secondLastName: (data.secondLastName || "").toUpperCase(),
        sex: data.sex as "FEMENINO" | "MASCULINO",
        birthDate: data.birthDate || undefined,
        civilStatus: data.civilStatus || undefined,
        phone: `${data.phoneAreaCode}${data.phoneNumber}`,
        email: (data.email || "").toUpperCase(),
        condition: (data.condition || "").toUpperCase(),
        dedication: (data.dedication || "").toUpperCase(),
        category: (data.category || "").toUpperCase(),
        profession: (data.profession || "").toUpperCase(),
        titulo: data.titulo ? data.titulo.toUpperCase() : "",
        carreras: Array.isArray(data.carreras) ? data.carreras.map((c) => String(c).toUpperCase()) : data.carreras,
        // address: no usado
        // address: inlineAddress.streetAddress ? `${inlineAddress.streetAddress}${inlineAddress.reference ? ` - ${inlineAddress.reference}` : ''}` : undefined,
      };
      // Si se cargó un tutor existente por CI → actualizar, no crear
      const payload = existingTutor
        ? { ...basePayload, tutorId: existingTutor.tutorId, status: existingTutor.status }
        : basePayload;
      setPendingSave(payload as CreateTutorPayload | UpdateTutorPayload);
      setConfirmSaveOpen(true);
    } catch (error) {
      submittingRef.current = false;
      console.error("[TutorModal] Error al procesar el envío del formulario:", error);
    }
  };

  const onFormError = useCallback((formErrors: FieldErrors<TutorFormData>) => {
    const firstTabWithErrors = TAB_IDS.find(tab => TAB_FIELDS[tab].some(f => (formErrors as Record<string, any>)[f]));
    if (firstTabWithErrors) {
      tabsState.setActiveTab(firstTabWithErrors);
      requestAnimationFrame(() => {
        const firstErrorEl = document.querySelector<HTMLElement>('[aria-invalid="true"]');
        firstErrorEl?.focus();
      });
    }
  }, []);
  const handleFormSubmit = handleSubmit(onSubmit, onFormError);

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
            {MODAL_CONFIG.titleByMode(editingTutor || existingTutor, `Tutor ${tutorType === "methodological" ? "Metodológico" : "Académico"}`)}
          </span>
          <p className="text-sm text-text-secondary">{MODAL_CONFIG.descriptionByMode(editingTutor || existingTutor, `tutor ${tutorType === "methodological" ? "metodológico" : "académico"}`)}</p>

        </ModalHeader>

      <ModalBody className="bg-bg-secondary/30 dark:bg-bg-dark/50">
        <form id="tutor-form" onSubmit={handleFormSubmit} className="space-y-8 max-w-4xl mx-auto py-2">
          {existingTutor && (
            <div className="flex items-center space-x-3 p-3 bg-info-50 dark:bg-info-500/10 border border-info-200 dark:border-info-500/20 rounded-lg mb-4">
              <svg className="h-5 w-5 text-info-700 dark:text-info-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
              </svg>
              <span className="text-sm font-medium text-info-700 dark:text-info-400">
                Persona ya registrada — datos precargados. Puedes modificarlos antes de guardar.
              </span>
            </div>
          )}
          <Tabs
            options={[
              { id: 'identificacion', label: 'Identificación', errorCount: errorsByTab['identificacion'] },
              { id: 'perfil-contacto', label: 'Perfil y Contacto', errorCount: errorsByTab['perfil-contacto'] },
              { id: 'laboral', label: 'Laboral', errorCount: errorsByTab['laboral'] },
              { id: 'asignaciones', label: 'Asignaciones', errorCount: errorsByTab['asignaciones'] },
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
                    onClick={() => setExistingPerson(null)}
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
                      name="phoneAreaCode"
                      control={control}
                      render={({ field }) => (
                        <CustomSelect
                          id="phoneAreaCode"
                          options={(options["PREFIJO"] || []).map(o => ({ value: String(o.value), label: o.label }))}
                          placeholder="0412"
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          value={String(field.value ?? "")}
                          disabled={viewOnlyMode}
                          error={!!errors.phoneAreaCode}
                          onAddNew={openAddValueModal ? () => openAddValueModal("PREFIJO", "phoneAreaCode", "Agregar Prefijo Telefónico") : undefined}
                          addNewLabel="Nueva opción"
                        />
                      )}
                    />
                    {errors.phoneAreaCode && (
                      <p className="mt-1 text-xs text-red-500">{errors.phoneAreaCode.message as string}</p>
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

          {/* ======================== Laboral ======================== */}
          <div hidden={tabsState.activeTab !== 'laboral'} role="tabpanel">
            <h3 className="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Información Laboral</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div>
                <Label>Condición <span className="text-red-500">*</span></Label>
                <Controller
                  name="condition"
                  control={control}
                  rules={{ required: "La condición es obligatoria" }}
                  render={({ field: { onChange, value } }) => (
                    <CustomSelect
                      value={value}
                      onChange={onChange}
                      options={CONDITION_OPTIONS}
                      error={!!errors.condition}
                      disabled={viewOnlyMode}
                      onAddNew={() => openAddValueModal("Condición", "condition", "Agregar Condición")}
                    />
                  )}
                />
              </div>
              <div>
                <Label>Dedicación <span className="text-red-500">*</span></Label>
                <Controller
                  name="dedication"
                  control={control}
                  rules={{ required: "La dedicación es obligatoria" }}
                  render={({ field: { onChange, value } }) => (
                    <CustomSelect
                      value={value}
                      onChange={onChange}
                      options={DEDICATION_OPTIONS}
                      error={!!errors.dedication}
                      disabled={viewOnlyMode}
                      onAddNew={() => openAddValueModal("Dedicación", "dedication", "Agregar Dedicación")}
                    />
                  )}
                />
              </div>
              <div>
                <Label>Categoría <span className="text-red-500">*</span></Label>
                <Controller
                  name="category"
                  control={control}
                  rules={{ required: "La categoría es obligatoria" }}
                  render={({ field: { onChange, value } }) => (
                    <CustomSelect
                      value={value}
                      onChange={onChange}
                      options={CATEGORY_OPTIONS}
                      error={!!errors.category}
                      disabled={viewOnlyMode}
                      onAddNew={() => openAddValueModal("Categoría", "category", "Agregar Categoría")}
                    />
                  )}
                />
              </div>
              <div>
                <Label>Profesión / Título <span className="text-red-500">*</span></Label>
                <Controller
                  name="profession"
                  control={control}
                  rules={{ required: "La profesión es obligatoria" }}
                  render={({ field: { onChange, value } }) => (
                    <CustomSelect
                      value={value}
                      onChange={onChange}
                      options={PROFESSION_OPTIONS}
                      error={!!errors.profession}
                      disabled={viewOnlyMode}
                      onAddNew={() => openAddValueModal("Profesión", "profession", "Agregar Profesión")}
                    />
                  )}
                />
              </div>
              <div>
                <Label>Título <span className="text-red-500">*</span></Label>
                <Controller
                  name="titulo"
                  control={control}
                  rules={{ required: "El grado de instrucción es obligatorio" }}
                  render={({ field: { onChange, value } }) => (
                    <CustomSelect
                      value={value}
                      onChange={onChange}
                      options={TITULO_OPTIONS}
                      error={!!errors.titulo}
                      disabled={viewOnlyMode}
                      onAddNew={() => openAddValueModal("Título", "titulo", "Agregar Grado de Instrucción")}
                    />
                  )}
                />
              </div>
            </div>
          </div>

          {/* ======================== Asignaciones ======================== */}
          <div hidden={tabsState.activeTab !== 'asignaciones'} role="tabpanel">
            <h3 className="mb-4 text-sm font-semibold text-gray-700 dark:text-gray-300">Asignaciones</h3>
            <div className="grid grid-cols-1 gap-6">
              <Controller
                name="carreras"
                control={control}
                rules={{ required: "Debe seleccionar al menos una carrera" }}
                render={({ field: { onChange, value } }) => (
                  <MultiSelect
                    label="Carreras asignadas"
                    value={value}
                    onChange={onChange}
                    options={careerOptions}
                    error={!!errors.carreras}
                    disabled={viewOnlyMode}
                    onAddNew={() => setIsCareerModalOpen(true)}
                  />
                )}
              />
            </div>
          </div>

        </form>
      </ModalBody>

        <ModalFooter className="sticky-footer">
          {!viewOnlyMode && (
            <>
              <Button
                variant="outline"
                onClick={handleCloseAttempt}
                disabled={isLoading || confirmSaving}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleFormSubmit}
                loading={isLoading || confirmSaving}
                loadingText="Guardando..."
                disabled={!allRequiredFilled || !isDirty || isLoading || confirmSaving}
              >
                {editingTutor || existingTutor ? 'Guardar Cambios' : 'Guardar Tutor'}
              </Button>
            </>
          )}
          {viewOnlyMode && (
            <Button variant="outline" onClick={handleClose}>
              Cerrar
            </Button>
          )}
        </ModalFooter>
      </Modal>
      <UnifiedDialog
        isOpen={confirmSaveOpen}
        onClose={() => { submittingRef.current = false; setConfirmSaveOpen(false); }}
        onConfirm={async () => {
          if (pendingSave) {
            setConfirmSaving(true);
            try {
              if (editingTutor || existingTutor) {
                await onSave(pendingSave as UpdateTutorPayload);
              } else {
                await onSave(pendingSave as CreateTutorPayload);
              }
              setConfirmSaveOpen(false);
            } catch (error) {
              console.error("Error saving tutor:", error);
            } finally {
              submittingRef.current = false;
              setConfirmSaving(false);
            }
          }
        }}
        title={editingTutor || existingTutor ? CONFIRM_MESSAGES.update("el tutor").title : CONFIRM_MESSAGES.create("el tutor").title}
        message={editingTutor || existingTutor ? CONFIRM_MESSAGES.update("el tutor").message : CONFIRM_MESSAGES.create("el tutor").message}
        confirmLabel={editingTutor || existingTutor ? CONFIRM_MESSAGES.update("el tutor").confirmLabel : CONFIRM_MESSAGES.create("el tutor").confirmLabel}
        variant="confirm"
      />
      <UnifiedDialog
        isOpen={showConfirmation}
        onClose={cancelClose}
        onConfirm={confirmClose}
        title={SYSTEM_DIALOGS.closeWithoutSaving.title}
        message={SYSTEM_DIALOGS.closeWithoutSaving.message}
        confirmLabel={SYSTEM_DIALOGS.closeWithoutSaving.confirmLabel}
        cancelLabel={SYSTEM_DIALOGS.closeWithoutSaving.cancelLabel}
        variant="confirm"
      />
      <CareerModal
        isOpen={isCareerModalOpen}
        onClose={() => {
          setIsCareerModalOpen(false);
          setEditingCareer(null);
        }}
        onSave={(career) => {
          setCareers(prev => {
            if (editingCareer) {
              return prev.map(c =>
                c.careerId === editingCareer.careerId
                  ? { ...career, careerId: editingCareer.careerId, creationDate: editingCareer.creationDate } as Career
                  : c
              );
            }
            return [...prev, { ...career, careerId: Date.now(), creationDate: new Date() } as Career];
          });
          setIsCareerModalOpen(false);
        }}
        editingCareer={editingCareer}
        internshipOptions={internshipOptions}
        onAddInternshipType={() => {
          setEditingInternshipType(null);
          setIsInternshipTypeModalOpen(true);
        }}
      />
      <InternshipTypeModal
        isOpen={isInternshipTypeModalOpen}
        onClose={() => {
          setIsInternshipTypeModalOpen(false);
          setEditingInternshipType(null);
        }}
        onSave={(item) => {
          setExistingInternshipTypes(prev => {
            if (editingInternshipType) {
              return prev.map(it =>
                it.id === editingInternshipType.id
                  ? { ...item, id: editingInternshipType.id, creationDate: editingInternshipType.creationDate }
                  : it
              );
            }
            return [...prev, { ...item, id: Date.now(), creationDate: new Date() }];
          });
          setIsInternshipTypeModalOpen(false);
        }}
        editingItem={editingInternshipType}
      />
    </>
  );
}