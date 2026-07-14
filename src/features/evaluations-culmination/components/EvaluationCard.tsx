/**
 * @file EvaluationCard.tsx
 * @description Tarjeta expandible para mostrar un grupo de prácticas por estudiante+carrera.
 * Reemplaza la visualización 1:1 con agrupación inteligente.
 * Cada grupo colapsado muestra resumen del estudiante; expandido lista las prácticas individuales.
 * Usa Framer Motion para expand/collapse animations.
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Badge from '../../../components/ui/badge/Badge';
import { EvaluationCell } from './EvaluationCell';
import { ActionDropdown } from './ActionDropdown';
import { CheckCircleIcon } from '../../../icons';
import type { PracticeWithEvaluations, EvaluationGroup } from '../types';
import type { EvaluatorType } from '../../evaluations/types';
import {
  getResultLabel,
} from '../types';

interface EvaluationCardProps {
  group: EvaluationGroup;
  displayScale: number;
  onEvaluate: (practice: PracticeWithEvaluations, type: EvaluatorType, existingEvalId?: number) => void;
  onViewDetails: (evaluationId: number) => void;
  onApprove: (practice: PracticeWithEvaluations) => void;
  onOpenCommittee: (practiceId: number, studentName: string) => void;
  onGrantExtension: (practiceId: number, studentName: string) => void;
  onRevokeExtension: (practiceId: number) => void;
  onViewAudit: (practiceId: number) => void;
  onUnfreeze: (practiceId: number) => void;
  isReadOnly: boolean;
}

/** Tailwind text color class based on grade value (1-10 scale) */
const getGradeColor = (grade: number | null | undefined, displayScale: number): string => {
  if (grade == null) return 'text-text-tertiary';
  const percent = (grade / displayScale) * 10;
  if (percent >= 9) return 'text-success-600 dark:text-success-400';
  if (percent >= 7) return 'text-text-primary dark:text-text-emphasis';
  if (percent >= 6) return 'text-warning-600 dark:text-warning-400';
  return 'text-error-600 dark:text-error-400';
};

/** Estado de evaluación agregado para el grupo */
function getGroupEvaluationStatus(practices: PracticeWithEvaluations[]): 'completed' | 'partial' | 'pending' {
  if (practices.every(p => p.evaluationStatus === 'completed')) return 'completed';
  if (practices.some(p => p.evaluationStatus === 'completed' || p.evaluationStatus === 'partial')) return 'partial';
  return 'pending';
}

/** Resumen textual del estado de evaluación del grupo */
function getStatusSummary(practices: PracticeWithEvaluations[]): string {
  const completed = practices.filter(p => p.evaluationStatus === 'completed').length;
  const total = practices.length;
  if (completed === total) {
    return `${completed}/${total} completa${total > 1 ? 's' : ''}`;
  }
  return `${completed}/${total} completas`;
}

const getStatusBadge = (status: 'completed' | 'partial' | 'pending') => {
  switch (status) {
    case 'completed':
      return (
        <Badge color="success" variant="light">
          <CheckCircleIcon className="w-4 h-4 mr-1" />
          Completo
        </Badge>
      );
    case 'partial':
      return (
        <Badge color="warning" variant="light">
          Parcial
        </Badge>
      );
    default:
      return (
        <Badge color="light" variant="light">
          Pendiente
        </Badge>
      );
  }
};

/** Nota promedio del grupo (solo prácticas con nota) */
function getAverageGrade(practices: PracticeWithEvaluations[]): number | null {
  const withGrade = practices.filter(p => p.finalGrade != null);
  if (withGrade.length === 0) return null;
  const sum = withGrade.reduce((acc, p) => acc + (p.finalGrade as number), 0);
  return sum / withGrade.length;
}

