/**
 * @file PreEnrollmentModal.tsx
 * @description Componente de modal para la creación y edición de pre-inscripciones.
 * Integra validación con Zod, búsqueda automática de estudiantes y generación de matrícula.
 */

import { useEffect, useState, useCallback } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Input from "../../../components/form/input/InputField";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../../components/ui/modal";
import { cn } from "../../../utils/cn";
import { PreEnrollment, CreatePreEnrollmentPayload, UpdatePreEnrollmentPayload } from "../types";
import { InternshipType } from "../../internship-types/types";
import Button from "../../../components/ui/button/Button";

import CustomSelect from "../../../components/form/CustomSelect";
import Badge from "../../../components/ui/badge/Badge";
import { useToast } from "../../../context/toast";
import { Student } from "../../students/types";
import { Periodo } from "../../periods/types";
import { getStudents } from "../../students/services/studentsService";
import { getPeriods } from "../../periods/services/periodService";
import { getInternshipTypes, getInternshipTypesByCareer } from "../../internship-types/services/internshipTypesService";
import { getCareers } from "../../careers/services/careersService";
import { getPreEnrollments, getCompletedPracticeTypes, checkSequential, getStudentPracticeHistory, CheckSequentialResult } from "../services/preEnrollmentService";
import * as enrollmentService from "../../enrollment/services/enrollmentService";
import { useUnsavedChanges } from "../../../hooks/useUnsavedChanges";
import { unwrapData } from "../../../api/crudServiceFactory";
import UnifiedDialog from "../../../components/ui/dialog/UnifiedDialog";
import { CONFIRM_MESSAGES, SYSTEM_DIALOGS } from "../../../components/ui/dialog/DialogConfig";
import { useLists } from "../../lists/hooks/useLists";
import { generateMatricula } from "../../../utils/matricula";
import { formatCedulaDisplay, formatPhoneDisplay, CEDULA_MAX_DIGITS, CEDULA_MAX_LENGTH, PASSPORT_MAX_LENGTH } from "../../../utils/inputFormat";
import { UserCircleIcon, ShieldCheckIcon, DocsIcon, InfoIcon, SearchIcon, PlusIcon } from "../../../icons";
import { NAME_PATTERN, isSafeInput } from "../../../utils/inputValidation";
import { useCurrentPeriod } from "../../periods/hooks/useCurrentPeriod";

/**
 * Propiedades del componente PreEnrollmentModal.
 */
interface PreEnrollmentModalProps {
  /** Indica si el modal está visible */
  isOpen: boolean;
  /** Función para cerrar el modal */
  onClose: () => void;
  /** Función que se ejecuta al guardar los datos */
  onSave: (payload: CreatePreEnrollmentPayload | UpdatePreEnrollmentPayload) => Promise<void> | void;
  /** Registro que se está editando (opcional) */
  editingEntry?: PreEnrollment | null;
  /** Opciones de carreras para el selector */
  careerOptions: { value: string; label: string }[];
  /** Estado de carga de la operación de guardado */
  isLoading?: boolean;
  /** Cédula inicial opcional para pre-llenar el formulario */
  initialCi?: string | null;
}

/**
 * Esquema de validación para el formulario de pre-inscripción.
 * Define las reglas y mensajes de error para cada campo.
 */
const preEnrollmentSchema = z.object({
  /** Prefijo de identificación (V/E/P) */
  identificationPrefix: z.string().min(1, "Seleccione un prefijo"),
  /** Número de identificación (dígitos o alfanumérico para pasaporte) */
  identificationNumber: z.string()
    .min(1, "La identificación es obligatoria")
    .regex(/^[A-Za-z0-9]+$/, "Solo se admiten letras y números"),
  /** Nombre completo del estudiante (autocompletado) */
  studentName: z.string()
    .min(1, "El nombre del estudiante es obligatorio")
    .max(100, "El nombre es demasiado largo")
    .regex(NAME_PATTERN, "Solo letras y espacios")
    .refine(val => isSafeInput(val), { message: "Caracteres no permitidos" }),
  /** Teléfono de contacto (autocompletado) */
  phone: z.string()
    .min(1, "El teléfono es obligatorio"),
  /** Período académico para la pre-inscripción */
  period: z.string().min(1, "Seleccione el período"),
  /** Carrera */
  careerId: z.string().min(1, "Seleccione la carrera"),
  /** Semestre */
  semester: z.string().min(1, "Seleccione el semestre"),
  /** Sección */
  section: z.string().min(1, "Seleccione la sección"),
  /** Régimen */
  regime: z.string().min(1, "Seleccione el régimen"),
  /** Tipo de práctica */
  practiceType: z.string().min(1, "Seleccione el tipo de práctica"),
  /** Código de matrícula generado automáticamente */
  enrollmentCode: z.string().min(1, "La matrícula es obligatoria"),
  /** Nombre de la carrera (informativo) */
  careerName: z.string().optional(),
  /** Observaciones */
  observations: z.string()
    .max(500, "Las observaciones son demasiado largas")
    .refine(val => isSafeInput(val), { message: "Caracteres no permitidos" })
    .optional(),
});

/**
 * Tipo deducido del esquema de validación para los datos del formulario.
 */
type PreEnrollmentFormData = z.infer<typeof preEnrollmentSchema>;

/**
 * Componente PreEnrollmentModal.
 * 
 * Maneja la creación y edición de registros de pre-inscripción.
 * Incluye búsqueda automática de estudiantes, validación de estado de inscripción
 * y generación automática de matrícula basada en la carrera y semestre.
 * 
 * @param props - Propiedades del componente.
 * @returns Nodo de React que representa el modal.
 */
