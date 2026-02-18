/**
 * @file InternshipTypeModal.tsx
 * @description Modal para la creación y edición de Tipos de Práctica Profesional.
 * Implementa validaciones con Zod, manejo de estado de formulario con React Hook Form,
 * y protección contra pérdida de cambios no guardados mediante useUnsavedChanges.
 * 
 * @module features/internship-types/components
 */

import { useEffect, useRef, useState } from "react";
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

/**
 * Propiedades del componente InternshipTypeModal.
 */
interface InternshipTypeModalProps {
  /** Indica si el modal está visible */
  isOpen: boolean;
  /** Función para cerrar el modal */
  onClose: () => void;
  /** Función que se llama al guardar los datos (crear o editar) */
  onSave: (item: CreateInternshipTypePayload) => void;
  /** Objeto de tipo de práctica que se está editando, null si es creación */
  editingItem?: InternshipType | null;
  /** Lista de tipos de práctica existentes para validaciones de unicidad */
  existingTypes?: InternshipType[];
  /** Indica si el tipo de práctica ya tiene relaciones en la BD y no puede ser modificado críticamente */
  isInUse?: boolean;
  /** Estado de carga de la petición de guardado */
  isLoading?: boolean;
}

/**
 * Esquema de validación para el formulario de Tipos de Práctica.
 * @param existingTypes - Lista de tipos para validar duplicados.
 * @param editingItemId - ID del item actual para omitirlo en la validación de duplicados.
 */
const createInternshipTypeSchema = (existingTypes: InternshipType[], editingItemId?: number) => 
  z.object({
    name: z.string()
      .min(1, "El nombre es obligatorio")
      .regex(/^[A-ZÁÉÍÓÚÑ\s]+$/, "El nombre solo permite letras y acentos")
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

/**
 * Opciones de prioridad para los tipos de práctica.
 * Determina el orden de importancia o ejecución.
 */
const priorityOptions = [
  { value: "0", label: "0 (Único)" },
  { value: "1", label: "1 (Hospitalaria)" },
  { value: "2", label: "2 (Comunitaria)" },
];

/**
 * Componente InternshipTypeModal.
 * 
 * Permite al administrador crear nuevos tipos de práctica o modificar los existentes.
 * Utiliza un sistema de "Dirty Check" para avisar al usuario si intenta cerrar el modal con cambios.
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

  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  const [pendingData, setPendingData] = useState<InternshipTypeFormData | null>(null);

  const {
    handleSubmit,
    reset,
    control,
    formState: { errors, isDirty, isValid },
  } = useForm<InternshipTypeFormData>({
    resolver: zodResolver(createInternshipTypeSchema(existingTypes, editingItem?.id)),
    mode: "all", // Cambiado a 'all' para validación inmediata y consistente
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

  /**
   * Efecto para sincronizar el estado del formulario con el item en edición.
   */
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

  /**
   * Manejador de envío del formulario.
   */
  const onSubmit = (data: InternshipTypeFormData) => {
    setPendingData(data);
    setShowSaveConfirmation(true);
  };

  const handleConfirmSave = () => {
    if (!pendingData) return;
    
    onSave({
      name: pendingData.name.toUpperCase(),
      priority: Number(pendingData.priority),
      status: editingItem?.status ?? true,
    });
    
    setShowSaveConfirmation(false);
    setPendingData(null);
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} onCloseAttempt={handleCloseAttempt} showCloseButton>
        <ModalHeader>
          <div className="max-w-4xl mx-auto w-full text-center sm:text-left">
            <h5 className="mb-1 font-semibold text-text-primary modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
              {editingItem ? "Editar Tipo de Práctica" : "Registrar Tipo de Práctica"}
            </h5>
            <p className="text-sm text-text-secondary dark:text-text-tertiary font-normal">
              {editingItem ? "Modifica los detalles del tipo de práctica profesional." : "Ingresa los detalles del nuevo tipo de práctica profesional."}
            </p>
          </div>
        </ModalHeader>

        <ModalBody className="bg-bg-secondary/30 dark:bg-bg-dark/50">
          <form id="internship-type-form" onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-4xl mx-auto py-4">
            {/* Banner informativo para edición bloqueada */}
            {isInUse && editingItem && (
              <div className="p-4 rounded-xl bg-warning-50 border border-warning-200 dark:bg-warning-900/20 dark:border-warning-800/30">
                <div className="flex gap-3">
                  <div className="shrink-0 text-warning-600 dark:text-warning-400">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-warning-800 dark:text-warning-200">Restricción de Edición</h4>
                    <p className="text-xs text-warning-700 dark:text-warning-300 mt-1">
                      Este registro está siendo utilizado por una o más Carreras. La prioridad no puede ser modificada para mantener la integridad de los datos.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <div className="md:col-span-2">
                <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Nombre del Tipo de Práctica *</label>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      onChange={(e) => {
                        // Solo permite letras y espacios, fuerza mayúsculas
                        const val = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '').toUpperCase();
                        field.onChange(val);
                      }}
                      type="text"
                      placeholder="Ej: PRÁCTICA PROFESIONAL ÚNICA"
                      error={!!errors.name}
                      hint={errors.name?.message}
                    />
                  )}
                />
              </div>

              <div>
                <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Prioridad en el Sistema *</label>
                <Controller
                  name="priority"
                  control={control}
                  render={({ field }) => (
                    <div className="space-y-1">
                      <CustomSelect
                         options={priorityOptions}
                         value={field.value}
                         onChange={field.onChange}
                         onBlur={field.onBlur} // Asegura que la validación se dispare al salir
                         placeholder="Seleccione prioridad"
                         disabled={isInUse}
                         error={!!errors.priority}
                       />
                    </div>
                  )}
                />
                {errors.priority && (
                  <p className="mt-1 text-xs text-error-500 font-medium">{errors.priority.message}</p>
                )}
                {isInUse && (
                  <p className="mt-1 text-[10px] text-text-tertiary italic uppercase font-bold tracking-tighter opacity-70">Bloqueado por uso</p>
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
            <AsyncButton 
              type="submit" 
              form="internship-type-form" 
              loading={isLoading} 
              className="w-full sm:w-auto min-h-12" 
              disabled={!isValid || (editingItem ? !isDirty : false)}
            >
              {editingItem ? "Actualizar Registro" : "Guardar Tipo de Práctica"}
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
        isOpen={showSaveConfirmation}
        onClose={() => {
          setShowSaveConfirmation(false);
          setPendingData(null);
        }}
        onConfirm={handleConfirmSave}
        title={editingItem ? "Actualizar Tipo de Práctica" : "Guardar Tipo de Práctica"}
        message={`¿Estás seguro de que deseas ${editingItem ? 'actualizar' : 'guardar'} el tipo de práctica profesional?`}
        variant="confirm"
        confirmLabel={editingItem ? "Actualizar" : "Guardar"}
      />
    </>
  );
}
