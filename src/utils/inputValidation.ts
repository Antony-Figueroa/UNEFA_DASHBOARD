/**
 * @file inputValidation.ts
 * @description Utilidades para sanitización y validación de inputs.
 * Protege contra SQL injection, XSS y otros ataques de inyección.
 * 
 * @example
 * // En schema Zod:
 * name: z.string().min(1).regex(SAFE_TEXT_PATTERN, "Caracteres no permitidos")
 * 
 * // En backend:
 * if (!isValidText(data.name)) throw new Error("Datos inválidos")
 */

import { z } from "zod";

// ============================================================================
// PATRONES DE SEGURIDAD - Regex para detectar inyección SQL
// ============================================================================

/**
 * Patrones peligrosos que indican intento de inyección SQL.
 * Estos patrones se buscan en el input para detectar ataques.
 */
export const DANGEROUS_PATTERNS = [
  /\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION)\b/i,
  /;/,
  /--/,
  /\/\*/,
  /\*\//,
  /xp_/i,
  /sp_/i,
  /and\s+\d+=\d+/i,
  /or\s+\d+=\d+/i,
  /union\s+select/i,
  /having\s+\d+=\d+/i,
];

/**
 * Regex para nombres propios: solo letras, espacios, tildes y ñ
 * NO permite números, símbolos, guiones ni comillas
 */
export const NAME_PATTERN = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/u;

/**
 * Regex para texto seguro: letras, números, espacios, puntuación básica
 * Bloquea comillas, punto y coma, y caracteres de inyección
 */
export const SAFE_TEXT_PATTERN = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s\-.,()\/]+$/u;

/**
 * Regex más permisivo para textos largos (descripciones, observaciones)
 * Permite más caracteres pero sigue bloquando inyecciones obvias
 */
export const SAFE_LONG_TEXT_PATTERN = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9\s\-.,()\/¡!¿?%=+:]+$/u;

/**
 * Regex para emails - versión segura
 */
export const SAFE_EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Regex para códigos alfanuméricos (códigos de carrera, etc)
 */
export const SAFE_CODE_PATTERN = /^[a-zA-Z0-9\-_]+$/;

// ============================================================================
// FUNCIONES DE VALIDACIÓN - Retornan boolean
// ============================================================================

/**
 * Verifica si un string contiene patrones de inyección SQL.
 * @param value - String a verificar
 * @returns true si es seguro, false si detecta patrón peligroso
 */
export const isSafeInput = (value: string): boolean => {
  if (!value || typeof value !== "string") return true;
  
  const trimmed = value.trim();
  if (trimmed.length === 0) return true;
  
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(trimmed)) {
      return false;
    }
  }
  return true;
};

/**
 * Valida que un nombre solo contenga letras válidas.
 * @param value - Nombre a validar
 * @returns true si es válido
 */
export const isValidName = (value: string): boolean => {
  if (!value || typeof value !== "string") return false;
  
  const trimmed = value.trim();
  if (trimmed.length === 0) return false;
  
  return NAME_PATTERN.test(trimmed);
};

/**
 * Valida texto general contra patrones de inyección.
 * @param value - Texto a validar
 * @returns true si es válido
 */
export const isValidText = (value: string): boolean => {
  if (!value || typeof value !== "string") return true;
  
  const trimmed = value.trim();
  if (trimmed.length === 0) return true;
  
  return SAFE_TEXT_PATTERN.test(trimmed);
};

/**
 * Valida texto largo (descripciones, observaciones).
 * @param value - Texto a validar
 * @returns true si es válido
 */
export const isValidLongText = (value: string): boolean => {
  if (!value || typeof value !== "string") return true;
  
  const trimmed = value.trim();
  if (trimmed.length === 0) return true;
  
  return SAFE_LONG_TEXT_PATTERN.test(trimmed);
};

/**
 * Valida email con patrón seguro.
 * @param value - Email a validar
 * @returns true si es válido
 */
export const isValidEmail = (value: string): boolean => {
  if (!value || typeof value !== "string") return false;
  
  const trimmed = value.trim();
  if (trimmed.length === 0) return false;
  
  return SAFE_EMAIL_PATTERN.test(trimmed);
};

