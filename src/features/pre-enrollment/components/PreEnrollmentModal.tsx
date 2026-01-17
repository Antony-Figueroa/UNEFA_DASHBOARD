import { useEffect, useState, useCallback } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Input from "../../../components/form/input/InputField";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../../components/ui/modal";
import { PreEnrollment } from "../types";
import Button from "../../../components/ui/button/Button";
import Select from "../../../components/form/Select";
import { Student } from "../../students/types";
import { getStudents } from "../../students/services/studentsService";
import { getCareers } from "../../careers/services/careersService";
import { getPeriods } from "../../periods/services/periodService";
import { Periodo } from "../../periods/types";
import { Tooltip } from "../../../components/ui/tooltip/Tooltip";
import { getInternshipTypesByCareer, getInternshipTypes, mapToOptions } from "../../internship-types/services/internshipTypesService";
import { getPreEnrollments } from "../services/preEnrollmentService";
import { InternshipTypeOption } from "../../internship-types/types";
import { useUnsavedChanges } from "../../../hooks/useUnsavedChanges";
import UnifiedDialog from "../../../components/ui/dialog/UnifiedDialog";
import { InfoIcon } from "../../../icons";

interface PreEnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<PreEnrollment, "preEnrollmentId" | "preEnrollmentDate">) => void;
  editingEntry?: PreEnrollment | null;
  isLoading?: boolean;
}

const preEnrollmentSchema = z.object({
  identificationPrefix: z.string().min(1, "Seleccione un prefijo"),
  identificationNumber: z.string()
    .min(1, "La identificación es obligatoria")
    .regex(/^\d+$/, "Solo se admiten números"),
  studentName: z.string()
    .min(1, "El nombre del estudiante es obligatorio"),
  phone: z.string()
    .min(1, "El teléfono es obligatorio"),
  period: z.string().min(1, "Seleccione el período"),
  practiceType: z.string().min(1, "Seleccione el tipo de práctica"),
  enrollmentCode: z.string().min(1, "La matrícula es obligatoria"),
});

type PreEnrollmentFormData = z.infer<typeof preEnrollmentSchema>;

