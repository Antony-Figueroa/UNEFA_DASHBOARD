import apiClient from "../../../api/apiClient";
import { List, ListsDictionary } from "../types";

const API_URL = "/lists";

/**
 * Obtiene todas las listas con sus valores.
 */
export const getAllLists = async (): Promise<List[]> => {
  const response = await apiClient.get<List[]>(API_URL);
  return response.data;
};

/**
 * Obtiene una lista específica por su nombre.
 */
export const getListByName = async (name: string): Promise<List> => {
  const response = await apiClient.get<List>(`${API_URL}/${name}`);
  return response.data;
};

/**
 * Obtiene múltiples listas por sus nombres.
 */
export const getMultipleListsByNames = async (names: string[]): Promise<ListsDictionary> => {
  const response = await apiClient.post<ListsDictionary>(`${API_URL}/multiple`, { names });
  return response.data;
};

/**
 * Crea una nueva lista.
 */
export const createList = async (name: string): Promise<List> => {
  const response = await apiClient.post<List>(API_URL, { name });
  return response.data;
};

/**
 * Actualiza una lista existente.
 */
export const updateList = async (id: string, name: string): Promise<List> => {
  const response = await apiClient.put<List>(`${API_URL}/${id}`, { name });
  return response.data;
};

/**
 * Cambia el estado de una lista.
 */
export const toggleListStatus = async (id: string, status: boolean): Promise<void> => {
  await apiClient.patch(`${API_URL}/${id}/status`, { status });
};

/**
 * Crea un nuevo valor para una lista.
 */
export const createValue = async (listId: string, name: string, abbreviation?: string): Promise<List['values'][0]> => {
  const response = await apiClient.post<List['values'][0]>(`${API_URL}/values`, { listId, name, abbreviation });
  return response.data;
};

/**
 * Actualiza un valor existente.
 */
export const updateValue = async (id: string, name: string, abbreviation?: string): Promise<List['values'][0]> => {
  const response = await apiClient.put<List['values'][0]>(`${API_URL}/values/${id}`, { name, abbreviation });
  return response.data;
};

/**
 * Cambia el estado de un valor.
 */
export const toggleValueStatus = async (id: string, status: boolean): Promise<void> => {
  await apiClient.patch(`${API_URL}/values/${id}/status`, { status });
};

/**
 * Elimina una lista.
 */
export const deleteList = async (id: string): Promise<void> => {
  await apiClient.delete(`${API_URL}/${id}`);
};

/**
 * Elimina un valor de una lista.
 */
export const deleteValue = async (id: string): Promise<void> => {
  await apiClient.delete(`${API_URL}/values/${id}`);
};
