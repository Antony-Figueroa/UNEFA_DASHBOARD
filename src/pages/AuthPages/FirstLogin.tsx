import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import * as authService from "../../features/auth/services/authService";
import { SecurityQuestion, SecurityAnswer } from "../../features/auth/services/authService";
import { EyeCloseIcon, EyeIcon } from "../../icons";
import Select from "../../components/form/Select";

export default function FirstLogin() {
  const location = useLocation();
  const navigate = useNavigate();
  const [userId, setUserId] = useState<number | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [presetQuestions, setPresetQuestions] = useState<SecurityQuestion[]>([]);
  const [userQuestions, setUserQuestions] = useState<SecurityAnswer[]>([
    { questionId: 0, answer: "" },
    { questionId: 0, answer: "" },
    { questionId: 0, answer: "" },
  ]);

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 12) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[!@#$%^&*()_+~`|}{[\]:;?><,./\-=]/.test(password)) strength += 1;
    return strength;
  };

  const strength = getPasswordStrength(newPassword);
  const strengthColor = strength <= 2 ? "bg-red-500" : strength <= 4 ? "bg-yellow-500" : "bg-green-500";
  const strengthText = strength <= 2 ? "Débil" : strength <= 4 ? "Media" : "Fuerte";

  useEffect(() => {
    if (location.state?.userId) {
      setUserId(location.state.userId);
    } else {
      navigate("/signin");
    }

    const fetchQuestions = async () => {
      try {
        const data = await authService.getPresetQuestions();
        if (data.success) {
          setPresetQuestions(data.questions);
        }
      } catch (err) {
        console.error("Error fetching questions:", err);
      }
    };
    fetchQuestions();
  }, [location, navigate]);

  const handleQuestionChange = (index: number, field: string, value: string) => {
    const newQuestions = [...userQuestions];
    if (field === "questionId") {
      newQuestions[index] = { ...newQuestions[index], questionId: parseInt(value) || 0 };
    } else {
      newQuestions[index] = { ...newQuestions[index], answer: value };
    }
    setUserQuestions(newQuestions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    if (newPassword.length < 12) {
      setError("La contraseña debe tener al menos 12 caracteres");
      return;
    }

    const hasUpperCase = /[A-Z]/.test(newPassword);
    const hasLowerCase = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecial = /[!@#$%^&*()_+~`|}{[\]:;?><,./\-=]/.test(newPassword);

    if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecial) {
      setError("La contraseña debe contener mayúsculas, minúsculas, números y caracteres especiales");
      return;
    }

    const hasEmptyQuestion = userQuestions.some(q => !q.questionId || !q.answer);
    if (hasEmptyQuestion) {
      setError("Debe seleccionar y responder todas las preguntas de seguridad");
      return;
    }

    setLoading(true);
    try {
      const result = await authService.changePassword(userId!, newPassword, userQuestions);
      if (result.success) {
        navigate("/signin", { state: { message: "Contraseña actualizada. Inicie sesión con su nueva clave." } });
      } else {
        setError(result.message || "Error al actualizar la contraseña");
      }
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      const errorMessage = axiosError.response?.data?.message || (err as Error).message || "Error al actualizar la contraseña";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageMeta title="Primer Ingreso | SIGP - UNEFA" description="Configuración de seguridad para el primer ingreso al sistema" />
      <AuthLayout>
        <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
          <div className="mb-8">
            <h1 className="mb-2 font-semibold text-text-emphasis text-title-sm dark:text-text-emphasis">
              Primer Ingreso
            </h1>
            <p className="text-sm text-text-secondary dark:text-text-tertiary">
              Por seguridad, debe cambiar su contraseña temporal y configurar sus preguntas de seguridad.
            </p>
          </div>

          {error && (
            <div className="p-3 mb-4 text-sm text-red-500 bg-red-100 rounded-lg dark:bg-red-500/10" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              <div>
                <Label htmlFor="newPassword">Nueva Contraseña <span className="text-error-500">*</span></Label>
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

                {newPassword && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-text-secondary">Fortaleza: {strengthText}</span>
                      <span className="text-xs text-text-secondary">{Math.min(strength * 20, 100)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-200 rounded-full dark:bg-gray-700 overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${strengthColor}`} 
                        style={{ width: `${(strength / 5) * 100}%` }}
                      ></div>
                    </div>
                    <ul className="mt-2 space-y-1">
                      <li className={`text-[10px] flex items-center gap-1 ${newPassword.length >= 12 ? 'text-green-500' : 'text-text-tertiary'}`}>
                        {newPassword.length >= 12 ? '✓' : '○'} Mínimo 12 caracteres
                      </li>
                      <li className={`text-[10px] flex items-center gap-1 ${/[A-Z]/.test(newPassword) ? 'text-green-500' : 'text-text-tertiary'}`}>
                        {/[A-Z]/.test(newPassword) ? '✓' : '○'} Una mayúscula
                      </li>
                      <li className={`text-[10px] flex items-center gap-1 ${/[a-z]/.test(newPassword) ? 'text-green-500' : 'text-text-tertiary'}`}>
                        {/[a-z]/.test(newPassword) ? '✓' : '○'} Una minúscula
                      </li>
                      <li className={`text-[10px] flex items-center gap-1 ${/[0-9]/.test(newPassword) ? 'text-green-500' : 'text-text-tertiary'}`}>
                        {/[0-9]/.test(newPassword) ? '✓' : '○'} Un número
                      </li>
                      <li className={`text-[10px] flex items-center gap-1 ${/[!@#$%^&*()_+~`|}{[\]:;?><,./\-=]/.test(newPassword) ? 'text-green-500' : 'text-text-tertiary'}`}>
                        {/[!@#$%^&*()_+~`|}{[\]:;?><,./\-=]/.test(newPassword) ? '✓' : '○'} Un carácter especial
                      </li>
                    </ul>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirmar Contraseña <span className="text-error-500">*</span></Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Repita su nueva contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <h2 className="mb-4 text-sm font-semibold text-text-emphasis">Preguntas de Seguridad</h2>
                {userQuestions.map((q, index) => (
                  <div key={index} className="mb-4 space-y-2">
                    <Label>Pregunta {index + 1}</Label>
                    <Select
                      options={presetQuestions.map(pq => ({ value: pq.id.toString(), label: pq.description }))}
                      placeholder="Seleccione una pregunta"
                      value={q.questionId ? q.questionId.toString() : ""}
                      onChange={(value) => handleQuestionChange(index, "questionId", value)}
                    />
                    <Input
                      placeholder="Su respuesta"
                      value={q.answer}
                      onChange={(e) => handleQuestionChange(index, "answer", e.target.value)}
                      required
                    />
                  </div>
                ))}
              </div>

              <Button className="w-full" size="md" type="submit" disabled={loading}>
                {loading ? "Guardando..." : "Finalizar Configuración"}
              </Button>
            </div>
          </form>
        </div>
      </AuthLayout>
    </>
  );
}
