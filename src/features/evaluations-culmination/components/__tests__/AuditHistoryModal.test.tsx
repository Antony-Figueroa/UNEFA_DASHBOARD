/**
 * @file AuditHistoryModal.test.tsx
 * @description Tests para el componente AuditHistoryModal.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router';
import { AuditHistoryModal } from '../AuditHistoryModal';
import type { AuditEntry } from '../../../evaluations/services/evaluationService';

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

const mockAuditEntries: AuditEntry[] = [
  {
    auditId: 1,
    professionalPracticeId: 1,
    evaluationId: 10,
    action: 'Evaluación creada',
    user: 'Admin User',
    userId: 1,
    timestamp: '2026-06-15T10:30:00Z',
    oldValue: undefined,
    newValue: 'Aprobado',
    details: 'Evaluación institucional registrada',
  },
  {
    auditId: 2,
    professionalPracticeId: 1,
    action: 'Extensión otorgada',
    user: 'Admin User',
    userId: 1,
    timestamp: '2026-06-20T14:00:00Z',
    oldValue: 'Sin extensión',
    newValue: '30 días',
    details: undefined,
  },
  {
    auditId: 3,
    professionalPracticeId: 1,
    action: 'Congelación aplicada',
    user: 'System',
    timestamp: '2026-07-01T08:00:00Z',
    oldValue: 'Activo',
    newValue: 'Congelado',
  },
];

describe('AuditHistoryModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    data: [] as AuditEntry[],
    loading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render when open', () => {
    render(<AuditHistoryModal {...defaultProps} />, { wrapper });

    expect(screen.getByTestId('unified-dialog')).toBeInTheDocument();
    expect(screen.getByText('Historial de Auditoría')).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(<AuditHistoryModal {...defaultProps} isOpen={false} />, { wrapper });

    expect(screen.queryByTestId('unified-dialog')).not.toBeInTheDocument();
  });

  it('should show loading state', () => {
    render(<AuditHistoryModal {...defaultProps} loading={true} />, { wrapper });

    expect(screen.getByText('Cargando historial...')).toBeInTheDocument();
    // Spinner should be present
    const spinner = screen.getByTestId('dialog-content').querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('should show empty state when no data', () => {
    render(<AuditHistoryModal {...defaultProps} data={[]} />, { wrapper });

    expect(
      screen.getByText('No hay registros de auditoría para esta práctica.')
    ).toBeInTheDocument();
  });

  it('should display audit entries', () => {
    render(<AuditHistoryModal {...defaultProps} data={mockAuditEntries} />, { wrapper });

    expect(screen.getByText('Evaluación creada')).toBeInTheDocument();
    expect(screen.getByText('Extensión otorgada')).toBeInTheDocument();
    expect(screen.getByText('Congelación aplicada')).toBeInTheDocument();
  });

  it('should display user names for each entry', () => {
    render(<AuditHistoryModal {...defaultProps} data={mockAuditEntries} />, { wrapper });

    // Admin User appears twice (entries 1 and 2)
    const adminUsers = screen.getAllByText('Admin User');
    expect(adminUsers).toHaveLength(2);
    // System user appears once (3rd entry)
    expect(screen.getByText('System')).toBeInTheDocument();
    const porElements = screen.getAllByText(/Por:/);
    expect(porElements.length).toBe(3);
  });

  it('should display old and new values when available', () => {
    render(<AuditHistoryModal {...defaultProps} data={mockAuditEntries} />, { wrapper });

    // Entry 2 has both oldValue and newValue
    expect(screen.getByText('Sin extensión')).toBeInTheDocument();
    expect(screen.getByText('30 días')).toBeInTheDocument();
    // Entry 3 has both oldValue and newValue
    expect(screen.getByText('Activo')).toBeInTheDocument();
    expect(screen.getByText('Congelado')).toBeInTheDocument();
    // Entry 1 has oldValue=undefined, so old/new is NOT rendered
    expect(screen.queryByText('Aprobado')).not.toBeInTheDocument();
  });

  it('should display details when available', () => {
    render(<AuditHistoryModal {...defaultProps} data={mockAuditEntries} />, { wrapper });

    expect(screen.getByText('Evaluación institucional registrada')).toBeInTheDocument();
  });

  it('should format dates correctly', () => {
    render(<AuditHistoryModal {...defaultProps} data={mockAuditEntries} />, { wrapper });

    // Check that dates are formatted (Spanish locale)
    expect(screen.getByText(/15 jun/)).toBeInTheDocument();
  });

  it('should display record count in message', () => {
    render(<AuditHistoryModal {...defaultProps} data={mockAuditEntries} />, { wrapper });

    expect(screen.getByText('3 registros encontrados')).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<AuditHistoryModal {...defaultProps} onClose={onClose} />, { wrapper });

    // The confirm button calls onClose (since onConfirm={onClose} in the component)
    screen.getByTestId('dialog-confirm').click();

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
