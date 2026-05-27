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
export const CEDULA_MAX_LENGTH = 10; // Prefijo + guión + 8 dígitos (V-12345678)

/**
 * Expresiones regulares
 */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^\+?\d{7,15}$/;

/**
 * Esquema base con los campos compartidos de persona.
 * Cada modal puede extenderlo con sus campos específicos.
 */
export const personSchema = z.object({
  // Identificación
  identificationPrefix: z.string().min(1, "El prefijo es requerido"),
  identificationNumber: z
    .string()
    .min(1, "El número de cédula es requerido")
    .regex(/^\d+$/, "Solo se permiten números")
    .max(CEDULA_MAX_DIGITS, `Máximo ${CEDULA_MAX_DIGITS} dígitos`),

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
