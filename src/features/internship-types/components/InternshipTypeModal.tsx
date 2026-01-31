/**
 * @file InternshipTypeModal.tsx
 * @description Modal para la creación y edición de Tipos de Pasantía.
 * Incluye validación con Zod y gestión de cambios no guardados.
 * 
 * @module features/internship-types/components
 */

import { useEffect, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Input from "../../../components/form/input/InputField";
import CustomSelect from "../../../components/form/CustomSelect";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../../components/ui/modal";
import { InternshipType, CreateInternshipTypePayload } from "../types";
import Button from "../../../components/ui/button/Button";
import AsyncButton from "../../../components/ui/button/AsyncButton";
import { useUnsavedChanges } from "../../../hooks/useUnsavedChanges";
import UnifiedDialog from "../../../components/ui/dialog/UnifiedDialog";

interface InternshipTypeModalProps {
  /** Indica si el modal está visible */
  isOpen: boolean;
  /** Callback para cerrar el modal */
  onClose: () => void;
  /** Callback para guardar los cambios */
  onSave: (item: CreateInternshipTypePayload) => void;
  /** Elemento que se está editando (null para creación) */
  editingItem?: InternshipType | null;
  /** Lista de tipos existentes para validaciones de duplicados */
  existingTypes?: InternshipType[];
  /** Indica si el tipo está siendo usado en el sistema */
  isInUse?: boolean;
  /** Estado de carga de la acción de guardado */
  isLoading?: boolean;
}

/**
 * Esquema de validación para el formulario.
 */
const createInternshipTypeSchema = (existingTypes: InternshipType[], editingItemId?: number) => 
  z.object({
    name: z.string()
      .min(1, "El nombre es obligatorio")
      .transform(val => val.toUpperCase())
      .refine(val => {
        const normalizedVal = val.trim().toUpperCase();
        return !existingTypes.some(t => 
          t.name.trim().toUpperCase() === normalizedVal && 
          t.id !== editingItemId
        );
      }, "Este tipo de práctica ya existe"),
    priority: z.string().min(1, "La prioridad es obligatoria"),
  });

type InternshipTypeFormData = z.infer<ReturnType<typeof createInternshipTypeSchema>>;

const priorityOptions = [
  { value: "0", label: "0" },
  { value: "1", label: "1" },
  { value: "2", label: "2" },
];

/**
 * Componente Modal para gestionar Tipos de Pasantía.
 */
export default function InternshipTypeModal({
  isOpen,
  onClose,
  onSave,
  editingItem,
  existingTypes = [],
  isInUse = false,
  isLoading = false,
}: InternshipTypeModalProps) {
  const isInitializing = useRef(false);

  const {
    handleSubmit,
    reset,
    control,
    formState: { errors, isDirty, isValid },
  } = useForm<InternshipTypeFormData>({
    resolver: zodResolver(createInternshipTypeSchema(existingTypes, editingItem?.id)),
    mode: "onChange",
    defaultValues: {
      name: "",
      priority: "",
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
      isInitializing.current = true;
      if (editingItem) {
        reset({
          name: editingItem.name,
          priority: String(editingItem.priority),
        });
      } else {
        reset({
          name: "",
          priority: "",
        });
      }
      setTimeout(() => {
        isInitializing.current = false;
      }, 50);
    } else {
      reset();
      isInitializing.current = false;
    }
  }, [editingItem, isOpen, reset]);

  const onSubmit = (data: InternshipTypeFormData) => {
    onSave({
      name: data.name,
      abbreviation: data.name.substring(0, 10).toUpperCase(), // Fallback para campo obligatorio en BD
      priority: Number(data.priority),
      status: editingItem?.status ?? true,
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
                  name="name"
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
                      error={!!errors.name}
                      hint={errors.name?.message}
                    />
                  )}
                />
              </div>

              <div>
                <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Prioridad *</label>
                <Controller
                  name="priority"
                  control={control}
                  render={({ field }) => (
                    <div className="space-y-1">
                      <CustomSelect
                         options={priorityOptions}
                         value={field.value}
                         onChange={field.onChange}
                         placeholder="Seleccione prioridad"
                         disabled={isInUse}
                       />
                      {errors.priority && (
                        <p className="mt-1 text-xs text-error-500">{errors.priority.message}</p>
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
            <AsyncButton type="submit" form="internship-type-form" loading={isLoading} className="w-full sm:w-auto min-h-12" disabled={!isValid}>
              {editingItem ? "Actualizar Registro" : "Guardar Tipo"}
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
    </>
  );
}
