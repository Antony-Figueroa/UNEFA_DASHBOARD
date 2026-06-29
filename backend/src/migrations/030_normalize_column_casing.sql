/**
 * Migración 030: Normalizar casing de columnas agregadas sin quotes
 *
 * Las migraciones 028 y 029 agregaron columnas con identificadores sin comillas
 * (EXTENSION_GRANTED, EXTENSION_REASON, EXTENSION_GRANTED_BY, EXTENSION_GRANTED_AT,
 * WITHDRAWAL_TYPE). PostgreSQL dobla identificadores sin comillas a minúscula,
 * por lo que las columnas quedaron como extension_granted, etc.
 *
 * PostgREST usa quote_ident() en nombres de columna, generando "extension_granted"
 * que coincide con el almacenamiento real. Pero el resto del esquema usa mayúsculas
 * con comillas. Esta migración normaliza renombrando las columnas a mayúsculas
 * con identificadores entrecomillados para mantener consistencia.
 */
ALTER TABLE t_professional_practices
  RENAME COLUMN extension_granted TO "EXTENSION_GRANTED";

ALTER TABLE t_professional_practices
  RENAME COLUMN extension_reason TO "EXTENSION_REASON";

ALTER TABLE t_professional_practices
  RENAME COLUMN extension_granted_by TO "EXTENSION_GRANTED_BY";

ALTER TABLE t_professional_practices
  RENAME COLUMN extension_granted_at TO "EXTENSION_GRANTED_AT";

ALTER TABLE t_professional_practices
  RENAME COLUMN withdrawal_type TO "WITHDRAWAL_TYPE";
