import { useEffect, useState, useCallback } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Input from "../../../components/form/input/InputField";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../../components/ui/modal";
import { PreEnrollment } from "../types";
import Button from "../../../components/ui/button/Button";
import CustomSelect from "../../../components/form/CustomSelect";
import { Student } from "../../students/types";
import { getStudents } from "../../students/services/studentsService";
import { getPeriods } from "../../periods/services/periodService";
import { Periodo } from "../../periods/types";
import { Tooltip } from "../../../components/ui/tooltip/Tooltip";
import { getInternshipTypesByCareer, getInternshipTypes } from "../../internship-types/services/internshipTypesService";
import { useUnsavedChanges } from "../../../hooks/useUnsavedChanges";
import UnifiedDialog from "../../../components/ui/dialog/UnifiedDialog";
import { useLists } from "../../lists/hooks/useLists";

interface PreEnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<PreEnrollment, "preEnrollmentId" | "preEnrollmentDate">) => void;
  editingEntry?: PreEnrollment | null;
  isLoading?: boolean;
  initialCi?: string | null;
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
  careerName: z.string().optional(),
});

type PreEnrollmentFormData = z.infer<typeof preEnrollmentSchema>;

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
    getValues,
    formState: { errors, isSubmitted, isDirty },
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

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await getStudents();
        // Filtrar estudiantes que NO están en uso (sin registros en prácticas)
        const availableStudents = response.data.filter(s => !s.isInUse && s.status);
        setAllStudents(availableStudents);
      } catch (error) {
        console.error("Error fetching students:", error);
      }
    };
    if (isOpen && !editingEntry) {
      fetchStudents();
    }
  }, [isOpen, editingEntry]);

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

  // Cargar periodos y tipos de práctica
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [periodData] = await Promise.all([
          getPeriods(),
          getInternshipTypes()
        ]);
        
        // Filtrar solo periodos pendientes (status 1) y encontrar el más cercano
        const pendingPeriods = periodData
          .filter(p => p.periodStatus === 1 && p.status)
          .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
        
        const closestPeriod = pendingPeriods.length > 0 ? [pendingPeriods[0]] : [];
        
        // Si estamos editando, asegurar que el periodo de la entrada esté en la lista
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
        console.error("Error al cargar datos iniciales:", error);
      }
    };

    if (isOpen) {
      fetchData();
    }
  }, [isOpen, editingEntry, setValue, getValues]);

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

  const clearStudentFields = useCallback(() => {
    setValue("studentName", "");
    setValue("phone", "");
    setValue("careerName", "");
    setValue("practiceType", "");
    setValue("enrollmentCode", "");
    clearErrors("identificationNumber");
  }, [setValue, clearErrors]);

  const lookupStudent = useCallback(async (prefix: string, number: string) => {
    if (number.length < 5) {
      clearStudentFields();
      return;
    }
    
    setIsSearching(true);
    try {
      const response = await getStudents();
      const student = response.data.find(
        (s: Student) => s.identificationPrefix === prefix && s.identificationNumber === number
      );

      if (student) {
        setValue("studentName", `${student.firstName} ${student.lastName}`);
        setValue("phone", student.phone || "");
        setValue("careerName", student.careerName || "");
        clearErrors("identificationNumber");
        
        if (student.careerId) {
          const types = await getInternshipTypesByCareer(student.careerId);
          if (types.length > 0) {
            setValue("practiceType", types[0].NAME);
          } else {
            setValue("practiceType", "");
          }
        }

        const abbr = student.careerName?.substring(0, 3).toUpperCase() || "GEN";
        const enrollmentCode = `${student.identificationPrefix}-${student.identificationNumber}-${abbr}-${student.semester}`.toUpperCase();
        setValue("enrollmentCode", enrollmentCode);
      } else {
        clearStudentFields();
        setError("identificationNumber", {
          type: "manual",
          message: "El estudiante no se encuentra registrado.",
        });
      }
    } catch (error) {
      console.error("Error al buscar estudiante:", error);
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

  const onSubmit = (data: PreEnrollmentFormData) => {
    onSave({
      ...data,
      identificationPrefix: data.identificationPrefix as "V" | "E",
      careerName: data.careerName || "",
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
                      <CustomSelect
                        id="identificationPrefix"
                        options={NATIONALITY_OPTIONS}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        value={field.value}
                        placeholder="Tipo"
                        disabled={!!editingEntry}
                        error={!!errors.identificationPrefix}
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
                            setValue("identificationNumber", student.identificationNumber);
                            setValue("identificationPrefix", student.identificationPrefix);
                            setValue("studentName", `${student.firstName} ${student.lastName}`);
                            setValue("phone", student.phone || "");
                            setValue("careerName", student.careerName || "");
                            
                            if (student.careerId) {
                              const types = await getInternshipTypesByCareer(student.careerId);
                              if (types.length > 0) {
                                setValue("practiceType", types[0].NAME);
                              }
                            }
                            
                            // Matrícula automática
                            const abbr = student.careerName?.substring(0, 3).toUpperCase() || "GEN";
                            const enrollmentCode = `${student.identificationPrefix}-${student.identificationNumber}-${abbr}-${student.semester}`.toUpperCase();
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
