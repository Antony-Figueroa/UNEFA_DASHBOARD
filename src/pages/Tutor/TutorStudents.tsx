import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useTabs } from "../../context/tab";
import { useAuth } from "../../context/auth";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import tutorService, { TutorStudent } from "../../features/tutor/services/tutorService";
import Badge from "../../components/ui/badge/Badge";
import { Eye, Calendar, FileText, ClipboardCheck } from "lucide-react";
import { Search } from "lucide-react";
import { matchSearch } from "../../utils/searchNormalizer";
import StudentViewModal from "../../features/students/components/StudentViewModal";
import { StudentRowData } from "../../features/students/types";
import { getStudentByCi } from "../../features/students/services/studentsService";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Modal, ModalHeader, ModalBody } from "../../components/ui/modal";
import { EmptyState } from "../../components/ui/table/EmptyState";
import InputField from "../../components/form/input/InputField";
import CustomSelect from "../../components/form/CustomSelect";
import { AsyncActionButton } from "../../components/common/AsyncActionButton";

const statusColors: Record<string, "success" | "warning" | "info" | "error" | "light"> = {
  "active": "success",
  "completed": "info",
  "pre-enrolled": "warning",
  "suspended": "error",
  "unknown": "light"
};

const statusLabels: Record<string, string> = {
  "active": "Activo",
  "completed": "Completado",
  "pre-enrolled": "Pre-inscrito",
  "suspended": "Suspendido",
  "unknown": "Desconocido"
};

const STATUS_OPTIONS = [
  { value: "all", label: "Todos los estados" },
  { value: "active", label: "Activo" },
  { value: "completed", label: "Completado" },
  { value: "pre-enrolled", label: "Pre-inscrito" },
  { value: "suspended", label: "Suspendido" },
];

