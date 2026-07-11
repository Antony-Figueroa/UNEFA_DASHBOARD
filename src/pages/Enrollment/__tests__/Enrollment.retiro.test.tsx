/**
 * @file Enrollment.retiro.test.tsx
 * @description Tests TDD para 5.3 — Retiro dashboard section on enrollment page
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router';

// --- Mocks ---

vi.mock('react-hot-toast', () => ({
  default: { loading: vi.fn(), success: vi.fn(), error: vi.fn() },
}));

vi.mock('../../../context/toast', () => ({
  useToast: () => ({ addToast: vi.fn() }),
}));

vi.mock('../../../components/common/PageMeta', () => ({
  default: () => null,
}));

vi.mock('../../../components/common/PageBreadCrumb', () => ({
  default: () => <div data-testid="breadcrumb" />,
}));

vi.mock('../../../components/common/ComponentCard', () => ({
  default: ({ children }: any) => <div data-testid="component-card">{children}</div>,
}));

vi.mock('../../../components/ui/button/Button', () => ({
  default: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
}));

vi.mock('../../../components/ui/skeleton', () => ({
  SkeletonLoader: ({ children }: any) => <>{children}</>,
  TitleSkeleton: () => null,
  BreadcrumbSkeleton: () => null,
  TablePageSkeleton: () => null,
}));

vi.mock('../../../components/ui/tabs/Tabs', () => ({
  Tabs: () => null,
}));

vi.mock('../../../hooks/useTabs', () => ({
  useTabs: () => ({ activeTab: 'Activas', tabProps: {} }),
}));

vi.mock('../../../components/ui/dialog/UnifiedDialog', () => ({
  default: () => null,
}));

vi.mock('../../../components/ui/dialog/DialogConfig', () => ({
  CONFIRM_MESSAGES: { deactivate: () => ({ title: '', confirmLabel: '', variant: '' }) },
  MODAL_CONFIG: { confirmLabel: () => 'Confirmar' },
}));

vi.mock('../../../icons/actions', () => ({
  PlusCircleIcon: () => <span>+</span>,
}));

vi.mock('lucide-react', () => ({
  FileText: () => <span>PDF</span>,
}));

// Mock the feature hooks
vi.mock('../../../features/enrollment/hooks/useEnrollment', () => ({
  useEnrollment: () => ({
    enrollments: [],
    status: 'loaded',
    loadingAction: false,
    addEnrollment: vi.fn(),
    editEnrollment: vi.fn(),
    toggleStatus: vi.fn(),
    withdraw: vi.fn(),
  }),
}));

vi.mock('../../../features/periods/hooks/usePeriods', () => ({
  usePeriods: () => ({ periodos: [] }),
}));

vi.mock('../../../features/pre-enrollment/hooks/usePreEnrollment', () => ({
  usePreEnrollment: () => ({ addPreEnrollment: vi.fn(), loadingAction: false }),
}));

vi.mock('../../../features/tutors/hooks/useTutors', () => ({
  useTutors: () => ({ tutors: [], addTutor: vi.fn(), loadingAction: false }),
}));

vi.mock('../../../features/institutions/hooks/useInstitutions', () => ({
  useInstitutions: () => ({ institutions: [], addInstitution: vi.fn(), loadingAction: false }),
}));

vi.mock('../../../features/institutions/hooks/useInstitutionalResponsibles', () => ({
  useInstitutionalResponsibles: () => ({ addResponsible: vi.fn(), loadingAction: false }),
}));

vi.mock('../../../features/careers/hooks/useCareers', () => ({
  useCareers: () => ({ careers: [], addCareer: vi.fn() }),
}));

vi.mock('../../../features/internship-types/hooks/useInternshipTypes', () => ({
  useInternshipTypes: () => ({ activeOptions: [] }),
}));

vi.mock('../../../features/internship-types/services/internshipTypesService', () => ({
  getInternshipTypes: () => Promise.resolve([]),
  mapToOptions: () => [],
}));

// Mock the RetiroDashboard component
vi.mock('../../../features/justified-withdrawal/components/RetiroDashboard', () => ({
  default: () => <div data-testid="retiro-dashboard">Retiros Justificados Pendientes</div>,
  RetiroDashboard: () => <div data-testid="retiro-dashboard">Retiros Justificados Pendientes</div>,
}));

// Mock sub-components
vi.mock('../../../features/enrollment/components/EnrollmentTable', () => ({
  default: () => <div data-testid="enrollment-table" />,
}));

vi.mock('../../../features/enrollment/components/EnrollmentModal', () => ({
  default: () => null,
}));

vi.mock('../../../features/enrollment/components/EnrollmentViewModal', () => ({
  default: () => null,
}));

vi.mock('../../../features/pre-enrollment/components/PreEnrollmentModal', () => ({
  default: () => null,
}));

vi.mock('../../../features/tutors/components/TutorModal', () => ({
  default: () => null,
}));

vi.mock('../../../features/institutions/components/InstitutionModal', () => ({
  default: () => null,
}));

vi.mock('../../../features/institutions/components/InstitutionalResponsibleModal', () => ({
  default: () => null,
}));

vi.mock('../../../features/careers/components/CareerModal', () => ({
  default: () => null,
}));

vi.mock('../../../components/ui/pdf/PDFPreviewModal', () => ({
  PDFPreviewModal: () => null,
}));

vi.mock('../../../components/ui/pdf/templates/EnrollmentPDF', () => ({
  EnrollmentPDF: () => null,
}));

// We need to mock useNavigate and useLocation
const mockNavigate = vi.fn();
vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/enrollment', state: {} }),
  };
});

import EnrollmentPage from '../Enrollment';

describe('EnrollmentPage — Phase 5.3 Retiro Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('RED: should render the RetiroDashboard component on the page', async () => {
    render(<EnrollmentPage />, { wrapper: MemoryRouter });

    await waitFor(() => {
      expect(screen.getByTestId('retiro-dashboard')).toBeInTheDocument();
    });
  });

  it('RED: should show "Retiros Justificados Pendientes" title', async () => {
    render(<EnrollmentPage />, { wrapper: MemoryRouter });

    await waitFor(() => {
      expect(screen.getByText('Retiros Justificados Pendientes')).toBeInTheDocument();
    });
  });
});
