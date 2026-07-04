import { useState, useCallback } from "react";
import { useToast } from "@/context/toast";
import { TOAST } from "@/components/ui/dialog/DialogConfig";
import { prospectsService } from "../services/prospectsService";
import {
  ProspectList,
  ProspectListItem,
  EligibleStudent,
  CreateProspectListPayload,
  UpdateProspectListPayload,
} from "../types";

const resourceName = 'Lista de prospectos';

export const useProspectLists = () => {
  const { addToast } = useToast();
  const [lists, setLists] = useState<ProspectList[]>([]);
  const [currentList, setCurrentList] = useState<ProspectList | null>(null);
  const [items, setItems] = useState<ProspectListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [dirty, setDirty] = useState(false);

  const fetchLists = useCallback(async () => {
    setLoading(true);
    try {
      const data = await prospectsService.getLists();
      setLists(data);
    } catch (error: any) {
      const message = error.response?.data?.message || TOAST.loadError().message;
      addToast({ ...TOAST.loadError(), message });
      console.error("[useProspectLists] Error fetching lists:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const selectList = useCallback(async (id: number) => {
    setLoading(true);
    try {
      const [listData, itemsData] = await Promise.all([
        prospectsService.getListById(id),
        prospectsService.getListItems(id),
      ]);
      setCurrentList(listData);
      setItems(itemsData);
      setDirty(false);
    } catch (error: any) {
      const message = error.response?.data?.message || TOAST.loadError().message;
      addToast({ ...TOAST.loadError(), message });
      console.error("[useProspectLists] Error selecting list:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createList = useCallback(async (data: CreateProspectListPayload): Promise<ProspectList | null> => {
    setLoading(true);
    try {
      const newList = await prospectsService.createList(data);
      setLists(prev => [...prev, newList]);
      setCurrentList(newList);
      setItems([]);
      setDirty(false);
      addToast(TOAST.created(resourceName));
      return newList;
    } catch (error: any) {
      const message = error.response?.data?.message || TOAST.createError(resourceName).message;
      addToast(message ? { ...TOAST.createError(resourceName), message } : TOAST.createError(resourceName));
      console.error("[useProspectLists] Error creating list:", error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateList = useCallback(async (id: number, data: UpdateProspectListPayload) => {
    try {
      const updated = await prospectsService.updateList(id, data);
      setCurrentList(updated);
      setLists(prev => prev.map(l => l.listId === id ? updated : l));
      setDirty(false);
      addToast(TOAST.updated(resourceName));
    } catch (error: any) {
      const message = error.response?.data?.message || TOAST.updateError(resourceName).message;
      addToast(message ? { ...TOAST.updateError(resourceName), message } : TOAST.updateError(resourceName));
      console.error("[useProspectLists] Error updating list:", error);
      throw error;
    }
  }, []);

  const deleteList = useCallback(async (id: number) => {
    try {
      await prospectsService.deleteList(id);
      setLists(prev => prev.filter(l => l.listId !== id));
      if (currentList?.listId === id) {
        setCurrentList(null);
        setItems([]);
      }
      setDirty(false);
      addToast(TOAST.deleted(resourceName));
    } catch (error: any) {
      const message = error.response?.data?.message || TOAST.deleteError(resourceName).message;
      addToast(message ? { ...TOAST.deleteError(resourceName), message } : TOAST.deleteError(resourceName));
      console.error("[useProspectLists] Error deleting list:", error);
      throw error;
    }
  }, [currentList]);

  const addItem = useCallback(async (listId: number, studentsId: number) => {
    const exists = items.some(i => i.studentsId === studentsId);
    if (exists) {
      addToast({ variant: 'error', title: 'Estudiante duplicado', message: 'El estudiante ya está en la lista' });
      return;
    }

    try {
      const newItem = await prospectsService.addListItem(listId, { studentsId });
      setItems(prev => [...prev, newItem]);
      setDirty(true);
      addToast({ variant: 'success', title: 'Estudiante agregado', message: 'Estudiante agregado a la lista' });
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error al agregar estudiante';
      addToast({ variant: 'error', title: 'Error', message });
      console.error("[useProspectLists] Error adding item:", error);
    }
  }, [items]);

  const removeItem = useCallback(async (listId: number, itemId: number) => {
    try {
      await prospectsService.removeListItem(listId, itemId);
      setItems(prev => prev.filter(i => i.itemId !== itemId));
      setDirty(true);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error al eliminar estudiante';
      addToast({ variant: 'error', title: 'Error', message });
      console.error("[useProspectLists] Error removing item:", error);
    }
  }, []);

  const toggleEnrolled = useCallback(async (listId: number, itemId: number) => {
    try {
      const updated = await prospectsService.toggleEnrolled(listId, itemId);
      setItems(prev => prev.map(i => i.itemId === itemId ? updated : i));
      setDirty(true);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Error al cambiar estado de inscripción';
      addToast({ variant: 'error', title: 'Error', message });
      console.error("[useProspectLists] Error toggling enrolled:", error);
    }
  }, []);

  const searchEligibleStudents = useCallback(async (query: string, periodId?: number): Promise<EligibleStudent[]> => {
    try {
      const { data } = await prospectsService.getEligibleStudents({ search: query, periodId, limit: 50 });
      return data;
    } catch (error: any) {
      console.error("[useProspectLists] Error searching eligible students:", error);
      return [];
    }
  }, []);

  const markAsSaved = useCallback(() => {
    setDirty(false);
    addToast({ variant: 'success', title: 'Lista guardada', message: 'Lista guardada exitosamente' });
  }, []);

  return {
    lists,
    currentList,
    items,
    loading,
    dirty,
    fetchLists,
    selectList,
    createList,
    updateList,
    deleteList,
    addItem,
    removeItem,
    toggleEnrolled,
    searchEligibleStudents,
    setDirty,
    markAsSaved,
  };
};
