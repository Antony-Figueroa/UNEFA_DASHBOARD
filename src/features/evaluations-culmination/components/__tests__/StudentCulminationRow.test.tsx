/**
 * @file StudentCulminationRow.test.tsx
 * @description Tests for StudentCulminationRow component — grouped row
 * for the redesigned culmination view. Written FIRST (TDD).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import React from 'react';
import { StudentCulminationRow } from '../StudentCulminationRow';
import type { StudentCulminationRowData } from '../../types';

// ── Mocks ──────────────────────────────────────────────────

vi.mock('../../../../components/ui/badge/Badge', () => ({
  default: ({ children, color, variant }: any) => (
    <span data-testid="badge" data-color={color} data-variant={variant}>
      {children}
    </span>
  ),
}));

vi.mock('../PhaseStatusBadge', () => ({
  PhaseStatusBadge: ({ status, label, grade }: any) => (
    <span data-testid="phase-status-badge" data-status={status}>
      {label}{grade != null ? ` (${grade})` : ''}
    </span>
  ),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, ...rest } = props;
      return <div data-testid="motion-div" {...rest}>{children}</div>;
    },
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// ── Test Data ──────────────────────────────────────────────

const createBaseRow = (overrides?: Partial<StudentCulminationRowData>): StudentCulminationRowData => ({
  studentCi: '12345678',
  studentName: 'Juan Pérez',
  careerName: 'Ing. Enfermería',
  periodId: 1,
  periodName: '2024-2',
  phases: [
    {
      practiceId: 100,
      practiceTypeId: 1,
      practiceTypeName: 'Hospitalaria',
      priority: 1,
      status: 'approved',
      statusLabel: 'Aprobada',
      grade: 16,
      isFrozen: true,
      evaluationStatus: 'completed',
      institutionName: 'Hospital Central',
      hoursCompleted: 360,
    },
    {
      practiceId: 200,
      practiceTypeId: 2,
      practiceTypeName: 'Comunitaria',
      priority: 2,
      status: 'pending',
      statusLabel: 'Pendiente',
      grade: null,
      isFrozen: false,
      evaluationStatus: 'pending',
      institutionName: 'Centro de Salud',
      hoursCompleted: 0,
    },
  ],
  finalStatus: 'pending',
  finalStatusLabel: 'Pendiente',
  canCertify: false,
  certificateNumber: null,
  certifiedAt: null,
  totalPractices: 2,
  completedPractices: 1,
  ...overrides,
});

const defaultRow = createBaseRow();

const defaultProps = {
  row: defaultRow,
  isExpanded: false,
  onToggle: vi.fn(),
  onCertify: vi.fn().mockResolvedValue(true),
  onReverse: vi.fn().mockResolvedValue(true),
  certifying: false,
};

// ── Tests ──────────────────────────────────────────────────

describe('StudentCulminationRow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders student name and CI', () => {
    render(<StudentCulminationRow {...defaultProps} />);
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    expect(screen.getByText('CI: 12345678')).toBeInTheDocument();
  });

  it('renders career and period info', () => {
    render(<StudentCulminationRow {...defaultProps} />);
    expect(screen.getByText('Ing. Enfermería')).toBeInTheDocument();
    expect(screen.getByText('2024-2')).toBeInTheDocument();
  });

  it('renders phase badges using PhaseStatusBadge', () => {
    render(<StudentCulminationRow {...defaultProps} />);
    const badges = screen.getAllByTestId('phase-status-badge');
    expect(badges).toHaveLength(2);
    expect(badges[0]).toHaveAttribute('data-status', 'approved');
    expect(badges[1]).toHaveAttribute('data-status', 'pending');
  });

  it('shows expanded detail when isExpanded=true', () => {
    render(<StudentCulminationRow {...defaultProps} isExpanded={true} />);
    // Expanded section should show institution
    expect(screen.getByText('Hospital Central')).toBeInTheDocument();
  });

  it('hides expanded detail when isExpanded=false', () => {
    render(<StudentCulminationRow {...defaultProps} isExpanded={false} />);
    // Institution should NOT be visible in collapsed state
    expect(screen.queryByText('Hospital Central')).not.toBeInTheDocument();
  });

  it('shows locked state for COM when HOSP not approved', () => {
    const rowWithUnapprovedHosp = createBaseRow({
      phases: [
        {
          practiceId: 100,
          practiceTypeId: 1,
          practiceTypeName: 'Hospitalaria',
          priority: 1,
          status: 'pending',
          statusLabel: 'Pendiente',
          grade: null,
          isFrozen: false,
          evaluationStatus: 'pending',
          institutionName: 'Hospital Central',
          hoursCompleted: 0,
        },
        {
          practiceId: 200,
          practiceTypeId: 2,
          practiceTypeName: 'Comunitaria',
          priority: 2,
          status: 'pending',
          statusLabel: 'Pendiente',
          grade: null,
          isFrozen: false,
          evaluationStatus: 'pending',
          institutionName: 'Centro de Salud',
          hoursCompleted: 0,
        },
      ],
    });

    render(
      <StudentCulminationRow
        {...defaultProps}
        row={rowWithUnapprovedHosp}
        isExpanded={true}
      />
    );

    expect(screen.getByText(/bloqueada/)).toBeInTheDocument();
  });

  it('shows "Certificar" button when canCertify=true and expanded', () => {
    const certifiableRow = createBaseRow({ canCertify: true });
    render(
      <StudentCulminationRow {...defaultProps} row={certifiableRow} isExpanded={true} />
    );
    expect(screen.getByRole('button', { name: /certificar/i })).toBeInTheDocument();
  });

  it('hides "Certificar" button when canCertify=false', () => {
    render(<StudentCulminationRow {...defaultProps} />);
    expect(screen.queryByRole('button', { name: /certificar/i })).not.toBeInTheDocument();
  });

  it('calls onToggle when row header clicked', () => {
    const onToggle = vi.fn();
    render(<StudentCulminationRow {...defaultProps} onToggle={onToggle} />);

    // Click the expand/collapse button
    const expandButton = screen.getByRole('button', { name: /toggle/i });
    fireEvent.click(expandButton);

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('shows final status badge with correct color for pending', () => {
    render(<StudentCulminationRow {...defaultProps} />);
    const badge = screen.getAllByTestId('badge').find(
      b => b.textContent?.includes('Pendiente')
    );
    expect(badge).toBeDefined();
  });

  it('shows final status badge with correct color for approved', () => {
    const approvedRow = createBaseRow({
      finalStatus: 'approved',
      finalStatusLabel: 'Aprobado',
    });
    render(<StudentCulminationRow {...defaultProps} row={approvedRow} />);
    expect(screen.getByText('Aprobado')).toBeInTheDocument();
  });

  it('shows final status badge with correct color for failed', () => {
    const failedRow = createBaseRow({
      finalStatus: 'failed',
      finalStatusLabel: 'Reprobado',
    });
    render(<StudentCulminationRow {...defaultProps} row={failedRow} />);
    expect(screen.getByText('Reprobado')).toBeInTheDocument();
  });

  it('shows final status badge with correct color for partial', () => {
    const partialRow = createBaseRow({
      finalStatus: 'partial',
      finalStatusLabel: 'Aprobado Parcial',
    });
    render(<StudentCulminationRow {...defaultProps} row={partialRow} />);
    expect(screen.getByText('Aprobado Parcial')).toBeInTheDocument();
  });

  it('renders correct number of phase columns', () => {
    render(<StudentCulminationRow {...defaultProps} />);
    const badges = screen.getAllByTestId('phase-status-badge');
    expect(badges).toHaveLength(defaultProps.row.phases.length);
  });

  it('shows Descongelar button for frozen phase when onUnfreeze provided', () => {
    const frozenRow = createBaseRow({
      phases: [
        {
          practiceId: 100,
          practiceTypeId: 1,
          practiceTypeName: 'Hospitalaria',
          priority: 1,
          status: 'approved',
          statusLabel: 'Aprobada',
          grade: 16,
          isFrozen: true,
          evaluationStatus: 'completed',
          institutionName: 'Hospital Central',
          hoursCompleted: 360,
        },
      ],
    });
    const onUnfreeze = vi.fn();
    render(
      <StudentCulminationRow {...defaultProps} row={frozenRow} isExpanded={true} onUnfreeze={onUnfreeze} />
    );

    const unfreezeBtn = screen.getByText('Descongelar');
    expect(unfreezeBtn).toBeInTheDocument();
    expect(unfreezeBtn.closest('button')).not.toBeDisabled();
  });

  it('hides Descongelar button when onUnfreeze not provided', () => {
    const frozenRow = createBaseRow({
      phases: [
        {
          practiceId: 100,
          practiceTypeId: 1,
          practiceTypeName: 'Hospitalaria',
          priority: 1,
          status: 'approved',
          statusLabel: 'Aprobada',
          grade: 16,
          isFrozen: true,
          evaluationStatus: 'completed',
          institutionName: 'Hospital Central',
          hoursCompleted: 360,
        },
      ],
    });
    render(
      <StudentCulminationRow {...defaultProps} row={frozenRow} isExpanded={true} />
    );

    expect(screen.queryByText('Descongelar')).not.toBeInTheDocument();
  });

  it('calls onUnfreeze with practiceId when Descongelar clicked', () => {
    const frozenRow = createBaseRow({
      phases: [
        {
          practiceId: 100,
          practiceTypeId: 1,
          practiceTypeName: 'Hospitalaria',
          priority: 1,
          status: 'approved',
          statusLabel: 'Aprobada',
          grade: 16,
          isFrozen: true,
          evaluationStatus: 'completed',
          institutionName: 'Hospital Central',
          hoursCompleted: 360,
        },
      ],
    });
    const onUnfreeze = vi.fn();
    render(
      <StudentCulminationRow {...defaultProps} row={frozenRow} isExpanded={true} onUnfreeze={onUnfreeze} />
    );

    fireEvent.click(screen.getByText('Descongelar'));
    expect(onUnfreeze).toHaveBeenCalledWith(100);
  });

  it('hides Descongelar button when phase is not frozen', () => {
    const unfrozenRow = createBaseRow({
      phases: [
        {
          practiceId: 100,
          practiceTypeId: 1,
          practiceTypeName: 'Hospitalaria',
          priority: 1,
          status: 'approved',
          statusLabel: 'Aprobada',
          grade: 16,
          isFrozen: false,
          evaluationStatus: 'completed',
          institutionName: 'Hospital Central',
          hoursCompleted: 360,
        },
      ],
    });
    render(
      <StudentCulminationRow {...defaultProps} row={unfrozenRow} isExpanded={true} onUnfreeze={vi.fn()} />
    );

    expect(screen.queryByText('Descongelar')).not.toBeInTheDocument();
  });
});
