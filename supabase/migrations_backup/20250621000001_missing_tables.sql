-- Migration: Missing tables from remote
-- Adds tables that exist in remote (kajmugaibkmaibgofipc) but not in DB-postgres.sql

-- ponytail: disable FK checks during DDL — order-independent creation
SET session_replication_role = replica;

-- Extensions (only available on remote)
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- ============================================================
-- TABLES
-- ============================================================

-- t_estado (Venezuelan states)
CREATE TABLE IF NOT EXISTS public.t_estado (
  estado_id integer NOT NULL,
  iso_31662 character varying(6) NOT NULL,
  name character varying(100) NOT NULL,
  capital character varying(100)
);

-- t_municipio (Venezuelan municipalities)
CREATE TABLE IF NOT EXISTS public.t_municipio (
  municipio_id bigint NOT NULL,
  estado_id integer NOT NULL,
  name character varying(100) NOT NULL
);

-- t_parroquia (Venezuelan parishes)
CREATE TABLE IF NOT EXISTS public.t_parroquia (
  parroquia_id bigint NOT NULL,
  municipio_id bigint NOT NULL,
  name character varying(200) NOT NULL
);

-- t_address_type (address classification)
CREATE TABLE IF NOT EXISTS public.t_address_type (
  address_type_id bigint NOT NULL,
  code character varying(20) NOT NULL,
  name character varying(50) NOT NULL,
  description text,
  status smallint NOT NULL DEFAULT 1
);

-- t_address (addresses with geographic hierarchy)
CREATE TABLE IF NOT EXISTS public.t_address (
  address_id bigint NOT NULL,
  parroquia_id bigint,
  street_address character varying(300) NOT NULL,
  reference text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  uuid uuid NOT NULL DEFAULT gen_random_uuid(),
  full_address character varying(500),
  updated_at timestamp with time zone DEFAULT now(),
  version integer DEFAULT 1,
  deleted_at timestamp with time zone
);

-- t_institution_address (many-to-many institution-address)
CREATE TABLE IF NOT EXISTS public.t_institution_address (
  institution_address_id bigint NOT NULL,
  institution_id integer NOT NULL,
  address_id bigint NOT NULL,
  address_type_id bigint NOT NULL,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  uuid uuid NOT NULL DEFAULT gen_random_uuid(),
  updated_at timestamp with time zone DEFAULT now(),
  version integer DEFAULT 1
);

-- t_person_address (many-to-many person-address)
CREATE TABLE IF NOT EXISTS public.t_person_address (
  person_address_id bigint NOT NULL,
  person_id integer NOT NULL,
  address_id bigint NOT NULL,
  address_type_id bigint NOT NULL,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  uuid uuid NOT NULL DEFAULT gen_random_uuid(),
  updated_at timestamp with time zone DEFAULT now(),
  version integer DEFAULT 1
);

