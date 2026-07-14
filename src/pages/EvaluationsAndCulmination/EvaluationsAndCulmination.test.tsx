/**
 * @file EvaluationsAndCulmination.test.tsx
 * @description Tests for the certification tab card-based layout.
 * Verifies that only certified students are shown and the batch certification section is removed.
 */

import { render, screen, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import EvaluationsAndCulminationPage from './EvaluationsAndCulmination';
import { useEvaluationsCulmination } from '../../features/evaluations-culmination/hooks/useEvaluationsCulmination';
import { useSystemEvaluationConfig } from '../../features/evaluations/hooks/useSystemEvaluationConfig';
import { useTabs } from '../../hooks/useTabs';
import type { StudentCulminationRowData } from '../../features/evaluations-culmination/types';

// Mock the hooks
vi.mock('../../features/evaluations-culmination/hooks/useEvaluationsCulmination');
vi.mock('../../features/evaluations/hooks/useSystemEvaluationConfig');
vi.mock('../../hooks/useTabs');

// Mock the components that are used in the page
vi.mock('../../components/common/PageMeta', () => ({
  default: () => <div data-testid="page-meta" />,
}));
vi.mock('../../components/common/PageBreadCrumb', () => ({
  default: () => <div data-testid="page-breadcrumb" />,
}));
vi.mock('../../components/common/ComponentCard', () => ({
  default: ({ children, title }: { children: React.ReactNode; title: string }) => (
    <div data-testid="component-card" data-title={title}>
      {children}
    </div>
  ),
}));
vi.mock('../../components/ui/button/Button', () => ({
  default: ({ children, ...props }: any) => <button {...props}>{children}</button>,
}));
vi.mock('../../components/ui/badge/Badge', () => ({
  default: ({ children, ...props }: any) => <span {...props}>{children}</span>,
}));
vi.mock('../../components/form/CustomSelect', () => ({
  default: () => <div data-testid="custom-select" />,
}));
vi.mock('../../components/ui/table', () => ({
  Table: ({ children }: any) => <table>{children}</table>,
  TableBody: ({ children }: any) => <tbody>{children}</tbody>,
  TableCell: ({ children, isHeader, ...props }: any) =>
    isHeader ? <th {...props}>{children}</th> : <td {...props}>{children}</td>,
  TableHeader: ({ children }: any) => <thead>{children}</thead>,
  TableRow: ({ children, ...props }: any) => <tr {...props}>{children}</tr>,
  Pagination: () => <div data-testid="pagination" />,
}));
vi.mock('../../components/ui/table/EmptyState', () => ({
  EmptyState: ({ title, description }: { title: string; description: string }) => (
    <div data-testid="empty-state">
      <div data-testid="empty-state-title">{title}</div>
      <div data-testid="empty-state-description">{description}</div>
    </div>
  ),
}));
vi.mock('../../components/ui/skeleton', () => ({
  TableSkeleton: () => <div data-testid="table-skeleton" />,
}));
vi.mock('../../components/ui/dialog/UnifiedDialog', () => ({
  default: () => <div data-testid="unified-dialog" />,
}));
vi.mock('../../icons', () => ({
  DownloadIcon: () => <svg data-testid="download-icon" />,
  CheckCircleIcon: () => <svg data-testid="check-circle-icon" />,
  EyeIcon: () => <svg data-testid="eye-icon" />,
}));
vi.mock('../../features/evaluations-culmination/components/ActionDropdown', () => ({
  ActionDropdown: () => <div data-testid="action-dropdown" />,
}));
vi.mock('../../features/student-detail/components/StudentDetailModal', () => ({
  StudentDetailModal: () => <div data-testid="student-detail-modal" />,
}));
vi.mock('../../features/evaluations/components/EvaluationModal', () => ({
  EvaluationModal: () => <div data-testid="evaluation-modal" />,
}));
vi.mock('../../features/evaluations/components/EvaluationDetailModal', () => ({
  default: () => <div data-testid="evaluation-detail-modal" />,
}));
vi.mock('../../features/evaluations-culmination/components/EvaluationCell', () => ({
  EvaluationCell: () => <div data-testid="evaluation-cell" />,
}));
vi.mock('../../features/evaluations-culmination/components/StatsCards', () => ({
  StatsCardsGrid: () => <div data-testid="stats-cards-grid" />,
}));
vi.mock('../../features/evaluations-culmination/components/EvaluationFilters', () => ({
  EvaluationFilters: () => <div data-testid="evaluation-filters" />,
}));
vi.mock('../../features/evaluations-culmination/components/StudentCulminationRow', () => ({
  StudentCulminationRow: ({ row, readOnly }: { row: StudentCulminationRowData; readOnly?: boolean }) => (
    <div data-testid="student-culmination-row" data-student-ci={row.studentCi} data-read-only={readOnly}>
      <span data-testid="student-name">{row.studentName}</span>
    </div>
  ),
}));
vi.mock('../../features/evaluations-culmination/components/PhaseStatusBadge', () => ({
  PhaseStatusBadge: () => <div data-testid="phase-status-badge" />,
}));
vi.mock('../../features/evaluations-culmination/components/EvaluationActions', () => ({
  EvaluationActions: () => <div data-testid="evaluation-actions" />,
}));
vi.mock('../../features/evaluations-culmination/components/BulkExtensionModal', () => ({
  BulkExtensionModal: () => <div data-testid="bulk-extension-modal" />,
}));
vi.mock('../../features/evaluations-culmination/components/AuditHistoryModal', () => ({
  AuditHistoryModal: () => <div data-testid="audit-history-modal" />,
}));
vi.mock('../../features/evaluations-culmination/components/CommitteeModal', () => ({
  CommitteeModal: () => <div data-testid="committee-modal" />,
}));
vi.mock('../../features/evaluations-culmination/components/CloseActasModal', () => ({
  CloseActasModal: () => <div data-testid="close-actas-modal" />,
}));
vi.mock('../../features/evaluations-culmination/components/CloseActasResultsModal', () => ({
  CloseActasResultsModal: () => <div data-testid="close-actas-results-modal" />,
}));
vi.mock('../../components/ui/tabs/Tabs', () => ({
  Tabs: ({ options, ...props }: any) => (
    <div data-testid="tabs">
      {options.map((opt: any) => (
        <button key={opt.id} data-testid={`tab-${opt.id}`}>
          {opt.label}
        </button>
      ))}
    </div>
  ),
}));

// Mock data
const createMockGroup = (
  overrides: Partial<StudentCulminationRowData> = {},
): StudentCulminationRowData => ({
  studentCi: '12345678',
  studentName: 'Test Student',
  careerName: 'Ingeniería de Sistemas',
  periodId: 1,
  periodName: '2024-1',
  phases: [
    {
      practiceId: 1,
      practiceTypeId: 1,
      practiceTypeName: 'HOSPITALARIA',
      priority: 1,
      status: 'certified',
      statusLabel: 'Certificado',
      grade: 18.5,
      isFrozen: true,
      evaluationStatus: 'completed',
      institutionName: 'Hospital Test',
      hoursCompleted: 360,
    },
  ],
  finalStatus: 'approved',
  finalStatusLabel: 'Aprobado',
  canCertify: false,
  certificateNumber: 'CERT-001',
  certifiedAt: '2026-03-15',
  totalPractices: 1,
  completedPractices: 1,
  ...overrides,
});

describe('Certification Tab - Card-based layout', () => {
  const mockHook = {
    loading: false,
    filteredPractices: [],
    culminationGroups: [] as StudentCulminationRowData[],
    culminationGroupsLoading: false,
    isReadOnly: false,
    refresh: vi.fn(),
    meta: {
      periods: [],
      careers: [],
      practiceTypes: [],
    },
    filters: {},
    updateFilter: vi.fn(),
    clearFilters: vi.fn(),
    searchTerm: '',
    setSearchTerm: vi.fn(),
    currentPage: 1,
    setCurrentPage: vi.fn(),
    itemsPerPage: 10,
    setItemsPerPage: vi.fn(),
    // Culmination UI
    culminationExpandedStudentCi: null,
    toggleCulminationRow: vi.fn(),
    // Culmination actions
    certifyPracticeGrouped: vi.fn(),
    reverseCulminationGrouped: vi.fn(),
    actionCertifying: false,
    // Other required properties
    handleFreezeAll: vi.fn(),
    handleExportExcel: vi.fn(),
    handleBulkExtension: vi.fn(),
    handleApprove: vi.fn(),
    handleOpenEvaluation: vi.fn(),
    handleViewEvaluationDetails: vi.fn(),
    handleOpenCommittee: vi.fn(),
    handleGrantExtension: vi.fn(),
    handleRevokeExtension: vi.fn(),
    handleViewAudit: vi.fn(),
    handleUnfreeze: vi.fn(),
    handleViewStudentDetail: vi.fn(),
    evalModalOpen: false,
    selectedPracticeForEval: null,
    selectedEvaluatorType: 'INSTITUCIONAL',
    editingEvaluationId: undefined,
    handleCloseEvaluationModal: vi.fn(),
    handleEvaluationSuccess: vi.fn(),
    handleNavigateToNext: vi.fn(),
    detailModalOpen: false,
    selectedEvaluationId: null,
    selectedDetailStudentName: '',
    selectedDetailStudentCi: '',
    handleCloseDetailModal: vi.fn(),
    studentDetailOpen: false,
    selectedStudentPracticeId: null,
    selectedStudentName: '',
    handleCloseStudentDetail: vi.fn(),
    confirmDialog: null,
    closeConfirmDialog: vi.fn(),
    withdrawDialogOpen: false,
    withdrawTarget: null,
    withdrawType: 'justified' as const,
    setWithdrawType: vi.fn(),
    withdrawReason: '',
    setWithdrawReason: vi.fn(),
    handleWithdraw: vi.fn(),
    handleConfirmWithdraw: vi.fn(),
    setWithdrawDialogOpen: vi.fn(),
    handleReclassifyWithdrawal: vi.fn(),
    unfreezeTarget: null,
    unfreezeReason: '',
    setUnfreezeReason: vi.fn(),
    handleConfirmUnfreeze: vi.fn(),
    setUnfreezeTarget: vi.fn(),
    extensionDialogOpen: false,
    extensionTarget: null,
    extensionReason: '',
    setExtensionReason: vi.fn(),
    handleConfirmExtension: vi.fn(),
    setExtensionDialogOpen: vi.fn(),
    bulkExtensionOpen: false,
    setBulkExtensionOpen: vi.fn(),
    bulkExtensionSelectedIds: [],
    setBulkExtensionSelectedIds: vi.fn(),
    bulkExtensionReason: '',
    setBulkExtensionReason: vi.fn(),
    handleConfirmBulkExtension: vi.fn(),
    closeActasModalOpen: false,
    setCloseActasModalOpen: vi.fn(),
    closeActasResults: null,
    closeActasResultsModalOpen: false,
    setCloseActasResultsModalOpen: vi.fn(),
    selectedPracticeIdsForCloseActas: [],
    closeActasFromPreview: vi.fn(),
    committeeDialogOpen: false,
    committeeTarget: null,
    setCommitteeDialogOpen: vi.fn(),
    auditHistoryOpen: false,
    setAuditHistoryOpen: vi.fn(),
    auditHistoryData: [],
    auditHistoryLoading: false,
    overrideTarget: null,
    setOverrideTarget: vi.fn(),
    setOverrideReason: vi.fn(),
    handleConfirmOverride: vi.fn(),
    // Grouped culmination view
    culminationGroupsMeta: { total: 0, completed: 0, inProgress: 0 },
    refetchCulminationGroups: vi.fn(),
    culminationPeriodId: undefined,
    culminationSearch: '',
    culminationCareerId: undefined,
    culminationPhaseFilter: 'all' as const,
    setCulminationPeriodId: vi.fn(),
    setCulminationSearch: vi.fn(),
    setCulminationCareerId: vi.fn(),
    setCulminationPhaseFilter: vi.fn(),
    resetCulminationFilters: vi.fn(),
    culminationActiveTab: 'certification' as const,
    setCulminationActiveTab: vi.fn(),
    isCulminationModalOpen: false,
    culminationModalType: null,
    culminationSelectedPracticeId: null,
    openCulminationModal: vi.fn(),
    closeCulminationModal: vi.fn(),
    approveCulminationGrouped: vi.fn(),
    bulkExtendGrouped: vi.fn(),
    actionApproving: false,
    actionReversing: false,
    actionBulkExtending: false,
    actionError: null,
  };

  const mockEvalConfig = {
    config: {
      score: { displayScale: 20 },
      weights: { INSTITUCIONAL: 0.4, ACADEMICO: 0.3, COMITE: 0.3 },
    },
  };

  const mockTabsState = {
    activeTab: 'certification',
    tabProps: { activeTab: 'certification', onTabChange: vi.fn() },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useEvaluationsCulmination as any).mockReturnValue(mockHook);
    (useSystemEvaluationConfig as any).mockReturnValue(mockEvalConfig);
    (useTabs as any).mockReturnValue(mockTabsState);
  });

  it('shows only certified students in certification tab', () => {
    // Arrange: mixed groups - certified, ready, failed
    const certifiedGroup = createMockGroup({
      studentCi: '11111111',
      studentName: 'Certified Student',
      certificateNumber: 'CERT-001',
      certifiedAt: '2026-03-15',
    });
    const readyGroup = createMockGroup({
      studentCi: '22222222',
      studentName: 'Ready Student',
      certificateNumber: null,
      certifiedAt: null,
      canCertify: true,
    });
    const failedGroup = createMockGroup({
      studentCi: '33333333',
      studentName: 'Failed Student',
      certificateNumber: null,
      certifiedAt: null,
      finalStatus: 'failed',
      finalStatusLabel: 'Reprobado',
    });

    mockHook.culminationGroups = [certifiedGroup, readyGroup, failedGroup];

    // Act
    render(<EvaluationsAndCulminationPage />);

    // Assert: only certified student should be rendered as StudentCulminationRow
    const rows = screen.getAllByTestId('student-culmination-row');
    expect(rows).toHaveLength(1);
    expect(rows[0].getAttribute('data-student-ci')).toBe('11111111');
    expect(screen.getByText('Certified Student')).toBeInTheDocument();
    expect(screen.queryByText('Ready Student')).not.toBeInTheDocument();
    expect(screen.queryByText('Failed Student')).not.toBeInTheDocument();
  });

  it('shows empty state when no certified students', () => {
    // Arrange: only ready and failed groups
    const readyGroup = createMockGroup({
      studentCi: '22222222',
      studentName: 'Ready Student',
      certificateNumber: null,
      certifiedAt: null,
      canCertify: true,
    });
    const failedGroup = createMockGroup({
      studentCi: '33333333',
      studentName: 'Failed Student',
      certificateNumber: null,
      certifiedAt: null,
      finalStatus: 'failed',
      finalStatusLabel: 'Reprobado',
    });

    mockHook.culminationGroups = [readyGroup, failedGroup];

    // Act
    render(<EvaluationsAndCulminationPage />);

    // Assert: empty state should be shown
    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    expect(screen.getByTestId('empty-state-title')).toHaveTextContent('No hay registros de certificación');
  });

  it('does not contain batch certification controls', () => {
    // Arrange: at least one ready group
    const readyGroup = createMockGroup({
      studentCi: '22222222',
      studentName: 'Ready Student',
      certificateNumber: null,
      certifiedAt: null,
      canCertify: true,
    });
    mockHook.culminationGroups = [readyGroup];

    // Act
    render(<EvaluationsAndCulminationPage />);

    // Assert: batch certification controls should not exist
    expect(screen.queryByTestId('select-all-ready')).not.toBeInTheDocument();
    expect(screen.queryByTestId('certify-all-btn')).not.toBeInTheDocument();
    expect(screen.queryByTestId('certify-selected-btn')).not.toBeInTheDocument();
  });
});