export const EvaluationCard: React.FC<EvaluationCardProps> = ({
  group,
  displayScale,
  onEvaluate,
  onViewDetails,
  onApprove,
  onOpenCommittee,
  onGrantExtension,
  onRevokeExtension,
  onViewAudit,
  onUnfreeze,
  isReadOnly,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  /** Construye acciones de la tarjeta (basado en la primera práctica del grupo) */
  const buildActions = useCallback(() => {
    const actions: { label: string; onClick: () => void; className?: string }[] = [];

    // Culminar — solo si la primera práctica cumple condiciones
    const firstPractice = group.practices[0];
    if (
      firstPractice.evaluationStatus === 'completed' &&
      firstPractice.result === 'approved' &&
      firstPractice.culminationStatus === 'pending'
    ) {
      actions.push({
        label: 'Culminar',
        onClick: () => onApprove(firstPractice),
        className: 'text-success-600 dark:text-success-400',
      });
    }

    // Gestionar Comité — si alguna práctica no está culminada
    const hasNonCulminated = group.practices.some(p => p.practicesStatusCode !== 'CULMINADO');
    if (hasNonCulminated) {
      actions.push({
        label: 'Gestionar Comité',
        onClick: () => onOpenCommittee(firstPractice.practiceId, group.studentName),
      });
    }

    // Otorgar Extensión — si alguna práctica no tiene extensión y no está culminada
    const hasExtendable = group.practices.some(
      p => !p.extensionGranted && p.practicesStatusCode !== 'CULMINADO'
    );
    if (hasExtendable) {
      actions.push({
        label: 'Otorgar Extensión',
        onClick: () => onGrantExtension(firstPractice.practiceId, group.studentName),
      });
    }

    // Revocar Extensión — si alguna práctica tiene extensión y no está culminada
    const hasRevocable = group.practices.some(
      p => p.extensionGranted && p.practicesStatusCode !== 'CULMINADO'
    );
    if (hasRevocable) {
      actions.push({
        label: 'Revocar Extensión',
        onClick: () => onRevokeExtension(firstPractice.practiceId),
      });
    }

    // Ver Auditoría — siempre visible
    actions.push({
      label: 'Ver Auditoría',
      onClick: () => onViewAudit(firstPractice.practiceId),
    });

    // Descongelar — si alguna práctica está congelada o reprobada
    const hasFrozenOrFailed = group.practices.some(
      p => p.isFrozen || p.practicesStatusCode === 'REPROBADO'
    );
    if (hasFrozenOrFailed) {
      actions.push({
        label: 'Descongelar',
        onClick: () => onUnfreeze(firstPractice.practiceId),
      });
    }

    return actions;
  }, [group, onApprove, onOpenCommittee, onGrantExtension, onRevokeExtension, onViewAudit, onUnfreeze]);

  const evaluationTypes: EvaluatorType[] = ['INSTITUCIONAL', 'ACADEMICO', 'COMITE'];
  const actions = buildActions();
  const groupStatus = getGroupEvaluationStatus(group.practices);
  const statusSummary = getStatusSummary(group.practices);
  const avgGrade = getAverageGrade(group.practices);
  const avgGradePercent = avgGrade != null
    ? ((avgGrade / displayScale) * 100).toFixed(1)
    : null;

  /** Label del数量 de prácticas */
  const practiceCountLabel = group.practices.length === 1
    ? '1 práctica'
    : `${group.practices.length} prácticas`;

  return (
    <div className="border border-border-default dark:border-border-dark rounded-lg overflow-hidden bg-white dark:bg-gray-800">
      {/* ── Collapsed view: resumen del grupo ── */}
      <button
        data-testid="card-header"
        onClick={toggleExpand}
        className="w-full text-left px-4 py-3 flex items-center justify-between gap-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
        aria-label="Expandir detalles"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {/* Expand/Collapse chevron */}
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7l-7 7" />
          </svg>

          {/* Student info */}
          <div className="min-w-0">
            <span className="font-medium text-text-primary dark:text-text-emphasis">
              {group.studentName}
            </span>
            <span className="ml-2 text-xs text-text-tertiary">
              CI: {group.studentCi}
            </span>
          </div>

          {/* Career (hidden on small screens) */}
          <span className="hidden md:inline text-sm text-text-secondary ml-4">
            {group.careerName}
          </span>

          {/* Practice count badge */}
          <span className="hidden md:inline-flex items-center rounded-full text-xs px-2 py-0.5 font-medium bg-brand-50 text-brand-600 border border-brand-200 ml-2">
            {practiceCountLabel}
          </span>
        </div>

        {/* Right side: status summary and average grade */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-xs text-text-tertiary hidden sm:inline">
            {statusSummary}
          </span>
          {getStatusBadge(groupStatus)}
          {avgGradePercent && (
            <span className={`text-sm font-semibold hidden sm:inline ${getGradeColor(avgGrade, displayScale)}`}>
              {avgGradePercent}%
            </span>
          )}
        </div>
      </button>

      {/* ── Evaluation summary row (evaluations of the first practice) ── */}
      <div className="px-4 pb-3 flex items-center gap-4 flex-wrap">
        {evaluationTypes.map(type => {
          const evaluation = group.practices[0]?.evaluations[type];
          return (
            <div key={type} className="flex-shrink-0">
              <EvaluationCell
                evaluation={evaluation}
                evaluatorType={type}
                onEvaluate={(type, evalId) => onEvaluate(group.practices[0], type, evalId)}
                onViewDetails={onViewDetails}
                displayScale={displayScale}
                isFrozen={group.practices[0]?.isFrozen}
              />
            </div>
          );
        })}
      </div>

      {/* ── Expanded detail: lista de prácticas ── */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            key={`${group.studentCi}-${group.careerId}-detail`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
            onWheel={(e) => e.stopPropagation()}
          >
            <div className="px-4 pb-4 bg-gray-50 dark:bg-gray-850 space-y-3">
              {/* Cada práctica individual */}
              {group.practices.map((practice, index) => (
                <PracticeDetailRow
                  key={practice.practiceId}
                  practice={practice}
                  displayScale={displayScale}
                  index={index}
                  onEvaluate={onEvaluate}
                  onViewDetails={onViewDetails}
                  onOpenCommittee={onOpenCommittee}
                  onGrantExtension={onGrantExtension}
                  onRevokeExtension={onRevokeExtension}
                  onViewAudit={onViewAudit}
                  onUnfreeze={onUnfreeze}
                  onApprove={onApprove}
                  isReadOnly={isReadOnly}
                  isOnlyPractice={group.practices.length === 1}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Sub-component: Fila de detalle de una práctica individual ──

interface PracticeDetailRowProps {
  practice: PracticeWithEvaluations;
  displayScale: number;
  index: number;
  onEvaluate: (practice: PracticeWithEvaluations, type: EvaluatorType, existingEvalId?: number) => void;
  onViewDetails: (evaluationId: number) => void;
  onOpenCommittee: (practiceId: number, studentName: string) => void;
  onGrantExtension: (practiceId: number, studentName: string) => void;
  onRevokeExtension: (practiceId: number) => void;
  onViewAudit: (practiceId: number) => void;
  onUnfreeze: (practiceId: number) => void;
  onApprove: (practice: PracticeWithEvaluations) => void;
  isReadOnly: boolean;
  isOnlyPractice: boolean;
}

const PracticeDetailRow: React.FC<PracticeDetailRowProps> = ({
  practice,
  displayScale,
  index,
  onEvaluate,
  onViewDetails,
  onOpenCommittee,
  onGrantExtension,
  onRevokeExtension,
  onViewAudit,
  onUnfreeze,
  onApprove,
  isReadOnly,
  isOnlyPractice,
}) => {
  const evaluationTypes: EvaluatorType[] = ['INSTITUCIONAL', 'ACADEMICO', 'COMITE'];

  const handleEvaluate = useCallback(
    (type: EvaluatorType, existingEvalId?: number) => {
      onEvaluate(practice, type, existingEvalId);
    },
    [onEvaluate, practice]
  );

  const buildRowActions = useCallback(() => {
    const actions: { label: string; onClick: () => void; className?: string }[] = [];

    if (
      practice.evaluationStatus === 'completed' &&
      practice.result === 'approved' &&
      practice.culminationStatus === 'pending'
    ) {
      actions.push({
        label: 'Culminar',
        onClick: () => onApprove(practice),
        className: 'text-success-600 dark:text-success-400',
      });
    }

    if (practice.practicesStatusCode !== 'CULMINADO') {
      actions.push({
        label: 'Gestionar Comité',
        onClick: () => onOpenCommittee(practice.practiceId, practice.studentName),
      });
    }

    if (!practice.extensionGranted && practice.practicesStatusCode !== 'CULMINADO') {
      actions.push({
        label: 'Otorgar Extensión',
        onClick: () => onGrantExtension(practice.practiceId, practice.studentName),
      });
    }

    if (practice.extensionGranted && practice.practicesStatusCode !== 'CULMINADO') {
      actions.push({
        label: 'Revocar Extensión',
        onClick: () => onRevokeExtension(practice.practiceId),
      });
    }

    actions.push({
      label: 'Ver Auditoría',
      onClick: () => onViewAudit(practice.practiceId),
    });

    if (practice.isFrozen || practice.practicesStatusCode === 'REPROBADO') {
      actions.push({
        label: 'Descongelar',
        onClick: () => onUnfreeze(practice.practiceId),
      });
    }

    return actions;
  }, [practice, onApprove, onOpenCommittee, onGrantExtension, onRevokeExtension, onViewAudit, onUnfreeze]);

  const finalGradePercent = practice.finalGrade != null
    ? ((practice.finalGrade / displayScale) * 100).toFixed(1)
    : null;

  const rowActions = buildRowActions();

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-800">
      {/* Header de la práctica */}
      <div className="px-4 py-2.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* Número de práctica */}
          {!isOnlyPractice && (
            <span className="flex-shrink-0 w-5 h-5 rounded-full bg-brand-50 text-brand-600 text-xs font-medium flex items-center justify-center">
              {index + 1}
            </span>
          )}

          {/* Tipo de práctica */}
          <span className="inline-flex items-center rounded-full text-xs px-2 py-0.5 font-medium bg-brand-50 text-brand-600 border border-brand-200">
            {practice.practiceTypeName}
          </span>

          {/* Institución */}
          <span className="text-sm text-text-secondary truncate">
            {practice.institutionName}
          </span>

          {/* Período */}
          <span className="hidden sm:inline text-xs text-text-tertiary">
            {practice.periodName}
          </span>
        </div>

        {/* Nota y resultado */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {practice.extensionGranted && (
            <span className="inline-flex items-center rounded-full text-xs px-2 py-0.5 font-medium bg-amber-50 text-amber-600 border border-amber-200">
              Extensión
            </span>
          )}
          {practice.isFrozen && (
            <span className="inline-flex items-center rounded-full text-xs px-2 py-0.5 font-medium bg-red-50 text-red-600 border border-red-200">
              Congelada
            </span>
          )}
          <span className={`text-sm font-semibold ${getGradeColor(practice.finalGrade, displayScale)}`}>
            {finalGradePercent ? `${finalGradePercent}%` : '—'}
          </span>
          {!isReadOnly && rowActions.length > 0 && (
            <ActionDropdown actions={rowActions} />
          )}
        </div>
      </div>

      {/* Evaluaciones y detalle */}
      <div className="px-4 pb-3">
        {/* Evaluaciones en fila */}
        <div className="flex items-center gap-4 flex-wrap mb-2">
          {evaluationTypes.map(type => {
            const evaluation = practice.evaluations[type];
            return (
              <div key={type} className="flex-shrink-0">
                <EvaluationCell
                  evaluation={evaluation}
                  evaluatorType={type}
                  onEvaluate={handleEvaluate}
                  onViewDetails={onViewDetails}
                  displayScale={displayScale}
                  isFrozen={practice.isFrozen}
                />
              </div>
            );
          })}
        </div>

        {/* Detalles en grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div>
            <span className="text-text-tertiary uppercase font-medium">Horas</span>
            <p className="text-text-primary">{practice.totalHours}h / {practice.hoursRequired ?? 360}h</p>
          </div>
          <div>
            <span className="text-text-tertiary uppercase font-medium">Estado</span>
            <p className="text-text-primary">{practice.practicesStatus || '—'}</p>
          </div>
          <div>
            <span className="text-text-tertiary uppercase font-medium">Resultado</span>
            <p className="text-text-primary">{getResultLabel(practice.result)}</p>
          </div>
          <div>
            <span className="text-text-tertiary uppercase font-medium">Nota Final</span>
            <p className={`font-semibold ${getGradeColor(practice.finalGrade, displayScale)}`}>
              {finalGradePercent ? `${finalGradePercent}%` : '—'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EvaluationCard;