export default function PreEnrollmentModal({
  isOpen,
  onClose,
  onSave,
  editingEntry,
  isLoading = false,
}: PreEnrollmentModalProps) {
  const [isSearching, setIsSearching] = useState(false);
  const [periods, setPeriods] = useState<Periodo[]>([]);
  const [practiceOptions, setPracticeOptions] = useState<InternshipTypeOption[]>([]);
  const [isLoadingPeriods, setIsLoadingPeriods] = useState(false);

  const { 
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    getValues,
    formState: { errors, isSubmitted, isDirty },
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

  // Cargar periodos y tipos de práctica
  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingPeriods(true);
      try {
        const [periodData, practiceData] = await Promise.all([
          getPeriods(),
          getInternshipTypes()
        ]);
        
        setPracticeOptions(mapToOptions(practiceData));
        
        // Filtrar periodos según requerimientos:
        // 1. Mostrar periodo en curso (status 2)
        // 2. Si no hay en curso, mostrar el primer pendiente (status 1)
        // 3. No mostrar culminados (status 3) para nuevas preinscripciones
        
        const currentPeriod = periodData.find(p => p.periodStatus === 2);
        const pendingPeriods = periodData.filter(p => p.periodStatus === 1).sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
        
        let filteredPeriods: Periodo[] = [];
        if (currentPeriod) {
          filteredPeriods = [currentPeriod];
        } else if (pendingPeriods.length > 0) {
          filteredPeriods = [pendingPeriods[0]];
        }

        // Si estamos editando, asegurar que el periodo de la entrada esté en la lista
        if (editingEntry) {
          const exists = filteredPeriods.some(p => p.description === editingEntry.period);
          if (!exists) {
            const originalPeriod = periodData.find(p => p.description === editingEntry.period);
            if (originalPeriod) {
              filteredPeriods.push(originalPeriod);
            }
          }
        }
        
        setPeriods(filteredPeriods);

        // Si es una nueva preinscripción y hay un periodo sugerido, seleccionarlo
        if (!editingEntry && filteredPeriods.length > 0) {
          setValue("period", filteredPeriods[0].description);
        }
      } catch (error) {
        console.error("Error al cargar periodos:", error);
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
    try {
      const students = await getStudents();
      const student = students.data.find(
        (s: Student) => s.identificationPrefix === prefix && s.identificationNumber === number
      );

      if (student) {
        setValue("studentName", `${student.firstName} ${student.lastName}`);
        setValue("phone", student.phone || "");
        
        // Autocompletar Tipo de Práctica desde la BD
        try {
          const currentPeriod = getValues('period');
          const allPreEnrollments = await getPreEnrollments();
          
          // Filtrar pre-inscripciones del estudiante en el período actual
          const studentPreEnrollments = allPreEnrollments.filter(p => 
            p.identificationNumber === number && 
            p.identificationPrefix === prefix
          );
          const periodPreEnrollments = studentPreEnrollments.filter(p => p.period === currentPeriod);
          const approvedPreEnrollments = periodPreEnrollments.filter(p => p.status);
          const usedTypes = approvedPreEnrollments.map(p => p.practiceType);

          const internshipTypes = await getInternshipTypesByCareer(student.careerId);
          if (internshipTypes && internshipTypes.length > 0) {
            const mappedOptions = mapToOptions(internshipTypes);
            setPracticeOptions(mappedOptions);
            
            // Ordenar tipos por prioridad (menor PRIORITY primero)
            const sortedTypes = internshipTypes.sort((a, b) => a.PRIORITY - b.PRIORITY);
            
            // Encontrar el siguiente tipo disponible que no haya sido usado
            const nextType = sortedTypes.find(type => !usedTypes.includes(type.NAME));
            
            if (nextType) {
              setValue("practiceType", nextType.NAME);
            } else {
              // Si todos los tipos han sido usados, usar el de mayor prioridad
              setValue("practiceType", sortedTypes[0].NAME);
            }
          } else {
<<<<<<< Updated upstream
            // Fallback a tipos globales
            const globalTypes = await getInternshipTypes();
            setPracticeOptions(mapToOptions(globalTypes));
            setValue("practiceType", "ORDINARIA");
          }
        } catch (error) {
          console.error("Error al obtener tipos de pasantía para el estudiante:", error);
          // Fallback
          try {
            const globalTypes = await getInternshipTypes();
            setPracticeOptions(mapToOptions(globalTypes));
          } catch (fallbackError) {
            console.error("Error al cargar tipos globales:", fallbackError);
          }
          setValue("practiceType", "ORDINARIA");
=======
            setValue("practiceType", "ÚNICA"); // Fallback
          }
        } catch (error) {
          console.error("Error al obtener tipos de pasantía para el estudiante:", error);
          setValue("practiceType", "ÚNICA");
>>>>>>> Stashed changes
        }

        // Generar Matrícula Automática
        // Formato: ${abreviación_carrera} - ${semestre_estudiante} - ${sección_estudiante} - ${jornada}
        const careers = await getCareers();
        const career = careers.find(c => c.careerId === student.careerId);
        const abbr = career?.careerAbbreviation || student.careerName?.substring(0, 3).toUpperCase() || "GEN";
        
        const enrollmentCode = `${abbr}-${student.semester}-${student.section}-${student.regime}`.toUpperCase();
        setValue("enrollmentCode", enrollmentCode);
      }
    } catch (error) {
      console.error("Error buscando estudiante:", error);
    } finally {
      setIsSearching(false);
    }
  }, [setValue, getValues]);

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
          phone: editingEntry.phone,
          period: editingEntry.period,
          practiceType: editingEntry.practiceType,
          enrollmentCode: editingEntry.enrollmentCode,
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
        });
      }
    }
  }, [editingEntry, reset, isOpen]);

  const onSubmit = (data: PreEnrollmentFormData) => {
    onSave({
      ...data,
      identificationPrefix: data.identificationPrefix as "V" | "E" | "J" | "P",
      status: editingEntry ? editingEntry.status : true,
    });
  };

  // Badge para campos autogenerados con tooltip descriptivo
  const AutoGeneratedBadge = ({ tooltip }: { tooltip: string }) => (
  <Tooltip content={tooltip}>
    <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-400/10 dark:text-blue-400 dark:ring-blue-400/30 uppercase tracking-wider ml-2 cursor-help">
      Auto
    </span>
  </Tooltip>
);

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} onCloseAttempt={handleCloseAttempt} showCloseButton>
        <ModalHeader>
        <div className="max-w-4xl mx-auto w-full">
          <h5 className="mb-1 font-semibold text-text-primary modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
            {editingEntry ? "Editar Preinscripción" : "Nueva Preinscripción"}
          </h5>
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
                        disabled={!!editingEntry}
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
                readOnly={!!editingEntry}
                className={editingEntry ? "bg-bg-secondary dark:bg-white/5 cursor-not-allowed" : ""}
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
                readOnly={!!editingEntry}
                className={editingEntry ? "bg-bg-secondary dark:bg-white/5 cursor-not-allowed" : ""}
              />
            </div>

            {/* Período */}
            <div>
              <label className="mb-2 sm:mb-2.5 block text-black dark:text-white font-medium text-sm">Período *</label>
              <Controller
                name="period"
                control={control}
                render={({ field }) => (
                  <Select
                    options={periods.map(p => ({
                      value: p.description,
                      label: p.description
                    }))}
                    placeholder={isLoadingPeriods ? "Cargando períodos..." : "Seleccione el período"}
                    onChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoadingPeriods || periods.length === 0}
                  />
                )}
              />
              {periods.length > 0 && (
                <p className="mt-1.5 text-[11px] text-text-tertiary dark:text-text-tertiary flex items-center gap-1">
                  <InfoIcon className="w-3 h-3 text-blue-light-500" />
                  Vigentes o próximos.
                </p>
              )}
              {isSubmitted && errors.period && (
                <p className="mt-1 text-xs text-error-500">{errors.period.message}</p>
              )}
              {periods.length === 0 && !isLoadingPeriods && (
                <p className="mt-1 text-xs text-warning-600 dark:text-warning-400">
                  No hay períodos disponibles.
                </p>
              )}
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
                    disabled={!!editingEntry}
                  />
                )}
              />
              {isSubmitted && errors.practiceType && (
                <p className="mt-1 text-xs text-red-500">{errors.practiceType.message}</p>
              )}
            </div>

            {/* Matrícula */}
            <div>
              <div className="flex items-center mb-2 sm:mb-2.5">
                <label className="block text-black dark:text-white font-medium text-sm">Matrícula *</label>
                {!editingEntry && <AutoGeneratedBadge tooltip="Generada automáticamente: ABREVIACIÓN-SEMESTRE-SECCIÓN-JORNADA." />}
              </div>
              <Input
                {...register("enrollmentCode")}
                placeholder="Generación automática"
                error={!!errors.enrollmentCode}
                hint={isSubmitted ? errors.enrollmentCode?.message : undefined}
                readOnly={!!editingEntry}
                className={editingEntry ? "bg-bg-secondary dark:bg-white/5 cursor-not-allowed" : ""}
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
          <Button type="submit" form="pre-enrollment-form" loading={isLoading} className="w-full sm:w-auto min-h-12">
            {editingEntry ? "Actualizar Registro" : "Guardar Registro"}
          </Button>
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
  </>
);
}
