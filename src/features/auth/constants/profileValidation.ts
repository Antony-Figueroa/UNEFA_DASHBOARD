import * as z from "zod";

export const profileSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres").max(100)
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, "El nombre solo debe contener letras"),
  secondName: z.string().max(100).regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/, "Solo letras permitidas").optional().or(z.literal("")),
  surname: z.string().min(3, "El apellido debe tener al menos 3 caracteres").max(100)
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, "Solo letras permitidas"),
  secondSurname: z.string().max(100).regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/, "Solo letras permitidas").optional().or(z.literal("")),
  email: z.string().email("Correo inválido").min(1, "El correo es requerido"),
  phoneNumber: z.string().regex(/^\+?(\d{1,3})?[\s-]?\d{7,15}$/, "Formato de teléfono venezolano inválido").optional().or(z.literal("")),
});

export type ProfileFormData = z.infer<typeof profileSchema>;

export const deactivationSchema = z.object({
  currentPassword: z.string().min(1, "Debes ingresar tu contraseña actual"),
  reason: z.string().min(10, "Debes explicar el motivo (mín. 10 caracteres)").max(500),
});

export type DeactivationFormData = z.infer<typeof deactivationSchema>;