/**
 * Valida código alfanumérico.
 * @param value - Código a validar
 * @returns true si es válido
 */
export const isValidCode = (value: string): boolean => {
  if (!value || typeof value !== "string") return false;
  
  const trimmed = value.trim();
  if (trimmed.length === 0) return false;
  
  return SAFE_CODE_PATTERN.test(trimmed);
};

// ============================================================================
// FUNCIONES DE SANITIZACIÓN - Limpian el input
// ============================================================================

/**
 * Sanitiza un string removiendo caracteres peligrosos.
 * Útil para limpieza defensiva (no como validación).
 * @param value - String a sanitizar
 * @returns String seguro
 */
export const sanitizeInput = (value: string): string => {
  if (!value || typeof value !== "string") return "";
  
  return value
    .replace(/['"]/g, "") // Remover comillas
    .replace(/;/g, "")     // Remover punto y coma
    .replace(/--/g, "")    // Remover comentarios SQL
    .replace(/(\/\*|\*\/)/g, "") // Remover comentarios SQL
    .trim();
};

/**
 * Sanitiza un nombre (solo letras permitidas).
 * @param value - Nombre a sanitizar
 * @returns Nombre seguro
 */
export const sanitizeName = (value: string): string => {
  if (!value || typeof value !== "string") return "";
  
  return value
    .replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s\-']/g, "")
    .trim();
};

/**
 * Sanitiza un email.
 * @param value - Email a sanitizar
 * @returns Email seguro
 */
export const sanitizeEmail = (value: string): string => {
  if (!value || typeof value !== "string") return "";
  
  return value
    .toLowerCase()
    .replace(/[^a-zA-Z0-9._%+-@]/g, "")
    .trim();
};

// ============================================================================
// SCHEMAS ZOD - Listos para usar en formularios
// ============================================================================

/**
 * Schema Zod para nombres propios.
 * Mensaje de error en español.
 */
export const nameSchema = z
  .string()
  .min(1, "El nombre es obligatorio")
  .max(100, "El nombre es demasiado largo")
  .regex(NAME_PATTERN, "Solo letras y espacios");

/**
 * Schema Zod para texto general.
 */
export const textSchema = z
  .string()
  .max(500, "El texto es demasiado largo")
  .regex(SAFE_TEXT_PATTERN, "Caracteres no permitidos");

/**
 * Schema Zod para texto largo (descripciones).
 */
export const longTextSchema = z
  .string()
  .max(2000, "El texto es demasiado largo")
  .regex(SAFE_LONG_TEXT_PATTERN, "Caracteres no permitidos");

/**
 * Schema Zod para email.
 */
export const emailSchema = z
  .string()
  .email("Email inválido")
  .max(255, "El email es demasiado largo")
  .regex(SAFE_EMAIL_PATTERN, "Email con caracteres no permitidos");

/**
 * Schema Zod para código.
 */
export const codeSchema = z
  .string()
  .min(1, "El código es obligatorio")
  .max(50, "El código es demasiado largo")
  .regex(SAFE_CODE_PATTERN, "Solo se permiten letras, números y guiones");

/**
 * Schema Zod para validar que NO contiene inyección SQL.
 * Útil como validación adicional.
 */
export const safeInputSchema = z
  .string()
  .refine((val) => isSafeInput(val), {
    message: "El texto contiene caracteres no permitidos",
  });

// ============================================================================
// EXPORT POR DEFECTO - Objeto con todas las utilidades
// ============================================================================

export const inputValidation = {
  // Patrones
  DANGEROUS_PATTERNS,
  NAME_PATTERN,
  SAFE_TEXT_PATTERN,
  SAFE_LONG_TEXT_PATTERN,
  SAFE_EMAIL_PATTERN,
  SAFE_CODE_PATTERN,
  
  // Validadores (boolean)
  isSafeInput,
  isValidName,
  isValidText,
  isValidLongText,
  isValidEmail,
  isValidCode,
  
  // Sanitizadores
  sanitizeInput,
  sanitizeName,
  sanitizeEmail,
  
  // Schemas Zod
  nameSchema,
  textSchema,
  longTextSchema,
  emailSchema,
  codeSchema,
  safeInputSchema,
};

export default inputValidation;