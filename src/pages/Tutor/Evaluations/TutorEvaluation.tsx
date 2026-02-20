import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import PageMeta from "../../../components/common/PageMeta";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import ComponentCard from "../../../components/common/ComponentCard";
import Button from "../../../components/ui/button/Button";
import TextArea from "../../../components/form/input/TextArea";
import { AngleLeftIcon } from "../../../icons";
import toast from "react-hot-toast";
import apiClient from "../../../api/apiClient";

interface EvaluationData {
  attendance: number;
  punctuality: number;
  responsibility: number;
  initiative: number;
  teamwork: number;
  communication: number;
  technicalSkills: number;
  problemSolving: number;
  adaptability: number;
  overallPerformance: number;
  comments: string;
  recommendations: string;
}

interface StudentInfo {
  studentName: string;
  studentCi: string;
  institutionName: string;
  careerName: string;
}

export default function TutorEvaluation() {
  const { enrollmentId } = useParams<{ enrollmentId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [existingEvaluation, setExistingEvaluation] = useState<EvaluationData | null>(null);

  const [formData, setFormData] = useState<EvaluationData>({
    attendance: 0,
    punctuality: 0,
    responsibility: 0,
    initiative: 0,
    teamwork: 0,
    communication: 0,
    technicalSkills: 0,
    problemSolving: 0,
    adaptability: 0,
    overallPerformance: 0,
    comments: "",
    recommendations: ""
  });

  useEffect(() => {
    if (enrollmentId) {
      fetchData();
    }
  }, [enrollmentId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [practiceRes, evaluationRes] = await Promise.all([
        apiClient.get(`/tutor/practice/${enrollmentId}`),
        apiClient.get(`/evaluations/practice/${enrollmentId}`).catch(() => ({ data: { data: null } }))
      ]);

      if (practiceRes.data?.data) {
        setStudentInfo({
          studentName: practiceRes.data.data.studentName || "Estudiante",
          studentCi: practiceRes.data.data.studentCi || "",
          institutionName: practiceRes.data.data.institutionName || "",
          careerName: practiceRes.data.data.careerName || ""
        });
      }

      if (evaluationRes.data?.data) {
        setExistingEvaluation(evaluationRes.data.data);
        setFormData({
          attendance: evaluationRes.data.data.attendance || 0,
          punctuality: evaluationRes.data.data.punctuality || 0,
          responsibility: evaluationRes.data.data.responsibility || 0,
          initiative: evaluationRes.data.data.initiative || 0,
          teamwork: evaluationRes.data.data.teamwork || 0,
          communication: evaluationRes.data.data.communication || 0,
          technicalSkills: evaluationRes.data.data.technicalSkills || 0,
          problemSolving: evaluationRes.data.data.problemSolving || 0,
          adaptability: evaluationRes.data.data.adaptability || 0,
          overallPerformance: evaluationRes.data.data.overallPerformance || 0,
          comments: evaluationRes.data.data.comments || "",
          recommendations: evaluationRes.data.data.recommendations || ""
        });
      }
    } catch (error) {
      console.error("[TutorEvaluation] Error fetching data:", error);
      toast.error("Error al cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof EvaluationData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const calculateAverage = () => {
    const criteria = [
      formData.attendance,
      formData.punctuality,
      formData.responsibility,
      formData.initiative,
      formData.teamwork,
      formData.communication,
      formData.technicalSkills,
      formData.problemSolving,
      formData.adaptability
    ];
    const sum = criteria.reduce((acc, val) => acc + (Number(val) || 0), 0);
    return (sum / criteria.length).toFixed(1);
  };

  const handleSubmit = async () => {
    if (!enrollmentId) return;

    const criteria = [
      { key: "attendance", label: "Asistencia" },
      { key: "punctuality", label: "Puntualidad" },
      { key: "responsibility", label: "Responsabilidad" },
      { key: "initiative", label: "Iniciativa" },
      { key: "teamwork", label: "Trabajo en equipo" },
      { key: "communication", label: "Comunicación" },
      { key: "technicalSkills", label: "Habilidades técnicas" },
      { key: "problemSolving", label: "Resolución de problemas" },
      { key: "adaptability", label: "Adaptabilidad" }
    ];

    for (const criterion of criteria) {
      const value = formData[criterion.key as keyof EvaluationData];
      if (typeof value === "number" && (value < 0 || value > 20)) {
        toast.error(`${criterion.label} debe estar entre 0 y 20`);
        return;
      }
    }

    try {
      setSaving(true);
      await apiClient.post(`/evaluations/practice/${enrollmentId}`, {
        ...formData,
        overallPerformance: parseFloat(calculateAverage())
      });
      toast.success(existingEvaluation ? "Evaluación actualizada" : "Evaluación guardada");
      navigate("/tutor/students");
    } catch (error) {
      console.error("[TutorEvaluation] Error saving:", error);
      toast.error("Error al guardar evaluación");
    } finally {
      setSaving(false);
    }
  };

  const renderCriteriaInput = (field: keyof EvaluationData, label: string) => (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-text-primary dark:text-white">
        {label} (0-20)
      </label>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min="0"
          max="20"
          step="1"
          value={formData[field] as number}
          onChange={(e) => handleInputChange(field, parseInt(e.target.value))}
          className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />
        <input
          type="number"
          min="0"
          max="20"
          value={formData[field] as number}
          onChange={(e) => handleInputChange(field, parseInt(e.target.value) || 0)}
          className="w-20 px-3 py-2 border border-border-light dark:border-white/10 rounded-lg bg-white dark:bg-gray-800 text-center"
        />
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
      </div>
    );
  }

  return (
    <>
      <PageMeta
        title="Evaluación de Estudiante"
        description="Evaluación de desempeño del estudiante en práctica profesional"
      />
      <PageBreadcrumb pageTitle="Evaluación de Estudiante" />

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
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20">
              <p className="text-xs font-bold uppercase tracking-wider text-green-600 dark:text-green-400 mb-1">Promedio</p>
              <p className="text-lg font-semibold text-text-primary dark:text-text-emphasis">{calculateAverage()}/20</p>
            </div>
          </div>
        </ComponentCard>
      )}

      <ComponentCard title="Criterios de Evaluación" className="mb-6">
        <p className="text-sm text-text-secondary dark:text-text-tertiary mb-6">
          Califique cada criterio del 0 al 20, donde 0 es la calificación más baja y 20 la más alta.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {renderCriteriaInput("attendance", "Asistencia")}
          {renderCriteriaInput("punctuality", "Puntualidad")}
          {renderCriteriaInput("responsibility", "Responsabilidad")}
          {renderCriteriaInput("initiative", "Iniciativa")}
          {renderCriteriaInput("teamwork", "Trabajo en Equipo")}
          {renderCriteriaInput("communication", "Comunicación")}
          {renderCriteriaInput("technicalSkills", "Habilidades Técnicas")}
          {renderCriteriaInput("problemSolving", "Resolución de Problemas")}
          {renderCriteriaInput("adaptability", "Adaptabilidad")}
        </div>
      </ComponentCard>

      <ComponentCard title="Comentarios Adicionales" className="mb-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Comentarios sobre el desempeño</label>
            <TextArea
              placeholder="Describa el desempeño general del estudiante durante su practica profesional..."
              value={formData.comments}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange("comments", e.target.value)}
              rows={4}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Recomendaciones</label>
            <TextArea
              placeholder="Recomendaciones para el desarrollo profesional del estudiante..."
              value={formData.recommendations}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange("recommendations", e.target.value)}
              rows={4}
            />
          </div>
        </div>
      </ComponentCard>

      <div className="flex justify-end gap-4">
        <Button variant="outline" onClick={() => navigate("/tutor/students")}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} disabled={saving}>
          {saving ? "Guardando..." : existingEvaluation ? "Actualizar Evaluación" : "Guardar Evaluación"}
        </Button>
      </div>
    </>
  );
}
