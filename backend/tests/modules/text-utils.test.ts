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

  // ================================================================
  // Real-world use cases (text-consistency-fixes)
  // ================================================================

  it('should sanitize notification title/message', () => {
    expect(sanitizeText('  período  por  finalizar  ')).toBe('PERÍODO POR FINALIZAR');
    expect(sanitizeText('Quedan 3 días para finalizar')).toBe('QUEDAN 3 DÍAS PARA FINALIZAR');
  });

  it('should sanitize address fields', () => {
    expect(sanitizeText('  Av.  Principal  Los  Ilustres  ')).toBe('AV. PRINCIPAL LOS ILUSTRES');
    expect(sanitizeText('Casa  Blanca,  detrás  del  mercado')).toBe('CASA BLANCA, DETRÁS DEL MERCADO');
  });

  it('should sanitize activity description', () => {
    expect(sanitizeText('  revisión  de  expedientes  ')).toBe('REVISIÓN DE EXPEDIENTES');
    expect(sanitizeText('Elaboración de informes mensuales')).toBe('ELABORACIÓN DE INFORMES MENSUALES');
  });

  it('should sanitize student request subject/description', () => {
    expect(sanitizeText('  Solicitud  de  Cambio  de  Tutor  ')).toBe('SOLICITUD DE CAMBIO DE TUTOR');
    expect(sanitizeText('Necesito cambiar de tutor porque...')).toBe('NECESITO CAMBIAR DE TUTOR PORQUE...');
  });

  it('should sanitize visit observations', () => {
    expect(sanitizeText('  el  estudiante  presenta  avances  ')).toBe('EL ESTUDIANTE PRESENTA AVANCES');
  });

  it('should sanitize supervisor comments', () => {
    expect(sanitizeText('  aprobado  con  observaciones  ')).toBe('APROBADO CON OBSERVACIONES');
  });

  it('should sanitize enrollment observation', () => {
    expect(sanitizeText('  retiro  voluntario  -  motivos  personales  ')).toBe('RETIRO VOLUNTARIO - MOTIVOS PERSONALES');
  });
});
