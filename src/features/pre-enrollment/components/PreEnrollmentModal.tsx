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
import Button from "../../../components/ui/button/Button";
import AsyncButton from "../../../components/ui/button/AsyncButton";
import CustomSelect from "../../../components/form/CustomSelect";
import Badge from "../../../components/ui/badge/Badge";
import { useToast } from "../../../context/toast";
import { Student } from "../../students/types";
import { Periodo } from "../../periods/types";
import { getStudents } from "../../students/services/studentsService";
import { getPeriods } from "../../periods/services/periodService";
import { getInternshipTypes, getInternshipTypesByCareer } from "../../internship-types/services/internshipTypesService";
import { getCareers } from "../../careers/services/careersService";
import { getPreEnrollments } from "../services/preEnrollmentService";
import * as enrollmentService from "../../enrollment/services/enrollmentService";
import { useUnsavedChanges } from "../../../hooks/useUnsavedChanges";
import UnifiedDialog from "../../../components/ui/dialog/UnifiedDialog";
import { useLists } from "../../lists/hooks/useLists";
import { generateMatricula } from "../../../utils/matricula";
import { formatCedulaDisplay, cleanCedula, formatPhoneDisplay, CEDULA_MAX_LENGTH } from "../../../utils/inputFormat";
import { UserCircleIcon, ShieldCheckIcon, DocsIcon, InfoIcon, SearchIcon, PlusIcon } from "../../../icons";

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
  /** Prefijo de identificación (V/E) */
  identificationPrefix: z.string().min(1, "Seleccione un prefijo"),
  /** Número de identificación (solo dígitos) */
  identificationNumber: z.string()
    .min(1, "La identificación es obligatoria")
    .regex(/^\d+$/, "Solo se admiten números"),
  /** Nombre completo del estudiante (autocompletado) */
  studentName: z.string()
    .min(1, "El nombre del estudiante es obligatorio"),
  /** Teléfono de contacto (autocompletado) */
  phone: z.string()
    .min(1, "El teléfono es obligatorio"),
  /** Período académico para la pre-inscripción */
  period: z.string().min(1, "Seleccione el período"),
  /** Tipo de práctica (autocompletado según la carrera) */
  practiceType: z.string().min(1, "Seleccione el tipo de práctica"),
  /** Código de matrícula generado automáticamente */
  enrollmentCode: z.string().min(1, "La matrícula es obligatoria"),
  /** Nombre de la carrera (informativo) */
  careerName: z.string().optional(),
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
}: PreEnrollmentModalProps) {
  const [isSearching, setIsSearching] = useState(false);
  const [periods, setPeriods] = useState<Periodo[]>([]);
  const [suggestions, setSuggestions] = useState<Student[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [options, setOptions] = useState<Record<string, { value: string; label: string }[]>>({});
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingData, setPendingData] = useState<PreEnrollmentFormData | null>(null);
  const { fetchMultipleLists } = useLists();
  const { addToast } = useToast();

  // State for display values with formatting
  const [displayIdentificationNumber, setDisplayIdentificationNumber] = useState("");
  const [_displayPhone, setDisplayPhone] = useState("");

  // Handle identification number input change with formatting
  const handleIdentificationNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const cleaned = cleanCedula(input);
    const formatted = formatCedulaDisplay(cleaned);
    setDisplayIdentificationNumber(formatted);
    setValue("identificationNumber", cleaned, { shouldValidate: true, shouldDirty: true });
  };

  /**
   * Opciones de nacionalidad/prefijo de identificación.
   * Se cargan dinámicamente o usan valores por defecto.
   */
  const NATIONALITY_OPTIONS = options["Nacionalidad"] || [
    { value: "V", label: "V" },
    { value: "E", label: "E" },
  ];

  const { 
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    getValues,
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
      practiceType: "",
      enrollmentCode: "",
      careerName: "",
    },
  });

  const idNumber = useWatch({ control, name: "identificationNumber" });
  const idPrefix = useWatch({ control, name: "identificationPrefix" });
  
  // Watch all fields for live verification panel
  const watchedStudentName = useWatch({ control, name: "studentName" });
  const watchedCareerName = useWatch({ control, name: "careerName" });
  const watchedPracticeType = useWatch({ control, name: "practiceType" });
  const watchedEnrollmentCode = useWatch({ control, name: "enrollmentCode" });
  const watchedPhone = useWatch({ control, name: "phone" });

  /**
   * Efecto para cargar la lista de estudiantes disponibles al abrir el modal.
   * Filtra estudiantes que no tienen registros activos en prácticas.
   */
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await getStudents();
        const availableStudents = response.data.filter((s: Student) => !s.isInUse && s.status);
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
   * Filtra y selecciona el período más cercano disponible.
   */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [periodData] = await Promise.all([
          getPeriods(),
          getInternshipTypes()
        ]);
        
        const pendingPeriods = periodData
          .filter((p: Periodo) => p.periodStatus === 1 && p.status)
          .sort((a: Periodo, b: Periodo) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
        
        const closestPeriod = pendingPeriods.length > 0 ? [pendingPeriods[0]] : [];
        
        if (editingEntry) {
          const exists = closestPeriod.some((p: Periodo) => p.description === editingEntry.period);
          if (!exists) {
            const originalPeriod = periodData.find((p: Periodo) => p.description === editingEntry.period);
            if (originalPeriod) {
              closestPeriod.push(originalPeriod);
            }
          }
        }

        setPeriods(closestPeriod);
        
        if (closestPeriod.length > 0 && !editingEntry && !getValues("period")) {
          setValue("period", closestPeriod[0].description);
        }
      } catch (error) {
        console.error("[PreEnrollmentModal] Error al cargar períodos/tipos:", error);
      }
    };

    if (isOpen) {
      fetchData();
    }
  }, [isOpen, editingEntry, setValue, getValues]);

  /**
   * Efecto para cargar listas desplegables dinámicas (ej. Nacionalidad).
   */
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const data = await fetchMultipleLists(["Nacionalidad"]);
        const mappedOptions: Record<string, { value: string; label: string }[]> = {};
        
        Object.entries(data).forEach(([key, values]) => {
          mappedOptions[key] = (values as any[]).map((v: any) => ({
            value: (key === "Nacionalidad" && v.abbreviation) ? v.abbreviation.toUpperCase() : v.name.toUpperCase(),
            label: (key === "Nacionalidad" && v.abbreviation) ? v.abbreviation.toUpperCase() : v.name.toUpperCase()
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
   * Efecto para escuchar eventos de estudiante agregado desde el modal de estudiante.
   */
  useEffect(() => {
    const handleSetStudentId = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) {
        setValue("identificationPrefix", detail.identificationPrefix || "V", { shouldValidate: true, shouldDirty: true });
        setValue("identificationNumber", detail.identificationNumber || "", { shouldValidate: true, shouldDirty: true });
        setValue("studentName", detail.firstName && detail.lastName ? `${detail.firstName} ${detail.lastName}` : "", { shouldValidate: true, shouldDirty: true });
        setValue("phone", detail.phone || "", { shouldValidate: true, shouldDirty: true });
      }
    };
    window.addEventListener("preenrollment:setStudentId", handleSetStudentId as EventListener);
    return () => {
      window.removeEventListener("preenrollment:setStudentId", handleSetStudentId as EventListener);
    };
  }, [setValue]);

  /**
   * Limpia los campos relacionados con los datos del estudiante en el formulario.
   * Se utiliza cuando no se encuentra un estudiante o la búsqueda es inválida.
   */
const clearStudentFields = useCallback(() => {
    setValue("studentName", "");
    setValue("phone", "");
    setDisplayPhone("");
    setValue("careerName", "");
    setValue("practiceType", "");
    setValue("enrollmentCode", "");
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
      return;
    }
    
    setIsSearching(true);
    try {
      const [studentsResponse, careers, enrollments, preEnrollments] = await Promise.all([
        getStudents(),
        getCareers(),
        enrollmentService.getEnrollments(),
        getPreEnrollments(),
      ]);
      const student = studentsResponse.data.find(
        (s: Student) => s.identificationPrefix === prefix && s.identificationNumber === number
      );

      const alreadyEnrolled = enrollments.find(
        (e: any) => e.identificationPrefix === prefix && e.identificationNumber === number && e.status
      );

      if (alreadyEnrolled) {
        clearStudentFields();
        const message = "El estudiante ya posee una inscripción activa. No puede pre-inscribirse.";
        setError("identificationNumber", {
          type: "manual",
          message,
        });
        return;
      }

      const hasActivePreEnrollment = preEnrollments.some(
        (p: any) => p.identificationPrefix === prefix && p.identificationNumber === number && p.status
      );

      if (hasActivePreEnrollment) {
        clearStudentFields();
        const message = "El estudiante ya posee una pre-inscripción activa.";
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
        setValue("careerName", student.careerName || "", { shouldValidate: true, shouldDirty: true });
        clearErrors("identificationNumber");
        
        if (student.careerId) {
          const types = await getInternshipTypesByCareer(student.careerId);
          if (types.length > 0) {
            setValue("practiceType", types[0].name, { shouldValidate: true, shouldDirty: true });
          } else {
            setValue("practiceType", "", { shouldValidate: true, shouldDirty: true });
          }
        }

        const careerAbbr = (careers as any[]).find((c: any) => String(c.careerId) === String(student.careerId))?.careerAbbreviation || "GEN";
        const enrollmentCode = generateMatricula({
          careerAbbreviation: careerAbbr,
          regime: student.regime,
          semester: student.semester,
          section: student.section,
        });
        setValue("enrollmentCode", enrollmentCode, { shouldValidate: true, shouldDirty: true });
      } else {
        clearStudentFields();
        const message = "El estudiante no se encuentra registrado.";
        setError("identificationNumber", {
          type: "manual",
          message,
        });
      }
    } catch (error) {
      console.error("[PreEnrollmentModal] Error al buscar estudiante:", error);
      clearStudentFields();
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

useEffect(() => {
    if (isOpen) {
      if (editingEntry) {
        reset({
          identificationPrefix: editingEntry.identificationPrefix,
          identificationNumber: editingEntry.identificationNumber,
          studentName: editingEntry.studentName,
          phone: editingEntry.phone,
          period: editingEntry.period,
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

      if (editingEntry) {
        const updatePayload: UpdatePreEnrollmentPayload = {
          ...normalized,
          identificationPrefix: normalized.identificationPrefix as "V" | "E",
          preEnrollmentId: editingEntry.preEnrollmentId,
          careerName: normalized.careerName || "",
        };
        await onSave(updatePayload);
      } else {
        const createPayload: CreatePreEnrollmentPayload = {
          ...normalized,
          identificationPrefix: normalized.identificationPrefix as "V" | "E",
          careerName: normalized.careerName || "",
        };
        await onSave(createPayload);
      }
      setShowConfirmDialog(false);
      setPendingData(null);
    } catch (error) {
      console.error("[PreEnrollmentModal] Error al procesar el formulario:", error);
      addToast({
        variant: "error",
        title: "Error de Formulario",
        message: "Ocurrió un error inesperado al procesar el formulario.",
      });
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
                  {editingEntry ? "Gestión de Preinscripción" : "Nueva Preinscripción"}
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
                    <label className="block text-[10px] font-bold text-text-tertiary uppercase tracking-widest">Documento de Identidad *</label>
                    <div className="flex gap-3">
                      <div className="w-24 shrink-0">
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
                          placeholder="Número de cédula..."
                          error={!!errors.identificationNumber}
                          className={cn(
                            "rounded-xl h-[48px] font-bold tracking-wider",
                            isSearching && "animate-pulse"
                          )}
                          readOnly={!!editingEntry}
                          maxLength={CEDULA_MAX_LENGTH}
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
                                  const alreadyEnrolled = enrollments.find(e => e.identificationPrefix === student.identificationPrefix && e.identificationNumber === student.identificationNumber && e.status);
                                  if (alreadyEnrolled) {
                                    addToast({ variant: "error", title: "Validación", message: "Estudiante con inscripción activa." });
                                    setError("identificationNumber", { type: "manual", message: "Ya inscrito." });
                                    return;
                                  }
                                  setValue("identificationNumber", student.identificationNumber);
                                  setValue("identificationPrefix", student.identificationPrefix);
                                  setDisplayIdentificationNumber(formatCedulaDisplay(student.identificationPrefix + student.identificationNumber));
                                  setValue("studentName", `${student.firstName} ${student.lastName}`, { shouldValidate: true, shouldDirty: true });
                                  setValue("phone", student.phone || "", { shouldValidate: true, shouldDirty: true });
                                  setValue("careerName", student.careerName || "", { shouldValidate: true, shouldDirty: true });
                                  
                                  if (student.careerId) {
                                    const types = await getInternshipTypesByCareer(student.careerId);
                                    if (types.length > 0) setValue("practiceType", types[0].name, { shouldValidate: true, shouldDirty: true });
                                  }
                                  
                                  const careersRes = await getCareers();
                                  const careerAbbr = (careersRes as any[]).find(c => String(c.careerId) === String(student.careerId))?.careerAbbreviation || "GEN";
                                  const enrollmentCode = generateMatricula({
                                    careerAbbreviation: careerAbbr,
                                    regime: student.regime,
                                    semester: student.semester,
                                    section: student.section,
                                  });
                                  setValue("enrollmentCode", enrollmentCode, { shouldValidate: true, shouldDirty: true });
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
                          <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-widest">Contacto</span>
                          <p className="text-sm font-bold text-text-primary">{watchedPhone ? formatPhoneDisplay(watchedPhone) : 'No disponible'}</p>
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
                      <p className="text-[10px] text-text-tertiary font-bold uppercase tracking-tighter">Configuración automática</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Período */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Período Académico *</label>
                        <Badge color="info" variant="light" size="sm" className="font-bold text-[9px] px-1.5 backdrop-blur-sm">AUTO</Badge>
                      </div>
                      <Controller
                        name="period"
                        control={control}
                        render={({ field }) => (
                          <CustomSelect
                            id="period"
                            options={periods.map((p) => ({ value: p.description, label: p.description }))}
                            onChange={field.onChange}
                            value={field.value}
                            placeholder="Cargando períodos..."
                            disabled={true} // Siempre deshabilitado porque es automático
                            className="rounded-xl h-[48px] bg-slate-50/50"
                          />
                        )}
                      />
                    </div>

                    {/* Tipo de Práctica */}
                    <div className="space-y-3">
                       <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider block">Tipo de Práctica</label>
                       <div className={cn(
                         "h-[48px] px-4 rounded-xl border flex items-center gap-3 transition-colors",
                         watchedPracticeType ? "bg-brand-50/30 border-brand-200 text-brand-700 font-bold" : "bg-slate-50 border-border-light text-text-tertiary italic"
                       )}>
                         <ShieldCheckIcon className={cn("w-4 h-4", watchedPracticeType ? "text-brand-500" : "text-slate-300")} />
                         <span className="text-sm">{watchedPracticeType || "Pendiente de selección..."}</span>
                       </div>
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
                        Los datos académicos se generan automáticamente basándose en el historial y carrera del estudiante seleccionado. Verifique que el período sea el correcto antes de guardar.
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
              <AsyncButton 
                type="submit" 
                form="pre-enrollment-form" 
                loading={isLoading} 
                className="flex-1 sm:flex-none h-11 px-10 rounded-xl font-bold bg-brand-600 hover:bg-brand-700 transition-all duration-200" 
                disabled={editingEntry ? !isDirty || !isValid : !isValid}
              >
                {editingEntry ? "Actualizar Preinscripción" : "Guardar Registro"}
              </AsyncButton>
            </div>
          </div>
        </ModalFooter>
      </Modal>

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

    <UnifiedDialog
      isOpen={showConfirmDialog}
      onClose={() => setShowConfirmDialog(false)}
      onConfirm={handleConfirmSave}
      title={editingEntry ? "Actualizar Preinscripción" : "Guardar Preinscripción"}
      message={`¿Estás seguro de que deseas ${editingEntry ? 'actualizar' : 'guardar'} la pre-inscripción del estudiante?`}
      confirmLabel={editingEntry ? "Actualizar" : "Guardar"}
      variant="confirm"
      isLoading={isLoading}
    />
  </>
);
}
