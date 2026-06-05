-- Migration: 008_comite_member_index
-- Agrega columna COMITE_MEMBER_INDEX para soportar 3 evaluadores de comité
-- Actualiza chk_score_range de 1-5 a 1-10

ALTER TABLE t_evaluation
  ADD COLUMN COMITE_MEMBER_INDEX INT DEFAULT NULL;

ALTER TABLE t_evaluation
  ADD CONSTRAINT chk_comite_member_index
  CHECK (
    (EVALUATOR_TYPE = 'COMITE' AND COMITE_MEMBER_INDEX BETWEEN 1 AND 3)
    OR
    (EVALUATOR_TYPE != 'COMITE' AND COMITE_MEMBER_INDEX IS NULL)
  );

ALTER TABLE t_evaluation_detail
  DROP CONSTRAINT IF EXISTS chk_score_range;

ALTER TABLE t_evaluation_detail
  ADD CONSTRAINT chk_score_range
  CHECK ("SCORE" >= 1 AND "SCORE" <= 10);
