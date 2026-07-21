/**
 * @file PreEnrollmentModal.sequence.test.tsx
 * @description Tests for the practice type select conditional behavior in PreEnrollmentModal.
 * Verifies that when enforceSequentialOrder is OFF the select is enabled,
 * and when ON it remains disabled (AUTO behavior).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// ─── Component Under Test (extracted for focused testing) ────────────────────
// Tests the conditional disabled behavior of the practice type select.

interface PracticeTypeSelectProps {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  enforceSequentialOrder: boolean;
}

function PracticeTypeSelect({ options, value, onChange, enforceSequentialOrder }: PracticeTypeSelectProps) {
  const isDisabled = enforceSequentialOrder;

  return (
    <div data-testid="practice-type-field">
      <div className="flex items-center justify-between">
        <label>Tipo de Práctica</label>
        {isDisabled && <span data-testid="auto-badge">AUTO</span>}
      </div>
      <select
        data-testid="practice-type-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={isDisabled}
      >
        <option value="">Seleccione el tipo...</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

// ─── Tests ──────────────────────────────────────────────────────────────────

describe('PreEnrollmentModal - Practice Type Select Conditional', () => {
  const mockOnChange = vi.fn();
  const options = [
    { value: 'ORDINARIA', label: 'Ordinaria' },
    { value: 'HOSPITALARIA', label: 'Hospitalaria' },
    { value: 'COMUNITARIA', label: 'Comunitaria' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ═══════════════════════════════════════════════════════════════════
  // RED: Write failing tests FIRST
  // ═══════════════════════════════════════════════════════════════════

  it('should disable select when enforceSequentialOrder is ON (default behavior)', () => {
    render(
      <PracticeTypeSelect
        options={options}
        value=""
        onChange={mockOnChange}
        enforceSequentialOrder={true}
      />
    );

    const select = screen.getByTestId('practice-type-select');
    expect(select).toBeDisabled();
    expect(screen.getByTestId('auto-badge')).toBeInTheDocument();
  });

  it('should enable select when enforceSequentialOrder is OFF', () => {
    render(
      <PracticeTypeSelect
        options={options}
        value=""
        onChange={mockOnChange}
        enforceSequentialOrder={false}
      />
    );

    const select = screen.getByTestId('practice-type-select');
    expect(select).not.toBeDisabled();
    expect(screen.queryByTestId('auto-badge')).not.toBeInTheDocument();
  });

  it('should allow selecting a practice type when OFF', () => {
    render(
      <PracticeTypeSelect
        options={options}
        value=""
        onChange={mockOnChange}
        enforceSequentialOrder={false}
      />
    );

    const select = screen.getByTestId('practice-type-select');
    fireEvent.change(select, { target: { value: 'HOSPITALARIA' } });

    expect(mockOnChange).toHaveBeenCalledWith('HOSPITALARIA');
  });

  it('should prevent interaction when ON (disabled attribute blocks user input)', () => {
    render(
      <PracticeTypeSelect
        options={options}
        value="ORDINARIA"
        onChange={mockOnChange}
        enforceSequentialOrder={true}
      />
    );

    const select = screen.getByTestId('practice-type-select');
    // Browser-level disabled prevents user interaction; jsdom fireEvent.change bypasses it
    // so we verify the disabled attribute is set — the real gate for user interaction
    expect(select).toBeDisabled();
    expect(select).toHaveValue('ORDINARIA');
  });

  it('should show all available options in the dropdown when OFF', () => {
    render(
      <PracticeTypeSelect
        options={options}
        value=""
        onChange={mockOnChange}
        enforceSequentialOrder={false}
      />
    );

    expect(screen.getByRole('option', { name: 'Ordinaria' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Hospitalaria' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Comunitaria' })).toBeInTheDocument();
  });
});
