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
import { UserCircleIcon, ShieldCheckIcon, DocsIcon, SearchIcon, UsersIcon } from "../../../icons";
import { cn } from "../../../utils/cn";
import Badge from "../../../components/ui/badge/Badge";

// Inline icons for missing ones
const BookOpenIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
  </svg>
);

const AcademicCapIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
  </svg>
);

const BuildingOfficeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-1.5c0-1.5 1.5-3 3.75-3h.75m0 0c1.5 0 3.75 1.5 3.75 3v1.5M12 18v-1.5m0 0c-1.5 0-3.75-1.5-3.75-3V9m0 0c1.5 0 3.75 1.5 3.75 3v1.5M3.375 21h1.5A1.125 1.125 0 005.625 21.375v-1.5a2.625 2.625 0 015.25-1.5h.375M3.375 9.375A2.625 2.625 0 006 12h.375m.375 3.75h.375a1.125 1.125 0 011.125 1.125v.375M6 18h.375A1.125 1.125 0 017.125 21.375v-.375M6 6h.375A1.125 1.125 0 017.125 5.25v-.375M9 12h.375m.375 3h.375a1.125 1.125 0 011.125 1.125v.375M9 6h.375A1.125 1.125 0 0110.125 5.25v-.375" />
  </svg>
);

// Longitud máxima para Cédula en inscripción (8 dígitos: V-00.000.000 = 11 caracteres)
const ENROLLMENT_CEDULA_MAX_LENGTH = 11;

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
    reset,
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
  const selectedCareerName = useWatch({ control, name: "careerName" });
  const selectedPracticeType = useWatch({ control, name: "practiceType" });
  const selectedInstitutionId = useWatch({ control, name: "institutionId" });
  const selectedAcademicTutorId = useWatch({ control, name: "academicTutorId" });
  const selectedMethodologicalTutorId = useWatch({ control, name: "methodologicalTutorId" });

  // Filtrar responsables por institución seleccionada (comparar como strings)
  const filteredResponsibles = responsibles.filter(r => 
    r.institutions?.some(inst => String(inst.institutionId) === String(selectedInstitutionId))
  );

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

  // Resetear formulario cuando se abre el modal para nueva inscripción
  // Solo resetear si es UNA NUEVA inscripción (no-editar y sin initialData)
  useEffect(() => {
    if (!isOpen) return;
    
    // Si hay datos de edición o initialData, NO reseteamos - esos datos se cargan en otros efectos
    if (editingEntry || initialData) {
      return;
    }
    
    // Solo resetear para nueva inscripción
    reset({
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
    });
    setDisplayIdentificationNumber("");
    setPreEnrollmentError(null);
  }, [isOpen, editingEntry, initialData, reset]);

  // Efecto para cargar datos cuando se edita un registro existente
  useEffect(() => {
    if (!isOpen || !editingEntry) return;
    
    // Cargar datos del registro a editar
    setValue("identificationPrefix", editingEntry.identificationPrefix || "V");
    setValue("identificationNumber", editingEntry.identificationNumber || "");
    setDisplayIdentificationNumber(formatCedulaDisplay((editingEntry.identificationPrefix || "V") + (editingEntry.identificationNumber || "")));
    setValue("studentName", editingEntry.studentName || "");
    setValue("period", editingEntry.period || "");
    setValue("practiceType", editingEntry.practiceType || "");
    setValue("careerName", editingEntry.careerName || "");
    setValue("enrollmentCode", editingEntry.enrollmentCode || "");
    setValue("academicTutorId", editingEntry.academicTutorId || "");
    setValue("methodologicalTutorId", editingEntry.methodologicalTutorId || "");
    setValue("institutionId", editingEntry.institutionId || "");
    setValue("institutionResponsibleId", editingEntry.institutionResponsibleId || "");
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
        console.log("[EnrollmentModal] Carrera actualizada exitosamente");
      } catch (error) {
        console.error("[EnrollmentModal] Error al recargar carreras:", error);
      }
    };

    // Escuchar evento de nueva carrera creada
    window.addEventListener("enrollment:careerAdded", handleCareerAdded);
    // Escuchar evento de carrera editada (actualizada)
    window.addEventListener("career:saved", handleCareerAdded);

    return () => {
      window.removeEventListener("enrollment:careerAdded", handleCareerAdded);
      window.removeEventListener("career:saved", handleCareerAdded);
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

      // Verificar si ya tiene una inscripción activa
      const activeEnrollment = enrollments.find(
        (e) => e.identificationPrefix === prefix && e.identificationNumber === number && e.status === true
      );

      if (activeEnrollment) {
        setPreEnrollmentError("El estudiante ya posee una inscripción activa. No puede proceder.");
        return;
      }

      // Verificar si tiene inscripción culminada (inactiva pero con código)
      const culminatedEnrollment = enrollments.find(
        (e) => e.identificationPrefix === prefix && e.identificationNumber === number && e.enrollmentCode
      );

      if (culminatedEnrollment) {
        setPreEnrollmentError("El estudiante ya possui uma inscrição concluída. Não é possível registrar uma nova inscrição.");
        return;
      }

      // Verificar pre-inscripción activa solo si no tiene inscripción previa
      if (!preEnrollment) {
        setPreEnrollmentError("El estudiante no posee una pre-inscripción activa. No puede proceder.");
        setValue("studentName", "");
        setValue("careerName", "");
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

    // Escuchar evento de nuevo tutor creado
    window.addEventListener("enrollment:tutorAdded", handleTutorAdded);
    // Escuchar evento de tutor editado (actualizado)
    window.addEventListener("tutor:saved", handleTutorAdded);

    return () => {
      window.removeEventListener("enrollment:tutorAdded", handleTutorAdded);
      window.removeEventListener("tutor:saved", handleTutorAdded);
    };
  }, []);

  /**
   * Efecto para escuchar cuando se crea/actualiza una institución y recargar la lista.
   */
  useEffect(() => {
    const handleInstitutionSaved = async () => {
      try {
        const institutionData = await getInstitutions();
        setInstitutions(institutionData.filter(i => i.status));
        console.log("[EnrollmentModal] Instituciones actualizadas");
      } catch (error) {
        console.error("[EnrollmentModal] Error al recargar instituciones:", error);
      }
    };

    // Escuchar evento de nueva institución creada
    window.addEventListener("enrollment:addInstitution", handleInstitutionSaved);
    // Escuchar evento de institución editada
    window.addEventListener("institution:saved", handleInstitutionSaved);

    return () => {
      window.removeEventListener("enrollment:addInstitution", handleInstitutionSaved);
      window.removeEventListener("institution:saved", handleInstitutionSaved);
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
        <ModalHeader className="border-b border-border-light dark:border-white/5 pb-5">
          <div className="max-w-5xl mx-auto w-full px-2 pt-2">
            <div className="flex items-center gap-3 mb-1">
              <div className="h-10 w-10 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-600 dark:text-brand-400">
                <DocsIcon className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-text-primary dark:text-white tracking-tight">
                  {editingEntry ? "Gestión de Inscripción" : "Nueva Inscripción"}
                </h2>
                <p className="text-xs text-text-tertiary font-medium">
                  {editingEntry ? "Actualiza los detalles académicos y empresariales del estudiante." : "Registra a un estudiante vinculándolo con tutores y una empresa para su práctica profesional."}
                </p>
              </div>
            </div>
          </div>
        </ModalHeader>

      <ModalBody className="bg-slate-50/50 dark:bg-transparent custom-scrollbar">
        <form id="enrollment-form" onSubmit={handleSubmit(onSubmit)} className="max-w-5xl mx-auto py-8 px-2">
          {/* Botón para agregar preinscripción */}
          {!editingEntry && !initialData && (
            <div className="flex justify-end mb-6">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const evt = new CustomEvent("enrollment:addPreEnrollment");
                  window.dispatchEvent(evt);
                }}
                className="text-brand-600 border-brand-300 hover:bg-brand-50 dark:text-brand-400 dark:border-brand-600 dark:hover:bg-brand-900/20 rounded-xl font-bold"
              >
                <SearchIcon className="w-4 h-4 mr-1" />
                Nueva Preinscripción
              </Button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Columna Izquierda: Identificación y Datos Académicos */}
            <div className="lg:col-span-7 space-y-6">
              {/* Card: Identificación */}
              <div className="bg-white dark:bg-white/5 rounded-2xl p-6 border border-border-light dark:border-white/10 shadow-sm space-y-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-brand-500/10 flex items-center justify-center text-brand-600">
                      <SearchIcon className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-bold text-text-primary dark:text-white">Identificación</h3>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="block text-[10px] font-bold text-text-tertiary uppercase tracking-widest">Documento de Identidad *</label>
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
                            disabled={!!editingEntry || !!initialData}
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
                        error={!!errors.identificationNumber || !!preEnrollmentError}
                        className={cn(
                          "rounded-xl h-[48px] font-bold tracking-wider",
                          isSearching && "animate-pulse"
                        )}
                        disabled={!!editingEntry || !!initialData}
                        maxLength={ENROLLMENT_CEDULA_MAX_LENGTH}
                      />
                      {isSearching && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"></div>
                        </div>
                      )}
                    </div>
                  </div>
                  {errors.identificationNumber && (
                    <p className="text-[11px] font-bold text-error-500 flex items-center gap-1.5 animate-pulse">
                      {errors.identificationNumber.message || preEnrollmentError}
                    </p>
                  )}
                </div>
              </div>

              {/* Card: Perfil del Estudiante */}
              <div className={cn(
                "bg-white dark:bg-white/5 rounded-2xl border transition-all duration-500 overflow-hidden relative",
                watch("studentName")
                  ? "border-brand-500/20 shadow-lg shadow-brand-500/5 opacity-100 translate-y-0" 
                  : "border-border-light/50 opacity-40 grayscale translate-y-2 pointer-events-none"
              )}>
                {!watch("studentName") && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-50/50 dark:bg-transparent z-10">
                    <p className="text-xs font-bold text-text-tertiary uppercase tracking-tighter">Esperando selección...</p>
                  </div>
                )}
                
                <div className="p-6 sm:p-7 space-y-5">
                  <div className="flex items-center gap-5">
                    <div className={cn(
                      "h-14 w-14 rounded-2xl flex items-center justify-center text-white transition-all duration-500",
                      watch("studentName") ? "bg-brand-500 shadow-lg shadow-brand-500/20 rotate-0" : "bg-slate-200 rotate-3"
                    )}>
                      <UserCircleIcon className="w-9 h-9" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xl font-bold text-text-primary dark:text-white leading-tight">
                          {watch("studentName") || "Nombre del Estudiante"}
                        </h4>
                        {watch("studentName") && <Badge color="success" variant="light" size="sm" className="font-bold">Verificado</Badge>}
                      </div>
                      <div className="flex items-center gap-2 text-xs font-semibold text-text-tertiary">
                        <DocsIcon className="w-3.5 h-3.5" />
                        {(() => {
                          const career = careersState.find(c => String(c.careerId) === String(watch("careerName")));
                          return career?.careerName || "Carrera Académica";
                        })()}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border-light dark:border-white/5">
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-widest">Documento</span>
                      <p className="text-sm font-bold text-text-primary">{idPrefix || '-'}-{idNumber || '-------'}</p>
                    </div>
                    <div className="space-y-1 text-right">
                      <span className="text-[9px] font-bold text-text-tertiary uppercase tracking-widest">Período</span>
                      <p className="text-sm font-bold text-text-primary truncate">{watch("period") || '-------'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card: Datos Académicos */}
              <div className="bg-white dark:bg-white/5 rounded-2xl p-6 border border-border-light dark:border-white/10 shadow-sm space-y-6">
                <div className="flex items-center gap-3 border-b border-border-light dark:border-white/5 pb-4">
                  <div className="h-9 w-9 rounded-lg bg-success-500/10 flex items-center justify-center text-success-600">
                    <ShieldCheckIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-text-primary dark:text-white">Datos Académicos</h3>
                    <p className="text-[10px] text-text-tertiary font-bold uppercase tracking-tighter">Configuración automática</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Período */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Período *</label>
                      {!editingEntry && <Badge color="info" variant="light" size="sm" className="font-bold text-[9px] px-1.5 backdrop-blur-sm">AUTO</Badge>}
                    </div>
                    <Input
                      {...register("period")}
                      placeholder={isLoadingPeriods ? "Cargando..." : "Período automático"}
                      error={!!errors.period}
                      readOnly
                      className="rounded-xl h-[48px] bg-slate-50/50"
                    />
                  </div>

                  {/* Tipo Práctica */}
                  <div className="space-y-3">
                    <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider block">Tipo Práctica *</label>
                    {editingEntry ? (
                      <Controller
                        name="practiceType"
                        control={control}
                        render={({ field }) => (
                          <CustomSelect
                            options={practiceOptions}
                            placeholder={field.value || "Tipo de práctica"}
                            onChange={field.onChange}
                            value={field.value}
                            className="rounded-xl h-[48px]"
                          />
                        )}
                      />
                    ) : (
                      <div className={cn(
                        "h-[48px] px-4 rounded-xl border flex items-center gap-3 transition-colors",
                        watch("practiceType") ? "bg-brand-50/30 border-brand-200 text-brand-700 font-bold" : "bg-slate-50 border-border-light text-text-tertiary italic"
                      )}>
                        <ShieldCheckIcon className={cn("w-4 h-4", watch("practiceType") ? "text-brand-500" : "text-slate-300")} />
                        <span className="text-sm">{watch("practiceType") || "Pendiente..."}</span>
                      </div>
                    )}
                  </div>

                  {/* Carrera */}
                  <div className="col-span-2 space-y-3">
                    <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider block">Carrera</label>
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
                            placeholder="Seleccionar carrera"
                            onChange={(val) => field.onChange(val)}
                            value={field.value ? String(field.value) : ""}
                            className="rounded-xl h-[48px]"
                            onAddNew={() => {
                              const evt = new CustomEvent("enrollment:addCareer");
                              window.dispatchEvent(evt);
                            }}
                            addNewLabel="Agregar Carrera"
                          />
                        )}
                      />
                    ) : (
                      <div className={cn(
                        "h-[48px] px-4 rounded-xl border flex items-center gap-3 transition-colors",
                        watch("careerName") ? "bg-brand-50/30 border-brand-200 text-brand-700 font-bold" : "bg-slate-50 border-border-light text-text-tertiary italic"
                      )}>
                        <BookOpenIcon className={cn("w-4 h-4", watch("careerName") ? "text-brand-500" : "text-slate-300")} />
                        <span className="text-sm truncate">
                          {(() => {
                            const career = careersState.find(c => String(c.careerId) === String(watch("careerName")));
                            return career?.careerName || "Pendiente...";
                          })()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Matrícula */}
                  <div className="col-span-2 space-y-3 pt-2">
                    <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider block">Matrícula Asignada</label>
                    <div className={cn(
                      "h-[60px] rounded-2xl border-2 border-dashed flex items-center justify-center transition-all duration-300",
                      watch("enrollmentCode") ? "border-brand-500/50 bg-brand-500/5 text-brand-600 shadow-inner" : "border-slate-200 bg-slate-50/50 text-slate-400"
                    )}>
                      <span className={cn(
                        "text-xl font-mono font-bold tracking-[0.2em]",
                        watch("enrollmentCode") ? "text-brand-600" : "text-slate-300"
                      )}>
                        {watch("enrollmentCode") || "--------"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Columna Derecha: Tutores e Institución */}
            <div className="lg:col-span-5 space-y-6">
              {/* Card: Tutor Académico */}
              <div className="bg-white dark:bg-white/5 rounded-2xl p-6 border border-border-light dark:border-white/10 shadow-sm space-y-5">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
                    <AcademicCapIcon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-text-primary dark:text-white">Tutor Académico</h3>
                </div>

                <div className="space-y-4">
                  <Controller
                    name="academicTutorId"
                    control={control}
                    render={({ field }) => {
                      const careerId = String(selectedCareerName);
                      const filteredTutors = tutors.filter(t => {
                        // Excluir el tutor metodológico seleccionado
                        if (t.tutorId === selectedMethodologicalTutorId) return false;
                        // Filtrar por carrera si hay una seleccionada
                        if (careerId && t.carreras) {
                          return t.carreras.some((c: string) => String(c) === careerId || c === careerId);
                        }
                        return true;
                      });
                      
                      return (
                        <CustomSelect
                          options={filteredTutors.map(t => ({
                            value: t.tutorId,
                            label: `${t.firstName} ${t.lastName}`
                          }))}
                          placeholder={careerId 
                            ? (filteredTutors.length === 0 
                                ? "No hay tutores para esta carrera" 
                                : "Seleccione el tutor académico")
                            : "Seleccione un estudiante primero"}
                          onChange={field.onChange}
                          value={String(field.value)}
                          className="rounded-xl h-[48px]"
                          disabled={!careerId}
                          onAddNew={careerId ? () => {
                            const evt = new CustomEvent("enrollment:addTutor");
                            window.dispatchEvent(evt);
                          } : undefined}
                          addNewLabel={careerId && filteredTutors.length > 0 ? "Nuevo Tutor Académico" : undefined}
                        />
                      );
                    }}
                  />
                  {errors.academicTutorId && (
                    <p className="text-[11px] font-bold text-error-500">{errors.academicTutorId.message}</p>
                  )}
                  {selectedCareerName && tutors.filter(t => {
                    if (t.tutorId === selectedMethodologicalTutorId) return false;
                    const careerId = String(selectedCareerName);
                    if (careerId && t.carreras) {
                      return t.carreras.some((c: string) => String(c) === careerId || c === careerId);
                    }
                    return true;
                  }).length === 0 && (
                    <p className="text-[11px] font-bold text-amber-600">
                      No hay tutores asignados a esta carrera. ¿Desea crear uno?
                    </p>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const evt = new CustomEvent("enrollment:addTutor");
                      window.dispatchEvent(evt);
                    }}
                    className="text-brand-600 hover:text-brand-700 dark:text-brand-400 mt-1 self-start rounded-lg font-bold"
                  >
                    <SearchIcon className="w-4 h-4 mr-1" />
                    Nuevo Tutor Académico
                  </Button>
                </div>
              </div>

              {/* Card: Tutor Metodológico */}
              <div className="bg-white dark:bg-white/5 rounded-2xl p-6 border border-border-light dark:border-white/10 shadow-sm space-y-5">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-600">
                    <UsersIcon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-text-primary dark:text-white">Tutor Metodológico</h3>
                </div>

                <div className="space-y-4">
                  <Controller
                    name="methodologicalTutorId"
                    control={control}
                    render={({ field }) => {
                      const careerId = String(selectedCareerName);
                      const filteredTutors = tutors.filter(t => {
                        // Excluir el tutor académico seleccionado
                        if (t.tutorId === selectedAcademicTutorId) return false;
                        // Filtrar por carrera si hay una seleccionada
                        if (careerId && t.carreras) {
                          return t.carreras.some((c: string) => String(c) === careerId || c === careerId);
                        }
                        return true;
                      });
                      
                      return (
                        <CustomSelect
                          options={filteredTutors.map(t => ({
                            value: t.tutorId,
                            label: `${t.firstName} ${t.lastName}`
                          }))}
                          placeholder={careerId 
                            ? (filteredTutors.length === 0 
                                ? "No hay tutores para esta carrera" 
                                : "Seleccione el tutor metodológico")
                            : "Seleccione un estudiante primero"}
                          onChange={field.onChange}
                          value={String(field.value)}
                          className="rounded-xl h-[48px]"
                          disabled={!careerId}
                          onAddNew={careerId ? () => {
                            const evt = new CustomEvent("enrollment:addTutor");
                            window.dispatchEvent(evt);
                          } : undefined}
                          addNewLabel={careerId && filteredTutors.length > 0 ? "Nuevo Tutor Metodológico" : undefined}
                        />
                      );
                    }}
                  />
                  {errors.methodologicalTutorId && (
                    <p className="text-[11px] font-bold text-error-500">{errors.methodologicalTutorId.message}</p>
                  )}
                  {selectedCareerName && tutors.filter(t => {
                    if (t.tutorId === selectedAcademicTutorId) return false;
                    const careerId = String(selectedCareerName);
                    if (careerId && t.carreras) {
                      return t.carreras.some((c: string) => String(c) === careerId || c === careerId);
                    }
                    return true;
                  }).length === 0 && (
                    <p className="text-[11px] font-bold text-amber-600">
                      No hay tutores asignados a esta carrera. ¿Desea crear uno?
                    </p>
                  )}
                </div>
              </div>

              {/* Card: Empresa/Institución */}
              <div className="bg-white dark:bg-white/5 rounded-2xl p-6 border border-border-light dark:border-white/10 shadow-sm space-y-5">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-600">
                    <BuildingOfficeIcon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-text-primary dark:text-white">Empresa / Institución</h3>
                </div>

                <div className="space-y-4">
                  {/* Institución */}
                  <div className="space-y-3">
                    <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Institución *</label>
                    <Controller
                      name="institutionId"
                      control={control}
                      render={({ field }) => {
                        const careerId = String(selectedCareerName);
                        const practiceTypeId = String(selectedPracticeType);
                        const filteredInstitutions = institutions.filter(inst => {
                             // 1. Filtrar por tipo de práctica si hay uno seleccionado
                             if (practiceTypeId && practiceTypeId !== "Pendiente...") {
                               // Intentar encontrar el match en el array moderno
                               let hasMatch = false;
                               
                               if (inst.internshipTypeIds && Array.isArray(inst.internshipTypeIds) && inst.internshipTypeIds.length > 0) {
                                 hasMatch = inst.internshipTypeIds.some((t: string | number) => {
                                   const instTypeId = String(t);
                                   const practiceTypeObj = practiceOptions.find(p => String(p.id) === instTypeId || p.value === instTypeId);
                                   const practiceTypeName = practiceTypeObj ? practiceTypeObj.value : instTypeId;
                                   
                                   return instTypeId === practiceTypeId || 
                                          instTypeId === String(Number(practiceTypeId)) || 
                                          practiceTypeName === practiceTypeId;
                                 });
                               }
                               
                               // Fallback al campo legacy si no hubo match o no hay array
                               if (!hasMatch && inst.practiceType) {
                                 const practiceTypeObj = practiceOptions.find(p => p.value === practiceTypeId);
                                 const targetId = practiceTypeObj ? String(practiceTypeObj.id) : practiceTypeId;
                                 const instPracticeType = String(inst.practiceType);
                                 
                                 hasMatch = instPracticeType === targetId || 
                                            instPracticeType === practiceTypeId ||
                                            (practiceTypeObj ? instPracticeType === practiceTypeObj.value : false);
                               }
                               
                               if (!hasMatch) return false;
                             }
                             
                             // 2. Filtrar por carrera si hay una seleccionada
                             if (careerId && careerId !== "Pendiente...") {
                               // Extraer ID numérico para comparación robusta
                               const careerObj = careersState.find(c => 
                                 c.careerName === careerId || String(c.careerId) === careerId
                               );
                               const targetCareerId = careerObj ? String(careerObj.careerId) : careerId;

                               if (inst.careerIds && Array.isArray(inst.careerIds) && inst.careerIds.length > 0) {
                                 const matchesCareer = inst.careerIds.some((c: string | number) => {
                                   const instCareerId = String(c);
                                   return instCareerId === targetCareerId || instCareerId === careerId;
                                 });
                                 if (!matchesCareer) return false;
                               } else if ((inst as any).careerId) {
                                 // Fallback al campo legacy/singular
                                 const instCareerId = String((inst as any).careerId);
                                 if (instCareerId !== targetCareerId && instCareerId !== careerId) {
                                   return false;
                                 }
                               } else {
                                 // Si no tiene ninguna asociación de carrera, la excluimos
                                 return false;
                               }
                             }
                             
                             return true;
                           });
                          
                          // Consola para depuración si la lista está vacía pero hay datos seleccionados
                          if (selectedPracticeType && careerId && filteredInstitutions.length === 0 && institutions.length > 0) {
                            console.log("Depuración Instituciones:", {
                              practiceTypeId,
                              careerId,
                              institutionsTotal: institutions.length,
                              sample: institutions.slice(0, 2).map(i => ({
                                id: i.institutionId,
                                name: i.name,
                                typeIds: i.internshipTypeIds,
                                careerIds: i.careerIds
                              }))
                            });
                          }
                        
                        return (
                          <>
                            <CustomSelect
                              options={filteredInstitutions.map(i => ({
                                value: i.institutionId,
                                label: `${i.name}${i.region || i.nucleus ? ` (${[i.region, i.nucleus].filter(Boolean).join(' - ')})` : ''}`
                              }))}
                              placeholder={selectedPracticeType && careerId 
                                ? (filteredInstitutions.length === 0 
                                    ? "No hay instituciones para esta carrera y tipo de práctica" 
                                    : "Seleccione la institución")
                                : "Seleccione un estudiante primero"}
                              onChange={(val) => {
                                field.onChange(val);
                                setValue("institutionResponsibleId", "");
                              }}
                              value={String(field.value)}
                              className="rounded-xl h-[48px]"
                              disabled={!selectedPracticeType || !careerId}
                              onAddNew={selectedPracticeType && careerId ? () => {
                                const evt = new CustomEvent("enrollment:addInstitution");
                                window.dispatchEvent(evt);
                              } : undefined}
                              addNewLabel={selectedPracticeType && careerId && filteredInstitutions.length > 0 ? "Nueva Institución" : undefined}
                            />
                            {selectedPracticeType && selectedCareerName && filteredInstitutions.length === 0 && (
                              <p className="text-[11px] font-bold text-amber-600">
                                No hay instituciones para esta carrera y tipo de práctica. ¿Desea crear una?
                              </p>
                            )}
                          </>
                        );
                      }}
                    />
                    {errors.institutionId && (
                      <p className="text-[11px] font-bold text-error-500">{errors.institutionId.message}</p>
                    )}
                  </div>

                  {/* Responsable */}
                  <div className="space-y-3 pt-2">
                    <label className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Responsable Institucional *</label>
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
                                ? "No hay responsables" 
                                : "Seleccione el responsable"
                          }
                          onChange={field.onChange}
                          value={String(field.value || "")}
                          disabled={!selectedInstitutionId || filteredResponsibles.length === 0}
                          className="rounded-xl h-[48px]"
                        />
                      )}
                    />
                    {errors.institutionResponsibleId && (
                      <p className="text-[11px] font-bold text-error-500">{errors.institutionResponsibleId.message}</p>
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
                        className="text-brand-600 hover:text-brand-700 dark:text-brand-400 mt-1 self-start rounded-lg font-bold"
                      >
                        <SearchIcon className="w-4 h-4 mr-1" />
                        Nuevo Responsable
                      </Button>
                    )}
                  </div>
                </div>
              </div>
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
