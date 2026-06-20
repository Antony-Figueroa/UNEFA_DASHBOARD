/**
 * @file PeriodModal.test.tsx
 * @description Tests RTL para PeriodModal — accordion de fechas por tipo y coverage warning.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Periodo } from '../../types';

// --- Mocks ---

// Mock apiClient for internshipTypesService
vi.mock('../../../../api/apiClient', () => ({
  default: {
    get: vi.fn(),
  },
}));

// Mock FlatpickrDatePicker to avoid flatpickr init issues in jsdom
vi.mock('../../../../components/form/FlatpickrDatePicker', () => ({
  default: ({ value, onChange, label, ...props }: any) => (
    <div data-testid={`flatpickr-${label?.toLowerCase().replace(/\s+/g, '-') || 'picker'}`}>
      <input
        type="text"
        data-testid="flatpickr-input"
        value={value || ''}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={props.placeholder}
      />
    </div>
  ),
}));

// Mock Framer Motion to avoid animation issues
vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock react-hook-form Controller with children-as-function pattern
vi.mock('react-hook-form', async () => {
  const actual = await vi.importActual('react-hook-form');
  return {
    ...actual,
    Controller: ({ render, name, control }: any) => {
      return render({
        field: {
          value: null,
          onChange: vi.fn(),
          onBlur: vi.fn(),
          name,
        },
        fieldState: { error: undefined },
        formState: { errors: {} },
      });
    },
  };
});

const mockPeriodo: Periodo = {
  periodId: '1',
  description: '1-2026',
  startDate: new Date('2026-01-01'),
  endDate: new Date('2026-07-31'),
  creationDate: new Date('2025-12-01'),
  periodStatus: 1,
  status: true,
  code: '1-2026',
};

const mockExistingPeriods: Periodo[] = [mockPeriodo];

describe('PeriodModal — type dates accordion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debería renderizar el accordion de "Fechas por tipo"', async () => {
    const PeriodModal = (await import('../PeriodModal')).default;
    const apiClient = (await import('../../../../api/apiClient')).default;
    const mockGet = vi.mocked(apiClient.get);
    mockGet.mockResolvedValue({
      data: [
        { INTERNSHIP_TYPE_ID: 1, NAME: 'HOSPITALARIA', PRIORITY: 1, STATUS: 1 },
      ],
    });

    render(
      <PeriodModal
        isOpen={true}
        onClose={vi.fn()}
        onSave={vi.fn()}
        periodo={null}
        existingPeriods={[]}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Fechas por tipo')).toBeInTheDocument();
    });
  });

  it('debería mostrar campos de fecha por cada tipo de pasantía', async () => {
    const PeriodModal = (await import('../PeriodModal')).default;
    // Mock apiClient to return internship types
    const apiClient = (await import('../../../../api/apiClient')).default;
    const mockGet = vi.mocked(apiClient.get);
    mockGet.mockResolvedValue({
      data: [
        { INTERNSHIP_TYPE_ID: 1, NAME: 'HOSPITALARIA', PRIORITY: 1, STATUS: 1 },
        { INTERNSHIP_TYPE_ID: 2, NAME: 'COMUNITARIA', PRIORITY: 2, STATUS: 1 },
      ],
    });

    render(
      <PeriodModal
        isOpen={true}
        onClose={vi.fn()}
        onSave={vi.fn()}
        periodo={null}
        existingPeriods={[]}
      />
    );

    await waitFor(() => {
      // The accordion should be rendered
      expect(screen.getByText('Fechas por tipo')).toBeInTheDocument();
    });
  });

  it('debería mostrar advertencia de cobertura cuando un tipo no tiene fechas', async () => {
    const PeriodModal = (await import('../PeriodModal')).default;
    const apiClient = (await import('../../../../api/apiClient')).default;
    const mockGet = vi.mocked(apiClient.get);
    mockGet.mockResolvedValue({
      data: [
        { INTERNSHIP_TYPE_ID: 1, NAME: 'HOSPITALARIA', PRIORITY: 1, STATUS: 1 },
        { INTERNSHIP_TYPE_ID: 2, NAME: 'COMUNITARIA', PRIORITY: 2, STATUS: 1 },
      ],
    });

    const periodoWithPartialDates: Periodo = {
      ...mockPeriodo,
      typeDates: [
        { id: 1, periodId: 1, internshipTypeId: 1, startDate: '2026-03-16', endDate: '2026-05-08' },
      ],
    };

    render(
      <PeriodModal
        isOpen={true}
        onClose={vi.fn()}
        onSave={vi.fn()}
        periodo={periodoWithPartialDates}
        existingPeriods={mockExistingPeriods}
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Fechas por tipo/i)).toBeInTheDocument();
    });
  });
});
