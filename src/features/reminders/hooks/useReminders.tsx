import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { ReminderRule } from '../types';
import { reminderService } from '../services/reminderService';

export const useReminders = () => {
  const [rules, setRules] = useState<ReminderRule[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRules = useCallback(async () => {
    setLoading(true);
    try {
      const data = await reminderService.getAll();
      setRules(data);
    } catch (error: any) {
      toast.error('Error al cargar reglas de recordatorios');
      console.error('[useReminders] Error fetching rules:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const toggleRule = async (id: string) => {
    try {
      const updated = await reminderService.toggle(id);
      setRules(updated);
      const rule = updated.find(r => r.id === id);
      toast.success(rule?.active ? 'Recordatorio activado' : 'Recordatorio desactivado');
    } catch (error: any) {
      toast.error('Error al cambiar estado');
    }
  };

  const createRule = async (rule: Omit<ReminderRule, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const updated = await reminderService.create(rule);
      setRules(updated);
      toast.success('Recordatorio creado');
    } catch (error: any) {
      toast.error('Error al crear recordatorio');
    }
  };

  const updateRule = async (id: string, updates: Partial<ReminderRule>) => {
    try {
      const updated = await reminderService.update(id, updates);
      setRules(updated);
      toast.success('Recordatorio actualizado');
    } catch (error: any) {
      toast.error('Error al actualizar recordatorio');
    }
  };

  const deleteRule = async (id: string) => {
    try {
      const updated = await reminderService.remove(id);
      setRules(updated);
      toast.success('Recordatorio eliminado');
    } catch (error: any) {
      toast.error('Error al eliminar recordatorio');
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
