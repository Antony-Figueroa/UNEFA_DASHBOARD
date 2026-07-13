/**
 * @file auto-pre-enrollment.ts
 * @description Utility to auto-create a PRE_INSCRITO practice record for the next
 * internship type in sequence when a practice reaches CULMINADO with passing grade.
 *
 * Guards:
 *   1. Career has AUTO_PRE_ENROLL = false → skip
 *   2. Current type PRIORITY = 0 (standalone) → skip
 *   3. No next type in sequence → skip
 *   4. Duplicate PRE_INSCRITO already exists → skip
 *   5. Insert error → log and skip
 *
 * Design: NEVER throws. All errors are caught, logged, and returned as result.
 */

import { PRACTICES_STATUS } from '../constants/practice-status.constants.js';

/**
 * Data required from the culminated practice to create the next pre-inscription.
 */
export interface CulminatedPractice {
  PROFESSIONAL_PRACTICE_ID: number;
  STUDENTS_ID: number;
  CAREER_ID: number;
  INTERNSHIP_TYPE_ID: number;
  PERIOD_ID: number;
  SEMESTER: string | null;
  SECTION: string | null;
  REGIME: string | null;
  ENROLLMENT: string;
  INSTITUTION_ID: number | null;
  MANAGER_ID: number | null;
  GRADE: number | null;
}

export interface AutoPreEnrollResult {
  created: boolean;
  reason?: string;
}

/**
 * Attempts to auto-create a PRE_INSCRITO record for the next internship type
 * after a practice is culminated with a passing grade.
 *
 * @param supabase - Supabase client (or compatible query interface)
 * @param practice - The culminated practice data
 * @param auditReq - Optional Express request for audit logging (unused in V1, future)
 * @returns Result indicating success or the guard that blocked creation
 */
