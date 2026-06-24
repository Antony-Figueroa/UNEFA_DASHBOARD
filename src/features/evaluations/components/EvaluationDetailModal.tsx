import { useEffect, useState } from "react";
import { Modal, ModalHeader, ModalBody } from "../../../components/ui/modal";
import Badge from "../../../components/ui/badge/Badge";
import { EVALUATOR_TYPE_LABELS, EvaluationWithDetails } from "../types";
import { useEvaluations } from "../hooks/useEvaluations";

interface EvaluationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  evaluationId: number | null;
}

export const EvaluationDetailModal: React.FC<EvaluationDetailModalProps> = ({
  isOpen,
  onClose,
  evaluationId
}) => {
  const { getEvaluationById, fetchCriteria, criteria } = useEvaluations();
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

  const getScoreColor = (score: number): string => {
    if (score < 10) return "text-red-500";
    if (score >= 16) return "text-green-500";
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-xs font-bold uppercase text-text-tertiary mb-1">Tipo de Evaluación</p>
                <Badge color="primary" variant="light">
                  {EVALUATOR_TYPE_LABELS[evaluation.evaluatorType]}
                </Badge>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-xs font-bold uppercase text-text-tertiary mb-1">Puntaje Total</p>
                <p className={`text-2xl font-bold ${getScoreColor(evaluation.totalScore)}`}>
                  {evaluation.totalScore.toFixed(1)} / 20
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
                          <span className={`text-lg font-bold ${getScoreColor(item.score)}`}>
                            {item.score}
                          </span>
                          <span className="text-xs text-text-tertiary">/20</span>
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
