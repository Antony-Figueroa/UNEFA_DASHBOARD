import * as z from "zod";

export const VENEZUELA_PHONE_PREFIXES = [
  { value: "0412", label: "0412" },
  { value: "0414", label: "0414" },
  { value: "0416", label: "0416" },
  { value: "0422", label: "0422" },
  { value: "0424", label: "0424" },
  { value: "0426", label: "0426" },
  { value: "0212", label: "0212" },
];

export const MILITARY_RANKS = [
  "Soldado", "Cabo", "Sargento", "Teniente", "Capitán", "Mayor", "Teniente Coronel", "Coronel", "General"
].map(rank => ({ value: rank.toUpperCase(), label: rank.toUpperCase() }));

export const studentSchema = z.object({
  identificationPrefix: z.string().min(1, "Seleccione un prefijo"),
  identificationNumber: z.string()
    .min(6, "La cédula debe tener al menos 6 dígitos")
    .max(8, "La cédula no puede tener más de 8 dígitos")
    .regex(/^\d+$/, "Solo se admiten números"),
  firstName: z.string()
    .min(1, "El primer nombre es obligatorio")
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s']+$/, "Solo se admiten letras, espacios y apóstrofes")
    .transform(val => val.trim().replace(/\s+/g, ' ')),
  middleName: z.string()
    .transform(val => val ? val.trim().replace(/\s+/g, ' ') : "")
    .refine(val => !val || /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s']+$/.test(val), "Solo se admiten letras, espacios y apóstrofes")
    .default(""),
  lastName: z.string()
    .min(1, "El primer apellido es obligatorio")
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s']+$/, "Solo se admiten letras, espacios y apóstrofes")
    .transform(val => val.trim().replace(/\s+/g, ' ')),
  secondLastName: z.string()
    .transform(val => val ? val.trim().replace(/\s+/g, ' ') : "")
    .refine(val => !val || /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s']+$/.test(val), "Solo se admiten letras, espacios y apóstrofes")
    .default(""),
  sex: z.string().min(1, "Seleccione el sexo"),
  birthDate: z.string()
    .min(1, "La fecha de nacimiento es obligatoria")
    .refine((date) => {
      const birth = new Date(date);
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
    .min(1, "El email es obligatorio"),
  address: z.string().min(1, "La dirección es obligatoria"),
  careerId: z.union([z.string(), z.number()]).refine(val => String(val).length > 0, "La carrera es obligatoria"),
  semester: z.string()
    .min(1, "El semestre es obligatorio")
    .regex(/^\d+$/, "Solo se admiten números"),
  section: z.string()
    .min(1, "La sección es obligatoria")
    .regex(/^\d+$/, "Solo se admiten números"),
  regime: z.string().min(1, "Seleccione el régimen"),
  studentType: z.string().min(1, "Seleccione el tipo de estudiante"),
  militaryRank: z.string().min(1, "El rango militar es obligatorio"),
  works: z.string().min(1, "Seleccione si trabaja"),
});

export type StudentFormInput = z.input<typeof studentSchema>;
export type StudentFormOutput = z.output<typeof studentSchema>;

// For backward compatibility if needed
export type StudentFormData = StudentFormInput;