export default function TutorStudents() {
  const navigate = useNavigate();
  const { openTab } = useTabs();
  const { user } = useAuth();
  const [students, setStudents] = useState<TutorStudent[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<TutorStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedStudent, setSelectedStudent] = useState<TutorStudent | null>(null);
  const [selectedStudentData, setSelectedStudentData] = useState<StudentRowData | null>(null);
  const [loadingStudent, setLoadingStudent] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [students, searchTerm, statusFilter]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const data = await tutorService.getStudents();
      setStudents(data);
    } catch (err) {
      console.error("[TutorStudents] Error:", err);
      setError("Error al cargar estudiantes");
    } finally {
      setLoading(false);
    }
  };

  const handleViewStudent = async (tutorStudent: TutorStudent) => {
    setSelectedStudent(tutorStudent);
    setLoadingStudent(true);
    try {
      const result = await getStudentByCi(tutorStudent.studentCi);
      if (result.student) {
        const s = result.student;
        setSelectedStudentData({
          ...s,
          enrollmentDate: s.enrollmentDate instanceof Date
            ? s.enrollmentDate.toISOString().split('T')[0]
            : String(s.enrollmentDate),
          fullNames: `${s.firstName} ${s.middleName || ''} ${s.lastName} ${s.secondLastName || ''}`.trim(),
        });
      } else {
        setSelectedStudentData(null);
      }
    } catch {
      setSelectedStudentData(null);
    } finally {
      setLoadingStudent(false);
    }
  };

  const filterStudents = () => {
    let filtered = [...students];

    if (statusFilter !== "all") {
      filtered = filtered.filter(s => s.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(s =>
        matchSearch(s.studentName, searchTerm) ||
        matchSearch(s.studentCi, searchTerm) ||
        matchSearch(s.institutionName, searchTerm)
      );
    }

    setFilteredStudents(filtered);
  };

  return (
    <>
      <PageMeta
        title="Mis Estudiantes | SIGP - UNEFA"
        description="Lista de estudiantes asignados al tutor"
      />

      <div className="space-y-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-text-emphasis dark:text-text-emphasis">
            Mis Estudiantes
          </h1>
          <p className="text-text-secondary dark:text-text-tertiary mt-1">
            Estudiantes asignados bajo su tutoría académica
          </p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <ComponentCard title="Filtros">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <InputField
                placeholder="Buscar por nombre, cédula o empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                leftIcon={<Search className="w-4 h-4" />}
              />
            </div>
            <div className="w-full sm:w-48">
              <CustomSelect
                options={STATUS_OPTIONS}
                value={statusFilter}
                onChange={(val) => setStatusFilter(val)}
                placeholder="Filtrar por estado"
              />
            </div>
          </div>
        </ComponentCard>

        <ComponentCard
          title={`Estudiantes (${filteredStudents.length})`}
          className="overflow-hidden"
        >
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse flex gap-4 p-4 border-b border-border-light dark:border-border-dark">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                </div>
              ))}
            </div>
          ) : filteredStudents.length === 0 ? (
            <EmptyState
              title={searchTerm || statusFilter !== "all" ? "No se encontraron estudiantes" : "No tienes estudiantes asignados"}
              description={searchTerm || statusFilter !== "all" ? "Intenta ajustar los filtros para encontrar lo que buscas." : "Aún no tienes estudiantes asignados para este período."}
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell isHeader>Estudiante</TableCell>
                    <TableCell isHeader>Carrera</TableCell>
                    <TableCell isHeader>Empresa</TableCell>
                    <TableCell isHeader>Estado</TableCell>
                    <TableCell isHeader>Nota</TableCell>
                    <TableCell isHeader className="text-right">Acciones</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.enrollmentId}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-text-emphasis">{student.studentName}</p>
                          <p className="text-sm text-text-secondary">{student.studentCi}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-text-secondary">
                        {student.careerName}
                      </TableCell>
                      <TableCell className="text-text-secondary">
                        {student.institutionName}
                      </TableCell>
                      <TableCell>
                        <Badge color={statusColors[student.status]}>
                          {statusLabels[student.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {student.grade > 0 ? student.grade.toFixed(1) : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <AsyncActionButton
                            onClick={async () => handleViewStudent(student)}
                            icon={<Eye className="w-4 h-4" />}
                            tooltip="Ver detalles"
                            variant="primary"
                          />
                          {student.status === 'active' && (
                            <>
                              <AsyncActionButton
                                onClick={async () => openTab(`/visit-registration/${student.enrollmentId}`, `Visita #${student.enrollmentId}`)}
                                icon={<Calendar className="w-4 h-4" />}
                                tooltip="Registro de Visitas"
                                variant="info"
                              />
                              <AsyncActionButton
                                onClick={async () => openTab(`/activity-logs/${student.enrollmentId}`, `Actividades #${student.enrollmentId}`)}
                                icon={<FileText className="w-4 h-4" />}
                                tooltip="Registro de Actividades"
                                variant="warning"
                              />
                              {student.tutorType === 'ACADEMICO' ? (
                                <AsyncActionButton
                                  onClick={async () => openTab(`/tutor/evaluations/${student.enrollmentId}`, `Evaluación #${student.enrollmentId}`)}
                                  icon={<ClipboardCheck className="w-4 h-4" />}
                                  tooltip="Cargar Evaluación"
                                  variant="success"
                                />
                              ) : (
                                <span
                                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-gray-300 dark:text-gray-600 cursor-not-allowed"
                                  title="Solo el tutor académico puede evaluar"
                                >
                                  <ClipboardCheck className="w-4 h-4" />
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </ComponentCard>
      </div>

      {selectedStudent && (
        selectedStudentData ? (
          <StudentViewModal
            isOpen={true}
            onClose={() => { setSelectedStudent(null); setSelectedStudentData(null); }}
            student={selectedStudentData}
            onEdit={user?.role === 1 ? () => setSelectedStudent(null) : undefined}
          />
        ) : (
          <Modal isOpen={true} onClose={() => { setSelectedStudent(null); setSelectedStudentData(null); }}>
            <ModalHeader>
              <h2 className="text-lg font-semibold text-text-emphasis">
                Detalles del Estudiante
              </h2>
            </ModalHeader>
            <ModalBody>
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
                <span className="ml-3 text-text-secondary">Cargando datos del estudiante...</span>
              </div>
            </ModalBody>
          </Modal>
        )
      )}
    </>
  );
}
