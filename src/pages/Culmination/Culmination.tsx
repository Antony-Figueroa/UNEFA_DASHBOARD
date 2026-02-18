import { useState, useEffect, useMemo } from "react";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Button from "../../components/ui/button/Button";
import Badge from "../../components/ui/badge/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
  Pagination,
} from "../../components/ui/table";
import { EmptyState } from "../../components/ui/table/EmptyState";
import { TableSkeleton } from "../../components/ui/skeleton";
import InputField from "../../components/form/input/InputField";
import CustomSelect from "../../components/form/CustomSelect";
import UnifiedDialog from "../../components/ui/dialog/UnifiedDialog";
import { DownloadIcon, CheckCircleIcon } from "../../icons";

interface CulminationRecord {
  id: string;
  studentCi: string;
  studentName: string;
  careerName: string;
  institutionName: string;
  period: string;
  practiceType: string;
  startDate: string;
  endDate: string;
  totalHours: number;
  status: "pending" | "approved" | "certified";
  certificateNumber?: string;
}

const STATUS_CONFIG = {
  pending: { label: "Pendiente", color: "warning" as const },
  approved: { label: "Aprobado", color: "success" as const },
  certified: { label: "Certificado", color: "primary" as const },
};

const MOCK_DATA: CulminationRecord[] = [
  {
    id: "1",
    studentCi: "V-28123456",
    studentName: "María García López",
    careerName: "INGENIERÍA INFORMÁTICA",
    institutionName: "TecnoSoluciones C.A.",
    period: "2025-I",
    practiceType: "ORDINARIA",
    startDate: "2025-01-15",
    endDate: "2025-06-15",
    totalHours: 480,
    status: "certified",
    certificateNumber: "CERT-2025-001",
  },
  {
    id: "2",
    studentCi: "V-28789123",
    studentName: "Carlos Rodríguez Pérez",
    careerName: "INGENIERÍA AGROINDUSTRIAL",
    institutionName: "AgroVenezuela",
    period: "2025-I",
    practiceType: "ORDINARIA",
    startDate: "2025-01-20",
    endDate: "2025-06-20",
    totalHours: 480,
    status: "approved",
  },
  {
    id: "3",
    studentCi: "V-28456789",
    studentName: "Ana Martínez Silva",
    careerName: "TSU EN ENFERMERÍA",
    institutionName: "Hospital Central",
    period: "2025-II",
    practiceType: "ESPECIAL",
    startDate: "2025-06-01",
    endDate: "2025-09-30",
    totalHours: 360,
    status: "pending",
  },
];

