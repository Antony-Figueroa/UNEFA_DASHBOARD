import { useState, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { motion } from "framer-motion";
import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import Button from "../../components/ui/button/Button";
import * as authService from "../../features/auth/services/authService";
import { EyeClosedIcon, EyeIcon } from "lucide-react";
import { useToast } from "../../context/toast";
import { formatCedulaDisplay, cleanCedula } from "../../utils/inputFormat";

interface ApiError {
  response?: {
    data?: {
      message?: string;
    };
  };
}

interface SecurityQuestion {
  id: number;
  questionText: string;
  isCustom?: boolean;
}

type RecoveryMethod = 'email' | 'questions';

export default function PasswordRecovery() {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [recoveryMethod, setRecoveryMethod] = useState<RecoveryMethod>('email');
  const [step, setStep] = useState(token ? 3 : 1);
  
  const [userCi, setUserCi] = useState("");
  const [displayCi, setDisplayCi] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [securityQuestions, setSecurityQuestions] = useState<SecurityQuestion[]>([]);
  const [securityAnswers, setSecurityAnswers] = useState<Record<number, string>>({});
  const [maskedEmail, setMaskedEmail] = useState("");

  const isPasswordStrong = (pass: string) => {
    return pass.length >= 12 && 
           /[A-Z]/.test(pass) && 
           /[a-z]/.test(pass) && 
           /\d/.test(pass);
  };

  const handleCiChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const filtered = input.replace(/[^0-9VEve]/g, '').toUpperCase();
    const cleaned = cleanCedula(filtered);
    const formatted = formatCedulaDisplay(cleaned);
    
    setUserCi(cleaned);
    setDisplayCi(formatted);
  }, []);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userCi) {
      addToast({ variant: "error", title: "Error", message: "Ingrese su cédula" });
      return;
    }
    
    setLoading(true);
    try {
      const result = await authService.requestRecovery(userCi);
      if (result.success) {
        setSuccess(result.message || "Instrucciones enviadas al correo electrónico registrado.");
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

  const handleQuestionsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userCi) {
      addToast({ variant: "error", title: "Error", message: "Ingrese su cédula" });
      return;
    }
    
    setLoading(true);
    try {
      const result = await authService.getRecoveryQuestions(userCi);
      if (result.success && result.questions) {
        // Mapear preguntas del backend al formato del frontend
        const mappedQuestions: SecurityQuestion[] = result.questions.map((q: any) => ({
          id: q.id,
          questionText: q.description || q.questionText || "",
          isCustom: q.isCustom || false
        }));
        setSecurityQuestions(mappedQuestions);
        setMaskedEmail(result.email || "");
        setStep(2);
      } else {
        addToast({
          variant: "error",
          title: "Error",
          message: result.message || "No se pudieron obtener las preguntas de seguridad."
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

  const handleAnswerChange = (questionId: number, answer: string) => {
    setSecurityAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleVerifyAnswers = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const answeredCount = Object.values(securityAnswers).filter(a => a.trim().length > 0).length;
    if (answeredCount < 3) {
      addToast({ variant: "error", title: "Error", message: "Debe responder al menos 3 preguntas" });
      return;
    }
    
    if (!isPasswordStrong(newPassword)) {
      addToast({ variant: "error", title: "Error", message: "La contraseña no cumple los requisitos mínimos" });
      return;
    }
    
    if (newPassword !== confirmPassword) {
      addToast({ variant: "error", title: "Error", message: "Las contraseñas no coinciden" });
      return;
    }
    
    setLoading(true);
    try {
      // Incluir isCustom en las respuestas
      const answers = securityQuestions.map((q) => ({
        questionId: q.id,
        answer: securityAnswers[q.id] || "",
        isCustom: q.isCustom || false
      }));
      
      const result = await authService.verifyAnswersAndReset(userCi, answers, newPassword);
      
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
          title: "Error",
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

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      addToast({ variant: "error", title: "Error", message: "Las contraseñas no coinciden" });
      return;
    }
    if (!isPasswordStrong(newPassword)) {
      addToast({ variant: "error", title: "Error", message: "La contraseña no cumple los requisitos mínimos de seguridad." });
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
          title: "Error",
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

  const getStepDescription = () => {
    if (step === 3) return "Crea una nueva contraseña segura para tu cuenta.";
    if (recoveryMethod === 'email') return "Ingresa tu cédula para recibir un enlace de recuperación en tu correo registrado.";
    if (step === 1) return "Ingresa tu cédula para verificar tu identidad con preguntas de seguridad.";
    return maskedEmail ? `Correo: ${maskedEmail}` : "Responde tus preguntas de seguridad para restablecer tu contraseña.";
  };

  const getTitle = () => {
    if (step === 3) return "Nueva Contraseña";
    return "Recuperar Contraseña";
  };

  const inputClass = "w-full px-4 py-3.5 text-base text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all duration-200";
  const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2";

  const renderPasswordStrength = (password: string) => (
    <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Requisitos de seguridad:</p>
      <div className="grid grid-cols-2 gap-1.5">
        {[
          { test: password.length >= 12, text: "12+ caracteres" },
          { test: /[A-Z]/.test(password), text: "Mayúscula" },
          { test: /[a-z]/.test(password), text: "Minúscula" },
          { test: /[0-9]/.test(password), text: "Un número" },
        ].map((req, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className={`size-3.5 rounded-full flex items-center justify-center ${req.test ? 'bg-green-100 dark:bg-green-500/20' : 'bg-gray-200 dark:bg-gray-700'}`}>
              {req.test && (
                <svg className="size-2.5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <span className={`text-xs ${req.test ? 'text-green-600 dark:text-green-400' : 'text-gray-400 dark:text-gray-500'}`}>
              {req.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <PageMeta title="Recuperar Contraseña | SIGP - UNEFA" description="Recuperación de contraseña segura" />
      <AuthLayout>
        <div className="w-full">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-8"
          >
            <Link
              to="/signin"
              className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-brand-600 dark:text-gray-500 dark:hover:text-brand-400 transition-colors group"
            >
              <svg className="size-4 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Volver al inicio de sesión
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-10"
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="flex items-center justify-center size-11 rounded-xl bg-amber-50 dark:bg-amber-500/10">
                <svg className="size-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                </svg>
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-3 tracking-tight">
              {getTitle()}
            </h1>
            <p className="text-base text-gray-500 dark:text-gray-400 leading-relaxed">
              {getStepDescription()}
            </p>
          </motion.div>

          {success && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="mb-6 p-4 bg-green-50 dark:bg-green-500/10 border border-green-100 dark:border-green-500/20 rounded-xl"
            >
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center size-8 rounded-full bg-green-100 dark:bg-green-500/20 shrink-0">
                  <svg className="size-4 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="font-semibold text-green-800 dark:text-green-300">Solicitud enviada</p>
                  <p className="mt-1 text-sm text-green-700 dark:text-green-400">{success}</p>
                  <Link 
                    to="/signin"
                    className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-green-700 dark:text-green-300 hover:text-green-800 dark:hover:text-green-200 transition-colors"
                  >
                    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Volver al Inicio de Sesión
                  </Link>
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && token && (
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              onSubmit={handlePasswordSubmit}
              className="space-y-5"
            >
              <div>
                <label htmlFor="newPassword" className={labelClass}>Nueva Contraseña</label>
                <div className="relative">
                  <input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 12 caracteres"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className={`${inputClass} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showPassword ? <EyeIcon className="size-5" /> : <EyeClosedIcon className="size-5" />}
                  </button>
                </div>
                {renderPasswordStrength(newPassword)}
              </div>
              
              <div>
                <label htmlFor="confirmPassword" className={labelClass}>Confirmar Contraseña</label>
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="Repita la contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>
              
              <div className="pt-3">
                <Button
                  className="w-full h-12 text-base font-semibold rounded-xl"
                  size="lg"
                  type="submit"
                  disabled={loading || !isPasswordStrong(newPassword)}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin size-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Restableciendo...
                    </span>
                  ) : (
                    "Cambiar Contraseña"
                  )}
                </Button>
              </div>
            </motion.form>
          )}

          {step === 1 && !token && !success && (
            <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex gap-2 mb-6 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl"
              >
                <button
                  type="button"
                  onClick={() => setRecoveryMethod('email')}
                  className={`flex-1 py-2.5 px-4 text-sm font-medium rounded-lg transition-all duration-200 ${
                    recoveryMethod === 'email'
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  Por Correo
                </button>
                <button
                  type="button"
                  onClick={() => setRecoveryMethod('questions')}
                  className={`flex-1 py-2.5 px-4 text-sm font-medium rounded-lg transition-all duration-200 ${
                    recoveryMethod === 'questions'
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  Por Preguntas
                </button>
              </motion.div>

              {recoveryMethod === 'email' && (
                <motion.form
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleEmailSubmit}
                  className="space-y-5"
                >
                  <div>
                    <label htmlFor="userCi" className={labelClass}>Cédula de Identidad</label>
                    <input
                      id="userCi"
                      type="text"
                      placeholder="V00.000.000"
                      value={displayCi}
                      onChange={handleCiChange}
                      required
                      maxLength={12}
                      className={`${inputClass} tracking-widest`}
                    />
                    <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                      Se enviará un enlace de recuperación al correo registrado.
                    </p>
                  </div>
                  
                  <div className="pt-3">
                    <Button
                      className="w-full h-12 text-base font-semibold rounded-xl"
                      size="lg"
                      type="submit"
                      disabled={loading}
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="animate-spin size-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Enviando...
                        </span>
                      ) : (
                        "Enviar enlace al correo"
                      )}
                    </Button>
                  </div>
                </motion.form>
              )}

              {recoveryMethod === 'questions' && (
                <motion.form
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleQuestionsSubmit}
                  className="space-y-5"
                >
                  <div>
                    <label htmlFor="userCiQuestions" className={labelClass}>Cédula de Identidad</label>
                    <input
                      id="userCiQuestions"
                      type="text"
                      placeholder="V00.000.000"
                      value={displayCi}
                      onChange={handleCiChange}
                      required
                      maxLength={12}
                      className={`${inputClass} tracking-widest`}
                    />
                    <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                      Deberás responder tus preguntas de seguridad configuradas.
                    </p>
                  </div>
                  
                  <div className="pt-3">
                    <Button
                      className="w-full h-12 text-base font-semibold rounded-xl"
                      size="lg"
                      type="submit"
                      disabled={loading}
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
                        "Continuar"
                      )}
                    </Button>
                  </div>
                </motion.form>
              )}
            </>
          )}

          {step === 2 && securityQuestions.length > 0 && (
            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              onSubmit={handleVerifyAnswers}
              className="space-y-5"
            >
              <div className="p-4 bg-brand-50 dark:bg-brand-500/10 border border-brand-100 dark:border-brand-500/20 rounded-xl">
                <div className="flex items-center gap-2">
                  <svg className="size-5 text-brand-600 dark:text-brand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-sm font-medium text-brand-700 dark:text-brand-300">
                    Responde las 3 preguntas de seguridad para continuar.
                  </p>
                </div>
              </div>

              {securityQuestions.map((q, index) => (
                <motion.div
                  key={q.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                >
                  <label htmlFor={`question-${q.id}`} className={labelClass}>
                    {index + 1}. {q.questionText}
                  </label>
                  <input
                    id={`question-${q.id}`}
                    type="text"
                    placeholder="Tu respuesta..."
                    value={securityAnswers[q.id] || ''}
                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                    required
                    className={inputClass}
                  />
                </motion.div>
              ))}

              <div>
                <label htmlFor="newPasswordQuestions" className={labelClass}>Nueva Contraseña</label>
                <div className="relative">
                  <input
                    id="newPasswordQuestions"
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 12 caracteres"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className={`${inputClass} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    {showPassword ? <EyeIcon className="size-5" /> : <EyeClosedIcon className="size-5" />}
                  </button>
                </div>
                {renderPasswordStrength(newPassword)}
              </div>

              <div>
                <label htmlFor="confirmPasswordQuestions" className={labelClass}>Confirmar Contraseña</label>
                <input
                  id="confirmPasswordQuestions"
                  type="password"
                  placeholder="Repita la contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className={inputClass}
                />
              </div>

              <div className="flex gap-3 pt-3">
                <Button 
                  variant="outline" 
                  className="flex-1 h-12 rounded-xl" 
                  type="button"
                  onClick={() => { setStep(1); setSecurityQuestions([]); setSecurityAnswers({}); }}
                >
                  Atrás
                </Button>
                <Button 
                  className="flex-1 h-12 text-base font-semibold rounded-xl" 
                  size="lg"
                  type="submit" 
                  disabled={loading || !isPasswordStrong(newPassword)}
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
                    "Restablecer"
                  )}
                </Button>
              </div>
            </motion.form>
          )}
        </div>
      </AuthLayout>
    </>
  );
}
