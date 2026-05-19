-- Chat Configuration Table
-- Almacena la configuración personalizada del chat IA por usuario

CREATE TABLE IF NOT EXISTS t_chat_config (
    CONFIG_ID UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    USER_ID INTEGER NOT NULL REFERENCES t_user(ID) ON DELETE CASCADE,
    PERSONA VARCHAR(20) DEFAULT 'formal' CHECK (PERSONA IN ('formal', 'casual', 'tecnico')),
    QUICK_ACTIONS JSONB DEFAULT '[]',
    SHOW_NOTIFICATIONS BOOLEAN DEFAULT true,
    CREATED_AT TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UPDATED_AT TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(USER_ID)
);

-- Agregar índice para búsquedas por usuario
CREATE INDEX IF NOT EXISTS idx_chat_config_user ON t_chat_config(USER_ID);

-- Comentario
COMMENT ON TABLE t_chat_config IS 'Configuración personalizada del chat IA por usuario';
COMMENT ON COLUMN t_chat_config.PERSONA IS 'Personalidad del asistente: formal, casual, tecnico';
COMMENT ON COLUMN t_chat_config.QUICK_ACTIONS IS 'Acciones rápidas personalizadas en formato JSON';
COMMENT ON COLUMN t_chat_config.SHOW_NOTIFICATIONS IF 'Habilitar notificaciones del chat';