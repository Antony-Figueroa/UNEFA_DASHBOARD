import { useEffect, useState, useMemo, lazy } from "react";
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
import Badge from "../../../components/ui/badge/Badge";
import { useUnsavedChanges } from "../../../hooks/useUnsavedChanges";
import UnifiedDialog from "../../../components/ui/dialog/UnifiedDialog";
import { getCareers } from "../../careers/services/careersService";
import { Career } from "../../careers/types";
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
import { formatCedulaDisplay, formatPhoneLocalDisplay, formatPhoneDisplay, cleanPhone, CEDULA_MAX_LENGTH, CEDULA_MAX_DIGITS, PHONE_LOCAL_MAX_LENGTH } from "../../../utils/inputFormat";
import { getTutorByCi } from "../services/tutorsService";

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
   const [existingTutor, setExistingTutor] = useState<any | null>(null);
   const [viewOnlyMode, setViewOnlyMode] = useState(false);
   
   // State for career modal
   const [isCareerModalOpen, setIsCareerModalOpen] = useState(false);
   const [editingCareer, setEditingCareer] = useState<Career | null>(null);
   const [internshipOptions, setInternshipOptions] = useState<InternshipTypeOption[]>([]);
   
   // State for internship type modal (triggered from CareerModal)
   const [isInternshipTypeModalOpen, setIsInternshipTypeModalOpen] = useState(false);
   const [editingInternshipType, setEditingInternshipType] = useState<InternshipType | null>(null);
   const [existingInternshipTypes, setExistingInternshipTypes] = useState<InternshipType[]>([]);

  // Handle identification number input change with formatting
  const handleIdentificationNumberChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const digitsOnly = input.replace(/\D/g, '').substring(0, CEDULA_MAX_DIGITS);
    const formatted = formatCedulaDisplay(digitsOnly, false);
    setDisplayIdentificationNumber(formatted);
    setValue("identificationNumber", digitsOnly, { shouldValidate: true, shouldDirty: true });
    
    // Si se cambia la cédula y hay un existingTutor, limpiar el formulario
    if (existingTutor) {
      const currentStoredDigits = existingTutor.identificationNumber?.replace(/\D/g, '') || '';
      // Si el usuario borró al menos 1 carácter o cambió algo
      if (digitsOnly.length < currentStoredDigits.length || digitsOnly !== currentStoredDigits) {
        setExistingTutor(null);
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
    if (!existingTutor && !editingTutor && (digitsOnly.length === 7 || digitsOnly.length === 8)) {
      setIsCheckingCi(true);
      const prefix = watch("identificationPrefix") || 'V';
      const fullCi = `${prefix}-${digitsOnly}`;
      try {
        const existingData = await getTutorByCi(fullCi);
        if (existingData) {
          setExistingTutor(existingData);
          setViewOnlyMode(true);

          const areaCode = existingData.phone ? existingData.phone.substring(0, 4) : "";
          const phoneNumber = existingData.phone ? existingData.phone.substring(4) : "";

          setValue("identificationPrefix", existingData.identificationPrefix || 'V');
          setDisplayIdentificationNumber(formatCedulaDisplay(existingData.identificationNumber || ''));
          setValue("identificationNumber", existingData.identificationNumber || '');
          setValue("firstName", existingData.firstName || "");
          setValue("middleName", existingData.middleName || "");
          setValue("lastName", existingData.lastName || "");
          setValue("secondLastName", existingData.secondLastName || "");
          setValue("sex", existingData.sex || "");
          setValue("phoneAreaCode", areaCode);
          setDisplayPhoneNumber(formatPhoneLocalDisplay(phoneNumber));
          setValue("phoneNumber", phoneNumber);
          setValue("email", existingData.email || "");
          setValue("condition", existingData.condition || "");
          setValue("dedication", existingData.dedication || "");
          setValue("category", existingData.category || "");
          setValue("profession", existingData.profession || "");
          setValue("titulo", existingData.titulo || "");
          setValue("carreras", existingData.carreras || []);
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
    const cleaned = cleanPhone(input);
    const formatted = formatPhoneLocalDisplay(cleaned);
    setDisplayPhoneNumber(formatted);
    setValue("phoneNumber", cleaned, { shouldValidate: true, shouldDirty: true });
  };

  // Estado para agregar nuevos valores a las listas
  const [isValueModalOpen, setIsValueModalOpen] = useState(false);
  const [valueModalTitle, setValueModalTitle] = useState<string>("");
  const [targetListName, setTargetListName] = useState<string>("");
  const [targetField, setTargetField] = useState<keyof TutorFormData | "">("");
  const [newValueInput, setNewValueInput] = useState<string>("");
  const [savingNewValue, setSavingNewValue] = useState(false);

  // Fallbacks for when t_list data is not available
  const NATIONALITY_OPTIONS = options["Nacionalidad"] || [
    { value: "V", label: "V" },
    { value: "E", label: "E" },
  ];

  const SEX_OPTIONS = options["Sexo"] || [
    { value: "FEMENINO", label: "FEMENINO" },
    { value: "MASCULINO", label: "MASCULINO" },
  ];

  const PHONE_AREA_OPTIONS = options["PREFIJO"] || [];

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

  const tutorSchema = useMemo(() => z.object({
    identificationPrefix: z.string().min(1, "Seleccione el tipo"),
    identificationNumber: z.string()
      .min(6, "La cédula debe tener al menos 6 dígitos")
      .max(CEDULA_MAX_DIGITS, `La cédula no puede exceder los ${CEDULA_MAX_DIGITS} dígitos`)
      .regex(/^\d+$/, "Solo se admiten números"),
    firstName: z.string()
      .min(1, "El primer nombre es obligatorio")
      .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, "Solo se admiten letras y signos diacríticos")
      .transform(val => val.toUpperCase()),
    middleName: z.string()
      .transform(val => val.toUpperCase())
      .refine(val => !val || /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(val), "Solo se admiten letras y signos diacríticos")
      .optional(),
    lastName: z.string()
      .min(1, "El primer apellido es obligatorio")
      .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, "Solo se admiten letras y signos diacríticos")
      .transform(val => val.toUpperCase()),
    secondLastName: z.string()
      .transform(val => val.toUpperCase())
      .refine(val => !val || /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(val), "Solo se admiten letras y signos diacríticos")
      .optional(),
    sex: z.string().min(1, "Seleccione el sexo"),
    phoneAreaCode: z.string().min(1, "El código de área es obligatorio"),
    phoneNumber: z.string()
      .length(7, "El número de teléfono debe tener exactamente 7 dígitos")
      .regex(/^\d+$/, "Solo se admiten números"),
    email: z.string().email("Formato de correo electrónico inválido").min(1, "El correo es obligatorio").transform(val => val.toUpperCase()),
    condition: z.string().min(1, "La condición es obligatoria").transform(val => val.toUpperCase()),
    dedication: z.string().min(1, "La dedicación es obligatoria").transform(val => val.toUpperCase()),
    category: z.string().min(1, "La categoría es obligatoria").transform(val => val.toUpperCase()),
    profession: z.string().min(1, "El título es obligatorio").transform(val => val.toUpperCase()),
    titulo: z.string().min(1, "El grado de instrucción es obligatorio").transform(val => val.toUpperCase()),
    carreras: z.array(z.string()).min(1, "Debe seleccionar al menos una carrera"),
  }).superRefine((data, ctx) => {
    // Validar duplicidad de cédula
    const isIdDuplicate = tutors.some(
      t => t.tutorId !== editingTutor?.tutorId && 
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
      t => t.tutorId !== editingTutor?.tutorId && 
           t.email.toLowerCase() === data.email.toLowerCase()
    );

    if (isEmailDuplicate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Este correo electrónico ya está en uso",
        path: ["email"],
      });
    }
  }), [tutors, editingTutor]);

  type TutorFormData = z.infer<typeof tutorSchema>;

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    setError,
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

  useEffect(() => {
    const fetchCareers = async () => {
      setCareersLoading(true);
      try {
        const data = await getCareers();
        setCareers(data.filter(c => c.status));
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
            {editingTutor ? "Editar Tutor" : "Registrar Tutor"}
          </span>
          <p className="text-sm text-text-secondary">Complete la información del tutor académico.</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
            {/* Cédula */}
            <div>
              <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Cédula *</label>
              <div className="flex gap-2">
                <div className="w-24">
                  <Controller
                    name="identificationPrefix"
                    control={control}
                    render={({ field }) => (
                      <CustomSelect
                        id="identificationPrefix"
                        options={NATIONALITY_OPTIONS.map(opt => ({ value: String(opt.value), label: opt.label }))}
                        placeholder="Tipo"
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        value={String(field.value)}
                    disabled={isInUse || !!editingTutor}
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
                    disabled={isInUse || !!editingTutor}
                    maxLength={CEDULA_MAX_LENGTH}
                    className="tracking-widest"
                    onBlur={async (e) => {
                      if (!existingTutor && !editingTutor) {
                        const val = e.target.value;
                        const digitsOnly = val.replace(/\D/g, '').substring(0, CEDULA_MAX_DIGITS);
                        if (digitsOnly.length >= 6) {
                          setIsCheckingCi(true);
                          const prefix = watch("identificationPrefix") || 'V';
                          const fullCi = `${prefix}-${digitsOnly}`;
                          try {
                            const existingData = await getTutorByCi(fullCi);
                            if (existingData) {
                              setExistingTutor(existingData);
                              setViewOnlyMode(true);

                              const areaCode = existingData.phone ? existingData.phone.substring(0, 4) : "";
                              const phoneNumber = existingData.phone ? existingData.phone.substring(4) : "";

                              setValue("identificationPrefix", existingData.identificationPrefix || 'V');
                              setDisplayIdentificationNumber(formatCedulaDisplay(existingData.identificationNumber || ''));
                              setValue("identificationNumber", existingData.identificationNumber || '');
                              setValue("firstName", existingData.firstName || "");
                              setValue("middleName", existingData.middleName || "");
                              setValue("lastName", existingData.lastName || "");
                              setValue("secondLastName", existingData.secondLastName || "");
                              setValue("sex", existingData.sex || "");
                              setValue("phoneAreaCode", areaCode);
                              setDisplayPhoneNumber(formatPhoneLocalDisplay(phoneNumber));
                              setValue("phoneNumber", phoneNumber);
                              setValue("email", existingData.email || "");
                              setValue("condition", existingData.condition || "");
                              setValue("dedication", existingData.dedication || "");
                              setValue("category", existingData.category || "");
                              setValue("profession", existingData.profession || "");
                              setValue("titulo", existingData.titulo || "");
                              setValue("carreras", existingData.carreras || []);

                              // Toast removido por solicitud del usuario
                              // Las pistas visuales son suficientes
                            }
                          } catch (err) {
                            console.error("Error checking CI:", err);
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

            {/* Primer Nombre */}
            <div>
              <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Primer Nombre *</label>
              <Input
                {...register("firstName")}
                placeholder="INGRESE PRIMER NOMBRE"
                error={!!errors.firstName}
                disabled={viewOnlyMode}
                onChange={(e) => {
                  e.target.value = e.target.value.toUpperCase();
                  register("firstName").onChange(e);
                }}
              />
              {errors.firstName && (
                <p className="mt-1 text-xs text-red-500">{errors.firstName.message}</p>
              )}
            </div>

            {/* Segundo Nombre */}
            <div>
              <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Segundo Nombre</label>
              <Input
                {...register("middleName")}
                placeholder="INGRESE SEGUNDO NOMBRE"
                error={!!errors.middleName}
                disabled={viewOnlyMode}
                onChange={(e) => {
                  e.target.value = e.target.value.toUpperCase();
                  register("middleName").onChange(e);
                }}
              />
              {errors.middleName && (
                <p className="mt-1 text-xs text-red-500">{errors.middleName.message}</p>
              )}
            </div>

            {/* Primer Apellido */}
            <div>
              <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Primer Apellido *</label>
              <Input
                {...register("lastName")}
                placeholder="INGRESE PRIMER APELLIDO"
                error={!!errors.lastName}
                disabled={viewOnlyMode}
                onChange={(e) => {
                  e.target.value = e.target.value.toUpperCase();
                  register("lastName").onChange(e);
                }}
              />
              {errors.lastName && (
                <p className="mt-1 text-xs text-red-500">{errors.lastName.message}</p>
              )}
            </div>

            {/* Segundo Apellido */}
            <div>
              <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Segundo Apellido</label>
              <Input
                {...register("secondLastName")}
                placeholder="INGRESE SEGUNDO APELLIDO"
                error={!!errors.secondLastName}
                disabled={viewOnlyMode}
                onChange={(e) => {
                  e.target.value = e.target.value.toUpperCase();
                  register("secondLastName").onChange(e);
                }}
              />
              {errors.secondLastName && (
                <p className="mt-1 text-xs text-red-500">{errors.secondLastName.message}</p>
              )}
            </div>

            {/* Sexo */}
            <div>
              <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Sexo *</label>
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
                <p className="mt-1 text-xs text-red-500">{errors.sex.message}</p>
              )}
            </div>

            {/* Teléfono */}
            <div>
              <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Teléfono *</label>
              <div className="flex gap-2">
                <div className="w-28">
                  <Controller
                    name="phoneAreaCode"
                    control={control}
                    render={({ field }) => (
                      <CustomSelect
                        id="phoneAreaCode"
                        options={PHONE_AREA_OPTIONS.map(opt => ({ value: String(opt.value), label: opt.label }))}
                        placeholder="Prefijo"
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        value={String(field.value)}
                        disabled={viewOnlyMode}
                        error={!!errors.phoneAreaCode}
                        onAddNew={() => openAddValueModal("PREFIJO", "phoneAreaCode", "Agregar Código de Área")}
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
                    error={!!errors.phoneNumber || !!errors.phoneAreaCode}
                    disabled={viewOnlyMode}
                    maxLength={PHONE_LOCAL_MAX_LENGTH}
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

            {/* Correo */}
            <div className="lg:col-span-2">
              <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Correo Electrónico *</label>
              <Input
                {...register("email")}
                placeholder="INGRESE CORREO ELECTRÓNICO"
                type="email"
                error={!!errors.email}
                disabled={viewOnlyMode}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/* Condición */}
            <div>
              <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Condición *</label>
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
              <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Dedicación *</label>
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
              <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Categoría *</label>
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
            <div className="lg:col-span-1">
              <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Título *</label>
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
            <div className="lg:col-span-1">
              <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Grado de instrucción *</label>
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

            {/* Carreras */}
                 <div className="lg:col-span-3">
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
                 </div>
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
        title={editingTutor ? "Confirmar actualización" : "Confirmar registro"}
        message={editingTutor ? "¿Desea actualizar los datos del tutor?" : "¿Desea guardar el nuevo tutor?"}
        confirmLabel={editingTutor ? "Actualizar" : "Guardar"}
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
        setCareers(allCareers.filter(c => c.status));
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
