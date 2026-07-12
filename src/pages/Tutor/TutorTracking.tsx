import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { useTabs } from "../../context/tab";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import tutorService, { TutorStudent } from "../../features/tutor/services/tutorService";
import Badge from "../../components/ui/badge/Badge";
import { Search, Eye, Calendar, FileText, X } from "lucide-react";
import { matchSearch } from "../../utils/searchNormalizer";
import { Table, TableHeader, TableBody, TableRow, TableCell, Pagination } from "../../components/ui/table";
import { EmptyState } from "../../components/ui/table/EmptyState";
import { AsyncActionButton } from "../../components/common/AsyncActionButton";
import { Modal, ModalHeader, ModalBody } from "../../components/ui/modal";
import InputField from "../../components/form/input/InputField";
import Button from "../../components/ui/button/Button";

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

interface ActionButtonsProps {
  student: TutorStudent;
  onView: () => void;
  onOpenVisits: () => void;
  onOpenActivities: () => void;
  onOpenEvaluation?: () => void;
  isAcademicTutor: boolean;
}

const ActionButtons = ({ student, onView, onOpenVisits, onOpenActivities, onOpenEvaluation, isAcademicTutor }: ActionButtonsProps) => (
  <div className="flex items-center gap-2">
    <AsyncActionButton
      onClick={async () => onView()}
      icon={<Eye className="w-4 h-4" />}
      tooltip="Ver detalles"
      variant="primary"
    />
    <AsyncActionButton
      onClick={async () => onOpenVisits()}
      icon={<Calendar className="w-4 h-4" />}
      tooltip="Registro de Visitas"
      variant="info"
    />
    <AsyncActionButton
      onClick={async () => onOpenActivities()}
      icon={<FileText className="w-4 h-4" />}
      tooltip="Registro de Actividades"
      variant="warning"
    />
    {isAcademicTutor && onOpenEvaluation && (
      <AsyncActionButton
        onClick={async () => onOpenEvaluation()}
        icon={<FileText className="w-4 h-4 text-green-500" />}
        tooltip="Cargar Evaluación"
        variant="success"
      />
    )}
  </div>
);

