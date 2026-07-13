import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import tutorService, { TutorStudent } from "../../features/tutor/services/tutorService";
import Badge from "../../components/ui/badge/Badge";
import Button from "../../components/ui/button/Button";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "../../components/ui/modal";
import { useToast } from "../../context/toast";
import { TOAST } from "../../components/ui/dialog/DialogConfig";
import { Table, TableHeader, TableBody, TableRow, TableCell, Pagination } from "../../components/ui/table";
import InputField from "../../components/form/input/InputField";
import { EmptyState } from "../../components/ui/table/EmptyState";

export default function TutorGrades() {
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [students, setStudents] = useState<TutorStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<TutorStudent | null>(null);
  const [grade, setGrade] = useState("");
  const [observations, setObservations] = useState("");
  const [saving, setSaving] = useState(false);

  // Pagination state for pending students
  const [pendingPage, setPendingPage] = useState(1);
  const [pendingItemsPerPage, setPendingItemsPerPage] = useState(5);
  // Pagination state for graded students
  const [gradedPage, setGradedPage] = useState(1);
  const [gradedItemsPerPage, setGradedItemsPerPage] = useState(5);

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

  const openEvaluationModification = (enrollmentId: string) => {
    navigate(`/tutor/evaluations/${enrollmentId}`);
  };

  const handleSaveGrade = async () => {
    if (!selectedStudent) return;

    const numGrade = parseFloat(grade);
    if (isNaN(numGrade) || numGrade < 0 || numGrade > 20) {
      addToast({ variant: "error", title: "Dato inválido", message: "La nota debe ser un número entre 0 y 20." });
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
      addToast({ variant: "success", title: "Nota guardada", message: "La nota se guardó correctamente." });
    } catch (err) {
      console.error("[TutorGrades] Error saving grade:", err);
      addToast(TOAST.updateError('nota'));
    } finally {
      setSaving(false);
    }
  };

  const pendingStudents = useMemo(() => students.filter(s => s.grade === 0), [students]);
  const gradedStudents = useMemo(() => students.filter(s => s.grade > 0), [students]);

  const pendingTotalPages = Math.max(1, Math.ceil(pendingStudents.length / pendingItemsPerPage));
  const pendingStartIndex = (pendingPage - 1) * pendingItemsPerPage;
  const pagedPendingStudents = pendingStudents.slice(pendingStartIndex, pendingStartIndex + pendingItemsPerPage);

  const gradedTotalPages = Math.max(1, Math.ceil(gradedStudents.length / gradedItemsPerPage));
  const gradedStartIndex = (gradedPage - 1) * gradedItemsPerPage;
  const pagedGradedStudents = gradedStudents.slice(gradedStartIndex, gradedStartIndex + gradedItemsPerPage);

  const handlePendingPageChange = (page: number) => {
    if (page < 1 || page > pendingTotalPages) return;
    setPendingPage(page);
  };

  const handlePendingItemsPerPageChange = (items: number) => {
    setPendingItemsPerPage(items);
    setPendingPage(1);
  };

  const handleGradedPageChange = (page: number) => {
    if (page < 1 || page > gradedTotalPages) return;
    setGradedPage(page);
  };

  const handleGradedItemsPerPageChange = (items: number) => {
    setGradedItemsPerPage(items);
    setGradedPage(1);
  };

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
            <EmptyState
              title="No hay estudiantes pendientes de calificación"
              description="Todos los estudiantes activos ya tienen una nota asignada."
            />
          ) : (
            <div className="max-w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell isHeader>Estudiante</TableCell>
                    <TableCell isHeader>Carrera</TableCell>
                    <TableCell isHeader>Empresa</TableCell>
                    <TableCell isHeader className="text-right">Acción</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedPendingStudents.map((student) => (
                    <TableRow key={student.enrollmentId}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-text-emphasis">{student.studentName}</p>
                          <p className="text-sm text-text-secondary">{student.studentCi}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-text-secondary">{student.careerName}</TableCell>
                      <TableCell className="text-text-secondary">{student.institutionName}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => openGradeModal(student)}
                        >
                          Calificar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {pendingTotalPages > 1 && (
            <Pagination
              currentPage={pendingPage}
              totalPages={pendingTotalPages}
              totalItems={pendingStudents.length}
              itemsPerPage={pendingItemsPerPage}
              onPageChange={handlePendingPageChange}
              onItemsPerPageChange={handlePendingItemsPerPageChange}
              itemsPerPageOptions={[5, 10, 25]}
            />
          )}
        </ComponentCard>

        {gradedStudents.length > 0 && (
          <ComponentCard title="Ya Calificados">
            <div className="max-w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell isHeader>Estudiante</TableCell>
                    <TableCell isHeader>Carrera</TableCell>
                    <TableCell isHeader>Empresa</TableCell>
                    <TableCell isHeader>Nota</TableCell>
                    <TableCell isHeader className="text-right">Acción</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedGradedStudents.map((student) => (
                    <TableRow key={student.enrollmentId}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-text-emphasis">{student.studentName}</p>
                          <p className="text-sm text-text-secondary">{student.studentCi}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-text-secondary">{student.careerName}</TableCell>
                      <TableCell className="text-text-secondary">{student.institutionName}</TableCell>
                      <TableCell>
                        <Badge color={student.grade >= 10 ? "success" : "error"}>
                          {student.grade.toFixed(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEvaluationModification(student.enrollmentId)}
                        >
                          Modificar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {gradedTotalPages > 1 && (
              <Pagination
                currentPage={gradedPage}
                totalPages={gradedTotalPages}
                totalItems={gradedStudents.length}
                itemsPerPage={gradedItemsPerPage}
                onPageChange={handleGradedPageChange}
                onItemsPerPageChange={handleGradedItemsPerPageChange}
                itemsPerPageOptions={[5, 10, 25]}
              />
            )}
          </ComponentCard>
        )}

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
                  <InputField
                    type="number"
                    min="0"
                    max="20"
                    step="0.1"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
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
            <Button variant="primary" onClick={handleSaveGrade} disabled={saving} loading={saving} loadingText="Guardando...">
              Guardar Nota
            </Button>
          </ModalFooter>
        </Modal>
      </div>
    </>
  );
}