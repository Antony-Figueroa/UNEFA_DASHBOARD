import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import PageMeta from "../../../components/common/PageMeta";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import ComponentCard from "../../../components/common/ComponentCard";
import Button from "../../../components/ui/button/Button";
import { AngleLeftIcon } from "../../../icons";
import toast from "react-hot-toast";
import apiClient from "../../../api/apiClient";
import { useEvaluations } from "../../../features/evaluations/hooks/useEvaluations";
import { useSystemEvaluationConfig } from "../../../features/evaluations/hooks/useSystemEvaluationConfig";
import { EvaluatorType, EVALUATOR_TYPE_LABELS } from "../../../features/evaluations/types";

interface StudentInfo {
  studentName: string;
  studentCi: string;
  institutionName: string;
  careerName: string;
}

interface ExistingEvaluation {
  evaluationId: number;
  totalScore: number;
  observations: string;
  evaluatorName: string;
  items: Array<{
    criteriaId: number;
    itemNumber: number;
    score: number;
  }>;
}

export default function TutorEvaluation() {
  const { enrollmentId } = useParams<{ enrollmentId: string }>();
  const navigate = useNavigate();
  const { criteria, fetchCriteria, createEvaluation, updateEvaluation, loading: evalLoading } = useEvaluations();
  const { config } = useSystemEvaluationConfig();
  const scoreRange = { min: config.score.min, max: config.score.max };
  const midpoint = scoreRange.min + Math.floor((scoreRange.max - scoreRange.min) / 2);

  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [existingEvaluation, setExistingEvaluation] = useState<ExistingEvaluation | null>(null);
  const [itemScores, setItemScores] = useState<Record<number, number>>({});
  const [evaluatorName, setEvaluatorName] = useState("");
  const [observations, setObservations] = useState("");

  useEffect(() => {
    if (enrollmentId) {
      fetchData();
    }
  }, [enrollmentId]);

  useEffect(() => {
    fetchCriteria("ACADEMICO" as EvaluatorType);
  }, [fetchCriteria]);

  useEffect(() => {
    if (criteria.length > 0 && Object.keys(itemScores).length === 0) {
      const initialScores: Record<number, number> = {};
      criteria.forEach(c => {
        initialScores[c.criteriaId] = midpoint;
      });
      setItemScores(initialScores);
    }
  }, [criteria]);

  const fetchData = async () => {
    try {
      setPageLoading(true);
      
      const practiceRes = await apiClient.get(`/tutor/practice/${enrollmentId}`);
      if (practiceRes.data?.data) {
        setStudentInfo({
          studentName: practiceRes.data.data.studentName || "Estudiante",
          studentCi: practiceRes.data.data.studentCi || "",
          institutionName: practiceRes.data.data.institutionName || "",
          careerName: practiceRes.data.data.careerName || ""
        });
      }

      const evalStatusRes = await apiClient.get(`/evaluations/practice/${enrollmentId}/status`).catch(() => null);
      if (evalStatusRes?.data?.data?.evaluations?.ACADEMICO?.completed) {
        const evalId = evalStatusRes.data.data.evaluations.ACADEMICO.evaluationId;
        if (evalId) {
          const detailRes = await apiClient.get(`/evaluations/${evalId}`);
          if (detailRes.data?.data) {
            setExistingEvaluation(detailRes.data.data);
            setEvaluatorName(detailRes.data.data.evaluatorName || "");
            setObservations(detailRes.data.data.observations || "");
            
            if (detailRes.data.data.items) {
              const scores: Record<number, number> = {};
              detailRes.data.data.items.forEach((item: { criteriaId: number; score: number }) => {
                scores[item.criteriaId] = item.score;
              });
              setItemScores(scores);
            }
          }
        }
      }
    } catch (error) {
      console.error("[TutorEvaluation] Error fetching data:", error);
      toast.error("Error al cargar datos");
    } finally {
      setPageLoading(false);
    }
  };

  const handleScoreChange = (criteriaId: number, score: number) => {
    if (score >= scoreRange.min && score <= scoreRange.max) {
      setItemScores(prev => ({
        ...prev,
        [criteriaId]: score
      }));
    }
  };

  const calculateAverage = () => {
    if (criteria.length === 0) return "0.00";
    const scores = criteria.map(c => itemScores[c.criteriaId] ?? midpoint);
    const sum = scores.reduce((a, b) => a + b, 0);
    const rawAvg = sum / scores.length;
    const scaled = (rawAvg / scoreRange.max) * config.score.displayScale;
    return scaled.toFixed(2);
  };

  const handleSubmit = async () => {
    if (!enrollmentId) return;
    if (!evaluatorName.trim()) {
      toast.error("El nombre del evaluador es requerido");
      return;
    }

    const items = criteria.map(c => ({
      criteriaId: c.criteriaId,
      itemNumber: c.itemNumber,
      score: itemScores[c.criteriaId] ?? midpoint
    }));

    try {
      setSaving(true);

      if (existingEvaluation) {
        await updateEvaluation(existingEvaluation.evaluationId, {
          evaluatorName,
          observations,
          items
        });
        toast.success("Evaluación actualizada exitosamente");
      } else {
        await createEvaluation({
          professionalPracticeId: parseInt(enrollmentId),
          evaluatorType: "ACADEMICO" as EvaluatorType,
          evaluatorName,
          observations,
          items
        });
        toast.success("Evaluación guardada exitosamente");
      }
      
      navigate("/tutor/students");
    } catch (error) {
      console.error("[TutorEvaluation] Error saving:", error);
      toast.error("Error al guardar evaluación");
    } finally {
      setSaving(false);
    }
  };

  const getScoreInputClass = (criteriaId: number) => {
    const score = itemScores[criteriaId] ?? midpoint;
    const { min, max } = scoreRange;
    const range = max - min;
    const lowThreshold = min + Math.floor(range * 0.4);
    const highThreshold = min + Math.ceil(range * 0.8);
    if (score <= lowThreshold) return "border-red-400 focus:border-red-500 dark:border-red-500";
    if (score >= highThreshold) return "border-green-400 focus:border-green-500 dark:border-green-500";
    return "border-yellow-400 focus:border-yellow-500 dark:border-yellow-500";
  };

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title="Evaluación Académica"
        description="Evaluación académica de estudiante en práctica profesional"
      />
      <PageBreadcrumb pageTitle="Evaluación Académica" />

      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => navigate("/tutor/students")}
          className="flex items-center gap-2"
        >
          <AngleLeftIcon className="w-5 h-5" />
          Volver a Estudiantes
        </Button>
      </div>

      {studentInfo && (
        <ComponentCard title="Información del Estudiante" className="mb-6">
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
            <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/20">
              <p className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 mb-1">Tipo</p>
              <p className="text-lg font-semibold text-text-primary dark:text-text-emphasis">
                {EVALUATOR_TYPE_LABELS["ACADEMICO"]}
              </p>
            </div>
          </div>
        </ComponentCard>
      )}

      <ComponentCard title="Datos del Evaluador" className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-primary dark:text-white mb-1">
              Nombre del Evaluador *
            </label>
            <input
              type="text"
              value={evaluatorName}
              onChange={(e) => setEvaluatorName(e.target.value)}
              className="w-full px-4 py-2 border border-border-light dark:border-white/10 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-brand-500"
              placeholder="Su nombre completo"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary dark:text-white mb-1">
              Observaciones Generales
            </label>
            <input
              type="text"
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              className="w-full px-4 py-2 border border-border-light dark:border-white/10 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-brand-500"
              placeholder="Comentarios sobre el estudiante..."
            />
          </div>
        </div>
      </ComponentCard>

      <ComponentCard 
        title="Criterios de Evaluación" 
        className="mb-6"
        headerAction={
          <div className="flex items-center gap-2">
            <span className="text-sm text-text-secondary dark:text-text-tertiary">Promedio:</span>
            <span className="text-2xl font-bold text-brand-500">{calculateAverage()}</span>
            <span className="text-sm text-text-secondary dark:text-text-tertiary">/ {config.score.displayScale}</span>
          </div>
        }
      >
        <p className="text-sm text-text-secondary dark:text-text-tertiary mb-4">
          Califique cada criterio del {scoreRange.min} al {scoreRange.max}.
          <span className="ml-2 text-red-500">Rojo (bajo)</span>,
          <span className="ml-1 text-yellow-500">Amarillo (medio)</span>,
          <span className="ml-1 text-green-500">Verde (alto)</span>.
          Nota final escalada a 0–{config.score.displayScale}.
        </p>

        {criteria.length === 0 ? (
          <div className="text-center py-8 text-text-secondary dark:text-text-tertiary">
            {evalLoading ? "Cargando criterios de evaluación..." : "No hay criterios disponibles"}
          </div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {criteria.map((criterion) => (
              <div
                key={criterion.criteriaId}
                className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex-1">
                    <span className="text-sm font-medium text-text-secondary dark:text-text-tertiary mr-2">
                      {criterion.itemNumber}.
                    </span>
                    <span className="text-sm text-text-primary dark:text-white">
                      {criterion.description}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={scoreRange.min}
                      max={scoreRange.max}
                      step="1"
                      value={itemScores[criterion.criteriaId] ?? midpoint}
                      onChange={(e) => handleScoreChange(criterion.criteriaId, parseInt(e.target.value))}
                      className="flex-1 sm:w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                    />
                    <input
                      type="number"
                      min={scoreRange.min}
                      max={scoreRange.max}
                      value={itemScores[criterion.criteriaId] ?? midpoint}
                      onChange={(e) => handleScoreChange(criterion.criteriaId, parseInt(e.target.value) || 0)}
                      className={`w-16 px-2 py-1 text-center border rounded-lg focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:text-white ${getScoreInputClass(criterion.criteriaId)}`}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ComponentCard>

      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={() => navigate("/tutor/students")}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} disabled={saving || criteria.length === 0}>
          {saving ? "Guardando..." : existingEvaluation ? "Actualizar Evaluación" : "Guardar Evaluación"}
        </Button>
      </div>
    </>
  );
}
