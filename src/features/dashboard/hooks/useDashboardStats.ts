import { useState, useEffect } from "react";
import { DashboardStats } from "../types";
import { getDashboardStats } from "../services/dashboardService";

export const useDashboardStats = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStats = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await getDashboardStats();
      setStats(data);
      setError(null);
    } catch (err: any) {
      console.error("Error fetching dashboard stats:", err);
      // Extraer mensaje de error del backend si existe
      const errorMessage = err.response?.data?.message || 
                          err.message || 
                          "Error de conexión con el servidor";
      setError(errorMessage);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    // Polling cada 30 segundos para "tiempo real"
    const interval = setInterval(() => {
      fetchStats(true);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return { stats, loading, error, refresh: fetchStats };
};

