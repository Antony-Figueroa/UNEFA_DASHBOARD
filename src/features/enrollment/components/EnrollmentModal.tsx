import { useEffect, useState, useCallback } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Input from "../../../components/form/input/InputField";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../../components/ui/modal";
import { Enrollment, CreateEnrollmentPayload, UpdateEnrollmentPayload } from "../types";
import Button from "../../../components/ui/button/Button";
import AsyncButton from "../../../components/ui/button/AsyncButton";
import CustomSelect from "../../../components/form/CustomSelect";
import { Student } from "../../students/types";
import { getStudents } from "../../students/services/studentsService";
import { getPeriods } from "../../periods/services/periodService";
import { getTutors } from "../../tutors/services/tutorsService";
import { getInstitutions } from "../../institutions/services/institutionsService";
import { getCareers } from "../../careers/services/careersService";
import { useInstitutionalResponsibles } from "../../institutions/hooks/useInstitutionalResponsibles";
import { getPreEnrollments } from "../../pre-enrollment/services/preEnrollmentService";
import { Periodo } from "../../periods/types";
import { Tutor } from "../../tutors/types";
import { Institution } from "../../institutions/types";
import { PreEnrollment, PreEnrollmentRowData } from "../../pre-enrollment/types";
import { Tooltip } from "../../../components/ui/tooltip/Tooltip";
import { getInternshipTypes, mapToOptions } from "../../internship-types/services/internshipTypesService";
import { InternshipTypeOption } from "../../internship-types/types";
import { useUnsavedChanges } from "../../../hooks/useUnsavedChanges";
import UnifiedDialog from "../../../components/ui/dialog/UnifiedDialog";
import { useToast } from "../../../context/toast";
import * as enrollmentService from "../services/enrollmentService";
import { useLists } from "../../lists/hooks/useLists";
import { generateMatricula } from "../../../utils/matricula";
import { isProtectedList, PROTECTED_LIST_MESSAGE } from "../../../constants/systemLists";
import { List } from "../../lists/types";
import * as listsService from "../../lists/services/listsService";
import { formatCedulaDisplay, cleanCedula, CEDULA_MAX_LENGTH } from "../../../utils/inputFormat";

/**
 * Props for the EnrollmentModal component.
 */
interface EnrollmentModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** 
   * Callback to save the enrollment data.
   * Handles both creation and update based on editingEntry.
   */
  onSave: (data: CreateEnrollmentPayload | UpdateEnrollmentPayload) => Promise<void> | void;
  /** The enrollment entry being edited, if any */
  editingEntry?: Enrollment | null;
  /** Whether the save operation is in progress */
  isLoading?: boolean;
  /** Initial data from a pre-enrollment record */
  initialData?: PreEnrollmentRowData | null;
}

/**
 * Zod schema for enrollment form validation.
 */
const enrollmentSchema = z.object({
  identificationPrefix: z.string().min(1, "Seleccione un prefijo"),
  identificationNumber: z.string()
    .min(1, "La identificación es obligatoria")
    .regex(/^\d+$/, "Solo se admiten números"),
  studentName: z.string()
    .min(1, "El nombre del estudiante es obligatorio"),
  period: z.string().min(1, "Seleccione el período"),
  practiceType: z.string().min(1, "Seleccione el tipo de práctica"),
  careerName: z.string().optional(),
  enrollmentCode: z.string().optional(),
  academicTutorId: z.string().min(1, "Seleccione el tutor académico"),
  methodologicalTutorId: z.string().min(1, "Seleccione el tutor metodológico"),
  institutionId: z.string().min(1, "Seleccione la institución"),
  institutionResponsibleId: z.string().min(1, "Seleccione el responsable institucional"),
}).refine((data) => data.academicTutorId !== data.methodologicalTutorId, {
  message: "Los tutores no pueden coincidir",
  path: ["methodologicalTutorId"],
});

/**
 * Type inferred from the enrollment validation schema.
 */
type EnrollmentFormData = z.infer<typeof enrollmentSchema>;

/**
 * Modal component for creating or editing student enrollments.
 * 
 * This component handles student lookup, automatic period assignment,
 * and validation of academic and methodological tutors.
 * 
 * @param props - The component props.
 * @returns The EnrollmentModal component.
 */