export default function PreEnrollmentModal({
  isOpen,
  onClose,
  onSave,
  editingEntry,
  isLoading = false,
  initialCi = null,
  careerOptions = [],
}: PreEnrollmentModalProps) {
  const { currentPeriod } = useCurrentPeriod();
  const [isSearching, setIsSearching] = useState(false);
  const [periods, setPeriods] = useState<Periodo[]>([]);
  const [suggestions, setSuggestions] = useState<Student[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [options, setOptions] = useState<Record<string, { value: string; label: string }[]>>({});
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingData, setPendingData] = useState<PreEnrollmentFormData | null>(null);
  const [practiceTypeOptions, setPracticeTypeOptions] = useState<{ value: string; label: string }[]>([]);
  const [internshipTypesWithIds, setInternshipTypesWithIds] = useState<InternshipType[]>([]);
  const { fetchMultipleLists } = useLists();
  const { addToast } = useToast();

  // State for display values with formatting
  const [displayIdentificationNumber, setDisplayIdentificationNumber] = useState("");
  const [_displayPhone, setDisplayPhone] = useState("");

  // State for sequential blocking reason display
  const [blockingInfo, setBlockingInfo] = useState<{ message: string; reason: string | null } | null>(null);

  // Pre-submit sequential validation result
  const [preSubmitSequential, setPreSubmitSequential] = useState<CheckSequentialResult | null>(null);
  const [isCheckingSequential, setIsCheckingSequential] = useState(false);

  // Retiro justificado choice modal state
  const [showJustifiedChoiceModal, setShowJustifiedChoiceModal] = useState(false);
  const [justifiedChoice, setJustifiedChoice] = useState<'continue' | 'restart' | null>(null);

  // State for student practice history (previous practices in any career)
  const [studentPracticeHistory, setStudentPracticeHistory] = useState<Array<{
    practiceType: string;
    period: string;
    status: string;
    statusCode: number;
    grade: number;
    careerName: string;
  }>>([]);

  // Handle identification number input change with formatting (sin prefijo porque ya está en el select)
  const handleIdentificationNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const prefix = watch("identificationPrefix") || "V";
    const isPassport = prefix === "P";
    let cleaned: string;
    if (isPassport) {
      cleaned = input.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, PASSPORT_MAX_LENGTH);
      setDisplayIdentificationNumber(cleaned);
    } else {
      cleaned = input.replace(/\D/g, '').substring(0, CEDULA_MAX_DIGITS);
      const formatted = formatCedulaDisplay(cleaned, false);
      setDisplayIdentificationNumber(formatted);
    }
    setValue("identificationNumber", cleaned, { shouldValidate: true, shouldDirty: true });
  };

  /**
   * Opciones de nacionalidad/prefijo de identificación.
   * Se cargan dinámicamente o usan valores por defecto.
   */
  const NATIONALITY_OPTIONS = options["Nacionalidad"] || [
    { value: "V", label: "V" },
    { value: "E", label: "E" },
    { value: "P", label: "P" },
  ];

  const SEMESTER_OPTIONS = options["Semestre"] || [];
  const SECTION_OPTIONS = options["Seccion"] || [];
  const REGIME_OPTIONS = options["Regimen/Turno"] || [];

  const { 
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    getValues,
    watch,
    formState: { errors, isDirty, isValid },
    setError,
    clearErrors,
  } = useForm<PreEnrollmentFormData>({
    resolver: zodResolver(preEnrollmentSchema),
    defaultValues: {
      identificationPrefix: "V",
      identificationNumber: "",
      studentName: "",
      phone: "",
      period: "",
      careerId: "",
      semester: "",
      section: "",
      regime: "",
      practiceType: "",
      enrollmentCode: "",
      careerName: "",
    },
  });

  const idNumber = useWatch({ control, name: "identificationNumber" });
  const idPrefix = useWatch({ control, name: "identificationPrefix" });
  
  // Watch all fields for live verification panel
  const watchedStudentName = useWatch({ control, name: "studentName" });
  const watchedCareerId = useWatch({ control, name: "careerId" });
  const watchedCareerName = useWatch({ control, name: "careerName" });
  const watchedSemester = useWatch({ control, name: "semester" });
  const watchedSection = useWatch({ control, name: "section" });
  const watchedRegime = useWatch({ control, name: "regime" });
  const watchedPracticeType = useWatch({ control, name: "practiceType" });
  const watchedEnrollmentCode = useWatch({ control, name: "enrollmentCode" });

  const handleAddSection = () => {
    const evt = new CustomEvent("preenrollment:addListValue", { detail: { listName: "Seccion" } });
    window.dispatchEvent(evt);
  };

  /**
   * Efecto para cargar la lista de estudiantes disponibles al abrir el modal.
   * Filtra estudiantes que no tienen registros activos en prácticas.
   */
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await getStudents();
        const availableStudents = unwrapData(response.data).filter((s: Student) => !s.isInUse && s.status);
        setAllStudents(availableStudents);
      } catch (error) {
        console.error("[PreEnrollmentModal] Error al cargar estudiantes:", error);
      }
    };
    if (isOpen && !editingEntry) {
      fetchStudents();
    }
  }, [isOpen, editingEntry]);

  /**
   * Efecto para manejar las sugerencias de búsqueda de estudiantes
   * basadas en el número de identificación ingresado.
   */
  useEffect(() => {
    if (idNumber && idNumber.length >= 3 && !editingEntry) {
      const filtered = allStudents.filter((s: Student) => 
        s.identificationNumber.startsWith(idNumber) && 
        s.identificationPrefix === idPrefix
      );
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [idNumber, idPrefix, allStudents, editingEntry]);

  const {
    showConfirmation,
    handleCloseAttempt,
    confirmClose,
    cancelClose,
  } = useUnsavedChanges(isDirty, onClose);

  /**
   * Efecto para cargar períodos académicos y tipos de práctica.
   * Usa el hook centralizado para obtener el periodo actual.
   */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [periodData, internshipTypesData] = await Promise.all([
          getPeriods(),
          getInternshipTypes()
        ]);

        setPracticeTypeOptions(
          internshipTypesData.map((t: any) => ({ value: t.name || "", label: t.name || "" }))
        );
        
        // Usar hook centralizado para periodo actual
        const activePeriod = currentPeriod || (periodData.length > 0 
          ? periodData.find((p: Periodo) => p.periodStatus === 1 && p.status) 
          : null);
        
        let selectedPeriods: Periodo[] = [];
        if (activePeriod) {
          selectedPeriods = [activePeriod];
        }
        
        // Si estamos editando, asegurar que el período original esté incluido
        if (editingEntry) {
          const originalPeriod = periodData.find((p: Periodo) => p.description === editingEntry.period);
          if (originalPeriod && originalPeriod.periodId !== activePeriod?.periodId) {
            selectedPeriods.push(originalPeriod);
          }
        }

        setPeriods(selectedPeriods);
        
        // Auto-seleccionar
        if (!editingEntry && !getValues("period") && activePeriod) {
          setValue("period", activePeriod.description);
        }
      } catch (error) {
        console.error("[PreEnrollmentModal] Error al cargar períodos/tipos:", error);
      }
    };

    if (isOpen) {
      fetchData();
    }
  }, [isOpen, editingEntry, setValue, getValues, currentPeriod]);

  /**
   * Efecto para cargar listas desplegables dinámicas (ej. Nacionalidad).
   */
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const data = await fetchMultipleLists(["Nacionalidad", "Semestre", "Seccion", "Regimen/Turno"]);
        const mappedOptions: Record<string, { value: string; label: string }[]> = {};
        
        Object.entries(data).forEach(([key, values]) => {
          const normalizedKey = key.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
          mappedOptions[key] = (values as any[]).map((v: any) => ({
            value: (normalizedKey === "NACIONALIDAD" && v.abbreviation) ? v.abbreviation.toUpperCase() : v.name,
            label: (normalizedKey === "NACIONALIDAD" && v.abbreviation) ? v.abbreviation.toUpperCase() : v.name
          }));
        });
        
        setOptions(mappedOptions);
      } catch (error) {
        console.error("[PreEnrollmentModal] Error al cargar opciones dinámicas:", error);
      }
    };

    if (isOpen) {
      loadOptions();
    }
  }, [isOpen, fetchMultipleLists]);

  /**
   * Limpia los campos relacionados con los datos del estudiante en el formulario.
   * Se utiliza cuando no se encuentra un estudiante o la búsqueda es inválida.
   */
