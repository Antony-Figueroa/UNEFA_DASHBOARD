import * as z from "zod";

export const profileSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(100),
  secondName: z.string().max(100).optional().or(z.literal("")),
  surname: z.string().min(1, "El apellido es requerido").max(100),
  secondSurname: z.string().max(100).optional().or(z.literal("")),
  email: z.string().email("Correo inválido").min(1, "El correo es requerido"),
  phoneNumber: z.string().max(20).optional().or(z.literal("")),
});

export type ProfileFormData = z.infer<typeof profileSchema>;

export const deactivationSchema = z.object({
  currentPassword: z.string().min(1, "Debes ingresar tu contraseña actual"),
  reason: z.string().max(500).optional().or(z.literal("")),
});

export type DeactivationFormData = z.infer<typeof deactivationSchema>;
