import { useState, useEffect } from "react";
import { useAuth } from "../../context/auth";
import { useModal } from "../../hooks/useModal";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../ui/modal";
import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import * as authService from "../../features/auth/services/authService";
import { securityQuestionsService, PresetQuestion } from "../../features/security-questions/services/securityQuestionsService";
import { useToast } from "../../context/toast";
import UnifiedDialog from "../ui/dialog/UnifiedDialog";
import { EyeCloseIcon, EyeIcon } from "../../icons";

interface QuestionForm {
  questionType: 'PRESET' | 'CUSTOM';
  presetQuestionId: number | null;
  customQuestion: string;
  answer: string;
}

export default function UserPasswordCard() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const { isOpen, openModal, closeModal } = useModal();
  const { isOpen: isQuestionsOpen, openModal: openQuestionsModal, closeModal: closeQuestionsModal } = useModal();
  const [loading, setLoading] = useState(false);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [hasSecurityQuestions, setHasSecurityQuestions] = useState(false);

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

  const [presetQuestions, setPresetQuestions] = useState<PresetQuestion[]>([]);
  const [questions, setQuestions] = useState<QuestionForm[]>([
    { questionType: 'PRESET', presetQuestionId: null, customQuestion: '', answer: '' },
    { questionType: 'PRESET', presetQuestionId: null, customQuestion: '', answer: '' },
    { questionType: 'PRESET', presetQuestionId: null, customQuestion: '', answer: '' }
  ]);

  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant: "info" | "warning" | "error" | "success" | "confirm";
  } | null>(null);

  useEffect(() => {
    const fetchSecurityStatus = async () => {
      try {
        const result = await securityQuestionsService.getUserQuestions();
        setHasSecurityQuestions(result.hasQuestions);
      } catch (error) {
        console.error('Error checking security questions:', error);
      }
    };
    fetchSecurityStatus();
  }, []);

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

  const handleOpenQuestionsModal = async () => {
    setQuestionsLoading(true);
    openQuestionsModal();
    try {
      const [presetResult, userResult] = await Promise.all([
        securityQuestionsService.getPresetQuestions(),
        securityQuestionsService.getUserQuestions()
      ]);
      
      setPresetQuestions(presetResult);
      
      if (userResult.questions.length > 0) {
        setQuestions(userResult.questions.map(q => ({
          questionType: q.QUESTION_TYPE,
          presetQuestionId: q.PRESET_QUESTION_ID,
          customQuestion: q.CUSTOM_QUESTION || '',
          answer: ''
        })));
      }
    } catch (error) {
      console.error('Error loading questions:', error);
      addToast({ variant: "error", title: "Error", message: "No se pudieron cargar las preguntas" });
    } finally {
      setQuestionsLoading(false);
    }
  };

  const handleQuestionChange = (index: number, field: keyof QuestionForm, value: string | number | null) => {
    setQuestions(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleQuestionTypeChange = (index: number, type: 'PRESET' | 'CUSTOM') => {
    setQuestions(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        questionType: type,
        presetQuestionId: type === 'PRESET' ? null : null,
        customQuestion: type === 'CUSTOM' ? '' : ''
      };
      return updated;
    });
  };

  const validateQuestions = () => {
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.answer || q.answer.trim().length < 2) {
        addToast({ variant: "error", title: "Error", message: `La respuesta ${i + 1} debe tener al menos 2 caracteres` });
        return false;
      }
      if (q.questionType === 'PRESET' && !q.presetQuestionId) {
        addToast({ variant: "error", title: "Error", message: `Seleccione una pregunta para la pregunta ${i + 1}` });
        return false;
      }
      if (q.questionType === 'CUSTOM' && !q.customQuestion?.trim()) {
        addToast({ variant: "error", title: "Error", message: `Escriba una pregunta personalizada para la pregunta ${i + 1}` });
        return false;
      }
    }

    const selectedIds = questions.filter(q => q.questionType === 'PRESET').map(q => q.presetQuestionId);
    const uniqueIds = new Set(selectedIds.filter(Boolean));
    if (uniqueIds.size !== selectedIds.filter(Boolean).length) {
      addToast({ variant: "error", title: "Error", message: "No puede seleccionar la misma pregunta más de una vez" });
      return false;
    }

    return true;
  };

  const handleSaveQuestions = async () => {
    if (!validateQuestions()) return;

    setConfirmDialog({
      isOpen: true,
      title: "Guardar Preguntas",
      message: "¿Está seguro de guardar estas preguntas de seguridad? Si ya tenía preguntas configuradas, serán reemplazadas.",
      variant: "info",
      onConfirm: async () => {
        setConfirmDialog(null);
        setQuestionsLoading(true);
        try {
          await securityQuestionsService.saveUserQuestions(questions.map(q => ({
            questionType: q.questionType,
            presetQuestionId: q.presetQuestionId || undefined,
            customQuestion: q.customQuestion || undefined,
            answer: q.answer
          })));
          
          addToast({ variant: "success", title: "Éxito", message: "Preguntas de seguridad guardadas correctamente" });
          setHasSecurityQuestions(true);
          closeQuestionsModal();
        } catch (error) {
          console.error('Error saving questions:', error);
          addToast({ variant: "error", title: "Error", message: "No se pudieron guardar las preguntas" });
        } finally {
          setQuestionsLoading(false);
        }
      }
    });
  };

  return (
    <>
      <div className="p-5 border border-border-light rounded-2xl dark:border-white/10 lg:p-6 bg-white dark:bg-bg-dark">
        <div className="flex items-start justify-between gap-4 mb-5">
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

        <div className="border-t border-border-light dark:border-white/10 pt-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-warning-50 dark:bg-warning-500/10">
                <svg className="w-5 h-5 text-warning-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h5 className="text-sm font-semibold text-text-emphasis dark:text-white">
                  Preguntas de Seguridad
                </h5>
                <p className="text-xs text-text-secondary dark:text-text-tertiary">
                  {hasSecurityQuestions 
                    ? "Preguntas configuradas para recuperación de cuenta"
                    : "Configura preguntas para recuperar tu cuenta"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {hasSecurityQuestions && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-success-50 dark:bg-success-500/10 text-success-600 dark:text-success-400">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Activas
                </span>
              )}
              <button
                onClick={handleOpenQuestionsModal}
                className="shrink-0 inline-flex items-center gap-2 rounded-lg border border-border-medium bg-white dark:bg-white/5 px-3 py-1.5 text-xs font-medium text-text-primary dark:text-text-secondary hover:bg-gray-50 dark:hover:bg-white/10 transition-colors"
              >
                {hasSecurityQuestions ? "Editar" : "Configurar"}
              </button>
            </div>
          </div>
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

      <Modal isOpen={isQuestionsOpen} onClose={closeQuestionsModal} className="max-w-xl">
        <ModalHeader>
          Preguntas de Seguridad
        </ModalHeader>
        
        <ModalBody>
          {questionsLoading ? (
            <div className="py-8 text-center text-text-tertiary">Cargando...</div>
          ) : (
            <div className="space-y-5">
              <p className="text-sm text-text-secondary dark:text-text-tertiary">
                Configura al menos 3 preguntas de seguridad. Estas te ayudarán a recuperar tu cuenta si olvidas tu contraseña.
              </p>

              {questions.map((q, index) => (
                <div key={index} className="p-4 rounded-xl bg-gray-50 dark:bg-white/5 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-100 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 text-xs font-bold">
                      {index + 1}
                    </span>
                    <span className="text-sm font-medium text-text-primary dark:text-white">Pregunta {index + 1}</span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleQuestionTypeChange(index, 'PRESET')}
                      className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                        q.questionType === 'PRESET'
                          ? 'bg-brand-500 text-white'
                          : 'bg-white dark:bg-white/10 text-text-secondary dark:text-text-tertiary border border-border-light dark:border-white/10'
                      }`}
                    >
                      Predefinida
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuestionTypeChange(index, 'CUSTOM')}
                      className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                        q.questionType === 'CUSTOM'
                          ? 'bg-brand-500 text-white'
                          : 'bg-white dark:bg-white/10 text-text-secondary dark:text-text-tertiary border border-border-light dark:border-white/10'
                      }`}
                    >
                      Personalizada
                    </button>
                  </div>

                  {q.questionType === 'PRESET' ? (
                    <select
                      value={q.presetQuestionId || ''}
                      onChange={(e) => handleQuestionChange(index, 'presetQuestionId', Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-border-light dark:border-white/10 bg-white dark:bg-white/5 text-text-primary dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    >
                      <option value="">Seleccionar pregunta...</option>
                      {presetQuestions.map(pq => (
                        <option key={pq.PRESET_QUESTION_ID} value={pq.PRESET_QUESTION_ID}>
                          {pq.DESCRIPTION}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      value={q.customQuestion}
                      onChange={(e) => handleQuestionChange(index, 'customQuestion', e.target.value)}
                      placeholder="Escribe tu pregunta personalizada..."
                      className="text-sm"
                    />
                  )}

                  <div>
                    <Label className="text-xs text-text-secondary">Respuesta</Label>
                    <Input
                      value={q.answer}
                      onChange={(e) => handleQuestionChange(index, 'answer', e.target.value)}
                      placeholder="Tu respuesta..."
                      className="mt-1 text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </ModalBody>

        <ModalFooter className="pt-2!">
          <Button variant="outline" onClick={closeQuestionsModal} disabled={questionsLoading}>Cancelar</Button>
          <Button 
            onClick={handleSaveQuestions} 
            disabled={questionsLoading}
          >
            {questionsLoading ? "Guardando..." : "Guardar Preguntas"}
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
