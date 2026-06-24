import { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../../context/toast';
import { TOAST_TITLES } from '../../../components/ui/dialog/DialogConfig';
import { ReminderRule } from '../types';
import { reminderService } from '../services/reminderService';

const resourceName = 'Recordatorio';

export const useReminders = () => {
  const { addToast } = useToast();
  const [rules, setRules] = useState<ReminderRule[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRules = useCallback(async () => {
    setLoading(true);
    try {
      const data = await reminderService.getAll();
      setRules(data);
    } catch (error: any) {
      addToast({ variant: 'error', title: 'Error', message: `Error al cargar ${resourceName.toLowerCase()}` });
      console.error('[useReminders] Error fetching rules:', error);
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const toggleRule = async (id: string) => {
    try {
      const updated = await reminderService.toggle(id);
      setRules(updated);
      const rule = updated.find(r => r.id === id);
      addToast({ variant: 'success', title: TOAST_TITLES.updated(resourceName), message: `Estado de ${resourceName.toLowerCase()} ${rule?.active ? 'activado' : 'desactivado'} exitosamente` });
    } catch (error: any) {
      addToast({ variant: 'error', title: 'Error', message: `Error al actualizar ${resourceName.toLowerCase()}` });
    }
  };

  const createRule = async (rule: Omit<ReminderRule, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const updated = await reminderService.create(rule);
      setRules(updated);
      addToast({ variant: 'success', title: TOAST_TITLES.created(resourceName), message: `${resourceName} creado exitosamente` });
    } catch (error: any) {
      addToast({ variant: 'error', title: 'Error', message: `Error al crear ${resourceName.toLowerCase()}` });
    }
  };

  const updateRule = async (id: string, updates: Partial<ReminderRule>) => {
    try {
      const updated = await reminderService.update(id, updates);
      setRules(updated);
      addToast({ variant: 'success', title: TOAST_TITLES.updated(resourceName), message: `${resourceName} actualizado exitosamente` });
    } catch (error: any) {
      addToast({ variant: 'error', title: 'Error', message: `Error al actualizar ${resourceName.toLowerCase()}` });
    }
  };

  const deleteRule = async (id: string) => {
    try {
      const updated = await reminderService.remove(id);
      setRules(updated);
      addToast({ variant: 'success', title: TOAST_TITLES.deleted(resourceName), message: `${resourceName} eliminado exitosamente` });
    } catch (error: any) {
      addToast({ variant: 'error', title: 'Error', message: `Error al eliminar ${resourceName.toLowerCase()}` });
    }
  };

  return {
    rules,
    loading,
    refresh: fetchRules,
    toggleRule,
    createRule,
    updateRule,
    deleteRule,
  };
};
