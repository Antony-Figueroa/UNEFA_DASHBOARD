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
import { culminationService, CulminationRecord, CulminationMeta } from "../../features/culmination/services/culminationService";
import toast from "react-hot-toast";

const STATUS_CONFIG = {
  pending: { label: "Pendiente", color: "warning" as const },
  approved: { label: "Aprobado", color: "success" as const },
  certified: { label: "Certificado", color: "primary" as const },
};

export default function CulminationPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<CulminationRecord[]>([]);
  const [meta, setMeta] = useState<CulminationMeta>({ total: 0, pending: 0, approved: 0, certified: 0 });
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

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await culminationService.getRecords({
        status: statusFilter || undefined,
        period: periodFilter || undefined,
        search: searchTerm || undefined
      });
      
      if (response.success) {
        setData(response.data);
        setMeta(response.meta);
      }
    } catch (error) {
      console.error('Error fetching culmination data:', error);
      toast.error('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter, periodFilter]);

  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    return data.filter((item) =>
      item.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.studentCi.includes(searchTerm) ||
      item.institutionName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data, searchTerm]);

  const periodOptions = useMemo(() => {
    const periods = [...new Set(data.map((d) => d.period))];
    return [
      { value: "", label: "Todos los períodos" },
      ...periods.map((p) => ({ value: p, label: p })),
    ];
  }, [data]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setPeriodFilter("");
    setCurrentPage(1);
    fetchData();
  };

  const handleApprove = (item: CulminationRecord) => {
    setConfirmDialog({
      isOpen: true,
      title: "Aprobar Culminación",
      message: `¿Está seguro de aprobar la culminación de prácticas de ${item.studentName}?`,
      onConfirm: async () => {
        try {
          await culminationService.approve(item.id);
          toast.success('Culminación aprobada exitosamente');
          fetchData();
        } catch (error) {
          toast.error('Error al aprobar culminación');
        } finally {
          setConfirmDialog(null);
        }
      },
    });
  };

  const handleGenerateCertificate = (item: CulminationRecord) => {
    setConfirmDialog({
      isOpen: true,
      title: "Generar Certificado",
      message: `¿Desea generar el certificado de prácticas para ${item.studentName}?`,
      onConfirm: async () => {
        try {
          const response = await culminationService.generateCertificate(item.id);
          if (response.success) {
            toast.success(`Certificado generado: ${response.certificate.number}`);
            fetchData();
          }
        } catch (error) {
          toast.error('Error al generar certificado');
        } finally {
          setConfirmDialog(null);
        }
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
          <Button variant="outline" onClick={fetchData}>
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Actualizar
          </Button>
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
                  {meta.pending}
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
                  {meta.approved}
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
                  {meta.certified}
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
                                <Button size="sm" variant="outline" onClick={() => handleApprove(item)}>
                                  Aprobar
                                </Button>
                              )}
                              {item.status === "approved" && (
                                <Button size="sm" onClick={() => handleGenerateCertificate(item)}>
                                  Certificar
                                </Button>
                              )}
                              {item.status === "certified" && (
                                <Button size="sm" variant="outline" startIcon={<DownloadIcon className="w-4 h-4" />}>
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
                    <div key={item.id} className="bg-bg-surface dark:bg-bg-dark-surface rounded-lg border border-border-default dark:border-border-dark p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-medium text-text-primary dark:text-text-emphasis">{item.studentName}</p>
                          <p className="text-xs text-text-tertiary">{item.studentCi}</p>
                        </div>
                        <Badge color={statusConfig.color} variant="light" shape="rounded">{statusConfig.label}</Badge>
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
                          <Button size="sm" variant="outline" onClick={() => handleApprove(item)}>Aprobar</Button>
                        )}
                        {item.status === "approved" && (
                          <Button size="sm" onClick={() => handleGenerateCertificate(item)}>Generar Certificado</Button>
                        )}
                        {item.status === "certified" && (
                          <Button size="sm" variant="outline" startIcon={<DownloadIcon className="w-4 h-4" />}>Descargar PDF</Button>
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
