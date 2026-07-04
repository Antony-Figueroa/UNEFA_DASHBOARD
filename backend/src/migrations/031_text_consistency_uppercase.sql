/**
 * Migración 031: Normalizar datos existentes a UPPERCASE
 *
 * Aplica UPPER() a columnas de texto libre que ahora son sanitizadas
 * por sanitizeText() antes de insertar. Esto corrige datos históricos
 * que se guardaron antes de la normalización.
 *
 * Relacionado con: text-consistency-fixes (T-001 a T-005)
 */

-- t_professional_practices: OBSERVATION, REPORT_TITLE, TOUR, SEMESTER, SECTION, REGIME
UPDATE t_professional_practices
SET
  OBSERVATION = UPPER(TRIM(OBSERVATION)),
  REPORT_TITLE = UPPER(TRIM(REPORT_TITLE)),
  TOUR = UPPER(TRIM(TOUR)),
  SEMESTER = UPPER(TRIM(SEMESTER)),
  SECTION = UPPER(TRIM(SECTION)),
  REGIME = UPPER(TRIM(REGIME))
WHERE
  OBSERVATION IS NOT NULL OR REPORT_TITLE IS NOT NULL
  OR TOUR IS NOT NULL OR SEMESTER IS NOT NULL
  OR SECTION IS NOT NULL OR REGIME IS NOT NULL;

-- t_professional_practices: campos de extensión y retiro
UPDATE t_professional_practices
SET
  "EXTENSION_REASON" = UPPER(TRIM("EXTENSION_REASON")),
  "WITHDRAWAL_TYPE" = UPPER(TRIM("WITHDRAWAL_TYPE"))
WHERE
  "EXTENSION_REASON" IS NOT NULL OR "WITHDRAWAL_TYPE" IS NOT NULL;

-- t_notifications: TITLE, MESSAGE
UPDATE t_notifications
SET
  TITLE = UPPER(TRIM(TITLE)),
  MESSAGE = UPPER(TRIM(MESSAGE))
WHERE TITLE IS NOT NULL OR MESSAGE IS NOT NULL;

-- t_address: street_address, reference
UPDATE t_address
SET
  street_address = UPPER(TRIM(street_address)),
  reference = UPPER(TRIM(reference))
WHERE street_address IS NOT NULL OR reference IS NOT NULL;
