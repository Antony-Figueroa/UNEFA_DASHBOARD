import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../../components/ui/modal";
import Button from "../../../components/ui/button/Button";
import AsyncButton from "../../../components/ui/button/AsyncButton";
import Input from "../../../components/form/input/InputField";
import CustomSelect from "../../../components/form/CustomSelect";
import Checkbox from "../../../components/form/input/Checkbox";
import { userSchema, UserFormData, UserFormOutput } from "../constants/validation";
import { User, CreateUserPayload, UpdateUserPayload } from "../types";
import { useUnsavedChanges } from "../../../hooks/useUnsavedChanges";
import UnifiedDialog from "../../../components/ui/dialog/UnifiedDialog";

/**
 * Propiedades para el componente UserModal.
 */
interface UserModalProps {
  /** Indica si el modal está abierto */
  isOpen: boolean;
  /** Función para cerrar el modal */
  onClose: () => void;
  /** Usuario a editar (null si es creación) */
  user: User | null;
  /** Función para guardar los cambios */
  onSave: (data: CreateUserPayload | UpdateUserPayload) => Promise<void>;
  /** Indica si se está procesando la solicitud */
  isSubmitting: boolean;
  /** Opciones de roles disponibles */
  roleOptions: { value: string; label: string }[];
}

/**
 * Componente Modal para la creación y edición de usuarios del sistema.
 * Utiliza React Hook Form y Zod para la validación de datos.
 */