const clearStudentFields = useCallback(() => {
    setValue("studentName", "");
    setValue("phone", "");
    setDisplayPhone("");
    clearErrors("identificationNumber");
  }, [setValue, clearErrors]);

  /**
   * Busca un estudiante en el sistema por su prefijo y número de identificación.
   * Verifica si el estudiante existe, si ya tiene inscripciones o pre-inscripciones activas,
   * y carga automáticamente sus datos y genera la matrícula si es elegible.
   * 
   * @param prefix - Prefijo de identificación (V/E).
   * @param number - Número de identificación.
   */
  const lookupStudent = useCallback(async (prefix: string, number: string) => {
    if (number.length < 5) {
      clearStudentFields();
      setStudentPracticeHistory([]);
      return;
    }
    
    setIsSearching(true);
    try {
      const [studentsResponse, enrollments, preEnrollments] = await Promise.all([
        getStudents(),
        enrollmentService.getEnrollments(),
        getPreEnrollments(),
      ]);
      const student = unwrapData(studentsResponse.data).find(
        (s: Student) => s.identificationPrefix === prefix && s.identificationNumber === number
      );

      const alreadyEnrolled = enrollments.find(
        (e: any) =>
          e.identificationPrefix === prefix &&
          e.identificationNumber === number &&
          e.status &&
          e.practicesStatus !== 0 &&   // Excluir RETIRADO (abandono)
          e.practicesStatus !== 5      // Excluir RETIRO_JUSTIFICADO
      );

      if (alreadyEnrolled) {
        clearStudentFields();
        setStudentPracticeHistory([]);
        const message = "El estudiante ya posee una inscripción activa. No puede pre-inscribirse.";
        setError("identificationNumber", {
          type: "manual",
          message,
        });
        return;
      }

      const hasActivePreEnrollment = unwrapData(preEnrollments).some(
        (p: any) => p.identificationPrefix === prefix && p.identificationNumber === number && p.status
      );

      if (hasActivePreEnrollment) {
        clearStudentFields();
        setStudentPracticeHistory([]);
        const message = "El estudiante ya posee una pre-inscripción activa.";;
        setError("identificationNumber", {
          type: "manual",
          message,
        });
        return;
      }

if (student) {
        setValue("studentName", `${student.firstName} ${student.lastName}`, { shouldValidate: true, shouldDirty: true });
        setValue("phone", student.phone || "", { shouldValidate: true, shouldDirty: true });
        setDisplayPhone(formatPhoneDisplay(student.phone || ""));
        clearErrors("identificationNumber");

        // Populate practice history from ALL periods (new backend endpoint)
        const STATUS_LABELS: Record<number, string> = {
          0: 'Retirado (Abandono)',
          1: 'Pre-inscrito',
          2: 'Inscrito',
          3: 'Culminado (Aprobado)',
          4: 'Reprobado',
          5: 'Retiro Justificado',
        };
        try {
          const historyData = await getStudentPracticeHistory(prefix, number);
          const history = historyData.map((p) => ({
            practiceType: p.practiceType || '',
            period: p.period || '',
            status: STATUS_LABELS[p.practicesStatus] || `Estado ${p.practicesStatus}`,
            statusCode: p.practicesStatus,
            grade: p.grade ?? 0,
            careerName: p.careerName || '',
          }));
          setStudentPracticeHistory(history);
        } catch {
          setStudentPracticeHistory([]);
        }
      } else {
        clearStudentFields();
        setStudentPracticeHistory([]);
        const message = "El estudiante no se encuentra registrado.";;
        setError("identificationNumber", {
          type: "manual",
          message,
        });
      }
    } catch (error) {
      console.error("[PreEnrollmentModal] Error al buscar estudiante:", error);
      clearStudentFields();
      setStudentPracticeHistory([]);
    } finally {
      setIsSearching(false);
    }
  }, [setValue, clearErrors, setError, clearStudentFields]);

  useEffect(() => {
    if (!editingEntry) {
      if (idNumber) {
        const timer = setTimeout(() => {
          lookupStudent(idPrefix, idNumber);
        }, 500);
        return () => clearTimeout(timer);
      } else {
        clearStudentFields();
      }
    }
  }, [idNumber, idPrefix, lookupStudent, editingEntry, clearStudentFields]);

  /**
   * Efecto para escuchar eventos de estudiante agregado desde el modal de estudiante.
   * Después de setear los datos básicos, busca el estudiante para completar campos automáticos.
   */
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    
    const handleSetStudentId = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) {
        setValue("identificationPrefix", detail.identificationPrefix || "V", { shouldValidate: true, shouldDirty: true });
        setValue("identificationNumber", detail.identificationNumber || "", { shouldValidate: true, shouldDirty: true });
        setDisplayIdentificationNumber(detail.identificationNumber || "");
        setValue("studentName", detail.firstName && detail.lastName ? `${detail.firstName} ${detail.lastName}` : "", { shouldValidate: true, shouldDirty: true });
        setValue("phone", detail.phone || "", { shouldValidate: true, shouldDirty: true });
        
        // Esperar un momento y luego buscar el estudiante para completar campos automáticos
        timeoutId = setTimeout(() => {
          lookupStudent(detail.identificationPrefix || "V", detail.identificationNumber || "");
        }, 100);
      }
    };
    window.addEventListener("preenrollment:setStudentId", handleSetStudentId as EventListener);
    return () => {
      window.removeEventListener("preenrollment:setStudentId", handleSetStudentId as EventListener);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [setValue, lookupStudent]);

  // Auto-generar enrollment code cuando cambian campos académicos
  useEffect(() => {
    if (!watchedCareerId || !watchedSemester || !watchedSection || !watchedRegime) return;
    const generateCode = async () => {
      try {
        const [careersRes] = await Promise.all([getCareers()]);
        const careerAbbr = (careersRes as any[]).find(c => String(c.careerId) === String(watchedCareerId))?.careerAbbreviation || "GEN";
        const code = generateMatricula({
          careerAbbreviation: careerAbbr,
          regime: watchedRegime,
          semester: watchedSemester,
          section: watchedSection,
        });
        setValue("enrollmentCode", code, { shouldValidate: true });
      } catch {
        // Silently fail - enrollment code won't update
      }
    };
    generateCode();
  }, [watchedCareerId, watchedSemester, watchedSection, watchedRegime, setValue]);

  // Auto-poblar careerName y semester cuando cambia careerId
  useEffect(() => {
    if (!watchedCareerId) {
      setValue("careerName", "", { shouldValidate: true });
      setValue("semester", "", { shouldValidate: true });
      return;
    }
    const career = careerOptions.find(c => String(c.value) === String(watchedCareerId));
    if (career) {
      setValue("careerName", career.label, { shouldValidate: true });
    }
    // Auto-cargar semestre desde la carrera
    const loadCareerSemester = async () => {
      try {
        const careersRes = await getCareers();
        const selectedCareer = (careersRes as any[]).find(c => String(c.careerId) === String(watchedCareerId));
        if (selectedCareer?.semester) {
          setValue("semester", selectedCareer.semester, { shouldValidate: true });
        }
      } catch {
        // Silently fail
      }
    };
    if (!editingEntry) {
      loadCareerSemester();
    }
  }, [watchedCareerId, careerOptions, setValue, editingEntry]);

  // Auto-select practice type based on career
  useEffect(() => {
    const autoSelectPracticeType = async () => {
      if (!watchedCareerId) {
        setValue("practiceType", "", { shouldValidate: true });
        return;
      }
      try {
        const types = await getInternshipTypesByCareer(watchedCareerId);
        const sortedTypes = [...types].sort((a, b) => a.priority - b.priority);
        setInternshipTypesWithIds(sortedTypes);

        setPracticeTypeOptions(
          sortedTypes.map(t => ({ value: t.name || "", label: t.name || "" }))
        );

        if (sortedTypes.length === 1) {
          setValue("practiceType", sortedTypes[0].name, { shouldValidate: true });
        } else if (sortedTypes.length > 1) {
          const studentPrefix = getValues("identificationPrefix");
          const studentNumber = getValues("identificationNumber");
          const period = getValues("period");

          if (studentPrefix && studentNumber && studentNumber.length >= 5 && period) {
            const completedTypeIds = await getCompletedPracticeTypes(
              studentPrefix, studentNumber, period, watchedCareerId
            );
            const nextType = sortedTypes.find(t => !completedTypeIds.includes(t.id));
            if (nextType) {
              setValue("practiceType", nextType.name, { shouldValidate: true });
            } else {
              setValue("practiceType", sortedTypes[0].name, { shouldValidate: true });
            }
          } else {
            setValue("practiceType", sortedTypes[0].name, { shouldValidate: true });
          }
        }
      } catch (error) {
        console.error("[PreEnrollmentModal] Error auto-selecting practice type:", error);
      }
    };

    autoSelectPracticeType();
  }, [watchedCareerId, setValue, getValues]);

  // Pre-submit sequential validation check
  useEffect(() => {
    const prefix = idPrefix || "V";
    const number = idNumber?.replace(/\D/g, '') || "";
    const selectedType = internshipTypesWithIds.find(
      t => t.name.toUpperCase() === (watchedPracticeType || "").toUpperCase()
    );

    if (number.length >= 5 && watchedCareerId && selectedType?.id && !editingEntry) {
      setIsCheckingSequential(true);
      checkSequential(prefix, number, Number(watchedCareerId), selectedType.id)
        .then(result => {
          setPreSubmitSequential(result);
          // If retiro justificado with multi-type career, show choice modal
          if (result.showChoiceModal) {
            setShowJustifiedChoiceModal(true);
            setJustifiedChoice(null);
          }
        })
        .catch(() => {
          setPreSubmitSequential(null);
        })
        .finally(() => {
          setIsCheckingSequential(false);
        });
    } else {
      setPreSubmitSequential(null);
    }
  }, [idPrefix, idNumber, watchedCareerId, watchedPracticeType, internshipTypesWithIds, editingEntry]);

  useEffect(() => {
    if (isOpen) {
      setPreSubmitSequential(null);
      if (editingEntry) {
        reset({
          identificationPrefix: editingEntry.identificationPrefix,
          identificationNumber: editingEntry.identificationNumber,
          studentName: editingEntry.studentName,
          phone: editingEntry.phone,
          period: editingEntry.period,
          careerId: editingEntry.careerId,
          semester: editingEntry.semester,
          section: editingEntry.section,
          regime: editingEntry.regime,
          practiceType: editingEntry.practiceType,
          enrollmentCode: editingEntry.enrollmentCode,
          careerName: editingEntry.careerName,
        });
        setDisplayIdentificationNumber(formatCedulaDisplay(editingEntry.identificationPrefix + editingEntry.identificationNumber));
        setDisplayPhone(formatPhoneDisplay(editingEntry.phone));
      } else if (initialCi) {
        // Caso exportación desde Estudiantes
        reset({
          identificationPrefix: "V",
          identificationNumber: initialCi,
          studentName: "",
          phone: "",
          period: getValues("period"),
          careerId: "",
          semester: "",
          section: "",
          regime: "",
          practiceType: "",
          enrollmentCode: "",
          careerName: "",
        });
        setDisplayIdentificationNumber(formatCedulaDisplay("V" + initialCi));
        setDisplayPhone("");
      } else {
        reset({
          identificationPrefix: "V",
          identificationNumber: "",
          studentName: "",
          phone: "",
          period: "",
          careerId: "",
          semester: "",
          section: "",
          regime: "",
          practiceType: "",
          enrollmentCode: "",
          careerName: "",
        });
        setDisplayIdentificationNumber("");
        setDisplayPhone("");
      }
    }
  }, [editingEntry, reset, isOpen, initialCi, getValues]);

  /**
   * Procesa el envío del formulario para crear o actualizar una pre-inscripción.
   * 
   * @param data - Datos validados del formulario.
   */
  const onSubmit = (data: PreEnrollmentFormData) => {
    setPendingData(data);
    setShowConfirmDialog(true);
  };

  const handleConfirmSave = async () => {
    if (!pendingData) return;
    const data = pendingData;

    try {
      const normalized = Object.fromEntries(
        Object.entries(data).map(([k, v]) => {
          if (typeof v === "string") return [k, v.toUpperCase()];
          return [k, v];
        })
      ) as PreEnrollmentFormData;

      // Resolver internshipTypeId desde el nombre del tipo de práctica
      const selectedType = internshipTypesWithIds.find(
        t => t.name.toUpperCase() === normalized.practiceType
      );

      if (editingEntry) {
        const updatePayload: UpdatePreEnrollmentPayload = {
          ...normalized,
          identificationPrefix: normalized.identificationPrefix as "V" | "E",
          regime: normalized.regime as "DIURNO" | "NOCTURNO" | "MIXTO",
          preEnrollmentId: editingEntry.preEnrollmentId,
          careerName: normalized.careerName || "",
        } as UpdatePreEnrollmentPayload;
        await onSave(updatePayload);
      } else {
        const createPayload: CreatePreEnrollmentPayload = {
          ...normalized,
          identificationPrefix: normalized.identificationPrefix as "V" | "E",
          regime: normalized.regime as "DIURNO" | "NOCTURNO" | "MIXTO",
          careerName: normalized.careerName || "",
          internshipTypeId: selectedType?.id,
        } as CreatePreEnrollmentPayload;
        await onSave(createPayload);
      }
      setShowConfirmDialog(false);
      setPendingData(null);
    } catch (error: any) {
      console.error("[PreEnrollmentModal] Error al procesar el formulario:", error);
      // Check for sequential blocking reason from backend
      const reason = error?.response?.data?.blockingReason || error?.blockingReason;
      if (reason) {
        const message = error?.response?.data?.message || error?.message;
        setBlockingInfo({ message, reason });
      } else {
        addToast({
          variant: "error",
          title: "Error de Formulario",
          message: "Ocurrió un error inesperado al procesar el formulario.",
        });
      }
    }
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} onCloseAttempt={handleCloseAttempt} showCloseButton size="5xl">
        <ModalHeader className="border-b border-border-light dark:border-white/5 pb-5">
          <div className="max-w-5xl mx-auto w-full px-2 pt-2">
            <div className="flex items-center gap-3 mb-1">
              <div className="h-10 w-10 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-600 dark:text-brand-400">
                <DocsIcon className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-text-primary dark:text-white tracking-tight">
                  {editingEntry ? "Gestión de Pre-Inscripción" : "Nueva Pre-Inscripción"}
                </h2>
                <p className="text-xs text-text-tertiary font-medium">
                  {editingEntry ? "Actualiza los detalles académicos del registro seleccionado." : "Registra a un estudiante en un período académico y genera su matrícula inicial."}
                </p>
              </div>
            </div>
          </div>
        </ModalHeader>

        <ModalBody className="bg-slate-50/50 dark:bg-transparent custom-scrollbar">
          <form id="pre-enrollment-form" onSubmit={handleSubmit(onSubmit)} className="max-w-5xl mx-auto py-8 px-2">
            {/* Sequential blocking warning banner */}
            {blockingInfo && (
              <div className={`rounded-lg border p-4 mb-4 ${
                blockingInfo.reason === 'retiro_justificado' 
                  ? 'border-blue-300 bg-blue-50 dark:border-blue-700 dark:bg-blue-950/30'
                  : 'border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-950/30'
              }`}>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <svg className={`h-5 w-5 ${
                      blockingInfo.reason === 'retiro_justificado' 
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-red-600 dark:text-red-400'
                    }`} viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${
                      blockingInfo.reason === 'retiro_justificado' 
                        ? 'text-blue-800 dark:text-blue-200'
                        : 'text-red-800 dark:text-red-200'
                    }`}>{blockingInfo.message}</p>
                    {blockingInfo.reason === 'retiro_justificado' && (
                      <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
                        El estudiante puede reinscribirse en el siguiente período en el mismo tipo de práctica.
                      </p>
                    )}
                    <button 
                      type="button"
                      onClick={() => setBlockingInfo(null)} 
                      className={`mt-2 text-sm underline ${
                        blockingInfo.reason === 'retiro_justificado' 
                          ? 'text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200'
                          : 'text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200'
                      }`}
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              </div>
            )}
            {/* Student practice history */}
            {studentPracticeHistory.length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/30 p-4 mb-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <svg className="h-5 w-5 text-amber-600 dark:text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-amber-800 dark:text-amber-200 mb-2">
                      Historial de prácticas del estudiante
                    </p>
                    <div className="space-y-1.5">
                      {studentPracticeHistory.map((p, idx) => {
                        const isNegative = [0, 4, 5].includes(p.statusCode);
                        const isPositive = p.statusCode === 3;
                        return (
                          <div key={idx} className="flex items-center gap-2 text-xs">
                            <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${
                              isNegative
                                ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                                : isPositive
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                            }`}>
                              {isNegative ? '✗' : isPositive ? '✓' : '—'}
                            </span>
                            <span className="font-semibold text-text-primary dark:text-white">{p.practiceType}</span>
                            <span className="text-text-tertiary">·</span>
                            <span className="text-text-secondary dark:text-gray-400">{p.period}</span>
                            {p.careerName && (
                              <>
                                <span className="text-text-tertiary">·</span>
                                <span className="text-text-secondary dark:text-gray-400">{p.careerName}</span>
                              </>
                            )}
                            <span className="text-text-tertiary">→</span>
                            <span className={`font-medium ${
                              isNegative
                                ? 'text-red-600 dark:text-red-400'
                                : isPositive
                                  ? 'text-green-600 dark:text-green-400'
                                  : 'text-text-secondary dark:text-gray-400'
                            }`}>
                              {p.status}
                            </span>
                            {p.grade > 0 && (
                              <span className="text-text-tertiary">(Nota: {p.grade})</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* Pre-submit sequential validation banner */}
            {preSubmitSequential && !preSubmitSequential.valid && preSubmitSequential.blockingReason && (
              <div className={`rounded-lg border p-4 mb-4 ${
                preSubmitSequential.blockingReason === 'career_completed'
                  ? 'border-purple-200 bg-purple-50 dark:border-purple-700 dark:bg-purple-950/30'
                  : preSubmitSequential.blockingReason === 'retiro_justificado'
                    ? 'border-blue-200 bg-blue-50 dark:border-blue-700 dark:bg-blue-950/30'
                    : 'border-red-200 bg-red-50 dark:border-red-700 dark:bg-red-950/30'
              }`}>
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {preSubmitSequential.blockingReason === 'career_completed' ? (
                      <svg className="h-5 w-5 text-purple-600 dark:text-purple-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                      </svg>
                    ) : preSubmitSequential.blockingReason === 'retiro_justificado' ? (
                      <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 text-red-600 dark:text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className={`text-sm font-bold ${
                      preSubmitSequential.blockingReason === 'career_completed'
                        ? 'text-purple-800 dark:text-purple-200'
                        : preSubmitSequential.blockingReason === 'retiro_justificado'
                          ? 'text-blue-800 dark:text-blue-200'
                          : 'text-red-800 dark:text-red-200'
                    }`}>
                      {preSubmitSequential.blockingReason === 'career_completed'
                        ? 'Carrera completada'
                        : preSubmitSequential.blockingReason === 'retiro_justificado'
                          ? 'Retiro justificado'
                          : preSubmitSequential.blockingReason === 'reprobado' || preSubmitSequential.blockingReason === 'retirado'
                            ? 'Período de espera'
                            : 'Validación secuencial'}
                    </p>
                    <p className={`text-xs mt-1 ${
                      preSubmitSequential.blockingReason === 'career_completed'
                        ? 'text-purple-700 dark:text-purple-300'
                        : preSubmitSequential.blockingReason === 'retiro_justificado'
                          ? 'text-blue-700 dark:text-blue-300'
                          : 'text-red-700 dark:text-red-300'
                    }`}>
                      {preSubmitSequential.message}
                    </p>
                  </div>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Columna Izquierda: Identificación y Perfil */}
              <div className="lg:col-span-7 space-y-6">
                <div className="bg-white dark:bg-white/5 rounded-2xl p-6 border border-border-light dark:border-white/10 shadow-sm space-y-6">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-brand-500/10 flex items-center justify-center text-brand-600">
                         <SearchIcon className="w-5 h-5" />
                      </div>
                      <h3 className="text-base font-bold text-text-primary dark:text-white">Identificación</h3>
                    </div>
                    {!editingEntry && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const evt = new CustomEvent("preenrollment:addStudent");
                          window.dispatchEvent(evt);
                        }}
                        startIcon={<PlusIcon className="w-3 h-3" />}
                        className="rounded-lg font-bold text-brand-600 hover:bg-brand-50"
                      >
                        Nuevo Estudiante
                      </Button>
                    )}
                  </div>

                  <div className="space-y-4">
                    <label className="block text-[10px] font-bold text-text-tertiary uppercase tracking-widest">Documento de Identidad <span className="text-red-500">*</span></label>
                    <div className="flex gap-3">
                      <div className="w-28 shrink-0">
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
                              disabled={!!editingEntry}
                              error={!!errors.identificationPrefix}
                              className="rounded-xl h-[48px]"
                            />
                          )}
                        />
                      </div>
                      <div className="flex-1 relative">
                        <Input
                          value={displayIdentificationNumber}
                          onChange={handleIdentificationNumberChange}
                          placeholder={idPrefix === "P" ? "Pasaporte (letras y números)" : "Número de cédula"}
                          error={!!errors.identificationNumber}
                          className={cn(
                            "rounded-xl h-[48px] font-bold tracking-wider",
                            isSearching && "animate-pulse"
                          )}
                          readOnly={!!editingEntry}
                          maxLength={idPrefix === "P" ? PASSPORT_MAX_LENGTH : CEDULA_MAX_LENGTH}
                          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                          autoComplete="off"
                        />
                        {isSearching && (
                          <div className="absolute right-4 top-1/2 -translate-y-1/2">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"></div>
                          </div>
                        )}

                        {/* Dropdown de Sugerencias */}
                        {showSuggestions && !editingEntry && (
                          <div className="absolute z-50 w-full mt-2 bg-white dark:bg-bg-dark border border-border-light dark:border-white/10 rounded-2xl shadow-xl max-h-56 overflow-hidden custom-scrollbar py-1">
                            {suggestions.map((student) => (
                              <button
                                key={student.studentId}
                                type="button"
                                className="w-full px-5 py-3 text-left hover:bg-brand-50/50 dark:hover:bg-brand-500/10 transition-all border-b border-border-light/40 last:border-0 group"
                                  onClick={async () => {
                                    const enrollments = await enrollmentService.getEnrollments();
                                    const alreadyEnrolled = enrollments.find(
                                      (e: any) =>
                                        e.identificationPrefix === student.identificationPrefix &&
                                        e.identificationNumber === student.identificationNumber &&
                                        e.status &&
                                        e.practicesStatus !== 0 &&   // Excluir RETIRADO (abandono)
                                        e.practicesStatus !== 5      // Excluir RETIRO_JUSTIFICADO
                                    );
                                    if (alreadyEnrolled) {
                                      addToast({ variant: "error", title: "Validación", message: "Estudiante con inscripción activa." });
                                      setError("identificationNumber", { type: "manual", message: "Ya inscrito." });
                                      return;
                                    }
                                    setValue("identificationNumber", student.identificationNumber);
                                    setValue("identificationPrefix", student.identificationPrefix);
                                    setDisplayIdentificationNumber(formatCedulaDisplay(student.identificationNumber, false));
                                    setValue("studentName", `${student.firstName} ${student.lastName}`, { shouldValidate: true, shouldDirty: true });
                                    setValue("phone", student.phone || "", { shouldValidate: true, shouldDirty: true });
                                    setShowSuggestions(false);
                                  }}
                              >
                                <div className="font-bold text-text-primary group-hover:text-brand-600 transition-colors">{student.identificationPrefix}-{student.identificationNumber}</div>
                                <div className="text-[11px] text-text-tertiary">{student.firstName} {student.lastName}</div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    {errors.identificationNumber && (
                      <p className="text-[11px] font-bold text-error-500 flex items-center gap-1.5 animate-pulse">
                        <InfoIcon className="w-3.5 h-3.5" />
                        {errors.identificationNumber.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Card de Perfil del Estudiante */}
                <div className={cn(
                  "bg-white dark:bg-white/5 rounded-2xl border transition-all duration-500 overflow-hidden relative",
                  watchedStudentName 
                    ? "border-brand-500/20 shadow-lg shadow-brand-500/5 opacity-100 translate-y-0" 
                    : "border-border-light/50 opacity-40 grayscale translate-y-2 pointer-events-none"
                )}>
                  {!watchedStudentName && (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-50/50 dark:bg-transparent z-10">
                       <p className="text-xs font-bold text-text-tertiary uppercase tracking-tighter">Esperando selección...</p>
                    </div>
                  )}
                  
                  <div className="p-6 sm:p-7 space-y-6">
                    <div className="flex items-center gap-5">
                      <div className={cn(
                        "h-14 w-14 rounded-2xl flex items-center justify-center text-white transition-all duration-500",
                        watchedStudentName ? "bg-brand-500 shadow-lg shadow-brand-500/20 rotate-0" : "bg-slate-200 rotate-3"
                      )}>
                        <UserCircleIcon className="w-9 h-9" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                           <h4 className="text-xl font-bold text-text-primary dark:text-white leading-tight">
                            {watchedStudentName || "Nombre del Estudiante"}
                          </h4>
                          {watchedStudentName && <Badge color="success" variant="light" size="sm" className="font-bold">Verificado</Badge>}
                        </div>
                        <div className="flex items-center gap-2 text-xs font-semibold text-text-tertiary">
                           <DocsIcon className="w-3.5 h-3.5" />
                           {watchedCareerName || "Carrera Académica"}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border-light dark:border-white/5">
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-widest">Documento</span>
                          <p className="text-sm font-bold text-text-primary">{idPrefix || '-'}-{idNumber || '-------'}</p>
                        </div>
                        <div className="space-y-1 text-right">
                          <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-widest">Carrera</span>
                          <p className="text-sm font-bold text-text-primary truncate" title={watchedCareerName || 'No disponible'}>
                            {watchedCareerName || 'No disponible'}
                          </p>
                        </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Columna Derecha: Configuración Académica */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white dark:bg-white/5 rounded-2xl p-6 border border-border-light dark:border-white/10 shadow-sm space-y-8">
                  <div className="flex items-center gap-3 border-b border-border-light dark:border-white/5 pb-4">
                    <div className="h-9 w-9 rounded-lg bg-success-500/10 flex items-center justify-center text-success-600">
                       <ShieldCheckIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-text-primary dark:text-white">Datos Académicos</h3>
                      <p className="text-[10px] text-text-tertiary font-bold uppercase tracking-tighter">Configuración manual</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Carrera */}
                    <div className="space-y-3">
                      <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider block">Carrera <span className="text-red-500">*</span></label>
                      <Controller
                        name="careerId"
                        control={control}
                        render={({ field }) => (
                          <CustomSelect
                            id="careerId"
                            options={careerOptions}
                            onChange={(value) => {
                              field.onChange(value);
                              setBlockingInfo(null);
                            }}
                            value={field.value}
                            placeholder="Seleccione la carrera..."
                            error={!!errors.careerId}
                            className="rounded-xl h-[48px]"
                          />
                        )}
                      />
                      {errors.careerId && <p className="text-[11px] font-bold text-error-500">{errors.careerId.message}</p>}
                    </div>

                    {/* Semestre */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Semestre <span className="text-red-500">*</span></label>
                        <Badge color="info" variant="light" size="sm" className="font-bold text-[9px] px-1.5 backdrop-blur-sm">AUTO</Badge>
                      </div>
                      <Controller
                        name="semester"
                        control={control}
                        render={({ field }) => (
                          <CustomSelect
                            id="semester"
                            options={SEMESTER_OPTIONS}
                            onChange={field.onChange}
                            value={field.value}
                            placeholder="Seleccione la carrera primero..."
                            error={!!errors.semester}
                            disabled={true}
                            className="rounded-xl h-[48px] bg-slate-50/50"
                          />
                        )}
                      />
                      {errors.semester && <p className="text-[11px] font-bold text-error-500">{errors.semester.message}</p>}
                    </div>

                    {/* Sección */}
                    <div className="space-y-3">
                      <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider block">Sección <span className="text-red-500">*</span></label>
                      <Controller
                        name="section"
                        control={control}
                        render={({ field }) => (
                          <CustomSelect
                            id="section"
                            options={SECTION_OPTIONS}
                            onChange={field.onChange}
                            value={field.value}
                            placeholder="Seleccione la sección..."
                            error={!!errors.section}
                            onAddNew={handleAddSection}
                            addNewLabel="Agregar nueva sección"
                            className="rounded-xl h-[48px]"
                          />
                        )}
                      />
                      {errors.section && <p className="text-[11px] font-bold text-error-500">{errors.section.message}</p>}
                    </div>

                    {/* Régimen */}
                    <div className="space-y-3">
                      <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider block">Régimen <span className="text-red-500">*</span></label>
                      <Controller
                        name="regime"
                        control={control}
                        render={({ field }) => (
                          <CustomSelect
                            id="regime"
                            options={REGIME_OPTIONS}
                            onChange={field.onChange}
                            value={field.value}
                            placeholder="Seleccione el régimen..."
                            error={!!errors.regime}
                            className="rounded-xl h-[48px]"
                          />
                        )}
                      />
                      {errors.regime && <p className="text-[11px] font-bold text-error-500">{errors.regime.message}</p>}
                    </div>

                    {/* Tipo de Práctica */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Tipo de Práctica <span className="text-red-500">*</span></label>
                        <Badge color="info" variant="light" size="sm" className="font-bold text-[9px] px-1.5 backdrop-blur-sm">AUTO</Badge>
                      </div>
                      <Controller
                        name="practiceType"
                        control={control}
                        render={({ field }) => (
                          <CustomSelect
                            id="practiceType"
                            options={practiceTypeOptions}
                            onChange={(value) => {
                              field.onChange(value);
                              setBlockingInfo(null);
                            }}
                            value={field.value}
                            placeholder="Seleccione el tipo..."
                            error={!!errors.practiceType}
                            disabled={true}
                            className="rounded-xl h-[48px] bg-slate-50/50"
                          />
                        )}
                      />
                      {errors.practiceType && <p className="text-[11px] font-bold text-error-500">{errors.practiceType.message}</p>}
                    </div>

                    {/* Período */}
                    <div className="space-y-3">
                      <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Período Académico <span className="text-red-500">*</span></label>
                      <Controller
                        name="period"
                        control={control}
                        render={({ field }) => (
                          <CustomSelect
                            id="period"
                            options={periods.map((p) => ({ value: p.description, label: p.description }))}
                            onChange={field.onChange}
                            value={field.value}
                            placeholder="Seleccione el período..."
                            className="rounded-xl h-[48px]"
                          />
                        )}
                      />
                    </div>

                    {/* Matrícula */}
                    <div className="space-y-3 pt-2">
                       <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider block">Matrícula Generada</label>
                       <div className={cn(
                         "h-[60px] rounded-2xl border-2 border-dashed flex items-center justify-center transition-all duration-300",
                         watchedEnrollmentCode ? "border-brand-500/50 bg-brand-500/5 text-brand-600 shadow-inner" : "border-slate-200 bg-slate-50/50 text-slate-400"
                       )}>
                         <span className={cn(
                           "text-xl font-mono font-bold tracking-[0.2em]",
                           watchedEnrollmentCode ? "text-brand-600" : "text-slate-300"
                         )}>
                           {watchedEnrollmentCode || "--------"}
                         </span>
                       </div>
                    </div>
                  </div>
                </div>

                {/* Banner Informativo */}
                <div className="bg-gradient-to-br from-brand-600 to-brand-700 rounded-2xl p-6 text-white shadow-lg shadow-brand-500/20 relative overflow-hidden group">
                   <div className="absolute -right-4 -bottom-4 h-24 w-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>
                   <div className="relative space-y-2">
                      <div className="flex items-center gap-2">
                        <InfoIcon className="w-5 h-5 text-brand-200" />
                        <h4 className="text-sm font-bold">Información Importante</h4>
                      </div>
                      <p className="text-[11px] text-brand-100 font-medium leading-relaxed">
                        Complete los datos académicos del estudiante. La matrícula se genera automáticamente al seleccionar carrera, semestre, sección y régimen.
                      </p>
                   </div>
                </div>
              </div>
            </div>

            {/* Campos ocultos para registro */}
            <div className="hidden">
              <Input {...register("practiceType")} readOnly />
              <Input {...register("enrollmentCode")} readOnly />
              <Input {...register("studentName")} readOnly />
              <Input {...register("phone")} readOnly />
              <Input {...register("careerName")} readOnly />
              <Input {...register("careerId")} readOnly />
              <Input {...register("semester")} readOnly />
              <Input {...register("section")} readOnly />
              <Input {...register("regime")} readOnly />
            </div>
          </form>
        </ModalBody>

        <ModalFooter className="shrink-0 px-8 py-6 bg-white dark:bg-bg-dark border-t border-border-light dark:border-white/5">
          <div className="flex items-center justify-between w-full max-w-5xl mx-auto">
            <div className="hidden sm:block">
               {isDirty && !isValid && <p className="text-[10px] font-bold text-error-500 animate-bounce uppercase">Por favor complete los campos obligatorios</p>}
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button variant="outline" onClick={handleCloseAttempt} disabled={isLoading} className="flex-1 sm:flex-none h-11 px-8 rounded-xl font-bold">
                Cancelar
              </Button>
              <Button 
                type="submit" 
                form="pre-enrollment-form" 
                loading={isLoading} 
                loadingText="Guardando..."
                className="flex-1 sm:flex-none h-11 px-10 rounded-xl font-bold bg-brand-600 hover:bg-brand-700 transition-all duration-200" 
                disabled={
                  (editingEntry ? !isDirty || !isValid : !isValid) ||
                  (preSubmitSequential !== null && !preSubmitSequential.valid && !!preSubmitSequential.blockingReason)
                }
              >
                {editingEntry ? "Actualizar Pre-Inscripción" : "Guardar Registro"}
              </Button>
            </div>
          </div>
        </ModalFooter>
      </Modal>

    <UnifiedDialog
      isOpen={showConfirmation}
      onClose={cancelClose}
      onConfirm={confirmClose}
      variant="warning"
      {...SYSTEM_DIALOGS.closeWithoutSaving}
    />

    <UnifiedDialog
      isOpen={showConfirmDialog}
      onClose={() => setShowConfirmDialog(false)}
      onConfirm={handleConfirmSave}
      variant="confirm"
      {...(editingEntry ? CONFIRM_MESSAGES.update('Pre-inscripción del estudiante') : CONFIRM_MESSAGES.create('Pre-inscripción del estudiante'))}
      isLoading={isLoading}
    />

    {/* Retiro justificado choice modal */}
    <UnifiedDialog
      isOpen={showJustifiedChoiceModal}
      onClose={() => {
        setShowJustifiedChoiceModal(false);
        setJustifiedChoice(null);
        setPreSubmitSequential(null);
      }}
      onConfirm={() => {
        setShowJustifiedChoiceModal(false);
        // justifiedChoice is set by the user clicking one of the options
      }}
      variant="info"
      title="Retiro Justificado - Elección de Práctica"
      message=""
      confirmLabel={justifiedChoice === 'continue' ? 'Continuar desde donde se retiró' : justifiedChoice === 'restart' ? 'Reiniciar secuencia' : 'Confirmar'}
      cancelLabel="Cancelar"
      isLoading={false}
    >
      <div className="space-y-4">
        <p className="text-sm text-text-secondary dark:text-gray-400">
          Esta carrera tiene múltiples tipos de práctica. Elija si desea continuar desde donde se retiró o reiniciar la secuencia desde el inicio.
        </p>

        {/* Practice history table */}
        {preSubmitSequential?.approvedPractices && preSubmitSequential.approvedPractices.length > 0 && (
          <div className="rounded-lg border border-border-light dark:border-white/10 overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-gray-50 dark:bg-white/5">
                  <th className="px-3 py-2 text-left font-bold text-text-tertiary">Práctica</th>
                  <th className="px-3 py-2 text-left font-bold text-text-tertiary">Estado</th>
                  <th className="px-3 py-2 text-left font-bold text-text-tertiary">Nota</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light dark:divide-white/5">
                {preSubmitSequential.approvedPractices.map((p, idx) => {
                  const isCompleted = p.practicesStatus === 3; // CULMINADO
                  const isFailed = p.practicesStatus === 4; // REPROBADO
                  const isWithdrawn = p.practicesStatus === 0 || p.practicesStatus === 5; // RETIRADO or RETIRO_JUSTIFICADO
                  return (
                    <tr key={idx} className={
                      isCompleted ? 'bg-green-50/50 dark:bg-green-900/10' :
                      isFailed ? 'bg-red-50/50 dark:bg-red-900/10' :
                      isWithdrawn ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''
                    }>
                      <td className="px-3 py-2 font-semibold text-text-primary dark:text-white">
                        {p.internshipTypeName}
                        <span className="ml-1 text-text-tertiary">(P{p.priority})</span>
                      </td>
                      <td className="px-3 py-2">
                        <span className={`font-medium ${
                          isCompleted ? 'text-green-600 dark:text-green-400' :
                          isFailed ? 'text-red-600 dark:text-red-400' :
                          isWithdrawn ? 'text-amber-600 dark:text-amber-400' :
                          'text-text-secondary dark:text-gray-400'
                        }`}>
                          {isCompleted ? 'Aprobada' : isFailed ? 'Reprobada' : isWithdrawn ? 'Retirada' : `Estado ${p.practicesStatus}`}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-text-secondary dark:text-gray-400">
                        {p.grade != null && p.grade > 0 ? p.grade : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Choice buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setJustifiedChoice('continue')}
            className={`p-3 rounded-xl border-2 text-left transition-all ${
              justifiedChoice === 'continue'
                ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950/50'
                : 'border-border-light dark:border-white/10 hover:border-blue-300 dark:hover:border-blue-600'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-bold text-text-primary dark:text-white">Continuar</span>
            </div>
            <p className="text-[11px] text-text-secondary dark:text-gray-400">
              Inscribir en la siguiente práctica de la secuencia ({preSubmitSequential?.suggestedPracticeTypeName || 'siguiente'})
            </p>
          </button>
          <button
            type="button"
            onClick={() => setJustifiedChoice('restart')}
            className={`p-3 rounded-xl border-2 text-left transition-all ${
              justifiedChoice === 'restart'
                ? 'border-amber-500 bg-amber-50 dark:border-amber-400 dark:bg-amber-950/50'
                : 'border-border-light dark:border-white/10 hover:border-amber-300 dark:hover:border-amber-600'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <svg className="w-4 h-4 text-amber-600 dark:text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.311-.311h1.43a.75.75 0 000-1.5H4.598a.75.75 0 00-.75.75v3.634a.75.75 0 001.5 0v-1.43l.311.311a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V3.75a.75.75 0 00-1.5 0V5.79l-.311-.31A7 7 0 003.298 8.574a.75.75 0 001.448.39 5.5 5.5 0 019.201-2.465l.311.31h-1.43a.75.75 0 000 1.5h3.634a.75.75 0 00.75-.75V2.498a.75.75 0 00-1.5 0v1.43l.311-.31z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-bold text-text-primary dark:text-white">Reiniciar</span>
            </div>
            <p className="text-[11px] text-text-secondary dark:text-gray-400">
              Inscribir desde la primera práctica de la secuencia
            </p>
          </button>
        </div>
      </div>
    </UnifiedDialog>
  </>
);
}
