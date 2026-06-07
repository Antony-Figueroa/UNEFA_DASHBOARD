-- V003: Optimize getInstitutionById with single RPC call
-- Combines 5 separate queries (main institution, responsables, careers, internship types, practice check)
-- into one query using subqueries. Reduces Supabase round-trips from 5 to 1.

CREATE OR REPLACE FUNCTION get_institution_by_id(p_id INTEGER)
RETURNS JSON
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'institution', row_to_json(i.*),
    'responsibleCount', (SELECT COUNT(*)::INTEGER FROM "t_institution_manager_institution" WHERE "INSTITUTION_ID" = p_id),
    'careerIds', COALESCE((SELECT json_agg("CAREER_ID") FROM "t_institution_career" WHERE "INSTITUTION_ID" = p_id), '[]'::json),
    'internshipTypeIds', COALESCE((SELECT json_agg("INTERNSHIP_TYPE_ID") FROM "t_institution_internship_type" WHERE "INSTITUTION_ID" = p_id), '[]'::json),
    'isInUse', (SELECT EXISTS (SELECT 1 FROM "t_professional_practices" WHERE "INSTITUTION_ID" = p_id AND "STATUS" = 1))
  )
  INTO result
  FROM "t_institution" i
  WHERE i."INSTITUTION_ID" = p_id;

  RETURN result;
END;
$$;