-- t_chat_config (AI assistant chat configuration)
CREATE TABLE IF NOT EXISTS public.t_chat_config (
  config_id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id integer NOT NULL,
  persona character varying(20) DEFAULT 'formal'::character varying,
  quick_actions jsonb DEFAULT '[]'::jsonb,
  show_notifications boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- t_coordinadores (academic coordinators)
CREATE TABLE IF NOT EXISTS public.t_coordinadores (
  "COORDINADOR_ID" SERIAL NOT NULL,
  "TIPO" character varying(20) NOT NULL,
  "CAREER_ID" integer,
  "NAME" character varying(255) NOT NULL,
  "SECOND_NAME" character varying(255) DEFAULT NULL::character varying,
  "SURNAME" character varying(255) NOT NULL,
  "SECOND_SURNAME" character varying(255) DEFAULT NULL::character varying,
  "CI" character varying(20) NOT NULL,
  "CARGO" character varying(255),
  "CREATION_DATE" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  "STATUS" smallint DEFAULT 1
);

-- t_email_templates (email template catalog)
CREATE TABLE IF NOT EXISTS public.t_email_templates (
  id SERIAL NOT NULL,
  name character varying(255) NOT NULL,
  description text,
  category character varying(50) NOT NULL DEFAULT 'general'::character varying,
  subject character varying(500) NOT NULL,
  body_html text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- t_knowledge_base (AI knowledge base with vector embeddings)
CREATE TABLE IF NOT EXISTS public.t_knowledge_base (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text NOT NULL,
  content text NOT NULL,
  embedding extensions.vector(3),
  metadata jsonb DEFAULT '{}'::jsonb,
  roles text[],
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- t_person_merge_log (person merge audit trail)
CREATE TABLE IF NOT EXISTS public.t_person_merge_log (
  log_id SERIAL NOT NULL,
  ci character varying(10) NOT NULL,
  source_table character varying(50) NOT NULL,
  source_id integer NOT NULL,
  field_name character varying(50) NOT NULL,
  value_used text,
  value_over text,
  overridden_from character varying(50),
  severity character varying(10) DEFAULT 'INFO'::character varying,
  created_at timestamp without time zone DEFAULT now()
);

-- t_report_text_templates (report section templates)
CREATE TABLE IF NOT EXISTS public.t_report_text_templates (
  "TEMPLATE_ID" SERIAL NOT NULL,
  "REPORT_TYPE" character varying(50) NOT NULL,
  "SECTION" character varying(50) NOT NULL,
  "CONTENT_TEMPLATE" text NOT NULL,
  "UPDATED_BY" integer,
  "UPDATED_AT" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  "STATUS" smallint DEFAULT 1
);

-- ============================================================
-- PRIMARY KEYS
-- ============================================================
ALTER TABLE ONLY public.t_estado ADD PRIMARY KEY (estado_id);
ALTER TABLE ONLY public.t_municipio ADD PRIMARY KEY (municipio_id);
ALTER TABLE ONLY public.t_parroquia ADD PRIMARY KEY (parroquia_id);
ALTER TABLE ONLY public.t_address_type ADD PRIMARY KEY (address_type_id);
ALTER TABLE ONLY public.t_address ADD PRIMARY KEY (address_id);
ALTER TABLE ONLY public.t_institution_address ADD PRIMARY KEY (institution_address_id);
ALTER TABLE ONLY public.t_person_address ADD PRIMARY KEY (person_address_id);
ALTER TABLE ONLY public.t_chat_config ADD PRIMARY KEY (config_id);
ALTER TABLE ONLY public.t_coordinadores ADD PRIMARY KEY ("COORDINADOR_ID");
ALTER TABLE ONLY public.t_email_templates ADD PRIMARY KEY (id);
ALTER TABLE ONLY public.t_knowledge_base ADD PRIMARY KEY (id);
ALTER TABLE ONLY public.t_person_merge_log ADD PRIMARY KEY (log_id);
ALTER TABLE ONLY public.t_report_text_templates ADD PRIMARY KEY ("TEMPLATE_ID");

-- ============================================================
-- UNIQUE CONSTRAINTS
-- ============================================================
ALTER TABLE ONLY public.t_address_type ADD UNIQUE (code);
ALTER TABLE ONLY public.t_address ADD UNIQUE (uuid);
ALTER TABLE ONLY public.t_institution_address ADD UNIQUE (institution_id, address_id, address_type_id);
ALTER TABLE ONLY public.t_person_address ADD UNIQUE (person_id, address_id, address_type_id);
ALTER TABLE ONLY public.t_report_text_templates ADD UNIQUE ("REPORT_TYPE", "SECTION");

-- ============================================================
-- FOREIGN KEYS
-- ============================================================
ALTER TABLE ONLY public.t_municipio ADD CONSTRAINT fk_municipio_estado
  FOREIGN KEY (estado_id) REFERENCES public.t_estado(estado_id);
ALTER TABLE ONLY public.t_parroquia ADD CONSTRAINT fk_parroquia_municipio
  FOREIGN KEY (municipio_id) REFERENCES public.t_municipio(municipio_id);
ALTER TABLE ONLY public.t_address ADD CONSTRAINT fk_address_parroquia
  FOREIGN KEY (parroquia_id) REFERENCES public.t_parroquia(parroquia_id);
ALTER TABLE ONLY public.t_institution_address ADD CONSTRAINT fk_institution_address_institution
  FOREIGN KEY (institution_id) REFERENCES public.t_institution("INSTITUTION_ID") ON DELETE CASCADE;
ALTER TABLE ONLY public.t_institution_address ADD CONSTRAINT fk_institution_address_type
  FOREIGN KEY (address_type_id) REFERENCES public.t_address_type(address_type_id);
ALTER TABLE ONLY public.t_institution_address ADD CONSTRAINT fk_institution_address_address
  FOREIGN KEY (address_id) REFERENCES public.t_address(address_id);
ALTER TABLE ONLY public.t_person_address ADD CONSTRAINT fk_person_address_person
  FOREIGN KEY (person_id) REFERENCES public.t_persons(person_id) ON DELETE CASCADE;
ALTER TABLE ONLY public.t_person_address ADD CONSTRAINT fk_person_address_type
  FOREIGN KEY (address_type_id) REFERENCES public.t_address_type(address_type_id);
ALTER TABLE ONLY public.t_person_address ADD CONSTRAINT fk_person_address_address
  FOREIGN KEY (address_id) REFERENCES public.t_address(address_id);
ALTER TABLE ONLY public.t_coordinadores ADD CONSTRAINT fk_coordinadores_career
  FOREIGN KEY ("CAREER_ID") REFERENCES public.t_career("CAREER_ID");

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS t_address_parroquia_id_idx ON public.t_address USING btree (parroquia_id);
CREATE INDEX IF NOT EXISTS idx_chat_config_user_id ON public.t_chat_config USING btree (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_chat_config_user_unique ON public.t_chat_config USING btree (user_id);
CREATE INDEX IF NOT EXISTS t_institution_address_address_id_idx ON public.t_institution_address USING btree (address_id);
CREATE INDEX IF NOT EXISTS t_institution_address_institution_id_idx ON public.t_institution_address USING btree (institution_id);
CREATE UNIQUE INDEX IF NOT EXISTS t_institution_address_one_primary_idx ON public.t_institution_address USING btree (institution_id, address_type_id) WHERE (is_primary = true);
CREATE INDEX IF NOT EXISTS idx_kb_category ON public.t_knowledge_base USING btree (category);
CREATE INDEX IF NOT EXISTS idx_kb_active ON public.t_knowledge_base USING btree (is_active);
CREATE INDEX IF NOT EXISTS t_municipio_estado_id_idx ON public.t_municipio USING btree (estado_id);
CREATE INDEX IF NOT EXISTS t_parroquia_municipio_id_idx ON public.t_parroquia USING btree (municipio_id);
CREATE INDEX IF NOT EXISTS t_person_address_person_id_idx ON public.t_person_address USING btree (person_id);
CREATE INDEX IF NOT EXISTS t_person_address_address_id_idx ON public.t_person_address USING btree (address_id);
CREATE UNIQUE INDEX IF NOT EXISTS t_person_address_one_primary_idx ON public.t_person_address USING btree (person_id, address_type_id) WHERE (is_primary = true);

-- ============================================================
-- CHECK CONSTRAINTS
-- ============================================================
ALTER TABLE ONLY public.t_knowledge_base ADD CONSTRAINT chk_knowledge_base_category
  CHECK (category = ANY (ARRAY['regulation'::text, 'curriculum'::text, 'process'::text, 'faq'::text, 'general'::text]));

-- ponytail: re-enable FK checks
SET session_replication_role = default;
