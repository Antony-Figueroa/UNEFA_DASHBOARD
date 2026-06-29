-- Migration: Crear tabla de reversiones de culminación
-- Propósito: Registrar anulaciones administrativas de culminaciones
-- sin alterar el registro histórico (la culminación original se conserva intacta)
ALTER TABLE public.t_practice_culmination DISABLE TRIGGER ALL;

CREATE TABLE IF NOT EXISTS public.t_culmination_reversals (
    CULMINATION_REVERSAL_ID SERIAL PRIMARY KEY,
    PROFESSIONAL_PRACTICE_ID INTEGER NOT NULL REFERENCES public.t_professional_practices(PROFESSIONAL_PRACTICE_ID),
    REASON TEXT NOT NULL,
    RESOLUTION_NUMBER VARCHAR(100) NOT NULL,
    USER_ID INTEGER NOT NULL REFERENCES public.t_user(USER_ID),
    CREATED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    STATUS INTEGER DEFAULT 1,
    CONSTRAINT uq_practice_reversal UNIQUE (PROFESSIONAL_PRACTICE_ID)
);

COMMENT ON TABLE public.t_culmination_reversals IS 'Registro de anulación administrativa de culminaciones. No modifica la culminación original.';
COMMENT ON COLUMN public.t_culmination_reversals.REASON IS 'Motivo de la reversión';
COMMENT ON COLUMN public.t_culmination_reversals.RESOLUTION_NUMBER IS 'Número de resolución administrativa';
COMMENT ON COLUMN public.t_culmination_reversals.USER_ID IS 'Usuario que realizó la reversión';
COMMENT ON COLUMN public.t_culmination_reversals.STATUS IS '1=activo, 0=anulado';
ALTER TABLE public.t_practice_culmination ENABLE TRIGGER ALL;
