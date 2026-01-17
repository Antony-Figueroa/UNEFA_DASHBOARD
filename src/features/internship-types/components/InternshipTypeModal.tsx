import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Input from "../../../components/form/input/InputField";
import Select from "../../../components/form/Select";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../../components/ui/modal";
import { InternshipType } from "../types";
import Button from "../../../components/ui/button/Button";
import { useUnsavedChanges } from "../../../hooks/useUnsavedChanges";
import UnifiedDialog from "../../../components/ui/dialog/UnifiedDialog";

interface InternshipTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Omit<InternshipType, "INTERNSHIP_TYPE_ID" | "CREATION_DATE">) => void;
  editingItem?: InternshipType | null;
  existingTypes?: InternshipType[];
  isInUse?: boolean;
  isLoading?: boolean;
}

const createInternshipTypeSchema = (existingTypes: InternshipType[], editingItemId?: number) => 
  z.object({
    NAME: z.string()
      .min(1, "El nombre es obligatorio")
      .transform(val => val.toUpperCase())
      .refine(val => {
        const normalizedVal = val.trim().toUpperCase();
        return !existingTypes.some(t => 
          t.NAME.trim().toUpperCase() === normalizedVal && 
          t.INTERNSHIP_TYPE_ID !== editingItemId
        );
      }, "Este tipo de práctica ya existe"),
    PRIORITY: z.string().min(1, "La prioridad es obligatoria"),
  });

type InternshipTypeFormData = z.infer<ReturnType<typeof createInternshipTypeSchema>>;

const priorityOptions = [
  { value: "0", label: "0" },
  { value: "1", label: "1" },
  { value: "2", label: "2" },
];

export default function InternshipTypeModal({
  isOpen,
  onClose,
  onSave,
  editingItem,
  existingTypes = [],
  isInUse = false,
  isLoading = false,
}: InternshipTypeModalProps) {
  const {
    handleSubmit,
    reset,
    control,
    formState: { errors, isDirty },
  } = useForm<InternshipTypeFormData>({
    resolver: zodResolver(createInternshipTypeSchema(existingTypes, editingItem?.INTERNSHIP_TYPE_ID)),
    mode: "onChange",
    defaultValues: {
      NAME: "",
      PRIORITY: "",
    },
  });

  const {
    showConfirmation,
    handleCloseAttempt,
    confirmClose,
    cancelClose,
  } = useUnsavedChanges(isDirty, onClose);

  useEffect(() => {
    if (isOpen) {
      if (editingItem) {
        reset({
          NAME: editingItem.NAME,
          PRIORITY: String(editingItem.PRIORITY),
        });
      } else {
        reset({
          NAME: "",
          PRIORITY: "",
        });
      }
    } else {
      reset();
    }
  }, [editingItem, isOpen, reset]);

  const onSubmit = (data: InternshipTypeFormData) => {
    onSave({
      NAME: data.NAME,
      ABBREVIATION: data.NAME.substring(0, 10).toUpperCase(), // Fallback para campo obligatorio en BD
      PRIORITY: Number(data.PRIORITY),
      STATUS: editingItem?.STATUS ?? 1,
    });
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} onCloseAttempt={handleCloseAttempt} showCloseButton>
        <ModalHeader>
          <div className="max-w-4xl mx-auto w-full">
            <h5 className="mb-1 font-semibold text-text-primary modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
              {editingItem ? "Editar Tipo de Práctica" : "Registrar Tipo de Práctica"}
            </h5>
            <p className="text-sm text-text-secondary dark:text-text-tertiary font-normal">
              {editingItem ? "Modifica los detalles del tipo de práctica profesional." : "Ingresa los detalles del nuevo tipo de práctica profesional."}
            </p>
          </div>
        </ModalHeader>

        <ModalBody className="bg-bg-secondary/30 dark:bg-bg-dark/50">
          <form id="internship-type-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
              <div>
                <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Nombre *</label>
                <Controller
                  name="NAME"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      onChange={(e) => {
                        const val = e.target.value.toUpperCase();
                        field.onChange(val);
                      }}
                      type="text"
                      placeholder="Ingrese el nombre"
                      error={!!errors.NAME}
                      hint={errors.NAME?.message}
                    />
                  )}
                />
              </div>

              <div>
                <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Prioridad *</label>
                <Controller
                  name="PRIORITY"
                  control={control}
                  render={({ field }) => (
                    <div className="space-y-1">
                      <Select
                         options={priorityOptions}
                         value={field.value}
                         onChange={field.onChange}
                         placeholder="Seleccione prioridad"
                         disabled={isInUse}
                       />
                      {errors.PRIORITY && (
                        <p className="mt-1 text-xs text-error-500">{errors.PRIORITY.message}</p>
                      )}
                    </div>
                  )}
                />
                {isInUse && (
                  <p className="mt-1 text-xs text-text-tertiary italic">No se puede editar la prioridad porque está asignada a un registro activo</p>
                )}
              </div>
            </div>
          </form>
        </ModalBody>

        <ModalFooter className="shrink-0 px-6 sm:px-12 py-6 bg-white dark:bg-bg-dark border-t border-border-light dark:border-border-dark">
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 w-full max-w-4xl mx-auto">
            <Button variant="outline" onClick={handleCloseAttempt} disabled={isLoading} className="w-full sm:w-auto min-h-12">
              Cancelar
            </Button>
            <Button type="submit" form="internship-type-form" loading={isLoading} className="w-full sm:w-auto min-h-12">
              {editingItem ? "Actualizar Registro" : "Guardar Tipo"}
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
