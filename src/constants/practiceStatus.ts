/**
 * @file Constantes de estado para prácticas profesionales (frontend).
 * @description Fuente única de verdad para todos los status de práctica en el frontend.
 * Espejo de `backend/src/constants/practice-status.constants.ts`.
 *
 * Uso:
 *   import { PRACTICES_STATUS } from '@/constants/practiceStatus';
 *
 *   // Antes:  practice.practicesStatusCode === 'RETIRADO'
 *   // Ahora:  practice.practicesStatus === PRACTICES_STATUS.RETIRADO
 *   // O:      PRACTICES_STATUS_CODES[status]
 */

export const PRACTICES_STATUS: Record<string, number> = {
  RETIRADO: 0,
  PRE_INSCRITO: 1,
  INSCRITO: 2,
  CULMINADO: 3,
  REPROBADO: 4,
  RETIRO_JUSTIFICADO: 5,
} as const;

/** Códigos UPPERCASE para comparación programática */
export const PRACTICES_STATUS_CODES: Record<number, string> = {
  [PRACTICES_STATUS.RETIRADO]: 'RETIRADO',
  [PRACTICES_STATUS.PRE_INSCRITO]: 'PRE_INSCRITO',
  [PRACTICES_STATUS.INSCRITO]: 'INSCRITO',
  [PRACTICES_STATUS.CULMINADO]: 'CULMINADO',
  [PRACTICES_STATUS.REPROBADO]: 'REPROBADO',
  [PRACTICES_STATUS.RETIRO_JUSTIFICADO]: 'RETIRO_JUSTIFICADO',
};

/** Labels legibles para mensajes al usuario */
export const PRACTICES_STATUS_LABELS: Record<number, string> = {
  [PRACTICES_STATUS.RETIRADO]: 'Retirado',
  [PRACTICES_STATUS.PRE_INSCRITO]: 'Pre-inscrito',
  [PRACTICES_STATUS.INSCRITO]: 'Inscrito',
  [PRACTICES_STATUS.CULMINADO]: 'Culminado',
  [PRACTICES_STATUS.REPROBADO]: 'Reprobado',
  [PRACTICES_STATUS.RETIRO_JUSTIFICADO]: 'Retiro Justificado',
};

export type PracticesStatus = (typeof PRACTICES_STATUS)[keyof typeof PRACTICES_STATUS];
