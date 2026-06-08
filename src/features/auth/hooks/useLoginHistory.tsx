import { useState, useEffect } from "react";
import apiClient from "../../../api/apiClient";

interface LoginRecord {
  ID: number;
  USER_ID: number;
  ACTION: string;
  USER_AGENT: string;
  CREATED_AT: string;
}

export function useLoginHistory() {
  const [records, setRecords] = useState<LoginRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await apiClient.get('/auth/login-history');
        if (response.data.success) setRecords(response.data.data);
      } catch (error) {
        console.error('Error fetching login history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  return { records, loading };
}
