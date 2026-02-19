import { useState } from "react";
import { useAuth } from "../../context/auth";
import { useModal } from "../../hooks/useModal";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import * as authService from "../../features/auth/services/authService";
import { useToast } from "../../context/toast";
import UnifiedDialog from "../ui/dialog/UnifiedDialog";
import { EyeCloseIcon, EyeIcon } from "../../icons";

export default function UserPasswordCard() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const { isOpen, openModal, closeModal } = useModal();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant: "info" | "warning" | "error" | "success" | "confirm";
  } | null>(null);

  const passwordRequirements = [
    { label: "12+ caracteres", met: formData.newPassword.length >= 12 },
    { label: "Mayúscula", met: /[A-Z]/.test(formData.newPassword) },
    { label: "Minúscula", met: /[a-z]/.test(formData.newPassword) },
    { label: "Número", met: /[0-9]/.test(formData.newPassword) },
    { label: "Especial", met: /[!@#$%^&*()_+~`|}{[\]:;?><,./\-=]/.test(formData.newPassword) },
  ];

  const strength = passwordRequirements.filter(r => r.met).length;
  const allRequirementsMet = strength === 5;
  const passwordsMatch = formData.newPassword === formData.confirmPassword && formData.confirmPassword.length > 0;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const togglePassword = (field: "current" | "new" | "confirm") => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSaveAttempt = () => {
    if (!formData.currentPassword) {
      addToast({ variant: "error", title: "Error", message: "Ingrese su contraseña actual" });
      return;
    }

    if (!allRequirementsMet) {
      addToast({ variant: "error", title: "Contraseña débil", message: "La nueva contraseña no cumple los requisitos" });
      return;
    }

    if (!passwordsMatch) {
      addToast({ variant: "error", title: "Error", message: "Las contraseñas no coinciden" });
      return;
    }

    setConfirmDialog({
      isOpen: true,
      title: "Confirmar cambio",
      message: "¿Cambiar su contraseña? Deberá iniciar sesión nuevamente.",
      variant: "warning",
      onConfirm: () => {
        setConfirmDialog(null);
        executeChange();
      }
    });
  };

  const executeChange = async () => {
    setLoading(true);
    try {
      const result = await authService.changePassword(user!.id, formData.newPassword);

      if (result.success) {
        addToast({ variant: "success", title: "Contraseña actualizada", message: "Iniciando sesión de nuevo..." });
        closeModal();
        setFormData({ currentPassword: "", newPassword: "", confirmPassword: "" });
        setTimeout(() => { window.location.href = "/signin"; }, 2000);
      } else {
        addToast({ variant: "error", title: "Error", message: result.message || "No se pudo cambiar" });
      }
    } catch {
      addToast({ variant: "error", title: "Error", message: "Sin conexión al servidor" });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ currentPassword: "", newPassword: "", confirmPassword: "" });
    closeModal();
  };

  return (
    <>
      <div className="p-5 border border-border-light rounded-2xl dark:border-white/10 lg:p-6 bg-white dark:bg-bg-dark">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-brand-50 dark:bg-brand-500/10">
              <svg className="w-6 h-6 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <div>
              <h4 className="text-base font-semibold text-text-emphasis dark:text-white">
                Seguridad de la Cuenta
              </h4>
              <p className="text-sm text-text-secondary dark:text-text-tertiary">
                Protege tu cuenta con una contraseña segura
              </p>
            </div>
          </div>

          <button
            onClick={openModal}
            className="shrink-0 inline-flex items-center gap-2 rounded-lg border border-border-medium bg-white dark:bg-white/5 px-4 py-2 text-sm font-medium text-text-primary dark:text-text-secondary hover:bg-gray-50 dark:hover:bg-white/10 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Cambiar
          </button>
        </div>
      </div>

      <Modal isOpen={isOpen} onClose={handleClose} className="max-w-md">
        <ModalHeader>
          Nueva Contraseña
        </ModalHeader>
        
        <ModalBody>
          <div className="space-y-5">
            <div>
              <Label htmlFor="currentPassword" className="text-xs text-text-secondary">Actual</Label>
              <div className="relative mt-1">
                <Input 
                  id="currentPassword" 
                  name="currentPassword" 
                  type={showPasswords.current ? "text" : "password"}
                  value={formData.currentPassword} 
                  onChange={handleInputChange} 
                  placeholder="••••••••••••"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => togglePassword("current")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary"
                >
                  {showPasswords.current ? <EyeIcon className="h-4 w-4" /> : <EyeCloseIcon className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="newPassword" className="text-xs text-text-secondary">Nueva</Label>
              <div className="relative mt-1">
                <Input 
                  id="newPassword" 
                  name="newPassword" 
                  type={showPasswords.new ? "text" : "password"}
                  value={formData.newPassword} 
                  onChange={handleInputChange} 
                  placeholder="••••••••••••"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => togglePassword("new")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary"
                >
                  {showPasswords.new ? <EyeIcon className="h-4 w-4" /> : <EyeCloseIcon className="h-4 w-4" />}
                </button>
              </div>
              
              {formData.newPassword && (
                <div className="mt-3 p-3 rounded-lg bg-gray-50 dark:bg-white/5">
                  <div className="flex gap-1 mb-2">
                    {[1,2,3,4,5].map(level => (
                      <div 
                        key={level} 
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          level <= strength 
                            ? strength <= 2 ? "bg-red-400" : strength <= 4 ? "bg-amber-400" : "bg-green-400"
                            : "bg-gray-200 dark:bg-gray-700"
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {passwordRequirements.map((req, idx) => (
                      <span key={idx} className={`text-xs ${req.met ? "text-green-600" : "text-gray-400"}`}>
                        {req.met ? "✓" : "○"} {req.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="confirmPassword" className="text-xs text-text-secondary">Confirmar</Label>
              <div className="relative mt-1">
                <Input 
                  id="confirmPassword" 
                  name="confirmPassword" 
                  type={showPasswords.confirm ? "text" : "password"}
                  value={formData.confirmPassword} 
                  onChange={handleInputChange} 
                  placeholder="••••••••••••"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => togglePassword("confirm")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary"
                >
                  {showPasswords.confirm ? <EyeIcon className="h-4 w-4" /> : <EyeCloseIcon className="h-4 w-4" />}
                </button>
              </div>
              {formData.confirmPassword && !passwordsMatch && (
                <p className="mt-1 text-xs text-error">No coinciden</p>
              )}
            </div>
          </div>
        </ModalBody>

        <ModalFooter className="pt-2!">
          <Button variant="outline" onClick={handleClose} disabled={loading}>Cancelar</Button>
          <Button 
            onClick={handleSaveAttempt} 
            disabled={loading || !allRequirementsMet || !passwordsMatch || !formData.currentPassword}
          >
            {loading ? "Guardando..." : "Guardar"}
          </Button>
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
    </>
  );
}
