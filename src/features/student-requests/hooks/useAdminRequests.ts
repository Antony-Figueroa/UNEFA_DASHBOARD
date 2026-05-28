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
      if (filters) {
        // Con filtro: stats completos (sin filtro) + datos filtrados en paralelo
        const [allResult, filteredResult] = await Promise.all([
          adminRequestsService.getAll(),
          adminRequestsService.getAll(filters),
        ]);
        setStats(allResult.stats);
        setRequests(filteredResult.data);
        return filteredResult;
      } else {
        // Sin filtro: una sola llamada
        const result = await adminRequestsService.getAll();
        setStats(result.stats);
        setRequests(result.data);
        return result;
      }
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
      const serverMsg = (err as any)?.response?.data?.message || (err as any)?.message || 'Error al actualizar la solicitud';
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
    fetchRequests,
    updateRequestStatus
  };
};

export default useAdminRequests;
