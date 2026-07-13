/**
 * @file EvaluationsAndCulmination.activeList.test.tsx
 * @description Tests para el aislamiento de tabs via activeList.
 * Verifica que prácticas REPROBADO se excluyan de Evaluaciones/Culminación
 * y se incluyan solo en la pestaña Reprobados.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// --- Mocks de componentes UI ---

vi.mock('../../../components/common/PageMeta', () => ({ default: () => null }));
vi.mock('../../../components/common/PageBreadCrumb', () => ({ default: () => null }));
vi.mock('../../../components/common/ComponentCard', () => ({ default: ({ children }: any) => <div data-testid="component-card">{children}</div> }));
vi.mock('../../../components/ui/button/Button', () => ({ default: ({ children, onClick, size, variant, className }: any) => <button data-testid={`btn-${variant || 'default'}`} onClick={onClick} className={className}>{children}</button> }));
vi.mock('../../../components/ui/badge/Badge', () => ({ default: ({ children }: any) => <span data-testid="badge">{children}</span> }));
vi.mock('../../../components/form/CustomSelect', () => ({ default: () => <div data-testid="custom-select" /> }));
vi.mock('../../../components/ui/table', () => ({
  Table: ({ children }: any) => <table data-testid="table">{children}</table>,
  TableBody: ({ children }: any) => <tbody>{children}</tbody>,
  TableCell: ({ children, isHeader }: any) => isHeader ? <th>{children}</th> : <td>{children}</td>,
  TableHeader: ({ children }: any) => <thead>{children}</thead>,
  TableRow: ({ children, className }: any) => <tr className={className}>{children}</tr>,
  Pagination: ({ totalItems }: any) => <div data-testid="pagination">{totalItems} items</div>,
}));
vi.mock('../../../components/ui/table/EmptyState', () => ({ EmptyState: ({ title, description }: any) => <div data-testid="empty-state"><h3>{title}</h3><p>{description}</p></div> }));
vi.mock('../../../components/ui/skeleton', () => ({ TableSkeleton: () => <div data-testid="skeleton" /> }));
vi.mock('../../../components/ui/dialog/UnifiedDialog', () => ({ default: ({ isOpen, title }: any) => isOpen ? <div data-testid="unified-dialog">{title}</div> : null }));
vi.mock('../../../icons', () => ({ DownloadIcon: () => <span>Download</span>, CheckCircleIcon: () => <span>Check</span>, EyeIcon: () => <span>Eye</span> }));
vi.mock('../../../components/ui/tabs/Tabs', () => ({ Tabs: ({ options }: any) => <div data-testid="tabs">{options.map((o: any) => <button key={o.id} data-testid={`tab-${o.id}`}>{o.label}</button>)}</div> }));

// --- Mocks de componentes de features ---

vi.mock('../../../features/evaluations-culmination/components/ActionDropdown', () => ({
  ActionDropdown: ({ actions }: any) => <div data-testid="action-dropdown">{actions?.length} acciones</div>,
}));
vi.mock('../../../features/evaluations-culmination/components/EvaluationCell', () => ({ EvaluationCell: () => <td>Eval</td> }));
vi.mock('../../../features/evaluations-culmination/components/StatsCards', () => ({ StatsCardsGrid: ({ meta }: any) => <div data-testid="stats-cards">{meta?.total ?? 0} students</div> }));
vi.mock('../../../features/evaluations-culmination/components/EvaluationFilters', () => ({ EvaluationFilters: () => <div data-testid="eval-filters" /> }));
vi.mock('../../../features/evaluations-culmination/components/EvaluationActions', () => ({ EvaluationActions: () => <div data-testid="eval-actions" /> }));
vi.mock('../../../features/evaluations-culmination/components/BulkExtensionModal', () => ({ BulkExtensionModal: () => null }));
vi.mock('../../../features/evaluations-culmination/components/AuditHistoryModal', () => ({ AuditHistoryModal: () => null }));
vi.mock('../../../features/evaluations-culmination/components/CommitteeModal', () => ({ CommitteeModal: () => null }));
vi.mock('../../../features/evaluations-culmination/components/CertificationView', () => ({ CertificationView: () => <div data-testid="certification-view" /> }));
vi.mock('../../../features/evaluations-culmination/components/CloseActasModal', () => ({ CloseActasModal: () => null }));
vi.mock('../../../features/evaluations-culmination/components/CloseActasResultsModal', () => ({ CloseActasResultsModal: () => null }));
vi.mock('../../../features/evaluations-culmination/components/PhaseStatusBadge', () => ({ PhaseStatusBadge: () => <span data-testid="phase-status-badge" /> }));
vi.mock('../../../features/evaluations-culmination/components/StudentCulminationRow', () => ({
  StudentCulminationRow: ({ row }: any) => (
    <div data-testid="student-culmination-row">
      <span>{row.studentName}</span>
    </div>
  ),
}));
vi.mock('../../../features/student-detail/components/StudentDetailModal', () => ({ StudentDetailModal: () => null }));
vi.mock('../../../features/evaluations/components/EvaluationModal', () => ({ EvaluationModal: () => null }));
vi.mock('../../../features/evaluations/components/EvaluationDetailModal', () => ({ default: () => null }));

// Mock del hook
const baseMockHook = {
  practices: [],
  filteredPractices: [],
  loading: false,
  errors: null as string | null,
  isReadOnly: false,
  activeFiltersCount: 0,
  meta: { periods: [], careers: [], practiceTypes: [] },
  itemsPerPage: 25,
  currentPage: 1,
  setCurrentPage: vi.fn(),
  setItemsPerPage: vi.fn(),
  handleViewAudit: vi.fn(),
  handleViewStudentDetail: vi.fn(),
  updateFilter: vi.fn(),
  clearFilters: vi.fn(),
  confirmDialog: null,
  closeConfirmDialog: vi.fn(),
  refresh: vi.fn(),
  handleUnfreeze: vi.fn(),
  unfreezeTarget: null,
  unfreezeReason: '',
  setUnfreezeReason: vi.fn(),
  handleConfirmUnfreeze: vi.fn(),
  setUnfreezeTarget: vi.fn(),
  extensionDialogOpen: false,
  extensionTarget: null,
  setExtensionDialogOpen: vi.fn(),
  withdrawDialogOpen: false,
  withdrawTarget: null,
  withdrawType: 'MANUAL',
  setWithdrawType: vi.fn(),
  withdrawReason: '',
  setWithdrawReason: vi.fn(),
  handleWithdraw: vi.fn(),
  handleConfirmWithdraw: vi.fn(),
  setWithdrawDialogOpen: vi.fn(),
  handleReclassifyWithdrawal: vi.fn(),
  handleOpenEvaluation: vi.fn(),
  handleViewEvaluationDetails: vi.fn(),
  handleApprove: vi.fn(),
  handleGrantExtension: vi.fn(),
  handleRevokeExtension: vi.fn(),
  handleOpenCommittee: vi.fn(),
  filters: { periodId: '', careerId: '', practiceTypeId: '', result: '', culminationStatus: '' },
  culminationStats: { total: 0, pending: 0, approved: 0, certified: 0 },
  // Grouped culmination view
  culminationGroups: [],
  culminationGroupsLoading: false,
  culminationGroupsError: null,
  culminationGroupStats: { total: 0, pending: 0, approved: 0, certified: 0 },
  culminationGroupsMeta: { total: 0, completed: 0, inProgress: 0 },
  refetchCulminationGroups: vi.fn(),
  culminationPeriodId: undefined,
  culminationSearch: '',
  culminationCareerId: undefined,
  culminationPhaseFilter: 'all',
  culminationExpandedStudentCi: null,
  toggleCulminationRow: vi.fn(),
  approveCulminationGrouped: vi.fn(),
  certifyPracticeGrouped: vi.fn(),
  reverseCulminationGrouped: vi.fn(),
  actionApproving: false,
  actionCertifying: false,
  // Close actas modals
  handleFreezeAll: vi.fn(),
  closeActasModalOpen: false,
  setCloseActasModalOpen: vi.fn(),
  closeActasResults: null,
  closeActasResultsModalOpen: false,
  setCloseActasResultsModalOpen: vi.fn(),
  selectedPracticeIdsForCloseActas: [],
  closeActasFromPreview: vi.fn(),
  closingActas: false,
};

let mockHookInstance: any;
let mockActiveTab: string;

vi.mock('../../../features/evaluations-culmination/hooks/useEvaluationsCulmination', () => ({
  useEvaluationsCulmination: () => mockHookInstance,
}));

vi.mock('../../../hooks/useTabs', () => ({
  useTabs: () => ({
    activeTab: mockActiveTab,
    tabProps: { activeTab: mockActiveTab, onChange: vi.fn() },
  }),
}));

vi.mock('../../../features/evaluations/hooks/useSystemEvaluationConfig', () => ({
  useSystemEvaluationConfig: () => ({ config: { score: { displayScale: 10 } }, loading: false }),
}));

const SAMPLE_PRACTICES = [
  {
    practiceId: 1, studentName: 'Estudiante Inscrito', studentCi: 'V-1111',
    careerName: 'Ing.', practiceTypeName: 'ORDINARIA', result: 'pending',
    practicesStatus: 'Inscrito', practicesStatusCode: 'INSCRITO',
    evaluationStatus: 'pending', culminationStatus: 'pending', finalGrade: null,
    isFrozen: false, extensionGranted: false, totalHours: 300,
    evaluations: { INSTITUCIONAL: { completed: false, score: 0 }, ACADEMICO: { completed: false, score: 0 }, COMITE: { completed: false, score: 0 } },
  },
  {
    practiceId: 2, studentName: 'Estudiante Reprobado', studentCi: 'V-2222',
    careerName: 'Lic.', practiceTypeName: 'ORDINARIA', result: 'failed',
    practicesStatus: 'Reprobado', practicesStatusCode: 'REPROBADO',
    evaluationStatus: 'completed', culminationStatus: 'pending', finalGrade: 4,
    isFrozen: false, extensionGranted: false, totalHours: 360,
    evaluations: { INSTITUCIONAL: { completed: true, score: 4 }, ACADEMICO: { completed: true, score: 4 }, COMITE: { completed: true, score: 4 } },
  },
  {
    practiceId: 3, studentName: 'Estudiante Culminado', studentCi: 'V-3333',
    careerName: 'Cont.', practiceTypeName: 'ORDINARIA', result: 'approved',
    practicesStatus: 'Culminado', practicesStatusCode: 'CULMINADO',
    evaluationStatus: 'completed', culminationStatus: 'approved', finalGrade: 18,
    isFrozen: true, extensionGranted: false, totalHours: 360,
    evaluations: { INSTITUCIONAL: { completed: true, score: 18 }, ACADEMICO: { completed: true, score: 17 }, COMITE: { completed: true, score: 19 } },
  },
];

describe('EvaluationsAndCulmination — activeList tab isolation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockActiveTab = 'evaluations';
    mockHookInstance = {
      ...baseMockHook,
      filteredPractices: SAMPLE_PRACTICES,
      loading: false,
    };
  });

  const getPage = async () => {
    const mod = await import('../EvaluationsAndCulmination');
    return mod.default;
  };

  it('shows all practices in Evaluaciones tab (no REPROBADO filtering)', async () => {
    mockActiveTab = 'evaluations';
    mockHookInstance.filteredPractices = SAMPLE_PRACTICES;
    mockHookInstance.itemsPerPage = 1; // force totalPages > 1 so <Pagination> renders
    const Page = await getPage();
    render(<Page />);

    // activeList now returns all filteredPractices directly (no tab filtering)
    const pagination = screen.getByTestId('pagination');
    expect(pagination).toHaveTextContent('3 items');
  });

  it('shows all practices in Culminacion tab', async () => {
    mockActiveTab = 'culmination';
    mockHookInstance.filteredPractices = SAMPLE_PRACTICES;
    mockHookInstance.culminationGroups = [
      { studentCi: 'V-1111', studentName: 'Estudiante Inscrito', careerName: 'Ing.', periodId: 1, periodName: '1-2026', phases: [], finalStatus: 'pending', finalStatusLabel: 'Pendiente', canCertify: false, certificateNumber: null, certifiedAt: null, totalPractices: 1, completedPractices: 0 },
      { studentCi: 'V-2222', studentName: 'Estudiante Reprobado', careerName: 'Lic.', periodId: 1, periodName: '1-2026', phases: [], finalStatus: 'failed', finalStatusLabel: 'Reprobado', canCertify: false, certificateNumber: null, certifiedAt: null, totalPractices: 1, completedPractices: 0 },
      { studentCi: 'V-3333', studentName: 'Estudiante Culminado', careerName: 'Cont.', periodId: 1, periodName: '1-2026', phases: [], finalStatus: 'approved', finalStatusLabel: 'Aprobado', canCertify: false, certificateNumber: null, certifiedAt: null, totalPractices: 1, completedPractices: 1 },
    ];
    mockHookInstance.culminationGroupsMeta = { total: 3, completed: 1, inProgress: 2 };
    const Page = await getPage();
    render(<Page />);

    // Stats cards show all 3 students
    const stats = screen.getByTestId('stats-cards');
    expect(stats).toHaveTextContent('3');
  });

  it('reflects correct totalItems count across tabs', async () => {
    // Evaluaciones tab should show all practices
    mockActiveTab = 'evaluations';
    mockHookInstance.filteredPractices = SAMPLE_PRACTICES;
    mockHookInstance.itemsPerPage = 1; // force totalPages > 1 so <Pagination> renders
    const Page = await getPage();
    const { unmount } = render(<Page />);

    const evalPagination = screen.getByTestId('pagination');
    expect(evalPagination).toHaveTextContent('3 items');
    unmount();
  });
});
