interface Internship {
  status?: string;
  institutionName?: string;
  period?: string;
  startDate?: string;
  endDate?: string;
  tutorName?: string;
  totalHours?: number;
  requiredHours?: number;
}

interface StudentInternshipWidgetProps {
  internship: Internship | null;
  loading: boolean;
}

const statusBadge: Record<string, string> = {
  active: 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400',
  'pre-enrolled': 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400',
  completed: 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400',
  suspended: 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400',
};

const StudentInternshipWidget = ({ internship, loading }: StudentInternshipWidgetProps) => {
  return (
    <div className="rounded-2xl border border-border-light bg-white p-5 shadow-sm dark:border-border-dark dark:bg-gray-900">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
        Datos de Pasantía
      </h3>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-5 w-full bg-gray-200 dark:bg-gray-700 rounded" />
          ))}
        </div>
      ) : !internship ? (
        <div className="text-center py-6">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <p className="text-sm text-gray-500 dark:text-gray-400">No tenés una pasantía activa</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400">Estado</span>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadge[internship.status ?? ''] ?? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
              {internship.status ?? 'Desconocido'}
            </span>
          </div>

          <InfoRow label="Institución" value={internship.institutionName ?? '-'} />
          <InfoRow label="Período" value={internship.period ?? '-'} />
          <InfoRow
            label="Duración"
            value={
              internship.startDate && internship.endDate
                ? `${new Date(internship.startDate).toLocaleDateString()} - ${new Date(internship.endDate).toLocaleDateString()}`
                : '-'
            }
          />
          <InfoRow label="Tutor" value={internship.tutorName ?? '-'} />
          <InfoRow
            label="Horas"
            value={
              internship.totalHours != null && internship.requiredHours != null
                ? `${internship.totalHours} / ${internship.requiredHours}h`
                : '-'
            }
          />
        </div>
      )}
    </div>
  );
};

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between">
    <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
    <span className="text-sm font-medium text-gray-800 dark:text-white/90 text-right max-w-[60%] truncate">
      {value}
    </span>
  </div>
);

export default StudentInternshipWidget;
