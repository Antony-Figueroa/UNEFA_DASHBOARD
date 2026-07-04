import { useState, useCallback } from 'react';
import { useToast } from '@/context/toast';
import { TOAST } from '@/components/ui/dialog/DialogConfig';
import { studentRequestsService } from '../services/studentRequestsService';
import type { StudentRequest, RequestType, CreateRequestPayload } from '../types';

const resourceName = 'Solicitud';

export const useStudentRequests = () => {
  const [requests, setRequests] = useState<StudentRequest[]>([]);
  const [requestTypes, setRequestTypes] = useState<RequestType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToast();

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
      addToast(TOAST.loadError());
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
      addToast(TOAST.created(resourceName));
      await fetchRequests();
      return true;
    } catch (err) {
      console.error('[useStudentRequests] Error creating request:', err);
      const errorMessage = TOAST.createError(resourceName).message;
      setError(errorMessage);
      addToast(TOAST.createError(resourceName));
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
