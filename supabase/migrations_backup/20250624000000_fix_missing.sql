SET session_replication_role = replica;

-- Recreate dropped tables with correct case
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

CREATE TABLE IF NOT EXISTS public.t_report_text_templates (
  "TEMPLATE_ID" SERIAL NOT NULL,
  "REPORT_TYPE" character varying(50) NOT NULL,
  "SECTION" character varying(50) NOT NULL,
  "CONTENT_TEMPLATE" text NOT NULL,
  "UPDATED_BY" integer,
  "UPDATED_AT" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  "STATUS" smallint DEFAULT 1
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name='t_coordinadores' AND constraint_type='PRIMARY KEY') THEN
    ALTER TABLE ONLY public.t_coordinadores ADD PRIMARY KEY ("COORDINADOR_ID");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name='t_report_text_templates' AND constraint_type='PRIMARY KEY') THEN
    ALTER TABLE ONLY public.t_report_text_templates ADD PRIMARY KEY ("TEMPLATE_ID");
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name='t_email_templates' AND constraint_type='PRIMARY KEY') THEN
    ALTER TABLE ONLY public.t_email_templates ADD PRIMARY KEY (id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name='t_knowledge_base' AND constraint_type='PRIMARY KEY') THEN
    ALTER TABLE ONLY public.t_knowledge_base ADD PRIMARY KEY (id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE table_name='t_person_merge_log' AND constraint_type='PRIMARY KEY') THEN
    ALTER TABLE ONLY public.t_person_merge_log ADD PRIMARY KEY (log_id);
  END IF;
END $$;

ALTER TABLE ONLY public.t_address_type ADD UNIQUE (code);
ALTER TABLE ONLY public.t_address ADD UNIQUE (uuid);
ALTER TABLE ONLY public.t_institution_address ADD UNIQUE (institution_id, address_id, address_type_id);
ALTER TABLE ONLY public.t_person_address ADD UNIQUE (person_id, address_id, address_type_id);
ALTER TABLE ONLY public.t_report_text_templates ADD UNIQUE ("REPORT_TYPE", "SECTION");

ALTER TABLE ONLY public.t_municipio ADD CONSTRAINT fk_municipio_estado FOREIGN KEY (estado_id) REFERENCES public.t_estado(estado_id);
ALTER TABLE ONLY public.t_parroquia ADD CONSTRAINT fk_parroquia_municipio FOREIGN KEY (municipio_id) REFERENCES public.t_municipio(municipio_id);
ALTER TABLE ONLY public.t_address ADD CONSTRAINT fk_address_parroquia FOREIGN KEY (parroquia_id) REFERENCES public.t_parroquia(parroquia_id);
ALTER TABLE ONLY public.t_institution_address ADD CONSTRAINT fk_institution_address_institution FOREIGN KEY (institution_id) REFERENCES public.t_institution("INSTITUTION_ID") ON DELETE CASCADE;
ALTER TABLE ONLY public.t_institution_address ADD CONSTRAINT fk_institution_address_type FOREIGN KEY (address_type_id) REFERENCES public.t_address_type(address_type_id);
ALTER TABLE ONLY public.t_institution_address ADD CONSTRAINT fk_institution_address_address FOREIGN KEY (address_id) REFERENCES public.t_address(address_id);
ALTER TABLE ONLY public.t_person_address ADD CONSTRAINT fk_person_address_person FOREIGN KEY (person_id) REFERENCES public.t_persons(person_id) ON DELETE CASCADE;
ALTER TABLE ONLY public.t_person_address ADD CONSTRAINT fk_person_address_type FOREIGN KEY (address_type_id) REFERENCES public.t_address_type(address_type_id);
ALTER TABLE ONLY public.t_person_address ADD CONSTRAINT fk_person_address_address FOREIGN KEY (address_id) REFERENCES public.t_address(address_id);
ALTER TABLE ONLY public.t_coordinadores ADD CONSTRAINT fk_coordinadores_career FOREIGN KEY ("CAREER_ID") REFERENCES public.t_career("CAREER_ID");

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

ALTER TABLE ONLY public.t_knowledge_base ADD CONSTRAINT chk_knowledge_base_category CHECK (category = ANY (ARRAY['regulation'::text, 'curriculum'::text, 'process'::text, 'faq'::text, 'general'::text]));

SET session_replication_role = default;
