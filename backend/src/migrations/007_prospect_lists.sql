-- ============================================================
-- Migration 007: Módulo de Prospectos - Listas de Prospectos
-- ============================================================

CREATE TABLE IF NOT EXISTS "t_prospect_lists" (
  "LIST_ID" SERIAL NOT NULL,
  "NAME" VARCHAR(255) NOT NULL,
  "DESCRIPTION" TEXT,
  "PERIOD_ID" INTEGER NOT NULL,
  "STATUS" SMALLINT NOT NULL DEFAULT 1,
  "CREATED_AT" TIMESTAMP NOT NULL DEFAULT NOW(),
  "UPDATED_AT" TIMESTAMP NOT NULL DEFAULT NOW(),
  "CREATED_BY" INTEGER,
  PRIMARY KEY ("LIST_ID")
);

ALTER TABLE "t_prospect_lists"
  ADD CONSTRAINT "fk_prospect_lists_period"
  FOREIGN KEY ("PERIOD_ID") REFERENCES "t_internships_period" ("PERIOD_ID");

ALTER TABLE "t_prospect_lists"
  ADD CONSTRAINT "fk_prospect_lists_user"
  FOREIGN KEY ("CREATED_BY") REFERENCES "t_user" ("USER_ID");

CREATE TABLE IF NOT EXISTS "t_prospect_list_items" (
  "ITEM_ID" SERIAL NOT NULL,
  "LIST_ID" INTEGER NOT NULL,
  "STUDENTS_ID" INTEGER NOT NULL,
  "ENROLLED" BOOLEAN NOT NULL DEFAULT FALSE,
  "NOTES" TEXT,
  "ADDED_AT" TIMESTAMP NOT NULL DEFAULT NOW(),
  "ADDED_BY" INTEGER,
  PRIMARY KEY ("ITEM_ID")
);

ALTER TABLE "t_prospect_list_items"
  ADD CONSTRAINT "fk_prospect_items_list"
  FOREIGN KEY ("LIST_ID") REFERENCES "t_prospect_lists" ("LIST_ID") ON DELETE CASCADE;

ALTER TABLE "t_prospect_list_items"
  ADD CONSTRAINT "fk_prospect_items_student"
  FOREIGN KEY ("STUDENTS_ID") REFERENCES "t_students" ("STUDENTS_ID");

ALTER TABLE "t_prospect_list_items"
  ADD CONSTRAINT "fk_prospect_items_user"
  FOREIGN KEY ("ADDED_BY") REFERENCES "t_user" ("USER_ID");

ALTER TABLE "t_prospect_list_items"
  ADD CONSTRAINT "uq_prospect_list_student"
  UNIQUE ("LIST_ID", "STUDENTS_ID");
