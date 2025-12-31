import { describe, it, expect } from 'vitest';
import { formatDate } from '../date';

describe('formatDate', () => {
  it('formatea Date válido', () => {
    const d = new Date('2024-05-10T00:00:00Z');
    const out = formatDate(d, 'es-VE');
    expect(out).toMatch(/2024/);
  });

  it('devuelve guion para fecha inválida', () => {
    const out = formatDate('fecha-invalida');
    expect(out).toBe('-');
  });

  it('formatea string de fecha', () => {
    const out = formatDate('2024-01-01', 'es-VE');
    expect(out).toMatch(/2024/);
  });
});

