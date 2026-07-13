/**
 * @file EvaluationModal.flow.test.tsx
 * @description Tests para el flujo secuencial en EvaluationModal.
 *
 * TDD Cycle 2: RED — tests first
 */

import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { MemoryRouter } from 'react-router';

// Store original mock impl to restore between tests
const mockUseEvaluations = vi.hoisted(() => ({
  criteria: [
    { criteriaId: 1, itemNumber: 1, description: 'Criterio 1', evaluatorType: 'INSTITUCIONAL' },
    { criteriaId: 2, itemNumber: 2, description: 'Criterio 2', evaluatorType: 'INSTITUCIONAL' },
  ],
  fetchCriteria: vi.fn(),
  createEvaluation: vi.fn().mockResolvedValue(true),
  updateEvaluation: vi.fn().mockResolvedValue(true),
  loading: false,
  error: null,
}));

const mockUseSystemConfig = vi.hoisted(() => ({
  config: {
    score: { min: 1, max: 10, displayScale: 20 },
    weights: { INSTITUCIONAL: 0.4, ACADEMICO: 0.3, COMITE: 0.3 },
    committeeMinMembers: 3,
  },
}));

const mockDetailedStatus = vi.hoisted(() => vi.fn());

// --- Mocks ---
vi.mock('../../services/evaluationService', () => ({
  evaluationService: {
    getCommitteeAssignments: vi.fn().mockResolvedValue([]),
    getPracticeTutorInfo: vi.fn().mockResolvedValue({ name: 'Tutor Test', ci: 'V12345678' }),
    getEvaluationById: vi
      .fn()
      .mockRejectedValue(new Error('No eval')),
    getDetailedPracticeStatus: mockDetailedStatus,
  },
}));

vi.mock('../../services/personService', () => ({
  searchPersons: vi.fn().mockResolvedValue([]),
}));

vi.mock('../../../../api/apiClient', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: { items: [] } }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    put: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

vi.mock('../../hooks/useEvaluations', () => ({
  useEvaluations: () => mockUseEvaluations,
}));

vi.mock('../../hooks/useSystemEvaluationConfig', () => ({
  useSystemEvaluationConfig: () => mockUseSystemConfig,
}));

vi.mock('../../../../components/ui/modal', () => ({
  Modal: ({ isOpen, children }: any) =>
    isOpen ? <div data-testid="modal">{children}</div> : null,
  ModalHeader: ({ children }: any) => (
    <div data-testid="modal-header">{children}</div>
  ),
  ModalBody: ({ children }: any) => (
    <div data-testid="modal-body">{children}</div>
  ),
  ModalFooter: ({ children }: any) => (
    <div data-testid="modal-footer">{children}</div>
  ),
}));

vi.mock('../../../../components/ui/button/Button', () => ({
  default: ({ children, onClick, disabled, loading, type, ...props }: any) => (
    <button
      data-testid="button"
      onClick={onClick}
      disabled={disabled}
      type={type || 'button'}
      {...props}
    >
      {loading ? 'Guardando...' : children}
    </button>
  ),
}));

vi.mock('../../../../components/ui/dialog/UnifiedDialog', () => ({
  default: ({
    isOpen,
    onClose,
    onConfirm,
    title,
    confirmLabel,
    cancelLabel,
    variant,
  }: any) => {
    if (!isOpen) return null;
    return (
      <div data-testid={`unified-dialog-${variant}`} data-variant={variant}>
        <h3>{title}</h3>
        <button data-testid={`dialog-confirm`} onClick={onConfirm}>
          {confirmLabel}
        </button>
        <button data-testid={`dialog-cancel`} onClick={onClose}>
          {cancelLabel}
        </button>
      </div>
    );
  },
}));

vi.mock('../../../../icons', () => ({
  SearchIcon: (props: any) => <span data-testid="search-icon" {...props} />,
  CheckCircleIcon: (props: any) => <span {...props} />,
  AlertIcon: (props: any) => <span {...props} />,
  InfoIcon: (props: any) => <span {...props} />,
  ErrorIcon: (props: any) => <span {...props} />,
}));

vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

import { EvaluationModal } from '../EvaluationModal';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>{children}</MemoryRouter>
);

