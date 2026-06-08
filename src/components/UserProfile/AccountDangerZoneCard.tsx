import { useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "../../context/auth";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import UnifiedDialog from "../ui/dialog/UnifiedDialog";
import { deactivationSchema, type DeactivationFormData } from "../../features/auth/constants/profileValidation";
import { deactivateAccount } from "../../features/auth/services/authService";
import { useToast } from "../../context/toast";

export default function AccountDangerZoneCard() {
  const { signOut } = useAuth();
  const { addToast } = useToast();
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DeactivationFormData>({
    resolver: zodResolver(deactivationSchema),
    defaultValues: {
      currentPassword: "",
      reason: "",
    },
  });

  const handleDeactivate = async (data: DeactivationFormData) => {
    setLoading(true);
    try {
      const result = await deactivateAccount(data.currentPassword, data.reason || undefined);
      if (result.success) {
        addToast({
          variant: "success",
          title: "Cuenta desactivada",
          message: result.message || "Su cuenta ha sido desactivada.",
        });
        setShowConfirm(false);
        reset();
        setTimeout(() => signOut("account_deactivated"), 2000);
      } else {
        addToast({
          variant: "error",
          title: "Error",
          message: result.message || "No se pudo desactivar la cuenta.",
        });
      }
    } catch {
      addToast({
        variant: "error",
        title: "Error de Conexión",
        message: "No se pudo establecer conexión con el servidor.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="rounded-2xl border border-red-200 bg-white p-6 dark:border-red-900/50 dark:bg-white/[0.03]"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-red-50 dark:bg-red-500/10">
            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">
              Zona de Peligro
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Acciones irreversibles
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl bg-red-50 dark:bg-red-500/5 border border-red-100 dark:border-red-900/30">
          <div>
            <p className="text-sm font-medium text-red-700 dark:text-red-300">
              Desactivar cuenta
            </p>
            <p className="text-xs text-red-500 dark:text-red-400 mt-0.5">
              Una vez desactivada, no podrás acceder al sistema
            </p>
          </div>
          <Button
            variant="error"
            onClick={() => setShowConfirm(true)}
          >
            Desactivar
          </Button>
        </div>
      </motion.div>

      <UnifiedDialog
        isOpen={showConfirm}
        onClose={() => {
          setShowConfirm(false);
          reset();
        }}
        onConfirm={handleSubmit(handleDeactivate)}
        title="Desactivar cuenta"
        message={
          <div className="space-y-4 text-left w-full">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Esta acción es irreversible. Serás redirigido al inicio de sesión.
            </p>
            <div className="space-y-2">
              <Label htmlFor="danger-currentPassword" className="text-xs text-gray-500">
                Contraseña actual <span className="text-error">*</span>
              </Label>
              <Input
                id="danger-currentPassword"
                type="password"
                {...register("currentPassword")}
                error={!!errors.currentPassword}
                hint={errors.currentPassword?.message}
                placeholder="••••••••••••"
                isPassword={true}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="danger-reason" className="text-xs text-gray-500">
                Motivo (opcional)
              </Label>
              <Input
                id="danger-reason"
                {...register("reason")}
                error={!!errors.reason}
                hint={errors.reason?.message}
                placeholder="¿Por qué desactivas tu cuenta?"
              />
            </div>
          </div>
        }
        variant="error"
        confirmLabel={loading ? "Desactivando..." : "Desactivar cuenta"}
        cancelLabel="Cancelar"
        isLoading={loading}
      />
    </>
  );
}
