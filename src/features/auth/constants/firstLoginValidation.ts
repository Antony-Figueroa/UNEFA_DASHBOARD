import * as z from "zod";

const passwordRegex = {
  uppercase: /[A-Z]/,
  lowercase: /[a-z]/,
  number: /[0-9]/,
  special: /[!@#$%^&*()_+~`|}{[\]:;?><,./\-=]/
};

const securityQuestionSchema = z.object({
  questionId: z.union([z.number(), z.string()]).optional(),
  customQuestion: z.string().optional(),
  answer: z.string().min(1, "La respuesta es obligatoria"),
  isCustom: z.boolean().optional()
}).refine((data) => {
  // Si es pregunta personalizada, customQuestion es requerida
  if (data.isCustom) {
    return data.customQuestion && data.customQuestion.trim().length > 0;
  }
  // Si no es personalizada, questionId es requerida
  if (!data.isCustom) {
    const qid = typeof data.questionId === 'string' ? parseInt(data.questionId) : data.questionId;
    return !isNaN(qid as number) && (qid as number) > 0;
  }
  return false;
}, {
  message: "Seleccione una pregunta o cree una personalizada",
});

export const firstLoginSchema = z.object({
  firstName: z.string().min(1, "El primer nombre es obligatorio").regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s']+$/, "Solo se admiten letras, espacios y apóstrofes"),
  middleName: z.string().optional(),
  lastName: z.string().min(1, "El primer apellido es obligatorio").regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s']+$/, "Solo se admiten letras, espacios y apóstrofes"),
  secondLastName: z.string().optional(),
  phonePrefix: z.string().min(1, "El prefijo telefónico es obligatorio"),
  phoneNumber: z.string().length(7, "El número debe tener exactamente 7 dígitos").regex(/^\d+$/, "Solo se admiten números"),
  email: z.string().email("Email inválido").min(1, "El email es obligatorio"),
  newPassword: z.string()
    .min(12, "La contraseña debe tener al menos 12 caracteres")
    .refine(val => passwordRegex.uppercase.test(val), "Debe contener al menos una mayúscula")
    .refine(val => passwordRegex.lowercase.test(val), "Debe contener al menos una minúscula")
    .refine(val => passwordRegex.number.test(val), "Debe contener al menos un número")
    .refine(val => passwordRegex.special.test(val), "Debe contener al menos un carácter especial"),
  confirmPassword: z.string().min(1, "Debe confirmar la contraseña"),
  securityQuestions: z.array(securityQuestionSchema).length(3, "Debe completar las 3 preguntas de seguridad"),
  acceptTerms: z.boolean().refine(val => val === true, "Debe aceptar los términos y condiciones")
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"]
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Debe ingresar su contraseña actual"),
  newPassword: z.string()
    .min(12, "La contraseña debe tener al menos 12 caracteres")
    .refine(val => passwordRegex.uppercase.test(val), "Debe contener al menos una mayúscula")
    .refine(val => passwordRegex.lowercase.test(val), "Debe contener al menos una minúscula")
    .refine(val => passwordRegex.number.test(val), "Debe contener al menos un número")
    .refine(val => passwordRegex.special.test(val), "Debe contener al menos un carácter especial"),
  confirmPassword: z.string().min(1, "Debe confirmar la contraseña"),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"]
});

// Schema para cambio de contraseña sin currentPassword (FirstLogin sin paso 1)
export const simplePasswordSchema = z.object({
  newPassword: z.string()
    .min(12, "La contraseña debe tener al menos 12 caracteres")
    .refine(val => passwordRegex.uppercase.test(val), "Debe contener al menos una mayúscula")
    .refine(val => passwordRegex.lowercase.test(val), "Debe contener al menos una minúscula")
    .refine(val => passwordRegex.number.test(val), "Debe contener al menos un número")
    .refine(val => passwordRegex.special.test(val), "Debe contener al menos un carácter especial"),
  confirmPassword: z.string().min(1, "Debe confirmar la contraseña"),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"]
});

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export type FirstLoginFormData = z.infer<typeof firstLoginSchema>;
