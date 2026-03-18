import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router";
import { motion } from "framer-motion";
import { EyeClosedIcon, EyeIcon } from "lucide-react";
import Button from "../ui/button/Button";
import * as authService from "../../features/auth/services/authService";
import { useAuth } from "../../context/auth";
import { useToast } from "../../context/toast";
import { formatCedulaDisplay, cleanCedula, CEDULA_MAX_LENGTH } from "../../utils/inputFormat";

export default function SignInForm() {
  const { addToast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [userCi, setUserCi] = useState("");
  const [displayCi, setDisplayCi] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { checkAuth } = useAuth();

  const handleCiChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    // Permitir solo V, E, números
    const filtered = input.replace(/[^0-9VEve]/g, '').toUpperCase();
    const cleaned = cleanCedula(filtered);
    const formatted = formatCedulaDisplay(cleaned);
    
    setUserCi(cleaned);
    setDisplayCi(formatted);
  }, []);

  useEffect(() => {
    if (location.state?.message) {
      addToast({
        variant: "success",
        title: "Información",
        message: location.state.message
      });
    }

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
        await checkAuth();
        addToast({
          variant: "success",
          title: "Bienvenido",
          message: `Sesión iniciada correctamente. Bienvenido, ${data.user.name}.`
        });
        navigate("/dashboard");
      }
    } catch (err: unknown) {
      const axiosError = err as { 
        response?: { data?: { message?: string, attemptsRemaining?: number } };
        code?: string;
        message?: string;
      };
      
      const isNetworkError = 
        axiosError.code === 'ERR_NETWORK' || 
        axiosError.message === 'Network Error' ||
        !axiosError.response;
      
      let errorMessage: string;
      let errorTitle: string;
      
      if (isNetworkError) {
        errorTitle = "Error de Conexión";
        errorMessage = "No se pudo conectar con el servidor. Verifique que el servidor esté activo e inténtelo nuevamente.";
      } else {
        errorTitle = "Error de Acceso";
        errorMessage = axiosError.response?.data?.message || (err as Error).message || "Error al iniciar sesión";
      }
      
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
            title: errorTitle,
            message: errorMessage
          });
        }
      } else {
        addToast({
          variant: "error",
          title: errorTitle,
          message: errorMessage
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-brand-600 dark:text-gray-500 dark:hover:text-brand-400 transition-colors group"
        >
          <svg className="size-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver al inicio
        </Link>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mb-10"
      >

        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3 tracking-tight">
          Bienvenido
        </h1>
        <p className="text-base text-gray-500 dark:text-gray-400 leading-relaxed">
          Ingresa tu cédula y contraseña para acceder al Sistema de Gestión de Prácticas Profesionales.
        </p>
      </motion.div>

      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        onSubmit={handleSignIn}
        className="space-y-5"
      >
        <div>
          <label htmlFor="userCi" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Cédula de Identidad
          </label>
          <input
            id="userCi"
            type="text"
            placeholder="V00.000.000"
            value={displayCi}
            onChange={handleCiChange}
            required
            autoComplete="username"
            maxLength={CEDULA_MAX_LENGTH}
            className="w-full px-4 py-3.5 text-base text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all duration-200 tracking-widest"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Contraseña
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Ingresa tu contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full px-4 py-3.5 text-base text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all duration-200 pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showPassword ? (
                <EyeIcon className="size-5" />
              ) : (
                <EyeClosedIcon className="size-5" />
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end">
          <Link
            to="/password-recovery"
            className="text-sm font-medium text-gray-500 hover:text-brand-600 dark:text-gray-400 dark:hover:text-brand-400 transition-colors"
          >
            ¿Olvidó su contraseña?
          </Link>
        </div>

        <div className="pt-3">
          <Button
            className="w-full h-12 text-base font-semibold rounded-xl disabled:bg-gray-500 dark:disabled:bg-gray-400 disabled:cursor-not-allowed"
            size="lg"
            type="submit"
            disabled={loading || !userCi || !password}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin size-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Verificando...
              </span>
            ) : (
              "Iniciar Sesión"
            )}
          </Button>
        </div>
      </motion.form>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800"
      >
        <p className="text-xs text-center text-gray-400 dark:text-gray-500">
          Al iniciar sesión, aceptas nuestros términos de uso y políticas de privacidad.
        </p>

        <div className="mt-4 flex items-center justify-center gap-5 text-xs text-gray-400 dark:text-gray-500">
          <div className="flex items-center gap-1.5">
            <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Conexión Segura
          </div>
          <div className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
          <div className="flex items-center gap-1.5">
            <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Datos Protegidos
          </div>
        </div>
      </motion.div>
    </div>
  );
}
