import { useState, useCallback } from 'react';
import studentService from '../services/studentService';
import type { 
  DashboardData, 
  StudentProfile, 
  StudentRequest, 
  RequestType,
  CreateRequestPayload 
} from '../types';
import toast from 'react-hot-toast';

export const useStudent = () => {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [requests, setRequests] = useState<StudentRequest[]>([]);
  const [requestTypes, setRequestTypes] = useState<RequestType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await studentService.getDashboard();
      setDashboard(data);
      return data;
    } catch (err) {
      console.error('[useStudent] Error fetching dashboard:', err);
      setError('Error al cargar el dashboard');
      toast.error('Error al cargar el dashboard');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await studentService.getProfile();
      setProfile(data);
      return data;
    } catch (err) {
      console.error('[useStudent] Error fetching profile:', err);
      setError('Error al cargar el perfil');
      toast.error('Error al cargar el perfil');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await studentService.getRequests();
      setRequests(data);
      return data;
    } catch (err) {
      console.error('[useStudent] Error fetching requests:', err);
      setError('Error al cargar las solicitudes');
      toast.error('Error al cargar las solicitudes');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchRequestTypes = useCallback(async () => {
    try {
      const data = await studentService.getRequestTypes();
      setRequestTypes(data);
      return data;
    } catch (err) {
      console.error('[useStudent] Error fetching request types:', err);
      return [];
    }
  }, []);

  const createRequest = useCallback(async (payload: CreateRequestPayload): Promise<boolean> => {
    setLoading(true);
    try {
      await studentService.createRequest(payload);
      toast.success('Solicitud enviada exitosamente');
      await fetchRequests();
      return true;
    } catch (err) {
      console.error('[useStudent] Error creating request:', err);
      toast.error('Error al enviar la solicitud');
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchRequests]);

  return {
    dashboard,
    profile,
    requests,
    requestTypes,
    loading,
    error,
    fetchDashboard,
    fetchProfile,
    fetchRequests,
    fetchRequestTypes,
    createRequest
  };
};
