import { useState, useCallback } from 'react';
import { TOAST_SUCCESS, TOAST_ERROR } from '@/components/ui/dialog/DialogConfig';
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
import toast from 'react-hot-toast';

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

  const fetchEvaluations = useCallback(async (practiceId?: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await evaluationService.getEvaluations(practiceId);
      setEvaluations(data);
    } catch (err: any) {
      const message = err.response?.data?.message || TOAST_ERROR.load(resourceName);
      setError(message);
      toast.error(message);
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
      const message = err.response?.data?.message || TOAST_ERROR.load(resourceName);
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createEvaluation = useCallback(async (payload: CreateEvaluationPayload) => {
    try {
      setLoading(true);
      setError(null);
      const result = await evaluationService.createEvaluation(payload);
      toast.success(TOAST_SUCCESS.created(resourceName));
      await fetchEvaluations(payload.professionalPracticeId);
      return result;
    } catch (err: any) {
      const message = err.response?.data?.message || TOAST_ERROR.create(resourceName);
      setError(message);
      toast.error(message);
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
      toast.success(TOAST_SUCCESS.updated(resourceName));
      return true;
    } catch (err: any) {
      const message = err.response?.data?.message || TOAST_ERROR.update(resourceName);
      setError(message);
      toast.error(message);
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
      toast.success(TOAST_SUCCESS.deleted(resourceName));
      setEvaluations(prev => prev.filter(e => e.evaluationId !== id));
      return true;
    } catch (err: any) {
      const message = err.response?.data?.message || TOAST_ERROR.delete(resourceName);
      setError(message);
      toast.error(message);
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
      const message = err.response?.data?.message || TOAST_ERROR.load(resourceName);
      setError(message);
      toast.error(message);
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
      const message = err.response?.data?.message || TOAST_ERROR.load(resourceName);
      setError(message);
      toast.error(message);
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
