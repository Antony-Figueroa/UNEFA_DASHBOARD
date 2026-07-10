/**
 * @file EvaluationsAndCulmination.culminate.test.tsx
 * @description Tests for the culminate/approve flow in EvaluationsAndCulmination.
 * Verifies "Aprobar"/"Culminar" buttons trigger confirmation dialogs,
 * the override dialog works for hours deficit, and approveCulmination is invoked.
 * Spec: culminate-button-verify.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import type { PracticeWithEvaluations } from '../../../features/evaluations-culmination/types';

// ─── UI Component Mocks ──────────────────────────────────

vi.mock('../../../components/common/PageMeta', () => ({ default: () => null }));
vi.mock('../../../components/common/PageBreadCrumb', () => ({ default: () => null }));
vi.mock('../../../components/common/ComponentCard', () => ({
  default: ({ children }: any) => <div data-testid="component-card">{children}</div>,
}));
vi.mock('../../../components/ui/button/Button', () => ({
  default: ({ children, onClick, variant, className }: any) => (
    <button data-testid={`btn-${variant || 'default'}`} onClick={onClick} className={className}>
      {children}
    </button>
  ),
}));
vi.mock('../../../components/ui/badge/Badge', () => ({ default: ({ children }: any) => <span data-testid="badge">{children}</span> }));
vi.mock('../../../components/form/CustomSelect', () => ({ default: () => <div data-testid="custom-select" /> }));
vi.mock('../../../components/ui/table', () => ({
  Table: ({ children }: any) => <table data-testid="table">{children}</table>,
  TableBody: ({ children }: any) => <tbody>{children}</tbody>,
  TableCell: ({ children, isHeader }: any) => (isHeader ? <th>{children}</th> : <td>{children}</td>),
  TableHeader: ({ children }: any) => <thead>{children}</thead>,
  TableRow: ({ children, className }: any) => <tr className={className}>{children}</tr>,
  Pagination: () => null,
}));
vi.mock('../../../components/ui/table/EmptyState', () => ({
  EmptyState: ({ title, description }: any) => (
    <div data-testid="empty-state">
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  ),
}));
vi.mock('../../../components/ui/skeleton', () => ({ TableSkeleton: () => <div data-testid="skeleton" /> }));
vi.mock('../../../components/ui/dialog/UnifiedDialog', () => ({
  default: ({ isOpen, onClose, onConfirm, title, message, children, confirmLabel }: any) =>
    isOpen ? (
      <div data-testid="unified-dialog">
        <span data-testid="dialog-title">{title}</span>
        {message && <p data-testid="dialog-message">{message}</p>}
        {children}
        {onConfirm && (
          <button data-testid="dialog-confirm" onClick={onConfirm}>
            {confirmLabel || 'Confirmar'}
          </button>
        )}
        {onClose && (
          <button data-testid="dialog-cancel" onClick={onClose}>
            Cancelar
          </button>
        )}
      </div>
    ) : null,
}));
vi.mock('../../../icons', () => ({
  DownloadIcon: () => <span>Download</span>,
  CheckCircleIcon: () => <span>Check</span>,
  EyeIcon: () => <span>Eye</span>,
}));
vi.mock('../../../components/ui/tabs/Tabs', () => ({
  Tabs: ({ options }: any) => (
    <div data-testid="tabs">
      {options.map((o: any) => (
        <button key={o.id} data-testid={`tab-${o.id}`}>
          {o.label}
        </button>
      ))}
    </div>
  ),
}));

// ─── Feature Component Mocks ─────────────────────────────

vi.mock('../../../features/evaluations-culmination/components/ActionDropdown', () => ({
  ActionDropdown: ({ actions }: any) => (
    <div data-testid="action-dropdown">
      {actions.map((action: any, i: number) =>
        action.separator ? (
          <hr key={i} data-testid="separator" />
        ) : (
          <button key={i} onClick={action.onClick} className={action.className} data-testid={`action-${action.label.replace(/\s+/g, '-')}`}>
            {action.label}
          </button>
        ),
      )}
    </div>
  ),
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

// ─── Service / Context Mocks ─────────────────────────────

const mockApproveCulmination = vi.fn().mockResolvedValue({ success: true });

vi.mock('../../../features/evaluations-culmination/services/evaluationsCulminationService', () => ({
  evaluationsCulminationService: {
    getPractices: vi.fn().mockResolvedValue({ success: true, data: [], meta: { total: 0, periods: [], careers: [], practiceTypes: [] } }),
    approveCulmination: mockApproveCulmination,
  },
}));

vi.mock('react-hot-toast', () => ({
  default: { loading: vi.fn(), success: vi.fn(), error: vi.fn(), dismiss: vi.fn() },
}));
vi.mock('@/context/toast', () => ({ useToast: () => ({ addToast: vi.fn() }) }));
vi.mock('@/components/ui/dialog/DialogConfig', () => ({
  TOAST: {
    updated: () => ({ title: 'Actualizado', variant: 'success' }),
    updateError: () => ({ title: 'Error', variant: 'error' }),
    loadError: () => ({ title: 'Error', variant: 'error' }),
    created: () => ({ title: 'Creado', variant: 'success' }),
    createError: () => ({ title: 'Error', variant: 'error' }),
  },
}));

// ─── Helper ─────────────────────────────────────────────

const makePractice = (overrides: Partial<PracticeWithEvaluations> = {}): PracticeWithEvaluations => ({
  practiceId: 1,
  minimumGrade: 10,
  studentName: 'Juan Perez',
  studentCi: 'V-12345678',
  careerName: 'Ing. Sistemas',
  careerId: 1,
  institutionName: 'Hospital Central',
  institutionId: 1,
  periodId: 1,
  periodName: '1-2026',
  practiceTypeId: 1,
  practiceTypeName: 'PASANTIA',
  startDate: '2026-01-01',
  endDate: '2026-06-30',
  totalHours: 400,
  hoursRequired: 360,
  evaluationStatus: 'completed',
  culminationStatus: 'pending',
  result: 'approved',
  practicesStatus: 'INSCRITO',
  finalGrade: 16,
  isFrozen: false,
  extensionGranted: false,
  evaluations: {
    INSTITUCIONAL: { completed: true, score: 16, evaluatorName: 'Dr. A' },
    ACADEMICO: { completed: true, score: 15, evaluatorName: 'Prof. B' },
    COMITE: { completed: true, score: 17, evaluatorName: 'Comite' },
  },
  ...overrides,
});

// ─── Mutable Mock State ──────────────────────────────────

let mockOverrideTarget: { practice: PracticeWithEvaluations; reason: string } | null = null;
let mockSetOverrideTarget: any = vi.fn();
let mockHandleConfirmOverride: any = vi.fn();
let mockSetOverrideReason: any = vi.fn();
let mockConfirmDialog: any = null;
let mockCloseConfirmDialog: any = vi.fn();

const baseMockHook = {
  practices: [],
  filteredPractices: [],
  loading: false,
  isReadOnly: false,
  meta: { total: 0, periods: [], careers: [], practiceTypes: [] },
  itemsPerPage: 10,
  currentPage: 1,
  setCurrentPage: vi.fn(),
  setItemsPerPage: vi.fn(),
  searchTerm: '',
  setSearchTerm: vi.fn(),
  filters: {},
  updateFilter: vi.fn(),
  clearFilters: vi.fn(),
  evaluationStats: { total: 0, completed: 0, partial: 0, pending: 0, approved: 0, failed: 0 },
  culminationStats: { total: 0, pending: 0, approved: 0, certified: 0 },
  handleApprove: vi.fn(),
  handleGenerateCertificate: vi.fn(),
  handleDownloadPdf: vi.fn(),
  evalModalOpen: false,
  selectedPracticeForEval: null,
  selectedEvaluatorType: 'INSTITUCIONAL' as const,
  editingEvaluationId: undefined,
  handleOpenEvaluation: vi.fn(),
  handleCloseEvaluationModal: vi.fn(),
  handleEvaluationSuccess: vi.fn(),
  detailModalOpen: false,
  selectedEvaluationId: null,
  handleViewEvaluationDetails: vi.fn(),
  handleCloseDetailModal: vi.fn(),
  studentDetailOpen: false,
  selectedStudentPracticeId: null,
  selectedStudentName: '',
  handleViewStudentDetail: vi.fn(),
  handleCloseStudentDetail: vi.fn(),
  confirmDialog: null,
  closeConfirmDialog: mockCloseConfirmDialog,
  refresh: vi.fn(),
  // Admin
  withdrawDialogOpen: false,
  withdrawTarget: null,
  withdrawType: 'justified',
  setWithdrawType: vi.fn(),
  withdrawReason: '',
  setWithdrawReason: vi.fn(),
  handleWithdraw: vi.fn(),
  handleConfirmWithdraw: vi.fn(),
  setWithdrawDialogOpen: vi.fn(),
  handleReclassifyWithdrawal: vi.fn(),
  handleMarkFailed: vi.fn(),
  reverseDialogOpen: false,
  setReverseDialogOpen: vi.fn(),
  reverseTarget: null,
  reverseReason: '',
  reverseResolutionNumber: '',
  setReverseReason: vi.fn(),
  setReverseResolutionNumber: vi.fn(),
  handleReverseFailed: vi.fn(),
  handleConfirmReverseFailed: vi.fn(),
  handleUnfreeze: vi.fn(),
  unfreezeTarget: null,
  unfreezeReason: '',
  setUnfreezeReason: vi.fn(),
  handleConfirmUnfreeze: vi.fn(),
  setUnfreezeTarget: vi.fn(),
  extensionDialogOpen: false,
  extensionTarget: null,
  extensionReason: '',
  setExtensionReason: vi.fn(),
  handleGrantExtension: vi.fn(),
  handleConfirmExtension: vi.fn(),
  setExtensionDialogOpen: vi.fn(),
  handleRevokeExtension: vi.fn(),
  bulkExtensionOpen: false,
  setBulkExtensionOpen: vi.fn(),
  bulkExtensionSelectedIds: [],
  setBulkExtensionSelectedIds: vi.fn(),
  bulkExtensionReason: '',
  setBulkExtensionReason: vi.fn(),
  handleBulkExtension: vi.fn(),
  handleConfirmBulkExtension: vi.fn(),
  handleFreezeAll: vi.fn(),
  committeeDialogOpen: false,
  committeeTarget: null,
  handleOpenCommittee: vi.fn(),
  setCommitteeDialogOpen: vi.fn(),
  handleExportExcel: vi.fn(),
  auditHistoryOpen: false,
  setAuditHistoryOpen: vi.fn(),
  auditHistoryData: [],
  auditHistoryLoading: false,
  handleViewAudit: vi.fn(),
  // Override (some don't exist yet — tests for RED phase)
  overrideTarget: null,
  setOverrideTarget: vi.fn(),
  handleConfirmOverride: vi.fn(),
  setOverrideReason: vi.fn(),
};

// Mock the hook
vi.mock('../../../features/evaluations-culmination/hooks/useEvaluationsCulmination', () => ({
  useEvaluationsCulmination: () => mockHookInstance,
}));

// Mock useTabs
let mockActiveTab = 'evaluations';
vi.mock('../../../hooks/useTabs', () => ({
  useTabs: () => ({
    activeTab: mockActiveTab,
    tabProps: { activeTab: mockActiveTab, onChange: vi.fn() },
  }),
}));

// Mock useSystemEvaluationConfig
vi.mock('../../../features/evaluations/hooks/useSystemEvaluationConfig', () => ({
  useSystemEvaluationConfig: () => ({ config: { score: { displayScale: 20 } }, loading: false }),
}));

let mockHookInstance: any;

describe('EvaluationsAndCulmination — Culminate flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockActiveTab = 'evaluations';
    mockOverrideTarget = null;
    mockConfirmDialog = null;

    // Reset mock functions
    mockSetOverrideTarget = vi.fn((val) => { mockOverrideTarget = val; });
    mockSetOverrideReason = vi.fn((reason: string) => {
      mockOverrideTarget = mockOverrideTarget ? { ...mockOverrideTarget, reason } : null;
    });
    mockHandleConfirmOverride = vi.fn();
    mockCloseConfirmDialog = vi.fn(() => { mockConfirmDialog = null; });
    mockApproveCulmination.mockClear();

    mockHookInstance = {
      ...baseMockHook,
      overrideTarget: null,
      setOverrideTarget: mockSetOverrideTarget,
      handleConfirmOverride: mockHandleConfirmOverride,
      setOverrideReason: mockSetOverrideReason,
      confirmDialog: null,
      closeConfirmDialog: mockCloseConfirmDialog,
      handleApprove: vi.fn(),
    };
  });

  const getPage = async () => {
    const mod = await import('../EvaluationsAndCulmination');
    return mod.default;
  };

  // ─── Render tests ───────────────────────────────────

  it('renders "Aprobar" button for eligible practice in Culminación tab', async () => {
    mockActiveTab = 'culmination';
    mockHookInstance = {
      ...mockHookInstance,
      filteredPractices: [makePractice({ culminationStatus: 'pending', result: 'approved' })],
    };

    const Page = await getPage();
    render(<Page />);

    // Aprobar appears once (culmination tab renders it as a direct button, not in dropdown)
    const aprobarBtns = screen.getAllByText('Aprobar');
    expect(aprobarBtns.length).toBeGreaterThanOrEqual(1);
    // Juan Perez appears in both desktop table and mobile cards
    const nameElements = screen.getAllByText('Juan Perez');
    expect(nameElements.length).toBeGreaterThanOrEqual(1);
  });

  it('renders "Culminar" action in Evaluaciones tab dropdown for eligible practice', async () => {
    mockActiveTab = 'evaluations';
    mockHookInstance = {
      ...mockHookInstance,
      filteredPractices: [makePractice({ evaluationStatus: 'completed', result: 'approved', culminationStatus: 'pending' })],
      isReadOnly: false,
    };

    const Page = await getPage();
    render(<Page />);

    // Culminar appears in both desktop and mobile dropdowns — use getAllBy
    const culminarBtns = screen.getAllByTestId('action-Culminar');
    expect(culminarBtns.length).toBeGreaterThanOrEqual(1);
    const culminarTexts = screen.getAllByText('Culminar');
    expect(culminarTexts.length).toBeGreaterThanOrEqual(1);
  });

  it('does NOT render "Aprobar" button when practice is not eligible (culminationStatus != pending)', async () => {
    mockActiveTab = 'culmination';
    mockHookInstance = {
      ...mockHookInstance,
      filteredPractices: [makePractice({ culminationStatus: 'approved', result: 'approved' })],
    };

    const Page = await getPage();
    render(<Page />);

    expect(screen.queryByText('Aprobar')).not.toBeInTheDocument();
  });

  it('does NOT render "Aprobar" button when result is not approved', async () => {
    mockActiveTab = 'culmination';
    mockHookInstance = {
      ...mockHookInstance,
      filteredPractices: [makePractice({ culminationStatus: 'pending', result: 'pending' })],
    };

    const Page = await getPage();
    render(<Page />);

    expect(screen.queryByText('Aprobar')).not.toBeInTheDocument();
  });

  // ─── Dialog rendering tests ─────────────────────────

  it('shows the confirmation dialog when confirmDialog is set', async () => {
    mockActiveTab = 'culmination';
    const mockOnConfirm = vi.fn();
    mockHookInstance = {
      ...mockHookInstance,
      filteredPractices: [makePractice()],
      confirmDialog: {
        isOpen: true,
        title: 'Aprobar Culminación',
        message: '¿Está seguro de aprobar la culminación?',
        onConfirm: mockOnConfirm,
      },
    };

    const Page = await getPage();
    render(<Page />);

    expect(screen.getByTestId('unified-dialog')).toBeInTheDocument();
    expect(screen.getByTestId('dialog-title')).toHaveTextContent('Aprobar Culminación');
  });

  it('calls the confirm dialog onConfirm when the confirm button is clicked', async () => {
    mockActiveTab = 'culmination';
    const mockOnConfirm = vi.fn();
    mockHookInstance = {
      ...mockHookInstance,
      filteredPractices: [makePractice()],
      confirmDialog: {
        isOpen: true,
        title: 'Aprobar Culminación',
        message: '¿Está seguro?',
        onConfirm: mockOnConfirm,
      },
    };

    const Page = await getPage();
    render(<Page />);

    const confirmBtn = screen.getByTestId('dialog-confirm');
    fireEvent.click(confirmBtn);

    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });

  // ─── Override dialog tests ──────────────────────────

  it('shows the override dialog when overrideTarget is set', async () => {
    mockActiveTab = 'culmination';
    const practice = makePractice({ totalHours: 200, hoursRequired: 360 });
    mockHookInstance = {
      ...mockHookInstance,
      filteredPractices: [practice],
      overrideTarget: { practice, reason: '' },
    };

    const Page = await getPage();
    render(<Page />);

    // The override dialog uses UnifiedDialog — it should be visible
    expect(screen.getByTestId('unified-dialog')).toBeInTheDocument();
  });

  it('calls setOverrideReason when the override dialog textarea changes', async () => {
    mockActiveTab = 'culmination';
    const practice = makePractice({ totalHours: 200, hoursRequired: 360 });
    const setOverrideReasonMock = vi.fn();
    mockHookInstance = {
      ...mockHookInstance,
      filteredPractices: [practice],
      overrideTarget: { practice, reason: '' },
      setOverrideReason: setOverrideReasonMock,
    };

    const Page = await getPage();
    render(<Page />);

    // Find the textarea in the override dialog
    const textarea = screen.getByPlaceholderText(/motivo|razón|déficit/i);
    expect(textarea).toBeInTheDocument();

    fireEvent.change(textarea, { target: { value: 'Horas insuficientes por cambio de horario' } });
    expect(setOverrideReasonMock).toHaveBeenCalledWith('Horas insuficientes por cambio de horario');
  });

  it('calls handleConfirmOverride when the override dialog confirm button is clicked', async () => {
    mockActiveTab = 'culmination';
    const practice = makePractice({ totalHours: 200, hoursRequired: 360 });
    const handleConfirmOverrideMock = vi.fn();
    mockHookInstance = {
      ...mockHookInstance,
      filteredPractices: [practice],
      overrideTarget: { practice, reason: 'Motivo válido para déficit' },
      handleConfirmOverride: handleConfirmOverrideMock,
    };

    const Page = await getPage();
    render(<Page />);

    const confirmBtn = screen.getByTestId('dialog-confirm');
    fireEvent.click(confirmBtn);

    expect(handleConfirmOverrideMock).toHaveBeenCalledTimes(1);
  });

  // ─── handleApprove wiring ───────────────────────────

  it('calls handleApprove when "Aprobar" button is clicked', async () => {
    mockActiveTab = 'culmination';
    const handleApproveMock = vi.fn();
    mockHookInstance = {
      ...mockHookInstance,
      filteredPractices: [makePractice({ culminationStatus: 'pending', result: 'approved' })],
      handleApprove: handleApproveMock,
    };

    const Page = await getPage();
    render(<Page />);

    fireEvent.click(screen.getByText('Aprobar'));
    expect(handleApproveMock).toHaveBeenCalledTimes(1);
    expect(handleApproveMock).toHaveBeenCalledWith(
      expect.objectContaining({ practiceId: 1, studentName: 'Juan Perez' }),
    );
  });

  it('calls handleApprove when "Culminar" is clicked in Evaluaciones tab', async () => {
    mockActiveTab = 'evaluations';
    const handleApproveMock = vi.fn();
    mockHookInstance = {
      ...mockHookInstance,
      filteredPractices: [makePractice({ evaluationStatus: 'completed', result: 'approved', culminationStatus: 'pending' })],
      handleApprove: handleApproveMock,
      isReadOnly: false,
    };

    const Page = await getPage();
    render(<Page />);

    // Culminar appears in both desktop and mobile dropdowns — pick the first
    const culminarBtns = screen.getAllByTestId('action-Culminar');
    fireEvent.click(culminarBtns[0]);
    expect(handleApproveMock).toHaveBeenCalledTimes(1);
    expect(handleApproveMock).toHaveBeenCalledWith(
      expect.objectContaining({ practiceId: 1 }),
    );
  });

  it('does NOT show override dialog when overrideTarget is null', async () => {
    mockActiveTab = 'culmination';
    mockHookInstance = {
      ...mockHookInstance,
      filteredPractices: [makePractice({ totalHours: 200, hoursRequired: 360 })],
      overrideTarget: null,
    };

    const Page = await getPage();
    render(<Page />);

    expect(screen.queryByTestId('unified-dialog')).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/motivo|razón|déficit/i)).not.toBeInTheDocument();
  });

  it('closes the override dialog when cancel is clicked', async () => {
    mockActiveTab = 'culmination';
    const practice = makePractice({ totalHours: 200, hoursRequired: 360 });
    const setOverrideTargetMock = vi.fn();
    mockHookInstance = {
      ...mockHookInstance,
      filteredPractices: [practice],
      overrideTarget: { practice, reason: 'test' },
      setOverrideTarget: setOverrideTargetMock,
    };

    const Page = await getPage();
    render(<Page />);

    const cancelBtn = screen.getByTestId('dialog-cancel');
    fireEvent.click(cancelBtn);

    expect(setOverrideTargetMock).toHaveBeenCalledWith(null);
  });
});