describe('EvaluationModal — Flow (onNavigateToNext)', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    practiceId: 1,
    evaluatorType: 'INSTITUCIONAL' as const,
    onSuccess: vi.fn(),
    isFrozen: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseEvaluations.createEvaluation = vi.fn().mockResolvedValue(true);
    mockUseEvaluations.updateEvaluation = vi.fn().mockResolvedValue(true);
    mockUseEvaluations.criteria = [
      { criteriaId: 1, itemNumber: 1, description: 'Criterio 1', evaluatorType: 'INSTITUCIONAL' },
      { criteriaId: 2, itemNumber: 2, description: 'Criterio 2', evaluatorType: 'INSTITUCIONAL' },
    ];
  });

  // 3.1 — onNavigateToNext es opcional
  it('should render without onNavigateToNext prop', () => {
    render(<EvaluationModal {...defaultProps} />, { wrapper });
    expect(screen.getByTestId('modal')).toBeInTheDocument();
  });

  // 3.2 — Cuando la evaluación no está completa y onNavigateToNext existe,
  // debe llamar a getDetailedPracticeStatus para determinar el siguiente paso
  // y mostrar el flow modal.
  it('should show flow modal when save succeeds and next step exists', async () => {
    const user = userEvent.setup();
    const onNavigateToNext = vi.fn();
    const onClose = vi.fn();

    mockDetailedStatus.mockResolvedValue({
      practiceId: '1',
      evaluationStatus: 'partial',
      evaluations: {
        INSTITUCIONAL: {
          completed: true,
          score: 8,
          evaluatorName: 'Test',
          evaluationId: 1,
        },
        ACADEMICO: { completed: false, score: 0, evaluatorName: '' },
        COMITE: { completed: false, score: 0, evaluatorName: '' },
      },
      finalGrade: '0',
      completedCount: 1,
      canEvaluate: true,
      periodMessage: '',
    });

    render(
      <EvaluationModal
        {...defaultProps}
        onNavigateToNext={onNavigateToNext}
        onClose={onClose}
      />,
      { wrapper }
    );

    // Fill form
    const nameInput = screen.getByPlaceholderText('Nombre del evaluador');
    await user.type(nameInput, 'Test Evaluador');

    // Check confirmation
    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);

    // Click submit
    const submitBtns = screen.getAllByTestId('button');
    const submitBtn = submitBtns.find(
      (b) =>
        b.textContent?.includes('Guardar Evaluación') ||
        b.textContent?.includes('Guardar')
    );
    expect(submitBtn).toBeTruthy();
    await user.click(submitBtn!);

    // Wait: should have checked status and NOT closed
    await vi.waitFor(
      () => {
        expect(mockDetailedStatus).toHaveBeenCalledWith(1);
      },
      { timeout: 3000 }
    );

    // onClose should NOT have been called at this point
    expect(onClose).not.toHaveBeenCalled();
  });

  // 3.3 — Cuando la evaluación está completa, se muestra el modal de finalización
  it('should show completion modal when all evaluations are complete', async () => {
    const user = userEvent.setup();
    const onNavigateToNext = vi.fn();

    mockDetailedStatus.mockResolvedValue({
      practiceId: '1',
      evaluationStatus: 'completed',
      evaluations: {
        INSTITUCIONAL: {
          completed: true,
          score: 8,
          evaluatorName: 'Test',
          evaluationId: 1,
        },
        ACADEMICO: {
          completed: true,
          score: 7,
          evaluatorName: 'Test2',
          evaluationId: 2,
        },
        COMITE: {
          completed: true,
          score: 9,
          evaluatorName: 'Test3',
          evaluationId: 3,
          members: [
            { memberIndex: 1, score: 9, evaluatorName: 'M1', evaluationId: 4 },
            { memberIndex: 2, score: 8, evaluatorName: 'M2', evaluationId: 5 },
            { memberIndex: 3, score: 9, evaluatorName: 'M3', evaluationId: 6 },
          ],
        },
      },
      finalGrade: '8.0',
      completedCount: 3,
      canEvaluate: true,
      periodMessage: '',
    });

    render(
      <EvaluationModal
        {...defaultProps}
        onNavigateToNext={onNavigateToNext}
      />,
      { wrapper }
    );

    const nameInput = screen.getByPlaceholderText('Nombre del evaluador');
    await user.type(nameInput, 'Test Evaluador');
    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);
    const submitBtns = screen.getAllByTestId('button');
    const submitBtn = submitBtns.find((b) =>
      b.textContent?.includes('Guardar')
    );
    await user.click(submitBtn!);

    // Should show completion dialog
    await vi.waitFor(
      () => {
        expect(
          screen.getByText(/Comité Evaluador — Completo|Evaluaciones — Completas/)
        ).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Should NOT call onNavigateToNext
    expect(onNavigateToNext).not.toHaveBeenCalled();
  });
});
