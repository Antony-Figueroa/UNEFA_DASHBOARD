/**
 * @file PhaseStatusBadge.tsx
 * @description Color-coded status badge for practice phases within the
 * culmination redesign. Renders a pill-shaped label with status-dependent
 * background and text colors.
 */

import React from 'react';
import type { PhaseStatus } from '../types';

interface PhaseStatusBadgeProps {
  status: PhaseStatus['status'];
  label: string;
  grade?: number | null;
  size?: 'sm' | 'md';
}

const STATUS_STYLES: Record<PhaseStatus['status'], string> = {
  pending: 'bg-gray-100 text-gray-700',
  approved: 'bg-green-100 text-green-700',
  certified: 'bg-blue-100 text-blue-700',
  failed: 'bg-red-100 text-red-700',
  withdrawn_justified: 'bg-yellow-100 text-yellow-700',
};

const SIZE_CLASSES: Record<'sm' | 'md', string> = {
  sm: 'px-2 py-0.5 text-[0.65rem]',
  md: 'px-2.5 py-0.5 text-xs',
};

/** Determine if grade should be displayed alongside the label */
const showGrade = (status: PhaseStatus['status'], grade: number | null | undefined): grade is number =>
  (status === 'approved' || status === 'certified') && grade != null;

export const PhaseStatusBadge: React.FC<PhaseStatusBadgeProps> = ({
  status,
  label,
  grade,
  size = 'md',
}) => {
  const displayText = showGrade(status, grade)
    ? `${label} (${grade})`
    : label;

  return (
    <span
      role="status"
      aria-label={`Estado: ${label}`}
      className={`inline-flex items-center rounded-full font-medium ${STATUS_STYLES[status]} ${SIZE_CLASSES[size]}`}
    >
      {displayText}
    </span>
  );
};