export default function EnrollmentModal({
  isOpen,
  onClose,
  onSave,
  editingEntry,
  isLoading = false,
  initialData,
}: EnrollmentModalProps) {
  const [isSearching, setIsSearching] = useState(false);
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [careersState, setCareersState] = useState<{ careerId: string | number; careerName: string }[]>([]);
  const [practiceOptions, setPracticeOptions] = useState<InternshipTypeOption[]>([]);
  const [isLoadingPeriods, setIsLoadingPeriods] = useState(false);
  const [preEnrollmentError, setPreEnrollmentError] = useState<string | null>(null);
  const [options, setOptions] = useState<Record<string, { value: string; label: string }[]>>({});
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingData, setPendingData] = useState<EnrollmentFormData | null>(null);

  // State for display values with formatting
  const [displayIdentificationNumber, setDisplayIdentificationNumber] = useState("");

  // Handle identification number input change with formatting
  const handleIdentificationNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const cleaned = cleanCedula(input);
    const formatted = formatCedulaDisplay(cleaned);
    setDisplayIdentificationNumber(formatted);
    setValue("identificationNumber", cleaned, { shouldValidate: true, shouldDirty: true });
  };

  const { responsibles } = useInstitutionalResponsibles();
  const { fetchMultipleLists } = useLists();
  const { addToast } = useToast();

  // Estado para agregar nuevos valores a las listas
  const [isValueModalOpen, setIsValueModalOpen] = useState(false);
  const [valueModalTitle, setValueModalTitle] = useState<string>("");
  const [targetListName, setTargetListName] = useState<string>("");
  const [targetField, setTargetField] = useState<keyof EnrollmentFormData | "">("");
  const [newValueInput, setNewValueInput] = useState<string>("");
  const [savingNewValue, setSavingNewValue] = useState(false);

  const NATIONALITY_OPTIONS = options["Nacionalidad"] || [
    { value: "V", label: "V" },
    { value: "E", label: "E" },
  ];

  const { 
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors, isSubmitted, isDirty, isValid },
  } = useForm<EnrollmentFormData>({
    resolver: zodResolver(enrollmentSchema),
    defaultValues: {
      identificationPrefix: "V",
      identificationNumber: "",
      studentName: "",
      period: "",
      practiceType: "",
      careerName: "",
      enrollmentCode: "",
      academicTutorId: "",
      methodologicalTutorId: "",
      institutionId: "",
      institutionResponsibleId: "",
    },
  });

  const {
    showConfirmation,
    handleCloseAttempt,
    confirmClose,
    cancelClose,
  } = useUnsavedChanges(isDirty, onClose);

  const idNumber = useWatch({ control, name: "identificationNumber" });
  const idPrefix = useWatch({ control, name: "identificationPrefix" });
  const selectedInstitutionId = useWatch({ control, name: "institutionId" });
  const selectedAcademicTutorId = useWatch({ control, name: "academicTutorId" });
  const selectedMethodologicalTutorId = useWatch({ control, name: "methodologicalTutorId" });

  // Filtrar responsables por institución seleccionada (comparar como strings)
  const filteredResponsibles = responsibles.filter(r => String(r.institutionId) === String(selectedInstitutionId));

  // Cargar opciones dinámicas
  useEffect(() => {
    const loadOptions = async () => {
      try {
        const data = await fetchMultipleLists(["Nacionalidad"]);
        const mappedOptions: Record<string, { value: string; label: string }[]> = {};
        
        Object.entries(data).forEach(([key, values]) => {
          mappedOptions[key] = values.map(v => ({
            // Para Nacionalidad usamos la abreviación (V, E)
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
  const openAddValueModal = (listName: string, field: keyof EnrollmentFormData, title: string) => {
    if (isProtectedList(listName)) {
      addToast({ variant: "warning", title: "Lista Protegida", message: PROTECTED_LIST_MESSAGE });
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
        setValue(targetField as keyof EnrollmentFormData, selectValue, { shouldValidate: true, shouldDirty: true });
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

      setValue(targetField as keyof EnrollmentFormData, mapped.value, { shouldValidate: true, shouldDirty: true });
      setIsValueModalOpen(false);
    } catch (e) {
      console.error("[EnrollmentModal] Error creando valor en lista:", e);
    } finally {
      setSavingNewValue(false);
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingPeriods(true);
      try {
        const [periodData, tutorData, institutionData, practiceData, careerData] = await Promise.all([
          getPeriods(),
          getTutors(),
          getInstitutions(),
          getInternshipTypes(),
          getCareers()
        ]);
        
        setPracticeOptions(mapToOptions(practiceData));
        setCareersState(careerData.filter((c: any) => c.status));
        
        // Lógica de periodos (Replicada de PreEnrollmentModal)
        const currentPeriod = periodData.find(p => p.periodStatus === 2);
        const pendingPeriods = periodData.filter(p => p.periodStatus === 1).sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
        
        let filteredPeriods: Periodo[] = [];
        if (currentPeriod) {
          filteredPeriods = [currentPeriod];
        } else if (pendingPeriods.length > 0) {
          filteredPeriods = [pendingPeriods[0]];
        }

        if (editingEntry) {
          const exists = filteredPeriods.some(p => p.description === editingEntry.period);
          if (!exists) {
            const originalPeriod = periodData.find(p => p.description === editingEntry.period);
            if (originalPeriod) {
              filteredPeriods.push(originalPeriod);
            }
          }
        }
        
        setTutors(tutorData.filter(t => t.status));
        setInstitutions(institutionData.filter(i => i.status));

        if (!editingEntry && filteredPeriods.length > 0) {
          setValue("period", filteredPeriods[0].description);
        }
      } catch (error) {
        console.error("Error al cargar datos:", error);
      } finally {
        setIsLoadingPeriods(false);
      }
    };

    if (isOpen) {
      fetchData();
    }
  }, [isOpen, editingEntry, setValue]);

  /**
   * Efecto para escuchar cuando se agrega una nueva carrera desde el modal de inscripción.
   * Recarga las carreras para mantener la lista actualizada.
   */
  useEffect(() => {
    const handleCareerAdded = async () => {
      try {
        const careerData = await getCareers();
        setCareersState(careerData.filter((c: any) => c.status));
        // Mostrar notificación de éxito
        console.log("[EnrollmentModal] Carrera agregada exitosamente");
      } catch (error) {
        console.error("[EnrollmentModal] Error al recargar carreras:", error);
      }
    };

    window.addEventListener("enrollment:careerAdded", handleCareerAdded);

    return () => {
      window.removeEventListener("enrollment:careerAdded", handleCareerAdded);
    };
  }, []);

  const lookupStudent = useCallback(async (prefix: string, number: string) => {
    if (number.length < 5) return;
    
    setIsSearching(true);
    setPreEnrollmentError(null);
    try {
      const [students, preEnrollments, careerData, enrollments] = await Promise.all([
        getStudents(),
        getPreEnrollments(),
        getCareers(),
        enrollmentService.getEnrollments(),
      ]);

      const student = students.data.find(
        (s: Student) => s.identificationPrefix === prefix && s.identificationNumber === number
      );

      const preEnrollment = preEnrollments.find(
        (p: PreEnrollment) => p.identificationPrefix === prefix && p.identificationNumber === number && p.status
      );

      if (!preEnrollment) {
        setPreEnrollmentError("El estudiante no posee una pre-inscripción activa. No puede proceder.");
        setValue("studentName", "");
        setValue("careerName", "");
        return;
      }

      const alreadyEnrolled = enrollments.find(
        (e) => e.identificationPrefix === prefix && e.identificationNumber === number && e.status
      );

      if (alreadyEnrolled) {
        setPreEnrollmentError("El estudiante ya posee una inscripción activa. No puede proceder.");
        return;
      }

      if (student) {
        setValue("studentName", `${student.firstName} ${student.lastName}`);
        
        // Autocompletar Carrera
        const studentCareer = careerData.find(c => String(c.careerId) === String(student.careerId));
        if (studentCareer) {
          setValue("careerName", String(studentCareer.careerId));
        } else {
          setValue("careerName", "");
        }
        
        setValue("period", preEnrollment.period);
        setValue("practiceType", preEnrollment.practiceType);

        const abbr = (studentCareer?.careerAbbreviation || "GEN").toUpperCase();
        const code = generateMatricula({
          careerAbbreviation: abbr,
          regime: student.regime,
          semester: student.semester,
          section: student.section,
        });
        setValue("enrollmentCode", code);
      }
    } catch (error) {
      console.error("Error buscando estudiante:", error);
    } finally {
      setIsSearching(false);
    }
  }, [setValue]);

  useEffect(() => {
    if (!editingEntry && idNumber) {
      const timer = setTimeout(() => {
        lookupStudent(idPrefix, idNumber);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [idNumber, idPrefix, lookupStudent, editingEntry]);

  useEffect(() => {
    if (initialData && isOpen) {
      setValue("identificationPrefix", initialData.identificationPrefix);
      setValue("identificationNumber", initialData.identificationNumber);
      setDisplayIdentificationNumber(formatCedulaDisplay(initialData.identificationPrefix + initialData.identificationNumber));
      setValue("studentName", initialData.studentName);
      setValue("period", initialData.period);
      setValue("practiceType", initialData.practiceType);
      // Buscar careerId basado en careerName
      const career = careersState.find(c => c.careerName === initialData.careerName);
      setValue("careerName", career ? String(career.careerId) : "");
    }
  }, [initialData, isOpen, setValue, careersState]);

  /**
   * Efecto para escuchar eventos de preinscripción agregada desde el modal.
   */
  useEffect(() => {
    const handleSetPreEnrollment = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) {
        setValue("identificationPrefix", detail.identificationPrefix || "V", { shouldValidate: true, shouldDirty: true });
        setValue("identificationNumber", detail.identificationNumber || "", { shouldValidate: true, shouldDirty: true });
        setValue("studentName", detail.studentName || "", { shouldValidate: true, shouldDirty: true });
        setValue("period", detail.period || "", { shouldValidate: true, shouldDirty: true });
        setValue("practiceType", detail.practiceType || "", { shouldValidate: true, shouldDirty: true });
        setValue("careerName", detail.careerName || "", { shouldValidate: true, shouldDirty: true });
        setDisplayIdentificationNumber(formatCedulaDisplay((detail.identificationPrefix || "V") + (detail.identificationNumber || "")));
      }
    };
    window.addEventListener("enrollment:setPreEnrollment", handleSetPreEnrollment as EventListener);
    return () => {
      window.removeEventListener("enrollment:setPreEnrollment", handleSetPreEnrollment as EventListener);
    };
  }, [setValue]);

  /**
   * Efecto para escuchar eventos de tutor agregado desde el modal.
   */
  useEffect(() => {
    const handleSetTutor = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.tutorId) {
        setValue("academicTutorId", detail.tutorId, { shouldValidate: true, shouldDirty: true });
      }
    };
    window.addEventListener("enrollment:setTutor", handleSetTutor as EventListener);
    return () => {
      window.removeEventListener("enrollment:setTutor", handleSetTutor as EventListener);
    };
  }, [setValue]);

  /**
   * Efecto para escuchar cuando se agrega un nuevo tutor y actualizar la lista.
   */
  useEffect(() => {
    const handleTutorAdded = async () => {
      try {
        const tutorData = await getTutors();
        setTutors(tutorData.filter(t => t.status));
        console.log("[EnrollmentModal] Tutores actualizados después de registro");
      } catch (error) {
        console.error("[EnrollmentModal] Error al recargar tutores:", error);
      }
    };

    window.addEventListener("enrollment:tutorAdded", handleTutorAdded);

    return () => {
      window.removeEventListener("enrollment:tutorAdded", handleTutorAdded);
    };
  }, []);

  /**
   * Efecto para escuchar eventos de responsable institucional agregado desde el modal.
   */
  useEffect(() => {
    const handleSetResponsible = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.responsibleId) {
        setValue("institutionResponsibleId", detail.responsibleId, { shouldValidate: true, shouldDirty: true });
      }
    };
    window.addEventListener("enrollment:setResponsible", handleSetResponsible as EventListener);
    return () => {
      window.removeEventListener("enrollment:setResponsible", handleSetResponsible as EventListener);
    };
  }, [setValue]);

  /**
   * Handles form submission.
   * Transforms form data into either CreateEnrollmentPayload or UpdateEnrollmentPayload.
   * 
   * @param data - The validated form data.
   */
  const onSubmit = (data: EnrollmentFormData) => {
    if (preEnrollmentError) return;
    setPendingData(data);
    setShowConfirmDialog(true);
  };

  const handleConfirmSave = () => {
    if (!pendingData) return;
    const data = pendingData;

    const academicTutor = tutors.find(t => t.tutorId === data.academicTutorId);
    const methodologicalTutor = tutors.find(t => t.tutorId === data.methodologicalTutorId);
    const institution = institutions.find(i => i.institutionId === data.institutionId);
    const responsible = responsibles.find(r => r.responsibleId === data.institutionResponsibleId);

    const baseData = {
      ...data,
      identificationPrefix: data.identificationPrefix as "V" | "E",
      academicTutorName: academicTutor ? `${academicTutor.firstName} ${academicTutor.lastName}`.toUpperCase() : undefined,
      methodologicalTutorName: methodologicalTutor ? `${methodologicalTutor.firstName} ${methodologicalTutor.lastName}`.toUpperCase() : undefined,
      institutionName: institution?.name ? institution.name.toUpperCase() : undefined,
      institutionResponsibleName: responsible ? `${responsible.firstName} ${responsible.lastName}`.toUpperCase() : undefined,
      enrollmentCode: typeof data.enrollmentCode === "string" ? data.enrollmentCode.toUpperCase() : data.enrollmentCode,
    };

    const normalized = Object.fromEntries(
      Object.entries(baseData).map(([k, v]) => {
        if (typeof v === "string") return [k, v.toUpperCase()];
        return [k, v];
      })
    ) as typeof baseData;

    if (editingEntry) {
      onSave({
        ...normalized,
        enrollmentId: editingEntry.enrollmentId,
        status: editingEntry.status,
      } as UpdateEnrollmentPayload);
    } else {
      onSave({
        ...normalized,
        status: true,
      } as CreateEnrollmentPayload);
    }
    
    setShowConfirmDialog(false);
    setPendingData(null);
  };

  /**
   * Badge component for automatically generated fields.
   */
  const AutoGeneratedBadge = ({ tooltip }: { tooltip: string }) => (
    <Tooltip content={tooltip}>
      <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-400/10 dark:text-blue-400 dark:ring-blue-400/30 uppercase tracking-widestr ml-2 cursor-help">
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
            {editingEntry ? "Editar Inscripción" : "Nueva Inscripción"}
          </span>
          <p className="text-sm text-text-secondary dark:text-text-tertiary font-normal">
            {editingEntry ? "Modifica los detalles de la inscripción." : "Ingresa los detalles para la nueva inscripción."}
          </p>
        </div>
      </ModalHeader>

      <ModalBody className="bg-bg-secondary/30 dark:bg-bg-dark/50">
        <form id="enrollment-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6 sm:space-y-8 max-w-4xl mx-auto">
          {/* Botón para agregar preinscripción */}
          {!editingEntry && !initialData && (
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const evt = new CustomEvent("enrollment:addPreEnrollment");
                  window.dispatchEvent(evt);
                }}
                className="text-brand-600 border-brand-300 hover:bg-brand-50 dark:text-brand-400 dark:border-brand-600 dark:hover:bg-brand-900/20"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Nueva Preinscripción
              </Button>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 sm:gap-x-8 gap-y-5 sm:gap-y-6">
            {/* Cédula */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-text-primary dark:text-white/90">
                Cédula *
              </label>
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
                        disabled={!!editingEntry || !!initialData}
                        error={!!errors.identificationPrefix}
                      />
                    )}
                  />
                </div>
<div className="flex-1 relative">
                  <Input
                    value={displayIdentificationNumber}
                    onChange={handleIdentificationNumberChange}
                    placeholder="V00.000.000"
                    error={!!errors.identificationNumber || !!preEnrollmentError}
                    hint={errors.identificationNumber?.message || preEnrollmentError || undefined}
                    className={isSearching ? "animate-pulse tracking-widest" : "tracking-widest"}
                    disabled={!!editingEntry || !!initialData}
                    maxLength={CEDULA_MAX_LENGTH}
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Estudiante */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-text-primary dark:text-white/90">
                  Estudiante *
                </label>
                {!editingEntry && <AutoGeneratedBadge tooltip="Se completa automáticamente al verificar la pre-inscripción." />}
              </div>
              <Input
                {...register("studentName")}
                placeholder="Nombre del estudiante"
                error={!!errors.studentName}
                hint={errors.studentName?.message}
                readOnly
                className="bg-bg-secondary dark:bg-white/5 cursor-not-allowed"
              />
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-text-primary dark:text-white/90">
                  Período *
                </label>
                {!editingEntry && <AutoGeneratedBadge tooltip="Se asigna automáticamente el período académico vigente." />}
              </div>
              <Input
                {...register("period")}
                placeholder={isLoadingPeriods ? "Cargando períodos..." : "Período automático"}
                error={!!errors.period}
                hint={isSubmitted ? errors.period?.message : undefined}
                readOnly
                className="bg-bg-secondary dark:bg-white/5 cursor-not-allowed"
              />
            </div>

            {/* Tipo Práctica */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-text-primary dark:text-white/90">
                  Tipo Práctica *
                </label>
                {!editingEntry && <AutoGeneratedBadge tooltip="Determinado automáticamente según la carrera del estudiante." />}
              </div>
              {editingEntry ? (
                <Controller
                  name="practiceType"
                  control={control}
                  render={({ field }) => (
                    <CustomSelect
                      options={practiceOptions}
                      placeholder="Seleccione el tipo"
                      onChange={field.onChange}
                      value={field.value}
                    />
                  )}
                />
              ) : (
                <Input
                  value={watch("practiceType") || ""}
                  placeholder="Se determina automáticamente"
                  readOnly
                  className="bg-bg-secondary dark:bg-white/5 cursor-not-allowed"
                />
              )}
              {errors.practiceType && (
                <p className="mt-1 text-xs text-error-500">{errors.practiceType?.message}</p>
              )}
            </div>

            {/* Carrera */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-text-primary dark:text-white/90">
                  Carrera *
                </label>
                {!editingEntry && <AutoGeneratedBadge tooltip="Se asigna automáticamente según la pre-inscripción del estudiante." />}
              </div>
              {editingEntry ? (
                <Controller
                  name="careerName"
                  control={control}
                  render={({ field }) => (
                    <CustomSelect
                      options={careersState.map(c => ({
                        value: String(c.careerId),
                        label: c.careerName
                      }))}
                      placeholder="Seleccione la carrera"
                      onChange={(val) => {
                        field.onChange(val);
                      }}
                      value={field.value ? String(field.value) : ""}
                    />
                  )}
                />
              ) : (
                <Input
                  placeholder="Se asigna automáticamente"
                  readOnly
                  value={(() => {
                    const career = careersState.find(c => String(c.careerId) === watch("careerName"));
                    return career ? career.careerName : "";
                  })()}
                  className="bg-bg-secondary dark:bg-white/5 cursor-not-allowed"
                />
              )}
              {errors.careerName && (
                <p className="mt-1 text-xs text-error-500">{errors.careerName?.message}</p>
              )}
            </div>

            {/* Matrícula */}
            <div>
              <div className="flex items-center mb-2 sm:mb-2.5">
                <label className="block text-black dark:text-white font-medium text-sm">Matrícula</label>
                <AutoGeneratedBadge tooltip="Se genera automáticamente a partir de los datos del estudiante." />
              </div>
              <Input
                {...register("enrollmentCode")}
                placeholder="Matrícula automática"
                readOnly
                className="bg-bg-secondary dark:bg-white/5 cursor-not-allowed font-mono"
              />
            </div>

            {/* Tutor Académico */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-text-primary dark:text-white/90">
                Tutor Académico *
              </label>
              <Controller
                name="academicTutorId"
                control={control}
                render={({ field }) => (
                  <CustomSelect
                    options={tutors
                      .filter(t => t.tutorId !== selectedMethodologicalTutorId)
                      .map(t => ({
                        value: t.tutorId,
                        label: `${t.firstName} ${t.lastName}`
                      }))}
                    placeholder="Seleccione el tutor"
                    onChange={field.onChange}
                    value={String(field.value)}
                  />
                )}
              />
              {errors.academicTutorId && (
                <p className="mt-1 text-xs text-error-500">{errors.academicTutorId?.message}</p>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  const evt = new CustomEvent("enrollment:addTutor");
                  window.dispatchEvent(evt);
                }}
                className="text-brand-600 hover:text-brand-700 dark:text-brand-400 mt-1 self-start"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Nuevo Tutor Académico
              </Button>
            </div>

            {/* Tutor Metodológico */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-text-primary dark:text-white/90">
                Tutor Metodológico *
              </label>
              <Controller
                name="methodologicalTutorId"
                control={control}
                render={({ field }) => (
                  <CustomSelect
                    options={tutors
                      .filter(t => t.tutorId !== selectedAcademicTutorId)
                      .map(t => ({
                        value: t.tutorId,
                        label: `${t.firstName} ${t.lastName}`
                      }))}
                    placeholder="Seleccione el tutor"
                    onChange={field.onChange}
                    value={String(field.value)}
                  />
                )}
              />
              {errors.methodologicalTutorId && (
                <p className="mt-1 text-xs text-error-500">{errors.methodologicalTutorId?.message}</p>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  const evt = new CustomEvent("enrollment:addTutor");
                  window.dispatchEvent(evt);
                }}
                className="text-brand-600 hover:text-brand-700 dark:text-brand-400 mt-1 self-start"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Nuevo Tutor Metodológico
              </Button>
            </div>

            {/* Institución */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-text-primary dark:text-white/90">
                Institución *
              </label>
              <Controller
                name="institutionId"
                control={control}
                render={({ field }) => (
                  <CustomSelect
                    options={institutions.map(i => ({
                      value: i.institutionId,
                      label: `${i.name}${i.region || i.nucleus ? ` (${[i.region, i.nucleus].filter(Boolean).join(' - ')})` : ''}`
                    }))}
                    placeholder="Seleccione la institución"
                    onChange={(val) => {
                      field.onChange(val);
                      setValue("institutionResponsibleId", ""); // Reset responsible when institution changes
                    }}
                    value={String(field.value)}
                  />
                )}
              />
              {errors.institutionId && (
                <p className="mt-1 text-xs text-error-500">{errors.institutionId?.message}</p>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  const evt = new CustomEvent("enrollment:addInstitution");
                  window.dispatchEvent(evt);
                }}
                className="text-brand-600 hover:text-brand-700 dark:text-brand-400 mt-1 self-start"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Nueva Institución
              </Button>
            </div>

            {/* Responsable Institucional */}
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-text-primary dark:text-white/90">
                Responsable Institucional *
              </label>
              <Controller
                name="institutionResponsibleId"
                control={control}
                render={({ field }) => (
                  <CustomSelect
                    options={filteredResponsibles.map(r => ({
                      value: r.responsibleId,
                      label: `${r.firstName} ${r.lastName}`
                    }))}
                    placeholder={
                      !selectedInstitutionId 
                        ? "Seleccione primero la institución" 
                        : filteredResponsibles.length === 0 
                          ? "No hay responsables para esta institución" 
                          : "Seleccione el responsable"
                    }
                    onChange={field.onChange}
                    value={String(field.value || "")}
                    disabled={!selectedInstitutionId || filteredResponsibles.length === 0}
                  />
                )}
              />
              {errors.institutionResponsibleId && (
                <p className="mt-1 text-xs text-error-500">{errors.institutionResponsibleId?.message}</p>
              )}
              {selectedInstitutionId && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const evt = new CustomEvent("enrollment:addResponsible", { detail: { institutionId: selectedInstitutionId } });
                    window.dispatchEvent(evt);
                  }}
                  className="text-brand-600 hover:text-brand-700 dark:text-brand-400 mt-1 self-start"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Nuevo Responsable Institucional
                </Button>
              )}
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
            form="enrollment-form" 
            loading={isLoading} 
            className="w-full sm:w-auto min-h-12" 
            disabled={editingEntry ? !isDirty || !isValid : !isValid || !!preEnrollmentError}
          >
            {editingEntry ? "Actualizar Inscripción" : "Guardar Inscripción"}
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
      onClose={() => {
        setShowConfirmDialog(false);
        setPendingData(null);
      }}
      onConfirm={handleConfirmSave}
      title={editingEntry ? "Actualizar Inscripción" : "Guardar Inscripción"}
      message={`¿Estás seguro de que deseas ${editingEntry ? 'actualizar' : 'guardar'} la inscripción del estudiante?`}
      variant="confirm"
      confirmLabel={editingEntry ? "Actualizar" : "Guardar"}
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
