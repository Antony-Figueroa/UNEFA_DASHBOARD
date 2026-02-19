import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";
import * as authService from "../../features/auth/services/authService";
import { useAuth } from "../../context/auth";

import { useToast } from "../../context/toast";

export default function SignInForm() {
  const { addToast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [userCi, setUserCi] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { checkAuth } = useAuth();

  useEffect(() => {
    if (location.state?.message) {
      addToast({
        variant: "success",
        title: "Información",
        message: location.state.message
      });
    }

    // Verificar si venimos de una redirección por expiración
    const reason = sessionStorage.getItem('auth_redirect_reason');
    if (reason === 'expired') {
      addToast({
        variant: "warning",
        title: "Sesión Expirada",
        message: "Su sesión ha finalizado por seguridad. Inicie sesión nuevamente.",
        duration: 8000
      });
      sessionStorage.removeItem('auth_redirect_reason');
    }
  }, [location, addToast]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await authService.login(userCi, password);

      if (data.requirePasswordChange) {
        addToast({
          variant: "warning",
          title: "Cambio de Contraseña Requerido",
          message: "Por seguridad, debe actualizar su contraseña antes de continuar."
        });
        navigate("/first-login", { state: { userId: data.userId } });
        return;
      }

      if (data.user) {
        await checkAuth(); // Actualizar el estado global del usuario
        addToast({
          variant: "success",
          title: "Bienvenido",
          message: `Sesión iniciada correctamente. Bienvenido, ${data.user.name}.`
        });
        navigate("/dashboard");
      }
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string, attemptsRemaining?: number } } };
      const errorMessage = axiosError.response?.data?.message || (err as Error).message || "Error al iniciar sesión";
      const remaining = axiosError.response?.data?.attemptsRemaining;

      if (remaining !== undefined) {
        if (remaining <= 2) {
          addToast({
            variant: "warning",
            title: "Aviso de Seguridad",
            message: errorMessage
          });
        } else {
          addToast({
            variant: "error",
            title: "Error de Acceso",
            message: errorMessage
          });
        }
      } else {
        addToast({
          variant: "error",
          title: "Error de Acceso",
          message: errorMessage
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col flex-1">
      <div className="w-full max-w-md pt-10 mx-auto">
        <Link
          to="/"
          className="inline-flex items-center text-sm text-text-secondary transition-colors hover:text-text-emphasis dark:text-text-tertiary dark:hover:text-text-secondary"
        >
          <ChevronLeftIcon className="size-5" />
          Volver al inicio
        </Link>
      </div>
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-text-emphasis text-title-sm dark:text-text-emphasis sm:text-title-md">
              Iniciar Sesión
            </h1>
            <p className="text-sm text-text-secondary dark:text-text-tertiary">
              Ingrese su cédula y contraseña para acceder al sistema.
            </p>
          </div>

          <div>
            <form onSubmit={handleSignIn}>
              <div className="space-y-6">
                <div>
                  <Label htmlFor="userCi">
                    Cédula <span className="text-error-500">*</span>{" "}
                  </Label>
                  <Input
                    id="userCi"
                    type="text"
                    placeholder="Ingrese su cédula"
                    value={userCi}
                    onChange={(e) => setUserCi(e.target.value)}
                    required
                    autoComplete="username"
                  />
                </div>
                <div>
                  <Label htmlFor="password">
                    Contraseña <span className="text-error-500">*</span>{" "}
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Ingrese su contraseña"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      isPassword
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 right-4 top-1/2"
                      aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    >
                      {showPassword ? (
                        <EyeIcon className="fill-text-secondary dark:fill-text-tertiary size-5" />
                      ) : (
                        <EyeCloseIcon className="fill-text-secondary dark:fill-text-tertiary size-5" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Link
                    to="/password-recovery"
                    className="text-sm font-medium text-brand-500 hover:text-brand-600 dark:text-brand-400 dark:hover:text-brand-300"
                  >
                    ¿Olvidó su contraseña?
                  </Link>
                </div>
                <div className="mt-6">
                  <Button
                    className="w-full"
                    size="md"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
                  </Button>
                </div>
              </div>
            </form>

            {/* <div className="mt-5">
              <p className="text-sm font-normal text-center text-text-tertiary dark:text-text-tertiary">
                ¿No tiene una cuenta?{" "}
                <Link
                  to="/signup"
                  className="font-medium text-brand-500 hover:text-brand-600"
                >
                  Regístrese
                </Link>
              </p>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
}

