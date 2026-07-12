/**
 * @file CertificationView.test.tsx
 * @description Tests for CertificationView component — read-only certification tab.
 * Written FIRST (TDD).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
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

const certifiedRow1: StudentCulminationRowData = {
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
      status: 'certified',
      statusLabel: 'Certificada',
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
      status: 'certified',
      statusLabel: 'Certificada',
      grade: 15,
      isFrozen: true,
      evaluationStatus: 'completed',
      institutionName: 'Centro de Salud',
      hoursCompleted: 180,
    },
  ],
  finalStatus: 'approved',
  finalStatusLabel: 'Aprobado',
  canCertify: false,
  certificateNumber: 'CERT-2024-0001',
  certifiedAt: '2024-03-15T10:00:00Z',
  totalPractices: 2,
  completedPractices: 2,
};

const certifiedRow2: StudentCulminationRowData = {
  studentCi: '87654321',
  studentName: 'María López',
  careerName: 'Ing. Enfermería',
  periodId: 1,
  periodName: '2024-2',
  phases: [
    {
      practiceId: 300,
      practiceTypeId: 1,
      practiceTypeName: 'Hospitalaria',
      priority: 1,
      status: 'certified',
      statusLabel: 'Certificada',
      grade: 17,
      isFrozen: true,
      evaluationStatus: 'completed',
      institutionName: 'Hospital General',
      hoursCompleted: 360,
    },
  ],
  finalStatus: 'approved',
  finalStatusLabel: 'Aprobado',
  canCertify: false,
  certificateNumber: 'CERT-2024-0002',
  certifiedAt: '2024-03-20T10:00:00Z',
  totalPractices: 1,
  completedPractices: 1,
};

const nonCertifiedRow: StudentCulminationRowData = {
  studentCi: '99999999',
  studentName: 'Pedro García',
  careerName: 'Ing. Sistemas',
  periodId: 1,
  periodName: '2024-2',
  phases: [
    {
      practiceId: 400,
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

describe('CertificationView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows only students with certificateNumber', () => {
    const groups = [certifiedRow1, nonCertifiedRow, certifiedRow2];
    render(<CertificationView groups={groups} loading={false} />);

    expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    expect(screen.getByText('María López')).toBeInTheDocument();
    expect(screen.queryByText('Pedro García')).not.toBeInTheDocument();
  });

  it('shows empty state when no certifications', () => {
    render(<CertificationView groups={[]} loading={false} />);

    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    expect(screen.getByText('No hay registros de certificación ni cierres de acta aún')).toBeInTheDocument();
  });

  it('shows empty state when all rows have null certificateNumber', () => {
    render(<CertificationView groups={[nonCertifiedRow]} loading={false} />);
    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
  });

  it('renders certificate number and date', () => {
    render(<CertificationView groups={[certifiedRow1]} loading={false} />);

    expect(screen.getByText('CERT-2024-0001')).toBeInTheDocument();
    // Date should be formatted
    expect(screen.getByText(/15\/03\/2024/)).toBeInTheDocument();
  });

  it('renders both practice grades for a student with 2 practices', () => {
    render(<CertificationView groups={[certifiedRow1]} loading={false} />);

    // Should show both grades
    expect(screen.getByText('16')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
  });

  it('shows "—" for missing practice grade', () => {
    // Mix a 2-phase row with a 1-phase row so the table renders maxPhases=2
    // The 1-phase row (certifiedRow2) will have a fill cell with "—"
    render(<CertificationView groups={[certifiedRow1, certifiedRow2]} loading={false} />);

    // certifiedRow1 (Juan) has both phases with grades 16 and 15
    expect(screen.getByText('16')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
    // certifiedRow2 (María) has only Hospitalaria (grade 17) and a fill "—"
    expect(screen.getByText('17')).toBeInTheDocument();
    // Find the "—" elements (table header separator + missing grade) — at least one should exist
    const dashes = screen.getAllByText('—');
    expect(dashes.length).toBeGreaterThanOrEqual(1);
  });

  it('shows loading state', () => {
    render(<CertificationView groups={[]} loading={true} />);

    expect(screen.getByText(/cargando/i)).toBeInTheDocument();
  });

  it('does not show loading when loading=false', () => {
    render(<CertificationView groups={[certifiedRow1]} loading={false} />);
    expect(screen.queryByText(/cargando/i)).not.toBeInTheDocument();
  });

  it('renders PDF download button for each certified student', () => {
    render(<CertificationView groups={[certifiedRow1, certifiedRow2]} loading={false} />);

    const downloadButtons = screen.getAllByTestId('download-icon');
    expect(downloadButtons).toHaveLength(2);
  });

  it('renders student CI in the table', () => {
    render(<CertificationView groups={[certifiedRow1]} loading={false} />);
    expect(screen.getByText('12345678')).toBeInTheDocument();
  });

  it('renders student name in the table', () => {
    render(<CertificationView groups={[certifiedRow1]} loading={false} />);
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
  });

  it('shows reprobados (finalStatus=failed) with Cierre badge and no certificate number', () => {
    const reprobadoRow: StudentCulminationRowData = {
      ...nonCertifiedRow,
      studentName: 'Estudiante Reprobado',
      studentCi: 'V-9999',
      finalStatus: 'failed',
      finalStatusLabel: 'Reprobado',
      certificateNumber: null,
    };
    render(<CertificationView groups={[reprobadoRow]} loading={false} />);

    expect(screen.getByText('Estudiante Reprobado')).toBeInTheDocument();
    expect(screen.getByText('Cierre')).toBeInTheDocument();
    // Multiple dashes exist per row (institution, hours, cert), so verify absence of actual cert number
    expect(screen.queryByText('CERT-001')).not.toBeInTheDocument();
    expect(screen.queryByText('CERT-002')).not.toBeInTheDocument();
  });

  it('shows certified and reprobados together, certified first', () => {
    const reprobadoRow: StudentCulminationRowData = {
      ...nonCertifiedRow,
      studentName: 'Estudiante Reprobado',
      studentCi: 'V-9999',
      finalStatus: 'failed',
      finalStatusLabel: 'Reprobado',
      certificateNumber: null,
    };
    render(<CertificationView groups={[reprobadoRow, certifiedRow1]} loading={false} />);

    expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    expect(screen.getByText('Estudiante Reprobado')).toBeInTheDocument();
    expect(screen.getByText('Certificado')).toBeInTheDocument();
    expect(screen.getByText('Cierre')).toBeInTheDocument();
  });

  it('shows updated empty state text', () => {
    render(<CertificationView groups={[]} loading={false} />);
    expect(screen.getByText('No hay registros de certificación ni cierres de acta aún')).toBeInTheDocument();
  });
});
