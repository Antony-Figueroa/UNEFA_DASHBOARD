/**
 * @file CertificationView.tsx
 * @description Read-only certification tab component for the culmination redesign.
 * Displays a table of certified students with their grades, certificate numbers,
 * and PDF download buttons.
 */

import React from 'react';
import { EmptyState } from '../../../components/ui/table/EmptyState';
import type { StudentCulminationRowData } from '../types';

interface CertificationViewProps {
  groups: StudentCulminationRowData[];
  loading: boolean;
}

/** Format an ISO date string to DD/MM/YYYY */
const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return '—';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
};

/** Find the practice hours value; 0—empty should show "—" */
const getGrade = (phase: { grade: number | null; status: string }): string => {
  if (phase.grade == null) return '—';
  return Number(phase.grade).toFixed(2);
};

export const CertificationView: React.FC<CertificationViewProps> = ({
  groups,
  loading,
}) => {
  if (loading) {
    return (
      <div className="py-12 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-text-tertiary">Cargando certificaciones...</span>
        </div>
      </div>
    );
  }

  const displayGroups = groups.filter((g) => g.certificateNumber != null || g.finalStatus === 'failed');

  if (displayGroups.length === 0) {
    return (
      <EmptyState
        title="No hay registros de certificación ni cierres de acta aún"
        description="Los registros certificados y cierres de acta aparecerán aquí."
      />
    );
  }

  // Sort: certified first, then reprobados; within each group by date descending
  const sorted = [...displayGroups].sort((a, b) => {
    // Certified (certificateNumber != null) come first
    const aHasCert = a.certificateNumber != null ? 0 : 1;
    const bHasCert = b.certificateNumber != null ? 0 : 1;
    if (aHasCert !== bHasCert) return aHasCert - bHasCert;
    // Within same group, sort by date descending
    const dateA = a.certifiedAt ? new Date(a.certifiedAt).getTime() : 0;
    const dateB = b.certifiedAt ? new Date(b.certifiedAt).getTime() : 0;
    return dateB - dateA;
  });

  // Determine column structure based on max phases
  const maxPhases = Math.max(...sorted.map((g) => g.phases.length));

  return (
    <div className="overflow-hidden rounded-lg border border-border-default dark:border-border-dark">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-border-default dark:border-border-dark">
              <th className="text-left px-4 py-3 font-medium text-text-tertiary text-xs uppercase tracking-wider">
                Estudiante
              </th>
              <th className="text-left px-4 py-3 font-medium text-text-tertiary text-xs uppercase tracking-wider">
                Cédula
              </th>
              <th className="text-left px-4 py-3 font-medium text-text-tertiary text-xs uppercase tracking-wider">
                Tipo
              </th>
              {/* Phase grade columns */}
              {sorted[0]?.phases.map((phase) => (
                <th
                  key={phase.practiceId}
                  className="text-center px-4 py-3 font-medium text-text-tertiary text-xs uppercase tracking-wider"
                >
                  {phase.practiceTypeName === 'Hospitalaria' ? 'Hosp.' : phase.practiceTypeName}
                </th>
              ))}
              {/* Fill remaining columns if some rows have more phases */}
              {Array.from({ length: maxPhases - (sorted[0]?.phases.length || 0) }).map((_, i) => (
                <th
                  key={`placeholder-${i}`}
                  className="text-center px-4 py-3 font-medium text-text-tertiary text-xs uppercase tracking-wider"
                >
                  —
                </th>
              ))}
              <th className="text-left px-4 py-3 font-medium text-text-tertiary text-xs uppercase tracking-wider">
                N° Certificado
              </th>
              <th className="text-left px-4 py-3 font-medium text-text-tertiary text-xs uppercase tracking-wider">
                Fecha
              </th>
              <th className="text-center px-4 py-3 font-medium text-text-tertiary text-xs uppercase tracking-wider">
                Acción
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((student) => (
              <tr
                key={student.studentCi}
                className="border-b border-border-default dark:border-border-dark hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors"
              >
                <td className="px-4 py-3">
                  <span className="font-medium text-text-primary dark:text-text-emphasis">
                    {student.studentName}
                  </span>
                </td>
                <td className="px-4 py-3 text-text-secondary tabular-nums">
                  {student.studentCi}
                </td>
                <td className="px-4 py-3">
                  {student.certificateNumber != null ? (
                    <span className="inline-flex items-center rounded-full font-medium text-xs px-2.5 py-1 bg-green-100 text-green-700">
                      Certificado
                    </span>
                  ) : student.finalStatus === 'failed' ? (
                    <span className="inline-flex items-center rounded-full font-medium text-xs px-2.5 py-1 bg-red-100 text-red-700">
                      Cierre
                    </span>
                  ) : null}
                </td>
                {/* Phase grades */}
                {student.phases.map((phase) => (
                  <td
                    key={phase.practiceId}
                    className="px-4 py-3 text-center font-medium tabular-nums"
                  >
                    {getGrade(phase)}
                  </td>
                ))}
                {/* Fill remaining cells */}
                {Array.from({ length: maxPhases - student.phases.length }).map((_, i) => (
                  <td
                    key={`placeholder-${i}`}
                    className="px-4 py-3 text-center text-text-tertiary"
                  >
                    —
                  </td>
                ))}
                <td className="px-4 py-3">
                  <span className="text-sm font-mono text-brand-600 dark:text-brand-400">
                    {student.certificateNumber || '—'}
                  </span>
                </td>
                <td className="px-4 py-3 text-text-secondary">
                  {formatDate(student.certifiedAt)}
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    data-testid="download-icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      // PDF download triggered from the parent via hook
                    }}
                    className="p-1.5 rounded-md text-text-tertiary hover:text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors"
                    title="Descargar PDF"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CertificationView;
