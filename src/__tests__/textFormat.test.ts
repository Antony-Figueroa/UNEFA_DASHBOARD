/**
 * @file textFormat.test.ts
 * @description Tests para las utilidades de formateo de texto.
 */

import { describe, it, expect } from 'vitest';
import { toTitleCase, normalizeForDisplay } from '../utils/textFormat';

describe('toTitleCase', () => {
  // ========== Null / Undefined / Empty ==========
  it('should return empty string for null', () => {
    expect(toTitleCase(null)).toBe('');
  });

  it('should return empty string for undefined', () => {
    expect(toTitleCase(undefined)).toBe('');
  });

  it('should return empty string for empty input', () => {
    expect(toTitleCase('')).toBe('');
  });

  it('should return empty string for whitespace-only input', () => {
    expect(toTitleCase('   ')).toBe('   ');
  });

  // ========== Lowercase exceptions ==========
  it('should keep exception words lowercase in middle of string', () => {
    expect(toTitleCase('JUAN DE LA CRUZ')).toBe('Juan de la Cruz');
  });

  it('should capitalize exception word when it is the first word', () => {
    expect(toTitleCase('DE LOS SANTOS')).toBe('De los Santos');
  });

  it('should keep "y" lowercase in the middle', () => {
    expect(toTitleCase('MARÍA Y JOSÉ')).toBe('María y José');
  });

  it('should keep all exception words lowercase in the middle', () => {
    expect(toTitleCase('LICENCIADO EN EDUCACIÓN')).toBe('Licenciado en Educación');
  });

  // ========== Accented characters ==========
  it('should preserve accented characters', () => {
    expect(toTitleCase('MARÍA JOSÉ')).toBe('María José');
  });

  it('should handle ñ character', () => {
    expect(toTitleCase('MUÑOZ')).toBe('Muñoz');
  });

  it('should handle ü character', () => {
    expect(toTitleCase('GÜEMES')).toBe('Güemes');
  });

  it('should handle accented first letters (Á, É, Í, Ó, Ú)', () => {
    expect(toTitleCase('ÁLVARO NÚÑEZ')).toBe('Álvaro Núñez');
  });

  // ========== Edge cases ==========
  it('should handle single character', () => {
    expect(toTitleCase('A')).toBe('A');
  });

  it('should handle numeric input unchanged', () => {
    expect(toTitleCase('123')).toBe('123');
  });

  it('should handle CEO style acronyms as regular Title Case', () => {
    expect(toTitleCase('CEO')).toBe('Ceo');
  });

  it('should handle abbreviations with dots', () => {
    expect(toTitleCase('S.A.S.')).toBe('S.a.s.');
  });

  // ========== Normal phrases ==========
  it('should convert simple two-word name', () => {
    expect(toTitleCase('JUAN PÉREZ')).toBe('Juan Pérez');
  });

  it('should convert full name with middle and second last', () => {
    expect(toTitleCase('MARÍA DEL CARMEN GARCÍA LÓPEZ')).toBe('María del Carmen García López');
  });

  it('should handle ÑANDÚ', () => {
    expect(toTitleCase('ÑANDÚ')).toBe('Ñandú');
  });

  it('should handle medical title', () => {
    expect(toTitleCase('MÉDICO CIRUJANO')).toBe('Médico Cirujano');
  });

  it('should handle multiple spaces between words', () => {
    expect(toTitleCase('  JUAN  PÉREZ  ')).toBe('  Juan  Pérez  ');
  });
});

describe('normalizeForDisplay', () => {
  it('should trim and title-case', () => {
    expect(normalizeForDisplay('  JUAN PÉREZ  ')).toBe('Juan Pérez');
  });

  it('should return empty for null', () => {
    expect(normalizeForDisplay(null)).toBe('');
  });

  it('should return empty for undefined', () => {
    expect(normalizeForDisplay(undefined)).toBe('');
  });

  it('should handle exception words correctly after trim', () => {
    expect(normalizeForDisplay('  DE LOS SANTOS  ')).toBe('De los Santos');
  });
});
