import { useState, useEffect, useMemo } from 'react';
import PageBreadcrumb from '../../components/common/PageBreadCrumb';
import ComponentCard from '../../components/common/ComponentCard';
import PageMeta from '../../components/common/PageMeta';
import { SkeletonLoader, TitleSkeleton, BreadcrumbSkeleton } from '../../components/ui/skeleton';
import { useEvaluations } from '../../features/evaluations/hooks/useEvaluations';
import { EvaluationModal } from '../../features/evaluations/components/EvaluationModal';
import { EvaluatorType, EVALUATION_WEIGHTS, EvaluationStatus } from '../../features/evaluations/types';
import ErrorBoundary from '../../components/common/ErrorBoundary';
import { CheckCircleIcon, TimeIcon, AlertIcon } from '../../icons';
import apiClient from '../../api/apiClient';
import toast from 'react-hot-toast';

interface PracticeWithStudent {
  professionalPracticeId: number;
  studentCi: string;
  studentName: string;
  institutionName: string;
  evaluationStatus: string;
  grade: number | null;
}

interface ApiPracticeResponse {
  success: boolean;
  data: PracticeWithStudent[];
}

export default function EvaluationsPage() {
  const [pageLoading, setPageLoading] = useState(true);
  const [practices, setPractices] = useState<PracticeWithStudent[]>([]);
  const [practicesLoading, setPracticesLoading] = useState(true);
  const [selectedPractice, setSelectedPractice] = useState<PracticeWithStudent | null>(null);
  const [selectedEvaluatorType, setSelectedEvaluatorType] = useState<EvaluatorType | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [practiceStatuses, setPracticeStatuses] = useState<Record<number, EvaluationStatus>>({});
  const [searchTerm, setSearchTerm] = useState('');

  const { getPracticeStatus } = useEvaluations();

  const fetchPractices = async () => {
    try {
      setPracticesLoading(true);
      const response = await apiClient.get<ApiPracticeResponse>('/enrollments/practices');
      if (response.data.success) {
        setPractices(response.data.data);
      }
    } catch (error) {
      console.error('[EvaluationsPage] Error fetching practices:', error);
      toast.error('Error al cargar prácticas');
    } finally {
      setPracticesLoading(false);
    }
  };

  useEffect(() => {
    fetchPractices();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPageLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (practices.length > 0) {
      practices.forEach(async (practice) => {
        const status = await getPracticeStatus(practice.professionalPracticeId);
        if (status) {
          setPracticeStatuses(prev => ({
            ...prev,
            [practice.professionalPracticeId]: status
          }));
        }
      });
    }
  }, [practices, getPracticeStatus]);

  const filteredPractices = useMemo(() => {
    if (!searchTerm) return practices;
    const term = searchTerm.toLowerCase();
    return practices.filter(p =>
      p.studentName.toLowerCase().includes(term) ||
      p.studentCi.toLowerCase().includes(term) ||
      p.institutionName.toLowerCase().includes(term)
    );
  }, [practices, searchTerm]);

  const handleOpenEvaluation = (practice: PracticeWithStudent, type: EvaluatorType) => {
    setSelectedPractice(practice);
    setSelectedEvaluatorType(type);
    setModalOpen(true);
  };

  const handleEvaluationSuccess = () => {
    if (selectedPractice) {
      getPracticeStatus(selectedPractice.professionalPracticeId).then(status => {
        if (status) {
          setPracticeStatuses(prev => ({
            ...prev,
            [selectedPractice.professionalPracticeId]: status
          }));
        }
      });
    }
  };

  const getEvaluationButton = (practice: PracticeWithStudent, type: EvaluatorType) => {
    const status = practiceStatuses[practice.professionalPracticeId];
    const evaluation = status?.evaluations[type];

    if (evaluation?.completed) {
      return (
        <button
          onClick={() => handleOpenEvaluation(practice, type)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
        >
          <CheckCircleIcon className="w-4 h-4" />
          <span>{evaluation.score.toFixed(1)}</span>
        </button>
      );
    }

    return (
      <button
        onClick={() => handleOpenEvaluation(practice, type)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-brand-100 dark:hover:bg-brand-900/30 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
      >
        <TimeIcon className="w-4 h-4" />
        <span>Pendiente</span>
      </button>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full">
            <CheckCircleIcon className="w-3 h-3" />
            Completo
          </span>
        );
      case 'partial':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full">
            <TimeIcon className="w-3 h-3" />
            Parcial
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full">
            <AlertIcon className="w-3 h-3" />
            Pendiente
          </span>
        );
    }
  };

  return (
    <ErrorBoundary
      fallback={
        <div className="p-6 rounded-xl border border-error-200 bg-error-50 dark:bg-error-500/10 dark:border-error-500/20">
          <div className="flex flex-col items-center justify-center text-center p-8">
            <h3 className="text-lg font-semibold text-error-900 dark:text-error-400 mb-2">
              Error en la página de Evaluaciones
            </h3>
            <p className="text-error-700 dark:text-error-500/80">
              Intenta recargar la página.
            </p>
          </div>
        </div>
      }
    >
      <>
        <PageMeta
          title="Evaluaciones"
          description="Gestión de evaluaciones de prácticas profesionales"
        />
        <SkeletonLoader isLoading={pageLoading} skeleton={<BreadcrumbSkeleton />}>
          <PageBreadcrumb pageTitle="Evaluaciones" />
        </SkeletonLoader>

        <div className="stagger-delay">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <SkeletonLoader isLoading={pageLoading} skeleton={<TitleSkeleton />}>
                <h2 className="text-2xl font-bold text-text-primary dark:text-white/90">
                  Gestión de Evaluaciones
                </h2>
                <p className="mt-1 text-sm text-text-secondary dark:text-text-tertiary">
                  Registra y consulta evaluaciones de prácticas profesionales.
                </p>
              </SkeletonLoader>
            </div>
          </div>

          <ComponentCard title="Prácticas Profesionales">
            <div className="mb-4">
              <input
                type="text"
                placeholder="Buscar por estudiante, cédula o institución..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Estudiante
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Institución
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Institucional (40%)
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Académico (30%)
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Comité (30%)
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Nota Final
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {practicesLoading ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                        Cargando prácticas...
                      </td>
                    </tr>
                  ) : filteredPractices.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                        No se encontraron prácticas
                      </td>
                    </tr>
                  ) : (
                    filteredPractices.map((practice) => {
                      const status = practiceStatuses[practice.professionalPracticeId];
                      return (
                        <tr
                          key={practice.professionalPracticeId}
                          className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                        >
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {practice.studentName}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {practice.studentCi}
                              </p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                            {practice.institutionName}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {getEvaluationButton(practice, 'INSTITUCIONAL')}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {getEvaluationButton(practice, 'ACADEMICO')}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {getEvaluationButton(practice, 'COMITE')}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="text-lg font-bold text-brand-500">
                              {status?.finalGrade || '-'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {getStatusBadge(status?.evaluationStatus || 'pending')}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </ComponentCard>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <ComponentCard title="Evaluación Institucional" className="bg-blue-50 dark:bg-blue-900/20">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Realizada por el tutor de la institución donde el estudiante realiza su pasantía.
              </p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {EVALUATION_WEIGHTS['INSTITUCIONAL'] * 100}%
              </p>
            </ComponentCard>

            <ComponentCard title="Evaluación Académica" className="bg-purple-50 dark:bg-purple-900/20">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Realizada por el tutor académico asignado por la universidad.
              </p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {EVALUATION_WEIGHTS['ACADEMICO'] * 100}%
              </p>
            </ComponentCard>

            <ComponentCard title="Evaluación Comité" className="bg-green-50 dark:bg-green-900/20">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Realizada por el comité evaluador durante la defensa oral.
              </p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {EVALUATION_WEIGHTS['COMITE'] * 100}%
              </p>
            </ComponentCard>
          </div>
        </div>

        {selectedPractice && selectedEvaluatorType && (
          <EvaluationModal
            isOpen={modalOpen}
            onClose={() => {
              setModalOpen(false);
              setSelectedPractice(null);
              setSelectedEvaluatorType(null);
            }}
            practiceId={selectedPractice.professionalPracticeId}
            evaluatorType={selectedEvaluatorType}
            onSuccess={handleEvaluationSuccess}
          />
        )}
      </>
    </ErrorBoundary>
  );
}
