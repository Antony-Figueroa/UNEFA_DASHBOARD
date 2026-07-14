/**
 * @file AllEvaluationsDetailModal.tsx
 * @description Modal that shows all evaluations (5 total) for a practice
 * with tabs for each evaluator type and committee member.
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Modal, ModalHeader, ModalBody } from '../../../components/ui/modal';
import Badge from '../../../components/ui/badge/Badge';
import { EVALUATOR_TYPE_LABELS, EvaluationCriteria, EvaluationWithDetails, EvaluatorType } from '../../evaluations/types';
import { evaluationService } from '../../evaluations/services/evaluationService';
import { useSystemEvaluationConfig } from '../../evaluations/hooks/useSystemEvaluationConfig';

interface AllEvaluationsDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  practiceId: number | null;
  studentName?: string;
  studentCi?: string;
}

interface TabDef {
  id: string;
  label: string;
  evaluationId: number | null;
}

export const AllEvaluationsDetailModal: React.FC<AllEvaluationsDetailModalProps> = ({
  isOpen,
  onClose,
  practiceId,
  studentName,
  studentCi,
}) => {
  const { config } = useSystemEvaluationConfig();
  const [tabs, setTabs] = useState<TabDef[]>([]);
  const [activeTab, setActiveTab] = useState<string>('');
  const [evaluations, setEvaluations] = useState<Map<number, EvaluationWithDetails>>(new Map());
  const [criteriaMap, setCriteriaMap] = useState<Map<number, string>>(new Map());
  const [typeScores, setTypeScores] = useState<{
    INSTITUCIONAL: number | null;
    ACADEMICO: number | null;
    COMITE: number | null;
  }>({ INSTITUCIONAL: null, ACADEMICO: null, COMITE: null });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && practiceId) {
      loadAllEvaluations();
    } else {
      // Reset on close
      setTabs([]);
      setActiveTab('');
      setEvaluations(new Map());
      setCriteriaMap(new Map());
      setTypeScores({ INSTITUCIONAL: null, ACADEMICO: null, COMITE: null });
    }
  }, [isOpen, practiceId]);

  const loadAllEvaluations = async () => {
    if (!practiceId) return;
    setLoading(true);
    try {
      // 1. Get practice evaluation status (has all evaluation IDs)
      const status = await evaluationService.getDetailedPracticeStatus(practiceId);

      // 2. Build tabs from status
      const newTabs: TabDef[] = [];
      const evalIdsToFetch: number[] = [];

      // Institucional
      if (status.evaluations?.INSTITUCIONAL?.evaluationId) {
        const id = status.evaluations.INSTITUCIONAL.evaluationId;
        newTabs.push({ id: 'INSTITUCIONAL', label: 'Institucional', evaluationId: id });
        evalIdsToFetch.push(id);
      }

      // Académico
      if (status.evaluations?.ACADEMICO?.evaluationId) {
        const id = status.evaluations.ACADEMICO.evaluationId;
        newTabs.push({ id: 'ACADEMICO', label: 'Académico', evaluationId: id });
        evalIdsToFetch.push(id);
      }

      // Comité members — sorted by memberIndex to ensure Miembro 1 → 2 → 3
      if (status.evaluations?.COMITE?.members) {
        [...status.evaluations.COMITE.members]
          .sort((a, b) => a.memberIndex - b.memberIndex)
          .forEach((member) => {
            const tabId = `COMITE_${member.memberIndex}`;
            newTabs.push({
              id: tabId,
              label: `Miembro ${member.memberIndex}`,
              evaluationId: member.evaluationId,
            });
            if (member.evaluationId) evalIdsToFetch.push(member.evaluationId);
          });
      }

      setTabs(newTabs);
      if (newTabs.length > 0) setActiveTab(newTabs[0].id);

      // 3. Fetch each evaluation detail
      const results = await Promise.allSettled(
        evalIdsToFetch.map(id => evaluationService.getEvaluationById(id))
      );

      const evalMap = new Map<number, EvaluationWithDetails>();
      results.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
          evalMap.set(result.value.evaluationId, result.value);
        }
      });
      setEvaluations(evalMap);

      // 4. Fetch criteria descriptions for each evaluator type present
      const uniqueTypes = new Set<EvaluatorType>();
      newTabs.forEach(tab => {
        if (tab.id.startsWith('COMITE')) uniqueTypes.add('COMITE');
        else uniqueTypes.add(tab.id as EvaluatorType);
      });

      const critMap = new Map<number, string>();
      const critResults = await Promise.allSettled(
        [...uniqueTypes].map(type => evaluationService.getCriteria(type))
      );
      critResults.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
          result.value.forEach((c: EvaluationCriteria) => {
            critMap.set(c.criteriaId, c.description);
          });
        }
      });
      setCriteriaMap(critMap);

      // Extract per-type scores from status
      setTypeScores({
        INSTITUCIONAL: status.evaluations?.INSTITUCIONAL?.completed
          ? status.evaluations.INSTITUCIONAL.score : null,
        ACADEMICO: status.evaluations?.ACADEMICO?.completed
          ? status.evaluations.ACADEMICO.score : null,
        COMITE: status.evaluations?.COMITE?.completed
          ? status.evaluations.COMITE.score : null,
      });
    } catch (error) {
      console.error('[AllEvaluationsDetailModal] Error loading evaluations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActiveEvaluation = useCallback((): EvaluationWithDetails | null => {
    const tab = tabs.find(t => t.id === activeTab);
    if (!tab?.evaluationId) return null;
    return evaluations.get(tab.evaluationId) || null;
  }, [tabs, activeTab, evaluations]);

  const getCriteriaDescription = (criteriaId: number): string => {
    return criteriaMap.get(criteriaId) || `Criterio ${criteriaId}`;
  };

  const weightedBreakdown = useMemo(() => {
    const types = [
      { key: 'INSTITUCIONAL' as const, label: 'Institucional', emoji: '🏫' },
      { key: 'ACADEMICO' as const, label: 'Académico', emoji: '📚' },
      { key: 'COMITE' as const, label: 'Comité Evaluador', emoji: '👥' },
    ];

    let finalGrade = 0;
    let allComplete = true;

    const items = types.map(({ key, label, emoji }) => {
      const score = typeScores[key];
      const weight = config.weights[key] ?? 0;
      const weightPct = weight * 100;
      const contribution = score != null ? score * weight : null;
      const maxContribution = config.score.displayScale * weight;
      if (score == null) allComplete = false;
      if (contribution != null) finalGrade += contribution;
      return { key, label, emoji, score, weight, weightPct, contribution, maxContribution };
    });

    return { items, finalGrade: allComplete ? finalGrade : null, allComplete };
  }, [typeScores, config]);

  const getPctColor = (pct: number): string => {
    if (pct < 50) return 'text-red-500';
    if (pct >= 80) return 'text-green-500';
    return 'text-yellow-500';
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('es-VE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const activeEvaluation = getActiveEvaluation();

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="5xl">
      <ModalHeader>
        Detalles de Evaluaciones
        {studentName && (
          <span className="ml-2 text-sm font-normal text-text-secondary">— {studentName}</span>
        )}
      </ModalHeader>
      <ModalBody>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" />
          </div>
        ) : tabs.length === 0 ? (
          <div className="text-center py-8 text-text-secondary">
            No hay evaluaciones registradas para esta práctica
          </div>
        ) : (
          <div className="space-y-4">
            {/* Student info */}
            {(studentName || studentCi) && (
              <div className="p-3 bg-brand-50 dark:bg-brand-500/10 rounded-lg border border-brand-200 dark:border-brand-500/20">
                <p className="text-xs font-bold uppercase text-brand-600 dark:text-brand-400 mb-1">
                  Estudiante
                </p>
                <p className="font-semibold text-text-primary dark:text-text-emphasis">
                  {studentName || '—'}
                </p>
                {studentCi && <p className="text-sm text-text-secondary">{studentCi}</p>}
              </div>
            )}

            {/* ── Resumen Ponderado ── */}
            <div className="p-4 bg-white dark:bg-gray-900 rounded-xl border border-border-default dark:border-border-dark">
              <h4 className="text-xs font-bold uppercase text-text-tertiary mb-3">
                Desglose Ponderado
              </h4>
              <div className="space-y-2">
                {weightedBreakdown.items.map(item => (
                  <div key={item.key} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span>{item.emoji}</span>
                      <span className="font-medium text-text-primary dark:text-white truncate">
                        {item.label}
                      </span>
                      <span className="text-xs text-text-tertiary">({item.weightPct}%)</span>
                    </div>
                    {item.score != null ? (
                      <div className="flex items-center gap-2 text-right flex-shrink-0">
                        <span className="text-text-secondary">
                          {item.score.toFixed(1)}/{config.score.displayScale}
                        </span>
                        <span className="text-text-tertiary">×</span>
                        <span className="text-text-secondary">{item.weightPct}%</span>
                        <span className="text-text-tertiary">=</span>
                        <span className="font-semibold text-text-primary dark:text-white">
                          {item.contribution!.toFixed(1)}/{item.maxContribution.toFixed(1)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-warning-500 italic flex-shrink-0">Pendiente</span>
                    )}
                  </div>
                ))}
              </div>

              {weightedBreakdown.finalGrade != null && (
                <div className="mt-3 pt-3 border-t border-border-default dark:border-border-dark flex items-center justify-between">
                  <span className="text-sm font-bold uppercase text-text-tertiary">Nota Final</span>
                  <span className={`text-xl font-bold ${
                    (weightedBreakdown.finalGrade / config.score.displayScale) >= 0.7
                      ? 'text-success-600 dark:text-success-400'
                      : (weightedBreakdown.finalGrade / config.score.displayScale) >= 0.6
                        ? 'text-warning-600 dark:text-warning-400'
                        : 'text-error-600 dark:text-error-400'
                  }`}>
                    {weightedBreakdown.finalGrade.toFixed(1)}/{config.score.displayScale}
                  </span>
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-border-default dark:border-border-dark">
              {tabs.map(tab => {
                const evalData = tab.evaluationId ? evaluations.get(tab.evaluationId) : null;
                const isActive = tab.id === activeTab;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                      isActive
                        ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                        : 'border-transparent text-text-secondary hover:text-text-primary hover:border-gray-300'
                    }`}
                  >
                    {tab.label}
                    {evalData && (
                      <span className="ml-1.5 text-xs text-text-tertiary">
                        {evalData.totalScore.toFixed(1)}/{config.score.displayScale} ({((evalData.totalScore / config.score.displayScale) * 100).toFixed(0)}%)
                      </span>
                    )}
                    {!evalData && tab.evaluationId && (
                      <span className="ml-1.5 text-xs text-text-tertiary">—</span>
                    )}
                    {!tab.evaluationId && (
                      <span className="ml-1.5 text-xs text-warning-500">Pendiente</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Active evaluation detail */}
            {activeEvaluation ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-xs font-bold uppercase text-text-tertiary mb-1">Tipo</p>
                    <Badge color="primary" variant="light">
                      {EVALUATOR_TYPE_LABELS[activeEvaluation.evaluatorType] || activeEvaluation.evaluatorType}
                      {activeEvaluation.comiteMemberIndex != null && ` — Miembro ${activeEvaluation.comiteMemberIndex}`}
                    </Badge>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-xs font-bold uppercase text-text-tertiary mb-1">Puntaje</p>
                    <p className={`text-2xl font-bold ${getPctColor((activeEvaluation.totalScore / config.score.displayScale) * 100)}`}>
                      {activeEvaluation.totalScore.toFixed(1)}<span className="text-sm font-normal text-text-tertiary">/{config.score.displayScale}</span>
                      <span className="ml-2 text-base">({((activeEvaluation.totalScore / config.score.displayScale) * 100).toFixed(1)}%)</span>
                    </p>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-xs font-bold uppercase text-text-tertiary mb-1">Evaluador</p>
                    <p className="font-medium">{activeEvaluation.evaluatorName}</p>
                    {activeEvaluation.evaluatorCi && (
                      <p className="text-sm text-text-secondary">{activeEvaluation.evaluatorCi}</p>
                    )}
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-xs font-bold uppercase text-text-tertiary mb-1">Fecha</p>
                    <p className="font-medium">{formatDate(activeEvaluation.evaluationDate)}</p>
                  </div>
                </div>

                {activeEvaluation.observations && (
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-xs font-bold uppercase text-text-tertiary mb-2">Observaciones</p>
                    <p className="text-sm text-text-secondary">{activeEvaluation.observations}</p>
                  </div>
                )}

                <div>
                  <h4 className="text-sm font-bold uppercase text-text-tertiary mb-3">
                    Criterios ({activeEvaluation.items?.length || 0} ítems)
                  </h4>
                  <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                    {activeEvaluation.items && activeEvaluation.items.length > 0 ? (
                      activeEvaluation.items
                        .sort((a, b) => a.itemNumber - b.itemNumber)
                        .map(item => (
                          <div
                            key={item.detailId || item.criteriaId}
                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                          >
                            <div className="flex-1">
                              <span className="text-sm font-medium text-text-secondary mr-2">
                                {item.itemNumber}.
                              </span>
                              <span className="text-sm text-text-primary dark:text-white">
                                {getCriteriaDescription(item.criteriaId)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-bold ${getPctColor((item.score / config.score.max) * 100)}`}>
                                {item.score.toFixed(1)}<span className="font-normal text-text-tertiary">/{config.score.max}</span>
                              </span>
                              <span className="text-xs text-text-tertiary">
                                ({((item.score / config.score.max) * 100).toFixed(0)}%)
                              </span>
                            </div>
                          </div>
                        ))
                    ) : (
                      <div className="text-center py-4 text-text-secondary">
                        No hay detalles disponibles
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : activeTab && tabs.find(t => t.id === activeTab)?.evaluationId == null ? (
              <div className="text-center py-8 text-text-secondary">
                Esta evaluación aún no ha sido registrada
              </div>
            ) : null}
          </div>
        )}
      </ModalBody>
    </Modal>
  );
};

export default AllEvaluationsDetailModal;
