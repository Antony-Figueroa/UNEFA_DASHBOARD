/**
 * @file EvaluationFlowModal.test.tsx
 * @description Tests para el componente EvaluationFlowModal.
 *
 * TDD Cycle 1: RED — tests first
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { MemoryRouter } from 'react-router';

// --- Mocks ---

// Mock UnifiedDialog
vi.mock('../../../../components/ui/dialog/UnifiedDialog', () => ({
  default: ({ isOpen, onClose, onConfirm, title, message, confirmLabel, cancelLabel, variant, children }: any) => {
    if (!isOpen) return null;
    return (
      <div data-testid="unified-dialog" data-variant={variant}>
        <h3 data-testid="dialog-title">{title}</h3>
        <p data-testid="dialog-message">{message}</p>
        {children && <div data-testid="dialog-children">{children}</div>}
        <button data-testid="dialog-continuar" onClick={onConfirm}>{confirmLabel}</button>
        <button data-testid="dialog-cerrar" onClick={onClose}>{cancelLabel || 'Cerrar'}</button>
      </div>
    );
  },
}));

// Mock icons
vi.mock('../../../../icons', () => ({
  CheckCircleIcon: (props: any) => <span data-testid="check-circle-icon" {...props} />,
  ArrowRightIcon: (props: any) => <span data-testid="arrow-right-icon" {...props} />,
}));

// Mock Button component
vi.mock('../../../../components/ui/button/Button', () => ({
  default: ({ children, onClick, disabled, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
}));

// Mock Framer Motion
vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

import { EvaluationFlowModal } from '../EvaluationFlowModal';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>{children}</MemoryRouter>
);

describe('EvaluationFlowModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onContinue: vi.fn(),
    nextType: 'ACADEMICO' as const,
    studentName: 'Juan Pérez',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 2.4 — Verificar que retorna null cuando isOpen=false
  it('should return null when isOpen is false', () => {
    const { container } = render(
      <EvaluationFlowModal {...defaultProps} isOpen={false} />,
      { wrapper }
    );
    expect(container.innerHTML).toBe('');
  });

  // 2.3 — Verificar renderizado correcto con mock
  it('should render with correct title and message for non-COMITE types', () => {
    render(<EvaluationFlowModal {...defaultProps} />, { wrapper });

    expect(screen.getByTestId('dialog-title')).toHaveTextContent('Siguiente Paso');
    expect(screen.getByTestId('dialog-message')).toHaveTextContent(
      'Juan Pérez'
    );
    expect(screen.getByTestId('dialog-message')).toHaveTextContent(
      'Evaluación Académica'
    );
  });

  it('should render with correct title and message for INSTITUCIONAL type', () => {
    render(
      <EvaluationFlowModal
        {...defaultProps}
        nextType="INSTITUCIONAL"
      />,
      { wrapper }
    );

    expect(screen.getByTestId('dialog-message')).toHaveTextContent(
      'Evaluación Institucional'
    );
  });

  it('should render correct message for COMITE type with member index', () => {
    render(
      <EvaluationFlowModal
        {...defaultProps}
        nextType="COMITE"
        nextMemberIndex={2}
      />,
      { wrapper }
    );

    expect(screen.getByTestId('dialog-message')).toHaveTextContent(
      'Miembro #2'
    );
  });

  it('should render COMITE message without memberIndex gracefully', () => {
    render(
      <EvaluationFlowModal
        {...defaultProps}
        nextType="COMITE"
      />,
      { wrapper }
    );

    expect(screen.getByTestId('dialog-message')).toHaveTextContent(
      'Evaluación Comité'
    );
  });

  // 2.3 — Test pressing "Continuar" invokes callback
  it('should call onContinue when "Continuar" is clicked', async () => {
    const user = userEvent.setup();
    const onContinue = vi.fn();

    render(
      <EvaluationFlowModal {...defaultProps} onContinue={onContinue} />,
      { wrapper }
    );

    await user.click(screen.getByTestId('dialog-continuar'));
    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when "Cerrar" is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <EvaluationFlowModal {...defaultProps} onClose={onClose} />,
      { wrapper }
    );

    await user.click(screen.getByTestId('dialog-cerrar'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should render variant="success" on the dialog', () => {
    render(<EvaluationFlowModal {...defaultProps} />, { wrapper });

    expect(screen.getByTestId('unified-dialog')).toHaveAttribute(
      'data-variant',
      'success'
    );
  });

  it('should display "Continuar" and "Cerrar" as button labels', () => {
    render(<EvaluationFlowModal {...defaultProps} />, { wrapper });

    expect(screen.getByTestId('dialog-continuar')).toHaveTextContent('Continuar');
    expect(screen.getByTestId('dialog-cerrar')).toHaveTextContent('Cerrar');
  });

  it('should render without studentName gracefully', () => {
    render(
      <EvaluationFlowModal
        {...defaultProps}
        studentName={undefined}
      />,
      { wrapper }
    );

    // Should still render title and message without crashing
    expect(screen.getByTestId('dialog-title')).toBeInTheDocument();
  });
});
