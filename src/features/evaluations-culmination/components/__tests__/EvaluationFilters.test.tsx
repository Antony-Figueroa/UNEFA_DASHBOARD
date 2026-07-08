/**
 * @file EvaluationFilters.test.tsx
 * @description Tests para el componente EvaluationFilters — extraFilters rendering.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { EvaluationFilters } from '../EvaluationFilters';

// --- Mocks ---

vi.mock('../../../../components/form/input/InputField', () => ({
  default: (props: any) => <input data-testid="input-field" {...props} />,
}));

vi.mock('../../../../components/form/CustomSelect', () => ({
  default: (props: any) => (
    <select data-testid="custom-select" value={props.value} onChange={(e: any) => props.onChange(e.target.value)}>
      {props.options?.map((o: any) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  ),
}));

vi.mock('../../../../components/form/MultiSelect', () => ({
  default: (props: any) => <div data-testid="multi-select">{props.label}</div>,
}));

vi.mock('../../../../components/ui/button/Button', () => ({
  default: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
}));

const defaultProps = {
  searchTerm: '',
  onSearchChange: vi.fn(),
  filters: { periodId: '', careerId: '', practiceTypeId: '', result: '', culminationStatus: '' },
  onFilterChange: vi.fn(),
  onClear: vi.fn(),
  periodOptions: [],
  careerOptions: [],
  practiceTypeOptions: [],
  hasActiveFilters: false,
};

describe('EvaluationFilters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders extraFilters when provided', () => {
    render(
      <EvaluationFilters
        {...defaultProps}
        extraFilters={<div data-testid="extra-filter">Resultado filter</div>}
      />
    );

    expect(screen.getByTestId('extra-filter')).toBeInTheDocument();
    expect(screen.getByText('Resultado filter')).toBeInTheDocument();
  });

  it('does not render extraFilters when not provided', () => {
    render(<EvaluationFilters {...defaultProps} />);

    expect(screen.queryByTestId('extra-filter')).not.toBeInTheDocument();
  });

  it('renders multiple extraFilters', () => {
    render(
      <EvaluationFilters
        {...defaultProps}
        extraFilters={
          <>
            <div data-testid="filter-a">Filtro A</div>
            <div data-testid="filter-b">Filtro B</div>
          </>
        }
      />
    );

    expect(screen.getByTestId('filter-a')).toBeInTheDocument();
    expect(screen.getByTestId('filter-b')).toBeInTheDocument();
  });

  it('renders the Resultado CustomSelect when passed as extraFilters', () => {
    const RESULT_OPTIONS = [
      { value: 'approved', label: 'Aprobado' },
      { value: 'failed', label: 'Reprobado' },
    ];

    render(
      <EvaluationFilters
        {...defaultProps}
        extraFilters={
          <select data-testid="resultado-filter" aria-label="Resultado">
            {RESULT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        }
      />
    );

    const filter = screen.getByTestId('resultado-filter');
    expect(filter).toBeInTheDocument();
    expect(filter).toHaveValue('approved');
  });

  it('still renders core filters with extraFilters', () => {
    render(
      <EvaluationFilters
        {...defaultProps}
        extraFilters={<div data-testid="extra">Extra</div>}
      />
    );

    expect(screen.getByTestId('input-field')).toBeInTheDocument();
    expect(screen.getAllByTestId('custom-select').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByTestId('extra')).toBeInTheDocument();
  });
});
