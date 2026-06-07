-- Migration 010: Knowledge Base para chat Groq
-- Crea tabla t_knowledge_base con soporte pgvector para RAG semántico

-- Habilitar extension vector si no existe
CREATE EXTENSION IF NOT EXISTS vector;

-- Tabla principal de conocimiento
CREATE TABLE IF NOT EXISTS t_knowledge_base (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('regulation', 'curriculum', 'process', 'faq', 'general')),
    content TEXT NOT NULL,
    embedding vector(768),
    metadata JSONB DEFAULT '{}'::jsonb,
    roles INTEGER[] DEFAULT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_kb_category ON t_knowledge_base(category);
CREATE INDEX IF NOT EXISTS idx_kb_active ON t_knowledge_base(is_active);

-- Índice IVFFlat para búsqueda por similitud coseno
-- lists=100 es apropiado para < 100K entries
CREATE INDEX IF NOT EXISTS idx_kb_embedding ON t_knowledge_base
    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_kb_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_kb_updated_at ON t_knowledge_base;
CREATE TRIGGER trg_kb_updated_at
    BEFORE UPDATE ON t_knowledge_base
    FOR EACH ROW
    EXECUTE FUNCTION update_kb_updated_at();

-- RPC function para búsqueda semántica por similitud coseno
-- Recibe: embedding de la query, threshold, limit, category filter, roles filter
-- Retorna: rows con similarity score
CREATE OR REPLACE FUNCTION search_knowledge_base(
    query_embedding vector(768),
    match_threshold double precision DEFAULT 0.7,
    match_limit integer DEFAULT 5,
    filter_category text DEFAULT NULL,
    filter_roles integer[] DEFAULT NULL
)
RETURNS TABLE(
    id UUID,
    title TEXT,
    category TEXT,
    content TEXT,
    metadata JSONB,
    similarity double precision
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        kb.id,
        kb.title,
        kb.category,
        kb.content,
        kb.metadata,
        1 - (kb.embedding <=> query_embedding) AS similarity
    FROM t_knowledge_base kb
    WHERE kb.is_active = true
      AND (filter_category IS NULL OR kb.category = filter_category)
      AND (filter_roles IS NULL OR kb.roles IS NULL OR kb.roles && filter_roles)
      AND 1 - (kb.embedding <=> query_embedding) >= match_threshold
    ORDER BY kb.embedding <=> query_embedding
    LIMIT match_limit;
END;
$$;
