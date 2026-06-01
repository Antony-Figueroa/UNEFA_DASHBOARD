import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { TOAST_SUCCESS, TOAST_ERROR } from '@/components/ui/dialog/DialogConfig';
import { ReminderRule } from '../types';
import { reminderService } from '../services/reminderService';

const resourceName = 'Recordatorio';

export const useReminders = () => {
  const [rules, setRules] = useState<ReminderRule[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRules = useCallback(async () => {
    setLoading(true);
    try {
      const data = await reminderService.getAll();
      setRules(data);
    } catch (error: any) {
      toast.error(TOAST_ERROR.load(resourceName));
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
      toast.success(TOAST_SUCCESS.statusChanged(resourceName, !!rule?.active));
    } catch (error: any) {
      toast.error(TOAST_ERROR.update(resourceName));
    }
  };

  const createRule = async (rule: Omit<ReminderRule, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const updated = await reminderService.create(rule);
      setRules(updated);
      toast.success(TOAST_SUCCESS.created(resourceName));
    } catch (error: any) {
      toast.error(TOAST_ERROR.create(resourceName));
    }
  };

  const updateRule = async (id: string, updates: Partial<ReminderRule>) => {
    try {
      const updated = await reminderService.update(id, updates);
      setRules(updated);
      toast.success(TOAST_SUCCESS.updated(resourceName));
    } catch (error: any) {
      toast.error(TOAST_ERROR.update(resourceName));
    }
  };

  const deleteRule = async (id: string) => {
    try {
      const updated = await reminderService.remove(id);
      setRules(updated);
      toast.success(TOAST_SUCCESS.deleted(resourceName));
    } catch (error: any) {
      toast.error(TOAST_ERROR.delete(resourceName));
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
