import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { studentRequestsService } from '../services/studentRequestsService';
import type { StudentRequest, RequestType, CreateRequestPayload } from '../types';

export const useStudentRequests = () => {
  const [requests, setRequests] = useState<StudentRequest[]>([]);
  const [requestTypes, setRequestTypes] = useState<RequestType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await studentRequestsService.getRequests();
      setRequests(data);
      return data;
    } catch (err) {
      console.error('[useStudentRequests] Error fetching requests:', err);
      setError('Error al cargar las solicitudes');
      toast.error('Error al cargar las solicitudes');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRequestTypes = useCallback(async () => {
    try {
      const data = await studentRequestsService.getRequestTypes();
      setRequestTypes(data);
      return data;
    } catch (err) {
      console.error('[useStudentRequests] Error fetching request types:', err);
      return [];
    }
  }, []);

  const createRequest = useCallback(async (payload: CreateRequestPayload): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await studentRequestsService.createRequest(payload);
      toast.success('Solicitud enviada exitosamente');
      await fetchRequests();
      return true;
    } catch (err) {
      console.error('[useStudentRequests] Error creating request:', err);
      setError('Error al enviar la solicitud');
      toast.error('Error al enviar la solicitud');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchRequests]);

  return {
    requests,
    requestTypes,
    loading,
    error,
    fetchRequests,
    fetchRequestTypes,
    createRequest
  };
};

export default useStudentRequests;
