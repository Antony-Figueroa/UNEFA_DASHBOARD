/**
 * @file BulkExtensionModal.test.tsx
 * @description Tests para el componente BulkExtensionModal.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { MemoryRouter } from 'react-router';
import { BulkExtensionModal } from '../BulkExtensionModal';
import type { PracticeWithEvaluations } from '../../types';

// --- Mocks ---

// Mock UnifiedDialog
vi.mock('../../../../components/ui/dialog/UnifiedDialog', () => ({
  default: ({ isOpen, onClose, onConfirm, title, message, confirmLabel, children }: any) => {
    if (!isOpen) return null;
    return (
      <div data-testid="unified-dialog">
        <h2>{title}</h2>
        <p>{message}</p>
        <button data-testid="dialog-confirm" onClick={onConfirm}>
          {confirmLabel}
        </button>
        <button data-testid="dialog-close" onClick={onClose}>
          Cerrar
        </button>
        <div data-testid="dialog-content">{children}</div>
      </div>
    );
  },
}));

// Mock Table components
vi.mock('../../../../components/ui/table', () => ({
  Table: ({ children }: any) => <table data-testid="table">{children}</table>,
  TableHeader: ({ children }: any) => <thead>{children}</thead>,
  TableBody: ({ children }: any) => <tbody>{children}</tbody>,
  TableRow: ({ children }: any) => <tr>{children}</tr>,
  TableCell: ({ children, isHeader }: any) =>
    isHeader ? <th>{children}</th> : <td>{children}</td>,
}));

// Mock Framer Motion
vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>{children}</MemoryRouter>
);

const mockPractices: PracticeWithEvaluations[] = [
  {
    practiceId: 1,
    studentName: 'Juan Perez',
    studentCi: '12345678',
    careerName: 'Medicina',
    careerId: 1,
    minimumGrade: 10,
    institutionId: 1,
    institutionName: 'Hospital Central',
    periodId: 1,
    periodName: '1-2026',
    practiceTypeId: 1,
    practiceTypeName: 'Hospitalaria',
    startDate: '2026-01-01',
    endDate: '2026-06-30',
    totalHours: 480,
    evaluationStatus: 'completed',
    evaluations: {
      INSTITUCIONAL: { completed: true, score: 18, evaluatorName: 'Dr. Smith' },
      ACADEMICO: { completed: true, score: 16, evaluatorName: 'Prof. Garcia' },
      COMITE: { completed: true, score: 17, evaluatorName: 'Comite' },
    },
    finalGrade: 17,
    culminationStatus: 'approved',
    result: 'approved',
  },
  {
    practiceId: 2,
    studentName: 'Maria Lopez',
    studentCi: '87654321',
    careerName: 'Enfermeria',
    careerId: 2,
    minimumGrade: 10,
    institutionId: 2,
    institutionName: 'Clinica Santa Maria',
    periodId: 1,
    periodName: '1-2026',
    practiceTypeId: 1,
    practiceTypeName: 'Hospitalaria',
    startDate: '2026-01-01',
    endDate: '2026-06-30',
    totalHours: 480,
    evaluationStatus: 'pending',
    evaluations: {
      INSTITUCIONAL: { completed: false, score: 0, evaluatorName: '' },
      ACADEMICO: { completed: false, score: 0, evaluatorName: '' },
      COMITE: { completed: false, score: 0, evaluatorName: '' },
    },
    finalGrade: null,
    culminationStatus: 'pending',
    result: 'pending',
  },
  {
    practiceId: 3,
    studentName: 'Carlos Garcia',
    studentCi: '11223344',
    careerName: 'Medicina',
    careerId: 1,
    minimumGrade: 10,
    institutionId: 1,
    institutionName: 'Hospital Central',
    periodId: 1,
    periodName: '1-2026',
    practiceTypeId: 1,
    practiceTypeName: 'Hospitalaria',
    startDate: '2026-01-01',
    endDate: '2026-06-30',
    totalHours: 480,
    evaluationStatus: 'completed',
    evaluations: {
      INSTITUCIONAL: { completed: true, score: 14, evaluatorName: 'Dr. Smith' },
      ACADEMICO: { completed: true, score: 12, evaluatorName: 'Prof. Garcia' },
      COMITE: { completed: true, score: 13, evaluatorName: 'Comite' },
    },
    finalGrade: 13,
    culminationStatus: 'approved',
    result: 'approved',
  },
];

describe('BulkExtensionModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    practices: mockPractices,
    selectedIds: [],
    onSelectedIdsChange: vi.fn(),
    reason: '',
    onReasonChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render when open', () => {
    render(<BulkExtensionModal {...defaultProps} />, { wrapper });

    expect(screen.getByTestId('unified-dialog')).toBeInTheDocument();
    expect(screen.getByText('Extensión Masiva')).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(<BulkExtensionModal {...defaultProps} isOpen={false} />, { wrapper });

    expect(screen.queryByTestId('unified-dialog')).not.toBeInTheDocument();
  });

  it('should show practice list with checkboxes for eligible practices', () => {
    render(<BulkExtensionModal {...defaultProps} />, { wrapper });

    // Juan Perez (completed) should be shown
    expect(screen.getByText('Juan Perez')).toBeInTheDocument();
    // Carlos Garcia (completed) should be shown
    expect(screen.getByText('Carlos Garcia')).toBeInTheDocument();

    // Checkboxes should be present
    const checkboxes = screen.getAllByRole('checkbox');
    // 1 select-all + 2 eligible practices (not pending/failed)
    expect(checkboxes.length).toBeGreaterThanOrEqual(3);
  });

  it('should not include pending practices in eligible list', () => {
    render(<BulkExtensionModal {...defaultProps} />, { wrapper });

    // Maria Lopez has evaluationStatus: 'pending' — should not appear
    expect(screen.queryByText('Maria Lopez')).not.toBeInTheDocument();
  });

  it('should show reason textarea', () => {
    render(<BulkExtensionModal {...defaultProps} />, { wrapper });

    expect(screen.getByPlaceholderText('Ingrese el motivo de la extensión...')).toBeInTheDocument();
  });

  it('should call onReasonChange when reason input changes', async () => {
    const user = userEvent.setup();
    const onReasonChange = vi.fn();

    render(<BulkExtensionModal {...defaultProps} onReasonChange={onReasonChange} />, { wrapper });

    const textarea = screen.getByPlaceholderText('Ingrese el motivo de la extensión...');
    await user.type(textarea, 'Motivo de prueba');

    expect(onReasonChange).toHaveBeenCalled();
  });

  it('should call onSelectedIdsChange when checkbox is clicked', async () => {
    const user = userEvent.setup();
    const onSelectedIdsChange = vi.fn();

    render(<BulkExtensionModal {...defaultProps} onSelectedIdsChange={onSelectedIdsChange} />, { wrapper });

    // Click the first practice checkbox (skip select-all)
    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[1]);

    expect(onSelectedIdsChange).toHaveBeenCalledWith([1]);
  });

  it('should call onConfirm when confirm button is clicked', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    render(
      <BulkExtensionModal
        {...defaultProps}
        onConfirm={onConfirm}
        selectedIds={[1, 3]}
        reason="Motivo valido para extension"
      />,
      { wrapper }
    );

    await user.click(screen.getByTestId('dialog-confirm'));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('should show empty message when no eligible practices', () => {
    render(
      <BulkExtensionModal {...defaultProps} practices={[]} />,
      { wrapper }
    );

    expect(screen.getByText('No hay prácticas elegibles para extensión.')).toBeInTheDocument();
  });

  it('should display selected count in message', () => {
    render(
      <BulkExtensionModal {...defaultProps} selectedIds={[1, 3]} />,
      { wrapper }
    );

    expect(screen.getByText(/2 seleccionadas/)).toBeInTheDocument();
    expect(screen.getByText(/Otorgar 2 extensiones/)).toBeInTheDocument();
  });
});
