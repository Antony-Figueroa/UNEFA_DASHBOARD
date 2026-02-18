import apiClient from "../../../api/apiClient";
import { List, ListsDictionary } from "../types";

const API_URL = "/lists";

/**
 * List service for managing dynamic system lists and their values.
 * Follows the data access layer pattern.
 */

/**
 * Fetches all available lists with their nested values.
 * 
 * @returns Promise with an array of List objects.
 */
export const getAllLists = async (): Promise<List[]> => {
  const response = await apiClient.get<List[]>(API_URL);
  return response.data;
};

/**
 * Fetches a specific list by its name identifier.
 * 
 * @param name - The name of the list to fetch.
 * @returns Promise with the List object.
 */
export const getListByName = async (name: string): Promise<List> => {
  const response = await apiClient.get<List>(`${API_URL}/${name}`);
  return response.data;
};

/**
 * Fetches multiple lists in a single request by their names.
 * 
 * @param names - Array of list names to fetch.
 * @returns Promise with a dictionary of lists.
 */
export const getMultipleListsByNames = async (names: string[]): Promise<ListsDictionary> => {
  const response = await apiClient.post<ListsDictionary>(`${API_URL}/multiple`, { names });
  return response.data;
};

/**
 * Creates a new empty list.
 * 
 * @param name - The name for the new list.
 * @returns Promise with the created List object.
 */
export const createList = async (name: string): Promise<List> => {
  const response = await apiClient.post<List>(API_URL, { name });
  return response.data;
};

/**
 * Updates an existing list's basic information.
 * 
 * @param id - The unique identifier of the list.
 * @param name - The new name for the list.
 * @returns Promise with the updated List object.
 */
export const updateList = async (id: string, name: string): Promise<List> => {
  const response = await apiClient.put<List>(`${API_URL}/${id}`, { name });
  return response.data;
};

/**
 * Toggles the active status of a list.
 * 
 * @param id - The unique identifier of the list.
 * @param status - The new status to apply.
 */
export const toggleListStatus = async (id: string, status: boolean): Promise<void> => {
  await apiClient.patch(`${API_URL}/${id}/status`, { status });
};

/**
 * Adds a new value entry to a specific list.
 * 
 * @param listId - The ID of the parent list.
 * @param name - The display name for the new value.
 * @param abbreviation - Optional short code for the value.
 * @returns Promise with the created value entry.
 */
export const createValue = async (listId: string, name: string, abbreviation?: string): Promise<List['values'][0]> => {
  const payload: { listId: string; name: string; abbreviation?: string } = { listId, name };
  if (abbreviation !== undefined) payload.abbreviation = abbreviation;
  const response = await apiClient.post<List['values'][0]>(`${API_URL}/values`, payload);
  return response.data;
};

/**
 * Updates an existing list value entry.
 * 
 * @param id - The unique identifier of the value entry.
 * @param name - The new display name.
 * @param abbreviation - Optional new short code.
 * @returns Promise with the updated value entry.
 */
export const updateValue = async (id: string, name: string, abbreviation?: string): Promise<List['values'][0]> => {
  const response = await apiClient.put<List['values'][0]>(`${API_URL}/values/${id}`, { name, abbreviation });
  return response.data;
};

/**
 * Toggles the active status of a specific list value.
 * 
 * @param id - The unique identifier of the value entry.
 * @param status - The new status to apply.
 */
export const toggleValueStatus = async (id: string, status: boolean): Promise<void> => {
  await apiClient.patch(`${API_URL}/values/${id}/status`, { status });
};

/**
 * Deletes an entire list and all its values.
 * 
 * @param id - The unique identifier of the list to delete.
 */
export const deleteList = async (id: string): Promise<void> => {
  await apiClient.delete(`${API_URL}/${id}`);
};

/**
 * Deletes a single value entry from a list.
 * 
 * @param id - The unique identifier of the value to delete.
 */
export const deleteValue = async (id: string): Promise<void> => {
  await apiClient.delete(`${API_URL}/values/${id}`);
};
