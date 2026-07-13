/**
 * @file CertificationView.batch-cert.test.tsx
 * @description Tests for CertificationView batch certification features:
 * ready-for-certification section, checkbox selection, certify actions, progress indicators.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { CertificationView } from '../CertificationView';
import type { StudentCulminationRowData } from '../../types';

// ── Mocks ──────────────────────────────────────────────────

vi.mock('../../../../components/ui/badge/Badge', () => ({
  default: ({ children, color, variant }: any) => (
    <span data-testid="badge" data-color={color} data-variant={variant}>
      {children}
    </span>
  ),
}));

vi.mock('../../../../components/ui/button/Button', () => ({
  default: ({ children, onClick, size, variant, ...props }: any) => (
    <button data-testid="button" data-size={size} data-variant={variant} onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

vi.mock('../../../../components/ui/table/EmptyState', () => ({
  EmptyState: ({ title, description }: any) => (
    <div data-testid="empty-state">
      <span data-testid="empty-title">{title}</span>
      {description && <span data-testid="empty-description">{description}</span>}
    </div>
  ),
}));

vi.mock('../../../../icons', () => ({
  DownloadIcon: (props: any) => <svg data-testid="download-icon" {...props} />,
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => {
      const { initial, animate, exit, transition, ...rest } = props;
      return <div {...rest}>{children}</div>;
    },
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// ── Test Data ──────────────────────────────────────────────

const readyStudent1: StudentCulminationRowData = {
  studentCi: '11111111',
  studentName: 'Ana Martínez',
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
      grade: 18,
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
      status: 'approved',
      statusLabel: 'Aprobada',
      grade: 16,
      isFrozen: true,
      evaluationStatus: 'completed',
      institutionName: 'Centro de Salud',
      hoursCompleted: 180,
    },
  ],
  finalStatus: 'approved',
  finalStatusLabel: 'Aprobado',
  canCertify: true,
  certificateNumber: null,
  certifiedAt: null,
  totalPractices: 2,
  completedPractices: 2,
};

const readyStudent2: StudentCulminationRowData = {
  studentCi: '22222222',
  studentName: 'Carlos López',
  careerName: 'Ing. Sistemas',
  periodId: 1,
  periodName: '2024-2',
  phases: [
    {
      practiceId: 300,
      practiceTypeId: 1,
      practiceTypeName: 'Hospitalaria',
      priority: 1,
      status: 'approved',
      statusLabel: 'Aprobada',
      grade: 15,
      isFrozen: true,
      evaluationStatus: 'completed',
      institutionName: 'Hospital General',
      hoursCompleted: 360,
    },
  ],
  finalStatus: 'approved',
  finalStatusLabel: 'Aprobado',
  canCertify: true,
  certificateNumber: null,
  certifiedAt: null,
  totalPractices: 1,
  completedPractices: 1,
};

const alreadyCertified: StudentCulminationRowData = {
  studentCi: '33333333',
  studentName: 'Laura García',
  careerName: 'Ing. Enfermería',
  periodId: 1,
  periodName: '2024-2',
  phases: [
    {
      practiceId: 400,
      practiceTypeId: 1,
      practiceTypeName: 'Hospitalaria',
      priority: 1,
      status: 'certified',
      statusLabel: 'Certificada',
      grade: 17,
      isFrozen: true,
      evaluationStatus: 'completed',
      institutionName: 'Hospital Central',
      hoursCompleted: 360,
    },
  ],
  finalStatus: 'approved',
  finalStatusLabel: 'Aprobado',
  canCertify: false,
  certificateNumber: 'CERT-2024-0001',
  certifiedAt: '2024-03-15T10:00:00Z',
  totalPractices: 1,
  completedPractices: 1,
};

const pendingStudent: StudentCulminationRowData = {
  studentCi: '44444444',
  studentName: 'Pedro Ruiz',
  careerName: 'Ing. Sistemas',
  periodId: 1,
  periodName: '2024-2',
  phases: [
    {
      practiceId: 500,
      practiceTypeId: 1,
      practiceTypeName: 'Hospitalaria',
      priority: 1,
      status: 'pending',
      statusLabel: 'Pendiente',
      grade: null,
      isFrozen: false,
      evaluationStatus: 'pending',
      institutionName: 'Empresa X',
      hoursCompleted: 0,
    },
  ],
  finalStatus: 'pending',
  finalStatusLabel: 'Pendiente',
  canCertify: false,
  certificateNumber: null,
  certifiedAt: null,
  totalPractices: 1,
  completedPractices: 0,
};

// ── Tests ──────────────────────────────────────────────────

describe('CertificationView — Batch Certification', () => {
  const defaultProps = {
    groups: [readyStudent1, readyStudent2, alreadyCertified, pendingStudent],
    loading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders ready-for-certification section when canCertify=true students exist', () => {
    render(<CertificationView {...defaultProps} />);

    expect(screen.getByText(/estudiantes listos para certificar/)).toBeInTheDocument();
    expect(screen.getByText('Ana Martínez')).toBeInTheDocument();
    expect(screen.getByText('Carlos López')).toBeInTheDocument();
  });

  it('does not render ready section when no students are ready', () => {
    render(
      <CertificationView
        {...defaultProps}
        groups={[alreadyCertified, pendingStudent]}
      />,
    );

    expect(screen.queryByText(/listos para certificar/)).not.toBeInTheDocument();
  });

  it('checkbox selection toggles individual students', () => {
    render(<CertificationView {...defaultProps} onCertify={vi.fn()} />);

    const checkbox = screen.getByTestId('ready-checkbox-11111111') as HTMLInputElement;
    expect(checkbox.checked).toBe(false);

    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(true);

    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(false);
  });

  it('shows "Certificar seleccionados" button with count after selection', () => {
    render(<CertificationView {...defaultProps} onCertify={vi.fn()} />);

    const checkbox = screen.getByTestId('ready-checkbox-11111111');
    fireEvent.click(checkbox);

    expect(screen.getByTestId('certify-selected-btn')).toBeInTheDocument();
    expect(screen.getByText(/Certificar seleccionados \(1\)/)).toBeInTheDocument();
  });

  it('calls onCertify with selected student CIs', () => {
    const onCertify = vi.fn();
    render(<CertificationView {...defaultProps} onCertify={onCertify} />);

    // Select two students
    fireEvent.click(screen.getByTestId('ready-checkbox-11111111'));
    fireEvent.click(screen.getByTestId('ready-checkbox-22222222'));

    fireEvent.click(screen.getByTestId('certify-selected-btn'));

    expect(onCertify).toHaveBeenCalledTimes(1);
    expect(onCertify).toHaveBeenCalledWith(['11111111', '22222222']);
  });

  it('"Certificar todos" calls onCertify with all ready student CIs', () => {
    const onCertify = vi.fn();
    render(<CertificationView {...defaultProps} onCertify={onCertify} />);

    fireEvent.click(screen.getByTestId('certify-all-btn'));

    expect(onCertify).toHaveBeenCalledTimes(1);
    expect(onCertify).toHaveBeenCalledWith(['11111111', '22222222']);
  });

  it('select-all checkbox toggles all ready students', () => {
    render(<CertificationView {...defaultProps} onCertify={vi.fn()} />);

    const selectAll = screen.getByTestId('select-all-ready') as HTMLInputElement;
    expect(selectAll.checked).toBe(false);

    fireEvent.click(selectAll);
    expect(selectAll.checked).toBe(true);
    expect(
      (screen.getByTestId('ready-checkbox-11111111') as HTMLInputElement).checked,
    ).toBe(true);
    expect(
      (screen.getByTestId('ready-checkbox-22222222') as HTMLInputElement).checked,
    ).toBe(true);

    fireEvent.click(selectAll);
    expect(selectAll.checked).toBe(false);
    expect(
      (screen.getByTestId('ready-checkbox-11111111') as HTMLInputElement).checked,
    ).toBe(false);
  });

  it('shows certifying loading state on buttons', () => {
    render(<CertificationView {...defaultProps} onCertify={vi.fn()} certifying />);

    expect(screen.getByText('Certificando...')).toBeInTheDocument();
    // Certify buttons should be disabled
    expect(screen.getByTestId('certify-all-btn')).toBeDisabled();
  });

  it('disables checkboxes during certifying', () => {
    render(<CertificationView {...defaultProps} onCertify={vi.fn()} certifying />);

    const checkbox = screen.getByTestId('ready-checkbox-11111111') as HTMLInputElement;
    expect(checkbox.disabled).toBe(true);
  });

  it('renders practice progress indicator in ready section', () => {
    render(<CertificationView {...defaultProps} />);

    // Progress text is split across child text nodes (2, /, 2), so query the container
    const readyRows = screen.getAllByTestId('ready-student-row');
    // readyStudent1 has 2/2, readyStudent2 has 1/1 — both should have progress bars
    expect(readyRows.length).toBe(2);
    // Check the progress bar exists inside each ready row
    readyRows.forEach((row) => {
      expect(row.querySelector('[style*="width:"]')).toBeInTheDocument();
    });
  });

  it('renders progress indicator in certified table', () => {
    render(<CertificationView {...defaultProps} />);

    // The certified table should have a "Progreso" column header
    expect(screen.getByText('Progreso')).toBeInTheDocument();
    // Progress bars (divs with width style) should be present in the table
    const table = screen.getByRole('table');
    const progressBars = table.querySelectorAll('[style*="width:"]');
    expect(progressBars.length).toBeGreaterThanOrEqual(1);
  });

  it('does not show certified student in ready section', () => {
    render(<CertificationView {...defaultProps} />);

    // Laura García is already certified, should NOT appear in ready section
    const readyRows = screen.getAllByTestId('ready-student-row');
    const names = readyRows.map((row) => row.textContent);
    expect(names.some((t) => t?.includes('Laura García'))).toBe(false);
  });

  it('does not show pending student in ready section', () => {
    render(<CertificationView {...defaultProps} />);

    const readyRows = screen.getAllByTestId('ready-student-row');
    const names = readyRows.map((row) => row.textContent);
    expect(names.some((t) => t?.includes('Pedro Ruiz'))).toBe(false);
  });

  it('shows empty state when no certified/failed AND no ready students', () => {
    render(
      <CertificationView
        groups={[pendingStudent]}
        loading={false}
      />,
    );

    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
  });

  it('preserves existing certified table alongside ready section', () => {
    render(<CertificationView {...defaultProps} />);

    // Should have certified student in the table
    expect(screen.getByText('Laura García')).toBeInTheDocument();
    // And ready students in the banner (multiple rows)
    const readyRows = screen.getAllByTestId('ready-student-row');
    expect(readyRows.length).toBeGreaterThan(0);
  });
});
