/**
 * verify-bug11-formats.ts
 *
 * Verification harness for BUG-11 (Relación Individual de Tutores) formatter
 * output strings. The production formatters live as LOCAL closures inside the
 * `tutores-academicos` case of reports.controller.ts (ADR-4: keep local, do not
 * export), so there is no backend vitest harness. This config-free tsx script
 * REPRODUCES the exact production logic and asserts the required output strings.
 *
 * Run: npm run verify:bug11  (in backend/)
 */
import assert from 'node:assert/strict';

// ── Reproducción de la lógica de producción ────────────────────────────────
// formatCI (reports.controller.ts, case tutores-academicos)
function formatCI(ci: string | null | undefined): string {
  if (!ci) return '';
  const raw = String(ci).trim();
  // Preservar prefijo E- (extranjero); venezolano usa V-. Sin puntos.
  const prefix = /^E-?/i.test(raw) ? 'E' : 'V';
  const digits = raw.replace(/\D/g, '');
  if (!digits) return raw;
  return `${prefix}-${digits}`;
}

// formatRif (reports.controller.ts, case tutores-academicos) → 'G - 20008795 - 1'
function formatRif(rif: string | null | undefined): string {
  if (!rif) return '';
  const clean = String(rif).replace(/[\s\-]/g, '');
  if (clean.length >= 10) {
    const letter = clean.charAt(0).toUpperCase();
    const numbers = clean.slice(1);
    return `${letter} - ${numbers.slice(0, 8)} - ${numbers.slice(8, 9)}`;
  }
  return riffallback(rif);
}
function riffallback(rif: string | null | undefined): string {
  return String(rif ?? '');
}

// formatPhone (reports.controller.ts) → '0000 - 0000000'
function formatPhone(phone: string | null | undefined): string {
  if (!phone) return '';
  const digits = String(phone).replace(/[\s\-\(\)]/g, '');
  if (digits.length === 11) return `${digits.slice(0, 4)} - ${digits.slice(4)}`;
  return String(phone);
}

// tutorInst concat (reports.controller.ts) → 'TITULO NOMBRE APELLIDO. TELÉFONO: 0000 - 0000000'
function tutorInstConcat(
  instTitulo: string,
  instName: string,
  instSurname: string,
  instPhone: string
): string {
  const name = [instTitulo, instName, instSurname]
    .map((s) => (s || '').trim())
    .filter(Boolean)
    .join(' ');
  if (!name) return '';
  return `${name}. TELÉFONO: ${formatPhone(instPhone)}`;
}

// stripPeriodPrefix → elimina el 'Período:' redundante
function stripPeriodPrefix(label: string): string {
  return label.replace(/^Período:\s*/i, '');
}

// ── Aserciones ────────────────────────────────────────────────────────────
// Cédula: V- + dígitos continuos, sin puntos (A-6)
assert.equal(formatCI('V-12345678'), 'V-12345678');
assert.equal(formatCI('12.345.678'), 'V-12345678');
assert.equal(formatCI('E-12345678'), 'E-12345678');
assert.equal(formatCI(''), '');
assert.equal(formatCI('   '), '');

// RIF: letra - 8 dígitos - 1 dígito, con espacios alrededor de los guiones (A-5)
assert.equal(formatRif('G-20008795-1'), 'G - 20008795 - 1');
assert.equal(formatRif('G200087951'), 'G - 20008795 - 1');
assert.equal(formatRif('J-30987654-4'), 'J - 30987654 - 4');
assert.equal(formatRif(''), '');

// Teléfono: 0000 - 0000000 (existente, se mantiene)
assert.equal(formatPhone('0000-0000000'), '0000 - 0000000');
assert.equal(formatPhone('04140000000'), '0414 - 0000000');
assert.equal(formatPhone('0414 000 00 00'), '0414 - 0000000');
assert.equal(formatPhone(''), '');

// Tutor institucional: TITULO NOMBRE APELLIDO. TELÉFONO: 0000 - 0000000
assert.equal(
  tutorInstConcat('Licenciado', 'Juan', 'Pérez', '0000-0000000'),
  'Licenciado Juan Pérez. TELÉFONO: 0000 - 0000000'
);
// espacios vacíos en título/nombre se recortan
assert.equal(
  tutorInstConcat('', 'Juan', 'Pérez', '0000-0000000'),
  'Juan Pérez. TELÉFONO: 0000 - 0000000'
);
assert.equal(tutorInstConcat('', '', '', '0000-0000000'), '');

// stripPeriodPrefix: sin 'Período:' redundante
assert.equal(stripPeriodPrefix('Período: 2026-1'), '2026-1');
assert.equal(stripPeriodPrefix('Período: Todos'), 'Todos');
assert.equal(stripPeriodPrefix('2026-1'), '2026-1');

console.log('PASS: verify-bug11-formats — all formatter strings asserted.');
