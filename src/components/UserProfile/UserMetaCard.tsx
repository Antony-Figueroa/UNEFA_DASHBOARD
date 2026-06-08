import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "../../context/auth";
import Badge from "../ui/badge/Badge";
import { useModal } from "../../hooks/useModal";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import * as authService from "../../features/auth/services/authService";
import { useToast } from "../../context/toast";
import { profileSchema, type ProfileFormData } from "../../features/auth/constants/profileValidation";
import UnifiedDialog from "../ui/dialog/UnifiedDialog";

export default function UserMetaCard() {
  const { user, checkAuth } = useAuth();
  const { addToast } = useToast();
  const { isOpen, openModal, closeModal } = useModal();
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      secondName: "",
      surname: "",
      secondSurname: "",
      email: "",
      phoneNumber: "",
    },
  });

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant: "info" | "warning" | "error" | "success" | "confirm";
  } | null>(null);

  useEffect(() => {
    if (isOpen && user) {
      reset({
        name: user.name || "",
        secondName: user.secondName || "",
        surname: user.surname || "",
        secondSurname: user.secondSurname || "",
        email: user.email || "",
        phoneNumber: user.phoneNumber || "",
      });
    }
  }, [isOpen, user, reset]);

  const handleCloseAttempt = () => {
    if (isDirty) {
      setConfirmDialog({
        isOpen: true,
        title: "Cambios sin guardar",
        message: "¿Hay cambios sin guardar, seguro que desea cerrar?",
        variant: "warning",
        onConfirm: () => {
          setConfirmDialog(null);
          reset();
          closeModal();
        },
      });
    } else {
      closeModal();
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    setConfirmDialog({
      isOpen: true,
      title: "Confirmar cambios",
      message: "¿Está seguro que desea guardar los cambios?",
      variant: "confirm",
      onConfirm: async () => {
        setConfirmDialog(null);
        setSaving(true);
        try {
          const result = await authService.updateProfile({
            name: data.name.trim(),
            surname: data.surname.trim(),
            email: data.email.trim(),
            secondName: data.secondName || undefined,
            secondSurname: data.secondSurname || undefined,
            phoneNumber: data.phoneNumber || undefined,
          });

          if (result.success) {
            await checkAuth();
            addToast({ variant: "success", title: "Perfil Actualizado", message: "Su información personal ha sido actualizada correctamente." });
            closeModal();
          } else {
            addToast({ variant: "error", title: "Error de Actualización", message: result.message || "No se pudo actualizar el perfil." });
          }
        } catch {
          addToast({ variant: "error", title: "Error de Conexión", message: "No se pudo establecer conexión con el servidor." });
        } finally {
          setSaving(false);
        }
      },
    });
  };

  const initials = user
    ? `${user.name.charAt(0)}${user.surname.charAt(0)}`.toUpperCase()
    : "??";

  return (
    <div className="p-5 border border-border-light rounded-2xl dark:border-white/10 lg:p-6 bg-white dark:bg-bg-dark">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
          <div className="flex items-center justify-center w-24 h-24 overflow-hidden border border-border-light rounded-full bg-brand-50 dark:bg-brand-500/10 dark:border-white/10">
            <span className="text-2xl font-bold text-brand-600 dark:text-brand-400">
              {initials}
            </span>
          </div>

          <div className="flex-1 text-center xl:text-left">
            <h4 className="mb-1 text-2xl font-bold text-text-emphasis dark:text-white">
              {user ? `${user.name} ${user.surname}` : "Cargando..."}
            </h4>
            <p className="text-md text-text-secondary dark:text-text-tertiary">
              {user?.email || "Sin correo registrado"}
            </p>
            <div className="mt-3 flex flex-wrap justify-center xl:justify-start gap-2">
              <Badge color="success" variant="light">Usuario Activo</Badge>
              <Badge color="light" variant="light">ID: {user?.userCi || "N/A"}</Badge>
            </div>
          </div>

          <div className="w-full xl:w-auto">
            <button
              onClick={openModal}
              className="w-full xl:w-auto flex items-center justify-center gap-2 rounded-full border border-border-medium bg-bg-main px-4 py-2.5 text-sm font-medium text-text-primary shadow-theme-xs hover:bg-bg-secondary hover:text-text-emphasis dark:border-border-dark dark:bg-white/3 dark:text-text-tertiary dark:hover:bg-white/5 dark:hover:text-white"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Editar Perfil
            </button>
          </div>
        </div>
      </div>

      <Modal isOpen={isOpen} onClose={handleCloseAttempt} className="max-w-137.5">
        <ModalHeader>
          <div className="flex flex-col">
            <span className="text-xl font-bold text-text-emphasis dark:text-white">Actualizar Perfil</span>
            <p className="text-sm text-text-secondary dark:text-text-tertiary">Modifique sus datos personales a continuación.</p>
          </div>
        </ModalHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <ModalBody>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 py-2">
              <div className="space-y-2">
                <Label htmlFor="name">Primer Nombre <span className="text-error">*</span></Label>
                <Input id="name" {...register("name")} error={!!errors.name} hint={errors.name?.message} placeholder="Su primer nombre" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="secondName">Segundo Nombre</Label>
                <Input id="secondName" {...register("secondName")} placeholder="Opcional" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="surname">Primer Apellido <span className="text-error">*</span></Label>
                <Input id="surname" {...register("surname")} error={!!errors.surname} hint={errors.surname?.message} placeholder="Su primer apellido" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="secondSurname">Segundo Apellido</Label>
                <Input id="secondSurname" {...register("secondSurname")} placeholder="Opcional" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico <span className="text-error">*</span></Label>
                <Input id="email" type="email" {...register("email")} error={!!errors.email} hint={errors.email?.message} placeholder="Correo" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Teléfono</Label>
                <Input id="phoneNumber" type="tel" {...register("phoneNumber")} error={!!errors.phoneNumber} hint={errors.phoneNumber?.message} placeholder="Su número de teléfono" />
              </div>
            </div>
          </ModalBody>

          <ModalFooter>
            <div className="flex w-full justify-end gap-3">
              <Button variant="outline" onClick={handleCloseAttempt} disabled={saving} className="px-6">Cancelar</Button>
              <Button type="submit" disabled={saving || !isDirty} className="px-6 min-w-30">
                {saving ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </div>
          </ModalFooter>
        </form>
      </Modal>

      {confirmDialog && (
        <UnifiedDialog
          isOpen={confirmDialog.isOpen}
          onClose={() => setConfirmDialog(null)}
          onConfirm={confirmDialog.onConfirm}
          title={confirmDialog.title}
          message={confirmDialog.message}
          variant={confirmDialog.variant}
          confirmLabel="Confirmar"
          cancelLabel="Cancelar"
        />
      )}
    </div>
  );
}
