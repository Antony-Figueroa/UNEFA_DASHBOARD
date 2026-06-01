import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { TOAST_SUCCESS, TOAST_ERROR } from '@/components/ui/dialog/DialogConfig';
import visitsService from '../services/visitsService';
import {
  Visit,
  CreateVisitPayload,
  UpdateVisitPayload,
  VisitStats
} from '../types';

const resourceName = 'Visita';

interface UseVisitsReturn {
  visits: Visit[];
  loading: boolean;
  error: string | null;
  stats: VisitStats | null;
  fetchVisitsByPractice: (practiceId: number, includeInactive?: boolean) => Promise<void>;
  fetchAllVisits: (params?: {
    page?: number;
    limit?: number;
    tutorId?: number;
    studentCi?: string;
    visitType?: string;
  }) => Promise<void>;
  fetchVisitById: (id: number) => Promise<Visit | null>;
  createVisit: (payload: CreateVisitPayload) => Promise<Visit | null>;
  updateVisit: (id: number, payload: UpdateVisitPayload) => Promise<Visit | null>;
  deleteVisit: (id: number) => Promise<boolean>;
  restoreVisit: (id: number) => Promise<boolean>;
  fetchStats: (params?: { tutorId?: number; practiceId?: number }) => Promise<void>;
  clearError: () => void;
}

export const useVisits = (): UseVisitsReturn => {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<VisitStats | null>(null);

  const fetchVisitsByPractice = useCallback(async (practiceId: number, includeInactive?: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const response = await visitsService.getVisitsByPractice(practiceId, includeInactive);
      if (response.success) {
        setVisits(response.data);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || TOAST_ERROR.load(resourceName);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAllVisits = useCallback(async (params?: {
    page?: number;
    limit?: number;
    tutorId?: number;
    studentCi?: string;
    visitType?: string;
  }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await visitsService.getAllVisits(params);
      if (response.success) {
        setVisits(response.data);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || TOAST_ERROR.load(resourceName);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchVisitById = useCallback(async (id: number): Promise<Visit | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await visitsService.getVisitById(id);
      if (response.success) {
        return response.data;
      }
      return null;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || TOAST_ERROR.load(resourceName);
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createVisit = useCallback(async (payload: CreateVisitPayload): Promise<Visit | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await visitsService.createVisit(payload);
      if (response.success) {
        toast.success(TOAST_SUCCESS.created(resourceName));
        setVisits(prev => [response.data, ...prev]);
        return response.data;
      }
      return null;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || TOAST_ERROR.create(resourceName);
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateVisit = useCallback(async (id: number, payload: UpdateVisitPayload): Promise<Visit | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await visitsService.updateVisit(id, payload);
      if (response.success) {
        toast.success(TOAST_SUCCESS.updated(resourceName));
        setVisits(prev => prev.map(v => v.visitId === id ? response.data : v));
        return response.data;
      }
      return null;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || TOAST_ERROR.update(resourceName);
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteVisit = useCallback(async (id: number): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response = await visitsService.deleteVisit(id);
      if (response.success) {
        toast.success(TOAST_SUCCESS.deleted(resourceName));
        setVisits(prev => prev.filter(v => v.visitId !== id));
        return true;
      }
      return false;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || TOAST_ERROR.delete(resourceName);
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const restoreVisit = useCallback(async (id: number): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response = await visitsService.restoreVisit(id);
      if (response.success) {
        toast.success(TOAST_SUCCESS.restored(resourceName));
        setVisits(prev => prev.map(v => v.visitId === id ? { ...v, status: true } : v));
        return true;
      }
      return false;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || TOAST_ERROR.restore(resourceName);
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async (params?: { tutorId?: number; practiceId?: number }) => {
    try {
      const response = await visitsService.getVisitStats(params);
      if (response.success) {
        setStats(response.data);
      }
    } catch (err: any) {
      console.error('Error fetching visit stats:', err);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    visits,
    loading,
    error,
    stats,
    fetchVisitsByPractice,
    fetchAllVisits,
    fetchVisitById,
    createVisit,
    updateVisit,
    deleteVisit,
    restoreVisit,
    fetchStats,
    clearError
  };
};

export default useVisits;
