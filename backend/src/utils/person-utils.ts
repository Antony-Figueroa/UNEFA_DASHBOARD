/**
 * Safely extract a person field from a Supabase joined result.
 * Supabase returns related tables as arrays even with `!inner`,
 * so we must handle both array and object forms.
 */
export function getPersonField(
  person: unknown,
  field: string
): string | undefined {
  if (!person) return undefined;
  if (Array.isArray(person)) {
    return (person[0] as Record<string, unknown>)?.[field] as string | undefined;
  }
  return (person as Record<string, unknown>)?.[field] as string | undefined;
}

/**
 * Get full name from Supabase person join result.
 */
export function getPersonFullName(person: unknown): string {
  const first = getPersonField(person, 'first_name') || '';
  const last = getPersonField(person, 'last_name') || '';
  return `${first} ${last}`.trim();
}
