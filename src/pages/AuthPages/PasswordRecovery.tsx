import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { motion } from "framer-motion";
import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import Button from "../../components/ui/button/Button";
import * as authService from "../../features/auth/services/authService";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import { useToast } from "../../context/toast";

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
           /[0-9]/.test(pass) && 
           /[^A-Za-z0-9]/.test(pass);
  };

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
        setSecurityQuestions(result.questions);
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
      const answers = Object.entries(securityAnswers).map(([questionId, answer]) => ({
        questionId: Number(questionId),
        answer
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
            <div className="mb-6">
              <h1 className="mb-2 font-semibold text-text-emphasis text-title-sm">
                Recuperar Contraseña
              </h1>
              <p className="text-sm text-text-secondary">{getStepDescription()}</p>
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

            {step === 3 && token && (
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

            {step === 1 && !token && !success && (
              <>
                <div className="flex gap-2 mb-6 p-1 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setRecoveryMethod('email')}
                    className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                      recoveryMethod === 'email'
                        ? 'bg-white dark:bg-gray-700 text-text-emphasis shadow'
                        : 'text-text-secondary hover:text-text-emphasis'
                    }`}
                  >
                    Por Correo
                  </button>
                  <button
                    type="button"
                    onClick={() => setRecoveryMethod('questions')}
                    className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                      recoveryMethod === 'questions'
                        ? 'bg-white dark:bg-gray-700 text-text-emphasis shadow'
                        : 'text-text-secondary hover:text-text-emphasis'
                    }`}
                  >
                    Por Preguntas
                  </button>
                </div>

                {recoveryMethod === 'email' && (
                  <form onSubmit={handleEmailSubmit}>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="userCi">Cédula</Label>
                        <Input
                          id="userCi"
                          type="text"
                          placeholder="Ingrese su número de cédula"
                          value={userCi}
                          onChange={(e) => setUserCi(e.target.value)}
                          required
                        />
                        <p className="mt-1 text-xs text-text-tertiary">
                          Se enviará un enlace de recuperación al correo registrado.
                        </p>
                      </div>
                      <Button className="w-full" size="md" type="submit" disabled={loading}>
                        {loading ? "Enviando..." : "Enviar enlace al correo"}
                      </Button>
                    </div>
                  </form>
                )}

                {recoveryMethod === 'questions' && (
                  <form onSubmit={handleQuestionsSubmit}>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="userCiQuestions">Cédula</Label>
                        <Input
                          id="userCiQuestions"
                          type="text"
                          placeholder="Ingrese su número de cédula"
                          value={userCi}
                          onChange={(e) => setUserCi(e.target.value)}
                          required
                        />
                        <p className="mt-1 text-xs text-text-tertiary">
                          Deberá responder sus preguntas de seguridad configuradas.
                        </p>
                      </div>
                      <Button className="w-full" size="md" type="submit" disabled={loading}>
                        {loading ? "Verificando..." : "Continuar"}
                      </Button>
                    </div>
                  </form>
                )}
              </>
            )}

            {step === 2 && securityQuestions.length > 0 && (
              <form onSubmit={handleVerifyAnswers}>
                <div className="space-y-6">
                  <div className="p-3 bg-brand-50 dark:bg-brand-500/10 rounded-lg">
                    <p className="text-xs text-brand-600 dark:text-brand-400">
                      Responde las 3 preguntas de seguridad para continuar.
                    </p>
                  </div>

                  {securityQuestions.map((q, index) => (
                    <div key={q.id}>
                      <Label htmlFor={`question-${q.id}`}>
                        {index + 1}. {q.questionText}
                      </Label>
                      <Input
                        id={`question-${q.id}`}
                        type="text"
                        placeholder="Tu respuesta..."
                        value={securityAnswers[q.id] || ''}
                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                        required
                      />
                    </div>
                  ))}

                  <div>
                    <Label htmlFor="newPasswordQuestions">Nueva Contraseña</Label>
                    <div className="relative">
                      <Input
                        id="newPasswordQuestions"
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
                    <Label htmlFor="confirmPasswordQuestions">Confirmar Contraseña</Label>
                    <Input
                      id="confirmPasswordQuestions"
                      type="password"
                      placeholder="Repita la contraseña"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>

                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      className="flex-1" 
                      type="button"
                      onClick={() => { setStep(1); setSecurityQuestions([]); setSecurityAnswers({}); }}
                    >
                      Atrás
                    </Button>
                    <Button 
                      className="flex-1" 
                      size="md" 
                      type="submit" 
                      disabled={loading || !isPasswordStrong(newPassword)}
                    >
                      {loading ? "Verificando..." : "Restablecer"}
                    </Button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </AuthLayout>
    </>
  );
}
