import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";
import * as authService from "../../features/auth/services/authService";

export default function SignInForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [userCi, setUserCi] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
    }
  }, [location]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setWarning(null);

    try {
      const data = await authService.login(userCi, password);

      if (data.requirePasswordChange) {
        navigate("/first-login", { state: { userId: data.userId } });
        return;
      }

      if (data.user) {
        navigate("/dashboard");
      }
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string, attemptsRemaining?: number } } };
      const errorMessage = axiosError.response?.data?.message || (err as Error).message || "Error al iniciar sesión";
      const remaining = axiosError.response?.data?.attemptsRemaining;
      
      if (remaining !== undefined) {
        if (remaining <= 2) {
          setWarning(errorMessage);
        } else {
          setError(errorMessage);
        }
      } else {
        setError(errorMessage);
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

          {error && (
            <div className="p-3 mb-4 text-sm text-red-600 bg-red-100 border border-red-200 rounded-lg dark:bg-red-500/10 dark:border-red-500/20" role="alert">
              <div className="flex items-center gap-2">
                <svg className="size-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                <span>{error}</span>
              </div>
            </div>
          )}

          {warning && (
            <div className="p-3 mb-4 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg dark:bg-amber-500/10 dark:border-amber-500/20" role="alert">
              <div className="flex items-center gap-2">
                <svg className="size-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                <span>{warning}</span>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="p-3 mb-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg dark:bg-green-500/10 dark:border-green-500/20" role="alert">
              <div className="flex items-center gap-2">
                <svg className="size-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                <span>{successMessage}</span>
              </div>
            </div>
          )}

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
                    to="/forgot-password"
                    className="text-sm font-medium text-brand-500 hover:text-brand-600"
                  >
                    ¿Olvidó su contraseña?
                  </Link>
                </div>
                <div>
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

