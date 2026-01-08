import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '../../../../context/ThemeContext';
import PeriodTable from '../PeriodTable';
import { PeriodoRowData } from '../../types';

describe('PeriodTable acciones', () => {
  it('No muestra opción Iniciar/Activar para estado Pendiente', () => {
    const data: PeriodoRowData[] = [
      {
        periodId: 'p1',
        description: '2025-I',
        startDate: '01/01/2025',
        endDate: '04/23/2025',
        rawStartDate: new Date('2025-01-01'),
        rawEndDate: new Date('2025-04-23'),
        periodStatus: 1,
        status: true,
        progress: null,
        daysPassed: 0,
        daysRemaining: 0,
        weeksRemaining: 0,
      },
    ];

    render(
      <ThemeProvider>
        <PeriodTable
          data={data}
          status="success"
          error={null}
        />
      </ThemeProvider>
    );

    const iniciarButtons = screen.queryAllByText(/Iniciar/i);
    expect(iniciarButtons.length).toBe(0);
  });
});
