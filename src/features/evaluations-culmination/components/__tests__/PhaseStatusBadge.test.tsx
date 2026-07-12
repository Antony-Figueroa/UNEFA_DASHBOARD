/**
 * @file PhaseStatusBadge.test.tsx
 * @description Tests for PhaseStatusBadge component — color-coded status badge
 * for practice phases within the culmination redesign.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { PhaseStatusBadge } from '../PhaseStatusBadge';

describe('PhaseStatusBadge', () => {
  beforeEach(() => {
    // No mocks needed — PhaseStatusBadge is a pure presentational component
  });

  it('renders the correct label for pending status', () => {
    render(<PhaseStatusBadge status="pending" label="Pendiente" />);
    expect(screen.getByText('Pendiente')).toBeInTheDocument();
  });

  it('renders the correct label for approved status', () => {
    render(<PhaseStatusBadge status="approved" label="Aprobada" />);
    expect(screen.getByText('Aprobada')).toBeInTheDocument();
  });

  it('renders the correct label for certified status', () => {
    render(<PhaseStatusBadge status="certified" label="Certificada" />);
    expect(screen.getByText('Certificada')).toBeInTheDocument();
  });

  it('renders the correct label for failed status', () => {
    render(<PhaseStatusBadge status="failed" label="Reprobada" />);
    expect(screen.getByText('Reprobada')).toBeInTheDocument();
  });

  it('renders the correct label for withdrawn_justified status', () => {
    render(<PhaseStatusBadge status="withdrawn_justified" label="Retiro Justificado" />);
    expect(screen.getByText('Retiro Justificado')).toBeInTheDocument();
  });

  it('has correct aria-label for accessibility', () => {
    render(<PhaseStatusBadge status="approved" label="Aprobada" />);
    const badge = screen.getByRole('status');
    expect(badge).toHaveAttribute('aria-label', 'Estado: Aprobada');
  });

  it('shows grade when provided and status is approved', () => {
    render(<PhaseStatusBadge status="approved" label="Aprobada" grade={18} />);
    expect(screen.getByText('Aprobada (18)')).toBeInTheDocument();
  });

  it('shows grade when provided and status is certified', () => {
    render(<PhaseStatusBadge status="certified" label="Certificada" grade={16} />);
    expect(screen.getByText('Certificada (16)')).toBeInTheDocument();
  });

  it('does NOT show grade when status is pending', () => {
    render(<PhaseStatusBadge status="pending" label="Pendiente" grade={15} />);
    expect(screen.getByText('Pendiente')).toBeInTheDocument();
    expect(screen.queryByText('Pendiente (15)')).not.toBeInTheDocument();
  });

  it('does NOT show grade when status is failed', () => {
    render(<PhaseStatusBadge status="failed" label="Reprobada" grade={8} />);
    expect(screen.getByText('Reprobada')).toBeInTheDocument();
    expect(screen.queryByText('Reprobada (8)')).not.toBeInTheDocument();
  });

  it('does NOT show grade when status is withdrawn_justified', () => {
    render(<PhaseStatusBadge status="withdrawn_justified" label="Retiro Justificado" grade={12} />);
    expect(screen.getByText('Retiro Justificado')).toBeInTheDocument();
    expect(screen.queryByText('Retiro Justificado (12)')).not.toBeInTheDocument();
  });

  it('renders small size variant when size=sm', () => {
    const { container } = render(
      <PhaseStatusBadge status="approved" label="Aprobada" size="sm" />
    );
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain('px-2');
    expect(badge.className).toContain('text-[0.65rem]');
  });

  it('renders default (md) size when size is not specified', () => {
    const { container } = render(
      <PhaseStatusBadge status="approved" label="Aprobada" />
    );
    const badge = container.firstChild as HTMLElement;
    expect(badge.className).toContain('px-2.5');
    expect(badge.className).toContain('text-xs');
  });

  it('does NOT show grade when grade is null and status is approved', () => {
    render(<PhaseStatusBadge status="approved" label="Aprobada" grade={null} />);
    expect(screen.getByText('Aprobada')).toBeInTheDocument();
    expect(screen.queryByText(/\(\d+\)/)).not.toBeInTheDocument();
  });
});
