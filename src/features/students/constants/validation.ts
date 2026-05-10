import * as z from "zod";
import { NAME_PATTERN, SAFE_EMAIL_PATTERN, SAFE_TEXT_PATTERN, isSafeInput } from "../../../utils/inputValidation";

// Helper para validar campos opcionales - permite vacío o valores válidos
const optionalName = z.string()
  .max(100, "El nombre es demasiado largo")
  .refine(val => !val || NAME_PATTERN.test(val), { message: "Solo letras y espacios" })
  .refine(val => !val || isSafeInput(val), { message: "Caracteres no permitidos" })
  .transform(val => val ? val.trim().replace(/\s+/g, ' ') : "")
  .optional()
  .or(z.literal(""));

export const studentSchema = z.object({
  identificationPrefix: z.string().min(1, "Seleccione un prefijo"),
  identificationNumber: z.string()
    .min(6, "La cédula debe tener al menos 6 dígitos")
    .max(9, "La cédula no puede tener más de 9 dígitos")
    .regex(/^\d+$/, "Solo se admiten números"),
  firstName: z.string()
    .min(1, "El primer nombre es obligatorio")
    .max(100, "El nombre es demasiado largo")
    .regex(NAME_PATTERN, "Solo letras y espacios")
    .refine(val => isSafeInput(val), { message: "Caracteres no permitidos" })
    .transform(val => val.trim().replace(/\s+/g, ' ')),
  middleName: optionalName,
  lastName: z.string()
    .min(1, "El primer apellido es obligatorio")
    .max(100, "El apellido es demasiado largo")
    .regex(NAME_PATTERN, "Solo letras y espacios")
    .refine(val => isSafeInput(val), { message: "Caracteres no permitidos" })
    .transform(val => val.trim().replace(/\s+/g, ' ')),
  secondLastName: optionalName,
  sex: z.string().min(1, "Seleccione el sexo"),
  birthDate: z.string()
    .min(1, "La fecha de nacimiento es obligatoria")
    .refine((date) => {
      if (!date) return false;
      const birth = new Date(date.includes('T') ? date : `${date}T12:00:00`);
      if (isNaN(birth.getTime())) return false;
      const today = new Date();
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return age >= 16;
    }, "El estudiante debe tener al menos 16 años"),
  civilStatus: z.string().min(1, "Seleccione el estado civil"),
  phonePrefix: z.string().min(1, "Seleccione un prefijo"),
  phoneNumber: z.string()
    .length(7, "El número debe tener exactamente 7 dígitos")
    .regex(/^\d+$/, "Solo se admiten números"),
  email: z.string()
    .email("Email inválido")
    .min(1, "El email es obligatorio")
    .max(255, "El email es demasiado largo")
    .regex(SAFE_EMAIL_PATTERN, "Email con caracteres no permitidos")
    .refine(val => isSafeInput(val), { message: "Caracteres no permitidos" }),
  address: z.string()
    .min(1, "La dirección es obligatoria")
    .max(500, "La dirección es demasiado larga")
    .regex(SAFE_TEXT_PATTERN, "Caracteres no permitidos")
    .refine(val => isSafeInput(val), { message: "Caracteres no permitidos" }),
  studentType: z.string().min(1, "Seleccione el tipo de estudiante"),
  militaryRank: z.string().default("NO APLICA"),
  works: z.string().min(1, "Seleccione si trabaja"),
});

export type StudentFormInput = z.input<typeof studentSchema>;
export type StudentFormOutput = z.output<typeof studentSchema>;

// For backward compatibility if needed
export type StudentFormData = StudentFormInput;