export default function TutorTracking() {
  const navigate = useNavigate();
  const { openTab } = useTabs();
  const [students, setStudents] = useState<TutorStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [selectedStudent, setSelectedStudent] = useState<TutorStudent | null>(null);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const data = await tutorService.getStudents({ status: "active" });
      setStudents(data);
    } catch (err) {
      console.error("[TutorTracking] Error:", err);
      setError("Error al cargar estudiantes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const filteredStudents = useMemo(() => {
    let filtered = [...students];

    if (searchTerm) {
      filtered = filtered.filter(s =>
        matchSearch(s.studentName, searchTerm) ||
        matchSearch(s.studentCi, searchTerm) ||
        matchSearch(s.institutionName, searchTerm)
      );
    }

    return filtered;
  }, [students, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const pagedStudents = filteredStudents.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (items: number) => {
    setItemsPerPage(items);
    setCurrentPage(1);
  };

  const openStudentDetails = (student: TutorStudent) => {
    setSelectedStudent(student);
  };

  const openVisits = (enrollmentId: string) => {
    openTab(`/tutor/visits/${enrollmentId}`, `Visita #${enrollmentId}`);
  };

  const openActivities = (enrollmentId: string) => {
    openTab(`/tutor/activity-logs/${enrollmentId}`, `Actividades #${enrollmentId}`);
  };

  const openEvaluation = (enrollmentId: string) => {
    openTab(`/tutor/evaluations/${enrollmentId}`, `Evaluación #${enrollmentId}`);
  };

  const status = loading ? "loading" : "success";

  return (
    <>
      <PageMeta
        title="Seguimiento | SIGP - UNEFA"
        description="Registro de seguimiento de estudiantes"
      />
      <PageBreadcrumb pageTitle="Seguimiento" />

      <div className="space-y-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-text-emphasis dark:text-text-emphasis">
            Seguimiento de Estudiantes
          </h1>
          <p className="text-text-secondary dark:text-text-tertiary mt-1">
            Registre visitas y actividades de seguimiento para sus estudiantes activos
          </p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <ComponentCard title="Buscar Estudiante">
          <InputField
            placeholder="Buscar por nombre, cédula o empresa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </ComponentCard>

        <ComponentCard 
          title={`Estudiantes Activos (${filteredStudents.length})`}
          className="overflow-hidden"
        >
          {status === "loading" ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse flex gap-4 p-4 border-b border-border-light dark:border-border-dark">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
                </div>
              ))}
            </div>
          ) : filteredStudents.length === 0 ? (
            <EmptyState
              title={searchTerm ? "No se encontraron estudiantes" : "No hay estudiantes activos"}
              description={searchTerm ? "Intente ajustar la búsqueda para encontrar lo que busca." : "No tiene estudiantes activos asignados en este momento."}
            />
          ) : (
            <div className="max-w-full overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell isHeader>Estudiante</TableCell>
                    <TableCell isHeader>Carrera</TableCell>
                    <TableCell isHeader>Empresa</TableCell>
                    <TableCell isHeader>Estado</TableCell>
                    <TableCell isHeader>Horas</TableCell>
                    <TableCell isHeader className="text-right">Acciones</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedStudents.map((student) => (
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
                        {student.totalHours || 0}h
                      </TableCell>
                      <TableCell className="text-right">
                        <ActionButtons
                          student={student}
                          onView={() => openStudentDetails(student)}
                          onOpenVisits={() => openVisits(student.enrollmentId)}
                          onOpenActivities={() => openActivities(student.enrollmentId)}
                          onOpenEvaluation={student.tutorType === 'ACADEMICO' ? () => openEvaluation(student.enrollmentId) : undefined}
                          isAcademicTutor={student.tutorType === 'ACADEMICO'}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredStudents.length}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
              itemsPerPageOptions={[5, 10, 25]}
            />
          )}
        </ComponentCard>
      </div>

      {selectedStudent && (
        <Modal isOpen={true} onClose={() => setSelectedStudent(null)}>
          <ModalHeader>
            <h2 className="text-lg font-semibold text-text-emphasis">
              Detalles del Estudiante
            </h2>
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-text-secondary">Nombre</p>
                  <p className="font-medium">{selectedStudent.studentName}</p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Cédula</p>
                  <p className="font-medium">{selectedStudent.studentCi}</p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Email</p>
                  <p className="font-medium">{selectedStudent.studentEmail}</p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Teléfono</p>
                  <p className="font-medium">{selectedStudent.studentPhone}</p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Carrera</p>
                  <p className="font-medium">{selectedStudent.careerName}</p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Empresa</p>
                  <p className="font-medium">{selectedStudent.institutionName}</p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Período</p>
                  <p className="font-medium">{selectedStudent.period}</p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Tipo de Práctica</p>
                  <p className="font-medium">{selectedStudent.practiceType}</p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Fecha de Inicio</p>
                  <p className="font-medium">{selectedStudent.startDate || "No definida"}</p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Fecha de Fin</p>
                  <p className="font-medium">{selectedStudent.endDate || "No definida"}</p>
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Estado</p>
                  <Badge color={statusColors[selectedStudent.status]}>
                    {statusLabels[selectedStudent.status]}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-text-secondary">Horas Acumuladas</p>
                  <p className="font-medium text-lg">{selectedStudent.totalHours || 0}h</p>
                </div>
              </div>
            </div>
          </ModalBody>
          <div className="px-6 py-4 border-t border-border-light dark:border-border-dark flex gap-3 justify-end">
            <Button
              onClick={() => {
                openVisits(selectedStudent.enrollmentId);
                setSelectedStudent(null);
              }}
              className="flex items-center gap-2"
            >
              <Calendar className="w-4 h-4" />
              Registro de Visitas
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                openActivities(selectedStudent.enrollmentId);
                setSelectedStudent(null);
              }}
              className="flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Registro de Actividades
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
