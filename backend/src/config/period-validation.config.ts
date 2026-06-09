/**
 * @file period-validation.config.ts
 * @description Configuración centralizada de reglas de validación de periodo por módulo.
 * 
 * Propósito:
 * - ÚNICA fuente de verdad para qué validaciones aplican a cada operación.
 * - Permite adaptar el comportamiento a diferentes escenarios institucionales
 *   sin modificar el middleware ni el código de los controladores.
 * - Si en el futuro se necesita configurar desde DB/admin, solo cambia el origen
 *   de datos de este archivo.
 * 
 * Cada regla define:
 * - skipPeriodStatusCheck: saltar validación de periodo activo (útil para
 *   pre-inscripciones cuando el periodo ya finalizó y se quiere cambiar al siguiente).
 * - usePeriodGraceDays: usar días de gracia del periodo (ENROLLMENT_GRACE_DAYS /
 *   EVALUATION_GRACE_DAYS) en lugar del END_DATE estático.
 * - extendEndDateDays: días adicionales después del END_DATE para permitir
 *   operaciones (-1 = sin límite, 0 = estricto).
 * - requirePracticesStatusInscribed: validar que la práctica esté "Inscrita".
 */

export interface PeriodValidationRule {
  /** Saltar validación de PERIOD_STATUS === EN_CURSO */
  skipPeriodStatusCheck?: boolean;
  /** Usar días de gracia del periodo */
  usePeriodGraceDays?: boolean;
  /** Días extra después del END_DATE (-1 = sin límite) */
  extendEndDateDays?: number;
  /** Validar PRACTICES_STATUS === INSCRITO */
  requirePracticesStatusInscribed?: boolean;
}

export type OperationType = 'create' | 'update';
export type ModuleType = 'visit' | 'evaluation' | 'pre-enrollment' | 'enrollment';

/**
 * Mapa de reglas de validación por módulo y operación.
 * 
 * Para cambiar el comportamiento de una validación:
 * 1. Localizar el módulo (visit, evaluation, pre-enrollment, enrollment).
 * 2. Localizar la operación (create, update).
 * 3. Modificar la regla deseada.
 * 
 * Ejemplo — permitir inscripciones incluso si el periodo no está activo:
 *   'enrollment': {
 *     create: { ...defaultStrict, skipPeriodStatusCheck: true },
 *     update: { ...defaultStrict, skipPeriodStatusCheck: true },
 *   }
 */
export const periodValidationRules: Record<ModuleType, Record<OperationType, PeriodValidationRule>> = {
  'visit': {
    create: { skipPeriodStatusCheck: false },
    update: { skipPeriodStatusCheck: false },
  },
  'evaluation': {
    create: {
      skipPeriodStatusCheck: false,
      usePeriodGraceDays: true,
      extendEndDateDays: 10,
      requirePracticesStatusInscribed: true,
    },
    update: {
      skipPeriodStatusCheck: false,
      usePeriodGraceDays: true,
      extendEndDateDays: 10,
      requirePracticesStatusInscribed: true,
    },
  },
  'pre-enrollment': {
    create: { skipPeriodStatusCheck: false },
    update: { skipPeriodStatusCheck: true },
  },
  'enrollment': {
    create: { skipPeriodStatusCheck: false, usePeriodGraceDays: true },
    update: { skipPeriodStatusCheck: false, usePeriodGraceDays: true },
  },
};

/** Helper: obtener reglas para un módulo + operación */
export const getValidationRule = (module: ModuleType, operation: OperationType): PeriodValidationRule => {
  return periodValidationRules[module]?.[operation] ?? {};
};

export default periodValidationRules;
