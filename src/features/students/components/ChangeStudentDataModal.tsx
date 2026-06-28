import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../../components/ui/modal";

import CustomSelect from "../../../components/form/CustomSelect";
import { StudentRowData } from "../types";
import { changeStudentRegistration } from "../services/studentsService";
import { useToast } from "../../../context/toast";
import { useTutors } from "../../tutors/hooks/useTutors";
import { useInstitutions } from "../../institutions/hooks/useInstitutions";
import { useStudents } from "../hooks/useStudents";

const changeSchema = z.object({
  changeType: z.enum(["institution", "tutor"]),
  newValue: z.string().min(1, "El nuevo valor es requerido"),
  reason: z.string().optional()
});

type ChangeFormData = z.infer<typeof changeSchema>;

interface ChangeStudentDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentRowData | null;
  onSuccess?: () => void;
}

export default function ChangeStudentDataModal({
  isOpen,
  onClose,
  student,
  onSuccess
}: ChangeStudentDataModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useToast();
  const { refreshStudents } = useStudents();
  const { tutors } = useTutors();
  const { institutions } = useInstitutions();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors }
  } = useForm<ChangeFormData>({
    resolver: zodResolver(changeSchema),
    defaultValues: {
      changeType: undefined,
      newValue: "",
      reason: ""
    }
  });

  const selectedChangeType = watch("changeType");

  useEffect(() => {
    if (!isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  const institutionOptions = useMemo(() => 
    institutions.map((i) => ({ 
      value: String(i.institutionId), 
      label: i.name 
    })),
    [institutions]
  );

  const tutorOptions = useMemo(() =>
    tutors.map((t) => ({ 
      value: String(t.tutorId), 
      label: `${t.firstName} ${t.lastName}`.trim() 
    })),
    [tutors]
  );

  const getOptions = () => {
    switch (selectedChangeType) {
      case "institution":
        return institutionOptions;
      case "tutor":
        return tutorOptions;
      default:
        return [];
    }
  };

  const getCurrentValue = () => {
    if (!student) return "";
    switch (selectedChangeType) {
      case "institution":
        return "";
      case "tutor":
        return "";
      default:
        return "";
    }
  };

  const onSubmit = async (data: ChangeFormData) => {
    if (!student) return;

    setIsSubmitting(true);
    try {
      const result = await changeStudentRegistration(student.studentId, {
        changeType: data.changeType,
        newValue: data.newValue,
        reason: data.reason
      });

      if (result.success) {
        addToast({
          variant: "success",
          title: "Cambio realizado",
          message: `Se ha actualizado ${data.changeType} del estudiante exitosamente`
        });
        refreshStudents();
        onSuccess?.();
        onClose();
      } else {
        let errorMessage = result.message;
        
        if (result.message?.includes("ACTIVE_PRACTICE_BLOCK")) {
          errorMessage = "No se puede realizar el cambio. El estudiante tiene una práctica activa.";
        } else if (result.message?.includes("PENDING_EVALUATIONS_BLOCK")) {
          errorMessage = "No se puede realizar el cambio. El estudiante tiene evaluaciones pendientes.";
        }
        
        addToast({
          variant: "error",
          title: "Error",
          message: errorMessage
        });
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      addToast({
        variant: "error",
        title: "Error",
        message: err.response?.data?.message || "Error al procesar el cambio"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const changeTypeOptions = [
    { value: "institution", label: "Institución" },
    { value: "tutor", label: "Tutor" }
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} showCloseButton size="md">
      <ModalHeader>
        <div className="w-full">
          <span className="font-semibold text-text-primary modal-title text-theme-xl dark:text-white/90">
            Cambiar Datos del Estudiante
          </span>
          <p className="text-sm text-text-secondary dark:text-text-tertiary font-normal mt-1">
            Seleccione el tipo de dato a modificar
          </p>
        </div>
      </ModalHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <ModalBody>
          {student && (
            <div className="mb-4 p-3 bg-bg-secondary dark:bg-white/5 rounded-lg">
              <p className="text-sm font-medium text-text-primary">
                {student.fullNames}
              </p>
              <p className="text-xs text-text-tertiary">
                {student.identificationPrefix}-{student.identificationNumber}
              </p>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="changeType" className="block text-sm font-medium text-text-primary mb-1">
                Tipo de Cambio *
              </label>
              <select
                {...register("changeType")}
                id="changeType"
                className="w-full px-4 py-2.5 bg-bg-secondary dark:bg-white/5 border border-border-light dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
              >
                <option value="">Seleccione...</option>
                {changeTypeOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              {errors.changeType && (
                <p className="mt-1 text-xs text-red-500">{errors.changeType.message}</p>
              )}
            </div>

            {selectedChangeType && (
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  Nuevo Valor *
                </label>
                <CustomSelect
                  options={getOptions()}
                  value={getCurrentValue()}
                  onChange={(val) => setValue("newValue", val)}
                  placeholder={`Seleccione ${selectedChangeType}...`}
                  searchable
                />
                {errors.newValue && (
                  <p className="mt-1 text-xs text-red-500">{errors.newValue.message}</p>
                )}
              </div>
            )}

            <div>
              <label htmlFor="reason" className="block text-sm font-medium text-text-primary mb-1">
                Motivo del Cambio
              </label>
              <textarea
                {...register("reason")}
                id="reason"
                rows={3}
                className="w-full px-4 py-2.5 bg-bg-secondary dark:bg-white/5 border border-border-light dark:border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all resize-none"
                placeholder="Opcional: Explique el motivo del cambio..."
              />
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
          >
            Cancelar
          </button>
          <Button
            type="submit"
            loading={isSubmitting}
            loadingText="Guardando..."
            disabled={!selectedChangeType}
            className="px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Guardar Cambio
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
