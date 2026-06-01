import { PracticeSearchResult, TutorSearchResult } from '../services/reportsService';

interface SelectionSummaryProps {
  type: 'practice' | 'tutor';
  data: PracticeSearchResult | TutorSearchResult;
  onChange: () => void;
}

export function SelectionSummary({ type, data, onChange }: SelectionSummaryProps) {
  const isPractice = type === 'practice';
  const d = data as any;

  return (
    <div className="bg-brand-50/50 dark:bg-brand-500/10 rounded-lg p-4 border border-brand-200 dark:border-brand-800">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
            {isPractice ? 'Práctica seleccionada' : 'Tutor seleccionado'}
          </p>
          <p className="text-sm font-semibold text-text-primary dark:text-text-emphasis mt-1 truncate">
            {isPractice ? d.studentName : d.fullName}
          </p>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
            <span className="text-xs text-text-tertiary">
              CI: {isPractice ? d.studentCi : d.ci}
            </span>
            {isPractice && d.careerName && (
              <span className="text-xs text-text-tertiary">· {d.careerName}</span>
            )}
            {!isPractice && d.careers && (
              <span className="text-xs text-text-tertiary">· {d.careers}</span>
            )}
          </div>
          {isPractice && (
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
              {d.institutionName && (
                <span className="text-xs text-text-tertiary">{d.institutionName}</span>
              )}
              {d.status !== undefined && (
                <span className={`text-xs font-medium ${
                  d.status === 1 ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'
                }`}>
                  {d.status === 1 ? 'Activo' : 'Inactivo'}
                </span>
              )}
              {d.period && (
                <span className="text-xs text-text-tertiary">· {d.period}</span>
              )}
            </div>
          )}
          {!isPractice && (
            <p className="text-xs text-text-tertiary mt-0.5">{d.email}</p>
          )}
          <p className="text-xs text-text-tertiary mt-1">
            ID: {isPractice ? d.practiceId : d.tutorId}
          </p>
        </div>
        <button
          onClick={onChange}
          className="shrink-0 text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline"
        >
          Cambiar
        </button>
      </div>
    </div>
  );
}

export default SelectionSummary;