/**
 * Migración 029: Agregar WITHDRAWAL_TYPE a t_professional_practices
 *
 * Distingue retiros con justificativo de retiros sin justificativo:
 * - 'justified':   abandono con justificativo → puede reinscribirse solo en la práctica que falta
 * - 'unjustified': abandono sin justificativo → cuenta como reprobado, reinscripción completa desde 0
 * - NULL:          no retirado
 */
ALTER TABLE t_professional_practices
ADD COLUMN WITHDRAWAL_TYPE varchar(20) NULL;

COMMENT ON COLUMN t_professional_practices.WITHDRAWAL_TYPE IS 'Tipo de retiro: justified (con justificativo) | unjustified (sin justificativo) | null (no retirado)';
