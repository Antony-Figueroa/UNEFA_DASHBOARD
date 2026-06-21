import { useState, useEffect } from 'react';
import studentService from '../services/studentService';
import type { StudentTrackingData } from '../types';

export function useStudentTracking() {
  const [data, setData] = useState<StudentTrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await studentService.getTracking();
      setData(result);
    } catch (err) {
      setError('Error al cargar datos de seguimiento');
      console.error('[useStudentTracking] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  return { data, loading, error, refetch: fetchData };
}
