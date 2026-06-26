/**
 * @file validation.ts
 * @description Esquemas de validación Zod para los campos compartidos de Persona.
 * Reutilizable por los modales de estudiantes, tutores, usuarios y responsables.
 */

import { z } from "zod";

/**
 * Límites de cédula
 */
export const CEDULA_MAX_DIGITS = 8;

/**
 * Límite de pasaporte (hasta 15 caracteres alfanuméricos)
 */
export const PASSPORT_MAX_LENGTH = 15;

/**
 * Expresiones regulares
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?\d{7,15}$/;

/**
 * Esquema base con los campos compartidos de persona.
 * Cada modal puede extenderlo con sus campos específicos.
 * La validación de identificationNumber es condicional según el prefijo:
 * - V/E/J/G: solo dígitos, máx 8
 * - P (pasaporte): alfanumérico, máx 15
 */
export const personSchema = z.object({
  // Identificación
  identificationPrefix: z.string().min(1, "El prefijo es requerido"),
  identificationNumber: z
    .string()
    .min(1, "El número es requerido")
    .regex(/^[A-Za-z0-9]+$/, "Solo se permiten letras y números"),

  // Nombres
  firstName: z.string().min(1, "El nombre es requerido"),
  middleName: z.string().optional().default(""),
  lastName: z.string().min(1, "El apellido es requerido"),
  secondLastName: z.string().optional().default(""),

  // Contacto
  email: z
    .string()
    .min(1, "El correo es requerido")
    .regex(EMAIL_REGEX, "Formato de correo inválido"),
  phonePrefix: z.string().optional().default(""),
  phoneNumber: z.string().optional().default(""),

  // Datos personales
  sex: z.string().optional().default(""),
  birthDate: z.string().optional().default(""),
  address: z.string().optional().default(""),
  civilStatus: z.string().optional().default(""),
}).superRefine((data, ctx) => {
  const prefix = data.identificationPrefix || "V";
  const num = data.identificationNumber || "";

  if (prefix === "P") {
    if (num.length > PASSPORT_MAX_LENGTH) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Máximo ${PASSPORT_MAX_LENGTH} caracteres`,
        path: ["identificationNumber"],
      });
    }
  } else {
    if (!/^\d+$/.test(num)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Solo se permiten números",
        path: ["identificationNumber"],
      });
    }
    if (num.length > CEDULA_MAX_DIGITS) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Máximo ${CEDULA_MAX_DIGITS} dígitos`,
        path: ["identificationNumber"],
      });
    }
  }
});

/**
 * Tipo inferido del esquema base de persona.
 */
export type PersonFormInput = z.infer<typeof personSchema>;

/**
 * Datos procesados del formulario de persona (listos para enviar al backend).
 */
export interface PersonFormOutput {
  identificationPrefix: string;
  identificationNumber: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  secondLastName?: string;
  email: string;
  phone?: string;
  sex?: string;
  birthDate?: string;
  address?: string;
  civilStatus?: string;
}
