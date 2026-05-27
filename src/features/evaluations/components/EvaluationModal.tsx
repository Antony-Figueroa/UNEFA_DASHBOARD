import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '../../../components/ui/modal';
import Button from '../../../components/ui/button/Button';
import {
  EvaluatorType,
  EVALUATOR_TYPE_LABELS,
  SCORE_RANGE,
  DISPLAY_SCALE,
  SystemEvaluationConfig,
  EvaluationCriteria,
  EvaluationWithDetails,
} from '../types';
import { useEvaluations } from '../hooks/useEvaluations';
import { useSystemEvaluationConfig } from '../hooks/useSystemEvaluationConfig';
import { evaluationService } from '../services/evaluationService';
import { isSafeInput } from '../../../utils/inputValidation';

const schema = z.object({
  evaluatorName: z.string()
    .min(3, 'Nombre del evaluador requerido')
    .max(100, "El nombre es demasiado largo")
    .refine(val => isSafeInput(val), { message: "Caracteres no permitidos" }),
  evaluatorCi: z.string().optional(),
  observations: z.string()
    .max(1000, "Las observaciones son demasiado largas")
    .refine(val => isSafeInput(val), { message: "Caracteres no permitidos" })
    .optional()
    .default('')
});

type FormData = z.infer<typeof schema>;

interface EvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  practiceId: number;
  evaluatorType: EvaluatorType;
  /** Si se proporciona, el modal carga la evaluación existente y al guardar hace PUT */
  evaluationId?: number | null;
  onSuccess: () => void;
}

