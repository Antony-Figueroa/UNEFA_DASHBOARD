import { useEffect, useState, useCallback, useRef } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Input from "../../../components/form/input/InputField";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../../components/ui/modal";
import { Enrollment } from "../types";
import Button from "../../../components/ui/button/Button";
import Select from "../../../components/form/Select";
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
import { InfoIcon } from "../../../icons";
import { createPortal } from "react-dom";
import { getInternshipTypesByCareer, getInternshipTypes, mapToOptions } from "../../internship-types/services/internshipTypesService";
import { InternshipTypeOption } from "../../internship-types/types";

interface EnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Enrollment, "enrollmentId" | "enrollmentDate">) => void;
  editingEntry?: Enrollment | null;
  isLoading?: boolean;
}

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
  academicTutorId: z.string().min(1, "Seleccione el tutor académico"),
  methodologicalTutorId: z.string().min(1, "Seleccione el tutor metodológico"),
  institutionId: z.string().min(1, "Seleccione la institución"),
  institutionResponsibleId: z.string().min(1, "Seleccione el responsable institucional"),
}).refine((data) => data.academicTutorId !== data.methodologicalTutorId, {
  message: "Los tutores no pueden coincidir",
  path: ["methodologicalTutorId"],
});

type EnrollmentFormData = z.infer<typeof enrollmentSchema>;

