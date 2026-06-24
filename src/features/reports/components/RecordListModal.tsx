import { useState, useEffect, useCallback } from 'react';
import { Modal } from '../../../components/ui/modal';
import InputField from '../../../components/form/input/InputField';
import reportsService, {
  PracticeSearchResult,
  TutorSearchResult,
} from '../services/reportsService';
import { prospectsService } from '../../prospectos/services/prospectsService';
import { EligibleStudent } from '../../prospectos/types';

type RecordType = 'practice' | 'tutor' | 'student';

interface RecordListModalProps {
  isOpen: boolean;
  onClose: () => void;
  recordType: RecordType;
  documentType?: string;
  /** Período para filtrar estudiantes elegibles (solo para student) */
  periodId?: number;
  onSelect: (item: PracticeSearchResult | TutorSearchResult | EligibleStudent) => void;
}

const LIMIT = 10;

interface StudentRecord {
  id: number;
  displayName: string;
  ci: string;
  careerName?: string;
  email?: string;
  phone?: string;
}

export function RecordListModal({ isOpen, onClose, recordType, documentType, periodId, onSelect }: RecordListModalProps) {
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState('');
  const [records, setRecords] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState('');

  const isPractice = recordType === 'practice';
  const isStudent = recordType === 'student';

  const title = isPractice ? 'Explorar Prácticas' : isStudent ? 'Explorar Estudiantes' : 'Explorar Tutores';
  const placeholder = isPractice
    ? 'Buscar por CI o nombre del estudiante...'
    : isStudent
      ? 'Buscar por CI o nombre del estudiante...'
      : 'Buscar por CI o nombre del tutor...';

  const fetchFn = useCallback(async (p: number, q: string) => {
    if (recordType === 'practice') {
      return reportsService.listPractices(p, LIMIT, q, documentType);
    } else if (recordType === 'student') {
      const { data, total } = await prospectsService.getEligibleStudents({ search: q, periodId, page: p, limit: LIMIT });
      return { data, meta: { total } };
    } else {
      return reportsService.listTutors(p, LIMIT, q);
    }
  }, [recordType, documentType, periodId]);

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
        const res = await fetchFn(page, query);
        setRecords(res.data || []);
        setTotal(res.meta?.total || 0);
      } catch {
        setRecords([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    };
    fetchRecords();
  }, [isOpen, page, query, fetchFn]);

  const handleSearch = () => {
    setQuery(searchInput);
    setPage(0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const totalPages = Math.max(1, Math.ceil(total / LIMIT));
  const currentPageLabel = page + 1;

  const renderHeaders = () => {
    if (isPractice) {
      return (
        <>
          <th className="text-left px-4 py-2.5 font-semibold text-text-primary dark:text-text-emphasis">Estudiante</th>
          <th className="text-left px-4 py-2.5 font-semibold text-text-primary dark:text-text-emphasis">CI</th>
          <th className="text-left px-4 py-2.5 font-semibold text-text-primary dark:text-text-emphasis">Carrera</th>
          <th className="text-left px-4 py-2.5 font-semibold text-text-primary dark:text-text-emphasis hidden md:table-cell">Institución</th>
          <th className="text-left px-4 py-2.5 font-semibold text-text-primary dark:text-text-emphasis hidden md:table-cell">Periodo</th>
          <th className="text-left px-4 py-2.5 font-semibold text-text-primary dark:text-text-emphasis hidden md:table-cell">Estado</th>
        </>
      );
    }
    if (isStudent) {
      return (
        <>
          <th className="text-left px-4 py-2.5 font-semibold text-text-primary dark:text-text-emphasis">Nombre</th>
          <th className="text-left px-4 py-2.5 font-semibold text-text-primary dark:text-text-emphasis">CI</th>
          <th className="text-left px-4 py-2.5 font-semibold text-text-primary dark:text-text-emphasis">Carrera</th>
          <th className="text-left px-4 py-2.5 font-semibold text-text-primary dark:text-text-emphasis hidden md:table-cell">Correo Electrónico</th>
        </>
      );
    }
    return (
      <>
        <th className="text-left px-4 py-2.5 font-semibold text-text-primary dark:text-text-emphasis">Nombre</th>
        <th className="text-left px-4 py-2.5 font-semibold text-text-primary dark:text-text-emphasis">CI</th>
        <th className="text-left px-4 py-2.5 font-semibold text-text-primary dark:text-text-emphasis">Correo Electrónico</th>
        <th className="text-left px-4 py-2.5 font-semibold text-text-primary dark:text-text-emphasis hidden md:table-cell">Carreras</th>
      </>
    );
  };

  const renderRow = (item: any) => {
    if (isPractice) {
      return (
        <>
          <td className="px-4 py-3 text-text-primary uppercase">{item.studentName}</td>
          <td className="px-4 py-3 text-text-secondary uppercase">{item.studentCi}</td>
          <td className="px-4 py-3 text-text-secondary uppercase">{item.careerName}</td>
          <td className="px-4 py-3 text-text-secondary uppercase hidden md:table-cell">{item.institutionName || '-'}</td>
          <td className="px-4 py-3 text-text-secondary uppercase hidden md:table-cell">{item.period || '-'}</td>
          <td className="px-4 py-3 text-text-secondary hidden md:table-cell">
            <span className={`text-xs font-medium ${
              item.status === 1 ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'
            }`}>
              {item.status === 1 ? 'Activo' : 'Inactivo'}
            </span>
          </td>
        </>
      );
    }
    if (isStudent) {
      return (
        <>
          <td className="px-4 py-3 text-text-primary uppercase">{item.firstName} {item.lastName}</td>
          <td className="px-4 py-3 text-text-secondary uppercase">{item.identificationPrefix}-{item.identificationNumber}</td>
          <td className="px-4 py-3 text-text-secondary uppercase">{item.careerName || '-'}</td>
          <td className="px-4 py-3 text-text-secondary uppercase hidden md:table-cell">{item.email || '-'}</td>
        </>
      );
    }
    return (
      <>
        <td className="px-4 py-3 text-text-primary uppercase">{item.fullName}</td>
        <td className="px-4 py-3 text-text-secondary uppercase">{item.ci}</td>
        <td className="px-4 py-3 text-text-secondary uppercase">{item.email}</td>
        <td className="px-4 py-3 text-text-secondary uppercase hidden md:table-cell">{item.careers || '-'}</td>
      </>
    );
  };

  const getRowKey = (item: any) => {
    if (isPractice) return item.practiceId;
    if (isStudent) return item.studentsId;
    return item.tutorId;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="3xl">
      <div className="p-6 space-y-4">
        <div>
          <h3 className="text-lg font-bold text-text-primary dark:text-text-emphasis">
            {title}
          </h3>
          <p className="text-sm text-text-tertiary mt-1">
            Selecciona un registro de la lista
          </p>
        </div>

        <div className="flex gap-2">
          <div className="flex-1">
            <InputField
              placeholder={placeholder}
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
                    {renderHeaders()}
                  </tr>
                </thead>
                <tbody>
                  {records.map((item: any) => (
                    <tr
                      key={getRowKey(item)}
                      onClick={() => onSelect(item)}
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5 border-b border-border-default dark:border-border-dark last:border-b-0 transition-colors"
                    >
                      {renderRow(item)}
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
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
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