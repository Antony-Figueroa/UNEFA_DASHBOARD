/**
 * @file Pre-enrollment timeout auto-cancel utility.
 * @description Checks for PRE_INSCRITO practices that haven't been converted
 * to INSCRITO within the configured timeout period and auto-cancels them
 * by setting PRACTICES_STATUS to RETIRADO(0).
 *
 * D-03 decision: After X days without converting to enrollment, mark as
 * RETIRADO and notify the admin. The student can re-enroll in the next period.
 */

import { PRACTICES_STATUS } from '../constants/practice-status.constants.js';

const DEFAULT_TIMEOUT_DAYS = 30;

export interface TimeoutResult {
  cancelled: number;
  practices: Array<{
    practiceId: number;
    studentName: string;
    studentCi: string;
    careerName: string;
    createdAt: string;
    daysSinceCreation: number;
  }>;
}

/**
 * Finds PRE_INSCRITO practices older than timeoutDays and marks them as RETIRADO(0).
 *
 * @param supabase - Database client
 * @param timeoutDays - Number of days before auto-cancel (default: 30)
 * @returns Cancelled count and details
 */
export async function checkPreEnrollmentTimeouts(
  supabase: any,
  timeoutDays: number = DEFAULT_TIMEOUT_DAYS,
): Promise<TimeoutResult> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - timeoutDays);
  const cutoffISO = cutoffDate.toISOString();

  // 1. Find PRE_INSCRITO practices created before the cutoff
  const { data: stalePractices, error: queryError } = await supabase
    .from('t_professional_practices')
    .select(`
      PROFESSIONAL_PRACTICE_ID,
      CREATED_AT,
      t_students!inner (
        FIRST_NAME,
        LAST_NAME,
        DOCUMENT_ID
      ),
      t_career!inner (
        NAME
      )
    `)
    .eq('PRACTICES_STATUS', PRACTICES_STATUS.PRE_INSCRITO)
    .eq('STATUS', 1)
    .lt('CREATED_AT', cutoffISO);

  if (queryError) {
    console.error('[PreEnrollTimeout] Error querying stale practices:', queryError);
    return { cancelled: 0, practices: [] };
  }

  if (!stalePractices || stalePractices.length === 0) {
    return { cancelled: 0, practices: [] };
  }

  // 2. Update each practice to RETIRADO
  const practiceIds = stalePractices.map((p: any) => p.PROFESSIONAL_PRACTICE_ID);

  const { error: updateError } = await supabase
    .from('t_professional_practices')
    .update({ PRACTICES_STATUS: PRACTICES_STATUS.RETIRADO })
    .in('PROFESSIONAL_PRACTICE_ID', practiceIds);

  if (updateError) {
    console.error('[PreEnrollTimeout] Error updating practices:', updateError);
    return { cancelled: 0, practices: [] };
  }

  // 3. Build result
  const now = new Date();
  const practices = stalePractices.map((p: any) => {
    const createdAt = new Date(p.CREATED_AT);
    const daysSince = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
    const student = p.t_students || {};
    const career = p.t_career || {};

    return {
      practiceId: p.PROFESSIONAL_PRACTICE_ID,
      studentName: `${student.FIRST_NAME || ''} ${student.LAST_NAME || ''}`.trim(),
      studentCi: student.DOCUMENT_ID || '',
      careerName: career.NAME || '',
      createdAt: p.CREATED_AT,
      daysSinceCreation: daysSince,
    };
  });

  return {
    cancelled: practiceIds.length,
    practices,
  };
}

/**
 * Preview: find PRE_INSCRITO practices that WOULD be cancelled (without actually cancelling).
 * Useful for showing a warning before the admin triggers the timeout check.
 */
export async function previewTimeoutPractices(
  supabase: any,
  timeoutDays: number = DEFAULT_TIMEOUT_DAYS,
): Promise<Omit<TimeoutResult, 'cancelled'> & { wouldCancel: number }> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - timeoutDays);
  const cutoffISO = cutoffDate.toISOString();

  const { data: stalePractices, error: queryError } = await supabase
    .from('t_professional_practices')
    .select(`
      PROFESSIONAL_PRACTICE_ID,
      CREATED_AT,
      t_students!inner (
        FIRST_NAME,
        LAST_NAME,
        DOCUMENT_ID
      ),
      t_career!inner (
        NAME
      )
    `)
    .eq('PRACTICES_STATUS', PRACTICES_STATUS.PRE_INSCRITO)
    .eq('STATUS', 1)
    .lt('CREATED_AT', cutoffISO);

  if (queryError || !stalePractices || stalePractices.length === 0) {
    return { wouldCancel: 0, practices: [] };
  }

  const now = new Date();
  const practices = stalePractices.map((p: any) => {
    const createdAt = new Date(p.CREATED_AT);
    const daysSince = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
    const student = p.t_students || {};
    const career = p.t_career || {};

    return {
      practiceId: p.PROFESSIONAL_PRACTICE_ID,
      studentName: `${student.FIRST_NAME || ''} ${student.LAST_NAME || ''}`.trim(),
      studentCi: student.DOCUMENT_ID || '',
      careerName: career.NAME || '',
      createdAt: p.CREATED_AT,
      daysSinceCreation: daysSince,
    };
  });

  return { wouldCancel: practices.length, practices };
}
