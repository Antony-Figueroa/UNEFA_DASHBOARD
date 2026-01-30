import { z } from "zod";

/**
 * Esquema de validación para la creación y edición de usuarios.
 */
export const userSchema = z.object({
  userCi: z.string()
    .min(6, "La cédula debe tener al menos 6 caracteres")
    .max(8, "La cédula no puede exceder los 8 caracteres")
    .regex(/^[A-Z0-9-]+$/, "La cédula solo puede contener letras mayúsculas, números y guiones"),
  name: z.string()
    .min(2, "El nombre debe tener al menos 2 caracteres")
    .max(100, "El nombre no puede exceder los 100 caracteres")
    .transform(val => val.toUpperCase()),
  surname: z.string()
    .min(2, "El apellido debe tener al menos 2 caracteres")
    .max(100, "El apellido no puede exceder los 100 caracteres")
    .transform(val => val.toUpperCase()),
  email: z.string()
    .email("Correo electrónico inválido")
    .max(150, "El correo no puede exceder los 150 caracteres"),
  role: z.number({
    message: "El rol debe ser un número",
  }).min(0, "El rol es obligatorio"),
  status: z.number().optional().default(1),
  hasConsent: z.boolean().refine(val => val === true, {
    message: "Debe confirmar el consentimiento para el tratamiento de datos",
  }).optional(),
});

/**
 * Tipo para los datos de entrada del formulario (antes de transformaciones).
 */
export type UserFormData = z.input<typeof userSchema>;

/**
 * Tipo para los datos de salida del esquema (después de transformaciones).
 */
export type UserFormOutput = z.output<typeof userSchema>;
