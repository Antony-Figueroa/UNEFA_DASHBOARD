/**
 * @file PreEnrollTimeoutWarning component
 * @description D-03: Shows a warning banner when there are PRE_INSCRITO practices
 * approaching or past the auto-cancel timeout. Allows admin to preview and execute
 * the timeout check.
 */

import { useState, useEffect } from 'react';
import { getTimeoutPreview, executeTimeoutCheck, type TimeoutPreviewPractice } from '../services/periodService';
import toast from 'react-hot-toast';

interface PreEnrollTimeoutWarningProps {
  /** Timeout threshold in days. Default: 30 */
  timeoutDays?: number;
  /** Called after a successful timeout execution */
  onTimeoutExecuted?: (cancelledCount: number) => void;
}

export const PreEnrollTimeoutWarning = ({
  timeoutDays = 30,
  onTimeoutExecuted,
}: PreEnrollTimeoutWarningProps) => {
  const [preview, setPreview] = useState<TimeoutPreviewPractice[]>([]);
  const [wouldCancel, setWouldCancel] = useState(0);
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const fetchPreview = async () => {
    setLoading(true);
    try {
      const result = await getTimeoutPreview(timeoutDays);
      setPreview(result.practices);
      setWouldCancel(result.wouldCancel);
    } catch {
      // Silently fail — this is a non-critical preview
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPreview();
  }, [timeoutDays]);

  const handleExecute = async () => {
    setExecuting(true);
    try {
      const result = await executeTimeoutCheck(timeoutDays);
      toast.success(result.message || `${result.cancelled} pre-inscripción(es) auto-cancelada(s)`);
      setPreview([]);
      setWouldCancel(0);
      setShowDetails(false);
      onTimeoutExecuted?.(result.cancelled);
    } catch {
      toast.error('Error al ejecutar verificación de timeout');
    } finally {
      setExecuting(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4 text-sm text-[var(--color-text-secondary)]">
        Verificando pre-inscripciones pendientes...
      </div>
    );
  }

  if (wouldCancel === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-950/30">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <svg className="h-5 w-5 text-amber-600 dark:text-amber-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200">
            Pre-inscripciones pendientes por timeout
          </h3>
          <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
            Hay {wouldCancel} pre-inscripción(es) con más de {timeoutDays} días sin convertir en inscripción.
            Serán auto-canceladas (marcadas como Retirado) si ejecuta la verificación.
          </p>

          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-sm font-medium text-amber-800 underline hover:text-amber-900 dark:text-amber-200 dark:hover:text-amber-100"
            >
              {showDetails ? 'Ocultar detalles' : 'Ver detalles'}
            </button>
            <button
              onClick={handleExecute}
              disabled={executing}
              className="rounded-md bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50 dark:bg-amber-500 dark:hover:bg-amber-600"
            >
              {executing ? 'Ejecutando...' : 'Ejecutar verificación'}
            </button>
          </div>

          {showDetails && preview.length > 0 && (
            <div className="mt-3 overflow-hidden rounded-md border border-amber-200 dark:border-amber-700">
              <table className="min-w-full text-sm">
                <thead className="bg-amber-100 dark:bg-amber-900/50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-amber-800 dark:text-amber-200">Estudiante</th>
                    <th className="px-3 py-2 text-left font-medium text-amber-800 dark:text-amber-200">CI</th>
                    <th className="px-3 py-2 text-left font-medium text-amber-800 dark:text-amber-200">Carrera</th>
                    <th className="px-3 py-2 text-right font-medium text-amber-800 dark:text-amber-200">Días</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-200 dark:divide-amber-700">
                  {preview.map((p) => (
                    <tr key={p.practiceId} className="bg-amber-50 dark:bg-amber-950/20">
                      <td className="px-3 py-2 text-amber-900 dark:text-amber-100">{p.studentName}</td>
                      <td className="px-3 py-2 text-amber-700 dark:text-amber-300">{p.studentCi}</td>
                      <td className="px-3 py-2 text-amber-700 dark:text-amber-300">{p.careerName}</td>
                      <td className="px-3 py-2 text-right text-amber-700 dark:text-amber-300">{p.daysSinceCreation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
