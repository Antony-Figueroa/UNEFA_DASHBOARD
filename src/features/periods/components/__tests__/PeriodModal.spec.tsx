import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ThemeProvider } from '../../../../context/ThemeContext';
import PeriodModal from '../PeriodModal';
import { Periodo } from '../../types';

describe('PeriodModal reglas de negocio', () => {
  it('En Curso: solo endDate editable; otros campos deshabilitados', () => {
    const periodoEnCurso: Periodo = {
      periodId: 'p1',
      description: '2025-I',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-04-23'),
      creationDate: new Date(),
      periodStatus: 2,
      status: true,
    };

    render(
      <ThemeProvider>
        <PeriodModal
          isOpen
          onClose={() => { }}
          onSave={() => { }}
          periodo={periodoEnCurso}
          isLoading={false}
          existingPeriods={[]}
        />
      </ThemeProvider>
    );

    const selects = document.body.querySelectorAll('select');
    expect(selects.length).toBeGreaterThan(0);

    const inputs = Array.from(document.body.querySelectorAll('input'));
    const hasDisabledInput = inputs.some((i) => i.disabled);
    const hasEnabledInput = inputs.some((i) => !i.disabled);
    expect(hasDisabledInput).toBe(true);
    expect(hasEnabledInput).toBe(true);
  });
});
