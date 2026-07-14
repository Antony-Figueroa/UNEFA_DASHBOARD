import { useEffect, useState } from "react";
import { Modal, ModalHeader, ModalBody } from "../../../components/ui/modal";
import Badge from "../../../components/ui/badge/Badge";
import { EVALUATOR_TYPE_LABELS, EvaluationWithDetails } from "../types";
import { useEvaluations } from "../hooks/useEvaluations";
import { useSystemEvaluationConfig } from "../hooks/useSystemEvaluationConfig";

interface EvaluationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  evaluationId: number | null;
  studentName?: string;
  studentCi?: string;
  careerName?: string;
  practiceTypeName?: string;
}

export const EvaluationDetailModal: React.FC<EvaluationDetailModalProps> = ({
  isOpen,
  onClose,
  evaluationId,
  studentName,
  studentCi,
  careerName,
  practiceTypeName,
}) => {
  const { getEvaluationById, fetchCriteria, criteria } = useEvaluations();
  const { config } = useSystemEvaluationConfig();
  const [evaluation, setEvaluation] = useState<EvaluationWithDetails | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && evaluationId) {
      loadEvaluation();
    }
  }, [isOpen, evaluationId]);

  useEffect(() => {
    if (isOpen && evaluation?.evaluatorType) {
      fetchCriteria(evaluation.evaluatorType);
    }
  }, [isOpen, evaluation?.evaluatorType, fetchCriteria]);

  const loadEvaluation = async () => {
    if (!evaluationId) return;
    setLoading(true);
    const data = await getEvaluationById(evaluationId);
    setEvaluation(data);
    setLoading(false);
  };

  const getCriteriaDescription = (criteriaId: number): string => {
    const found = criteria.find(c => c.criteriaId === criteriaId);
    return found?.description || `Criterio ${criteriaId}`;
  };

  const getPctColor = (pct: number): string => {
    if (pct < 50) return "text-red-500";
    if (pct >= 80) return "text-green-500";
    return "text-yellow-500";
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("es-VE", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="3xl">
      <ModalHeader>
        Detalles de Evaluación
      </ModalHeader>
      <ModalBody>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
          </div>
        ) : evaluation ? (
          <div className="space-y-6">
            {(studentName || studentCi || careerName || practiceTypeName) && (
              <div className="p-4 bg-brand-50 dark:bg-brand-500/10 rounded-lg border border-brand-200 dark:border-brand-500/20">
                <p className="text-xs font-bold uppercase text-brand-600 dark:text-brand-400 mb-2">Estudiante Evaluado</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
                  {studentName && (
                    <div>
                      <span className="text-xs text-text-tertiary">Nombre</span>
                      <p className="text-sm font-semibold text-text-primary dark:text-text-emphasis">{studentName}</p>
                    </div>
                  )}
                  {studentCi && (
                    <div>
                      <span className="text-xs text-text-tertiary">Cédula</span>
                      <p className="text-sm font-medium text-text-primary dark:text-text-emphasis">{studentCi}</p>
                    </div>
                  )}
                  {careerName && (
                    <div>
                      <span className="text-xs text-text-tertiary">Carrera</span>
                      <p className="text-sm font-medium text-text-primary dark:text-text-emphasis">{careerName}</p>
                    </div>
                  )}
                  {practiceTypeName && (
                    <div>
                      <span className="text-xs text-text-tertiary">Tipo de Práctica</span>
                      <p className="text-sm font-medium text-text-primary dark:text-text-emphasis">{practiceTypeName}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-xs font-bold uppercase text-text-tertiary mb-1">Tipo de Evaluación</p>
                <Badge color="primary" variant="light">
                  {EVALUATOR_TYPE_LABELS[evaluation.evaluatorType]}
                </Badge>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-xs font-bold uppercase text-text-tertiary mb-1">Puntaje Total</p>
                <p className={`text-2xl font-bold ${getPctColor(((evaluation.totalScore / config.score.displayScale) * 100))}`}>
                  {evaluation.totalScore.toFixed(1)}<span className="text-sm font-normal text-text-tertiary">/{config.score.displayScale}</span>
                  <span className="ml-2 text-base">({((evaluation.totalScore / config.score.displayScale) * 100).toFixed(1)}%)</span>
                </p>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-xs font-bold uppercase text-text-tertiary mb-1">Evaluador</p>
                <p className="font-medium">{evaluation.evaluatorName}</p>
                {evaluation.evaluatorCi && (
                  <p className="text-sm text-text-secondary">{evaluation.evaluatorCi}</p>
                )}
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-xs font-bold uppercase text-text-tertiary mb-1">Fecha de Evaluación</p>
                <p className="font-medium">{formatDate(evaluation.evaluationDate)}</p>
              </div>
            </div>

            {evaluation.observations && (
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-xs font-bold uppercase text-text-tertiary mb-2">Observaciones</p>
                <p className="text-sm text-text-secondary">{evaluation.observations}</p>
              </div>
            )}

            <div>
              <h4 className="text-sm font-bold uppercase text-text-tertiary mb-3">
                Criterios Evaluados ({evaluation.items?.length || 0} ítems)
              </h4>
              <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                {evaluation.items && evaluation.items.length > 0 ? (
                  evaluation.items
                    .sort((a, b) => a.itemNumber - b.itemNumber)
                    .map((item) => (
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
                          <span className={`text-sm font-bold ${getPctColor(((item.score / config.score.max) * 100))}`}>
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
                    No hay detalles de criterios disponibles
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-text-secondary">
            No se encontró la evaluación
          </div>
        )}
      </ModalBody>
    </Modal>
  );
};

export default EvaluationDetailModal;
