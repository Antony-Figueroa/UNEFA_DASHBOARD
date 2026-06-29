/**
 * @file Constantes de estado para prácticas profesionales y periodos académicos.
 * @description Fuente única de verdad para todos los status. NO usar magic numbers
 * en controllers, services, o middlewares — importá estas constantes.
 *
 * Uso:
 *   import { PRACTICES_STATUS, PERIOD_STATUS } from '../constants/practice-status.constants.js';
 *
 *   // Antes:  .eq('PRACTICES_STATUS', 2)
 *   // Ahora:  .eq('PRACTICES_STATUS', PRACTICES_STATUS.INSCRITO)
 *
 *   // Antes:  PERIOD_STATUS !== '2'
 *   // Ahora:  PERIOD_STATUS !== PERIOD_STATUS.EN_CURSO
 */

export const PRACTICES_STATUS = {
  RETIRADO: 0,
  PRE_INSCRITO: 1,
  INSCRITO: 2,
  CULMINADO: 3,
  REPROBADO: 4,
} as const;

export const PERIOD_STATUS = {
  PENDIENTE: '1',
  EN_CURSO: '2',
  CULMINADO: '3',
} as const;

/** Labels legibles para mensajes al usuario */
export const PRACTICES_STATUS_LABELS: Record<number, string> = {
  [PRACTICES_STATUS.RETIRADO]: 'Retirado',
  [PRACTICES_STATUS.PRE_INSCRITO]: 'Pre-inscrito',
  [PRACTICES_STATUS.INSCRITO]: 'Inscrito',
  [PRACTICES_STATUS.CULMINADO]: 'Culminado',
  [PRACTICES_STATUS.REPROBADO]: 'Reprobado',
};

export const PERIOD_STATUS_LABELS: Record<string, string> = {
  [PERIOD_STATUS.PENDIENTE]: 'Pendiente',
  [PERIOD_STATUS.EN_CURSO]: 'En Curso',
  [PERIOD_STATUS.CULMINADO]: 'Culminado',
};

export type PracticesStatus = (typeof PRACTICES_STATUS)[keyof typeof PRACTICES_STATUS];
export type PeriodStatus = (typeof PERIOD_STATUS)[keyof typeof PERIOD_STATUS];
