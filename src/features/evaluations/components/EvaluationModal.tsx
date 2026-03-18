import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../../components/ui/modal';
import Button from '../../../components/ui/button/Button';
import { EvaluatorType, EVALUATOR_TYPE_LABELS, SCORE_RANGE, EvaluationCriteria } from '../types';
import { useEvaluations } from '../hooks/useEvaluations';

const schema = z.object({
  evaluatorName: z.string().min(3, 'Nombre del evaluador requerido'),
  evaluatorCi: z.string().optional(),
  observations: z.string().optional()
});

type FormData = z.infer<typeof schema>;

interface EvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  practiceId: number;
  evaluatorType: EvaluatorType;
  onSuccess: () => void;
}

export const EvaluationModal: React.FC<EvaluationModalProps> = ({
  isOpen,
  onClose,
  practiceId,
  evaluatorType,
  onSuccess
}) => {
  const { criteria, fetchCriteria, createEvaluation, loading } = useEvaluations();
  const [itemScores, setItemScores] = useState<Record<number, number>>({});
  const [criteriaLoaded, setCriteriaLoaded] = useState<EvaluationCriteria[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      evaluatorName: '',
      evaluatorCi: '',
      observations: ''
    }
  });

  useEffect(() => {
    if (isOpen && evaluatorType) {
      fetchCriteria(evaluatorType);
    }
  }, [isOpen, evaluatorType, fetchCriteria]);

  useEffect(() => {
    setCriteriaLoaded(criteria);
    const initialScores: Record<number, number> = {};
    criteria.forEach(c => {
      initialScores[c.criteriaId] = 10;
    });
    setItemScores(initialScores);
  }, [criteria]);

  const handleScoreChange = (criteriaId: number, score: number) => {
    if (score >= SCORE_RANGE.MIN && score <= SCORE_RANGE.MAX) {
      setItemScores(prev => ({
        ...prev,
        [criteriaId]: score
      }));
    }
  };

  const onSubmit = async (data: FormData) => {
    const items = criteriaLoaded.map(c => ({
      criteriaId: c.criteriaId,
      itemNumber: c.itemNumber,
      score: itemScores[c.criteriaId] ?? 10
    }));

    const payload = {
      professionalPracticeId: practiceId,
      evaluatorType,
      evaluatorName: data.evaluatorName,
      evaluatorCi: data.evaluatorCi,
      observations: data.observations,
      items
    };

    const result = await createEvaluation(payload);
    if (result) {
      reset();
      onClose();
      onSuccess();
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const calculatedAverage = criteriaLoaded.length > 0
    ? (criteriaLoaded.reduce((sum, c) => sum + (itemScores[c.criteriaId] ?? 0), 0) / criteriaLoaded.length).toFixed(2)
    : '0.00';

  const getScoreInputClass = (criteriaId: number) => {
    const score = itemScores[criteriaId] ?? 10;
    if (score < 10) return 'border-red-400 focus:border-red-500';
    if (score >= 16) return 'border-green-400 focus:border-green-500';
    return 'border-yellow-400 focus:border-yellow-500';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="4xl"
      showCloseButton
    >
      <ModalHeader>
        {`Nueva ${EVALUATOR_TYPE_LABELS[evaluatorType]}`}
      </ModalHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <ModalBody className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nombre del Evaluador *
              </label>
              <input
                type="text"
                {...register('evaluatorName')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:text-white"
                placeholder="Nombre completo"
              />
              {errors.evaluatorName && (
                <p className="mt-1 text-sm text-red-500">{errors.evaluatorName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Cédula del Evaluador
              </label>
              <input
                type="text"
                {...register('evaluatorCi')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:text-white"
                placeholder="V00.000.000"
                maxLength={12}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Observaciones
            </label>
            <textarea
              {...register('observations')}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:text-white"
              placeholder="Observaciones adicionales..."
            />
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                Criterios de Evaluación
              </h4>
              <div className="text-right">
                <span className="text-sm text-gray-500 dark:text-gray-400">Promedio: </span>
                <span className="text-lg font-bold text-brand-500">{calculatedAverage}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400"> / {SCORE_RANGE.MAX}</span>
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2 pr-2">
              {criteriaLoaded.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Cargando criterios...
                </div>
              ) : (
                criteriaLoaded.map((criterion) => (
                  <div
                    key={criterion.criteriaId}
                    className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-400 mr-2">
                          {criterion.itemNumber}.
                        </span>
                        <span className="text-sm text-gray-800 dark:text-gray-200">
                          {criterion.description}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={SCORE_RANGE.MIN}
                          max={SCORE_RANGE.MAX}
                          value={itemScores[criterion.criteriaId] ?? 10}
                          onChange={(e) => handleScoreChange(criterion.criteriaId, parseInt(e.target.value) || 0)}
                          className={`w-16 px-2 py-1 text-center border rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:text-white ${getScoreInputClass(criterion.criteriaId)}`}
                        />
                        <span className="text-xs text-gray-400">/20</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </ModalBody>

        <ModalFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading || criteriaLoaded.length === 0}
          >
            {loading ? 'Guardando...' : 'Guardar Evaluación'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
};

export default EvaluationModal;
