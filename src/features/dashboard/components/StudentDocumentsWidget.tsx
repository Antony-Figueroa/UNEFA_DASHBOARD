interface Document {
  name?: string;
  status?: string;
  uploadedAt?: string;
}

interface StudentDocumentsWidgetProps {
  documents: Document[];
  loading: boolean;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  approved: { label: 'Aprobado', color: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-500/10' },
  pending: { label: 'Pendiente', color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10' },
  rejected: { label: 'Rechazado', color: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10' },
  not_uploaded: { label: 'No subido', color: 'text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800' },
};

const StudentDocumentsWidget = ({ documents, loading }: StudentDocumentsWidgetProps) => {
  const safeDocs = Array.isArray(documents) ? documents.slice(0, 4) : [];

  return (
    <div className="rounded-2xl border border-border-light bg-white p-5 shadow-sm dark:border-border-dark dark:bg-gray-900">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
        Estado de Documentos
      </h3>

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          ))}
        </div>
      ) : safeDocs.length === 0 ? (
        <div className="text-center py-6">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-sm text-gray-500 dark:text-gray-400">Sin documentos disponibles</p>
        </div>
      ) : (
        <div className="space-y-2">
          {safeDocs.map((doc, i) => {
            const statusInfo = STATUS_MAP[doc.status ?? 'not_uploaded'] ?? STATUS_MAP.not_uploaded;
            return (
              <div key={i} className="flex items-center justify-between rounded-lg px-3 py-2 border border-gray-100 dark:border-gray-800">
                <span className="text-sm text-gray-700 dark:text-gray-300 truncate mr-2">
                  {doc.name ?? 'Documento'}
                </span>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${statusInfo.color}`}>
                  {statusInfo.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default StudentDocumentsWidget;
