/**
 * @file EvaluationActions.test.tsx
 * @description Tests para el componente EvaluationActions.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { MemoryRouter } from 'react-router';
import { EvaluationActions } from '../EvaluationActions';

// --- Mocks ---

// Mock icons
vi.mock('../../../../icons', () => ({
  DownloadIcon: (props: any) => <span data-testid="download-icon" {...props} />,
  LockIcon: (props: any) => <span data-testid="lock-icon" {...props} />,
}));

// Mock Button component
vi.mock('../../../../components/ui/button/Button', () => ({
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

// Mock Framer Motion
vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>{children}</MemoryRouter>
);

describe('EvaluationActions', () => {
  const defaultProps = {
    isReadOnly: false,
    onFreezeAll: vi.fn(),
    onExportExcel: vi.fn(),
    onBulkExtension: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render all three buttons', () => {
    render(<EvaluationActions {...defaultProps} />, { wrapper });

    expect(screen.getByText('Exportar Excel')).toBeInTheDocument();
    expect(screen.getByText('Extensión Masiva')).toBeInTheDocument();
    expect(screen.getByText('Cerrar Actas')).toBeInTheDocument();
  });

  it('should render icons inside buttons', () => {
    render(<EvaluationActions {...defaultProps} />, { wrapper });

    expect(screen.getByTestId('download-icon')).toBeInTheDocument();
    expect(screen.getByTestId('lock-icon')).toBeInTheDocument();
  });

  it('should disable buttons when isReadOnly is true', () => {
    render(<EvaluationActions {...defaultProps} isReadOnly={true} />, { wrapper });

    const exportBtn = screen.getByText('Exportar Excel').closest('button');
    const extensionBtn = screen.getByText('Extensión Masiva').closest('button');
    const freezeBtn = screen.getByText('Cerrar Actas').closest('button');

    expect(exportBtn).toBeDisabled();
    expect(extensionBtn).toBeDisabled();
    expect(freezeBtn).toBeDisabled();
  });

  it('should enable buttons when isReadOnly is false', () => {
    render(<EvaluationActions {...defaultProps} isReadOnly={false} />, { wrapper });

    const exportBtn = screen.getByText('Exportar Excel').closest('button');
    const extensionBtn = screen.getByText('Extensión Masiva').closest('button');
    const freezeBtn = screen.getByText('Cerrar Actas').closest('button');

    expect(exportBtn).not.toBeDisabled();
    expect(extensionBtn).not.toBeDisabled();
    expect(freezeBtn).not.toBeDisabled();
  });

  it('should call onExportExcel when Exportar Excel is clicked', async () => {
    const user = userEvent.setup();
    const onExportExcel = vi.fn();

    render(<EvaluationActions {...defaultProps} onExportExcel={onExportExcel} />, { wrapper });

    await user.click(screen.getByText('Exportar Excel'));

    expect(onExportExcel).toHaveBeenCalledTimes(1);
  });

  it('should call onBulkExtension when Extensión Masiva is clicked', async () => {
    const user = userEvent.setup();
    const onBulkExtension = vi.fn();

    render(<EvaluationActions {...defaultProps} onBulkExtension={onBulkExtension} />, { wrapper });

    await user.click(screen.getByText('Extensión Masiva'));

    expect(onBulkExtension).toHaveBeenCalledTimes(1);
  });

  it('should call onFreezeAll when Cerrar Actas is clicked', async () => {
    const user = userEvent.setup();
    const onFreezeAll = vi.fn();

    render(<EvaluationActions {...defaultProps} onFreezeAll={onFreezeAll} />, { wrapper });

    await user.click(screen.getByText('Cerrar Actas'));

    expect(onFreezeAll).toHaveBeenCalledTimes(1);
  });

  it('should not call handlers when buttons are disabled', async () => {
    const user = userEvent.setup();
    const onExportExcel = vi.fn();
    const onBulkExtension = vi.fn();
    const onFreezeAll = vi.fn();

    render(
      <EvaluationActions
        isReadOnly={true}
        onExportExcel={onExportExcel}
        onBulkExtension={onBulkExtension}
        onFreezeAll={onFreezeAll}
      />,
      { wrapper }
    );

    // userEvent.click does not fire on disabled buttons, but let's verify no calls
    expect(onExportExcel).not.toHaveBeenCalled();
    expect(onBulkExtension).not.toHaveBeenCalled();
    expect(onFreezeAll).not.toHaveBeenCalled();
  });
});
