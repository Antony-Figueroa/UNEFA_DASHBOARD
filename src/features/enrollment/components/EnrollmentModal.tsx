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
import * as enrollmentService from "../services/enrollmentService";
import { useLists } from "../../lists/hooks/useLists";
import { generateMatricula } from "../../../utils/matricula";

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
  onSave: (data: CreateEnrollmentPayload | UpdateEnrollmentPayload) => void;
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
  const [practiceOptions, setPracticeOptions] = useState<InternshipTypeOption[]>([]);
  const [isLoadingPeriods, setIsLoadingPeriods] = useState(false);
  const [preEnrollmentError, setPreEnrollmentError] = useState<string | null>(null);
  const [options, setOptions] = useState<Record<string, { value: string; label: string }[]>>({});
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingData, setPendingData] = useState<EnrollmentFormData | null>(null);

  const { responsibles } = useInstitutionalResponsibles();
  const { fetchMultipleLists } = useLists();

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

  // Filtrar responsables por institución seleccionada
  const filteredResponsibles = responsibles.filter(r => r.institutionId === selectedInstitutionId);

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

  // Cargar datos iniciales
  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingPeriods(true);
      try {
        const [periodData, tutorData, institutionData, practiceData] = await Promise.all([
          getPeriods(),
          getTutors(),
          getInstitutions(),
          getInternshipTypes()
        ]);
        
        setPracticeOptions(mapToOptions(practiceData));
        
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
          setValue("careerName", studentCareer.careerName);
        } else {
          setValue("careerName", "No encontrada");
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
      setValue("studentName", initialData.studentName);
      setValue("period", initialData.period);
      setValue("practiceType", initialData.practiceType);
      setValue("careerName", initialData.careerName);
    }
  }, [initialData, isOpen, setValue]);

  useEffect(() => {
    if (isOpen) {
      if (editingEntry) {
        reset({
          identificationPrefix: editingEntry.identificationPrefix,
          identificationNumber: editingEntry.identificationNumber,
          studentName: editingEntry.studentName,
          period: editingEntry.period,
          practiceType: editingEntry.practiceType,
          careerName: editingEntry.careerName || "",
          academicTutorId: editingEntry.academicTutorId,
          methodologicalTutorId: editingEntry.methodologicalTutorId,
          institutionId: editingEntry.institutionId,
          institutionResponsibleId: editingEntry.institutionResponsibleId,
        });
      } else if (!initialData) {
        reset({
          identificationPrefix: "V",
          identificationNumber: "",
          studentName: "",
          period: "",
          practiceType: "",
          careerName: "",
          academicTutorId: "",
          methodologicalTutorId: "",
          institutionId: "",
          institutionResponsibleId: "",
        });
      }
    }
  }, [editingEntry, reset, isOpen, initialData]);

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
          <h5 className="mb-1 font-semibold text-text-primary modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
            {editingEntry ? "Editar Inscripción" : "Nueva Inscripción"}
          </h5>
          <p className="text-sm text-text-secondary dark:text-text-tertiary font-normal">
            {editingEntry ? "Modifica los detalles de la inscripción." : "Ingresa los detalles para la nueva inscripción."}
          </p>
        </div>
      </ModalHeader>

      <ModalBody className="bg-bg-secondary/30 dark:bg-bg-dark/50">
        <form id="enrollment-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6 sm:space-y-8 max-w-4xl mx-auto">
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
                    {...register("identificationNumber")}
                    placeholder="Número de identificación"
                    error={!!errors.identificationNumber || !!preEnrollmentError}
                    hint={errors.identificationNumber?.message || preEnrollmentError || undefined}
                    className={isSearching ? "animate-pulse" : ""}
                    disabled={!!editingEntry || !!initialData}
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
              <Controller
                name="practiceType"
                control={control}
                render={({ field }) => (
                  <CustomSelect
                    options={practiceOptions}
                    placeholder="Seleccione el tipo"
                    onChange={field.onChange}
                    value={field.value}
                    disabled={!editingEntry}
                  />
                )}
              />
              {errors.practiceType && (
                <p className="mt-1 text-xs text-error-500">{errors.practiceType?.message}</p>
              )}
            </div>

            {/* Carrera */}
            <div>
              <div className="flex items-center mb-2 sm:mb-2.5">
                <label className="block text-black dark:text-white font-medium text-sm">Carrera *</label>
                {!editingEntry && <AutoGeneratedBadge tooltip="Se carga automáticamente al verificar al estudiante." />}
              </div>
              <Input
                {...register("careerName")}
                placeholder="Carrera automática"
                error={!!errors.careerName}
                hint={isSubmitted ? errors.careerName?.message : undefined}
                readOnly
                className="bg-bg-secondary dark:bg-white/5 cursor-not-allowed"
              />
              {initialData && (
                <p className="mt-1 text-[11px] text-amber-600 dark:text-amber-400">
                  La carrera se carga automáticamente desde la pre-inscripción.
                </p>
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
                    placeholder={selectedInstitutionId ? "Seleccione el responsable" : "Seleccione primero la institución"}
                    onChange={field.onChange}
                    value={String(field.value)}
                    disabled={!selectedInstitutionId}
                  />
                )}
              />
              {errors.institutionResponsibleId && (
                <p className="mt-1 text-xs text-error-500">{errors.institutionResponsibleId?.message}</p>
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
    />
  </>
);
}
