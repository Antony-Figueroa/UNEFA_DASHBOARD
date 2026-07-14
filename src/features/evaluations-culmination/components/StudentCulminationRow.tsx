/**
 * @file StudentCulminationRow.tsx
 * @description Grouped row component for the culmination view.
 * Displays a student row with all of their practices (phases) and expandable
 * detail showing each practice's information.
 * Uses Framer Motion for expand/collapse animations.
 */

import React, { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PhaseStatusBadge } from './PhaseStatusBadge';
import { ActionDropdown } from './ActionDropdown';
import type { ActionItem } from './ActionDropdown';
import { EyeIcon, ListIcon, DownloadIcon } from '../../../icons';
import type { StudentCulminationRowData, PhaseStatus, EvaluationStatus } from '../types';
import type { PracticeWithEvaluations } from '../types';

interface StudentCulminationRowProps {
  row: StudentCulminationRowData;
  isExpanded: boolean;
  onToggle: () => void;
  onCertify: (practiceId: number) => Promise<boolean>;
  onReverse: (practiceId: number, reason: string, resolutionNumber: string) => Promise<boolean>;
  onUnfreeze?: (practiceId: number) => void;
  onViewEvaluationDetails?: (practiceId: number) => void;
  onViewAudit?: (practiceId: number) => void;
  onDownloadPdf?: (practice: PracticeWithEvaluations) => void;
  certifying: boolean;
  /** When true, shows grace period badge and enables unfreeze for REPROBADO */
  isWithinGracePeriod?: boolean;
  /** When true, hides all action buttons and the expand chevron (certification view) */
  readOnly?: boolean;
}

const FINAL_STATUS_COLORS: Record<string, string> = {
  approved: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  failed: 'bg-red-100 text-red-700',
  partial: 'bg-yellow-100 text-yellow-700',
};

const FINAL_STATUS_LABELS: Record<string, string> = {
  approved: 'Aprobado',
  pending: 'Pendiente',
  failed: 'Reprobado',
  partial: 'Aprobado Parcial',
};

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'certified':
      return 'bg-green-50 text-green-700 border-green-200';
    case 'approved':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    default:
      return 'bg-gray-50 text-gray-500 border-gray-200';
  }
};

const getMaxCount = (n: number): number => n;

