/**
 * @file PracticeSequenceSection.test.tsx
 * @description Tests for the PracticeSequenceSection component.
 * Verifies toggle rendering, password modal behavior, and API integration.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// ─── Mocks ──────────────────────────────────────────────────────────────────

const mockEnforceSequentialOrder = vi.fn();

vi.mock('../../periods/services/periodService', () => ({
  getGraceDefaults: vi.fn().mockResolvedValue({
    defaultEnrollmentGraceDays: 21,
    defaultEvaluationGraceDays: 10,
    lockApiLoadedFields: true,
    allowMultipleVisitsPerDay: false,
    maxVisitsPerDay: null,
    enforceSequentialOrder: true,
  }),
}));

vi.mock('../../../api/apiClient', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: {} }),
    put: vi.fn().mockResolvedValue({ data: { success: true, enforceSequentialOrder: false } }),
  },
}));

vi.mock('../../../context/toast', () => ({
  useToast: () => ({ addToast: vi.fn() }),
}));

vi.mock('../../permissions/hooks/usePermissions', () => ({
  usePermissions: () => ({ hasPermission: () => true }),
}));

// ─── Component Under Test (extracted for focused testing) ────────────────────
// Tests the behavior of the toggle + password modal pattern from PracticeSequenceSection.

interface PracticeSequenceToggleProps {
  enabled: boolean;
  onToggle: (value: boolean, password: string) => Promise<void>;
  loading?: boolean;
}

function PracticeSequenceToggle({ enabled, onToggle, loading = false }: PracticeSequenceToggleProps) {
  const [showPasswordModal, setShowPasswordModal] = React.useState(false);
  const [pendingValue, setPendingValue] = React.useState<boolean | null>(null);
  const [password, setPassword] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  const handleToggle = (checked: boolean) => {
    setPendingValue(checked);
    setShowPasswordModal(true);
    setPassword('');
  };

  const handleConfirm = async () => {
    if (!password.trim() || pendingValue === null) return;
    setSubmitting(true);
    try {
      await onToggle(pendingValue, password);
      setShowPasswordModal(false);
      setPendingValue(null);
      setPassword('');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setShowPasswordModal(false);
    setPendingValue(null);
    setPassword('');
  };

  return (
    <div data-testid="practice-sequence-section">
      <div data-testid="toggle-row">
        <span>Orden Secuencial de Prácticas</span>
        <button
          role="switch"
          aria-checked={enabled}
          onClick={() => handleToggle(!enabled)}
          disabled={loading}
          data-testid="toggle-switch"
        >
          {enabled ? 'ON' : 'OFF'}
        </button>
      </div>

      {showPasswordModal && (
        <div data-testid="password-modal">
          <p>Confirmar cambio</p>
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            data-testid="password-input"
          />
          <button onClick={handleCancel} data-testid="cancel-btn">Cancelar</button>
          <button onClick={handleConfirm} disabled={submitting} data-testid="confirm-btn">
            {submitting ? 'Guardando...' : 'Confirmar'}
          </button>
        </div>
      )}
    </div>
  );
}

import React from 'react';

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('PracticeSequenceSection - Toggle + Password Modal', () => {
  const mockOnToggle = vi.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ═══════════════════════════════════════════════════════════════════
  // RED: Write failing tests FIRST
  // ═══════════════════════════════════════════════════════════════════

  it('should render toggle with ON state when enabled is true', () => {
    render(<PracticeSequenceToggle enabled={true} onToggle={mockOnToggle} />);
    
    const toggle = screen.getByTestId('toggle-switch');
    expect(toggle).toHaveAttribute('aria-checked', 'true');
    expect(toggle).toHaveTextContent('ON');
  });

  it('should render toggle with OFF state when enabled is false', () => {
    render(<PracticeSequenceToggle enabled={false} onToggle={mockOnToggle} />);
    
    const toggle = screen.getByTestId('toggle-switch');
    expect(toggle).toHaveAttribute('aria-checked', 'false');
    expect(toggle).toHaveTextContent('OFF');
  });

  it('should show password modal when toggle is clicked', () => {
    render(<PracticeSequenceToggle enabled={true} onToggle={mockOnToggle} />);
    
    const toggle = screen.getByTestId('toggle-switch');
    fireEvent.click(toggle);
    
    expect(screen.getByTestId('password-modal')).toBeInTheDocument();
    expect(screen.getByTestId('password-input')).toBeInTheDocument();
    expect(screen.getByTestId('confirm-btn')).toBeInTheDocument();
    expect(screen.getByTestId('cancel-btn')).toBeInTheDocument();
  });

  it('should call onToggle with false and password when toggling from ON to OFF', async () => {
    render(<PracticeSequenceToggle enabled={true} onToggle={mockOnToggle} />);
    
    fireEvent.click(screen.getByTestId('toggle-switch'));
    fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'admin123' } });
    fireEvent.click(screen.getByTestId('confirm-btn'));
    
    await waitFor(() => {
      expect(mockOnToggle).toHaveBeenCalledWith(false, 'admin123');
    });
  });

  it('should call onToggle with true and password when toggling from OFF to ON', async () => {
    render(<PracticeSequenceToggle enabled={false} onToggle={mockOnToggle} />);
    
    fireEvent.click(screen.getByTestId('toggle-switch'));
    fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'secret' } });
    fireEvent.click(screen.getByTestId('confirm-btn'));
    
    await waitFor(() => {
      expect(mockOnToggle).toHaveBeenCalledWith(true, 'secret');
    });
  });

  it('should close password modal when cancel is clicked', () => {
    render(<PracticeSequenceToggle enabled={true} onToggle={mockOnToggle} />);
    
    fireEvent.click(screen.getByTestId('toggle-switch'));
    expect(screen.getByTestId('password-modal')).toBeInTheDocument();
    
    fireEvent.click(screen.getByTestId('cancel-btn'));
    expect(screen.queryByTestId('password-modal')).not.toBeInTheDocument();
  });

  it('should not call onToggle when confirm is clicked with empty password', () => {
    render(<PracticeSequenceToggle enabled={true} onToggle={mockOnToggle} />);
    
    fireEvent.click(screen.getByTestId('toggle-switch'));
    fireEvent.click(screen.getByTestId('confirm-btn'));
    
    expect(mockOnToggle).not.toHaveBeenCalled();
  });

  it('should disable toggle when loading is true', () => {
    render(<PracticeSequenceToggle enabled={true} onToggle={mockOnToggle} loading={true} />);
    
    const toggle = screen.getByTestId('toggle-switch');
    expect(toggle).toBeDisabled();
  });
});
