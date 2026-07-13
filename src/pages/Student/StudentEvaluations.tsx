import { useEffect, useState } from "react";
import ComponentCard from "../../components/common/ComponentCard";
import Badge from "../../components/ui/badge/Badge";
import { CheckCircleIcon, TimeIcon, AlertIcon, EyeIcon } from "../../icons";
import apiClient from "../../api/apiClient";
import { EvaluatorType, EVALUATOR_TYPE_LABELS, EvaluationStatus } from "../../features/evaluations/types";
import { useSystemEvaluationConfig } from "../../features/evaluations/hooks/useSystemEvaluationConfig";
import EvaluationDetailModal from "../../features/evaluations/components/EvaluationDetailModal";

interface StudentInfo {
  studentName: string;
  studentCi: string;
  careerName: string;
  practiceId: number;
  institutionName: string;
  period: string;
  status: string;
}

export default function StudentEvaluations() {
  const { config: evalConfig } = useSystemEvaluationConfig();
  const [loading, setLoading] = useState(true);
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [evaluationStatus, setEvaluationStatus] = useState<EvaluationStatus | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedEvaluationId, setSelectedEvaluationId] = useState<number | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      const dashboardRes = await apiClient.get('/student/dashboard');
      if (dashboardRes.data?.data) {
        const data = dashboardRes.data.data;
        const student = data.student || {};
        const internship = data.internship || {};

        setStudentInfo({
          studentName: `${student.name || ''} ${student.surname || ''}`.trim() || "Estudiante",
          studentCi: student.ci || "",
          careerName: internship.careerName || "",
          practiceId: internship.professionalPracticeId,
          institutionName: internship.institutionName || "",
          period: internship.period || "",
          status: internship.status || ""
        });

        if (internship.professionalPracticeId) {
          const statusRes = await apiClient.get(`/evaluations/practice/${internship.professionalPracticeId}/status`);
          if (statusRes.data?.data) {
            setEvaluationStatus(statusRes.data.data);
          }
        }
      }
    } catch (error) {
      console.error("[StudentEvaluations] Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (evaluationId: number) => {
    setSelectedEvaluationId(evaluationId);
    setDetailModalOpen(true);
  };

  const getEvaluationCard = (type: EvaluatorType) => {
    const evaluation = evaluationStatus?.evaluations[type];
    const weight = evalConfig.weights[type] || 0;
    const label = EVALUATOR_TYPE_LABELS[type];

    return (
      <ComponentCard key={type} title={label}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-text-primary dark:text-white">
              {label}
            </h3>
            <Badge
              color={evaluation?.completed ? "success" : "warning"}
              variant="light"
            >
              {evaluation?.completed ? "Completada" : "Pendiente"}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-xs text-text-tertiary mb-1">Peso</p>
              <p className="text-xl font-bold text-brand-500">{(weight * 100).toFixed(0)}%</p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-xs text-text-tertiary mb-1">Calificación</p>
              {evaluation?.completed ? (
                <p className={`text-xl font-bold ${(evaluation.score / evalConfig.score.displayScale) >= 0.5 ? "text-green-500" : "text-red-500"}`}>
                  {Math.round((evaluation.score / evalConfig.score.displayScale) * 100)}%
                </p>
              ) : (
                <p className="text-xl font-bold text-text-tertiary">-</p>
              )}
            </div>
          </div>

          {evaluation?.completed && (
            <>
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="text-xs text-text-tertiary mb-1">Evaluador</p>
                <p className="text-sm font-medium">{evaluation.evaluatorName}</p>
              </div>
              <button
                onClick={() => handleViewDetails((evaluation as any).evaluationId)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
              >
                <EyeIcon className="w-4 h-4" />
                Ver Detalles
              </button>
            </>
          )}
        </div>
      </ComponentCard>
    );
  };

  const getFinalGradeColor = (grade: string) => {
    const num = parseFloat(grade);
    if (isNaN(num)) return "text-text-tertiary";
    if (num >= 10) return "text-green-500";
    return "text-red-500";
  };

  const getStatusBadge = () => {
    if (!evaluationStatus) return null;

    switch (evaluationStatus.evaluationStatus) {
      case 'completed':
        return (
          <Badge color="success">
            <CheckCircleIcon className="w-4 h-4 mr-1" />
            Completo
          </Badge>
        );
      case 'partial':
        return (
          <Badge color="warning">
            <TimeIcon className="w-4 h-4 mr-1" />
            Parcial
          </Badge>
        );
      default:
        return (
          <Badge color="light">
            <AlertIcon className="w-4 h-4 mr-1" />
            Pendiente
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {studentInfo && (
        <ComponentCard title="Información de Práctica">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-brand-50 dark:bg-brand-500/10 border border-brand-200 dark:border-brand-500/20">
              <p className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 mb-1">Estudiante</p>
              <p className="text-lg font-semibold text-text-primary dark:text-text-emphasis">{studentInfo.studentName}</p>
              <p className="text-sm text-text-secondary">{studentInfo.studentCi}</p>
            </div>
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
              <p className="text-xs font-bold uppercase tracking-wider text-text-tertiary mb-1">Carrera</p>
              <p className="text-lg font-semibold text-text-primary dark:text-text-emphasis">{studentInfo.careerName}</p>
            </div>
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
              <p className="text-xs font-bold uppercase tracking-wider text-text-tertiary mb-1">Empresa</p>
              <p className="text-lg font-semibold text-text-primary dark:text-text-emphasis">{studentInfo.institutionName}</p>
            </div>
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20">
              <p className="text-xs font-bold uppercase tracking-wider text-green-600 dark:text-green-400 mb-1">Estado</p>
              <div className="mt-1">{getStatusBadge()}</div>
            </div>
          </div>
        </ComponentCard>
      )}

      {evaluationStatus && (
        <ComponentCard
          title="Nota Final"
          className="bg-gradient-to-r from-brand-50 to-purple-50 dark:from-brand-900/20 dark:to-purple-900/20"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary dark:text-text-tertiary">Calificación ponderada</p>
              <p className={`text-4xl font-bold ${getFinalGradeColor(evaluationStatus.finalGrade)}`}>
                {evaluationStatus.finalGrade}
              </p>
              <p className="text-xs text-text-tertiary mt-1">
                {evaluationStatus.completedCount} de 3 evaluaciones completadas
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-text-secondary dark:text-text-tertiary">Evaluaciones</p>
              <div className="flex gap-2 mt-2">
                {(['INSTITUCIONAL', 'ACADEMICO', 'COMITE'] as EvaluatorType[]).map(type => (
                  <div
                    key={type}
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      evaluationStatus.evaluations[type]?.completed
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-300 dark:bg-gray-700 text-gray-500'
                    }`}
                  >
                    {evaluationStatus.evaluations[type]?.completed ? (
                      <CheckCircleIcon className="w-4 h-4" />
                    ) : (
                      <TimeIcon className="w-4 h-4" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ComponentCard>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {(['INSTITUCIONAL', 'ACADEMICO', 'COMITE'] as EvaluatorType[]).map(type => getEvaluationCard(type))}
      </div>

      <ComponentCard title="Información sobre las Evaluaciones">
        <div className="space-y-4 text-sm text-text-secondary dark:text-text-tertiary">
          <p>
            Las evaluaciones de práctica profesional se componen de tres partes, cada una con un peso específico:
          </p>
          <ul className="space-y-2">
            <li className="flex items-center gap-2">
              <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
              <strong>Evaluación Institucional ({(evalConfig.weights['INSTITUCIONAL'] * 100).toFixed(0)}%):</strong> Realizada por el supervisor de la empresa donde realizaste tu pasantía.
            </li>
            <li className="flex items-center gap-2">
              <span className="w-3 h-3 bg-purple-500 rounded-full"></span>
              <strong>Evaluación Académica ({(evalConfig.weights['ACADEMICO'] * 100).toFixed(0)}%):</strong> Realizada por tu tutor académico asignado por la universidad.
            </li>
            <li className="flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              <strong>Evaluación Comité ({(evalConfig.weights['COMITE'] * 100).toFixed(0)}%):</strong> Realizada por el comité evaluador durante la defensa oral.
            </li>
          </ul>
          <p className="text-xs text-text-tertiary mt-4">
            La nota final se calcula ponderando las tres evaluaciones. Es necesario completar las tres para obtener la calificación final.
          </p>
        </div>
      </ComponentCard>

      <EvaluationDetailModal
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedEvaluationId(null);
        }}
        evaluationId={selectedEvaluationId}
        studentName={studentInfo?.studentName}
        studentCi={studentInfo?.studentCi}
      />
    </div>
  );
}
