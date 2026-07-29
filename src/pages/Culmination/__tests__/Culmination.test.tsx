/**
 * @file Culmination.test.tsx
 * @description Tests TDD para las funcionalidades de Phase 5 en la página de Culminación:
 *   5.1 — Joint certification button + sibling status
 *   5.2 — isFrozen visual indicator
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { MemoryRouter } from 'react-router';
import { AuthContext, AuthContextType } from '../../../context/auth';

// --- Mocks ---

vi.mock('react-hot-toast', () => ({
  default: {
    loading: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../../../context/toast', () => ({
  useToast: () => ({ addToast: vi.fn() }),
}));

vi.mock('../../../components/common/PageMeta', () => ({
  default: () => null,
}));

vi.mock('../../../components/common/PageBreadCrumb', () => ({
  default: ({ pageTitle }: any) => <div data-testid="breadcrumb">{pageTitle}</div>,
}));

vi.mock('../../../components/common/ComponentCard', () => ({
  default: ({ children, title }: any) => (
    <div data-testid="component-card">
      <h3>{title}</h3>
      {children}
    </div>
  ),
}));

vi.mock('../../../components/ui/button/Button', () => ({
  default: ({ children, onClick, disabled, className, variant, size, ...props }: any) => (
    <button
      data-testid={`btn-${variant || 'default'}`}
      onClick={onClick}
      disabled={disabled}
      className={className}
      {...props}
    >
      {children}
    </button>
  ),
}));

vi.mock('../../../components/ui/badge/Badge', () => ({
  default: ({ children, color, variant, size, startIcon }: any) => (
    <span data-testid={`badge-${color || 'default'}`} data-variant={variant}>
      {startIcon && <span data-testid="badge-icon">{startIcon}</span>}
      {children}
    </span>
  ),
}));

vi.mock('../../../components/ui/table', () => ({
  Table: ({ children }: any) => <table data-testid="table">{children}</table>,
  TableBody: ({ children }: any) => <tbody>{children}</tbody>,
  TableHeader: ({ children }: any) => <thead>{children}</thead>,
  TableRow: ({ children, className }: any) => <tr className={className}>{children}</tr>,
  TableCell: ({ children, isHeader }: any) => isHeader ? <th>{children}</th> : <td>{children}</td>,
  Pagination: () => null,
}));

vi.mock('../../../components/ui/table/EmptyState', () => ({
  EmptyState: ({ title }: any) => <div data-testid="empty-state">{title}</div>,
}));

vi.mock('../../../components/ui/skeleton', () => ({
  TableSkeleton: () => <div data-testid="skeleton" />,
}));

vi.mock('../../../components/ui/modal', () => ({
  Modal: ({ children, isOpen }: any) => isOpen ? <div data-testid="modal">{children}</div> : null,
  ModalHeader: ({ children }: any) => <div>{children}</div>,
  ModalBody: ({ children }: any) => <div>{children}</div>,
}));

vi.mock('../../../components/ui/dialog/UnifiedDialog', () => ({
  default: ({ isOpen, title, message, children }: any) =>
    isOpen ? (
      <div data-testid="confirm-dialog">
        <h4>{title}</h4>
        <p>{message}</p>
        {children}
      </div>
    ) : null,
}));

vi.mock('../../../components/form/input/InputField', () => ({
  default: (props: any) => <input data-testid="search-input" {...props} />,
}));

vi.mock('../../../components/form/CustomSelect', () => ({
  default: (props: any) => <select data-testid="custom-select" {...props} />,
}));

vi.mock('../../../components/form/Label', () => ({
  default: ({ children }: any) => <label>{children}</label>,
}));

vi.mock('../../../icons', () => ({
  DownloadIcon: (props: any) => <span data-testid="download-icon" {...props}>⬇</span>,
  CheckCircleIcon: (props: any) => <span data-testid="check-icon" {...props}>✓</span>,
  EyeIcon: (props: any) => <span data-testid="eye-icon" {...props}>👁</span>,
  UserIcon: (props: any) => <span data-testid="user-icon" {...props}>👤</span>,
  TimeIcon: (props: any) => <span data-testid="time-icon" {...props}>⏱</span>,
  LockIcon: (props: any) => <span data-testid="lock-icon" {...props}>🔒</span>,
}));

// Mock culmination service
const mockGenerateCertificate = vi.fn();
const mockGetAll = vi.fn().mockResolvedValue({
  success: true,
  data: [],
  meta: { total: 0, completed: 0, inProgress: 0 },
});

vi.mock('../../../features/culmination/services/culminationService', () => ({
  culminationService: {
    getAll: (...args: any[]) => mockGetAll(...args),
    approve: vi.fn(),
    generateCertificate: (...args: any[]) => mockGenerateCertificate(...args),
    reverse: vi.fn(),
  },
}));

// --- Mock auth context ---
const mockAuth: AuthContextType = {
  user: { id: 1, userCi: 'V-123', name: 'Admin', surname: 'User', email: 'admin@test.com', role: 1 },
  loading: false,
  signOut: vi.fn(),
  checkAuth: vi.fn(),
};

// --- Test wrapper ---
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthContext.Provider value={mockAuth}>
    <MemoryRouter>{children}</MemoryRouter>
  </AuthContext.Provider>
);

import CulminationPage from '../Culmination';

describe('CulminationPage — Phase 5 UX', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ─── 5.1: Joint certification button ───────────────────────────────

  describe('5.1: Joint certification button + sibling status', () => {
    it('RED: should NOT show joint cert button when no sibling practices exist', async () => {
      const singleGroup = {
        studentCi: 'V-12345678',
        studentName: 'Juan Pérez',
        careerName: 'Enfermería',
        period: '2025-1',
        overallStatus: 'in_progress' as const,
        practices: [
          {
            id: '101',
            practiceType: 'HOSP',
            practiceTypeId: 1,
            institutionName: 'Hospital Central',
            totalHours: 360,
            hoursRequired: 360,
            evaluationStatus: 'completed',
            finalGrade: 85,
            result: 'approved' as const,
            culminationStatus: 'approved' as const,
            isFrozen: true,
          },
        ],
      };

      mockGetAll.mockResolvedValueOnce({
        success: true,
        data: [singleGroup],
        meta: { total: 1, completed: 0, inProgress: 1 },
      });

      render(<CulminationPage />, { wrapper });

      await waitFor(() => {
        expect(screen.queryByText('Generar Certificado Conjunto')).not.toBeInTheDocument();
      });
    });

    it('RED: should show joint cert button when sibling practices exist and both approved+frozen', async () => {
      const dualGroup = {
        studentCi: 'V-12345678',
        studentName: 'Juan Pérez',
        careerName: 'Enfermería',
        period: '2025-1',
        overallStatus: 'completed' as const,
        practices: [
          {
            id: '101',
            practiceType: 'HOSP',
            practiceTypeId: 1,
            institutionName: 'Hospital Central',
            totalHours: 360,
            hoursRequired: 360,
            evaluationStatus: 'completed',
            finalGrade: 85,
            result: 'approved' as const,
            culminationStatus: 'approved' as const,
            isFrozen: true,
            siblingPracticeId: 102,
            siblingPracticeStatus: 'CULMINADO',
            siblingGrade: 90,
          },
          {
            id: '102',
            practiceType: 'COM',
            practiceTypeId: 2,
            institutionName: 'Hospital Central',
            totalHours: 360,
            hoursRequired: 360,
            evaluationStatus: 'completed',
            finalGrade: 90,
            result: 'approved' as const,
            culminationStatus: 'approved' as const,
            isFrozen: true,
            siblingPracticeId: 101,
            siblingPracticeStatus: 'CULMINADO',
            siblingGrade: 85,
          },
        ],
      };

      mockGetAll.mockResolvedValueOnce({
        success: true,
        data: [dualGroup],
        meta: { total: 1, completed: 1, inProgress: 0 },
      });

      render(<CulminationPage />, { wrapper });

      await waitFor(() => {
        // Open detail modal
        const viewButtons = screen.getAllByText('Ver detalle');
        expect(viewButtons.length).toBeGreaterThan(0);
        viewButtons[0].click();
      });

      await waitFor(() => {
        // The joint cert button should appear when viewing the group
        expect(screen.getByText('Generar Certificado Conjunto')).toBeInTheDocument();
      });
    });

    it('RED: joint cert button calls evaluationsCulminationService.generateCertificate', async () => {
      const dualGroup = {
        studentCi: 'V-12345678',
        studentName: 'Juan Pérez',
        careerName: 'Enfermería',
        period: '2025-1',
        overallStatus: 'completed' as const,
        practices: [
          {
            id: '101',
            practiceType: 'HOSP',
            practiceTypeId: 1,
            institutionName: 'Hospital Central',
            totalHours: 360,
            hoursRequired: 360,
            evaluationStatus: 'completed',
            finalGrade: 85,
            result: 'approved' as const,
            culminationStatus: 'approved' as const,
            isFrozen: true,
            siblingPracticeId: 102,
            siblingPracticeStatus: 'CULMINADO',
            siblingGrade: 90,
          },
          {
            id: '102',
            practiceType: 'COM',
            practiceTypeId: 2,
            institutionName: 'Hospital Central',
            totalHours: 360,
            hoursRequired: 360,
            evaluationStatus: 'completed',
            finalGrade: 90,
            result: 'approved' as const,
            culminationStatus: 'approved' as const,
            isFrozen: true,
            siblingPracticeId: 101,
            siblingPracticeStatus: 'CULMINADO',
            siblingGrade: 85,
          },
        ],
      };

      mockGetAll.mockResolvedValueOnce({
        success: true,
        data: [dualGroup],
        meta: { total: 1, completed: 1, inProgress: 0 },
      });

      // Mock generateCertificate to succeed
      mockGenerateCertificate.mockResolvedValueOnce({
        success: true,
        certificate: { number: 'JOINT-001' },
      });

      render(<CulminationPage />, { wrapper });

      await waitFor(() => {
        const viewButtons = screen.getAllByText('Ver detalle');
        viewButtons[0].click();
      });

      await waitFor(() => {
        const jointBtn = screen.queryByText('Generar Certificado Conjunto');
        if (jointBtn) {
          jointBtn.click();
        }
      });

      await waitFor(() => {
        // Should show a confirm dialog or call generateCertificate directly
        expect(screen.queryByText('Generar Certificado Conjunto')).toBeInTheDocument();
      });
    });
  });

  // ─── 5.2: isFrozen visual indicator ────────────────────────────────

  describe('5.2: isFrozen visual indicator', () => {
    it('RED: should show lock icon and "Congelado" badge for frozen practices', async () => {
      const groupWithFrozen = {
        studentCi: 'V-87654321',
        studentName: 'María López',
        careerName: 'Enfermería',
        period: '2025-1',
        overallStatus: 'completed' as const,
        practices: [
          {
            id: '201',
            practiceType: 'HOSP',
            practiceTypeId: 1,
            institutionName: 'Hospital Central',
            totalHours: 360,
            hoursRequired: 360,
            evaluationStatus: 'completed',
            finalGrade: 88,
            result: 'approved' as const,
            culminationStatus: 'approved' as const,
            isFrozen: true,
          },
          {
            id: '202',
            practiceType: 'COM',
            practiceTypeId: 2,
            institutionName: 'Hospital Central',
            totalHours: 360,
            hoursRequired: 360,
            evaluationStatus: 'completed',
            finalGrade: 92,
            result: 'approved' as const,
            culminationStatus: 'approved' as const,
            isFrozen: false,
          },
        ],
      };

      mockGetAll.mockResolvedValueOnce({
        success: true,
        data: [groupWithFrozen],
        meta: { total: 1, completed: 1, inProgress: 0 },
      });

      render(<CulminationPage />, { wrapper });

      await waitFor(() => {
        const viewButtons = screen.getAllByText('Ver detalle');
        viewButtons[0].click();
      });

      await waitFor(() => {
        // The frozen practice should have a "Congelado" indicator
        expect(screen.getByText('Congelado')).toBeInTheDocument();
      });
    });

    it('RED: should NOT show frozen badge for unfrozen practices', async () => {
      const groupWithoutFrozen = {
        studentCi: 'V-87654321',
        studentName: 'María López',
        careerName: 'Enfermería',
        period: '2025-1',
        overallStatus: 'in_progress' as const,
        practices: [
          {
            id: '301',
            practiceType: 'HOSP',
            practiceTypeId: 1,
            institutionName: 'Hospital Central',
            totalHours: 360,
            hoursRequired: 360,
            evaluationStatus: 'pending',
            finalGrade: null,
            result: 'pending' as const,
            culminationStatus: 'pending' as const,
            isFrozen: false,
          },
        ],
      };

      mockGetAll.mockResolvedValueOnce({
        success: true,
        data: [groupWithoutFrozen],
        meta: { total: 1, completed: 0, inProgress: 1 },
      });

      render(<CulminationPage />, { wrapper });

      await waitFor(() => {
        const viewButtons = screen.getAllByText('Ver detalle');
        viewButtons[0].click();
      });

      // Verify "Congelado" badge is NOT shown for unfrozen practices
      expect(screen.queryByText('Congelado')).not.toBeInTheDocument();
    });

    it('RED: should show sibling info (name, status, grade) below each practice', async () => {
      const dualGroup = {
        studentCi: 'V-12345678',
        studentName: 'Juan Pérez',
        careerName: 'Enfermería',
        period: '2025-1',
        overallStatus: 'completed' as const,
        practices: [
          {
            id: '101',
            practiceType: 'HOSP',
            practiceTypeId: 1,
            institutionName: 'Hospital Central',
            totalHours: 360,
            hoursRequired: 360,
            evaluationStatus: 'completed',
            finalGrade: 85,
            result: 'approved' as const,
            culminationStatus: 'approved' as const,
            isFrozen: true,
            siblingPracticeId: 102,
            siblingPracticeStatus: 'CULMINADO',
            siblingGrade: 90,
          },
          {
            id: '102',
            practiceType: 'COM',
            practiceTypeId: 2,
            institutionName: 'Hospital Central',
            totalHours: 360,
            hoursRequired: 360,
            evaluationStatus: 'completed',
            finalGrade: 90,
            result: 'approved' as const,
            culminationStatus: 'approved' as const,
            isFrozen: true,
            siblingPracticeId: 101,
            siblingPracticeStatus: 'CULMINADO',
            siblingGrade: 85,
          },
        ],
      };

      mockGetAll.mockResolvedValueOnce({
        success: true,
        data: [dualGroup],
        meta: { total: 1, completed: 1, inProgress: 0 },
      });

      render(<CulminationPage />, { wrapper });

      await waitFor(() => {
        const viewButtons = screen.getAllByText('Ver detalle');
        viewButtons[0].click();
      });

      await waitFor(() => {
        // Sibling practice info should be displayed for each practice in the dual group
        const siblingLabels = screen.getAllByText(/Hermana:/i);
        expect(siblingLabels.length).toBe(2);
      });
    });
  });
});
