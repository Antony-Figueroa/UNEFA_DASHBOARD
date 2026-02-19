import { useEffect, useState } from "react";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import tutorService, { TutorStudent } from "../../features/tutor/services/tutorService";
import Badge from "../../components/ui/badge/Badge";
import Button from "../../components/ui/button/Button";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../components/ui/modal";
import toast from "react-hot-toast";

export default function TutorGrades() {
  const [students, setStudents] = useState<TutorStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<TutorStudent | null>(null);
  const [grade, setGrade] = useState("");
  const [observations, setObservations] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const data = await tutorService.getStudents({ status: "active" });
      setStudents(data);
    } catch (err) {
      console.error("[TutorGrades] Error:", err);
      setError("Error al cargar estudiantes");
    } finally {
      setLoading(false);
    }
  };

  const openGradeModal = (student: TutorStudent) => {
    setSelectedStudent(student);
    setGrade(student.grade > 0 ? student.grade.toString() : "");
    setObservations("");
  };

  const handleSaveGrade = async () => {
    if (!selectedStudent) return;

    const numGrade = parseFloat(grade);
    if (isNaN(numGrade) || numGrade < 0 || numGrade > 20) {
      toast.error("La nota debe ser un número entre 0 y 20");
      return;
    }

    try {
      setSaving(true);
      await tutorService.updateGrade(selectedStudent.enrollmentId, numGrade, observations);
      
      setStudents(prev => prev.map(s => 
        s.enrollmentId === selectedStudent.enrollmentId 
          ? { ...s, grade: numGrade }
          : s
      ));
      
      setSelectedStudent(null);
      toast.success("Nota guardada exitosamente");
    } catch (err) {
      console.error("[TutorGrades] Error saving grade:", err);
      toast.error("Error al guardar la nota");
    } finally {
      setSaving(false);
    }
  };

  const pendingStudents = students.filter(s => s.grade === 0);
  const gradedStudents = students.filter(s => s.grade > 0);

  return (
    <>
      <PageMeta
        title="Cargar Notas | SIGP - UNEFA"
        description="Cargar notas finales de estudiantes"
      />

      <div className="space-y-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-text-emphasis dark:text-text-emphasis">
            Cargar Notas
          </h1>
          <p className="text-text-secondary dark:text-text-tertiary mt-1">
            Registre la nota final de sus estudiantes activos
          </p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-600 dark:text-blue-400">Total Activos</p>
            <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{students.length}</p>
          </div>
          <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
            <p className="text-sm text-orange-600 dark:text-orange-400">Sin Calificar</p>
            <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">{pendingStudents.length}</p>
          </div>
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <p className="text-sm text-green-600 dark:text-green-400">Calificados</p>
            <p className="text-2xl font-bold text-green-700 dark:text-green-300">{gradedStudents.length}</p>
          </div>
        </div>

        <ComponentCard title="Pendientes de Calificación">
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse flex gap-4 p-4 border-b border-border-light dark:border-border-dark">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                </div>
              ))}
            </div>
          ) : pendingStudents.length === 0 ? (
            <div className="text-center py-8 text-text-secondary dark:text-text-tertiary">
              No hay estudiantes pendientes de calificación
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Estudiante</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Carrera</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Empresa</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light dark:divide-border-dark">
                  {pendingStudents.map((student) => (
                    <tr key={student.enrollmentId} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-medium text-text-emphasis">{student.studentName}</p>
                          <p className="text-sm text-text-secondary">{student.studentCi}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-text-secondary">{student.careerName}</td>
                      <td className="px-4 py-4 text-text-secondary">{student.institutionName}</td>
                      <td className="px-4 py-4">
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => openGradeModal(student)}
                        >
                          Calificar
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ComponentCard>

        {gradedStudents.length > 0 && (
          <ComponentCard title="Ya Calificados">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Estudiante</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Carrera</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Empresa</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Nota</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light dark:divide-border-dark">
                  {gradedStudents.map((student) => (
                    <tr key={student.enrollmentId} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-medium text-text-emphasis">{student.studentName}</p>
                          <p className="text-sm text-text-secondary">{student.studentCi}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-text-secondary">{student.careerName}</td>
                      <td className="px-4 py-4 text-text-secondary">{student.institutionName}</td>
                      <td className="px-4 py-4">
                        <Badge color={student.grade >= 10 ? "success" : "error"}>
                          {student.grade.toFixed(1)}
                        </Badge>
                      </td>
                      <td className="px-4 py-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openGradeModal(student)}
                        >
                          Modificar
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ComponentCard>
        )}
      </div>

      <Modal isOpen={!!selectedStudent} onClose={() => setSelectedStudent(null)} size="md">
        <ModalHeader>
          Asignar Nota
        </ModalHeader>
        <ModalBody>
          {selectedStudent && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <p className="font-medium">{selectedStudent.studentName}</p>
                <p className="text-sm text-text-secondary">{selectedStudent.careerName}</p>
                <p className="text-sm text-text-secondary">{selectedStudent.institutionName}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Nota Final (0-20)
                </label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  step="0.1"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full px-4 py-2 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-brand-500"
                  placeholder="Ingrese la nota"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">
                  Observaciones (opcional)
                </label>
                <textarea
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  className="w-full px-4 py-2 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-brand-500"
                  rows={3}
                  placeholder="Comentarios sobre el desempeño del estudiante"
                />
              </div>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" onClick={() => setSelectedStudent(null)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSaveGrade} disabled={saving}>
            {saving ? "Guardando..." : "Guardar Nota"}
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
}
