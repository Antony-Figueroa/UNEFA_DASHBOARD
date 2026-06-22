ALTER TABLE t_academic_config
  ADD COLUMN ALLOW_MULTIPLE_VISITS_PER_DAY BOOLEAN DEFAULT TRUE,
  ADD COLUMN MAX_VISITS_PER_DAY INTEGER DEFAULT NULL;
COMMENT ON COLUMN t_academic_config.ALLOW_MULTIPLE_VISITS_PER_DAY IS 'Permite múltiples visitas en la misma fecha para una misma práctica';
COMMENT ON COLUMN t_academic_config.MAX_VISITS_PER_DAY IS 'Máximo de visitas permitidas por día para una misma práctica (NULL = sin límite)';
