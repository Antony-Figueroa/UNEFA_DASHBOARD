-- Agregar columna para preguntas personalizadas
ALTER TABLE "t_security_questions" ADD COLUMN IF NOT EXISTS "CUSTOM_QUESTION" TEXT;
