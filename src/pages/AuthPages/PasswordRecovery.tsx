import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import * as authService from "../../features/auth/services/authService";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "../../icons";

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

import { useToast } from "../../context/toast";

export default function PasswordRecovery() {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const step = token ? 2 : 1; // 1: Email Request, 2: New Password (from token)
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  // Requisitos de complejidad (deben coincidir con el backend)
  const isPasswordStrong = (pass: string) => {
    return pass.length >= 12 && 
           /[A-Z]/.test(pass) && 
           /[a-z]/.test(pass) && 
           /[0-9]/.test(pass) && 
           /[^A-Za-z0-9]/.test(pass);
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await authService.requestRecovery(email);
      if (result.success) {
        setSuccess(result.message);
        addToast({
          variant: "success",
          title: "Enlace Enviado",
          message: "Se ha enviado un correo con las instrucciones para restablecer su contraseña."
        });
      } else {
        addToast({
          variant: "error",
          title: "Error de Solicitud",
          message: result.message || "No se pudo procesar la solicitud de recuperación."
        });
      }
    } catch (err) {
      const apiError = err as ApiError;
      addToast({
        variant: "error",
        title: "Error de Conexión",
        message: apiError.response?.data?.message || "No se pudo establecer conexión con el servidor."
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      addToast({
        variant: "error",
        title: "Error de Validación",
        message: "Las contraseñas no coinciden"
      });
      return;
    }
    if (!isPasswordStrong(newPassword)) {
      addToast({
        variant: "error",
        title: "Error de Validación",
        message: "La contraseña no cumple con los requisitos mínimos de seguridad."
      });
      return;
    }

    setLoading(true);
    try {
      const result = await authService.resetWithToken(token!, newPassword);

      if (result.success) {
        addToast({
          variant: "success",
          title: "Contraseña Restablecida",
          message: "Su contraseña ha sido actualizada correctamente. Ya puede iniciar sesión."
        });
        navigate("/signin");
      } else {
        addToast({
          variant: "error",
          title: "Error de Restablecimiento",
          message: result.message || "No se pudo restablecer la contraseña."
        });
      }
    } catch (err) {
      const apiError = err as ApiError;
      addToast({
        variant: "error",
        title: "Error de Conexión",
        message: apiError.response?.data?.message || "No se pudo establecer conexión con el servidor."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageMeta title="Recuperar Contraseña | SIGP - UNEFA" description="Recuperación de contraseña segura" />
      <AuthLayout>
        <div className="flex flex-col flex-1">
          <div className="w-full max-w-md pt-10 mx-auto">
            <Link to="/signin" className="inline-flex items-center text-sm text-text-secondary hover:text-text-emphasis">
              <ChevronLeftIcon className="size-5" />
              Volver al inicio de sesión
            </Link>
          </div>
          
          <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
            <div className="mb-8">
              <h1 className="mb-2 font-semibold text-text-emphasis text-title-sm">
                Recuperar Contraseña
              </h1>
              <p className="text-sm text-text-secondary">
                {step === 1 ? "Ingresa tu correo electrónico para recibir un enlace de recuperación." : "Crea una nueva contraseña segura para tu cuenta."}
              </p>
            </div>

            {success && (
              <div className="p-4 mb-4 text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg" role="alert">
                <p className="font-medium">Solicitud enviada</p>
                <p className="mt-1">{success}</p>
                <Link 
                  to="/signin"
                  className="mt-3 block text-xs font-semibold underline hover:no-underline"
                >
                  Volver al Inicio de Sesión
                </Link>
              </div>
            )}

            {step === 1 && !success && (
              <div className="space-y-6">
                <form onSubmit={handleEmailSubmit}>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="email">Correo Electrónico</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Ingrese su correo de recuperación"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <Button className="w-full" size="md" type="submit" disabled={loading}>
                      {loading ? "Enviando..." : "Enviar enlace al correo"}
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {step === 2 && (
              <form onSubmit={handlePasswordSubmit}>
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="newPassword">Nueva Contraseña</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="Mínimo 12 caracteres"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute z-30 -translate-y-1/2 right-4 top-1/2"
                      >
                        {showPassword ? <EyeIcon className="size-5" /> : <EyeCloseIcon className="size-5" />}
                      </button>
                    </div>
                    <div className="mt-2 text-xs space-y-1">
                      <p className={newPassword.length >= 12 ? "text-green-600" : "text-gray-500"}>✓ Al menos 12 caracteres</p>
                      <p className={/[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword) ? "text-green-600" : "text-gray-500"}>✓ Mayúsculas y minúsculas</p>
                      <p className={/[0-9]/.test(newPassword) ? "text-green-600" : "text-gray-500"}>✓ Al menos un número</p>
                      <p className={/[^A-Za-z0-9]/.test(newPassword) ? "text-green-600" : "text-gray-500"}>✓ Al menos un carácter especial</p>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      placeholder="Repita la contraseña"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button className="w-full" size="md" type="submit" disabled={loading || !isPasswordStrong(newPassword)}>
                    {loading ? "Restableciendo..." : "Cambiar Contraseña"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </AuthLayout>
    </>
  );
}