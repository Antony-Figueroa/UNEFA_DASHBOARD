import { useState } from "react";
import ComponentCard from "../../components/common/ComponentCard";
import Badge from "../../components/ui/badge/Badge";
import { Table, TableHeader, TableBody, TableRow, TableCell } from "../../components/ui/table";
import { EmptyState } from "../../components/ui/table/EmptyState";
import { TableSkeleton } from "../../components/ui/skeleton";
import { Tabs } from "../../components/ui/tabs/Tabs";
import { useStudentTracking } from "../../features/student/hooks/useStudentTracking";
import { CheckCircle, Clock, AlertCircle, RefreshCw, Building, User, Calendar, FileText } from "lucide-react";

const TAB_OPTIONS = [
  { id: "tracking", label: "Seguimiento" },
  { id: "visits", label: "Visitas" },
  { id: "activity-log", label: "Bitácora" },
];

export default function StudentTracking() {
  const { data, loading, error, refetch } = useStudentTracking();
  const [activeTab, setActiveTab] = useState("tracking");

  if (loading) {
    return <TableSkeleton rows={6} />;
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <div>
            <p className="font-medium text-red-700 dark:text-red-400">{error}</p>
            <button
              onClick={refetch}
              className="mt-2 inline-flex items-center gap-1.5 text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }

  const internship = data?.internship;
  const activityLogs = data?.activityLogs;
  const percentage = internship && internship.requiredHours > 0
    ? Math.min(100, Math.round((internship.completedHours / internship.requiredHours) * 100))
    : 0;

  return (
    <div className="space-y-6">
      {!internship ? (
        <ComponentCard title="Sin práctica activa">
          <EmptyState
            icon={<FileText className="w-8 h-8 text-text-tertiary" />}
            title="No tenés una práctica profesional activa"
            description="Cuando te inscribas en una práctica profesional, acá vas a poder ver su seguimiento completo."
          />
        </ComponentCard>
      ) : (
        <>
          {/* Progress Card */}
          <ComponentCard title="Progreso de Horas">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-text-secondary">
                  Horas completadas
                </span>
                <span className="text-2xl font-bold text-brand-600 dark:text-brand-400">
                  {internship.completedHours.toFixed(1)} / {internship.requiredHours}h
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-400 transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-text-tertiary">
                <span>{percentage}% completado</span>
                <span>
                  {internship.completedHours >= internship.requiredHours
                    ? "¡Horas cumplidas!"
                    : `${(internship.requiredHours - internship.completedHours).toFixed(1)}h restantes`}
                </span>
              </div>
            </div>
          </ComponentCard>

          {/* Internship Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <InfoCard
              icon={<Building className="w-5 h-5 text-blue-500" />}
              bg="bg-blue-50 dark:bg-blue-900/20"
              label="Institución"
              value={internship.institutionName || "-"}
            />
            <InfoCard
              icon={<User className="w-5 h-5 text-purple-500" />}
              bg="bg-purple-50 dark:bg-purple-900/20"
              label="Tutor Académico"
              value={internship.tutorName || "Sin asignar"}
            />
            <InfoCard
              icon={<Calendar className="w-5 h-5 text-green-500" />}
              bg="bg-green-50 dark:bg-green-900/20"
              label="Período"
              value={internship.period || "-"}
            />
            <InfoCard
              icon={<Clock className="w-5 h-5 text-orange-500" />}
              bg="bg-orange-50 dark:bg-orange-900/20"
              label="Estado"
              value={internship.status === "active" ? "Activa" : "Completada"}
            />
          </div>

          {/* Tutor contact */}
          {internship.tutorName && (
            <ComponentCard title="Contacto del Tutor">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <span className="text-xs text-text-tertiary block">Nombre</span>
                  <span className="font-medium">{internship.tutorName}</span>
                </div>
                <div>
                  <span className="text-xs text-text-tertiary block">Teléfono</span>
                  <span className="font-medium">{internship.tutorPhone || "-"}</span>
                </div>
                <div>
                  <span className="text-xs text-text-tertiary block">Email</span>
                  <span className="font-medium">{internship.tutorEmail || "-"}</span>
                </div>
              </div>
            </ComponentCard>
          )}

          {/* Tabs */}
          <ComponentCard title="Detalle de Seguimiento">
            <Tabs
              options={TAB_OPTIONS}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              variant="pills"
              className="mb-6"
            />

            {activeTab === "tracking" && (
              <div role="tabpanel" id="panel-tracking">
                {data?.tracking && data.tracking.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableCell isHeader>Reporte</TableCell>
                          <TableCell isHeader>Traslado</TableCell>
                          <TableCell isHeader>Ruta</TableCell>
                          <TableCell isHeader>Observaciones</TableCell>
                          <TableCell isHeader>Fecha</TableCell>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.tracking.map((record) => (
                          <TableRow key={record.trackingId}>
                            <TableCell className="font-medium">{record.reportTitle}</TableCell>
                            <TableCell>
                              <Badge color={record.transfer ? "success" : "light"} variant="light">
                                {record.transfer ? "Sí" : "No"}
                              </Badge>
                            </TableCell>
                            <TableCell>{record.route || "-"}</TableCell>
                            <TableCell className="max-w-xs truncate">{record.observations || "-"}</TableCell>
                            <TableCell>{record.creationDate ? new Date(record.creationDate).toLocaleDateString("es-ES") : "-"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <EmptyState
                    icon={<FileText className="w-8 h-8 text-text-tertiary" />}
                    title="Sin registros de seguimiento"
                    description="No hay reportes de seguimiento registrados para esta práctica."
                  />
                )}
              </div>
            )}

            {activeTab === "visits" && (
              <div role="tabpanel" id="panel-visits">
                {data?.visits && data.visits.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableCell isHeader>Fecha</TableCell>
                          <TableCell isHeader>Tipo</TableCell>
                          <TableCell isHeader>Observaciones</TableCell>
                          <TableCell isHeader>Supervisor</TableCell>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.visits.map((visit) => (
                          <TableRow key={visit.visitId}>
                            <TableCell>{new Date(visit.visitDate).toLocaleDateString("es-ES")}</TableCell>
                            <TableCell>{visit.visitType || "-"}</TableCell>
                            <TableCell className="max-w-xs truncate">{visit.observations || "-"}</TableCell>
                            <TableCell>{visit.supervisorName || "-"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <EmptyState
                    icon={<Calendar className="w-8 h-8 text-text-tertiary" />}
                    title="Sin visitas registradas"
                    description="No hay visitas de supervisión registradas para esta práctica."
                  />
                )}
              </div>
            )}

            {activeTab === "activity-log" && (
              <div role="tabpanel" id="panel-activity-log">
                {activityLogs && activityLogs.recentLogs.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableCell isHeader>Fecha</TableCell>
                          <TableCell isHeader>Horas</TableCell>
                          <TableCell isHeader>Descripción</TableCell>
                          <TableCell isHeader>Tipo</TableCell>
                          <TableCell isHeader>Estado</TableCell>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {activityLogs.recentLogs.map((log) => (
                          <TableRow key={log.id}>
                            <TableCell>{new Date(log.date).toLocaleDateString("es-ES")}</TableCell>
                            <TableCell className="font-medium">{log.hours.toFixed(1)}h</TableCell>
                            <TableCell className="max-w-xs truncate">{log.description}</TableCell>
                            <TableCell>{log.type || "-"}</TableCell>
                            <TableCell>
                              <Badge color={log.approved ? "success" : "warning"} variant="light">
                                {log.approved ? "Aprobado" : "Pendiente"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <EmptyState
                    icon={<Clock className="w-8 h-8 text-text-tertiary" />}
                    title="Sin registros de bitácora"
                    description="No hay actividades registradas en la bitácora para esta práctica."
                  />
                )}
              </div>
            )}
          </ComponentCard>

          {/* Activity summary mini cards */}
          {activityLogs && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <SummaryCard
                label="Horas Totales"
                value={`${activityLogs.totalHours.toFixed(1)}h`}
                color="text-brand-600"
              />
              <SummaryCard
                label="Registros"
                value={String(activityLogs.totalLogs)}
                color="text-blue-600"
              />
              <SummaryCard
                label="Aprobados"
                value={String(activityLogs.approvedLogs)}
                color="text-green-600"
              />
              <SummaryCard
                label="Pendientes"
                value={String(activityLogs.pendingLogs)}
                color="text-orange-600"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

const InfoCard = ({
  icon,
  bg,
  label,
  value,
}: {
  icon: React.ReactNode;
  bg: string;
  label: string;
  value: string;
}) => (
  <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-border-light dark:border-border-dark">
    <div className="flex items-center gap-3">
      <div className={`p-2 ${bg} rounded-lg shrink-0`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-text-secondary">{label}</p>
        <p className="font-medium truncate">{value}</p>
      </div>
    </div>
  </div>
);

const SummaryCard = ({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) => (
  <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-border-light dark:border-border-dark text-center">
    <p className={`text-2xl font-bold ${color}`}>{value}</p>
    <p className="text-xs text-text-secondary mt-1">{label}</p>
  </div>
);
