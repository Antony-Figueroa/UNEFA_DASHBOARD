import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { TOAST_SUCCESS, TOAST_ERROR } from '@/components/ui/dialog/DialogConfig';
import { adminRequestsService } from '../services/adminRequestsService';
import type { AdminRequest, RequestStats, PaginationMeta, RequestFilters, UpdateStatusPayload } from '../types';

const resourceName = 'Solicitud';
const DEFAULT_LIMIT = 20;

export const useAdminRequests = () => {
  const [requests, setRequests] = useState<AdminRequest[]>([]);
  const [stats, setStats] = useState<RequestStats>({ total: 0, pending: 0, in_review: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationMeta>({ page: 1, limit: DEFAULT_LIMIT, total: 0, totalPages: 0 });

  const fetchRequests = useCallback(async (filters?: RequestFilters) => {
    setLoading(true);
    setError(null);
    try {
      const result = await adminRequestsService.getAll(filters);
      setStats(result.stats);
      setRequests(result.data);
      setPagination(result.pagination);
      return result;
    } catch (err) {
      console.error('[useAdminRequests] Error fetching requests:', err);
      setError('Error al cargar las solicitudes');
      toast.error(TOAST_ERROR.load(resourceName));
      return { data: [], stats: { total: 0, pending: 0, in_review: 0, approved: 0, rejected: 0 }, pagination: { page: 1, limit: DEFAULT_LIMIT, total: 0, totalPages: 0 } };
    } finally {
      setLoading(false);
    }
  }, []);

  const goToPage = useCallback((page: number) => {
    return page;
  }, []);

  const updateRequestStatus = useCallback(async (id: string, data: UpdateStatusPayload): Promise<boolean> => {
    setSaving(true);
    setError(null);
    try {
      await adminRequestsService.updateStatus(id, data);
      toast.success(TOAST_SUCCESS.updated(resourceName));
      return true;
    } catch (err) {
      const serverMsg = (err as any)?.response?.data?.message || (err as any)?.message || TOAST_ERROR.update(resourceName);
      console.error('[useAdminRequests] Error updating request:', {
        id,
        data,
        serverResponse: (err as any)?.response?.data,
        status: (err as any)?.response?.status
      });
      setError(serverMsg);
      toast.error(serverMsg);
      return false;
    } finally {
      setSaving(false);
    }
  }, []);

  return {
    requests,
    stats,
    loading,
    saving,
    error,
    pagination,
    fetchRequests,
    goToPage,
    updateRequestStatus
  };
};

export default useAdminRequests;
