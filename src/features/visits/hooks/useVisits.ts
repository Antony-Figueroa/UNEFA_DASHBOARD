import { useState, useCallback } from 'react';
import { useToast } from '@/context/toast';
import { TOAST } from '@/components/ui/dialog/DialogConfig';
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

export const useVisits = (tutorMode?: boolean): UseVisitsReturn => {
  const { addToast } = useToast();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<VisitStats | null>(null);

  // ponytail: lazy import para evitar circular en prod
  const svc = tutorMode
    ? { getVisitsByPractice: (...args: any[]) => import('../../tutor/services/tutorService').then(m => m.tutorService.getVisitsByPractice(...args)),
        createVisit: (...args: any[]) => import('../../tutor/services/tutorService').then(m => m.tutorService.createVisit(...args)) }
    : visitsService;

  const fetchVisitsByPractice = useCallback(async (practiceId: number, includeInactive?: boolean) => {
    setLoading(true);
    setError(null);
    try {
      const response = await svc.getVisitsByPractice(practiceId, includeInactive);
      if (response.success) {
        setVisits(response.data);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || TOAST.loadError().message;
      setError(errorMessage);
      addToast({ ...TOAST.loadError(), message: errorMessage });
    } finally {
      setLoading(false);
    }
  }, [tutorMode]);

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
      const errorMessage = err.response?.data?.message || TOAST.loadError().message;
      setError(errorMessage);
      addToast({ ...TOAST.loadError(), message: errorMessage });
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
      const errorMessage = err.response?.data?.message || TOAST.loadError().message;
      setError(errorMessage);
      addToast({ ...TOAST.loadError(), message: errorMessage });
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const createVisit = useCallback(async (payload: CreateVisitPayload): Promise<Visit | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await svc.createVisit(payload);
      if (response.success) {
        addToast(TOAST.created(resourceName));
        setVisits(prev => [response.data, ...prev]);
        return response.data;
      }
      return null;
    } catch (err: any) {
      const serverMsg = err.response?.data?.message;
      const errorMessage = serverMsg || TOAST.createError(resourceName).message;
      setError(errorMessage);
      addToast(serverMsg ? { ...TOAST.createError(resourceName), message: serverMsg } : TOAST.createError(resourceName));
      return null;
    } finally {
      setLoading(false);
    }
  }, [tutorMode]);

  const updateVisit = useCallback(async (id: number, payload: UpdateVisitPayload): Promise<Visit | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await visitsService.updateVisit(id, payload);
      if (response.success) {
        addToast(TOAST.updated(resourceName));
        setVisits(prev => prev.map(v => v.visitId === id ? response.data : v));
        return response.data;
      }
      return null;
    } catch (err: any) {
      const serverMsg = err.response?.data?.message;
      const errorMessage = serverMsg || TOAST.updateError(resourceName).message;
      setError(errorMessage);
      addToast(serverMsg ? { ...TOAST.updateError(resourceName), message: serverMsg } : TOAST.updateError(resourceName));
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
        addToast(TOAST.deleted(resourceName));
        setVisits(prev => prev.map(v => v.visitId === id ? { ...v, status: false } : v));
        return true;
      }
      return false;
    } catch (err: any) {
      const serverMsg = err.response?.data?.message;
      const errorMessage = serverMsg || TOAST.deleteError(resourceName).message;
      setError(errorMessage);
      addToast(serverMsg ? { ...TOAST.deleteError(resourceName), message: serverMsg } : TOAST.deleteError(resourceName));
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
        addToast(TOAST.restored(resourceName));
        setVisits(prev => prev.map(v => v.visitId === id ? { ...v, status: true } : v));
        return true;
      }
      return false;
    } catch (err: any) {
      const serverMsg = err.response?.data?.message;
      const errorMessage = serverMsg || TOAST.restoreError(resourceName).message;
      setError(errorMessage);
      addToast(serverMsg ? { ...TOAST.restoreError(resourceName), message: serverMsg } : TOAST.restoreError(resourceName));
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