export const EvaluationModal: React.FC<EvaluationModalProps> = ({
  isOpen,
  onClose,
  practiceId,
  evaluatorType,
  evaluationId,
  onSuccess
}) => {
  const { criteria, fetchCriteria, createEvaluation, updateEvaluation, loading } = useEvaluations();
  const { config } = useSystemEvaluationConfig();
  const scoreRange = { min: config.score.min, max: config.score.max };
  const midpoint = scoreRange.min + Math.floor((scoreRange.max - scoreRange.min) / 2);
  const [itemScores, setItemScores] = useState<Record<number, number>>({});
  const [criteriaLoaded, setCriteriaLoaded] = useState<EvaluationCriteria[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [existingData, setExistingData] = useState<EvaluationWithDetails | null>(null);
  const [initialLoading, setInitialLoading] = useState(false);
  const isEditing = !!evaluationId;
  const isTutorEvaluator = evaluatorType !== 'COMITE';

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors }
  } = useForm<FormData>({
    // Safe: schema validates at runtime, resolver type mismatch is a known @hookform/resolvers × Zod quirk
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: {
      evaluatorName: '',
      evaluatorCi: '',
      observations: ''
    }
  });

  // Cargar datos del tutor asignado cuando se abre el modal (solo lectura)
  useEffect(() => {
    if (!isOpen || isEditing) return;

    if (!isTutorEvaluator) {
      setValue('evaluatorName', '');
      setValue('evaluatorCi', '');
      return;
    }

    let cancelled = false;

    evaluationService.getPracticeTutorInfo(practiceId, evaluatorType)
      .then((tutorData) => {
        if (cancelled) return;
        if (tutorData) {
          setValue('evaluatorName', tutorData.name);
          setValue('evaluatorCi', tutorData.ci);
        }
      })
      .catch(() => {/* silent fail */})
      .finally(() => { /* no-op */ });

    return () => { cancelled = true; };
  }, [isOpen, evaluatorType, practiceId, isTutorEvaluator]);

  // Cargar criterios y datos existentes cuando se abre el modal
  useEffect(() => {
    if (isOpen && evaluatorType) {
      setDataLoaded(false);
      setExistingData(null);
      fetchCriteria(evaluatorType);
    }
  }, [isOpen, evaluatorType, fetchCriteria]);

  // Cargar datos existentes si es edición
  useEffect(() => {
    if (isOpen && evaluationId && criteria.length > 0 && !dataLoaded) {
      loadExistingEvaluation(evaluationId);
    }
  }, [isOpen, evaluationId, criteria, dataLoaded]);

  // Inicializar scores cuando se cargan criterios (o datos existentes)
  useEffect(() => {
    if (criteria.length > 0 && !dataLoaded && !evaluationId) {
      // Create mode: inicializar con midpoint
      setCriteriaLoaded(criteria);
      const initialScores: Record<number, number> = {};
      criteria.forEach(c => {
        initialScores[c.criteriaId] = midpoint;
      });
      setItemScores(initialScores);
    }
  }, [criteria, dataLoaded, evaluationId]);

  const loadExistingEvaluation = async (id: number) => {
    setInitialLoading(true);
    try {
      const data = await evaluationService.getEvaluationById(id);
      setExistingData(data);

      // Poblar el formulario
      setValue('evaluatorName', data.evaluatorName || '');
      setValue('evaluatorCi', data.evaluatorCi || '');
      setValue('observations', data.observations || '');

      // Poblar scores desde los items existentes
      if (data.items && data.items.length > 0) {
        const scores: Record<number, number> = {};
        data.items.forEach(item => {
          scores[item.criteriaId] = item.score;
        });
        setItemScores(scores);

        // También asegurar que los criterios tengan descripciones
        const mergedCriteria = criteria.map(c => {
          const existingItem = data.items.find(i => i.criteriaId === c.criteriaId);
          return existingItem ? { ...c, criteriaId: existingItem.criteriaId } : c;
        });
        setCriteriaLoaded(criteria); // los criterios ya vienen con description
      } else {
        setCriteriaLoaded(criteria);
      }

      setDataLoaded(true);
    } catch (error) {
      console.error('[EvaluationModal] Error loading evaluation:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleScoreChange = (criteriaId: number, score: number) => {
    if (score >= scoreRange.min && score <= scoreRange.max) {
      setItemScores(prev => ({
        ...prev,
        [criteriaId]: score
      }));
    }
  };

  const onSubmit = async (formData: FormData) => {
    const items = criteriaLoaded.map(c => ({
      criteriaId: c.criteriaId,
      itemNumber: c.itemNumber,
      score: itemScores[c.criteriaId] ?? midpoint
    }));

    const payload = {
      professionalPracticeId: practiceId,
      evaluatorType,
      evaluatorName: formData.evaluatorName,
      evaluatorCi: formData.evaluatorCi || undefined,
      observations: formData.observations || undefined,
      items
    };

    let result;
    if (isEditing && evaluationId) {
      result = await updateEvaluation(evaluationId, payload);
    } else {
      result = await createEvaluation(payload);
    }

    if (result) {
      reset();
      onClose();
      onSuccess();
    }
  };

  const handleClose = () => {
    reset();
    setExistingData(null);
    setDataLoaded(false);
    setItemScores({});
    setCriteriaLoaded([]);
    onClose();
  };

  const rawAverage = criteriaLoaded.length > 0
    ? (criteriaLoaded.reduce((sum, c) => sum + (itemScores[c.criteriaId] ?? midpoint), 0) / criteriaLoaded.length)
    : 0;
  const calculatedAverage = ((rawAverage / scoreRange.max) * config.score.displayScale).toFixed(2);

  const getScoreInputClass = (criteriaId: number) => {
    const score = itemScores[criteriaId] ?? midpoint;
    const { min, max } = scoreRange;
    const range = max - min;
    const lowThreshold = min + Math.floor(range * 0.4);
    const highThreshold = min + Math.ceil(range * 0.8);
    if (score <= lowThreshold) return 'border-red-400 focus:border-red-500';
    if (score >= highThreshold) return 'border-green-400 focus:border-green-500';
    return 'border-yellow-400 focus:border-yellow-500';
  };

  const modalTitle = isEditing
    ? `Editar ${EVALUATOR_TYPE_LABELS[evaluatorType]}`
    : `Nueva ${EVALUATOR_TYPE_LABELS[evaluatorType]}`;

  const submitLabel = loading ? 'Guardando...' : isEditing ? 'Actualizar Evaluación' : 'Guardar Evaluación';

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="4xl"
      showCloseButton
    >
      <ModalHeader>
        {modalTitle}
      </ModalHeader>

      {initialLoading ? (
        <ModalBody>
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
          </div>
        </ModalBody>
      ) : (
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
                  readOnly={isTutorEvaluator}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:text-white ${isTutorEvaluator ? 'bg-gray-100 dark:bg-gray-600 cursor-not-allowed' : 'border-gray-300 dark:border-gray-600'}`}
                  placeholder={isTutorEvaluator ? 'Cargando tutor asignado...' : 'Nombre completo'}
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
                  readOnly={isTutorEvaluator}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:text-white ${isTutorEvaluator ? 'bg-gray-100 dark:bg-gray-600 cursor-not-allowed' : 'border-gray-300 dark:border-gray-600'}`}
                  placeholder={isTutorEvaluator ? 'Cargando...' : 'V00.000.000'}
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
                  <span className="text-sm text-gray-500 dark:text-gray-400"> / {config.score.displayScale}</span>
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
                            type="range"
                            min={scoreRange.min}
                            max={scoreRange.max}
                            step="1"
                            value={itemScores[criterion.criteriaId] ?? midpoint}
                            onChange={(e) => handleScoreChange(criterion.criteriaId, parseInt(e.target.value))}
                            className="flex-1 sm:w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                          />
                          <input
                            type="number"
                            min={scoreRange.min}
                            max={scoreRange.max}
                            value={itemScores[criterion.criteriaId] ?? midpoint}
                            onChange={(e) => handleScoreChange(criterion.criteriaId, parseInt(e.target.value) || 0)}
                            className={`w-14 px-2 py-1 text-center border rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:text-white ${getScoreInputClass(criterion.criteriaId)}`}
                          />
                          <span className="text-xs text-gray-400">/{scoreRange.max}</span>
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
              {submitLabel}
            </Button>
          </ModalFooter>
        </form>
      )}
    </Modal>
  );
};

export default EvaluationModal;
