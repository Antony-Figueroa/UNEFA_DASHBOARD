import { describe, it, expect } from 'vitest';
import { sanitizeText } from '../../src/utils/text-utils.js';

describe('sanitizeText', () => {
  // ================================================================
  // Happy path
  // ================================================================

  it('should trim spaces, collapse multiple spaces, and uppercase', () => {
    expect(sanitizeText('  jUaN  pÉrez  ')).toBe('JUAN PÉREZ');
  });

  it('should uppercase accented characters correctly', () => {
    expect(sanitizeText('María José')).toBe('MARÍA JOSÉ');
  });

  it('should uppercase ñ character correctly', () => {
    expect(sanitizeText('Ñandú')).toBe('ÑANDÚ');
  });

  it('should collapse multiple internal spaces', () => {
    expect(sanitizeText('de  la  Rosa')).toBe('DE LA ROSA');
  });

  it('should handle already uppercased text', () => {
    expect(sanitizeText('JUAN PÉREZ')).toBe('JUAN PÉREZ');
  });

  it('should handle single character', () => {
    expect(sanitizeText('a')).toBe('A');
  });

  it('should handle single word with leading/trailing spaces', () => {
    expect(sanitizeText('  médico  ')).toBe('MÉDICO');
  });

  it('should handle ü character', () => {
    expect(sanitizeText('RÜBNER')).toBe('RÜBNER');
  });

  // ================================================================
  // Null/undefined/empty
  // ================================================================

  it('should return null for null input', () => {
    expect(sanitizeText(null)).toBeNull();
  });

  it('should return null for undefined input', () => {
    expect(sanitizeText(undefined)).toBeNull();
  });

  it('should return null for empty string', () => {
    expect(sanitizeText('')).toBeNull();
  });

  it('should return null for whitespace-only string', () => {
    expect(sanitizeText('   ')).toBeNull();
  });

  it('should return null for tab characters', () => {
    expect(sanitizeText('\t\n ')).toBeNull();
  });

  // ================================================================
  // Edge cases
  // ================================================================

  it('should handle text with only special characters', () => {
    expect(sanitizeText('  C.A.  ')).toBe('C.A.');
  });

  it('should handle mixed case with numbers', () => {
    expect(sanitizeText('Edificio 3B')).toBe('EDIFICIO 3B');
  });

  it('should not collapse single spaces', () => {
    expect(sanitizeText('JUAN CARLOS')).toBe('JUAN CARLOS');
  });

  it('should handle very long names without error', () => {
    const longName = 'a'.repeat(500);
    const result = sanitizeText(longName);
    expect(result).toBe('A'.repeat(500));
  });
});
