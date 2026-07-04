import { useState, useCallback } from 'react';
import { useToast } from '@/context/toast';
import { TOAST } from '@/components/ui/dialog/DialogConfig';
import { evaluationService } from '../services/evaluationService';
import {
  Evaluation,
  EvaluationCriteria,
  EvaluationStatus,
  EvaluationWithDetails,
  CreateEvaluationPayload,
  UpdateEvaluationPayload,
  EvaluatorType
} from '../types';

const resourceName = 'Evaluación';

interface UseEvaluationsReturn {
  evaluations: Evaluation[];
  criteria: EvaluationCriteria[];
  loading: boolean;
  error: string | null;
  fetchEvaluations: (practiceId?: number) => Promise<void>;
  fetchCriteria: (type?: EvaluatorType) => Promise<void>;
  getEvaluationById: (id: number) => Promise<EvaluationWithDetails | null>;
  createEvaluation: (data: CreateEvaluationPayload) => Promise<{ evaluationId: number; totalScore: number } | null>;
  updateEvaluation: (id: number, data: UpdateEvaluationPayload) => Promise<boolean>;
  deleteEvaluation: (id: number) => Promise<boolean>;
  getPracticeStatus: (practiceId: number) => Promise<EvaluationStatus | null>;
  getBatchStatus: (practiceIds: number[]) => Promise<Record<number, EvaluationStatus>>;
}

export const useEvaluations = (): UseEvaluationsReturn => {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [criteria, setCriteria] = useState<EvaluationCriteria[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToast();

  const fetchEvaluations = useCallback(async (practiceId?: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await evaluationService.getEvaluations(practiceId);
      setEvaluations(data);
    } catch (err: any) {
      const message = err.response?.data?.message || TOAST.loadError().message;
      setError(message);
      addToast({ ...TOAST.loadError(), message });
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCriteria = useCallback(async (type?: EvaluatorType) => {
    try {
      setLoading(true);
      setError(null);
      const data = await evaluationService.getCriteria(type);
      setCriteria(data);
    } catch (err: any) {
      const message = err.response?.data?.message || TOAST.loadError().message;
      setError(message);
      addToast({ ...TOAST.loadError(), message });
    } finally {
      setLoading(false);
    }
  }, []);

  const createEvaluation = useCallback(async (payload: CreateEvaluationPayload) => {
    try {
      setLoading(true);
      setError(null);
      const result = await evaluationService.createEvaluation(payload);
      addToast(TOAST.created(resourceName));
      await fetchEvaluations(payload.professionalPracticeId);
      return result;
    } catch (err: any) {
      const message = err.response?.data?.message || TOAST.createError(resourceName).message;
      setError(message);
      addToast({ ...TOAST.createError(resourceName), message });
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchEvaluations]);

  const updateEvaluation = useCallback(async (id: number, data: UpdateEvaluationPayload) => {
    try {
      setLoading(true);
      setError(null);
      await evaluationService.updateEvaluation(id, data);
      addToast(TOAST.updated(resourceName));
      return true;
    } catch (err: any) {
      const message = err.response?.data?.message || TOAST.updateError(resourceName).message;
      setError(message);
      addToast({ ...TOAST.updateError(resourceName), message });
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteEvaluation = useCallback(async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      await evaluationService.deleteEvaluation(id);
      addToast(TOAST.deleted(resourceName));
      setEvaluations(prev => prev.filter(e => e.evaluationId !== id));
      return true;
    } catch (err: any) {
      const message = err.response?.data?.message || TOAST.deleteError(resourceName).message;
      setError(message);
      addToast({ ...TOAST.deleteError(resourceName), message });
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const getPracticeStatus = useCallback(async (practiceId: number) => {
    try {
      setLoading(true);
      setError(null);
      return await evaluationService.getPracticeEvaluationStatus(practiceId);
    } catch (err: any) {
      const message = err.response?.data?.message || TOAST.loadError().message;
      setError(message);
      addToast({ ...TOAST.loadError(), message });
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getBatchStatus = useCallback(async (practiceIds: number[]) => {
    try {
      return await evaluationService.getBatchPracticeStatus(practiceIds);
    } catch {
      return {};
    }
  }, []);

  const getEvaluationById = useCallback(async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      return await evaluationService.getEvaluationById(id);
    } catch (err: any) {
      const message = err.response?.data?.message || TOAST.loadError().message;
      setError(message);
      addToast({ ...TOAST.loadError(), message });
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    evaluations,
    criteria,
    loading,
    error,
    fetchEvaluations,
    fetchCriteria,
    getEvaluationById,
    createEvaluation,
    updateEvaluation,
    deleteEvaluation,
    getPracticeStatus,
    getBatchStatus
  };
};

export default useEvaluations;
