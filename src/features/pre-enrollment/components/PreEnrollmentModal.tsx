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
import { PreEnrollment, CreatePreEnrollmentPayload, UpdatePreEnrollmentPayload } from "../types";
import Button from "../../../components/ui/button/Button";
import AsyncButton from "../../../components/ui/button/AsyncButton";
import CustomSelect from "../../../components/form/CustomSelect";
import { useToast } from "../../../context/toast";
import { Student } from "../../students/types";
import { getStudents } from "../../students/services/studentsService";
import { getPeriods } from "../../periods/services/periodService";
import { Periodo } from "../../periods/types";
import { Tooltip } from "../../../components/ui/tooltip/Tooltip";
import { getInternshipTypes, getInternshipTypesByCareer } from "../../internship-types/services/internshipTypesService";
import { getCareers } from "../../careers/services/careersService";
import { getPreEnrollments } from "../services/preEnrollmentService";
import * as enrollmentService from "../../enrollment/services/enrollmentService";
import { useUnsavedChanges } from "../../../hooks/useUnsavedChanges";
import UnifiedDialog from "../../../components/ui/dialog/UnifiedDialog";
import { useLists } from "../../lists/hooks/useLists";
import { generateMatricula } from "../../../utils/matricula";
import { List } from "../../lists/types";
import * as listsService from "../../lists/services/listsService";
import { isProtectedList, PROTECTED_LIST_MESSAGE } from "../../../constants/systemLists";

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

  // Estado para agregar nuevos valores a las listas
  const [isValueModalOpen, setIsValueModalOpen] = useState(false);
  const [valueModalTitle, setValueModalTitle] = useState<string>("");
  const [targetListName, setTargetListName] = useState<string>("");
  const [targetField, setTargetField] = useState<keyof PreEnrollmentFormData | "">("");
  const [newValueInput, setNewValueInput] = useState<string>("");
  const [savingNewValue, setSavingNewValue] = useState(false);

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
    formState: { errors, isSubmitted, isDirty, isValid },
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

  /**
   * Efecto para cargar la lista de estudiantes disponibles al abrir el modal.
   * Filtra estudiantes que no tienen registros activos en prácticas.
   */
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await getStudents();
        const availableStudents = response.data.filter(s => !s.isInUse && s.status);
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
      const filtered = allStudents.filter(s => 
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
          .filter(p => p.periodStatus === 1 && p.status)
          .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
        
        const closestPeriod = pendingPeriods.length > 0 ? [pendingPeriods[0]] : [];
        
        if (editingEntry) {
          const exists = closestPeriod.some(p => p.description === editingEntry.period);
          if (!exists) {
            const originalPeriod = periodData.find(p => p.description === editingEntry.period);
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
          mappedOptions[key] = values.map(v => ({
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

  // Funciones para agregar nuevos valores a las listas
  const openAddValueModal = (listName: string, field: keyof PreEnrollmentFormData, title: string) => {
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

      const upper = raw.toUpperCase();

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
        setValue(targetField as keyof PreEnrollmentFormData, selectValue, { shouldValidate: true, shouldDirty: true });
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

      setValue(targetField as keyof PreEnrollmentFormData, mapped.value, { shouldValidate: true, shouldDirty: true });
      setIsValueModalOpen(false);
    } catch (e) {
      console.error("[PreEnrollmentModal] Error creando valor en lista:", e);
    } finally {
      setSavingNewValue(false);
    }
  };

  /**
   * Limpia los campos relacionados con los datos del estudiante en el formulario.
   * Se utiliza cuando no se encuentra un estudiante o la búsqueda es inválida.
   */
  const clearStudentFields = useCallback(() => {
    setValue("studentName", "");
    setValue("phone", "");
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
        (e) => e.identificationPrefix === prefix && e.identificationNumber === number && e.status
      );

      if (alreadyEnrolled) {
        clearStudentFields();
        const message = "El estudiante ya posee una inscripción activa. No puede pre-inscribirse.";
        setError("identificationNumber", {
          type: "manual",
          message,
        });
        addToast({
          variant: "error",
          title: "Error de Validación",
          message
        });
        return;
      }

      const hasActivePreEnrollment = preEnrollments.some(
        (p) => p.identificationPrefix === prefix && p.identificationNumber === number && p.status
      );

      if (hasActivePreEnrollment) {
        clearStudentFields();
        const message = "El estudiante ya posee una pre-inscripción activa.";
        setError("identificationNumber", {
          type: "manual",
          message,
        });
        addToast({
          variant: "error",
          title: "Error de Validación",
          message
        });
        return;
      }

      if (student) {
        setValue("studentName", `${student.firstName} ${student.lastName}`);
        setValue("phone", student.phone || "");
        setValue("careerName", student.careerName || "");
        clearErrors("identificationNumber");
        
        if (student.careerId) {
          const types = await getInternshipTypesByCareer(student.careerId);
          if (types.length > 0) {
            setValue("practiceType", types[0].name);
          } else {
            setValue("practiceType", "");
          }
        }

        const careerAbbr = careers.find(c => String(c.careerId) === String(student.careerId))?.careerAbbreviation || "GEN";
        const enrollmentCode = generateMatricula({
          careerAbbreviation: careerAbbr,
          regime: student.regime,
          semester: student.semester,
          section: student.section,
        });
        setValue("enrollmentCode", enrollmentCode);
      } else {
        clearStudentFields();
        const message = "El estudiante no se encuentra registrado.";
        setError("identificationNumber", {
          type: "manual",
          message,
        });
        addToast({
          variant: "error",
          title: "Error de Validación",
          message
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

  /**
   * Componente interno para mostrar un indicador de campo autogenerado.
   * 
   * @param props - Propiedades del badge.
   * @param props.tooltip - Texto descriptivo que se muestra al pasar el mouse.
   */
  const AutoGeneratedBadge = ({ tooltip }: { tooltip: string }) => (
  <Tooltip content={tooltip}>
    <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-400/10 dark:text-blue-400 dark:ring-blue-400/30 uppercase tracking-wider ml-2 cursor-help">
      Auto
    </span>
  </Tooltip>
);

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} onCloseAttempt={handleCloseAttempt} showCloseButton size="5xl">
        <ModalHeader>
        <div className="max-w-4xl mx-auto w-full">
          <span className="mb-1 font-semibold text-text-primary modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
            {editingEntry ? "Editar Preinscripción" : "Nueva Preinscripción"}
          </span>
          <p className="text-sm text-text-secondary dark:text-text-tertiary font-normal">
            {editingEntry ? "Solo se puede modificar el período de la pre-inscripción." : "Ingresa los detalles para la nueva pre-inscripción."}
          </p>
        </div>
      </ModalHeader>

      <ModalBody className="bg-bg-secondary/30 dark:bg-bg-dark/50">
        <form id="pre-enrollment-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6 sm:space-y-8 max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 sm:gap-x-8 gap-y-5 sm:gap-y-6">
            {/* Cédula */}
            <div>
              <label className="mb-2 block sm:mb-2.5 text-black dark:text-white font-medium text-sm">Cédula *</label>
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
                        disabled={!!editingEntry}
                        error={!!errors.identificationPrefix}
                        onAddNew={() => openAddValueModal("Nacionalidad", "identificationPrefix", "Agregar Nacionalidad")}
                        addNewLabel="Nueva opción"
                      />
                    )}
                  />
                </div>
                <div className="flex-1 relative">
                  <Input
                    {...register("identificationNumber")}
                    placeholder="Escriba el número"
                    error={!!errors.identificationNumber}
                    className={isSearching ? "animate-pulse" : ""}
                    readOnly={!!editingEntry}
                    onKeyDown={(e) => {
                      if (!/[0-9]/.test(e.key) && !["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"].includes(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    onBlur={() => {
                      // Pequeño delay para permitir el click en la sugerencia
                      setTimeout(() => setShowSuggestions(false), 200);
                    }}
                    autoComplete="off"
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"></div>
                    </div>
                  )}

                  {/* Sugerencias de Cédula */}
                  {showSuggestions && !editingEntry && (
                    <div className="absolute z-50 w-full mt-1 bg-white dark:bg-bg-dark border border-border-light dark:border-white/10 rounded-lg shadow-lg max-h-48 overflow-y-auto custom-scrollbar">
                      {suggestions.map((student) => (
                        <button
                          key={student.studentId}
                          type="button"
                          className="w-full px-4 py-2 text-left hover:bg-bg-secondary dark:hover:bg-white/5 text-sm text-text-primary dark:text-white/90 border-b border-border-light dark:border-white/5 last:border-0"
                          onClick={async () => {
                        const enrollments = await enrollmentService.getEnrollments();
                        const alreadyEnrolled = enrollments.find(
                          (e) => e.identificationPrefix === student.identificationPrefix && e.identificationNumber === student.identificationNumber && e.status
                        );
                        if (alreadyEnrolled) {
                          const message = "El estudiante ya posee una inscripción activa. No puede pre-inscribirse.";
                          setError("identificationNumber", {
                            type: "manual",
                            message,
                          });
                          addToast({
                            variant: "error",
                            title: "Error de Validación",
                            message
                          });
                          setShowSuggestions(false);
                          return;
                        }
                            setValue("identificationNumber", student.identificationNumber);
                            setValue("identificationPrefix", student.identificationPrefix);
                            setValue("studentName", `${student.firstName} ${student.lastName}`);
                            setValue("phone", student.phone || "");
                            setValue("careerName", student.careerName || "");
                            
                            if (student.careerId) {
                              const types = await getInternshipTypesByCareer(student.careerId);
                              if (types.length > 0) {
                                setValue("practiceType", types[0].name);
                              }
                            }
                            
                            const careers = await getCareers();
                            const careerAbbr = careers.find(c => String(c.careerId) === String(student.careerId))?.careerAbbreviation || "GEN";
                            const enrollmentCode = generateMatricula({
                              careerAbbreviation: careerAbbr,
                              regime: student.regime,
                              semester: student.semester,
                              section: student.section,
                            });
                            setValue("enrollmentCode", enrollmentCode);
                            
                            setShowSuggestions(false);
                          }}
                        >
                          <div className="font-medium">{student.identificationPrefix}-{student.identificationNumber}</div>
                          <div className="text-xs text-text-tertiary">{student.firstName} {student.lastName}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              {errors.identificationNumber && (
                <p className="mt-1 text-xs text-error-500">{errors.identificationNumber.message}</p>
              )}
            </div>

            {/* Estudiante */}
            <div>
              <div className="flex items-center mb-2 sm:mb-2.5">
                <label className="block text-black dark:text-white font-medium text-sm">Estudiante *</label>
                {!editingEntry && <AutoGeneratedBadge tooltip="Se completa automáticamente al ingresar la cédula del estudiante registrado." />}
              </div>
              <Input
                {...register("studentName")}
                placeholder="Nombre automático"
                error={!!errors.studentName}
                hint={isSubmitted ? errors.studentName?.message : undefined}
                readOnly={true}
                className="bg-bg-secondary dark:bg-white/5 cursor-not-allowed"
              />
            </div>

            {/* Teléfono */}
            <div>
              <div className="flex items-center mb-2 sm:mb-2.5">
                <label className="block text-black dark:text-white font-medium text-sm">Teléfono *</label>
                {!editingEntry && <AutoGeneratedBadge tooltip="Se completa automáticamente al ingresar la cédula del estudiante registrado." />}
              </div>
              <Input
                {...register("phone")}
                placeholder="Teléfono automático"
                error={!!errors.phone}
                hint={isSubmitted ? errors.phone?.message : undefined}
                readOnly={true}
                className="bg-bg-secondary dark:bg-white/5 cursor-not-allowed"
              />
            </div>

            {/* Período */}
            <div>
              <div className="flex items-center mb-2 sm:mb-2.5">
                <label className="block text-black dark:text-white font-medium text-sm">Período *</label>
                {!editingEntry && <AutoGeneratedBadge tooltip="Se selecciona automáticamente el periodo pendiente más cercano." />}
              </div>
              <Controller
                name="period"
                control={control}
                render={({ field }) => (
                  <CustomSelect
                    id="period"
                    options={periods.map((p) => ({ value: p.description, label: p.description }))}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    value={field.value}
                    placeholder="Seleccione el período"
                    disabled={true}
                    error={!!errors.period}
                  />
                )}
              />
              {isSubmitted && errors.period && (
                <p className="mt-1 text-xs text-error-500">{errors.period.message}</p>
              )}
            </div>

            {/* Tipo de Práctica */}
            <div>
              <div className="flex items-center mb-2 sm:mb-2.5">
                <label className="block text-black dark:text-white font-medium text-sm">Tipo de Práctica *</label>
                {!editingEntry && <AutoGeneratedBadge tooltip="Se asigna automáticamente según la carrera del estudiante." />}
              </div>
              <Input
                {...register("practiceType")}
                placeholder="Tipo automático"
                error={!!errors.practiceType}
                hint={isSubmitted ? errors.practiceType?.message : undefined}
                readOnly={true}
                className="bg-bg-secondary dark:bg-white/5 cursor-not-allowed"
              />
            </div>

            {/* Matrícula */}
            <div>
              <div className="flex items-center mb-2 sm:mb-2.5">
                <label className="block text-black dark:text-white font-medium text-sm">Matrícula *</label>
                {!editingEntry && <AutoGeneratedBadge tooltip="Se genera automáticamente basándose en los datos académicos del estudiante." />}
              </div>
              <Input
                {...register("enrollmentCode")}
                placeholder="Matrícula automática"
                error={!!errors.enrollmentCode}
                hint={isSubmitted ? errors.enrollmentCode?.message : undefined}
                readOnly={true}
                className="bg-bg-secondary dark:bg-white/5 cursor-not-allowed"
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
          <AsyncButton 
            type="submit" 
            form="pre-enrollment-form" 
            loading={isLoading} 
            className="w-full sm:w-auto min-h-12" 
            disabled={editingEntry ? !isDirty || !isValid : !isValid}
            onClick={async () => {
              if (!isValid) {
                await handleSubmit(() => {})();
                addToast({
                  variant: "error",
                  title: "Error de Validación",
                  message: "Por favor, complete todos los campos obligatorios correctamente.",
                });
              }
            }}
          >
            {editingEntry ? "Actualizar Registro" : "Guardar Registro"}
          </AsyncButton>
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
  </>
);
}