export default function EnrollmentModal({
  isOpen,
  onClose,
  onSave,
  editingEntry,
  isLoading = false,
}: EnrollmentModalProps) {
  const [isSearching, setIsSearching] = useState(false);
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [practiceOptions, setPracticeOptions] = useState<InternshipTypeOption[]>([]);
  const [isLoadingPeriods, setIsLoadingPeriods] = useState(false);
  const [preEnrollmentError, setPreEnrollmentError] = useState<string | null>(null);

  const { responsibles } = useInstitutionalResponsibles();

  const { 
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors, isSubmitted },
  } = useForm<EnrollmentFormData>({
    resolver: zodResolver(enrollmentSchema),
    defaultValues: {
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
    },
  });

  const idNumber = useWatch({ control, name: "identificationNumber" });
  const idPrefix = useWatch({ control, name: "identificationPrefix" });
  const selectedInstitutionId = useWatch({ control, name: "institutionId" });

  // Filtrar responsables por institución seleccionada
  const filteredResponsibles = responsibles.filter(r => r.institutionId === selectedInstitutionId);

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
      const [students, preEnrollments, careerData] = await Promise.all([
        getStudents(),
        getPreEnrollments(),
        getCareers(),
      ]);

      const student = students.find(
        s => s.identificationPrefix === prefix && s.identificationNumber === number
      );

      const preEnrollment = preEnrollments.find(
        p => p.identificationPrefix === prefix && p.identificationNumber === number && p.status
      );

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
          setValue("careerName", studentCareer.careerName);
        } else {
          setValue("careerName", "No encontrada");
        }
        
        // Autocompletar Tipo de Práctica desde la BD
        try {
          const internshipTypes = await getInternshipTypesByCareer(student.careerId);
          if (internshipTypes && internshipTypes.length > 0) {
            // Seleccionamos el primero o el que tenga mayor prioridad
            const mainType = internshipTypes.sort((a, b) => a.PRIORITY - b.PRIORITY)[0];
            setValue("practiceType", mainType.NAME);
          } else {
            setValue("practiceType", "ORDINARIA"); // Fallback
          }
        } catch (error) {
          console.error("Error al obtener tipos de pasantía para el estudiante:", error);
          setValue("practiceType", "ORDINARIA");
        }
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
      } else {
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
  }, [editingEntry, reset, isOpen]);

  const onSubmit = (data: EnrollmentFormData) => {
    if (preEnrollmentError) return;

    const academicTutor = tutors.find(t => t.tutorId === data.academicTutorId);
    const methodologicalTutor = tutors.find(t => t.tutorId === data.methodologicalTutorId);
    const institution = institutions.find(i => i.institutionId === data.institutionId);
    const responsible = responsibles.find(r => r.responsibleId === data.institutionResponsibleId);

    onSave({
      ...data,
      identificationPrefix: data.identificationPrefix as "V" | "E" | "J" | "P",
      academicTutorName: academicTutor ? `${academicTutor.firstName} ${academicTutor.lastName}` : undefined,
      methodologicalTutorName: methodologicalTutor ? `${methodologicalTutor.firstName} ${methodologicalTutor.lastName}` : undefined,
      institutionName: institution?.name,
      institutionResponsibleName: responsible ? `${responsible.firstName} ${responsible.lastName}` : undefined,
      status: editingEntry ? editingEntry.status : true,
    });
  };

  const AutoGeneratedBadge = ({ tooltip }: { tooltip: string }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const triggerRef = useRef<HTMLDivElement>(null);

    const handleMouseEnter = () => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setCoords({
          top: rect.top - 10,
          left: rect.left + rect.width / 2,
        });
        setShowTooltip(true);
      }
    };

    return (
      <div 
        ref={triggerRef}
        className="relative inline-block ml-2"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-400/10 dark:text-blue-400 dark:ring-blue-400/30 uppercase tracking-wider">
          Auto
        </span>
        {showTooltip && createPortal(
          <div 
            style={{ 
              position: 'fixed',
              top: `${coords.top}px`,
              left: `${coords.left}px`,
            transform: 'translate(-50%, -100%)',
            zIndex: 9999,
          }}
          className="w-56 rounded-lg bg-bg-dark px-3 py-2 text-xs text-white shadow-2xl animate-fadeIn pointer-events-none border border-white/10"
        >
          <div className="flex items-start gap-2">
            <InfoIcon className="w-4 h-4 shrink-0 mt-0.5 text-blue-400" />
            <p className="leading-relaxed">{tooltip}</p>
          </div>
          <div className="absolute top-full left-1/2 -mt-1 -ml-1.5 border-6 border-transparent border-t-bg-dark"></div>
        </div>,
        document.body
      )}
      </div>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} showCloseButton>
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
            <div>
              <label className="mb-2 block sm:mb-2.5 text-black dark:text-white font-medium text-sm">Cédula *</label>
              <div className="flex gap-2">
                <div className="w-24">
                  <Controller
                    name="identificationPrefix"
                    control={control}
                    render={({ field }) => (
                      <Select
                        options={[
                          { value: "V", label: "V-" },
                          { value: "E", label: "E-" },
                          { value: "J", label: "J-" },
                          { value: "P", label: "P-" },
                        ]}
                        onChange={field.onChange}
                        defaultValue={field.value}
                        placeholder="Tipo ID"
                      />
                    )}
                  />
                </div>
                <div className="flex-1 relative">
                  <Input
                    {...register("identificationNumber")}
                    placeholder="Escriba el número"
                    error={!!errors.identificationNumber || !!preEnrollmentError}
                    className={isSearching ? "animate-pulse" : ""}
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"></div>
                    </div>
                  )}
                </div>
              </div>
              {isSubmitted && errors.identificationNumber && (
                <p className="mt-1 text-xs text-error-500">{errors.identificationNumber.message}</p>
              )}
              {preEnrollmentError && (
                <p className="mt-1 text-xs text-error-500">{preEnrollmentError}</p>
              )}
            </div>

            {/* Estudiante */}
            <div>
              <div className="flex items-center mb-2 sm:mb-2.5">
                <label className="block text-black dark:text-white font-medium text-sm">Estudiante *</label>
                {!editingEntry && <AutoGeneratedBadge tooltip="Se completa automáticamente al verificar la pre-inscripción." />}
              </div>
              <Input
                {...register("studentName")}
                placeholder="Nombre automático"
                error={!!errors.studentName}
                hint={isSubmitted ? errors.studentName?.message : undefined}
                readOnly
                className="bg-bg-secondary dark:bg-white/5 cursor-not-allowed"
              />
            </div>

            {/* Período */}
            <div>
              <div className="flex items-center mb-2 sm:mb-2.5">
                <label className="block text-black dark:text-white font-medium text-sm">Período *</label>
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
            <div>
              <div className="flex items-center mb-2 sm:mb-2.5">
                <label className="block text-black dark:text-white font-medium text-sm">Tipo Práctica *</label>
                {!editingEntry && <AutoGeneratedBadge tooltip="Determinado automáticamente según la carrera del estudiante." />}
              </div>
              <Controller
                name="practiceType"
                control={control}
                render={({ field }) => (
                  <Select
                    options={practiceOptions}
                    placeholder="Selecciona el tipo"
                    onChange={field.onChange}
                    defaultValue={field.value}
                    disabled={!editingEntry}
                  />
                )}
              />
              {isSubmitted && errors.practiceType && (
                <p className="mt-1 text-xs text-red-500">{errors.practiceType.message}</p>
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
            </div>

            {/* Tutor Académico */}
            <div>
              <label className="mb-2 sm:mb-2.5 block text-black dark:text-white font-medium text-sm">Tutor Académico *</label>
              <Controller
                name="academicTutorId"
                control={control}
                render={({ field }) => (
                  <Select
                    options={tutors.map(t => ({
                      value: t.tutorId,
                      label: `${t.firstName} ${t.lastName}`
                    }))}
                    placeholder="Seleccione el tutor"
                    onChange={field.onChange}
                    defaultValue={field.value}
                  />
                )}
              />
              {isSubmitted && errors.academicTutorId && (
                <p className="mt-1 text-xs text-error-500">{errors.academicTutorId.message}</p>
              )}
            </div>

            {/* Tutor Metodológico */}
            <div>
              <label className="mb-2 sm:mb-2.5 block text-black dark:text-white font-medium text-sm">Tutor Metodológico *</label>
              <Controller
                name="methodologicalTutorId"
                control={control}
                render={({ field }) => (
                  <Select
                    options={tutors.map(t => ({
                      value: t.tutorId,
                      label: `${t.firstName} ${t.lastName}`
                    }))}
                    placeholder="Seleccione el tutor"
                    onChange={field.onChange}
                    defaultValue={field.value}
                  />
                )}
              />
              {isSubmitted && errors.methodologicalTutorId && (
                <p className="mt-1 text-xs text-error-500">{errors.methodologicalTutorId.message}</p>
              )}
            </div>

            {/* Institución */}
            <div>
              <label className="mb-2 sm:mb-2.5 block text-black dark:text-white font-medium text-sm">Institución *</label>
              <Controller
                name="institutionId"
                control={control}
                render={({ field }) => (
                  <Select
                    options={institutions.map(i => ({
                      value: i.institutionId,
                      label: i.name
                    }))}
                    placeholder="Seleccione la institución"
                    onChange={(val) => {
                      field.onChange(val);
                      setValue("institutionResponsibleId", ""); // Reset responsible when institution changes
                    }}
                    defaultValue={field.value}
                  />
                )}
              />
              {isSubmitted && errors.institutionId && (
                <p className="mt-1 text-xs text-error-500">{errors.institutionId.message}</p>
              )}
            </div>

            {/* Responsable Institucional */}
            <div>
              <label className="mb-2 sm:mb-2.5 block text-black dark:text-white font-medium text-sm">Responsable Institucional *</label>
              <Controller
                name="institutionResponsibleId"
                control={control}
                render={({ field }) => (
                  <Select
                    options={filteredResponsibles.map(r => ({
                      value: r.responsibleId,
                      label: `${r.firstName} ${r.lastName}`
                    }))}
                    placeholder={selectedInstitutionId ? "Seleccione el responsable" : "Seleccione primero una institución"}
                    onChange={field.onChange}
                    defaultValue={field.value}
                    disabled={!selectedInstitutionId}
                  />
                )}
              />
              {isSubmitted && errors.institutionResponsibleId && (
                <p className="mt-1 text-xs text-error-500">{errors.institutionResponsibleId.message}</p>
              )}
            </div>
          </div>
        </form>
      </ModalBody>

      <ModalFooter className="shrink-0 px-6 sm:px-12 py-6 bg-white dark:bg-bg-dark border-t border-border-light dark:border-border-dark">
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 w-full max-w-6xl mx-auto">
          <Button variant="outline" onClick={onClose} disabled={isLoading} className="w-full sm:w-auto min-h-12">
            Cancelar
          </Button>
          <Button type="submit" form="enrollment-form" loading={isLoading} className="w-full sm:w-auto min-h-12" disabled={!!preEnrollmentError}>
            {editingEntry ? "Actualizar Inscripción" : "Guardar Inscripción"}
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
}
