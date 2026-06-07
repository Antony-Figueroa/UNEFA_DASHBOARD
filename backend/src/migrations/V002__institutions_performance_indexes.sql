-- V002: Institutions Performance Indexes
-- Adds missing indexes on pivot and lookup tables used by institutions/responsibles queries.
-- These indexes enable Index Scan instead of Seq Scan for JOINs and filtered lookups.

CREATE INDEX IF NOT EXISTS idx_manager_institution_manager_id ON t_institution_manager_institution(MANAGER_ID);
CREATE INDEX IF NOT EXISTS idx_manager_institution_institution_id ON t_institution_manager_institution(INSTITUTION_ID);
CREATE INDEX IF NOT EXISTS idx_institution_internship_type_inst ON t_institution_internship_type(INSTITUTION_ID);
CREATE INDEX IF NOT EXISTS idx_institution_internship_type_type ON t_institution_internship_type(INTERNSHIP_TYPE_ID);
CREATE INDEX IF NOT EXISTS idx_value_list_status ON t_value_list(STATUS);
CREATE INDEX IF NOT EXISTS idx_internship_type_status ON t_internship_type(STATUS);
CREATE INDEX IF NOT EXISTS idx_professional_practices_inst_status ON t_professional_practices(INSTITUTION_ID, STATUS);
