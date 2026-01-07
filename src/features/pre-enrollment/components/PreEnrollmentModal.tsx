import { useEffect, useState, useCallback } from "react";
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
import { InfoIcon } from "../../../icons";

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
      period: "",
      practiceType: "",
      enrollmentCode: "",
    },
  });

  const idNumber = useWatch({ control, name: "identificationNumber" });
  const idPrefix = useWatch({ control, name: "identificationPrefix" });

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
          period: editingEntry.period,
          practiceType: editingEntry.practiceType,
          enrollmentCode: editingEntry.enrollmentCode,
        });
      } else {
        reset({
          identificationPrefix: "V",
          identificationNumber: "",
          studentName: "",
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

  const AutoGeneratedBadge = ({ tooltip }: { tooltip: string }) => (
    <div className="relative group inline-block ml-2">
      <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-400/10 dark:text-blue-400 dark:ring-blue-400/30">
        Auto
      </span>
      <div className="absolute bottom-full left-1/2 mb-2 w-48 -translate-x-1/2 rounded bg-gray-900 px-2 py-1.5 text-[10px] text-white opacity-0 transition-opacity duration-200 pointer-events-none group-hover:opacity-100 z-50 shadow-xl border border-white/10">
        <div className="flex items-start gap-1.5">
          <InfoIcon className="w-3 h-3 shrink-0 mt-0.5 text-blue-400" />
          <p>{tooltip}</p>
        </div>
        <div className="absolute top-full left-1/2 -mt-1 -ml-1 border-4 border-transparent border-t-gray-900"></div>
      </div>
    </div>
  );

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
                <div className="flex-1">
                  <Input
                    {...register("identificationNumber")}
                    placeholder="Ingresa el número de identificación"
                    error={!!errors.identificationNumber}
                    className={isSearching ? "animate-pulse" : ""}
                  />
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
                placeholder="Nombre completo del estudiante"
                error={!!errors.studentName}
                hint={isSubmitted ? errors.studentName?.message : undefined}
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
                    options={[
                      { value: "2026 - I", label: "2026 - I" },
                      { value: "2026 - II", label: "2026 - II" },
                    ]}
                    placeholder="Selecciona el lapso académico"
                    onChange={field.onChange}
                    defaultValue={field.value}
                  />
                )}
              />
              {isSubmitted && errors.period && (
                <p className="mt-1 text-xs text-red-500">{errors.period.message}</p>
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
                placeholder="Código de matrícula académica"
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