const UserModal: React.FC<UserModalProps> = ({
  isOpen,
  onClose,
  user,
  onSave,
  isSubmitting,
  roleOptions
}) => {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isDirty, isValid }
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      userCi: "",
      name: "",
      surname: "",
      email: "",
      role: 2,
      status: 1,
      hasConsent: false
    }
  });

  const hasConsent = watch("hasConsent");

  // Efecto para cargar los datos del usuario cuando se abre el modal para editar
  useEffect(() => {
    if (user) {
      reset({
        userCi: user.userCi,
        name: user.name,
        surname: user.surname,
        email: user.email,
        role: user.role,
        status: user.status,
        hasConsent: true // Ya tiene consentimiento si existe
      });
    } else {
      reset({
        userCi: "",
        name: "",
        surname: "",
        email: "",
        role: 2,
        status: 1,
        hasConsent: false
      });
    }
  }, [user, reset, isOpen]);

  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [pendingData, setPendingData] = useState<UserFormOutput | null>(null);

  const {
    showConfirmation,
    handleCloseAttempt,
    confirmClose,
    cancelClose,
  } = useUnsavedChanges(isDirty, onClose);

  /**
   * Maneja el envío del formulario.
   */
  const onSubmit = (data: any) => {
    const validatedData = data as UserFormOutput;
    setPendingData(validatedData);
    setShowSaveConfirm(true);
  };

  const handleConfirmSave = async () => {
    if (!pendingData) return;
    
    try {
      if (user) {
        // Para actualización, enviamos el ID y los campos modificados
        const payload: UpdateUserPayload = {
          id: user.id,
          name: pendingData.name.toUpperCase(),
          surname: pendingData.surname.toUpperCase(),
          email: pendingData.email.toUpperCase(),
          role: pendingData.role,
          status: pendingData.status
        };
        await onSave(payload);
      } else {
        // Para creación, enviamos todos los campos requeridos
        const payload: CreateUserPayload = {
          userCi: pendingData.userCi.toUpperCase(),
          name: pendingData.name.toUpperCase(),
          surname: pendingData.surname.toUpperCase(),
          email: pendingData.email.toUpperCase(),
          role: pendingData.role
        };
        await onSave(payload);
      }
    } catch (error) {
      console.error("Error al guardar usuario:", error);
    } finally {
      setShowSaveConfirm(false);
      setPendingData(null);
    }
  };

  // El admin puede asignar cualquier rol
  const filteredRoleOptions = roleOptions;

  return (
    <>
    <Modal 
      isOpen={isOpen} 
      onClose={handleCloseAttempt}
      size="4xl"
      showCloseButton
    >
      <ModalHeader>
        <div className="max-w-4xl mx-auto w-full">
          <span className="mb-1 font-semibold text-text-primary modal-title text-theme-xl dark:text-white/90 lg:text-2xl">
            {user ? "Editar Usuario del Sistema" : "Registrar Nuevo Usuario"}
          </span>
          <p className="text-sm text-text-secondary dark:text-text-tertiary font-normal">
            {user 
              ? "Modifica los detalles del usuario del sistema." 
              : "Ingresa los detalles del nuevo usuario para el panel de control."}
          </p>
        </div>
      </ModalHeader>
      
      <ModalBody className="bg-bg-secondary/30 dark:bg-bg-dark/50 custom-scrollbar px-6 md:px-10 py-8">
        <form id="userForm" onSubmit={handleSubmit(onSubmit)} className="space-y-10 max-w-4xl mx-auto">
          {/* Sección: Información Personal */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1.5 h-6 bg-brand-500 rounded-full" />
              <h6 className="text-lg font-bold text-gray-800 dark:text-white/90">
                Información Personal
              </h6>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-6">
              <div>
                <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Cédula *</label>
                <Input
                  {...register("userCi")}
                  disabled={!!user}
                  placeholder="Ej. 12345678"
                  className="h-11 rounded-lg border-gray-200 dark:border-gray-700 uppercase"
                  error={!!errors.userCi}
                  hint={errors.userCi?.message}
                />
              </div>
              <div>
                <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Nombres *</label>
                <Input
                  {...register("name")}
                  placeholder="Nombres del usuario"
                  className="h-11 rounded-lg border-gray-200 dark:border-gray-700 uppercase"
                  error={!!errors.name}
                  hint={errors.name?.message}
                />
              </div>
              <div>
                <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Apellidos *</label>
                <Input
                  {...register("surname")}
                  placeholder="Apellidos del usuario"
                  className="h-11 rounded-lg border-gray-200 dark:border-gray-700 uppercase"
                  error={!!errors.surname}
                  hint={errors.surname?.message}
                />
              </div>
            </div>
          </section>

          {/* Sección: Credenciales y Acceso */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1.5 h-6 bg-brand-500 rounded-full" />
              <h6 className="text-lg font-bold text-gray-800 dark:text-white/90">
                Credenciales y Acceso
              </h6>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <div className="md:col-span-2">
                <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Correo Institucional *</label>
                <Input
                  type="email"
                  {...register("email")}
                  placeholder="usuario@unefa.edu.ve"
                  className="h-11 rounded-lg border-gray-200 dark:border-gray-700"
                  error={!!errors.email}
                  hint={errors.email?.message}
                />
              </div>
              <div>
                <label className="mb-2.5 block text-black dark:text-white font-medium text-sm">Rol del Sistema *</label>
                <CustomSelect
                  id="role"
                  value={String(watch("role") ?? "")}
                  onChange={(val) => setValue("role", Number(val), { shouldDirty: true, shouldValidate: true })}
                  options={(filteredRoleOptions.length > 0 ? filteredRoleOptions : [
                    { value: "0", label: "ADMIN (Administrador)" },
                    { value: "2", label: "ASISTENTE (Solo lectura)" }
                  ]).map(opt => ({ value: String(opt.value), label: opt.label }))}
                  placeholder="Seleccione un rol"
                  className="h-11 rounded-lg border-gray-200 dark:border-gray-700"
                  error={!!errors.role}
                />
              </div>
            </div>
          </section>

          {/* Consentimiento GDPR - Solo para nuevos usuarios */}
          {!user && (
            <section className="bg-brand-50/50 dark:bg-brand-500/5 p-4 rounded-xl border border-brand-200 dark:border-brand-500/20">
              <div className="flex items-start gap-3">
                <div className="pt-0.5">
                  <Checkbox
                    checked={hasConsent || false}
                    onChange={(checked) => setValue("hasConsent", checked, { shouldDirty: true, shouldValidate: true })}
                  />
                </div>
                <div className="space-y-1">
                  <label 
                    className="text-sm font-semibold text-brand-900 dark:text-brand-400 cursor-pointer" 
                    onClick={() => setValue("hasConsent", !hasConsent, { shouldDirty: true, shouldValidate: true })}
                  >
                    Consentimiento para el tratamiento de datos personales
                  </label>
                  <p className="text-xs text-brand-700/80 dark:text-brand-400/60 leading-relaxed">
                    Al marcar esta casilla, el administrador confirma que ha obtenido el consentimiento explícito del usuario 
                    para registrar sus datos personales (nombre, cédula, correo institucional) en el sistema SIGP - UNEFA, 
                    siguiendo las políticas de privacidad y seguridad vigentes.
                  </p>
                  {errors.hasConsent && (
                    <p className="text-xs text-red-500 mt-1">{errors.hasConsent.message}</p>
                  )}
                </div>
              </div>
            </section>
          )}
        </form>
      </ModalBody>
      
      <ModalFooter>
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 w-full max-w-4xl mx-auto">
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleCloseAttempt} 
            disabled={isSubmitting}
            className="w-full sm:w-auto min-h-12"
          >
            Cancelar
          </Button>
          <AsyncButton 
            type="submit" 
            form="userForm" 
            loading={isSubmitting}
            className="w-full sm:w-auto min-h-12"
            disabled={!isValid || (user ? !isDirty : false)}
          >
            {user ? "Actualizar Datos" : "Crear Usuario"}
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
      isOpen={showSaveConfirm}
      onClose={() => setShowSaveConfirm(false)}
      onConfirm={handleConfirmSave}
      title={user ? "Actualizar Usuario" : "Crear Usuario"}
      message={`¿Estás seguro de que deseas ${user ? 'actualizar los datos del' : 'crear este nuevo'} usuario?`}
      confirmLabel={user ? "Actualizar" : "Crear"}
      variant="confirm"
      isLoading={isSubmitting}
    />
    </>
  );
};

export default UserModal;
