import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../context/auth";
import Badge from "../ui/badge/Badge";
import { useModal } from "../../hooks/useModal";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import * as authService from "../../features/auth/services/authService";
import { useToast } from "../../context/toast";
import UnifiedDialog from "../ui/dialog/UnifiedDialog";

export default function UserMetaCard() {
  const { user, checkAuth } = useAuth();
  const { addToast } = useToast();
  const { isOpen, openModal, closeModal } = useModal();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    secondName: "",
    surname: "",
    secondSurname: "",
    email: "",
    phoneNumber: ""
  });

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant: "info" | "warning" | "error" | "success" | "confirm";
  } | null>(null);

  // Precargar datos
  useEffect(() => {
    if (user && isOpen) {
      setFormData({
        name: user.name || "",
        secondName: user.secondName || "",
        surname: user.surname || "",
        secondSurname: user.secondSurname || "",
        email: user.email || "",
        phoneNumber: user.phoneNumber || ""
      });
    }
  }, [user, isOpen]);

  // Verificar si hay cambios
  const hasChanges = useMemo(() => {
    if (!user) return false;
    return (
      formData.name !== (user.name || "") ||
      formData.secondName !== (user.secondName || "") ||
      formData.surname !== (user.surname || "") ||
      formData.secondSurname !== (user.secondSurname || "") ||
      formData.email !== (user.email || "") ||
      formData.phoneNumber !== (user.phoneNumber || "")
    );
  }, [formData, user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCloseAttempt = () => {
    if (hasChanges) {
      setConfirmDialog({
        isOpen: true,
        title: "Cambios sin guardar",
        message: "¿Hay cambios sin guardar, seguro que desea cerrar?",
        variant: "warning",
        onConfirm: () => {
          setConfirmDialog(null);
          closeModal();
        }
      });
    } else {
      closeModal();
    }
  };

  const handleSaveAttempt = () => {
    const nameTrimmed = formData.name.trim();
    const surnameTrimmed = formData.surname.trim();
    const emailTrimmed = formData.email.trim();
    const phoneTrimmed = formData.phoneNumber.trim();

    // 1. Nombre completo (requerido, mínimo 3 caracteres)
    if (nameTrimmed.length < 3) {
      addToast({
        variant: "error",
        title: "Nombre inválido",
        message: "El nombre debe tener al menos 3 caracteres."
      });
      return;
    }

    if (!surnameTrimmed) {
      addToast({
        variant: "error",
        title: "Apellido requerido",
        message: "Por favor, ingrese su apellido."
      });
      return;
    }

    // 2. Email (formato válido, requerido)
    if (!emailTrimmed) {
      addToast({
        variant: "error",
        title: "Email requerido",
        message: "Por favor, ingrese su correo electrónico."
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailTrimmed)) {
      addToast({
        variant: "error",
        title: "Email inválido",
        message: "Ingrese un correo electrónico con formato válido."
      });
      return;
    }

    // 3. Teléfono (formato válido según región - Venezuela)
    if (phoneTrimmed) {
      const phoneRegex = /^04(12|14|16|24|26)\d{7}$/;
      if (!phoneRegex.test(phoneTrimmed)) {
        addToast({
          variant: "error",
          title: "Teléfono inválido",
          message: "Ingrese un número de teléfono válido (ej: 04121234567)."
        });
        return;
      }
    }

    setConfirmDialog({
      isOpen: true,
      title: "Confirmar cambios",
      message: "¿Está seguro que desea guardar los cambios?",
      variant: "confirm",
      onConfirm: () => {
        setConfirmDialog(null);
        executeSave();
      }
    });
  };

  const executeSave = async () => {
    setLoading(true);
    try {
      const result = await authService.updateProfile({
        ...formData,
        name: formData.name.trim(),
        surname: formData.surname.trim(),
        email: formData.email.trim(),
      });

      if (result.success) {
        await checkAuth();
        addToast({ variant: "success", title: "Éxito", message: "Perfil actualizado correctamente." });
        closeModal();
      } else {
        addToast({ variant: "error", title: "Error", message: result.message });
      }
    } catch {
      addToast({ variant: "error", title: "Error", message: "No se pudo conectar con el servidor." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-5 border border-border-light rounded-2xl dark:border-white/10 lg:p-6 bg-white dark:bg-bg-dark">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
          <div className="flex items-center justify-center w-24 h-24 overflow-hidden border border-border-light rounded-full bg-bg-secondary dark:bg-white/5 dark:border-white/10">
            <svg className="w-14 h-14 text-text-secondary dark:text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
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
            <h2 className="text-xl font-bold text-text-emphasis dark:text-white">Actualizar Perfil</h2>
            <p className="text-sm text-text-secondary dark:text-text-tertiary">Modifique sus datos personales a continuación.</p>
          </div>
        </ModalHeader>
        
        <ModalBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 py-2">
            <div className="space-y-2">
              <Label htmlFor="name">Primer Nombre <span className="text-error">*</span></Label>
              <Input id="name" name="name" value={formData.name} onChange={handleInputChange} placeholder="Su primer nombre" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="secondName">Segundo Nombre</Label>
              <Input id="secondName" name="secondName" value={formData.secondName} onChange={handleInputChange} placeholder="Opcional" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="surname">Primer Apellido <span className="text-error">*</span></Label>
              <Input id="surname" name="surname" value={formData.surname} onChange={handleInputChange} placeholder="Su primer apellido" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="secondSurname">Segundo Apellido</Label>
              <Input id="secondSurname" name="secondSurname" value={formData.secondSurname} onChange={handleInputChange} placeholder="Opcional" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico <span className="text-error">*</span></Label>
              <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="Correo" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Teléfono</Label>
              <Input id="phoneNumber" name="phoneNumber" type="tel" value={formData.phoneNumber} onChange={handleInputChange} placeholder="Su número de teléfono" />
            </div>
          </div>
        </ModalBody>

        <ModalFooter>
          <div className="flex w-full justify-end gap-3">
            <Button variant="outline" onClick={handleCloseAttempt} disabled={loading} className="px-6">Cancelar</Button>
            <Button onClick={handleSaveAttempt} disabled={loading} className="px-6 min-w-30">
              {loading ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </ModalFooter>
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