export default function CulminationPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<CulminationRecord[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [periodFilter, setPeriodFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    const timer = setTimeout(() => {
      setData(MOCK_DATA);
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchesSearch = !searchTerm ||
        item.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.studentCi.includes(searchTerm) ||
        item.institutionName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = !statusFilter || item.status === statusFilter;
      const matchesPeriod = !periodFilter || item.period === periodFilter;
      return matchesSearch && matchesStatus && matchesPeriod;
    });
  }, [data, searchTerm, statusFilter, periodFilter]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const periodOptions = useMemo(() => {
    const periods = [...new Set(data.map((d) => d.period))];
    return [
      { value: "", label: "Todos los períodos" },
      ...periods.map((p) => ({ value: p, label: p })),
    ];
  }, [data]);

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setPeriodFilter("");
    setCurrentPage(1);
  };

  const handleApprove = (item: CulminationRecord) => {
    setConfirmDialog({
      isOpen: true,
      title: "Aprobar Culminación",
      message: `¿Está seguro de aprobar la culminación de prácticas de ${item.studentName}?`,
      onConfirm: () => {
        setData((prev) =>
          prev.map((d) => (d.id === item.id ? { ...d, status: "approved" as const } : d))
        );
        setConfirmDialog(null);
      },
    });
  };

  const handleGenerateCertificate = (item: CulminationRecord) => {
    setConfirmDialog({
      isOpen: true,
      title: "Generar Certificado",
      message: `¿Desea generar el certificado de prácticas para ${item.studentName}?`,
      onConfirm: () => {
        const certNumber = `CERT-${new Date().getFullYear()}-${String(
          Math.floor(Math.random() * 1000)
        ).padStart(3, "0")}`;
        setData((prev) =>
          prev.map((d) =>
            d.id === item.id
              ? { ...d, status: "certified" as const, certificateNumber: certNumber }
              : d
          )
        );
        setConfirmDialog(null);
      },
    });
  };

  return (
    <>
      <PageMeta title="Culminación de Prácticas" description="Gestión de culminación de prácticas profesionales" />
      <PageBreadcrumb pageTitle="Culminación de Prácticas" />

      <div className="space-y-6 animate-fadeIn">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary dark:text-text-emphasis">
              Culminación de Prácticas Profesionales
            </h1>
            <p className="mt-1 text-sm text-text-secondary dark:text-text-tertiary">
              Gestiona la culminación y certificación de prácticas profesionales
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border-default dark:border-border-dark bg-bg-surface dark:bg-bg-dark-surface p-5">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-warning-50 dark:bg-warning-500/10">
                <svg className="w-5 h-5 text-warning-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-text-primary dark:text-text-emphasis">
                  {data.filter((d) => d.status === "pending").length}
                </p>
                <p className="text-xs text-text-tertiary">Pendientes</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-border-default dark:border-border-dark bg-bg-surface dark:bg-bg-dark-surface p-5">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-success-50 dark:bg-success-500/10">
                <CheckCircleIcon className="w-5 h-5 text-success-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-text-primary dark:text-text-emphasis">
                  {data.filter((d) => d.status === "approved").length}
                </p>
                <p className="text-xs text-text-tertiary">Aprobados</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-border-default dark:border-border-dark bg-bg-surface dark:bg-bg-dark-surface p-5">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-brand-50 dark:bg-brand-500/10">
                <svg className="w-5 h-5 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-text-primary dark:text-text-emphasis">
                  {data.filter((d) => d.status === "certified").length}
                </p>
                <p className="text-xs text-text-tertiary">Certificados</p>
              </div>
            </div>
          </div>
        </div>

        <ComponentCard title="Listado de Prácticas por Culminar">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center mb-6">
            <div className="w-full sm:w-64">
              <InputField
                type="text"
                placeholder="Buscar estudiante, cédula, institución..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              />
            </div>
            <CustomSelect
              options={[
                { value: "", label: "Todos los estados" },
                { value: "pending", label: "Pendiente" },
                { value: "approved", label: "Aprobado" },
                { value: "certified", label: "Certificado" },
              ]}
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e as unknown as string); setCurrentPage(1); }}
              className="w-full sm:w-44"
            />
            <CustomSelect
              options={periodOptions}
              value={periodFilter}
              onChange={(e) => { setPeriodFilter(e as unknown as string); setCurrentPage(1); }}
              className="w-full sm:w-40"
            />
            {(searchTerm || statusFilter || periodFilter) && (
              <Button variant="ghost" onClick={clearFilters}>
                Limpiar
              </Button>
            )}
          </div>

          {loading ? (
            <TableSkeleton columns={7} rows={itemsPerPage} />
          ) : filteredData.length === 0 ? (
            <EmptyState title="No hay registros" description="No se encontraron prácticas por culminar con los filtros aplicados." />
          ) : (
            <>
              <div className="hidden md:block overflow-hidden rounded-lg border border-border-default dark:border-border-dark">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableCell isHeader>Estudiante</TableCell>
                      <TableCell isHeader>Carrera</TableCell>
                      <TableCell isHeader>Institución</TableCell>
                      <TableCell isHeader>Período</TableCell>
                      <TableCell isHeader>Horas</TableCell>
                      <TableCell isHeader>Estado</TableCell>
                      <TableCell isHeader>Acciones</TableCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.map((item) => {
                      const statusConfig = STATUS_CONFIG[item.status];
                      return (
                        <TableRow key={item.id} className="hover:bg-bg-subtle/50 dark:hover:bg-bg-dark-subtle/50">
                          <TableCell>
                            <div className="font-medium text-text-primary dark:text-text-emphasis">
                              {item.studentName}
                            </div>
                            <div className="text-xs text-text-tertiary">{item.studentCi}</div>
                          </TableCell>
                          <TableCell className="text-text-secondary dark:text-text-tertiary text-sm">
                            {item.careerName}
                          </TableCell>
                          <TableCell className="text-text-secondary dark:text-text-tertiary text-sm">
                            {item.institutionName}
                          </TableCell>
                          <TableCell className="text-text-secondary dark:text-text-tertiary text-sm">
                            {item.period}
                          </TableCell>
                          <TableCell className="text-text-secondary dark:text-text-tertiary text-sm tabular-nums">
                            {item.totalHours}h
                          </TableCell>
                          <TableCell>
                            <Badge color={statusConfig.color} variant="light" shape="rounded">
                              {statusConfig.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {item.status === "pending" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleApprove(item)}
                                >
                                  Aprobar
                                </Button>
                              )}
                              {item.status === "approved" && (
                                <Button
                                  size="sm"
                                  onClick={() => handleGenerateCertificate(item)}
                                  startIcon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                                >
                                  Certificar
                                </Button>
                              )}
                              {item.status === "certified" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  startIcon={<DownloadIcon className="w-4 h-4" />}
                                >
                                  PDF
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="md:hidden flex flex-col gap-4">
                {paginatedData.map((item) => {
                  const statusConfig = STATUS_CONFIG[item.status];
                  return (
                    <div
                      key={item.id}
                      className="bg-bg-surface dark:bg-bg-dark-surface rounded-lg border border-border-default dark:border-border-dark p-4"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-medium text-text-primary dark:text-text-emphasis">
                            {item.studentName}
                          </p>
                          <p className="text-xs text-text-tertiary">{item.studentCi}</p>
                        </div>
                        <Badge color={statusConfig.color} variant="light" shape="rounded">
                          {statusConfig.label}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-xs text-text-secondary dark:text-text-tertiary mb-3">
                        <p><span className="font-medium">Carrera:</span> {item.careerName}</p>
                        <p><span className="font-medium">Institución:</span> {item.institutionName}</p>
                        <p><span className="font-medium">Horas:</span> {item.totalHours}h</p>
                      </div>
                      {item.certificateNumber && (
                        <p className="text-xs text-brand-600 dark:text-brand-400 mb-3">
                          Certificado: {item.certificateNumber}
                        </p>
                      )}
                      <div className="pt-3 border-t border-border-default dark:border-border-dark">
                        {item.status === "pending" && (
                          <Button size="sm" variant="outline" onClick={() => handleApprove(item)}>
                            Aprobar
                          </Button>
                        )}
                        {item.status === "approved" && (
                          <Button size="sm" onClick={() => handleGenerateCertificate(item)}>
                            Generar Certificado
                          </Button>
                        )}
                        {item.status === "certified" && (
                          <Button size="sm" variant="outline" startIcon={<DownloadIcon className="w-4 h-4" />}>
                            Descargar PDF
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredData.length}
                  itemsPerPage={itemsPerPage}
                  onPageChange={setCurrentPage}
                  onItemsPerPageChange={(items) => { setItemsPerPage(items); setCurrentPage(1); }}
                  itemsPerPageOptions={[10, 25, 50]}
                />
              )}
            </>
          )}
        </ComponentCard>
      </div>

      <UnifiedDialog
        isOpen={!!confirmDialog}
        onClose={() => setConfirmDialog(null)}
        onConfirm={confirmDialog?.onConfirm || (() => {})}
        title={confirmDialog?.title || ""}
        message={confirmDialog?.message || ""}
        confirmLabel="Confirmar"
        variant="info"
      />
    </>
  );
}
