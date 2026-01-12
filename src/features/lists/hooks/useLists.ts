import { useState, useCallback } from "react";
import * as listsService from "../services/listsService";
import { List, ListsDictionary } from "../types";

export const useLists = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchAllLists = useCallback(async (): Promise<List[]> => {
    setLoading(true);
    setError(null);
    try {
      return await listsService.getAllLists();
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Error fetching lists"));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchListByName = useCallback(async (name: string): Promise<List> => {
    setLoading(true);
    setError(null);
    try {
      return await listsService.getListByName(name);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(`Error fetching list ${name}`));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMultipleLists = useCallback(async (names: string[]): Promise<ListsDictionary> => {
    setLoading(true);
    setError(null);
    try {
      return await listsService.getMultipleListsByNames(names);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Error fetching multiple lists"));
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    fetchAllLists,
    fetchListByName,
    fetchMultipleLists
  };
};
