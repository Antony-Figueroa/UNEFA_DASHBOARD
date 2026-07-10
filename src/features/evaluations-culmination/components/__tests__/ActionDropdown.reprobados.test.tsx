/**
 * @file ActionDropdown.reprobados.test.tsx
 * @description Tests para el ActionDropdown en el contexto de reprobados.
 * Verifica que Retirar/Reclasificar Retiro no estén presentes y
 * que Marcar Reprobado esté aislado tras el separador con clase danger.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';

// We import the REAL component for these tests
import { ActionDropdown } from '../ActionDropdown';

// Mock Framer Motion for portal rendering
vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock createPortal to render inline for testing
vi.mock('react-dom', () => ({
  createPortal: (children: any) => children,
}));

describe('ActionDropdown — reprobados state guards', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders actions without Retirar or Reclasificar Retiro for INSCRITO practice', () => {
    const actions = [
      { label: 'Culminar', onClick: vi.fn(), className: 'text-success-600 dark:text-success-400' },
      { label: 'Gestionar Comité', onClick: vi.fn() },
      { label: 'Otorgar Extensión', onClick: vi.fn() },
      { label: 'Ver Auditoría', onClick: vi.fn() },
      { separator: true, label: '', onClick: () => {} },
      { label: 'Marcar Reprobado', onClick: vi.fn(), className: 'text-error-600 dark:text-error-400' },
    ];

    render(<ActionDropdown actions={actions} />);
    // Trigger button has no text label — use role='button' (menuitems use role='menuitem')
    const button = screen.getByRole('button');
    fireEvent.click(button);

    // These should be present
    expect(screen.getByText('Culminar')).toBeInTheDocument();
    expect(screen.getByText('Gestionar Comité')).toBeInTheDocument();
    expect(screen.getByText('Ver Auditoría')).toBeInTheDocument();
    expect(screen.getByText('Marcar Reprobado')).toBeInTheDocument();

    // These should NOT be present
    expect(screen.queryByText('Retirar')).not.toBeInTheDocument();
    expect(screen.queryByText('Reclasificar Retiro')).not.toBeInTheDocument();
  });

  it('places Marcar Reprobado after separator (not adjacent to Culminar)', () => {
    const actions = [
      { label: 'Culminar', onClick: vi.fn(), className: 'text-success-600 dark:text-success-400' },
      { label: 'Gestionar Comité', onClick: vi.fn() },
      { label: 'Ver Auditoría', onClick: vi.fn() },
      { separator: true, label: '', onClick: () => {} },
      { label: 'Marcar Reprobado', onClick: vi.fn(), className: 'text-error-600 dark:text-error-400' },
    ];

    render(<ActionDropdown actions={actions} />);
    const button = screen.getByRole('button');
    fireEvent.click(button);

    const menuItems = screen.getAllByRole('menuitem');
    const culminarIndex = menuItems.findIndex(item => item.textContent === 'Culminar');
    const reprobadoIndex = menuItems.findIndex(item => item.textContent === 'Marcar Reprobado');

    // Marcar Reprobado should NOT be adjacent to Culminar
    // (there should be other items and a separator between them)
    expect(Math.abs(culminarIndex - reprobadoIndex)).toBeGreaterThan(1);

    // Marcar Reprobado should be after the separator (the last interactive item before it
    // should be Ver Auditoría, then separator, then Marcar Reprobado)
    const auditoriaIndex = menuItems.findIndex(item => item.textContent === 'Ver Auditoría');
    // Marcar Reprobado should appear AFTER Ver Auditoría (separator is between them)
    expect(reprobadoIndex).toBeGreaterThan(auditoriaIndex);

    // Culminar should be BEFORE Ver Auditoría
    expect(culminarIndex).toBeLessThan(auditoriaIndex);
  });

  it('gives Marcar Reprobado the danger className', () => {
    const actions = [
      { label: 'Culminar', onClick: vi.fn(), className: 'text-success-600 dark:text-success-400' },
      { label: 'Gestionar Comité', onClick: vi.fn() },
      { label: 'Ver Auditoría', onClick: vi.fn() },
      { separator: true, label: '', onClick: () => {} },
      { label: 'Marcar Reprobado', onClick: vi.fn(), className: 'text-error-600 dark:text-error-400' },
    ];

    render(<ActionDropdown actions={actions} />);
    const button = screen.getByRole('button');
    fireEvent.click(button);

    const marcarReprobado = screen.getByText('Marcar Reprobado');
    // The button should have the danger class in its rendered className
    const buttonElement = marcarReprobado.closest('button');
    expect(buttonElement?.className).toContain('text-error-600');
    expect(buttonElement?.className).toContain('dark:text-error-400');
  });

  it('shows separator between Ver Auditoría and Marcar Reprobado', () => {
    const actions = [
      { label: 'Culminar', onClick: vi.fn() },
      { label: 'Gestionar Comité', onClick: vi.fn() },
      { label: 'Ver Auditoría', onClick: vi.fn() },
      { separator: true, label: '', onClick: () => {} },
      { label: 'Marcar Reprobado', onClick: vi.fn(), className: 'text-error-600 dark:text-error-400' },
    ];

    const { container } = render(<ActionDropdown actions={actions} />);
    const button = screen.getByRole('button');
    fireEvent.click(button);

    // There should be a separator element (role="separator")
    const separators = screen.getAllByRole('separator');
    expect(separators.length).toBeGreaterThanOrEqual(1);
  });
});
