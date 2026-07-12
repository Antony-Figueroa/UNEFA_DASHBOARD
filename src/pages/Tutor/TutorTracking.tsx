import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { useTabs } from "../../context/tab";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import tutorService, { TutorStudent } from "../../features/tutor/services/tutorService";
import Badge from "../../components/ui/badge/Badge";
import { Search, Eye, Calendar, FileText } from "lucide-react";
import { matchSearch } from "../../utils/searchNormalizer";
import { Table, TableHeader, TableBody, TableRow, TableCell, Pagination } from "../../components/ui/table";
import { EmptyState } from "../../components/ui/table/EmptyState";
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

const EyeIcon = ({ className = "w-4 h-4", ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const CalendarIcon = ({ className = "w-4 h-4", ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const FileTextIcon = ({ className = "w-4 h-4", ...props }: React.SVGProps<SVGSVGElement>) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

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
      icon={<EyeIcon />}
      tooltip="Ver detalles"
      variant="primary"
    />
    <AsyncActionButton
      onClick={async () => onOpenVisits()}
      icon={<CalendarIcon />}
      tooltip="Registro de Visitas"
      variant="info"
    />
    <AsyncActionButton
      onClick={async () => onOpenActivities()}
      icon={<FileTextIcon />}
      tooltip="Registro de Actividades"
      variant="warning"
    />
    {isAcademicTutor && onOpenEvaluation && (
      <AsyncActionButton
        onClick={async () => onOpenEvaluation()}
        icon={<FileTextIcon className="w-4 h-4 text-green-500" />}
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
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, cédula o empresa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border-light dark:border-border-dark rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-brand-500"
            />
          </div>
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
            <div className="max-w-full overflow-x-auto table-scrollbar">
              <Table className="table-root">
                <TableHeader className="table-header-row">
                  <TableRow>
                    <TableCell isHeader className="table-header-cell">Estudiante</TableCell>
                    <TableCell isHeader className="table-header-cell">Carrera</TableCell>
                    <TableCell isHeader className="table-header-cell">Empresa</TableCell>
                    <TableCell isHeader className="table-header-cell">Estado</TableCell>
                    <TableCell isHeader className="table-header-cell">Horas</TableCell>
                    <TableCell isHeader className="table-header-cell text-right">Acciones</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-border-light dark:divide-border-dark">
                  {pagedStudents.map((student) => (
                    <TableRow
                      key={student.enrollmentId}
                      className={`table-row-hover ${selectedStudent?.enrollmentId === student.enrollmentId ? "bg-brand-50/30 dark:bg-brand-500/5" : ""}`}
                    >
                      <TableCell className="table-cell">
                        <div>
                          <p className="font-medium text-text-emphasis">{student.studentName}</p>
                          <p className="text-sm text-text-secondary">{student.studentCi}</p>
                        </div>
                      </TableCell>
                      <TableCell className="table-cell text-text-secondary">
                        {student.careerName}
                      </TableCell>
                      <TableCell className="table-cell text-text-secondary">
                        {student.institutionName}
                      </TableCell>
                      <TableCell className="table-cell">
                        <Badge color={statusColors[student.status]}>
                          {statusLabels[student.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="table-cell font-medium">
                        {student.totalHours || 0}h
                      </TableCell>
                      <TableCell className="table-cell text-right relative">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-auto bg-white dark:bg-gray-900 rounded-xl shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-border-light dark:border-border-dark">
              <h2 className="text-lg font-semibold text-text-emphasis dark:text-text-emphasis">
                Detalles del Estudiante
              </h2>
              <button
                onClick={() => setSelectedStudent(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 space-y-4">
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
              
              <div className="pt-4 border-t border-border-light dark:border-border-dark flex gap-3 justify-end">
                <button
                  onClick={() => {
                    openVisits(selectedStudent.enrollmentId);
                    setSelectedStudent(null);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
                >
                  <CalendarIcon className="w-4 h-4" />
                  Registro de Visitas
                </button>
                <button
                  onClick={() => {
                    openActivities(selectedStudent.enrollmentId);
                    setSelectedStudent(null);
                  }}
                  className="flex items-center gap-2 px-4 py-2 border border-border-medium text-text-primary dark:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <FileTextIcon className="w-4 h-4" />
                  Registro de Actividades
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}