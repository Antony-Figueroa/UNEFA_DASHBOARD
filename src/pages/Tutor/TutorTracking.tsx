import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useTabs } from "../../context/tab";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import tutorService, { TutorStudent } from "../../features/tutor/services/tutorService";
import Badge from "../../components/ui/badge/Badge";
import Button from "../../components/ui/button/Button";
import { Search, Eye, Calendar, FileText } from "lucide-react";
import { matchSearch } from "../../utils/searchNormalizer";
import { Modal, ModalHeader, ModalBody } from "../../components/ui/modal";

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

export default function TutorTracking() {
  const navigate = useNavigate();
  const { openTab } = useTabs();
  const [students, setStudents] = useState<TutorStudent[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<TutorStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<TutorStudent | null>(null);

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [students, searchTerm]);

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

  const filterStudents = () => {
    let filtered = [...students];

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
            <div className="text-center py-12 text-text-secondary dark:text-text-tertiary">
              No se encontraron estudiantes activos
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Estudiante
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Carrera
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Empresa
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Horas
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-light dark:divide-border-dark">
                  {filteredStudents.map((student) => (
                    <tr key={student.enrollmentId} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-4">
                        <div>
                          <p className="font-medium text-text-emphasis">{student.studentName}</p>
                          <p className="text-sm text-text-secondary">{student.studentCi}</p>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-text-secondary">
                        {student.careerName}
                      </td>
                      <td className="px-4 py-4 text-text-secondary">
                        {student.institutionName}
                      </td>
                      <td className="px-4 py-4">
                        <Badge color={statusColors[student.status]}>
                          {statusLabels[student.status]}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 font-medium">
                        {student.totalHours || 0}h
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedStudent(student)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            title="Ver detalles"
                          >
                            <Eye className="w-4 h-4 text-text-secondary" />
                          </button>
                          <button
                            onClick={() => openTab(`/tutor/visits/${student.enrollmentId}`, `Visita #${student.enrollmentId}`)}
                            className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="Registro de Visitas"
                          >
                            <Calendar className="w-4 h-4 text-blue-500" />
                          </button>
                          <button
                            onClick={() => openTab(`/tutor/activity-logs/${student.enrollmentId}`, `Actividades #${student.enrollmentId}`)}
                            className="p-2 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
                            title="Registro de Actividades"
                          >
                            <FileText className="w-4 h-4 text-orange-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ComponentCard>
      </div>

      <Modal isOpen={!!selectedStudent} onClose={() => setSelectedStudent(null)} size="lg">
        <ModalHeader>
          Detalles del Estudiante
        </ModalHeader>
        <ModalBody>
          {selectedStudent && (
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
              
              <div className="pt-4 border-t border-border-light dark:border-border-dark flex gap-3">
                <Button
                  variant="primary"
                  onClick={() => {
                    openTab(`/visit-registration/${selectedStudent.enrollmentId}`, `Visita #${selectedStudent.enrollmentId}`);
                    setSelectedStudent(null);
                  }}
                  startIcon={<Calendar className="w-4 h-4" />}
                >
                  Registro de Visitas
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    openTab(`/activity-logs/${selectedStudent.enrollmentId}`, `Actividades #${selectedStudent.enrollmentId}`);
                    setSelectedStudent(null);
                  }}
                  startIcon={<FileText className="w-4 h-4" />}
                >
                  Registro de Actividades
                </Button>
              </div>
            </div>
          )}
        </ModalBody>
      </Modal>
    </>
  );
}
