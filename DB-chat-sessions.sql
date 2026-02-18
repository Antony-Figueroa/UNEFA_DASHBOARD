-- --------------------------------------------------------
-- Tabla para persistir sesiones de chat de IA
-- --------------------------------------------------------

CREATE TABLE "t_chat_sessions" (
  "SESSION_ID" UUID NOT NULL DEFAULT gen_random_uuid(),
  "USER_ID" INTEGER NOT NULL,
  "TITLE" VARCHAR(100) NOT NULL DEFAULT 'Nueva conversación',
  "MESSAGES" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "CREATED_AT" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "UPDATED_AT" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "STATUS" SMALLINT NOT NULL DEFAULT 1,
  PRIMARY KEY ("SESSION_ID"),
  CONSTRAINT "fk_chat_session_user" FOREIGN KEY ("USER_ID") REFERENCES "t_user" ("USER_ID")
);

CREATE INDEX "idx_chat_sessions_user" ON "t_chat_sessions" ("USER_ID", "STATUS");
CREATE INDEX "idx_chat_sessions_updated" ON "t_chat_sessions" ("UPDATED_AT" DESC);
