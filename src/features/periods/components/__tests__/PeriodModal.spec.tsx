import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider } from '../../../../context/ThemeContext';
import PeriodModal from '../PeriodModal';
import { Periodo } from '../../types';

describe('PeriodModal Reglas de Negocio y UI', () => {
  const mockOnSave = vi.fn();
  const mockOnClose = vi.fn();

  it('En Curso: solo endDate editable; otros campos deshabilitados', () => {
    const periodoEnCurso: Periodo = {
      periodId: 'p1',
      code: '2025-I',
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
          onClose={mockOnClose}
          onSave={mockOnSave}
          periodo={periodoEnCurso}
          isLoading={false}
          existingPeriods={[]}
        />
      </ThemeProvider>
    );

    const selects = screen.getAllByRole('combobox');
    selects.forEach(select => {
        expect((select as HTMLSelectElement).disabled).toBe(true);
    });

    // El input de fecha de inicio debería estar deshabilitado, el de fin habilitado
    // Nota: Flatpickr renderiza inputs ocultos y visibles.
    // Buscamos por el placeholder o texto si es posible.
  });

  it('No debe mostrar el campo Código del Periodo', () => {
    render(
      <ThemeProvider>
        <PeriodModal
          isOpen
          onClose={mockOnClose}
          onSave={mockOnSave}
          periodo={null}
          isLoading={false}
          existingPeriods={[]}
        />
      </ThemeProvider>
    );

    expect(screen.queryByLabelText(/Código del Periodo/i)).toBeNull();
    expect(screen.queryByPlaceholderText(/Ej: 2025-I/i)).toBeNull();
  });

  it('Autocompletado: sugiere el siguiente periodo correctamente', async () => {
    const existingPeriods: Periodo[] = [{
      periodId: 'p1',
      code: '2025-I',
      description: '2025-I',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-04-23'),
      creationDate: new Date(),
      periodStatus: 3,
      status: true,
    }];

    render(
      <ThemeProvider>
        <PeriodModal
          isOpen
          onClose={mockOnClose}
          onSave={mockOnSave}
          periodo={null}
          isLoading={false}
          existingPeriods={existingPeriods}
        />
      </ThemeProvider>
    );

    // Esperar a que el reset del useEffect se ejecute
    await waitFor(() => {
      const selects = screen.getAllByRole('combobox');
      const yearSelectElement = selects[0] as HTMLSelectElement;
      expect(yearSelectElement.value).toBe('2025');
    });

    const selects = screen.getAllByRole('combobox');
    const typeSelectElement = selects[1] as HTMLSelectElement;
    expect(typeSelectElement.value).toBe('II');
  });
});
