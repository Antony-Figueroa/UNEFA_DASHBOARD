import { useState, useEffect } from 'react';
import { Modal } from '../../../components/ui/modal';
import InputField from '../../../components/form/input/InputField';
import reportsService, {
  PracticeSearchResult,
  TutorSearchResult,
} from '../services/reportsService';

interface RecordListModalProps {
  isOpen: boolean;
  onClose: () => void;
  recordType: 'practice' | 'tutor';
  documentType?: string;
  onSelect: (item: PracticeSearchResult | TutorSearchResult) => void;
}

const LIMIT = 10;

export function RecordListModal({ isOpen, onClose, recordType, documentType, onSelect }: RecordListModalProps) {
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState('');
  const [records, setRecords] = useState<(PracticeSearchResult | TutorSearchResult)[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setPage(0);
      setQuery('');
      setSearchInput('');
      setRecords([]);
      setTotal(0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const fetchRecords = async () => {
      setLoading(true);
      try {
        if (recordType === 'practice') {
          const res = await reportsService.listPractices(page, LIMIT, query, documentType);
          setRecords(res.data);
          setTotal(res.meta.total);
        } else {
          const res = await reportsService.listTutors(page, LIMIT, query);
          setRecords(res.data);
          setTotal(res.meta.total);
        }
      } catch {
        setRecords([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    };
    fetchRecords();
  }, [isOpen, page, query, recordType]);

  const handleSearch = () => {
    setQuery(searchInput);
    setPage(0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));
  const currentPageLabel = page + 1;

  const isPractice = recordType === 'practice';

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="3xl">
      <div className="p-6 space-y-4">
        <div>
          <h3 className="text-lg font-bold text-text-primary dark:text-text-emphasis">
            {isPractice ? 'Explorar Prácticas' : 'Explorar Tutores'}
          </h3>
          <p className="text-sm text-text-tertiary mt-1">
            Seleccioná un registro de la lista para completar el ID automáticamente
          </p>
        </div>

        <div className="flex gap-2">
          <div className="flex-1">
            <InputField
              placeholder={isPractice ? 'Buscar por CI o nombre del estudiante...' : 'Buscar por CI o nombre del tutor...'}
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleKeyDown}
              autoComplete="off"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors text-sm font-medium"
          >
            Buscar
          </button>
        </div>

        {loading && (
          <div className="flex justify-center py-8">
            <div className="animate-spin h-6 w-6 border-2 border-brand-500 border-t-transparent rounded-full" />
          </div>
        )}

        {!loading && records.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-text-tertiary">No se encontraron registros</p>
          </div>
        )}

        {!loading && records.length > 0 && (
          <>
            <div className="overflow-x-auto rounded-lg border border-border-default dark:border-border-dark">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-white/5 border-b border-border-default dark:border-border-dark">
                    {isPractice ? (
                      <>
                        <th className="text-left px-4 py-2.5 font-semibold text-text-primary dark:text-text-emphasis">Estudiante</th>
                        <th className="text-left px-4 py-2.5 font-semibold text-text-primary dark:text-text-emphasis">CI</th>
                        <th className="text-left px-4 py-2.5 font-semibold text-text-primary dark:text-text-emphasis">Carrera</th>
                        <th className="text-left px-4 py-2.5 font-semibold text-text-primary dark:text-text-emphasis hidden md:table-cell">Institución</th>
                        <th className="text-left px-4 py-2.5 font-semibold text-text-primary dark:text-text-emphasis hidden md:table-cell">Periodo</th>
                        <th className="text-left px-4 py-2.5 font-semibold text-text-primary dark:text-text-emphasis hidden md:table-cell">Estado</th>
                      </>
                    ) : (
                      <>
                        <th className="text-left px-4 py-2.5 font-semibold text-text-primary dark:text-text-emphasis">Nombre</th>
                        <th className="text-left px-4 py-2.5 font-semibold text-text-primary dark:text-text-emphasis">CI</th>
                        <th className="text-left px-4 py-2.5 font-semibold text-text-primary dark:text-text-emphasis">Email</th>
                        <th className="text-left px-4 py-2.5 font-semibold text-text-primary dark:text-text-emphasis hidden md:table-cell">Carreras</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {records.map((item: any) => (
                    <tr
                      key={isPractice ? item.practiceId : item.tutorId}
                      onClick={() => onSelect(item)}
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 border-b border-border-default dark:border-border-dark last:border-b-0 transition-colors"
                    >
                      {isPractice ? (
                        <>
                          <td className="px-4 py-3 text-text-primary">{item.studentName}</td>
                          <td className="px-4 py-3 text-text-secondary">{item.studentCi}</td>
                          <td className="px-4 py-3 text-text-secondary">{item.careerName}</td>
                          <td className="px-4 py-3 text-text-secondary hidden md:table-cell">{item.institutionName || '-'}</td>
                          <td className="px-4 py-3 text-text-secondary hidden md:table-cell">{item.period || '-'}</td>
                          <td className="px-4 py-3 text-text-secondary hidden md:table-cell">
                            <span className={`text-xs font-medium ${
                              item.status === 1 ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'
                            }`}>
                              {item.status === 1 ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3 text-text-primary">{item.fullName}</td>
                          <td className="px-4 py-3 text-text-secondary">{item.ci}</td>
                          <td className="px-4 py-3 text-text-secondary">{item.email}</td>
                          <td className="px-4 py-3 text-text-secondary hidden md:table-cell">{item.careers || '-'}</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-text-tertiary">
                {total} registro{total !== 1 ? 's' : ''} — Página {currentPageLabel} de {totalPages}
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-3 py-1.5 text-sm rounded-lg border border-border-default dark:border-border-dark disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  ←
                </button>

                {/* Page numbers */}
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  // Window logic: show pages around current, with first+last
                  let pageNum: number;
                  if (totalPages <= 7) {
                    pageNum = i;
                  } else if (page < 4) {
                    pageNum = i;
                  } else if (page > totalPages - 5) {
                    pageNum = totalPages - 7 + i;
                  } else {
                    pageNum = page - 3 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-8 h-8 text-sm rounded-lg transition-colors ${
                        pageNum === page
                          ? 'bg-brand-500 text-white font-semibold'
                          : 'hover:bg-gray-50 dark:hover:bg-white/5 border border-border-default dark:border-border-dark'
                      }`}
                    >
                      {pageNum + 1}
                    </button>
                  );
                })}

                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= totalPages - 1}
                  className="px-3 py-1.5 text-sm rounded-lg border border-border-default dark:border-border-dark disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  →
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}

export default RecordListModal;