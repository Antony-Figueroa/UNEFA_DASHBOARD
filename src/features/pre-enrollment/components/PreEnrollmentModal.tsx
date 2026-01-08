import { useEffect, useState, useCallback, useRef } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Input from "../../../components/form/input/InputField";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../../components/ui/modal";
import { PreEnrollment } from "../types";
import Button from "../../../components/ui/button/Button";
import Select from "../../../components/form/Select";
import { getStudents } from "../../students/services/studentsService";
import { getCareers } from "../../careers/services/careersService";
import { getPeriods } from "../../periods/services/periodService";
import { Periodo } from "../../periods/types";
import { InfoIcon } from "../../../icons";
import { createPortal } from "react-dom";

interface PreEnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<PreEnrollment, "preEnrollmentId" | "preEnrollmentDate">) => void;
  editingEntry?: PreEnrollment | null;
  isLoading?: boolean;
}

// Tabla de referencia carrera-tipo de pasantía
const CAREER_PRACTICE_MAPPING: Record<string, string> = {
  "Ingeniería de Sistemas": "ORDINARIA",
  "Ingeniería Industrial": "ORDINARIA",
  "Derecho": "ESPECIAL",
  "Medicina": "HOSPITALARIA",
  "Arquitectura": "COMUNITARIA",
};

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
  const [isLoadingPeriods, setIsLoadingPeriods] = useState(false);

  const { 
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors, isSubmitted },
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

  const idNumber = useWatch({ control, name: "identificationNumber" });
  const idPrefix = useWatch({ control, name: "identificationPrefix" });

  // Cargar periodos
  useEffect(() => {
    const fetchPeriods = async () => {
      setIsLoadingPeriods(true);
      try {
        const data = await getPeriods();
        // Filtrar periodos según requerimientos:
        // 1. Mostrar periodo en curso (status 2)
        // 2. Si no hay en curso, mostrar el primer pendiente (status 1)
        // 3. No mostrar culminados (status 3) para nuevas preinscripciones
        
        const currentPeriod = data.find(p => p.periodStatus === 2);
        const pendingPeriods = data.filter(p => p.periodStatus === 1).sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
        
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
            const originalPeriod = data.find(p => p.description === editingEntry.period);
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
      fetchPeriods();
    }
  }, [isOpen, editingEntry, setValue]);

  const lookupStudent = useCallback(async (prefix: string, number: string) => {
    if (number.length < 5) return;
    
    setIsSearching(true);
    try {
      const students = await getStudents();
      const student = students.find(
        s => s.identificationPrefix === prefix && s.identificationNumber === number
      );

      if (student) {
        setValue("studentName", `${student.firstName} ${student.lastName}`);
        setValue("phone", student.phone || "");
        
        // Autocompletar Tipo de Práctica
        const practiceType = CAREER_PRACTICE_MAPPING[student.careerName || ""] || "ORDINARIA";
        setValue("practiceType", practiceType);

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

  const AutoGeneratedBadge = ({ tooltip }: { tooltip: string }) => {
    const [showTooltip, setShowTooltip] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const triggerRef = useRef<HTMLDivElement>(null);

    const handleMouseEnter = () => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setCoords({
          top: rect.top - 10, // Un poco por encima
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
            className="w-56 rounded-lg bg-gray-900 px-3 py-2 text-xs text-white shadow-2xl animate-fadeIn pointer-events-none border border-white/10"
          >
            <div className="flex items-start gap-2">
              <InfoIcon className="w-4 h-4 shrink-0 mt-0.5 text-blue-400" />
              <p className="leading-relaxed">{tooltip}</p>
            </div>
            {/* Triangulito */}
            <div className="absolute top-full left-1/2 -mt-1 -ml-1.5 border-6 border-transparent border-t-gray-900"></div>
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
          <h5 className="mb-1 font-semibold text-gray-800 modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
            {editingEntry ? "Editar Preinscripción" : "Nueva Preinscripción"}
          </h5>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-normal">
            {editingEntry ? "Modifica los detalles de la pre-inscripción." : "Ingresa los detalles para la nueva pre-inscripción."}
          </p>
        </div>
      </ModalHeader>

      <ModalBody className="bg-gray-50/30 dark:bg-gray-900/50">
        <form id="pre-enrollment-form" onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-4xl mx-auto">
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
                    placeholder="Escriba el número de documento sin puntos ni letras"
                    error={!!errors.identificationNumber}
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
                <p className="mt-1 text-xs text-red-500">{errors.identificationNumber.message}</p>
              )}
            </div>

            {/* Estudiante */}
            <div>
              <div className="flex items-center mb-2.5">
                <label className="block text-black dark:text-white font-medium text-sm">Estudiante *</label>
                {!editingEntry && <AutoGeneratedBadge tooltip="Se completa automáticamente al ingresar la cédula del estudiante registrado." />}
              </div>
              <Input
                {...register("studentName")}
                placeholder="El nombre aparecerá automáticamente al validar la cédula"
                error={!!errors.studentName}
                hint={isSubmitted ? errors.studentName?.message : undefined}
                readOnly={!editingEntry}
                className={!editingEntry ? "bg-gray-50 dark:bg-white/5 cursor-not-allowed" : ""}
              />
            </div>

            {/* Teléfono */}
            <div>
              <div className="flex items-center mb-2.5">
                <label className="block text-black dark:text-white font-medium text-sm">Teléfono *</label>
                {!editingEntry && <AutoGeneratedBadge tooltip="Se completa automáticamente al ingresar la cédula del estudiante registrado." />}
              </div>
              <Input
                {...register("phone")}
                placeholder="El teléfono aparecerá automáticamente"
                error={!!errors.phone}
                hint={isSubmitted ? errors.phone?.message : undefined}
                readOnly={!editingEntry}
                className={!editingEntry ? "bg-gray-50 dark:bg-white/5 cursor-not-allowed" : ""}
              />
            </div>

            {/* Período */}
            <div>
              <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Período *</label>
              <Controller
                name="period"
                control={control}
                render={({ field }) => (
                  <Select
                    options={periods.map(p => ({
                      value: p.description,
                      label: p.description
                    }))}
                    placeholder={isLoadingPeriods ? "Cargando periodos..." : "Seleccione el período"}
                    onChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isLoadingPeriods || periods.length === 0}
                  />
                )}
              />
              {periods.length > 0 && (
                <p className="mt-1.5 text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1">
                  <InfoIcon className="w-3 h-3 text-blue-500" />
                  Solo se muestran periodos vigentes o próximos.
                </p>
              )}
              {isSubmitted && errors.period && (
                <p className="mt-1 text-xs text-red-500">{errors.period.message}</p>
              )}
              {periods.length === 0 && !isLoadingPeriods && (
                <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                  No hay periodos disponibles para pre-inscripción.
                </p>
              )}
            </div>

            {/* Tipo Práctica */}
            <div>
              <div className="flex items-center mb-2.5">
                <label className="block text-black dark:text-white font-medium text-sm">Tipo Práctica *</label>
                {!editingEntry && <AutoGeneratedBadge tooltip="Determinado automáticamente según la carrera del estudiante." />}
              </div>
              <Controller
                name="practiceType"
                control={control}
                render={({ field }) => (
                  <Select
                    options={[
                      { value: "ORDINARIA", label: "ORDINARIA" },
                      { value: "ESPECIAL", label: "ESPECIAL" },
                      { value: "HOSPITALARIA", label: "HOSPITALARIA" },
                      { value: "COMUNITARIA", label: "COMUNITARIA" },
                    ]}
                    placeholder="Selecciona el tipo de práctica"
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

            {/* Matrícula */}
            <div>
              <div className="flex items-center mb-2.5">
                <label className="block text-black dark:text-white font-medium text-sm">Matrícula *</label>
                {!editingEntry && <AutoGeneratedBadge tooltip="Generada automáticamente: ABREVIACIÓN-SEMESTRE-SECCIÓN-JORNADA." />}
              </div>
              <Input
                {...register("enrollmentCode")}
                placeholder="Se generará siguiendo el patrón CARRERA-SEM-SEC-JOR"
                error={!!errors.enrollmentCode}
                hint={isSubmitted ? errors.enrollmentCode?.message : undefined}
                readOnly={!editingEntry}
                className={!editingEntry ? "bg-gray-50 dark:bg-white/5 cursor-not-allowed" : ""}
              />
            </div>
          </div>
        </form>
      </ModalBody>

      <ModalFooter className="shrink-0 px-6 sm:px-12 py-6 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 w-full max-w-6xl mx-auto">
          <Button variant="outline" onClick={onClose} disabled={isLoading} className="w-full sm:w-auto min-h-12">
            Cancelar
          </Button>
          <Button type="submit" form="pre-enrollment-form" loading={isLoading} className="w-full sm:w-auto min-h-12">
            {editingEntry ? "Actualizar Registro" : "Guardar Registro"}
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
}