export async function triggerAutoPreEnrollment(
  supabase: any,
  practice: CulminatedPractice,
  _auditReq?: any
): Promise<AutoPreEnrollResult> {
  try {
    // ── Guard 1: Check career AUTO_PRE_ENROLL setting ──────────────
    const { data: career, error: careerError } = await supabase
      .from('t_career')
      .select('AUTO_PRE_ENROLL')
      .eq('CAREER_ID', practice.CAREER_ID)
      .maybeSingle();

    if (careerError) {
      console.error('[AutoPreEnroll] Error fetching career:', careerError);
      return { created: false, reason: `career_lookup_error: ${careerError.message || 'unknown'}` };
    }

    if (!career || career.AUTO_PRE_ENROLL === false) {
      return { created: false, reason: 'career_auto_pre_enroll_disabled' };
    }

    // ── Guard 2: Check current type PRIORITY ───────────────────────
    const { data: currentType, error: typeError } = await supabase
      .from('t_internship_type')
      .select('PRIORITY')
      .eq('INTERNSHIP_TYPE_ID', practice.INTERNSHIP_TYPE_ID)
      .maybeSingle();

    if (typeError) {
      console.error('[AutoPreEnroll] Error fetching internship type:', typeError);
      return { created: false, reason: `type_lookup_error: ${typeError.message || 'unknown'}` };
    }

    if (!currentType || currentType.PRIORITY === 0) {
      return { created: false, reason: 'standalone_type' };
    }

    // ── Guard 3: Find next type in sequence ─────────────────────────
    // Step 3a: Get this career's internship type IDs
    const { data: careerTypes, error: ctError } = await supabase
      .from('t_career_internship_type')
      .select('INTERNSHIP_TYPE_ID')
      .eq('CAREER_ID', practice.CAREER_ID);

    if (ctError) {
      console.error('[AutoPreEnroll] Error fetching career types:', ctError);
      return { created: false, reason: `career_types_error: ${ctError.message || 'unknown'}` };
    }

    const typeIds = (careerTypes || []).map((ct: any) => ct.INTERNSHIP_TYPE_ID);

    if (typeIds.length === 0) {
      return { created: false, reason: 'last_in_sequence' };
    }

    // Step 3b: Find the next type (lowest PRIORITY > current, within career's types)
    const { data: nextType, error: nextTypeError } = await supabase
      .from('t_internship_type')
      .select('INTERNSHIP_TYPE_ID')
      .in('INTERNSHIP_TYPE_ID', typeIds)
      .gt('PRIORITY', currentType.PRIORITY)
      .order('PRIORITY', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (nextTypeError) {
      console.error('[AutoPreEnroll] Error fetching next type:', nextTypeError);
      return { created: false, reason: `next_type_lookup_error: ${nextTypeError.message || 'unknown'}` };
    }

    if (!nextType) {
      return { created: false, reason: 'last_in_sequence' };
    }

    // ── Guard 4: Check for duplicate pre-enrollment ─────────────────
    const { data: existing, error: dupError } = await supabase
      .from('t_professional_practices')
      .select('PROFESSIONAL_PRACTICE_ID')
      .eq('STUDENTS_ID', practice.STUDENTS_ID)
      .eq('INTERNSHIP_TYPE_ID', nextType.INTERNSHIP_TYPE_ID)
      .eq('PERIOD_ID', practice.PERIOD_ID)
      .eq('PRACTICES_STATUS', PRACTICES_STATUS.PRE_INSCRITO)
      .eq('STATUS', 1)
      .maybeSingle();

    if (dupError) {
      console.error('[AutoPreEnroll] Error checking duplicate:', dupError);
      return { created: false, reason: `duplicate_check_error: ${dupError.message || 'unknown'}` };
    }

    if (existing) {
      return { created: false, reason: 'duplicate_pre_enrollment' };
    }

    // ── Insert PRE_INSCRITO record ──────────────────────────────────
    const newPractice = {
      STUDENTS_ID: practice.STUDENTS_ID,
      CAREER_ID: practice.CAREER_ID,
      INTERNSHIP_TYPE_ID: nextType.INTERNSHIP_TYPE_ID,
      PERIOD_ID: practice.PERIOD_ID,
      SEMESTER: practice.SEMESTER,
      SECTION: practice.SECTION,
      REGIME: practice.REGIME,
      ENROLLMENT: practice.ENROLLMENT,
      INSTITUTION_ID: practice.INSTITUTION_ID,
      MANAGER_ID: practice.MANAGER_ID,
      PRACTICES_STATUS: PRACTICES_STATUS.PRE_INSCRITO,
      PREVIOUS_PRACTICE_ID: practice.PROFESSIONAL_PRACTICE_ID,
      START_DATE: new Date().toISOString(),
      END_DATE: new Date().toISOString(),
      REPORT_TITLE: '',
      REGISTRATION_DATE: new Date().toISOString(),
      CREATION_DATE: new Date().toISOString(),
      OBSERVATION: 'Auto pre-inscrito desde culminación de práctica anterior',
      STATUS: 1,
      TRANSFER: 0,
      INTERNSHIP_STATUS: 1,
    };

    // Guard 5: Insert with error handling
    const { error: insertError } = await supabase
      .from('t_professional_practices')
      .insert(newPractice);

    if (insertError) {
      console.error('[AutoPreEnroll] Error inserting pre-enrollment:', insertError);
      return { created: false, reason: `insert_error: ${insertError.message || 'unknown'}` };
    }

    console.log(
      `[AutoPreEnroll] Practice ${practice.PROFESSIONAL_PRACTICE_ID} → ` +
      `Created PRE_INSCRITO for student ${practice.STUDENTS_ID}, ` +
      `type ${nextType.INTERNSHIP_TYPE_ID}`
    );

    return { created: true };
  } catch (err) {
    console.error('[AutoPreEnroll] Unexpected error:', err);
    return {
      created: false,
      reason: `insert_error: ${err instanceof Error ? err.message : 'unexpected error'}`,
    };
  }
}
