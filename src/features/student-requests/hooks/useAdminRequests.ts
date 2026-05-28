import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { adminRequestsService } from '../services/adminRequestsService';
import type { AdminRequest, RequestStats, RequestFilters, UpdateStatusPayload } from '../types';

export const useAdminRequests = () => {
  const [requests, setRequests] = useState<AdminRequest[]>([]);
  const [stats, setStats] = useState<RequestStats>({ total: 0, pending: 0, in_review: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = useCallback(async (filters?: RequestFilters) => {
    setLoading(true);
    setError(null);
    try {
      const result = await adminRequestsService.getAll(filters);
      setRequests(result.data);
      setStats(result.stats);
      return result;
    } catch (err) {
      console.error('[useAdminRequests] Error fetching requests:', err);
      setError('Error al cargar las solicitudes');
      toast.error('Error al cargar las solicitudes');
      return { data: [], stats: { total: 0, pending: 0, in_review: 0, approved: 0, rejected: 0 } };
    } finally {
      setLoading(false);
    }
  }, []);

  const updateRequestStatus = useCallback(async (id: string, data: UpdateStatusPayload): Promise<boolean> => {
    setSaving(true);
    setError(null);
    try {
      await adminRequestsService.updateStatus(id, data);
      toast.success('Solicitud actualizada exitosamente');
      return true;
    } catch (err) {
      console.error('[useAdminRequests] Error updating request:', err);
      setError('Error al actualizar la solicitud');
      toast.error('Error al actualizar la solicitud');
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
    fetchRequests,
    updateRequestStatus
  };
};

export default useAdminRequests;
