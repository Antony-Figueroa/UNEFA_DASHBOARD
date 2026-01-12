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
