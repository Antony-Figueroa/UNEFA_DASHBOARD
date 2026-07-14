/**
 * @file CertificationView.tsx
 * @description Certification tab component for the culmination redesign.
 * Shows a "ready for certification" section with batch selection,
 * and a read-only table of certified students with grades and PDF download.
 */

import React, { useState, useMemo, useCallback } from 'react';
import { EmptyState } from '../../../components/ui/table/EmptyState';
import type { StudentCulminationRowData } from '../types';

interface CertificationViewProps {
  groups: StudentCulminationRowData[];
  loading: boolean;
  /** Called with selected student CIs when user clicks "Certificar seleccionados" */
  onCertify?: (studentCis: string[]) => void;
  /** True while a batch certification is in progress */
  certifying?: boolean;
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

/** Progress bar for completedPractices / totalPractices */
const PracticeProgress: React.FC<{ completed: number; total: number }> = ({
  completed,
  total,
}) => {
  if (total === 0) return <span className="text-xs text-text-tertiary">—</span>;
  const pct = Math.round((completed / total) * 100);
  const isComplete = completed >= total;

  return (
    <div className="flex items-center gap-2 min-w-[100px]">
      <div className="flex-1 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            isComplete
              ? 'bg-green-500 dark:bg-green-400'
              : 'bg-amber-500 dark:bg-amber-400'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs tabular-nums text-text-secondary whitespace-nowrap">
        {completed}/{total}
      </span>
    </div>
  );
};

export const CertificationView: React.FC<CertificationViewProps> = ({
  groups,
  loading,
  onCertify,
  certifying = false,
}) => {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Students ready for certification: canCertify && not yet certified
  const readyGroups = useMemo(
    () => groups.filter((g) => g.canCertify && g.certificateNumber == null),
    [groups],
  );

  const allReadyCis = useMemo(() => readyGroups.map((g) => g.studentCi), [readyGroups]);

  const allSelected =
    readyGroups.length > 0 && allReadyCis.every((ci) => selected.has(ci));

  const toggleSelect = useCallback((ci: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(ci)) {
        next.delete(ci);
      } else {
        next.add(ci);
      }
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(allReadyCis));
    }
  }, [allSelected, allReadyCis]);

  const handleCertifySelected = useCallback(() => {
    if (!onCertify) return;
    const cis = allReadyCis.filter((ci) => selected.has(ci));
    if (cis.length > 0) onCertify(cis);
  }, [onCertify, allReadyCis, selected]);

  const handleCertifyAll = useCallback(() => {
    if (!onCertify || allReadyCis.length === 0) return;
    onCertify(allReadyCis);
  }, [onCertify, allReadyCis]);

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

  // Empty state: no certified/failed AND no ready-for-certification
  if (displayGroups.length === 0 && readyGroups.length === 0) {
    return (
      <EmptyState
        title="No hay registros de certificación ni cierres de acta aún"
        description="Los registros certificados y cierres de acta aparecerán aquí."
      />
    );
  }

  // Sort: certified first, then reprobados; within each group by date descending
  const sorted = [...displayGroups].sort((a, b) => {
    const aHasCert = a.certificateNumber != null ? 0 : 1;
    const bHasCert = b.certificateNumber != null ? 0 : 1;
    if (aHasCert !== bHasCert) return aHasCert - bHasCert;
    const dateA = a.certifiedAt ? new Date(a.certifiedAt).getTime() : 0;
    const dateB = b.certifiedAt ? new Date(b.certifiedAt).getTime() : 0;
    return dateB - dateA;
  });

  // Determine column structure based on max phases
  const maxPhases = sorted.length > 0 ? Math.max(...sorted.map((g) => g.phases.length)) : 0;

  return (
    <div className="space-y-6">
      {/* ─── Ready for certification section ─── */}
      {readyGroups.length > 0 && (
        <div className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 overflow-hidden">
          <div className="px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-green-200 dark:border-green-800">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 dark:bg-green-800/40">
                <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              <div>
                <h3 className="text-sm font-semibold text-green-800 dark:text-green-300">
                  {readyGroups.length} {readyGroups.length === 1 ? 'estudiante listo' : 'estudiantes listos'} para certificar
                </h3>
                <p className="text-xs text-green-600 dark:text-green-400">
                  Todas las fases aprobadas y congeladas
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 text-xs text-green-700 dark:text-green-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  disabled={certifying}
                  className="rounded border-green-400 text-green-600 focus:ring-green-500"
                  data-testid="select-all-ready"
                />
                Seleccionar todos
              </label>
              <button
                onClick={handleCertifyAll}
                disabled={certifying}
                className="px-3 py-1.5 text-xs font-medium rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                data-testid="certify-all-btn"
              >
                {certifying ? 'Certificando...' : 'Certificar todos'}
              </button>
              {selected.size > 0 && (
                <button
                  onClick={handleCertifySelected}
                  disabled={certifying}
                  className="px-3 py-1.5 text-xs font-medium rounded-md bg-green-700 text-white hover:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  data-testid="certify-selected-btn"
                >
                  Certificar seleccionados ({selected.size})
                </button>
              )}
            </div>
          </div>
          {/* Student list with checkboxes */}
          <div className="divide-y divide-green-200 dark:divide-green-800">
            {readyGroups.map((student) => (
              <label
                key={student.studentCi}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-green-100/50 dark:hover:bg-green-800/20 cursor-pointer transition-colors"
                data-testid="ready-student-row"
              >
                <input
                  type="checkbox"
                  checked={selected.has(student.studentCi)}
                  onChange={() => toggleSelect(student.studentCi)}
                  disabled={certifying}
                  className="rounded border-green-400 text-green-600 focus:ring-green-500"
                  data-testid={`ready-checkbox-${student.studentCi}`}
                />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-green-900 dark:text-green-200 truncate">
                    {student.studentName}
                  </span>
                  <span className="text-xs text-green-600 dark:text-green-400 ml-2 tabular-nums">
                    {student.studentCi}
                  </span>
                </div>
                <PracticeProgress
                  completed={student.completedPractices}
                  total={student.totalPractices}
                />
              </label>
            ))}
          </div>
        </div>
      )}

      {/* ─── Existing certified/failed table ─── */}
      {sorted.length > 0 && (
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
                      {phase.practiceTypeName}
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
                  <th className="text-center px-4 py-3 font-medium text-text-tertiary text-xs uppercase tracking-wider">
                    Progreso
                  </th>
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
                      <PracticeProgress
                        completed={student.completedPractices}
                        total={student.totalPractices}
                      />
                    </td>
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
      )}
    </div>
  );
};

export default CertificationView;
