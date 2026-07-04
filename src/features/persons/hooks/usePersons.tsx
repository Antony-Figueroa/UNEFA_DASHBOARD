import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/context/toast';
import { TOAST } from '@/components/ui/dialog/DialogConfig';
import { Persona } from '../../types/person';
import { personService } from '../services/personService';
import { CreatePersonPayload, UpdatePersonPayload } from '../types';

const resourceName = 'Persona';

export const usePersons = (page = 1, limit = 20, filters?: { status?: number; search?: string }) => {
  const [persons, setPersons] = useState<Persona[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState(false);
  const { addToast } = useToast();

  const fetchPersons = useCallback(async () => {
    setStatus('loading');
    try {
      const result = await personService.getAll(page, limit, filters);
      setPersons(result.persons);
      setTotalCount(result.totalCount);
      setTotalPages(result.totalPages);
      setStatus('success');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar personas');
      setStatus('error');
    }
  }, [page, limit, filters]);

  useEffect(() => {
    fetchPersons();
  }, [fetchPersons]);

  const addPerson = async (data: CreatePersonPayload) => {
    setLoadingAction(true);
    try {
      const newPerson = await personService.create(data);
      setPersons(prev => [newPerson, ...prev]);
      addToast(TOAST.created(resourceName));
      return newPerson;
    } catch (err: any) {
      const serverMsg = err.response?.data?.message;
      addToast(serverMsg ? { ...TOAST.createError(resourceName), message: serverMsg } : TOAST.createError(resourceName));
      throw err;
    } finally {
      setLoadingAction(false);
    }
  };

  const editPerson = async (data: UpdatePersonPayload) => {
    setLoadingAction(true);
    try {
      const updated = await personService.update(data.personId, data);
      setPersons(prev => prev.map(p => (Number(p.personId) === data.personId ? updated : p)));
      addToast(TOAST.updated(resourceName));
      return updated;
    } catch (err: any) {
      const serverMsg = err.response?.data?.message;
      addToast(serverMsg ? { ...TOAST.updateError(resourceName), message: serverMsg } : TOAST.updateError(resourceName));
      throw err;
    } finally {
      setLoadingAction(false);
    }
  };

  const togglePersonStatus = async (personId: number) => {
    setLoadingAction(true);
    try {
      await personService.toggleStatus(personId);
      setPersons(prev =>
        prev.map(p =>
          Number(p.personId) === personId ? { ...p, status: !p.status } : p
        )
      );
      addToast(TOAST.updated(resourceName));
    } catch (err: any) {
      const serverMsg = err.response?.data?.message;
      addToast(serverMsg ? { ...TOAST.updateError(resourceName), message: serverMsg } : TOAST.updateError(resourceName));
      throw err;
    } finally {
      setLoadingAction(false);
    }
  };

  return {
    persons,
    totalCount,
    totalPages,
    status,
    error,
    loadingAction,
    refresh: fetchPersons,
    addPerson,
    editPerson,
    togglePersonStatus,
  };
};