export const StudentCulminationRow: React.FC<StudentCulminationRowProps> = ({
  row,
  isExpanded,
  onToggle,
  onCertify,
  onUnfreeze,
  onViewEvaluationDetails,
  onViewAudit,
  onDownloadPdf,
  certifying,
  isWithinGracePeriod = false,
  readOnly = false,
}) => {
  const numPhases = row.phases.length;
  const isFirstApproved =
    row.phases.length > 0 &&
    (row.phases[0].status === 'approved' || row.phases[0].status === 'certified');

  const buildPhaseActions = useCallback(
    (phase: PhaseStatus, _index: number): ActionItem[] => {
      const actions: ActionItem[] = [];

      // Ver Evaluación — cuando existe calificación
      if (phase.grade != null && onViewEvaluationDetails) {
        actions.push({
          label: 'Ver Evaluación',
          icon: <EyeIcon className="w-4 h-4" />,
          onClick: () => onViewEvaluationDetails(phase.practiceId),
        });
      }

      // Auditoría — cuando aprobado o certificado
      if ((phase.status === 'approved' || phase.status === 'certified') && onViewAudit) {
        actions.push({
          label: 'Auditoría',
          icon: <ListIcon className="w-4 h-4" />,
          onClick: () => onViewAudit(phase.practiceId),
        });
      }

      // Descargar PDF — cuando está certificado
      if (phase.status === 'certified' && onDownloadPdf) {
        actions.push({
          label: 'Descargar PDF',
          icon: <DownloadIcon className="w-4 h-4" />,
          onClick: () => {
            // Build a minimal PracticeWithEvaluations from PhaseStatus + row data
            const practice: PracticeWithEvaluations = {
              practiceId: phase.practiceId,
              studentCi: row.studentCi,
              studentName: row.studentName,
              careerId: 0,
              careerName: row.careerName,
              minimumGrade: 10,
              institutionId: 0,
              institutionName: phase.institutionName,
              periodId: row.periodId,
              periodName: row.periodName,
              practiceTypeId: phase.practiceTypeId,
              practiceTypeName: phase.practiceTypeName,
              startDate: '',
              endDate: '',
              totalHours: phase.hoursCompleted,
               evaluationStatus: (phase.evaluationStatus || 'completed') as EvaluationStatus,
              evaluations: {
                INSTITUCIONAL: { completed: true, score: 0, evaluatorName: '' },
                ACADEMICO: { completed: true, score: 0, evaluatorName: '' },
                COMITE: { completed: true, score: 0, evaluatorName: '' },
              },
              finalGrade: phase.grade,
              culminationStatus: 'certified',
              result: 'approved',
              isFrozen: phase.isFrozen,
            };
            onDownloadPdf(practice);
          },
        });
      }

      // Descongelar — reprobado dentro del período de gracia
      if (!readOnly && phase.status === 'failed' && isWithinGracePeriod && onUnfreeze) {
        actions.push({
          label: 'Descongelar',
          className: 'text-amber-600 dark:text-amber-400',
          onClick: () => onUnfreeze(phase.practiceId),
        });
      }

      // Descongelar — congelado (cualquier estado salvo failed)
      if (!readOnly && phase.isFrozen && onUnfreeze && phase.status !== 'failed') {
        actions.push({
          label: 'Descongelar',
          className: 'text-amber-600 dark:text-amber-400',
          onClick: () => onUnfreeze(phase.practiceId),
        });
      }

      return actions;
    },
    [onViewEvaluationDetails, onViewAudit, onDownloadPdf, onUnfreeze, isWithinGracePeriod, readOnly, row]
  );

  const handleCertify = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (row.phases.length > 0) {
        onCertify(row.phases[0].practiceId);
      }
    },
    [onCertify, row.phases]
  );

  return (
    <div className="border border-border-default dark:border-border-dark rounded-lg overflow-hidden bg-white dark:bg-gray-800">
      {/* Collapsed view: row header */}
      <button
        data-testid="row-header"
        onClick={onToggle}
        className="w-full text-left px-4 py-3 flex items-center justify-between gap-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        aria-label="Toggle row detail"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Expand/Collapse icon */}
          {!readOnly && (
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7l-7 7" />
            </svg>
          )}

          {/* Student name and CI */}
          <div className="min-w-0">
            <span className="font-medium text-text-primary dark:text-text-emphasis">
              {row.studentName}
            </span>
            <span className="ml-2 text-xs text-text-tertiary">
              CI: {row.studentCi}
            </span>
          </div>

          {/* Career */}
          <span className="hidden md:inline text-sm text-text-secondary ml-4">
            {row.careerName}
          </span>

          {/* Period */}
          <span className="hidden md:inline text-sm text-text-secondary ml-2">
            {row.periodName}
          </span>

          {/* Phase status badges */}
          <div className="hidden md:flex items-center gap-2 ml-4">
            {row.phases.map((phase) => (
              <PhaseStatusBadge
                key={phase.practiceId}
                status={phase.status}
                label={phase.practiceTypeName}
                size="sm"
              />
            ))}
          </div>

          {/* Grace period badge */}
          {isWithinGracePeriod && (
            <span className="inline-flex items-center rounded-full text-xs px-2 py-0.5 font-medium bg-amber-50 text-amber-600 border border-amber-200 ml-2">
              Período de gracia
            </span>
          )}
        </div>

        {/* Right side: final status and action */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Final status */}
          <FinalStatusBadge
            finalStatus={row.finalStatus}
            finalStatusLabel={row.finalStatusLabel}
          />
        </div>
      </button>

      {/* Expanded view */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key={`${row.studentCi}-detail`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
            onWheel={(e) => e.stopPropagation()}
          >
            <div className="px-6 pb-4 bg-gray-50 dark:bg-gray-850">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-text-tertiary text-xs uppercase border-b border-gray-200 dark:border-gray-700">
                    <th className="py-2 pr-4">Práctica</th>
                    <th className="py-2 pr-4">Institución</th>
                    <th className="py-2 pr-4 text-center">Estado</th>
                    <th className="py-2 pr-4 text-center">Calificación</th>
                    <th className="py-2 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {row.phases.map((phase, index) => {
                    const isFirstPhase = index === 0;
                    const isLocked = !isFirstPhase && !isFirstApproved;

                    return (
                      <tr key={phase.practiceId} className="border-b border-gray-100 dark:border-gray-700/50 last:border-b-0">
                        <td className="py-3 pr-4 font-medium text-text-primary">
                          {phase.practiceTypeName}
                        </td>
                        <td className="py-3 pr-4 text-text-secondary">
                          {isLocked ? (
                            <span className="text-text-tertiary italic" title="Debe aprobar la práctica anterior primero">
                              (bloqueada)
                            </span>
                          ) : (
                            phase.institutionName
                          )}
                        </td>
                        <td className="py-3 pr-4 text-center">
                          <PhaseStatusBadge
                            status={phase.status}
                            label={phase.statusLabel}
                            size="sm"
                          />
                        </td>
                        <td className="py-3 pr-4 text-center">
                          {phase.grade != null ? (
                            <span className="font-semibold tabular-nums">{Number(phase.grade).toFixed(2)}</span>
                          ) : (
                            <span className="text-text-tertiary">—</span>
                          )}
                        </td>
                        <td className="py-3 text-center">
                          {isLocked ? (
                            <span
                              className="text-xs text-text-tertiary italic"
                              title={`Debe aprobar ${row.phases[index - 1]?.practiceTypeName || 'la práctica anterior'} antes`}
                            >
                              Bloqueada
                            </span>
                          ) : (
                            <ActionDropdown
                              actions={buildPhaseActions(phase, index)}
                            />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-tertiary">
                    {row.completedPractices}/{row.totalPractices} prácticas completadas
                  </span>
                  <FinalStatusBadge
                    finalStatus={row.finalStatus}
                    finalStatusLabel={row.finalStatusLabel}
                  />
                </div>
                {!readOnly && row.canCertify && (
                  <button
                    onClick={handleCertify}
                    disabled={certifying}
                    className="px-4 py-1.5 text-sm font-medium rounded-lg bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 transition-colors"
                  >
                    {certifying ? 'Certificando...' : 'Certificar'}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

function FinalStatusBadge({
  finalStatus,
  finalStatusLabel,
}: {
  finalStatus: string;
  finalStatusLabel: string;
}) {
  const colorClasses = FINAL_STATUS_COLORS[finalStatus] || FINAL_STATUS_COLORS.pending;
  return (
    <span
      data-testid="badge"
      data-color={finalStatus}
      className={`inline-flex items-center rounded-full font-medium text-xs px-2.5 py-1 ${colorClasses}`}
    >
      {finalStatusLabel}
    </span>
  );
}

export default StudentCulminationRow;
