/**
 * @file EvaluationsAndCulmination.reprobados.test.tsx
 * @description Tests para la pestaña Reprobados en EvaluationsAndCulmination.
 * Verifica que se muestren prácticas reprobadas y el botón Revertir solo para REPROBADO.
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
  Pagination: () => null,
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
vi.mock('../../../features/evaluations-culmination/components/StatsCards', () => ({ StatsCardsGrid: () => <div data-testid="stats-cards" /> }));
vi.mock('../../../features/evaluations-culmination/components/EvaluationFilters', () => ({ EvaluationFilters: () => <div data-testid="eval-filters" /> }));
vi.mock('../../../features/evaluations-culmination/components/EvaluationActions', () => ({ EvaluationActions: () => <div data-testid="eval-actions" /> }));
vi.mock('../../../features/evaluations-culmination/components/BulkExtensionModal', () => ({ BulkExtensionModal: () => null }));
vi.mock('../../../features/evaluations-culmination/components/AuditHistoryModal', () => ({ AuditHistoryModal: () => null }));
vi.mock('../../../features/evaluations-culmination/components/CommitteeModal', () => ({ CommitteeModal: () => null }));
vi.mock('../../../features/student-detail/components/StudentDetailModal', () => ({ StudentDetailModal: () => null }));
vi.mock('../../../features/evaluations/components/EvaluationModal', () => ({ EvaluationModal: () => null }));
vi.mock('../../../features/evaluations/components/EvaluationDetailModal', () => ({ default: () => null }));

// Mock del hook
const mockHandleReverseFailed = vi.fn();
const mockHandleViewAudit = vi.fn();

const baseMockHook = {
  practices: [],
  filteredPractices: [],
  loading: false,
  errors: null as string | null,
  isReadOnly: false,
  activeFiltersCount: 0,
  meta: { periods: [], careers: [], practiceTypes: [] },
  itemsPerPage: 25,
  reverseDialogOpen: false,
  reverseTarget: null,
  reverseReason: '',
  reverseResolutionNumber: '',
  setReverseReason: vi.fn(),
  setReverseResolutionNumber: vi.fn(),
  handleReverseFailed: mockHandleReverseFailed,
  handleConfirmReverseFailed: vi.fn(),
  handleViewAudit: mockHandleViewAudit,
  updateFilter: vi.fn(),
  clearFilters: vi.fn(),
  pagination: { page: 1, totalPages: 1, total: 0 },
  setPage: vi.fn(),
  startDate: '',
  setStartDate: vi.fn(),
  endDate: '',
  setEndDate: vi.fn(),
  committeeOpen: false,
  setCommitteeOpen: vi.fn(),
  handleCommitteeUpdate: vi.fn(),
  auditOpen: false,
  auditPracticeId: null,
  closeAudit: vi.fn(),
  bulkExtensionOpen: false,
  setBulkExtensionOpen: vi.fn(),
  selectedPracticeIds: [],
  toggleSelectPractice: vi.fn(),
  selectAll: vi.fn(),
  deselectAll: vi.fn(),
  confirmDialog: null,
  closeConfirmDialog: vi.fn(),
  freezeTarget: null,
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
  handleMarkFailed: vi.fn(),
  setReverseDialogOpen: vi.fn(),
  filters: { periodId: '', careerId: '', practiceTypeId: '', result: '', culminationStatus: '' },
};

vi.mock('../../../features/evaluations-culmination/hooks/useEvaluationsCulmination', () => ({
  useEvaluationsCulmination: () => mockHookInstance,
}));

// Mock useTabs
vi.mock('../../../hooks/useTabs', () => ({
  useTabs: () => ({
    activeTab: mockActiveTab,
    tabProps: { activeTab: mockActiveTab, onChange: vi.fn() },
  }),
}));

// Mock useSystemEvaluationConfig
vi.mock('../../../features/evaluations/hooks/useSystemEvaluationConfig', () => ({
  useSystemEvaluationConfig: () => ({ evalConfig: null, loading: false }),
}));

let mockHookInstance: any;
let mockActiveTab: string;

describe('EvaluationsAndCulmination — Reprobados tab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockActiveTab = 'evaluations';

    mockHookInstance = {
      ...baseMockHook,
      filteredPractices: [],
      loading: false,
    };
  });

  // Lazy import para que los mocks estén listos
  const getPage = async () => {
    const mod = await import('../EvaluationsAndCulmination');
    return mod.default;
  };

  it('renders the Reprobados tab button in EVAL_TABS', async () => {
    mockHookInstance.filteredPractices = [];
    mockHookInstance.loading = false;
    const Page = await getPage();
    render(<Page />);

    expect(screen.getByTestId('tab-reprobados')).toBeInTheDocument();
    expect(screen.getByTestId('tab-reprobados')).toHaveTextContent('Reprobados');
  });

  it('shows empty state when no failed practices on Reprobados tab', async () => {
    mockActiveTab = 'reprobados';
    // Prácticas no vacías pero no hay ninguna result==='failed'
    mockHookInstance.filteredPractices = [
      { practiceId: 1, studentName: 'Aprobado', studentCi: 'V-1111', careerName: 'Ing.', practiceTypeName: 'ORDINARIA', result: 'approved', practicesStatus: 'COMPLETADO', finalGrade: 18 },
    ];
    const Page = await getPage();
    render(<Page />);

    expect(screen.getByText('No hay prácticas reprobadas')).toBeInTheDocument();
  });

  it('shows failed practices in Reprobados tab', async () => {
    mockActiveTab = 'reprobados';
    mockHookInstance.filteredPractices = [
      { practiceId: 1, studentName: 'Maria Lopez', studentCi: 'V-12345678', careerName: 'Ing. Sistemas', practiceTypeName: 'ORDINARIA', result: 'failed', practicesStatus: 'REPROBADO', finalGrade: null },
      { practiceId: 2, studentName: 'Carlos Ruiz', studentCi: 'V-87654321', careerName: 'Contaduría', practiceTypeName: 'ORDINARIA', result: 'failed', practicesStatus: 'REPROBADO', finalGrade: 8 },
    ];
    const Page = await getPage();
    render(<Page />);

    expect(screen.getByText('Maria Lopez')).toBeInTheDocument();
    expect(screen.getByText('Carlos Ruiz')).toBeInTheDocument();
    expect(screen.getByText('Ing. Sistemas')).toBeInTheDocument();
    expect(screen.getByText('Contaduría')).toBeInTheDocument();
  });

  it('shows Revertir button only when practicesStatus is REPROBADO', async () => {
    mockActiveTab = 'reprobados';
    mockHookInstance.filteredPractices = [
      { practiceId: 1, studentName: 'Reprobado Manual', studentCi: 'V-1111', careerName: 'Ing.', practiceTypeName: 'ORDINARIA', result: 'failed', practicesStatus: 'REPROBADO', finalGrade: null },
      { practiceId: 2, studentName: 'Reprobado Automatico', studentCi: 'V-2222', careerName: 'Lic.', practiceTypeName: 'ORDINARIA', result: 'failed', practicesStatus: 'REPROBADO', finalGrade: 8 },
    ];
    const Page = await getPage();
    render(<Page />);

    // Ambos tienen practicesStatus REPROBADO
    const revertButtons = screen.getAllByText('Revertir');
    expect(revertButtons).toHaveLength(2);
  });

  it('does NOT show Revertir when practicesStatus is not REPROBADO (e.g. INSCRITO)', async () => {
    mockActiveTab = 'reprobados';
    mockHookInstance.filteredPractices = [
      { practiceId: 3, studentName: 'No Reversible', studentCi: 'V-3333', careerName: 'Ing.', practiceTypeName: 'ORDINARIA', result: 'failed', practicesStatus: 'INSCRITO', finalGrade: null },
    ];
    const Page = await getPage();
    render(<Page />);

    expect(screen.getByText('No Reversible')).toBeInTheDocument();
    expect(screen.queryByText('Revertir')).not.toBeInTheDocument();
  });

  it('calls handleReverseFailed when Revertir is clicked', async () => {
    const user = (await import('@testing-library/user-event')).default;
    mockActiveTab = 'reprobados';
    mockHookInstance.filteredPractices = [
      { practiceId: 1, studentName: 'Maria Lopez', studentCi: 'V-1234', careerName: 'Ing.', practiceTypeName: 'ORDINARIA', result: 'failed', practicesStatus: 'REPROBADO', finalGrade: null },
    ];
    const Page = await getPage();
    render(<Page />);

    await user.click(screen.getByText('Revertir'));
    expect(mockHandleReverseFailed).toHaveBeenCalledWith(1, 'Maria Lopez');
  });
});
