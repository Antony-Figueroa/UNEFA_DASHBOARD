/**
 * @file reportConfig-export.test.tsx
 * @description Tests para currentTutorId y flujo de exportación
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('reportConfig — currentTutorId flow (Task 4.2/4.3)', () => {
  beforeEach(() => {
    // Reset module state
    vi.resetModules();
  });

  it('debería permitir establecer y leer currentTutorId', async () => {
    const { setCurrentTutorId, currentTutorId } = await import('../reportConfig');

    expect(currentTutorId).toBeUndefined();

    setCurrentTutorId(42);
    const { currentTutorId: updated } = await import('../reportConfig');
    expect(updated).toBe(42);

    setCurrentTutorId(undefined);
    const { currentTutorId: cleared } = await import('../reportConfig');
    expect(cleared).toBeUndefined();
  });

  it('debería retornar data vacía cuando loadData de relacion-individual-docente se llama sin tutorId', async () => {
    const { reportConfig, setCurrentTutorId } = await import('../reportConfig');
    setCurrentTutorId(undefined);

    const result = await reportConfig['relacion-individual-docente'].loadData(1);
    expect(result).toEqual({ data: [] });
  });
});
