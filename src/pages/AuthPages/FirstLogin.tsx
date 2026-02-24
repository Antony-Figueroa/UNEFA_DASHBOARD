import { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";
import * as authService from "../../features/auth/services/authService";
import { SecurityQuestion } from "../../features/auth/types";
import { EyeClosedIcon, EyeIcon, ShieldCheckIcon, UserIcon, LockIcon, KeyRoundIcon, CheckCircleIcon, XCircleIcon, ChevronRightIcon } from "lucide-react";
import CustomSelect from "../../components/form/CustomSelect";
import { useToast } from "../../context/toast";
import { firstLoginSchema, FirstLoginFormData } from "../../features/auth/constants/firstLoginValidation";
import apiClient from "../../api/apiClient";

const steps = [
  { id: 1, title: "Datos Personales", icon: UserIcon },
  { id: 2, title: "Seguridad", icon: LockIcon },
  { id: 3, title: "Preguntas", icon: KeyRoundIcon },
];

const DEFAULT_PHONE_PREFIX_OPTIONS = [
  { value: "0412", label: "0412" },
  { value: "0414", label: "0414" },
  { value: "0416", label: "0416" },
  { value: "0424", label: "0424" },
  { value: "0426", label: "0426" },
  { value: "0212", label: "0212" },
  { value: "0234", label: "0234" },
  { value: "0251", label: "0251" },
  { value: "0252", label: "0252" },
  { value: "0253", label: "0253" },
];

export default function FirstLogin() {
  const { addToast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [userId, setUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [presetQuestions, setPresetQuestions] = useState<SecurityQuestion[]>([]);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [phonePrefixOptions, setPhonePrefixOptions] = useState<{ value: string; label: string }[]>(DEFAULT_PHONE_PREFIX_OPTIONS);

  useEffect(() => {
    const fetchPhonePrefixes = async () => {
      try {
        const response = await apiClient.get('/public/phone-prefixes');
        if (response.data && Array.isArray(response.data)) {
          const options = response.data.map((item: { value: string; label: string }) => ({
            value: item.value,
            label: item.label
          }));
          setPhonePrefixOptions(options);
        }
      } catch (error) {
        // Silently use default prefixes on error
      }
    };
    fetchPhonePrefixes();
  }, []);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    trigger,
    formState: { errors, isValid }
  } = useForm<FirstLoginFormData>({
    resolver: zodResolver(firstLoginSchema),
    mode: "all",
    defaultValues: {
      firstName: "",
      middleName: "",
      lastName: "",
      secondLastName: "",
      phonePrefix: "",
      phoneNumber: "",
      email: "",
      newPassword: "",
      confirmPassword: "",
      acceptTerms: false,
      securityQuestions: [
        { questionId: "", answer: "", customQuestion: "", isCustom: false },
        { questionId: "", answer: "", customQuestion: "", isCustom: false },
        { questionId: "", answer: "", customQuestion: "", isCustom: false }
      ]
    }
  });

  const { fields } = useFieldArray({
    control,
    name: "securityQuestions"
  });

  const newPassword = watch("newPassword");
  const confirmPassword = watch("confirmPassword");
  const securityQuestions = watch("securityQuestions");
  const acceptTerms = watch("acceptTerms");

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 12) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[!@#$%^&*()_+~`|}{[\]:;?><,./\-=]/.test(password)) strength += 1;
    return strength;
  };

  const strength = useMemo(() => getPasswordStrength(newPassword), [newPassword]);
  const strengthColor = strength <= 2 ? "bg-red-500" : strength <= 4 ? "bg-yellow-500" : "bg-green-500";
  const strengthText = strength <= 2 ? "Débil" : strength <= 4 ? "Media" : "Fuerte";
  const strengthPercent = (strength / 5) * 100;

  const passwordRequirements = useMemo(() => [
    { met: newPassword.length >= 12, text: "Mínimo 12 caracteres" },
    { met: /[A-Z]/.test(newPassword), text: "Una mayúscula" },
    { met: /[a-z]/.test(newPassword), text: "Una minúscula" },
    { met: /[0-9]/.test(newPassword), text: "Un número" },
    { met: /[!@#$%^&*()_+~`|}{[\]:;?><,./\-=]/.test(newPassword), text: "Un carácter especial" }
  ], [newPassword]);

  const passwordsMatch = confirmPassword.length > 0 && newPassword === confirmPassword;

  useEffect(() => {
    if (location.state?.userId) {
      setUserId(location.state.userId);
    } else {
      navigate("/signin");
    }

    const fetchData = async () => {
      try {
        const questionsData = await authService.getPresetQuestions();
        
        if (questionsData.success) {
          setPresetQuestions(questionsData.questions);
        }
      } catch (err) {
        console.error("[FirstLogin] Error fetching questions:", err);
      }
    };
    fetchData();
  }, [location, navigate]);

  const getQuestionOptions = (currentIndex: number) => {
    const selectedIds = securityQuestions
      .filter((_, idx) => idx !== currentIndex)
      .filter(q => q.questionId && typeof q.questionId === 'string' && q.questionId !== "")
      .map(q => typeof q.questionId === 'string' ? parseInt(q.questionId) : q.questionId)
      .filter(id => !isNaN(id));

    return presetQuestions
      .filter(pq => !selectedIds.includes(pq.id))
      .map(pq => ({ value: pq.id.toString(), label: pq.description }));
  };

  const onSubmit = async (data: FirstLoginFormData) => {
    setLoading(true);
    try {
      const profileData = {
        name: data.firstName.toUpperCase(),
        secondName: data.middleName?.toUpperCase() || "",
        surname: data.lastName.toUpperCase(),
        secondSurname: data.secondLastName?.toUpperCase() || "",
        phoneNumber: `${data.phonePrefix}${data.phoneNumber}`,
        email: data.email.toUpperCase()
      };

      const formattedQuestions = data.securityQuestions
        .filter(q => !q.isCustom && q.questionId)
        .map(q => ({
          questionId: typeof q.questionId === 'string' ? parseInt(q.questionId) : q.questionId,
          answer: q.answer.toUpperCase(),
          isCustom: false
        }));

      const result = await authService.changePassword(
        userId!,
        data.newPassword,
        formattedQuestions,
        profileData
      );
      
      if (result.success) {
        addToast({
          variant: "success",
          title: "Configuración Finalizada",
          message: "Su cuenta ha sido configurada exitosamente."
        });
        navigate("/signin");
      } else {
        addToast({
          variant: "error",
          title: "Error de Configuración",
          message: result.message || "No se pudo completar la configuración."
        });
      }
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      const errorMessage = axiosError.response?.data?.message || (err as Error).message || "No se pudo establecer conexión con el servidor.";
      addToast({
        variant: "error",
        title: "Error de Conexión",
        message: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFirstNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s']/g, '');
    setValue("firstName", val, { shouldValidate: true });
  };

  const handleMiddleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s']/g, '');
    setValue("middleName", val, { shouldValidate: true });
  };

  const handleLastNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s']/g, '');
    setValue("lastName", val, { shouldValidate: true });
  };

  const handleSecondLastNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s']/g, '');
    setValue("secondLastName", val, { shouldValidate: true });
  };

  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').substring(0, 7);
    setValue("phoneNumber", val, { shouldValidate: true });
  };

  return (
    <>
      <PageMeta title="Primer Ingreso | SIGP - UNEFA" description="Configuración de seguridad para el primer ingreso al sistema" />
      <AuthLayout>
        <div className="flex flex-col justify-center flex-1 w-full max-w-2xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center justify-center mb-6">
              <div className="flex items-center">
                {steps.map((step, idx) => {
                  const Icon = step.icon;
                  const isActive = currentStep >= step.id;
                  const isCurrent = currentStep === step.id;
                  return (
                    <div key={step.id} className="flex items-center">
                      <div 
                        className={`
                          flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 cursor-pointer
                          ${isActive 
                            ? 'border-brand-500 bg-brand-500 text-white' 
                            : 'border-gray-300 dark:border-gray-600 text-gray-400'}
                          ${isCurrent ? 'ring-4 ring-brand-500/20' : ''}
                        `}
                        onClick={() => setCurrentStep(step.id)}
                      >
                        {isActive ? <CheckCircleIcon className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                      </div>
                      {idx < steps.length - 1 && (
                        <div className={`w-12 h-0.5 mx-2 ${isActive ? 'bg-brand-500' : 'bg-gray-300 dark:bg-gray-600'}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            
            <h1 className="mb-2 text-2xl font-bold text-center text-text-emphasis dark:text-white">
              Configuración de Cuenta
            </h1>
            <p className="text-sm text-center text-text-secondary dark:text-text-tertiary">
              Complete los siguientes pasos para activar su cuenta en el sistema
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {currentStep === 1 && (
              <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-brand-500/10">
                    <UserIcon className="w-5 h-5 text-brand-500" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-text-emphasis dark:text-white">Información Personal</h2>
                    <p className="text-sm text-text-secondary dark:text-text-tertiary">Ingrese sus datos personales</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 gap-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-text-emphasis dark:text-gray-300">
                        Primer Nombre <span className="text-error-500">*</span>
                      </label>
                      <Input
                        {...register("firstName")}
                        placeholder="Ingrese su primer nombre"
                        error={!!errors.firstName}
                        hint={errors.firstName?.message}
                        onChange={handleFirstNameChange}
                        className="h-12 text-base"
                      />
                    </div>
                    
                    <div>
                      <label className="mb-2 block text-sm font-medium text-text-emphasis dark:text-gray-300">
                        Segundo Nombre
                      </label>
                      <Input
                        {...register("middleName")}
                        placeholder="Ingrese su segundo nombre"
                        error={!!errors.middleName}
                        hint={errors.middleName?.message}
                        onChange={handleMiddleNameChange}
                        className="h-12 text-base"
                      />
                    </div>
                    
                    <div>
                      <label className="mb-2 block text-sm font-medium text-text-emphasis dark:text-gray-300">
                        Primer Apellido <span className="text-error-500">*</span>
                      </label>
                      <Input
                        {...register("lastName")}
                        placeholder="Ingrese su primer apellido"
                        error={!!errors.lastName}
                        hint={errors.lastName?.message}
                        onChange={handleLastNameChange}
                        className="h-12 text-base"
                      />
                    </div>
                    
                    <div>
                      <label className="mb-2 block text-sm font-medium text-text-emphasis dark:text-gray-300">
                        Segundo Apellido
                      </label>
                      <Input
                        {...register("secondLastName")}
                        placeholder="Ingrese su segundo apellido"
                        error={!!errors.secondLastName}
                        hint={errors.secondLastName?.message}
                        onChange={handleSecondLastNameChange}
                        className="h-12 text-base"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-text-emphasis dark:text-gray-300">
                        Teléfono <span className="text-error-500">*</span>
                      </label>
                      <div className="flex gap-2">
                        <div className="w-[30%]">
                          <Controller
                            name="phonePrefix"
                            control={control}
                            render={({ field }) => (
                              <CustomSelect
                                options={phonePrefixOptions}
                                onChange={(val) => field.onChange(val)}
                                onBlur={field.onBlur}
                                value={field.value || ""}
                                placeholder="Prefijo"
                                error={!!errors.phonePrefix}
                              />
                            )}
                          />
                        </div>
                        <div className="flex-1">
                          <Input
                            {...register("phoneNumber")}
                            placeholder="Número"
                            error={!!errors.phoneNumber}
                            onChange={handlePhoneNumberChange}
                            className="h-12 text-base"
                          />
                        </div>
                      </div>
                      {(errors.phonePrefix || errors.phoneNumber) && (
                        <p className="mt-1 text-xs text-error-500">
                          {errors.phoneNumber?.message || errors.phonePrefix?.message}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <label className="mb-2 block text-sm font-medium text-text-emphasis dark:text-gray-300">
                        Correo Electrónico <span className="text-error-500">*</span>
                      </label>
                      <Input
                        {...register("email")}
                        type="email"
                        placeholder="correo@ejemplo.com"
                        error={!!errors.email}
                        className="h-12 text-base"
                        hint={errors.email?.message}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end mt-6">
                  <Button 
                    type="button"
                    onClick={async () => {
                      const valid = await trigger(["firstName", "lastName", "phonePrefix", "phoneNumber", "email"]);
                      if (valid) setCurrentStep(2);
                    }}
                    className="flex items-center gap-2"
                  >
                    Siguiente <ChevronRightIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-brand-500/10">
                    <LockIcon className="w-5 h-5 text-brand-500" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-text-emphasis dark:text-white">Seguridad</h2>
                    <p className="text-sm text-text-secondary dark:text-text-tertiary">Cree una contraseña segura</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <Label htmlFor="newPassword">
                      Nueva Contraseña <span className="text-error-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? "text" : "password"}
                        placeholder={showNewPassword ? "MÍNIMO 12 CARACTERES" : "Mínimo 12 caracteres"}
                        {...register("newPassword")}
                        error={!!errors.newPassword}
                        className="h-12 text-base"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute z-30 -translate-y-1/2 right-4 top-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showNewPassword ? <EyeIcon className="size-5" /> : <EyeClosedIcon className="size-5" />}
                      </button>
                    </div>
                    
                    {newPassword && (
                      <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-text-secondary">Fortaleza: {strengthText}</span>
                          <span className="text-xs text-text-secondary">{strengthPercent.toFixed(0)}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-300 ${strengthColor}`} 
                            style={{ width: `${strengthPercent}%` }}
                          ></div>
                        </div>
                        <div className="grid grid-cols-2 gap-1 mt-2">
                          {passwordRequirements.map((req, idx) => (
                            <div key={idx} className={`text-[10px] flex items-center gap-1 ${req.met ? 'text-green-600 dark:text-green-400' : 'text-text-tertiary'}`}>
                              {req.met ? <CheckCircleIcon className="w-3 h-3" /> : <XCircleIcon className="w-3 h-3" />} 
                              <span className="truncate">{req.text}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword">
                      Confirmar Contraseña <span className="text-error-500">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder={showConfirmPassword ? "REPITA SU CONTRASEÑA" : "Repita su contraseña"}
                        {...register("confirmPassword")}
                        error={!!errors.confirmPassword}
                        className="h-12 text-base"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute z-30 -translate-y-1/2 right-4 top-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? <EyeIcon className="size-5" /> : <EyeClosedIcon className="size-5" />}
                      </button>
                    </div>
                    {confirmPassword.length > 0 && (
                      <div className={`mt-2 text-xs flex items-center gap-1 ${passwordsMatch ? 'text-green-600 dark:text-green-400' : 'text-error-500'}`}>
                        {passwordsMatch ? <CheckCircleIcon className="w-4 h-4" /> : <XCircleIcon className="w-4 h-4" />}
                        {passwordsMatch ? "Las contraseñas coinciden" : "Las contraseñas no coinciden"}
                      </div>
                    )}
                    {errors.confirmPassword && (
                      <p className="mt-1 text-xs text-error-500">{errors.confirmPassword.message}</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-between mt-6">
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(1)}
                  >
                    Atrás
                  </Button>
                  <Button 
                    type="button"
                    onClick={async () => {
                      const valid = await trigger(["newPassword", "confirmPassword"]);
                      if (valid) setCurrentStep(3);
                    }}
                    className="flex items-center gap-2"
                  >
                    Siguiente <ChevronRightIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <>
                <div className="p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-brand-500/10">
                      <ShieldCheckIcon className="w-5 h-5 text-brand-500" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-text-emphasis dark:text-white">Preguntas de Seguridad</h2>
                      <p className="text-sm text-text-secondary dark:text-text-tertiary">Configure 3 preguntas para recuperar su cuenta</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    {fields.map((field, index) => {
                      const isCustom = securityQuestions[index]?.isCustom;
                      
                      return (
                        <div key={field.id} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50/50 dark:bg-gray-900/50">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-text-emphasis dark:text-gray-300">Pregunta {index + 1}</span>
                            <label className="flex items-center gap-2 text-xs cursor-pointer text-text-secondary hover:text-brand-500 transition-colors">
                              <input
                                type="checkbox"
                                checked={isCustom || false}
                                onChange={(e) => {
                                  const questions = [...securityQuestions];
                                  questions[index] = {
                                    ...questions[index],
                                    isCustom: e.target.checked,
                                    questionId: e.target.checked ? "" : questions[index].questionId,
                                    customQuestion: e.target.checked ? questions[index].customQuestion : ""
                                  };
                                  setValue("securityQuestions" as any, questions, { shouldValidate: true });
                                }}
                                className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                              />
                              <span>Crear pregunta personalizada</span>
                            </label>
                          </div>
                          
                          {isCustom ? (
                            <>
                              <Controller
                                name={`securityQuestions.${index}.customQuestion`}
                                control={control}
                                render={({ field: ctrlField }) => (
                                  <Input
                                    {...ctrlField}
                                    placeholder="Escriba su pregunta personalizada"
                                    error={!!errors.securityQuestions?.[index]?.customQuestion}
                                    className="h-12 text-base mb-2"
                                  />
                                )}
                              />
                              <Controller
                                name={`securityQuestions.${index}.answer`}
                                control={control}
                                render={({ field: ctrlField }) => (
                                  <Input
                                    {...ctrlField}
                                    placeholder="Su respuesta"
                                    error={!!errors.securityQuestions?.[index]?.answer}
                                    className="h-12 text-base"
                                  />
                                )}
                              />
                            </>
                          ) : (
                            <>
                              <Controller
                                name={`securityQuestions.${index}.questionId`}
                                control={control}
                                render={({ field: ctrlField }) => (
                                  <CustomSelect
                                    options={getQuestionOptions(index)}
                                    placeholder="Seleccione una pregunta"
                                    onChange={(val) => ctrlField.onChange(val)}
                                    onBlur={ctrlField.onBlur}
                                    value={String(ctrlField.value || "")}
                                    error={!!errors.securityQuestions?.[index]?.questionId}
                                    className="mb-2"
                                  />
                                )}
                              />
                              <Controller
                                name={`securityQuestions.${index}.answer`}
                                control={control}
                                render={({ field: ctrlField }) => (
                                  <Input
                                    {...ctrlField}
                                    placeholder="Su respuesta"
                                    error={!!errors.securityQuestions?.[index]?.answer}
                                    className="h-12 text-base"
                                  />
                                )}
                              />
                            </>
                          )}
                          {errors.securityQuestions?.[index] && (
                            <p className="mt-2 text-xs text-error-500">
                              {errors.securityQuestions[index]?.answer?.message || 
                              errors.securityQuestions[index]?.questionId?.message ||
                              errors.securityQuestions[index]?.customQuestion?.message}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex justify-between mt-6">
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentStep(2)}
                    >
                      Atrás
                    </Button>
                    <Button 
                      type="button"
                      onClick={async () => {
                        const valid = await trigger(["securityQuestions"]);
                        if (valid) {
                          document.getElementById("terms-section")?.scrollIntoView({ behavior: "smooth" });
                        }
                      }}
                      className="flex items-center gap-2"
                    >
                      Continuar <ChevronRightIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div id="terms-section" className="p-5 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                  <label className="flex items-start gap-4 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register("acceptTerms")}
                      className="mt-1 w-5 h-5 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                    />
                    <div className="text-sm">
                      <span className="font-medium text-text-emphasis dark:text-gray-200">
                        Acepto los Términos y Condiciones <span className="text-error-500">*</span>
                      </span>
                      <p className="mt-1 text-text-secondary dark:text-gray-400">
                        He leído y acepto los{" "}
                        <a 
                          href="/docs/terminos-y-condiciones.pdf" 
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand-500 hover:text-brand-600 underline font-medium"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Términos y Condiciones del Sistema
                        </a>
                        {" "}y la política de privacidad.
                      </p>
                      {errors.acceptTerms && (
                        <p className="mt-2 text-xs text-error-500">{errors.acceptTerms.message}</p>
                      )}
                    </div>
                  </label>
                </div>

                <div className="flex justify-between mt-2">
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(2)}
                  >
                    Atrás
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={loading || !isValid || !acceptTerms}
                    className="min-w-[200px]"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Guardando...
                      </span>
                    ) : (
                      "Finalizar Configuración"
                    )}
                  </Button>
                </div>
              </>
            )}
          </form>
        </div>
      </AuthLayout>
    </>
  );
}
