/**
 * @file period-type-dates.service.ts
 * @description Service for per-type period date resolution and CRUD operations.
 *
 * Feature flag: FEATURE_PERIOD_TYPE_DATES env var.
 * When off → only parent period dates are used (legacy behavior).
 * When on → t_period_type_dates is queried with fallback to parent period.
 */

import { dbManager } from '../lib/db-manager.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PeriodTypeDateRecord {
  ID: number;
  PERIOD_ID: number;
  INTERNSHIP_TYPE_ID: number;
  START_DATE: string | null;
  END_DATE: string | null;
  CREATION_DATE?: string;
  MODIF_USER_ID?: number | null;
  MODIF_USER_DATE?: string | null;
}

export interface PeriodDates {
  START_DATE: string;
  END_DATE: string;
}

// ---------------------------------------------------------------------------
// Feature flag
// ---------------------------------------------------------------------------

export function isFeatureEnabled(): boolean {
  return process.env.FEATURE_PERIOD_TYPE_DATES === 'true';
}

// ---------------------------------------------------------------------------
// Pure resolver logic (testable without DB)
// ---------------------------------------------------------------------------

/**
 * Resolves effective dates for a (periodId, internshipTypeId) pair.
 *
 * Pure function: given a type-date record (or null/undefined) and parent period
 * dates, returns the effective dates with fallback.
 *
 * @param typeRecord - The t_period_type_dates record for the pair, or null/undefined
 * @param periodDates - The parent period's START_DATE and END_DATE
 * @returns Resolved { startDate, endDate }
 */
export function resolveDatesFromRecord(
  typeRecord: { START_DATE: string | null; END_DATE: string | null } | null | undefined,
  periodDates: PeriodDates
): PeriodDates {
  if (!typeRecord) {
    return { START_DATE: periodDates.START_DATE, END_DATE: periodDates.END_DATE };
  }

  return {
    START_DATE: typeRecord.START_DATE ?? periodDates.START_DATE,
    END_DATE: typeRecord.END_DATE ?? periodDates.END_DATE,
  };
}

// ---------------------------------------------------------------------------
// DB-backed resolver
// ---------------------------------------------------------------------------

/**
 * Resolves effective dates for a (periodId, internshipTypeId) pair.
 * Checks FEATURE_PERIOD_TYPE_DATES flag first.
 *
 * When flag is ON:
 *   1. Query t_period_type_dates for the matching record
 *   2. If found and start/end are not null → use type-specific dates
 *   3. If missing or field NULL → fallback to parent period dates
 *
 * When flag is OFF → return parent period dates directly.
 */
export async function resolveDates(
  periodId: number,
  internshipTypeId: number
): Promise<PeriodDates> {
  // Step 1: Get parent period dates (always needed)
  const period = await dbManager.withRetry(async (supabase) => {
    const { data, error } = await supabase
      .from('t_internships_period')
      .select('START_DATE, END_DATE')
      .eq('PERIOD_ID', periodId)
      .single();

    if (error || !data) {
      throw new Error(`Periodo con ID ${periodId} no encontrado`);
    }
    return data as PeriodDates;
  }, 'resolveDates:getPeriod');

  // Step 2: If feature flag is off, return parent period dates only
  if (!isFeatureEnabled()) {
    return period;
  }

  // Step 3: Query type-specific dates
  const typeRecord = await dbManager.withRetry(async (supabase) => {
    const { data, error } = await supabase
      .from('t_period_type_dates')
      .select('START_DATE, END_DATE')
      .eq('PERIOD_ID', periodId)
      .eq('INTERNSHIP_TYPE_ID', internshipTypeId)
      .maybeSingle();

    if (error) throw error;
    return data as { START_DATE: string | null; END_DATE: string | null } | null;
  }, 'resolveDates:getTypeDates');

  // Step 4: Resolve with fallback
  return resolveDatesFromRecord(typeRecord, period);
}

// ---------------------------------------------------------------------------
// Period-type-dates CRUD helpers
// ---------------------------------------------------------------------------

/**
 * Gets all type-date records for a given period.
 */
export async function getTypeDatesByPeriod(periodId: number): Promise<PeriodTypeDateRecord[]> {
  return dbManager.withRetry(async (supabase) => {
    const { data, error } = await supabase
      .from('t_period_type_dates')
      .select('*')
      .eq('PERIOD_ID', periodId)
      .order('INTERNSHIP_TYPE_ID', { ascending: true });

    if (error) throw error;
    return (data || []) as PeriodTypeDateRecord[];
  }, 'getTypeDatesByPeriod');
}
