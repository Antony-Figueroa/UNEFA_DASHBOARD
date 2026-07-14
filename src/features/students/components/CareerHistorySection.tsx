/**
 * @file CareerHistorySection.tsx
 * @description Shows a student's career practice history grouped by career.
 * Displays status (approved, failed, withdrawn, justified) for each practice type.
 */

import { useState, useEffect } from "react";
import { getStudentPracticeHistory, PracticeHistoryEntry } from "../../pre-enrollment/services/preEnrollmentService";

interface CareerHistorySectionProps {
  identificationPrefix: string;
  identificationNumber: string;
}

const STATUS_CONFIG: Record<number, { label: string; color: string; bg: string; icon: string }> = {
  0: { label: 'Retirado', color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-100 dark:bg-amber-900/40', icon: '⊘' },
  1: { label: 'Pre-inscrito', color: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-100 dark:bg-blue-900/40', icon: '◯' },
  2: { label: 'Inscrito', color: 'text-indigo-700 dark:text-indigo-300', bg: 'bg-indigo-100 dark:bg-indigo-900/40', icon: '◉' },
  3: { label: 'Aprobada', color: 'text-green-700 dark:text-green-300', bg: 'bg-green-100 dark:bg-green-900/40', icon: '✓' },
  4: { label: 'Reprobada', color: 'text-red-700 dark:text-red-300', bg: 'bg-red-100 dark:bg-red-900/40', icon: '✗' },
  5: { label: 'Retiro Justificado', color: 'text-orange-700 dark:text-orange-300', bg: 'bg-orange-100 dark:bg-orange-900/40', icon: '⊘' },
};

interface CareerGroup {
  careerId: number;
  careerName: string;
  practices: PracticeHistoryEntry[];
}

export default function CareerHistorySection({
  identificationPrefix,
  identificationNumber,
}: CareerHistorySectionProps) {
  const [careerGroups, setCareerGroups] = useState<CareerGroup[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!identificationPrefix || !identificationNumber) return;

    setLoading(true);
    getStudentPracticeHistory(identificationPrefix, identificationNumber)
      .then((history) => {
        // Group by career
        const grouped = new Map<number, CareerGroup>();
        for (const entry of history) {
          if (!grouped.has(entry.careerId)) {
            grouped.set(entry.careerId, {
              careerId: entry.careerId,
              careerName: entry.careerName,
              practices: [],
            });
          }
          grouped.get(entry.careerId)!.practices.push(entry);
        }
        // Sort practices within each career by priority
        const groups = Array.from(grouped.values());
        for (const g of groups) {
          g.practices.sort((a, b) => a.priority - b.priority);
        }
        setCareerGroups(groups);
      })
      .catch(() => setCareerGroups([]))
      .finally(() => setLoading(false));
  }, [identificationPrefix, identificationNumber]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"></div>
        <span className="ml-2 text-xs text-text-tertiary">Cargando historial...</span>
      </div>
    );
  }

  if (careerGroups.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 border-b border-border-light pb-2 dark:border-white/5">
        <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
        <h4 className="font-bold text-text-primary dark:text-white/90 uppercase text-xs tracking-wider">
          Historial de Carreras
        </h4>
        <span className="text-[10px] font-bold text-text-tertiary bg-bg-secondary dark:bg-white/5 px-2 py-0.5 rounded-full">
          {careerGroups.length} carrera{careerGroups.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="space-y-4">
        {careerGroups.map((group) => {
          const hasApproved = group.practices.some(p => p.practicesStatus === 3);
          const hasFailed = group.practices.some(p => p.practicesStatus === 4);
          const hasWithdrawn = group.practices.some(p => p.practicesStatus === 0 || p.practicesStatus === 5);

          // Determine overall career status
          const allApproved = group.practices.every(p => p.practicesStatus === 3);
          const overallStatus = allApproved
            ? { label: 'Completada', color: 'text-green-700 dark:text-green-300', bg: 'bg-green-100 dark:bg-green-900/40' }
            : hasApproved && !hasFailed
              ? { label: 'En progreso', color: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-100 dark:bg-blue-900/40' }
              : hasFailed
                ? { label: 'Con reprobaciones', color: 'text-red-700 dark:text-red-300', bg: 'bg-red-100 dark:bg-red-900/40' }
                : hasWithdrawn
                  ? { label: 'Con retiros', color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-100 dark:bg-amber-900/40' }
                  : { label: 'Sin iniciar', color: 'text-gray-700 dark:text-gray-300', bg: 'bg-gray-100 dark:bg-gray-800/40' };

          return (
            <div
              key={group.careerId}
              className="rounded-xl border border-border-light dark:border-white/10 overflow-hidden"
            >
              {/* Career header */}
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-white/3 border-b border-border-light dark:border-white/5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-text-primary dark:text-white">
                    {group.careerName}
                  </span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${overallStatus.bg} ${overallStatus.color}`}>
                    {overallStatus.label}
                  </span>
                </div>
                <span className="text-[10px] text-text-tertiary">
                  {group.practices.length} práctica{group.practices.length !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Practices list */}
              <div className="divide-y divide-border-light dark:divide-white/5">
                {group.practices.map((practice, idx) => {
                  const config = STATUS_CONFIG[practice.practicesStatus] || {
                    label: `Estado ${practice.practicesStatus}`,
                    color: 'text-gray-700 dark:text-gray-300',
                    bg: 'bg-gray-100 dark:bg-gray-800/40',
                    icon: '?',
                  };

                  return (
                    <div key={idx} className="flex items-center justify-between px-4 py-2.5">
                      <div className="flex items-center gap-3">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${config.bg} ${config.color}`}>
                          {config.icon}
                        </span>
                        <div>
                          <span className="text-xs font-semibold text-text-primary dark:text-white">
                            {practice.practiceType}
                          </span>
                          <span className="ml-2 text-[10px] text-text-tertiary">
                            (Prioridad {practice.priority})
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-text-tertiary">{practice.period}</span>
                        {practice.grade != null && practice.grade > 0 && (
                          <span className={`text-xs font-bold ${
                            practice.grade >= 10 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                          }`}>
                            {practice.grade}
                          </span>
                        )}
                        <span className={`text-[10px] font-bold ${config.color}`}>
                          {config.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
