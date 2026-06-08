import { useState, useEffect } from "react";
import { useAuth } from "../../../context/auth";
import apiClient from "../../../api/apiClient";

interface LoginRecord {
  ID: number;
  USER_ID: number;
  ACTION: string;
  USER_AGENT: string;
  CREATED_AT: string;
}

export const useLoginHistory = () => {
  const { user } = useAuth();
  const [records, setRecords] = useState<LoginRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/auth/login-history");
      if (response.data.success) setRecords(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Error al cargar historial");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchHistory();
  }, [user]);

  return { records, loading, error, refetch: fetchHistory };
};
