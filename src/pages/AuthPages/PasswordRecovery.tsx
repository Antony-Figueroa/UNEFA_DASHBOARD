import { useState } from "react";
import { Link, useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import * as authService from "../../features/auth/services/authService";
import { SecurityQuestion, SecurityAnswer } from "../../features/auth/services/authService";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "../../icons";

export default function PasswordRecovery() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: CI, 2: Questions, 3: New Password
  const [userCi, setUserCi] = useState("");
  const [userId, setUserId] = useState<number | null>(null);
  const [questions, setQuestions] = useState<SecurityQuestion[]>([]);
  const [answers, setAnswers] = useState<SecurityAnswer[]>([]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await authService.getSecurityQuestions(userCi);
      if (result.success) {
        setUserId(result.userId);
        setQuestions(result.questions);
        setAnswers(result.questions.map((q) => ({ questionId: q.id, answer: "" })));
        setStep(2);
      } else {
        setError(result.message || "Error al buscar el usuario");
      }
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      const errorMessage = axiosError.response?.data?.message || (err as Error).message || "Error al buscar el usuario";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await authService.verifySecurityQuestions(userId!, answers);
      if (result.success) {
        setStep(3);
      } else {
        setError(result.message || "Error al verificar respuestas");
      }
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      const errorMessage = axiosError.response?.data?.message || (err as Error).message || "Error al verificar respuestas";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await authService.resetPassword(userId!, newPassword);
      if (result.success) {
        navigate("/signin", { state: { message: "Contraseña recuperada. Ya puede iniciar sesión." } });
      } else {
        setError(result.message || "Error al restablecer contraseña");
      }
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      const errorMessage = axiosError.response?.data?.message || (err as Error).message || "Error al restablecer contraseña";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (index: number, value: string) => {
    const newAnswers = [...answers];
    newAnswers[index].answer = value;
    setAnswers(newAnswers);
  };

  return (
    <>
      <PageMeta title="Recuperar Contraseña | SIGP - UNEFA" description="Recuperación de contraseña mediante preguntas de seguridad" />
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
                {step === 1 && "Ingrese su número de cédula para comenzar."}
                {step === 2 && "Responda sus preguntas de seguridad correctamente."}
                {step === 3 && "Cree una nueva contraseña segura."}
              </p>
            </div>

            {error && (
              <div className="p-3 mb-4 text-sm text-red-500 bg-red-100 rounded-lg dark:bg-red-500/10" role="alert">
                {error}
              </div>
            )}

            {step === 1 && (
              <form onSubmit={handleCiSubmit}>
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="userCi">Cédula</Label>
                    <Input
                      id="userCi"
                      type="text"
                      placeholder="Ej: 12345678"
                      value={userCi}
                      onChange={(e) => setUserCi(e.target.value)}
                      required
                    />
                  </div>
                  <Button className="w-full" size="md" type="submit" disabled={loading}>
                    {loading ? "Buscando..." : "Continuar"}
                  </Button>
                </div>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleQuestionsSubmit}>
                <div className="space-y-6">
                  {questions.map((q, index) => (
                    <div key={q.id}>
                      <Label>{q.description}</Label>
                      <Input
                        placeholder="Su respuesta"
                        value={answers[index].answer}
                        onChange={(e) => handleAnswerChange(index, e.target.value)}
                        required
                      />
                    </div>
                  ))}
                  <Button className="w-full" size="md" type="submit" disabled={loading}>
                    {loading ? "Verificando..." : "Verificar Respuestas"}
                  </Button>
                </div>
              </form>
            )}

            {step === 3 && (
              <form onSubmit={handlePasswordSubmit}>
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="newPassword">Nueva Contraseña</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="Mínimo 8 caracteres"
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
                  <Button className="w-full" size="md" type="submit" disabled={loading}>
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
